// Modal simple reutilizable
function Modal({ open, onClose, children }) {
  if (!open) return null;
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: '#0008', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', borderRadius: 16, padding: 32, minWidth: 320, width: '50vw', maxWidth: 700, boxShadow: '0 2px 24px #0004', position: 'relative', maxHeight: '96vh', height: 'auto', minHeight: 600, overflowY: 'auto' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: 14, right: 18, background: 'none', border: 'none', fontSize: 28, fontWeight: 700, color: '#1976d2', cursor: 'pointer', zIndex: 2 }}>&times;</button>
        {children}
      </div>
    </div>
  );
}
import { useState, useEffect } from 'react';
let API = import.meta.env.VITE_API_URL;
if (API && !API.endsWith('/')) API = API + '/';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import './App.css';
// Detectar tema del sistema operativo
function useSystemTheme() {
  const [theme, setTheme] = useState(window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e) => setTheme(e.matches ? 'dark' : 'light');
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return theme;
}

const months = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

function App() {
  // Modal formularios
  // Estado para modal de exámenes finales
  const [examenesModalOpen, setExamenesModalOpen] = useState(false);
  const [formulariosOpen, setFormulariosOpen] = useState(false);
  const [formularios, setFormularios] = useState([]);
  const [formulariosLoading, setFormulariosLoading] = useState(false);
  const [formulariosError, setFormulariosError] = useState(null);
  // Modal tramites
  const [tramitesOpen, setTramitesOpen] = useState(false);
  const [tramites, setTramites] = useState([]);
  const [tramitesLoading, setTramitesLoading] = useState(false);
  const [tramitesError, setTramitesError] = useState(null);
  // Estado principal
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ title: '', description: '' });
  const [selectedDate, setSelectedDate] = useState(null);
  const [activities, setActivities] = useState([]);
  const [month, setMonth] = useState(new Date().getMonth());
  const [year] = useState(2025);
  // Estado para modal de grillas
  const [grillasModalOpen, setGrillasModalOpen] = useState(false);
  const [grillasModalData, setGrillasModalData] = useState([]);
  const [grillasModalLoading, setGrillasModalLoading] = useState(false);
  const [grillasModalError, setGrillasModalError] = useState(null);
  // Estado de usuario autenticado
  const [user, setUser] = useState(null);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState(null);
  // Estado para historial de actividades
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [historyData, setHistoryData] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState(null);
  const theme = useSystemTheme();
  // Helpers para calendario
  const weekDays = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  function getDaysInMonth(month, year) {
    return new Date(year, month + 1, 0).getDate();
  }
  function getFirstDayOfWeek(month, year) {
    return new Date(year, month, 1).getDay();
  }
  function handlePrevMonth() {
    setMonth(m => (m === 0 ? 11 : m - 1));
    setSelectedDate(null);
  }
  function handleNextMonth() {
    setMonth(m => (m === 11 ? 0 : m + 1));
    setSelectedDate(null);
  }
  function handleDayClick(day) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    setSelectedDate(dateStr);
  }
  // Actividades del día seleccionado (comparar con formato yyyy-mm-dd)
  const activitiesForDate = selectedDate
    ? activities.filter(a => {
        // selectedDate es yyyy-mm-dd, a.date es yyyy-mm-dd
        // Si a.date viene en dd/mm/yyyy, convertir a yyyy-mm-dd
        let actDate = a.date;
        if (actDate && actDate.includes('/')) {
          const [d, m, y] = actDate.split('/');
          actDate = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
        }
        return actDate === selectedDate;
      })
    : [];
  // Render principal
  // Construir matriz de semanas para el mes
  const daysInMonth = getDaysInMonth(month, year);
  const firstDay = getFirstDayOfWeek(month, year);
  const weeks = [];
  let week = Array(firstDay).fill(null);
  for (let day = 1; day <= daysInMonth; day++) {
    week.push(day);
    if (week.length === 7) {
      weeks.push(week);
      week = [];
    }
  }
  if (week.length) {
    while (week.length < 7) week.push(null);
    weeks.push(week);
  }
  // Formulario para agregar actividad (debajo del calendario)
  const [form, setForm] = useState({ title: '', description: '', to: '', periodo: false });
  async function handleAddActivity(e) {
    e.preventDefault();
    if (!user) {
      alert('Inicia sesión para agregar actividades');
      return;
    }
    if (!form.title || !selectedDate) return;
    const fromDate = new Date(selectedDate);
    if (form.periodo && form.to) {
      const toDate = new Date(form.to);
      for (let d = new Date(fromDate); d <= toDate; d.setDate(d.getDate() + 1)) {
        const fechaISO = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
        await fetch(`${API}activities`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.id,
            titulo: form.title,
            descripcion: form.description,
            fecha_inicio: fechaISO,
            fecha_fin: null
          })
        });
      }
    } else {
      const [a, m, d] = selectedDate.split('-');
      const fechaISO = `${a}-${m}-${d}`;
      await fetch(`${API}activities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          titulo: form.title,
          descripcion: form.description,
          fecha_inicio: fechaISO,
          fecha_fin: null
        })
      });
    }
    setForm({ title: '', description: '', to: '', periodo: false });
    await fetchActivities(); // Recargar actividades después de agregar
  }
  // Login
  async function handleLogin(e) {
    e.preventDefault();
    setLoginError(null);
    try {
      const res = await fetch(`${API}login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm)
      });
      if (!res.ok) throw new Error('Credenciales incorrectas');
      const data = await res.json();
      setUser(data);
      localStorage.setItem('user', JSON.stringify(data)); // Guardar sesión
      setLoginForm({ username: '', password: '' });
    } catch (err) {
      setLoginError('Usuario o contraseña incorrectos');
    }
  }
  function handleLogout() {
    setUser(null);
    localStorage.removeItem('user'); // Limpiar sesión
  }
  // Restaurar usuario desde localStorage al iniciar
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);
  // Cargar actividades desde la base de datos al iniciar
  useEffect(() => {
    fetchActivities();
  }, []);
  // Eliminar actividad (admin o usuario dueño)
  async function handleDeleteActivity(id) {
    if (!user) return;
    const url = `${API}activities/${id}?userId=${encodeURIComponent(user.id)}`;
    console.log('DELETE url:', url, 'user.id:', user.id, 'typeof:', typeof user.id);
    const res = await fetch(url, {
      method: 'DELETE'
    });
    if (!res.ok) {
      const text = await res.text();
      alert('Error al eliminar: ' + text);
    }
    await fetchActivities();
    setEditingId(null);
  }
  // Editar actividad con historial
  async function handleSaveEditActivity(id, date) {
    if (!user) return;
    // Llamar al endpoint de edición (debe implementarse en backend)
    await fetch(`${API}activities/${id}/edit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: user.id,
        titulo: editForm.title,
        descripcion: editForm.description,
        fecha_inicio: date.split('/').reverse().join('-')
      })
    });
    setEditingId(null);
    await fetchActivities(); // Recargar actividades después de editar
  }
  // Cargar actividades desde la base de datos
  async function fetchActivities() {
    try {
      const res = await fetch(`${API}activities`);
      const data = await res.json();
      const acts = data.map(a => ({
        id: a.id,
        title: a.titulo,
        description: a.descripcion,
        date: a.fecha_inicio ? a.fecha_inicio.slice(0, 10) : '', // yyyy-mm-dd
        user_id: a.user_id,
        username: a.username
      }));
      setActivities(acts);
    } catch {
      setActivities([]);
    }
  }
  // Render
  return (
    <div style={{ display: 'flex', flexDirection: 'row', height: '93vh', minHeight: 500, minWidth: '98vw', background: theme === 'dark' ? '#181a1b' : '#f7f7f7', color: theme === 'dark' ? '#f7f7f7' : '#222', overflow: 'hidden' }}>
      {/* Login arriba a la derecha */}
      <div style={{ position: 'fixed', top: 10, right: 20, zIndex: 2000 }}>
        {user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontWeight: 600, color: '#1976d2' }}>{user.username} ({user.id})</span>
            <button onClick={handleLogout} style={{ padding: '4px 10px', borderRadius: 6, border: 'none', background: '#1976d2', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>Salir</button>
          </div>
        ) : (
          <form onSubmit={handleLogin} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#fff', borderRadius: 8, boxShadow: '0 1px 6px #0002', padding: '6px 12px' }}>
            <input
              type="text"
              placeholder="Usuario"
              value={loginForm.username}
              onChange={e => setLoginForm(f => ({ ...f, username: e.target.value }))}
              style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #bbb', fontSize: 13 }}
              required
            />
            <input
              type="password"
              placeholder="Contraseña"
              value={loginForm.password}
              onChange={e => setLoginForm(f => ({ ...f, password: e.target.value }))}
              style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #bbb', fontSize: 13 }}
              required
            />
            <button type="submit" style={{ padding: '4px 10px', borderRadius: 6, border: 'none', background: '#1976d2', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>Ingresar</button>
          </form>
        )}
        {loginError && <div style={{ color: 'red', fontSize: 13, marginTop: 4 }}>{loginError}</div>}
      </div>
      {/* Calendario y form */}
      <div style={{ width: 500, minWidth: 380, maxWidth: 650, padding: 8, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', height: '100%' }}>
        {/* Bloque calendario con altura fija */}
        <div style={{ width: '100%', maxWidth: 480, height: 340, background: theme === 'dark' ? '#181a1b' : '#f7f7f7', borderRadius: 16, boxShadow: theme === 'dark' ? '0 2px 12px #0006' : '0 2px 12px #0001', padding: '8px 0 10px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', marginBottom: 18 }}>
        <h2 style={{ textAlign: 'center', fontSize: 22, marginBottom: 8 }}>Calendario {year}</h2>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: 6, gap: 8 }}>
            <button onClick={handlePrevMonth} style={{ padding: '4px 10px', fontSize: 15, borderRadius: 6, border: '1px solid #ccc', background: theme === 'dark' ? '#23272f' : '#f5f5f5', color: theme === 'dark' ? '#f7f7f7' : '#222', cursor: 'pointer', width: 120 }}>
              &lt; {months[(month + 11) % 12]}
            </button>
            <h3 style={{ margin: 0, minWidth: 120, textAlign: 'center', fontWeight: 700, fontSize: 18, width: 120 }}>{months[month]}</h3>
            <button onClick={handleNextMonth} style={{ padding: '4px 10px', fontSize: 15, borderRadius: 6, border: '1px solid #ccc', background: theme === 'dark' ? '#23272f' : '#f5f5f5', color: theme === 'dark' ? '#f7f7f7' : '#222', cursor: 'pointer', width: 120 }}>
              {months[(month + 1) % 12]} &gt;
            </button>
          </div>
          <table style={{ width: '100%', maxWidth: 320, margin: 'auto', borderCollapse: 'collapse', background: theme === 'dark' ? '#23272f' : '#fff', fontSize: 15, color: theme === 'dark' ? '#f7f7f7' : '#222', boxShadow: theme === 'dark' ? '0 1px 8px #0008' : '0 1px 8px #0001' }}>
            <thead>
              <tr>
                {weekDays.map(wd => (
                  <th key={wd} style={{ padding: 2, borderBottom: '1px solid #ccc', color: '#1976d2', fontSize: 13 }}>{wd}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {weeks.map((week, wIdx) => (
                <tr key={wIdx}>
                  {week.map((day, dIdx) => {
                    if (!day) return <td key={dIdx} style={{ height: 40 }} />;
                    const dateStr = `${year}-${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
                    const isSelected = selectedDate === dateStr;
                    const actsCount = activities.filter(a => a.date === dateStr).length;
                    return (
                      <td key={dIdx}
                        style={{
                          padding: 0,
                          border: `1px solid ${theme === 'dark' ? '#444' : '#ccc'}`,
                          background: isSelected
                            ? '#1083f7ff'
                            : (theme === 'dark' ? '#23272f' : '#fff'),
                          color: isSelected ? '#fff' : (theme === 'dark' ? '#f7f7f7' : '#333'),
                          fontWeight: isSelected ? 'bold' : 'normal',
                          transition: 'background 0.2s, color 0.2s',
                          position: 'relative',
                          height: 32,
                          width: 40,
                          verticalAlign: 'middle'
                        }}
                      >
                        {/* Badge arriba del cuadrante, no sobre el número */}
                        {actsCount > 0 && (
                          <span style={{ position: 'absolute', top: 1, right: 1, background: '#10467cff', color: '#fff', borderRadius: 7, fontSize: 10, minWidth: 12, height: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, boxShadow: '0 1px 4px #0002', zIndex: 2, padding: '0 4px' }}>
                            {actsCount}
                          </span>
                        )}
                        <button
                          style={{ width: 55, height: 35, border: 'none', background: 'transparent', color: 'inherit', fontWeight: 'inherit', cursor: 'pointer', fontSize: 14, outline: 'none', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: 0, margin: 'auto' }}
                          onClick={() => handleDayClick(day)}
                          tabIndex={0}
                        >
                          {day}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Bloque form con altura fija */}
        <div style={{ width: '100%', maxWidth: 500, height: 230, background: theme === 'dark' ? '#23272f' : '#fff', borderRadius: 8, boxShadow: theme === 'dark' ? '0 1px 4px #0008' : '0 1px 4px #0001', border: '1px solid #ddd', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', overflowY: 'auto' }}>
          <form onSubmit={handleAddActivity} style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6, width: '95%' }}>
            <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 4, color: theme === 'dark' ? '#f7f7f7' : '#1976d2' }}>Agregar actividad</div>
            <input
              name="title"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="Título"
              style={{ padding: '5px 8px', borderRadius: 6, border: '1px solid #bbb', fontSize: 13 }}
              required
              disabled={!selectedDate || !user}
            />
            <textarea
              name="description"
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Descripción"
              style={{ padding: '5px 8px', borderRadius: 6, border: '1px solid #bbb', fontSize: 13, minHeight: 40 }}
              disabled={!selectedDate || !user}
            />
            <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2, justifyContent: 'center', width: '100%' }}>
              <input
                type="date"
                name="from"
                value={selectedDate || ''}
                onChange={e => setSelectedDate(e.target.value)}
                style={{ padding: '5px 8px', borderRadius: 6, border: '1px solid #bbb', fontSize: 12, width: 140, minWidth: 70, maxWidth: 180, textAlign: 'center', margin: '0 auto' }}
                disabled={!selectedDate || !user}
              />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <input
                  type="checkbox"
                  checked={form.periodo}
                  onChange={e => setForm(f => ({ ...f, periodo: e.target.checked }))}
                  style={{ marginRight: 2, marginLeft: 2 }}
                  disabled={!selectedDate || !user}
                />
                <span style={{ fontSize: 12, fontWeight: 400, marginRight: 3 }}>Periodo</span>
                <input
                  type="date"
                  name="to"
                  value={form.to}
                  onChange={e => setForm(f => ({ ...f, to: e.target.value }))}
                  style={{ padding: '5px 8px', borderRadius: 6, border: '1px solid #bbb', fontSize: 12, width: 140, minWidth: 70, maxWidth: 180, textAlign: 'center', margin: '0 auto' }}
                  min={selectedDate}
                  required={form.periodo}
                  disabled={!form.periodo || !selectedDate || !user}
                />
              </div>
            </div>
            <button type="submit" style={{ padding: '6px 0', borderRadius: 6, border: 'none', background: '#1976d2', color: '#fff', fontWeight: 700, fontSize: 14, cursor: selectedDate && user ? 'pointer' : 'not-allowed', marginTop: 6 }} disabled={!selectedDate || !user}>Agregar</button>
          </form>
        </div>
      </div>
      {/* Panel lateral de actividades */}
      <div style={{ flex: 1, minWidth: 220, padding: 20, borderLeft: theme === 'dark' ? '1px solid #333' : '1px solid #ccc', background: theme === 'dark' ? '#181a1b' : '#fafbfc', color: theme === 'dark' ? '#f7f7f7' : '#222', display: 'flex', flexDirection: 'column', justifyContent: 'flex-start' }}>
        <h2 style={{ color: theme === 'dark' ? '#fff' : '#222', fontSize: 22, fontWeight: 700, marginBottom: 12 }}>Novedades del día</h2>
        {selectedDate ? (
          <>
            {/* Mostrar fecha seleccionada con día de la semana y formato dd/mm/yyyy */}
            <div style={{ fontSize: 17, fontWeight: 500, marginBottom: 8, color: theme === 'dark' ? '#f7f7f7' : '#1976d2', backgroundColor: theme === 'dark' ? '#1976d2' : '#e3f2fd', padding: '8px 12px', borderRadius: 6 }}>
              {(() => {
                if (!selectedDate) return '';
                const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
                const [a, m, d] = selectedDate.split('-').map(Number);
                const fecha = new Date(a, m - 1, d);
                const diaSemana = diasSemana[fecha.getDay()];
                return `${diaSemana} ${d.toString().padStart(2, '0')}/${m.toString().padStart(2, '0')}/${a}`;
              })()}
            </div>
            {/* Mostrar actividades */}
            {activitiesForDate.length > 0 ? (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, textAlign: 'left' }}>
                {activitiesForDate.map(act => (
                  <AccordionItem
                    key={act.id}
                    act={act}
                    theme={theme}
                    editingId={editingId}
                    editForm={editForm}
                    handleStartEdit={a => {
                      setEditingId(a.id);
                      setEditForm({ title: a.title, description: a.description });
                    }}
                    handleDeleteActivity={handleDeleteActivity}
                    handleCancelEdit={() => setEditingId(null)}
                    handleSaveEdit={(id, date) => {
                      setActivities(acts => acts.map(a => a.id === id ? { ...a, title: editForm.title, description: editForm.description, date } : a));
                      setEditingId(null);
                    }}
                    setEditForm={setEditForm}
                    selectedDate={selectedDate ? selectedDate.split('-').reverse().join('/') : ''}
                    activities={activities}
                    user={user}
                    handleSaveEditActivity={handleSaveEditActivity}
                    handleShowHistory={async (id) => {
                      setHistoryModalOpen(true);
                      setHistoryLoading(true);
                      setHistoryError(null);
                      try {
                        const res = await fetch(`${API}activities/${id}/history`);
                        if (!res.ok) throw new Error('Error al obtener historial');
                        const data = await res.json();
                        setHistoryData(data);
                      } catch {
                        setHistoryError('No se pudo obtener el historial');
                      }
                      setHistoryLoading(false);
                    }}
                  />
                ))}
              </ul>
            ) : (
              <p>No hay actividades para este día.</p>
            )}
          </>
        ) : (
          <p>Selecciona un día para ver actividades.</p>
        )}
      </div>
      {/* Panel de accesos directos */}
      <div style={{ flex: 1, minWidth: 220, padding: 20, borderLeft: theme === 'dark' ? '1px solid #333' : '1px solid #ccc', background: theme === 'dark' ? '#181a1b' : '#fff', color: theme === 'dark' ? '#fff' : '#222', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start' }}>
        <h2 style={{ color: theme === 'dark' ? '#fff' : '#222', fontSize: 24, fontWeight: 700, marginBottom: 24, marginTop: 10, letterSpacing: 1 }}>Accesos directos</h2>
        {/* Estado para modal de exámenes finales */}
        <div style={{ width: '100%', display: 'flex', flexWrap: 'wrap', gap: 18, justifyContent: 'center', marginTop: 10 }}>
          {[
            { label: 'Trámites', onClick: () => {
                setTramitesOpen(true);
                setTramitesLoading(true);
                setTramitesError(null);
                fetch('https://raw.githubusercontent.com/matnasama/buscador-de-aulas/refs/heads/main/public/json/info/formularios.json')
                  .then(res => res.json())
                  .then(data => {
                    // Buscar el array tramites dentro del objeto
                    let arr = [];
                    if (data && typeof data === 'object' && Array.isArray(data.tramites)) {
                      arr = data.tramites;
                    }
                    setTramites(arr);
                    setTramitesLoading(false);
                  })
                  .catch(() => {
                    setTramitesError('No se pudieron cargar los trámites');
                    setTramitesLoading(false);
                  });
              }
            },
            { label: 'Formularios', onClick: () => {
                setFormulariosOpen(true);
                setFormulariosLoading(true);
                setFormulariosError(null);
                fetch('https://raw.githubusercontent.com/matnasama/buscador-de-aulas/refs/heads/main/public/json/info/formularios.json')
                  .then(res => res.json())
                  .then(data => {
                    setFormularios(data);
                    setFormulariosLoading(false);
                  })
                  .catch(() => {
                    setFormulariosError('No se pudieron cargar los formularios');
                    setFormulariosLoading(false);
                  });
              }
            },
            { label: 'Consultas' },
            { label: 'Internos' },
            {
              label: 'Grillas de cursada',
              onClick: () => {
                setGrillasModalOpen(true);
                setGrillasModalLoading(true);
                setGrillasModalError(null);
                fetch('https://raw.githubusercontent.com/matnasama/buscador-de-aulas/refs/heads/main/public/json/info/formularios.json')
                  .then(res => res.json())
                  .then(data => {
                    if (data && typeof data === 'object' && Array.isArray(data.bedelia)) {
                      const grillas = data.bedelia.filter(b => b.nombre && b.nombre.toLowerCase().includes('grilla') && b.url);
                      setGrillasModalData(grillas);
                    } else {
                      setGrillasModalError('No se encontró información de Grillas.');
                    }
                    setGrillasModalLoading(false);
                  })
                  .catch(() => {
                    setGrillasModalError('No se pudo obtener la información de Grillas.');
                    setGrillasModalLoading(false);
                  });
              }
            },
            {
              label: 'Bedelía',
              onClick: () => {
                fetch('https://raw.githubusercontent.com/matnasama/buscador-de-aulas/refs/heads/main/public/json/info/formularios.json')
                  .then(res => res.json())
                  .then(data => {
                    if (data && typeof data === 'object' && Array.isArray(data.bedelia)) {
                      const obj = data.bedelia.find(b => b.nombre && b.nombre.toLowerCase() === 'aulas' && b.url);
                      if (obj && obj.url) {
                        setTimeout(() => window.open(obj.url, '_blank'), 0);
                      } else {
                        alert('No se encontró el enlace de aulas de Bedelía.');
                      }
                    } else {
                      alert('No se encontró información de Bedelía.');
                    }
                  })
                  .catch(() => {
                    alert('No se pudo obtener la información de Bedelía.');
                  });
              }
            },
            { label: 'STIC' },
            { label: 'Exámenes Finales', onClick: () => {
                setExamenesModalOpen(true);
              }
            }
          ].map(card => (
            <div key={card.label}
              style={{
                width: 120,
                height: 120,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: theme === 'dark' ? '#23272f' : '#e3f2fd',
                color: theme === 'dark' ? '#fff' : '#1976d2',
                borderRadius: 16,
                boxShadow: theme === 'dark' ? '0 1px 6px #0006' : '0 1px 6px #1976d233',
                fontWeight: 300,
                fontSize: 18,
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'background 0.2s, color 0.2s',
                border: theme === 'dark' ? '1px solid #333' : '1px solid #1976d2',
                userSelect: 'none',
                letterSpacing: 1,
                marginBottom: 0
              }}
              tabIndex={0}
              onClick={card.onClick}
            >
              {card.label}
            </div>
          ))}
        </div>
        {/* Modal de exámenes finales */}
        <Modal open={examenesModalOpen} onClose={() => setExamenesModalOpen(false)}>
          <h2 style={{ fontSize: 22, marginBottom: 14, color: '#1976d2', textAlign: 'center' }}>Exámenes Finales</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18, width: '100%', maxWidth: 500, margin: 'auto' }}>
            <a href="https://docs.google.com/spreadsheets/u/2/d/e/2PACX-1vSSs7PbwGNijblVEd7VzY0YCgd4vAzAr8ZJtZMHAPtxkVFxYzRON50pBVhxvJwRzg/pubhtml?gid=1276171040&single=true&urp=gmail_link" target="_blank" rel="noopener noreferrer" style={{ background: '#e3f2fd', borderRadius: 12, border: '1.2px solid #1976d2', padding: '18px 16px', fontWeight: 700, fontSize: 16, color: '#1976d2', textAlign: 'center', textDecoration: 'none', marginBottom: 8, display: 'block' }}>
              DEPARTAMENTO DE CIENCIAS APLICADAS Y TECNOLOGÍA
            </a>
            <a href="https://docs.google.com/spreadsheets/u/2/d/e/2PACX-1vSSs7PbwGNijblVEd7VzY0YCgd4vAzAr8ZJtZMHAPtxkVFxYzRON50pBVhxvJwRzg/pubhtml?gid=258106575&single=true&urp=gmail_link" target="_blank" rel="noopener noreferrer" style={{ background: '#e3f2fd', borderRadius: 12, border: '1.2px solid #1976d2', padding: '18px 16px', fontWeight: 700, fontSize: 16, color: '#1976d2', textAlign: 'center', textDecoration: 'none', marginBottom: 8, display: 'block' }}>
              DEPARTAMENTO DE CIENCIAS ECONÓMICAS Y JURÍDICAS
            </a>
            <a href="https://docs.google.com/spreadsheets/u/2/d/e/2PACX-1vSSs7PbwGNijblVEd7VzY0YCgd4vAzAr8ZJtZMHAPtxkVFxYzRON50pBVhxvJwRzg/pubhtml?gid=1874348986&single=true&urp=gmail_link" target="_blank" rel="noopener noreferrer" style={{ background: '#e3f2fd', borderRadius: 12, border: '1.2px solid #1976d2', padding: '18px 16px', fontWeight: 700, fontSize: 16, color: '#1976d2', textAlign: 'center', textDecoration: 'none', marginBottom: 8, display: 'block' }}>
              DEPARTAMENTO DE HUMANIDADES Y CIENCIAS SOCIALES
            </a>
          </div>
        </Modal>
        {/* Modal de formularios */}
        <Modal open={formulariosOpen} onClose={() => setFormulariosOpen(false)}>
          <h2 style={{ fontSize: 22, marginBottom: 14, color: '#000000ff', textAlign: 'center' }}>Formularios</h2>
          {formulariosLoading && <div style={{ textAlign: 'center', margin: 18 }}>Cargando...</div>}
          {formulariosError && <div style={{ color: '#d32f2f', textAlign: 'center', margin: 18 }}>{formulariosError}</div>}
          {/* Soportar array directo o dentro de un objeto */}
          {!formulariosLoading && !formulariosError && (
            (() => {
              let arr = null;
              if (Array.isArray(formularios)) arr = formularios;
              else if (formularios && typeof formularios === 'object') {
                // Buscar la primera propiedad que sea un array
                const arrKey = Object.keys(formularios).find(k => Array.isArray(formularios[k]));
                if (arrKey) arr = formularios[arrKey];
              }
              if (arr && arr.length > 0) {
                // Filtrar formularios a excluir por coincidencia exacta de título (case-insensitive)
                const excluidos = [
                  'formulario de licencias',
                  'formulario alta de usuario',
                  'formulario alta sistemas de gestion'
                ];
                const visibles = arr.filter(f => {
                  if (!f.titulo) return true;
                  const t = f.titulo.trim().toLowerCase();
                  return !excluidos.includes(t);
                });
                return (
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: 20,
                    justifyItems: 'center',
                    alignItems: 'center',
                    width: '80%',
                    margin: '0 auto',
                    maxWidth: 1000
                  }}>
                    {visibles.map((f, idx) => (
                      <a
                        key={f.url || idx}
                        href={f.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          height: 170,
                          minWidth: 0,
                          width: '100%',
                          maxWidth: 170,
                          background: '#e3f2fd',
                          color: '#000000ff',
                          fontWeight: 500,
                          fontSize: 15,
                          textAlign: 'center',
                          textDecoration: 'none',
                          borderRadius: 12,
                          boxShadow: '0 1px 4px #1976d233',
                          border: '1.5px solid #1976d2',
                          transition: 'background 0.2s, color 0.2s, box-shadow 0.2s',
                          cursor: 'pointer',
                          letterSpacing: 0.5,
                          padding: '10px 6px',
                          overflow: 'hidden',
                          wordBreak: 'break-word',
                        }}
                      >
                        {(f.titulo || '').toUpperCase()}
                      </a>
                    ))}
                  </div>
                );
              } else if (formularios && !Array.isArray(formularios)) {
                return <div style={{ color: '#d32f2f', marginTop: 12 }}>El JSON recibido no contiene formularios para mostrar.</div>;
              } else {
                return null;
              }
            })()
          )}
        </Modal>
        {/* Modal de trámites */}
        <Modal open={tramitesOpen} onClose={() => setTramitesOpen(false)}>
          <h2 style={{ fontSize: 22, marginBottom: 14, color: '#1976d2', textAlign: 'center' }}>Trámites</h2>
          {tramitesLoading && <div style={{ textAlign: 'center', margin: 18 }}>Cargando...</div>}
          {tramitesError && <div style={{ color: '#d32f2f', textAlign: 'center', margin: 18 }}>{tramitesError}</div>}
          {!tramitesLoading && !tramitesError && tramites && tramites.length > 0 && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 10,
              justifyItems: 'center',
              alignItems: 'center',
              width: '100%',
              margin: '0 auto',
              maxWidth: 800
            }}>
              {tramites.map((t, idx) => (
                <div key={t.nombre || idx} style={{ background: '#e3f2fd', borderRadius: 12, boxShadow: '0 1px 4px #1976d233', border: '1.2px solid #1976d2', padding: '18px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, height: 160, width: '100%', maxWidth: 160, justifyContent: 'space-around' }}>
                  <div style={{ fontWeight: 500, fontSize: 16, color: '#1976d2', marginBottom: 8, textAlign: 'center', letterSpacing: 0.5 }}>{t.nombre}</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5, alignItems: 'center', width: '100%' }}>
                    {t.formulario && (
                      <a href={t.formulario} target="_blank" rel="noopener noreferrer" style={{ background: '#1976d2', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 18px', fontWeight: 500, fontSize: 13, textDecoration: 'none', cursor: 'pointer', letterSpacing: 0.5, transition: 'background 0.2s, color 0.2s', width: '60%', textAlign: 'center' }}>Ver formulario</a>
                    )}
                    {t.forms && (
                      <a href={t.forms} target="_blank" rel="noopener noreferrer" style={{ background: '#1976d2', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 18px', fontWeight: 500, fontSize: 13, textDecoration: 'none', cursor: 'pointer', letterSpacing: 0.5, transition: 'background 0.2s, color 0.2s', width: '60%', textAlign: 'center' }}>Ver formulario</a>
                    )}
                    {t.hoja_de_calculo && (
                      <a href={t.hoja_de_calculo} target="_blank" rel="noopener noreferrer" style={{ background: '#fff', color: '#1976d2', border: '1.2px solid #1976d2', borderRadius: 8, padding: '8px 18px', fontWeight: 500, fontSize: 13, textDecoration: 'none', cursor: 'pointer', letterSpacing: 0.5, transition: 'background 0.2s, color 0.2s', width: '60%', textAlign: 'center' }}>Ver trámite</a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Modal>
        {/* Modal de grillas */}
        <Modal open={grillasModalOpen} onClose={() => setGrillasModalOpen(false)}>
          <h2 style={{ fontSize: 22, marginBottom: 14, color: '#1976d2', textAlign: 'center' }}>Grillas</h2>
          {grillasModalLoading && <div style={{ textAlign: 'center', margin: 18 }}>Cargando...</div>}
          {grillasModalError && <div style={{ color: '#d32f2f', textAlign: 'center', margin: 18 }}>{grillasModalError}</div>}
          {!grillasModalLoading && !grillasModalError && grillasModalData && grillasModalData.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18, width: '50%', maxWidth: 500, margin: 'auto' }}>
              {grillasModalData.map((g, idx) => (
                <div key={g.url || idx} style={{ background: '#e3f2fd', borderRadius: 12, boxShadow: '0 1px 4px #1976d233', border: '1.2px solid #1976d2', padding: '18px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                  <div style={{ fontWeight: 700, fontSize: 16, color: '#1976d2', marginBottom: 8, textAlign: 'center', letterSpacing: 0.5 }}>{(g.nombre || '').toUpperCase()}</div>
                  <a href={g.url} target="_blank" rel="noopener noreferrer" style={{ background: '#1976d2', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 18px', fontWeight: 700, fontSize: 15, textDecoration: 'none', cursor: 'pointer', letterSpacing: 0.5, transition: 'background 0.2s, color 0.2s' }}>Ver</a>
                </div>
              ))}
            </div>
          )}
        </Modal>
        {/* Modal para historial de versiones */}
        <Modal open={historyModalOpen} onClose={() => setHistoryModalOpen(false)}>
          <h2 style={{ fontSize: 22, marginBottom: 14, color: '#1976d2', textAlign: 'center' }}>Historial de versiones</h2>
          {historyLoading && <div style={{ textAlign: 'center', margin: 18 }}>Cargando...</div>}
          {historyError && <div style={{ color: '#d32f2f', textAlign: 'center', margin: 18 }}>{historyError}</div>}
          {!historyLoading && !historyError && historyData && historyData.length > 0 && (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {historyData.map((h, idx) => (
                <li key={h.id} style={{ background: h.is_active ? '#e3f2fd' : '#eee', borderRadius: 8, marginBottom: 10, padding: 12, border: h.is_active ? '2px solid #1976d2' : '1px solid #bbb' }}>
                  <div style={{ fontWeight: 700, color: '#1976d2', fontSize: 16 }}>{h.titulo}</div>
                  <div style={{ fontSize: 14, color: '#333', marginBottom: 4 }}>{h.descripcion}</div>
                  <div style={{ fontSize: 13, color: '#666' }}>Fecha: {h.fecha_inicio ? new Date(h.fecha_inicio).toLocaleDateString('es-AR') : ''}</div>
                  <div style={{ fontSize: 13, color: '#666' }}>Creado: {h.created_at ? new Date(h.created_at).toLocaleString('es-AR', { hour12: false }) : ''}</div>
                  <div style={{ fontSize: 12, color: '#888' }}>Usuario: {h.username}</div>
                  <div style={{ fontSize: 12, color: h.is_active ? '#388e3c' : '#b71c1c', fontWeight: 600 }}>{h.is_active ? 'Versión activa' : 'Versión anterior'}</div>
                </li>
              ))}
            </ul>
          )}
          {!historyLoading && !historyError && (!historyData || historyData.length === 0) && (
            <div style={{ color: '#888', textAlign: 'center', margin: 18 }}>No hay historial para esta actividad.</div>
          )}
        </Modal>
      </div>
    </div>
  );
}

export default App;
// Componente AccordionItem
function AccordionItem({ act, theme, editingId, editForm, handleStartEdit, handleDeleteActivity, handleCancelEdit, handleSaveEdit, setEditForm, selectedDate, activities, user, handleSaveEditActivity, handleShowHistory }) {
  const [open, setOpen] = useState(false);
  const isEditing = editingId === act.id;
  return (
    <li style={{ marginBottom: 10, borderRadius: 6, background: theme === 'dark' ? '#23272f' : '#fff', boxShadow: theme === 'dark' ? '0 1px 4px #0008' : '0 1px 4px #0001', overflow: 'hidden', border: '1px solid #ddd', position: 'relative', minHeight: 80 }}>
      <button
        onClick={() => {
          setOpen(o => !o);
          if (!isEditing && !open) {
            setEditForm({
              title: act.title,
              description: act.description
            });
          }
        }}
        style={{
          width: '100%',
          textAlign: 'left',
          background: 'none',
          border: 'none',
          padding: '10px 12px',
          fontSize: 17,
          fontWeight: 700,
          color: theme === 'dark' ? '#f7f7f7' : '#1976d2',
          cursor: 'pointer',
          outline: 'none',
        }}
        aria-expanded={open}
      >
        {act.title}
        <span style={{ float: 'right', fontWeight: 400, fontSize: 15 }}>{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div style={{ padding: '10px 12px', borderTop: '1px solid #eee', color: theme === 'dark' ? '#f7f7f7' : '#222', fontSize: 15, position: 'relative', minHeight: 60 }}>
          {isEditing ? (
            <form
              onSubmit={e => { e.preventDefault(); handleSaveEditActivity(act.id, selectedDate); }}
              style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
            >
              <input
                name="title"
                value={editForm.title}
                onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))}
                placeholder="Título"
                style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #bbb', fontSize: 15 }}
                required
                disabled={!user}
              />
              <textarea
                name="description"
                value={editForm.description}
                onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Descripción"
                style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #bbb', fontSize: 15, minHeight: 48 }}
                disabled={!user}
              />
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button type="submit" style={{ background: '#1976d2', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 18px', fontWeight: 700, fontSize: 15, cursor: user ? 'pointer' : 'not-allowed' }} disabled={!user}>Guardar</button>
                <button type="button" onClick={handleCancelEdit} style={{ background: '#eee', color: '#222', border: 'none', borderRadius: 6, padding: '6px 18px', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>Cancelar</button>
              </div>
            </form>
          ) : (
            <>
              <div style={{ wordBreak: 'break-word', overflowWrap: 'break-word', minWidth: 0 }}>{act.description}</div>
              <div style={{ fontSize: 13, color: '#666', marginTop: 4 }}>
                {/* Solo mostrar user_id o username si hay usuario logueado */}
                {user ? (act.user_id || act.username) : null}
                {user && user.role === 'admin' && act.created_at && (
                  <span style={{ marginLeft: 12, color: '#888' }}>
                    <span style={{ fontWeight: 600 }}>Creado:</span> {new Date(act.created_at).toLocaleString('es-AR')}
                  </span>
                )}
              </div>
              {user && (
                <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 8, marginTop: 12 }}>
                  {(user.role === 'admin' || user.id === act.user_id) && (
                    <button onClick={() => handleStartEdit(act)} title="Editar" style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: '#1976d2', fontSize: 22, display: 'flex', alignItems: 'center' }}>
                      <EditIcon style={{ fontSize: 24, color: '#1976d2' }} />
                    </button>
                  )}
                  {(user.role === 'admin' || user.id === act.user_id) && (
                    <button onClick={() => handleDeleteActivity(act.id)} title="Eliminar" style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: '#d32f2f', fontSize: 22, display: 'flex', alignItems: 'center' }}>
                      <DeleteIcon style={{ fontSize: 24, color: '#d32f2f' }} />
                    </button>
                  )}
                  {user.role === 'admin' && (
                    <button onClick={() => handleShowHistory(act.id)} title="Ver historial" style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: '#888', fontSize: 18, display: 'flex', alignItems: 'center', textDecoration: 'underline', marginLeft: 4 }}>
                      Historial
                    </button>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </li>
  )
}

