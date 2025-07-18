const { Pool } = require('pg');

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
