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
  res.setHeader('Access-Control-Allow-Methods', 'DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  if (req.method !== 'DELETE') {
    res.status(405).json({ error: 'Método no permitido' });
    return;
  }
  // Obtener id de la URL y userId de query
  const id = req.query.id || (req.url && req.url.split("/").pop());
  const userId = req.query.userId;
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
};
