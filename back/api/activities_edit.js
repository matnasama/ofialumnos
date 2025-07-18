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
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }
  const activityId = req.query.id;
  const { userId, titulo, descripcion, fecha_inicio } = req.body;
  if (!userId || !titulo || !fecha_inicio) {
    return res.status(400).json({ error: 'Faltan datos obligatorios' });
  }
  try {
    // Obtener la actividad original para mantener el parent_id
    const prev = await pool.query('SELECT parent_id FROM activities WHERE id = $1', [activityId]);
    let parentId = activityId;
    if (prev.rows.length && prev.rows[0].parent_id) {
      parentId = prev.rows[0].parent_id;
    }
    // Obtener el user_id del dueño original (actividad raíz)
    const orig = await pool.query('SELECT user_id FROM activities WHERE id = $1', [parentId]);
    if (!orig.rows.length) {
      return res.status(404).json({ error: 'Actividad original no encontrada' });
    }
    const originalUserId = orig.rows[0].user_id;
    // Obtener el rol del usuario
    const userResult = await pool.query('SELECT role FROM users WHERE id = $1', [userId]);
    if (!userResult.rows.length) {
      return res.status(401).json({ error: 'Usuario no encontrado' });
    }
    const userRole = userResult.rows[0].role;
    // Solo el dueño original o admin pueden editar
    if (userId !== originalUserId && userRole !== 'admin') {
      return res.status(403).json({ error: 'Solo el creador original o admin pueden editar esta actividad' });
    }
    // Marcar la actividad anterior como inactiva
    await pool.query('UPDATE activities SET is_active = FALSE WHERE id = $1', [activityId]);
    // Crear la nueva actividad (historial)
    const result = await pool.query(
      'INSERT INTO activities (user_id, titulo, descripcion, fecha_inicio, fecha_fin, is_active, parent_id) VALUES ($1, $2, $3, $4, $5, TRUE, $6) RETURNING *',
      [userId, titulo, descripcion, fecha_inicio, null, parentId]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Error al editar la actividad' });
  }
}
