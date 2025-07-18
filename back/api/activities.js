const { Pool } = require('pg');


export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method === 'GET') {
    try {
      const result = await pool.query(
        `SELECT a.id, a.user_id, u.username, a.titulo, a.descripcion, a.fecha_inicio, a.fecha_fin, a.created_at
         FROM activities a
         JOIN users u ON a.user_id = u.id
         WHERE a.is_active = TRUE
         ORDER BY a.fecha_inicio ASC, a.created_at ASC`
      );
      res.status(200).json(result.rows);
    } catch (err) {
      res.status(500).json({ error: 'Error al obtener actividades' });
    }
    return;
  }

  if (req.method === 'POST') {
    const { userId, titulo, descripcion, fecha_inicio, fecha_fin } = req.body;
    if (!userId || !titulo || !fecha_inicio) {
      res.status(400).json({ error: 'Faltan datos obligatorios' });
      return;
    }
    try {
      const result = await pool.query(
        'INSERT INTO activities (user_id, titulo, descripcion, fecha_inicio, fecha_fin, is_active) VALUES ($1, $2, $3, $4, $5, TRUE) RETURNING *',
        [userId, titulo, descripcion, fecha_inicio, fecha_fin]
      );
      res.status(201).json(result.rows[0]);
    } catch (err) {
      res.status(500).json({ error: 'Error al crear la actividad' });
    }
    return;
  }

  if (req.method === 'DELETE') {
    const { id, userId } = req.query;
    if (!userId || !id) {
      res.status(400).json({ error: 'Falta userId o id' });
      return;
    }
    try {
      // Verificar si el usuario existe y obtener su rol
      const userResult = await pool.query('SELECT role FROM users WHERE id = $1', [userId]);
      if (userResult.rows.length === 0) {
        res.status(401).json({ error: 'Usuario no encontrado' });
        return;
      }
      const userRole = userResult.rows[0].role;
      // Obtener el user_id de la actividad
      const activityResult = await pool.query('SELECT user_id FROM activities WHERE id = $1', [id]);
      if (activityResult.rows.length === 0) {
        res.status(404).json({ error: 'Actividad no encontrada' });
        return;
      }
      const activityUserId = activityResult.rows[0].user_id;
      // Permitir si es admin, o si es el dueño de la actividad
      if (userRole !== 'admin' && userId !== activityUserId) {
        res.status(403).json({ error: 'No tienes permiso para eliminar esta actividad' });
        return;
      }
      await pool.query('DELETE FROM activities WHERE id = $1', [id]);
      res.status(200).json({ success: true });
    } catch (err) {
      res.status(500).json({ error: 'Error al eliminar la actividad' });
    }
    return;
  }

  res.status(405).json({ error: 'Método no permitido' });
}
const pool = new Pool({
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  ssl: process.env.PGSSLMODE === 'require' ? { rejectUnauthorized: false } : false,
  channelBinding: process.env.PGCHANNELBINDING || undefined
});

export default async function handler(req, res) {
  if (req.method === 'GET') {
    // Obtener todas las actividades activas
    try {
      const result = await pool.query(
        `SELECT a.id, a.user_id, u.username, a.titulo, a.descripcion, a.fecha_inicio, a.fecha_fin, a.created_at
         FROM activities a
         JOIN users u ON a.user_id = u.id
         WHERE a.is_active = TRUE
         ORDER BY a.fecha_inicio ASC, a.created_at ASC`
      );
      res.status(200).json(result.rows);
    } catch (err) {
      res.status(500).json({ error: 'Error al obtener actividades' });
    }
  } else if (req.method === 'POST') {
    // Crear nueva actividad
    const { userId, titulo, descripcion, fecha_inicio, fecha_fin } = req.body;
    if (!userId || !titulo || !fecha_inicio) {
      return res.status(400).json({ error: 'Faltan datos obligatorios' });
    }
    try {
      const result = await pool.query(
        'INSERT INTO activities (user_id, titulo, descripcion, fecha_inicio, fecha_fin, is_active) VALUES ($1, $2, $3, $4, $5, TRUE) RETURNING *',
        [userId, titulo, descripcion, fecha_inicio, fecha_fin]
      );
      res.status(201).json(result.rows[0]);
    } catch (err) {
      res.status(500).json({ error: 'Error al crear la actividad' });
    }
  } else {
    res.status(405).json({ error: 'Método no permitido' });
  }
}
