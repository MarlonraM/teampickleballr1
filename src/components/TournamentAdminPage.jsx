const express = require('express');
const router = express.Router();
const db = require('../db');
const WebSocket = require('ws');
const auth = require('../middleware/auth'); // Middleware para proteger rutas
// --- CONSULTA SQL MEJORADA Y CENTRALIZADA ---
// Esta consulta es más robusta para obtener los jugadores correctos por categoría.
const getScoreboardSql = `
    WITH PlayerDetails AS (
        SELECT
            tp.team_id,
            p.full_name,
            p.category_id,
            ROW_NUMBER() OVER(PARTITION BY tp.team_id, p.category_id ORDER BY p.id) as player_rank
        FROM team_players tp
        JOIN players p ON p.id = tp.player_id
    )
    SELECT
        m.*,
        t1.name AS team1_name,
        t2.name AS team2_name,
        c.name AS court_name,
        p1.full_name AS team1_player1_name,
        p2.full_name AS team1_player2_name,
        p3.full_name AS team2_player1_name,
        p4.full_name AS team2_player2_name
    FROM matches m
    JOIN teams t1 ON m.team1_id = t1.id
    JOIN teams t2 ON m.team2_id = t2.id
    LEFT JOIN courts c ON m.court_id = c.id
    -- CORRECCIÓN: Se convierte m.category a texto para la comparación
    LEFT JOIN categories cat ON cat.name = m.category::text
    LEFT JOIN PlayerDetails p1 ON p1.team_id = m.team1_id AND p1.category_id = cat.id AND p1.player_rank = 1
    LEFT JOIN PlayerDetails p2 ON p2.team_id = m.team1_id AND p2.category_id = cat.id AND p2.player_rank = 2
    LEFT JOIN PlayerDetails p3 ON p3.team_id = m.team2_id AND p3.category_id = cat.id AND p3.player_rank = 1
    LEFT JOIN PlayerDetails p4 ON p4.team_id = m.team2_id AND p4.category_id = cat.id AND p4.player_rank = 2
`;

// Ruta para el Public Scoreboard (todos los partidos 'en_vivo')
router.get('/scoreboard', async (req, res) => {
    try {
        const sql = `${getScoreboardSql} WHERE m.status = 'en_vivo' ORDER BY m.court_id, m.id;`;
        const result = await db.query(sql);
        res.json(result.rows);
    } catch (err) {
        console.error("Error en la ruta /scoreboard:", err.message);
        res.status(500).send('Error en el servidor');
    }
});

// Ruta para el panel de admin (todos los partidos de un torneo)
router.get('/scoreboard/:tournamentId', async (req, res) => {
    const { tournamentId } = req.params;
    try {
        const sql = `${getScoreboardSql} WHERE m.tournament_id = $1 ORDER BY m.id;`;
        const result = await db.query(sql, [tournamentId]);
        res.json(result.rows);
    } catch (err) {
        console.error("Error en la ruta /scoreboard/:tournamentId:", err.message);
        res.status(500).send('Error en el servidor');
    }
});

router.post('/generate-round-robin', async (req, res) => {
    const { tournament_id } = req.body;
    if (!tournament_id) {
        return res.status(400).json({ msg: "Se requiere un ID de torneo." });
    }

    const client = await db.connect();
    try {
        await client.query('BEGIN');

        // 1. Obtener equipos del torneo y sus grupos
        const teamsRes = await client.query(`
            SELECT id, name, group_id
            FROM teams
            WHERE tournament_id = $1 AND group_id IS NOT NULL
        `, [tournament_id]);
        const teams = teamsRes.rows;

        if (teams.length === 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ msg: 'No hay equipos asignados a grupos para este torneo.' });
        }

        // 2. Obtener todas las categorías presentes por equipo
        const teamCategoriesRes = await client.query(`
            SELECT tp.team_id, c.id as category_id, c.name as category
            FROM team_players tp
            JOIN players p ON tp.player_id = p.id
            JOIN categories c ON p.category_id = c.id
            WHERE tp.team_id IN (${teams.map(t => t.id).join(',')})
            GROUP BY tp.team_id, c.id, c.name
        `);

        // Mapear: groupId -> { categoryName -> [teamId, ...] }
        const teamsByGroupAndCategory = {};
        teams.forEach(team => {
            if (!teamsByGroupAndCategory[team.group_id]) teamsByGroupAndCategory[team.group_id] = {};
        });

        teamCategoriesRes.rows.forEach(row => {
            const team = teams.find(t => t.id === row.team_id);
            if (!team) return;
            const groupMap = teamsByGroupAndCategory[team.group_id];
            if (!groupMap[row.category]) groupMap[row.category] = [];
            groupMap[row.category].push(team.id);
        });

        // 3. Generar round robin por cada grupo y categoría con al menos 2 equipos
        const generatedMatches = [];
        for (const groupId in teamsByGroupAndCategory) {
            const categoriesMap = teamsByGroupAndCategory[groupId];
            for (const categoryName in categoriesMap) {
                const groupTeamIds = categoriesMap[categoryName];
                if (groupTeamIds.length < 2) continue; // Skip si no hay mínimo dos equipos

                // Round robin entre esos equipos para esta categoría
                for (let i = 0; i < groupTeamIds.length; i++) {
                    for (let j = i + 1; j < groupTeamIds.length; j++) {
                        const team1_id = groupTeamIds[i];
                        const team2_id = groupTeamIds[j];
                        const sql = `
                            INSERT INTO matches (tournament_id, team1_id, team2_id, category, status, group_id)
                            VALUES ($1, $2, $3, $4, 'pendiente', $5)
                            RETURNING *;
                        `;
                        const result = await client.query(sql, [tournament_id, team1_id, team2_id, categoryName, groupId]);
                        generatedMatches.push(result.rows[0]);
                    }
                }
            }
        }

        await client.query('COMMIT');
        res.status(201).json({ message: 'Partidos generados exitosamente.', matches: generatedMatches });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error("Error al generar partidos:", err.message);
        res.status(500).send('Error en el servidor al generar partidos.');
    } finally {
        client.release();
    }
});


