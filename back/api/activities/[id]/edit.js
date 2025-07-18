const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  ssl: process.env.PGSSLMODE === 'require' ? { rejectUnauthorized: false } : false,
  channelBinding: process.env.PGCHANNELBINDING || undefined
});

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Método no permitido' });
    return;
  }
  let body = req.body;
  if (!body || typeof body !== 'object') {
    try {
      body = JSON.parse(req.body);
    } catch {
      res.status(400).json({ error: 'Cuerpo inválido' });
      return;
    }
  }
  const activityId = req.query.id || (req.query && req.query["id"]) || (req.url && req.url.split("/").pop());
  const { userId, titulo, descripcion, fecha_inicio } = body;
  if (!userId || !titulo || !fecha_inicio) {
    res.status(400).json({ error: 'Faltan datos obligatorios' });
    return;
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
      res.status(404).json({ error: 'Actividad original no encontrada' });
      return;
    }
    const originalUserId = orig.rows[0].user_id;
    // Obtener el rol del usuario
    const userResult = await pool.query('SELECT role FROM users WHERE id = $1', [userId]);
    if (!userResult.rows.length) {
      res.status(401).json({ error: 'Usuario no encontrado' });
      return;
    }
    const userRole = userResult.rows[0].role;
    // Solo el dueño original o admin pueden editar
    if (userId !== originalUserId && userRole !== 'admin') {
      res.status(403).json({ error: 'Solo el creador original o admin pueden editar esta actividad' });
      return;
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
};
