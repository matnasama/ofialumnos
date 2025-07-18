
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  ssl: process.env.PGSSLMODE === 'require' ? { rejectUnauthorized: false } : false,
  channelBinding: process.env.PGCHANNELBINDING || undefined
});

// Vercel serverless handler
module.exports = async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method === 'POST') {
    let body = req.body;
    // Vercel puede no parsear body automáticamente
    if (!body || typeof body !== 'object') {
      try {
        body = JSON.parse(req.body);
      } catch {
        res.status(400).json({ error: 'Cuerpo inválido' });
        return;
      }
    }
    const { username, password } = body;
    try {
      const result = await pool.query(
        'SELECT id, username, role FROM users WHERE username = $1 AND password = $2',
        [username, password]
      );
      if (result.rows.length === 1) {
        res.status(200).json(result.rows[0]);
      } else {
        res.status(401).json({ error: 'Credenciales incorrectas' });
      }
    } catch (err) {
      res.status(500).json({ error: 'Error en el servidor' });
    }
    return;
  }

  res.status(405).json({ error: 'Método no permitido' });
};
