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
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Método no permitido' });
  }
  const userId = req.body.userId || req.query.userId;
  const activityId = req.query.id;
  if (!userId) {
    return res.status(400).json({ error: 'Falta userId' });
  }
  try {
    // Verificar si el usuario existe y obtener su rol
    const userResult = await pool.query('SELECT role FROM users WHERE id = $1', [userId]);
    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: 'Usuario no encontrado' });
    }
    const userRole = userResult.rows[0].role;
    // Obtener el user_id de la actividad
    const activityResult = await pool.query('SELECT user_id FROM activities WHERE id = $1', [activityId]);
    if (activityResult.rows.length === 0) {
      return res.status(404).json({ error: 'Actividad no encontrada' });
    }
    const activityUserId = activityResult.rows[0].user_id;
    // Permitir si es admin, o si es el dueño de la actividad
    if (userRole !== 'admin' && userId !== activityUserId) {
      return res.status(403).json({ error: 'No tienes permiso para eliminar esta actividad' });
    }
    // Eliminar la actividad
    await pool.query('DELETE FROM activities WHERE id = $1', [activityId]);
    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Error al eliminar la actividad' });
  }
}