router.post('/generate-tiebreakers', async (req, res) => {
    const { team_ids, tournament_id = 1, category_id } = req.body;

    if (!team_ids || team_ids.length < 2 || !category_id) {
        return res.status(400).json({ msg: 'Se requiere una lista de IDs de equipos y un category_id.' });
    }

    const client = await db.connect();
    try {
        // Traer el nombre de la categoría para referencia visual
        const categoryRes = await client.query('SELECT name FROM categories WHERE id = $1', [category_id]);
        const category = categoryRes.rows[0]?.name || '';

        await client.query('BEGIN');
        const generatedMatches = [];

        for (let i = 0; i < team_ids.length; i++) {
            for (let j = i + 1; j < team_ids.length; j++) {
                const team1_id = team_ids[i];
                const team2_id = team_ids[j];
                const sql = `
                  INSERT INTO matches
                    (tournament_id, team1_id, team2_id, category, category_id, status, is_tiebreaker)
                  VALUES ($1, $2, $3, $4, $5, 'pendiente', TRUE)
                  RETURNING *;
                `;
                const result = await client.query(sql, [
                    tournament_id,
                    team1_id,
                    team2_id,
                    category,       // nombre de categoría para mostrar (puedes quitar si no usas)
                    category_id
                ]);
                generatedMatches.push(result.rows[0]);
            }
        }
        await client.query('COMMIT');
        res.status(201).json({ message: 'Partidos de desempate generados exitosamente.', matches: generatedMatches });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error("Error al generar partidos de desempate:", err.message);
        res.status(500).send('Error en el servidor.');
    } finally {
        client.release();
    }
});



// --- OTRAS RUTAS ---
router.get('/:id/details', async (req, res) => { 
    try {
        const { id } = req.params;
        const matchRes = await db.query('SELECT * FROM matches WHERE id = $1', [id]);
        if (matchRes.rows.length === 0) {
            return res.status(404).json({ msg: 'Partido no encontrado' });
        }
        const match = matchRes.rows[0];

        const teamsRes = await db.query('SELECT * FROM teams WHERE id = ANY($1::int[])', [[match.team1_id, match.team2_id]]);
        const teamsData = teamsRes.rows;

        const playersRes = await db.query(
            `SELECT p.id, p.full_name, p.category, tp.team_id 
             FROM players p 
             JOIN team_players tp ON p.id = tp.player_id 
             WHERE tp.team_id = ANY($1::int[])`,
            [[match.team1_id, match.team2_id]]
        );
        const playersData = playersRes.rows;

        const team1 = teamsData.find(t => t.id === match.team1_id);
        team1.players = playersData.filter(p => p.team_id === match.team1_id);

        const team2 = teamsData.find(t => t.id === match.team2_id);
        team2.players = playersData.filter(p => p.team_id === match.team2_id);

        res.json({ match, team1, team2 });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Error en el servidor');
    }
});



// --- RUTA base para obtener todos los partidos, mostrando category y category_id
router.get('/', async (req, res) => {
    try {
        const result = await db.query(`
            SELECT m.*, c.name AS category_name
            FROM matches m
            LEFT JOIN categories c ON m.category_id = c.id
            ORDER BY m.id
        `);
        const matches = result.rows.map(row => ({
            ...row,
            categoryId: row.category_id, // asegúrate que existe category_id en matches
            category: row.category_name  // así tienes el nombre legible
        }));
        res.json(matches);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Error en el servidor');
    }
});


