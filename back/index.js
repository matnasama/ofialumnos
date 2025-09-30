require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
app.use(cors());
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
  // Detalles de petición para debug local sólo si DEBUG_LOGS=true
  if (process.env.DEBUG_LOGS === 'true') {
    console.debug && console.debug('DELETE /activities/:id llamado');
    console.debug && console.debug('req.url:', req.url);
    console.debug && console.debug('req.query:', req.query);
    console.debug && console.debug('req.body:', req.body);
  }
  // Prioriza userId en body, luego en query string
  const userId = (req.body && req.body.userId) || req.query.userId;
  const activityId = req.params.id;
  if (!userId) {
    if (process.env.DEBUG_LOGS === 'true') console.debug && console.debug('No se recibió userId en body ni query:', req.body, req.query);
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

// Montar el router de activities en /api/activities
app.use('/api/activities', activitiesRouter);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  if (process.env.DEBUG_LOGS === 'true') console.debug && console.debug(`Servidor backend escuchando en puerto ${PORT}`);
});
