require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
// Configure CORS: support comma-separated list in CORS_ORIGIN or '*' by default.
// For production set CORS_ORIGIN to the frontend origin (e.g. https://ofialumnos.vercel.app)
const rawOrigins = process.env.CORS_ORIGIN || '*';
const allowedOrigins = rawOrigins === '*' ? ['*'] : rawOrigins.split(',').map(s => s.trim()).filter(Boolean);
const allowCredentials = process.env.CORS_ALLOW_CREDENTIALS === 'true';

const corsOptions = {
  origin: function(origin, callback) {
    // allow requests with no origin (e.g. curl, server-to-server)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes('*')) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Origin not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With'],
  credentials: allowCredentials,
  optionsSuccessStatus: 204
};

// middleware to log incoming origin and decision (helpful during deploy/debug)
app.use((req, res, next) => {
  const origin = req.headers.origin || '(none)';
  // don't log on every request in production unless DEBUG_CORS is set
  if (process.env.DEBUG_CORS === 'true') console.log('Incoming request origin:', origin);
  next();
});

app.use(cors(corsOptions));
// Respond to preflight requests for all routes
app.options('*', cors(corsOptions));
app.use(express.json());


const pool = new Pool({
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  ssl: process.env.PGSSLMODE === 'require' ? { rejectUnauthorized: false } : false,
  channelBinding: process.env.PGCHANNELBINDING || undefined
});

// Importar y montar el router de login
const loginRouter = require('./api/login');
app.use('/api/login', loginRouter);

// Agrupar todos los endpoints de activities bajo /api/activities
const activitiesRouter = express.Router();

// Endpoint para eliminar actividad (admin puede eliminar cualquiera, usuario solo las suyas)
activitiesRouter.delete('/:id', async (req, res) => {
  // LOGS DETALLADOS PARA DEBUG
  console.log('DELETE /activities/:id llamado');
  console.log('req.url:', req.url);
  console.log('req.query:', req.query);
  console.log('req.body:', req.body);
  // Prioriza userId en body, luego en query string
  const userId = (req.body && req.body.userId) || req.query.userId;
  const activityId = req.params.id;
  if (!userId) {
    console.log('No se recibió userId en body ni query:', req.body, req.query);
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
    res.json({ success: true });
  } catch (err) {
    console.error('Error al eliminar actividad:', err);
    res.status(500).json({ error: 'Error al eliminar la actividad' });
  }
});

// Endpoint para crear nueva actividad
activitiesRouter.post('/', async (req, res) => {
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
});

// Endpoint para obtener todas las actividades activas
activitiesRouter.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT a.id, a.user_id, u.username, a.titulo, a.descripcion, a.fecha_inicio, a.fecha_fin, a.created_at
       FROM activities a
       JOIN users u ON a.user_id = u.id
       WHERE a.is_active = TRUE
       ORDER BY a.fecha_inicio ASC, a.created_at ASC`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener actividades' });
  }
});

// Endpoint para editar actividad con historial (marca la anterior como inactiva y crea una nueva)
activitiesRouter.post('/:id/edit', async (req, res) => {
  const activityId = req.params.id;
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
});

// Endpoint para obtener historial de una actividad (todas las versiones)
activitiesRouter.get('/:id/history', async (req, res) => {
  const activityId = req.params.id;
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
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener historial' });
  }
});

// Obtener flags (is_read, is_done) para una actividad y un usuario
activitiesRouter.get('/:id/flags', async (req, res) => {
  const activityId = req.params.id;
  const userId = req.query.userId || (req.body && req.body.userId);
  if (!userId) return res.status(400).json({ error: 'Falta userId' });
  try {
    console.log('GET /activities/%s/flags userId=%s', activityId, userId);
    const result = await pool.query('SELECT is_read, is_done FROM activity_user_flags WHERE activity_id = $1 AND user_id = $2', [activityId, userId]);
    if (result.rows.length === 0) {
      return res.json({ is_read: false, is_done: false });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error al obtener flags:', err);
    res.status(500).json({ error: 'Error al obtener flags' });
  }
});

// Actualizar o insertar flags para una actividad y usuario
activitiesRouter.post('/:id/flags', async (req, res) => {
  const activityId = req.params.id;
  const { userId, is_read, is_done } = req.body;
  if (!userId) return res.status(400).json({ error: 'Falta userId' });
  try {
    console.log('POST /activities/%s/flags payload:', activityId, req.body);
    await pool.query(
      `INSERT INTO activity_user_flags (activity_id, user_id, is_read, is_done, updated_at)
       VALUES ($1, $2, $3, $4, now())
       ON CONFLICT (activity_id, user_id) DO UPDATE SET is_read = EXCLUDED.is_read, is_done = EXCLUDED.is_done, updated_at = now()`,
      [activityId, userId, !!is_read, !!is_done]
    );
    // Return the current row to the client for verification
    const sel = await pool.query('SELECT activity_id, user_id, is_read, is_done, updated_at FROM activity_user_flags WHERE activity_id = $1 AND user_id = $2', [activityId, userId]);
    const row = sel.rows[0] || { activity_id: activityId, user_id: userId, is_read: !!is_read, is_done: !!is_done };
    console.log('Flags upserted for activity %s user %s ->', activityId, userId, row);
    res.json({ success: true, row });
  } catch (err) {
    console.error('Error al actualizar flags:', err);
    res.status(500).json({ error: 'Error al actualizar flags' });
  }
});

// Batch endpoint: recibir { userId, activityIds: [] } y devolver flags para esas activities
activitiesRouter.post('/flags/batch', async (req, res) => {
  const { userId, activityIds } = req.body;
  if (!userId) return res.status(400).json({ error: 'Falta userId' });
  if (!Array.isArray(activityIds)) return res.status(400).json({ error: 'Falta activityIds array' });
  try {
    // build query with ANY
    const q = await pool.query('SELECT activity_id, is_read, is_done FROM activity_user_flags WHERE user_id = $1 AND activity_id = ANY($2::int[])', [userId, activityIds]);
    // map results
    const map = {};
    q.rows.forEach(r => { map[String(r.activity_id)] = { is_read: r.is_read, is_done: r.is_done }; });
    // return for each requested id a default of false/false if missing
    const out = {};
    activityIds.forEach(id => { out[id] = map[String(id)] || { is_read: false, is_done: false }; });
    res.json({ flags: out });
  } catch (err) {
    console.error('Error en batch flags:', err);
    res.status(500).json({ error: 'Error en batch flags' });
  }
});

// Debug: obtener todas las flags para un usuario (útil para pruebas)
activitiesRouter.get('/flags', async (req, res) => {
  const userId = req.query.userId || (req.body && req.body.userId);
  if (!userId) return res.status(400).json({ error: 'Falta userId' });
  try {
    const q = await pool.query('SELECT activity_id, is_read, is_done, updated_at FROM activity_user_flags WHERE user_id = $1', [String(userId)]);
    const out = {};
    q.rows.forEach(r => { out[String(r.activity_id)] = { is_read: r.is_read, is_done: r.is_done, updated_at: r.updated_at }; });
    res.json({ flags: out });
  } catch (err) {
    console.error('Error en debug flags GET:', err);
    res.status(500).json({ error: 'Error en debug flags' });
  }
});

// Montar el router de activities en /api/activities
app.use('/api/activities', activitiesRouter);

// Use configured PORT if provided (useful in hosting environments)
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Servidor backend escuchando en puerto ${PORT}`);
});

// Admin / debug endpoint: listar todas las flags (protegido)
// Disponible si DEBUG_FLAGS=true o si se envía header x-admin-token igual a ADMIN_TOKEN
activitiesRouter.get('/flags/all', async (req, res) => {
  const allowDebug = process.env.DEBUG_FLAGS === 'true';
  const adminToken = process.env.ADMIN_TOKEN;
  const provided = req.headers['x-admin-token'];
  if (!allowDebug && (!adminToken || provided !== adminToken)) {
    return res.status(403).json({ error: 'No autorizado. Configure DEBUG_FLAGS=true o env ADMIN_TOKEN y envíe x-admin-token.' });
  }
  try {
    const q = await pool.query('SELECT activity_id, user_id, is_read, is_done, updated_at FROM activity_user_flags ORDER BY updated_at DESC NULLS LAST');
    res.json({ rows: q.rows });
  } catch (err) {
    console.error('Error listado all flags:', err);
    res.status(500).json({ error: 'Error al listar flags' });
  }
});