// Actualizar un partido específico
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const updates = req.body;
    
    const allowedColumns = [ 
        'court_id', 'status', 'team1_score', 'team2_score', 
        'server_team_id', 'server_number', 'start_time', 'end_time',
        'first_side_out_done', 'player_positions', 'winner_id',
        'team1_tournament_points', 'team2_tournament_points', 'is_announced',
        'scheduled_start_time'
    ];
    
    // CORRECCIÓN: Se filtran las claves que no tienen un valor definido (undefined)
    const validUpdateKeys = Object.keys(updates).filter(key => 
        allowedColumns.includes(key) && updates[key] !== undefined
    );

    if (validUpdateKeys.length === 0) {
        return res.status(400).json({ msg: 'No se proporcionaron campos válidos para actualizar.' });
    }
    
    // Se convierten las cadenas vacías a null para la base de datos
    validUpdateKeys.forEach(key => {
        if (updates[key] === '') {
            updates[key] = null;
        }
    });

    try {
        if (updates.status === 'en_vivo') {
            let courtId = updates.court_id;
            if (!courtId) {
                const matchRes = await db.query('SELECT court_id FROM matches WHERE id = $1', [id]);
                if (matchRes.rows.length > 0) {
                    courtId = matchRes.rows[0].court_id;
                }
            }
            if (courtId) {
                const checkLiveSql = 'SELECT id FROM matches WHERE court_id = $1 AND status = $2 AND id != $3';
                const liveMatchRes = await db.query(checkLiveSql, [courtId, 'en_vivo', id]);
                if (liveMatchRes.rows.length > 0) {
                    return res.status(409).json({ msg: `La cancha #${courtId} ya está ocupada por el partido #${liveMatchRes.rows[0].id}.` });
                }
            }
        }
        
        // --- UPDATE PRINCIPAL ---
        const setClause = validUpdateKeys.map((key, index) => `"${key}" = $${index + 1}`).join(', ');
        const values = validUpdateKeys.map(key => updates[key]);
        values.push(id);
        const sql = `UPDATE matches SET ${setClause} WHERE id = $${values.length} RETURNING *`;
        const result = await db.query(sql, values);
        if (result.rows.length === 0) return res.status(404).json({ msg: 'Partido no encontrado' });
        let updatedMatch = result.rows[0];

        // --- LOGICA DE PUNTOS DE TORNEO ---
        if (updates.status === 'finalizado') {
            // Lee los scores si vinieron en la petición, sino usa los actuales
            let team1_score = typeof updates.team1_score === 'number' ? updates.team1_score : updatedMatch.team1_score;
            let team2_score = typeof updates.team2_score === 'number' ? updates.team2_score : updatedMatch.team2_score;

            let team1_points = 0, team2_points = 0;
            if (team1_score > team2_score) {
                team1_points = 3; team2_points = 0;
            } else if (team2_score > team1_score) {
                team2_points = 3; team1_points = 0;
            } else {
                team1_points = 1; team2_points = 1; // Empate (opcional)
            }

            // Asigna puntos (esto puede ir en la misma tabla o tabla de standings según tu modelo)
            const ptsRes = await db.query(
                `UPDATE matches SET team1_tournament_points = $1, team2_tournament_points = $2 WHERE id = $3 RETURNING *`,
                [team1_points, team2_points, id]
            );
            updatedMatch = ptsRes.rows[0];
        } else if (updates.status === 'pendiente' || updates.status === 'asignado') {
            // Si el partido deja de ser finalizado, resetea los puntos
            const ptsRes = await db.query(
                `UPDATE matches SET team1_tournament_points = 0, team2_tournament_points = 0 WHERE id = $1 RETURNING *`,
                [id]
            );
            updatedMatch = ptsRes.rows[0];
        }

        // --- WEBSOCKET ---
        const wss = req.app.get('wss');
        if (wss) {
            wss.clients.forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({ type: 'MATCH_UPDATE', payload: updatedMatch }));
                }
            });
        }
        
        res.json(updatedMatch);

    } catch (err) {
        console.error('Error al actualizar el partido:', err.message);
        res.status(500).send('Error en el servidor');
    }
});

