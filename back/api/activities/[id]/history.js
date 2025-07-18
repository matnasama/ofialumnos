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
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Método no permitido' });
    return;
  }
  const activityId = req.query.id || (req.query && req.query["id"]) || (req.url && req.url.split("/").pop());
  try {
    // Buscar todas las versiones con el mismo parent_id o el id original
    const parentRes = await pool.query('SELECT parent_id FROM activities WHERE id = $1', [activityId]);
    let parentId = activityId;
    if (parentRes.rows.length && parentRes.rows[0].parent_id) {
      parentId = parentRes.rows[0].parent_id;
    }
    const result = await pool.query(
      `SELECT a.*, u.username FROM activities a JOIN users u ON a.user_id = u.id WHERE a.parent_id = $1 OR a.id = $1 ORDER BY a.created_at ASC`,
      [parentId]
    );
    res.status(200).json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener historial' });
  }
};