router.post('/:id/finalize', async (req, res) => {
    const { id } = req.params;
    const { team1_score, team2_score } = req.body;

    if (team1_score === undefined || team2_score === undefined) {
        return res.status(400).json({ msg: 'Se requieren las puntuaciones de ambos equipos.' });
    }

    const client = await db.connect();
    try {
        await client.query('BEGIN');
        const matchRes = await client.query('SELECT team1_id, team2_id, is_tiebreaker FROM matches WHERE id = $1', [id]);
        if (matchRes.rows.length === 0) throw new Error('Partido no encontrado');
        
        const { team1_id, team2_id, is_tiebreaker } = matchRes.rows[0];
        const winner_id = team1_score > team2_score ? team1_id : team2_id;
        const team1_points = winner_id === team1_id ? 200 : 100;
        const team2_points = winner_id === team2_id ? 200 : 100;
        const final_team1_points = is_tiebreaker ? 0 : team1_points;
        const final_team2_points = is_tiebreaker ? 0 : team2_points;

        const updateMatchSql = `
            UPDATE matches 
            SET team1_score = $1, team2_score = $2, winner_id = $3, status = 'finalizado', 
                end_time = NOW(), team1_tournament_points = $4, team2_tournament_points = $5
            WHERE id = $6 RETURNING *;
        `;
        const updatedMatch = await client.query(updateMatchSql, [team1_score, team2_score, winner_id, final_team1_points, final_team2_points, id]);
        
        await client.query('COMMIT');
        
        // Se añade la notificación WebSocket también al finalizar un partido.
        const wss = req.app.get('wss');
        if (wss) {
            wss.clients.forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({ type: 'MATCH_UPDATE', payload: updatedMatch.rows[0] }));
                }
            });
        }

        res.status(200).json(updatedMatch.rows[0]);

    } catch (err) {
        await client.query('ROLLBACK');
        console.error("Error al finalizar el partido:", err.message);
        res.status(500).send('Error en el servidor al finalizar el partido.');
    } finally {
        client.release();
    }
});

// --- NUEVA RUTA PARA ANUNCIAR UN PARTIDO ---
router.post('/:id/announce', async (req, res) => {
    const { id } = req.params;
    const wss = req.app.get('wss');

    try {
        // 1. Marcar el partido como anunciado en la BD
        await db.query('UPDATE matches SET is_announced = TRUE WHERE id = $1', [id]);

        // 2. Obtener los detalles completos del partido para el anuncio
        const matchDetailsRes = await db.query(`
            SELECT 
                m.id, m.court_id, m.category, 
                t1.name AS team1_name, t2.name AS team2_name, c.name AS court_name,
                (SELECT p.full_name FROM players p JOIN team_players tp ON p.id = tp.player_id WHERE tp.team_id = m.team1_id ORDER BY p.id LIMIT 1) AS team1_player1_name,
                (SELECT p.full_name FROM players p JOIN team_players tp ON p.id = tp.player_id WHERE tp.team_id = m.team1_id ORDER BY p.id OFFSET 1 LIMIT 1) AS team1_player2_name,
                (SELECT p.full_name FROM players p JOIN team_players tp ON p.id = tp.player_id WHERE tp.team_id = m.team2_id ORDER BY p.id LIMIT 1) AS team2_player1_name,
                (SELECT p.full_name FROM players p JOIN team_players tp ON p.id = tp.player_id WHERE tp.team_id = m.team2_id ORDER BY p.id OFFSET 1 LIMIT 1) AS team2_player2_name
            FROM matches m
            JOIN teams t1 ON m.team1_id = t1.id
            JOIN teams t2 ON m.team2_id = t2.id
            LEFT JOIN courts c ON m.court_id = c.id
            WHERE m.id = $1;
        `, [id]);
        
        if (matchDetailsRes.rows.length === 0) {
            return res.status(404).json({ msg: 'Partido no encontrado.' });
        }
        const match = matchDetailsRes.rows[0];

        // 3. Construir y enviar el anuncio por WebSocket
        const announcementPayload = {
            id: Date.now(),
            type: 'game',
            courtName: match.court_name || `Cancha #${match.court_id}`,
            team1Name: match.team1_name,
            team2Name: match.team2_name,
            team1Players: [match.team1_player1_name, match.team1_player2_name].filter(Boolean),
            team2Players: [match.team2_player1_name, match.team2_player2_name].filter(Boolean),
            category: match.category,
        };

        wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({ type: 'ANNOUNCEMENT_NEW', payload: announcementPayload }));
                // También enviamos una actualización de partido para refrescar el estado del botón
                client.send(JSON.stringify({ type: 'MATCH_UPDATE', payload: { id: match.id, is_announced: true } }));
            }
        });
        
        res.status(200).json({ msg: 'Anuncio enviado y partido marcado.' });

    } catch (err) {
        console.error("Error al anunciar el partido:", err.message);
        res.status(500).send('Error en el servidor.');
    }
});


module.exports = router;
