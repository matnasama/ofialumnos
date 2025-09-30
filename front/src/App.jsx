import { logTramites } from './logTramites.js';
import AccordionResultadosAuxiliares from './AccordionResultadosAuxiliares.jsx';
// Modal simple reutilizable
function Modal({ open, onClose, children, width = '60vw', minWidth = 320, maxWidth = 1300 }) {
  if (!open) return null;
  // Handler para cerrar al clickear fuera del modal
  function handleBackdropClick(e) {
    if (e.target === e.currentTarget) onClose();
  }
  // Detectar theme global (por prop o window)
  let theme = 'light';
  if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) theme = 'dark';
  return (
    <div
      style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: '#0008', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={handleBackdropClick}
    >
      <div style={{
        background: theme === 'dark' ? '#23272f' : '#fff',
        borderRadius: 16,
        padding: 32,
        minWidth: minWidth,
        width: width,
        maxWidth: maxWidth,
        boxShadow: '0 2px 24px #0004',
        position: 'relative',
        maxHeight: '100vh',
        height: 'auto',
        minHeight: 320,
        overflowY: 'auto',
        fontSize: '14px'
      }}>
        <button onClick={onClose} style={{ position: 'absolute', top: 14, right: 18, background: 'none', border: 'none', fontSize: 28, fontWeight: 700, color: '#1976d2', cursor: 'pointer', zIndex: 2 }}>&times;</button>
        {children}
      </div>
    </div>
  );
}

import { useState, useEffect, useRef } from 'react';
// Base API URL: use VITE_API_URL when provided, otherwise default to relative '/api/'
let API = import.meta.env.VITE_API_URL || '/api/';
if (API && !API.endsWith('/')) API = API + '/';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import './App.css';
// Plantillas (consultas) are now fetched from a remote JSON file in the repo's
// raw content. Keep a minimal local fallback to avoid breaking the UI if the
// remote fetch fails. The full content was previously embedded here but was
// moved to `public/json/data.json` in the repository.
const PLANTILLAS_FALLBACK = { consultas: [] };

const months = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

// Hook para detectar tema del sistema (dark / light)
function useSystemTheme() {
  const [theme, setTheme] = useState(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  useEffect(() => {
    if (!(window && window.matchMedia)) return undefined;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e) => setTheme(e.matches ? 'dark' : 'light');
    mq.addEventListener ? mq.addEventListener('change', handler) : mq.addListener(handler);
    return () => { mq.removeEventListener ? mq.removeEventListener('change', handler) : mq.removeListener(handler); };
  }, []);
  return theme;
}

// RichEditor lifted to module scope to keep a stable component identity.
function RichEditor({ value, onChange, disabled, theme }) {
  const ref = useRef(null);
  const [focused, setFocused] = useState(false);

  // Only sync incoming value to DOM when not focused to avoid
  // interrupting typing/selection.
  useEffect(() => {
    if (!ref.current) return;
    if (document.activeElement === ref.current) return; // don't clobber while editing
    if (ref.current.innerHTML !== (value || '')) {
      ref.current.innerHTML = value || '';
    }
  }, [value]);

  function exec(cmd, arg) {
    if (disabled) return;
    if (!ref.current) return;
    ref.current.focus();
    document.execCommand(cmd, false, arg || null);
    setTimeout(() => onChange(ref.current.innerHTML), 0);
  }

  function handleInput() {
    if (!ref.current) return;
    onChange(ref.current.innerHTML);
  }

  function handleToggleLink() {
    if (disabled) return;
    if (!ref.current) return;
    const sel = window.getSelection();
    if (!sel) return;

    let node = sel.anchorNode;
    while (node && node !== ref.current && node.nodeName !== 'A') node = node.parentNode;
    const insideLink = node && node.nodeName === 'A';

    if (insideLink) {
      exec('unlink');
      return;
    }

    const url = window.prompt('Ingrese la URL (incluya http:// o https://)');
    if (!url) return;
    const hasSelection = sel && !sel.isCollapsed;
    if (hasSelection) {
      exec('createLink', url);
    } else {
      const label = window.prompt('Ingrese el texto del enlace');
      const html = `<a href="${url}" target="_blank" rel="noopener noreferrer">${label || url}</a>`;
      document.execCommand('insertHTML', false, html);
      setTimeout(() => onChange(ref.current.innerHTML), 0);
    }
  }

  const editorBg = disabled ? (theme === 'dark' ? '#2b2f35' : '#f5f5f5') : (theme === 'dark' ? '#23272f' : '#fff');
  const editorColor = theme === 'dark' ? '#e6eef9' : '#111';
  const btnBg = theme === 'dark' ? '#2b2f35' : '#fff';
  const btnBorder = theme === 'dark' ? '#3c4046' : '#ddd';
  const iconColor = theme === 'dark' ? '#cfe4ff' : '#222';

  const btnStyle = {
    padding: '4px 6px',
    borderRadius: 6,
    border: `1px solid ${btnBorder}`,
    background: btnBg,
    cursor: disabled ? 'not-allowed' : 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 32,
    height: 28,
    fontSize: 13,
    color: iconColor,
  };

  // Color pickers refs and state
  const textColorRef = useRef(null);
  const bgColorRef = useRef(null);
  const [textColor, setTextColor] = useState('#000000');
  const [bgColor, setBgColor] = useState('#ffffff');

  function applyTextColor(color) {
    if (disabled) return;
    setTextColor(color);
    // apply text color
    exec('foreColor', color);
  }

  function applyBgColor(color) {
    if (disabled) return;
    setBgColor(color);
    // first try hiliteColor (works in many browsers), fall back to backColor
    exec('hiliteColor', color);
    setTimeout(() => exec('backColor', color), 10);
  }

  return (
    <div style={{ position: 'relative' }}>
  <div style={{ display: 'flex', gap: 6, marginBottom: 6, alignItems: 'center' }}>
        <button
          type="button"
          onMouseDown={e => e.preventDefault()}
          onClick={() => exec('bold')}
          disabled={disabled}
          title="Negrita"
          style={btnStyle}
        >
          <strong style={{ fontSize: 13 }}>B</strong>
        </button>

        <button
          type="button"
          onMouseDown={e => e.preventDefault()}
          onClick={() => exec('italic')}
          disabled={disabled}
          title="Cursiva"
          style={btnStyle}
        >
          <em style={{ fontSize: 13 }}>I</em>
        </button>

        <button
          type="button"
          onMouseDown={e => e.preventDefault()}
          onClick={() => exec('underline')}
          disabled={disabled}
          title="Subrayado"
          style={btnStyle}
        >
          <span style={{ textDecoration: 'underline', fontSize: 13 }}>U</span>
        </button>

        <button
          type="button"
          onMouseDown={e => e.preventDefault()}
          onClick={handleToggleLink}
          disabled={disabled}
          title="Insertar/Eliminar enlace"
          style={btnStyle}
        >
          🔗
        </button>

        <button
          type="button"
          onMouseDown={e => e.preventDefault()}
          onClick={() => textColorRef.current && textColorRef.current.click()}
          disabled={disabled}
          title="Color de texto"
          style={btnStyle}
        >
          <span style={{ width: 14, height: 12, display: 'inline-block', borderRadius: 3, background: textColor, border: `1px solid ${btnBorder}` }} />
        </button>

        <button
          type="button"
          onMouseDown={e => e.preventDefault()}
          onClick={() => bgColorRef.current && bgColorRef.current.click()}
          disabled={disabled}
          title="Color de fondo"
          style={btnStyle}
        >
          <span style={{ width: 14, height: 12, display: 'inline-block', borderRadius: 3, background: bgColor, border: `1px solid ${btnBorder}` }} />
        </button>

        <button
          type="button"
          onMouseDown={e => e.preventDefault()}
          onClick={() => exec('justifyLeft')}
          disabled={disabled}
          title="Alinear a la izquierda"
          style={btnStyle}
        >
          ⇤
        </button>

        <button
          type="button"
          onMouseDown={e => e.preventDefault()}
          onClick={() => exec('justifyCenter')}
          disabled={disabled}
          title="Centrar"
          style={btnStyle}
        >
          ⇆
        </button>

        <button
          type="button"
          onMouseDown={e => e.preventDefault()}
          onClick={() => exec('justifyRight')}
          disabled={disabled}
          title="Alinear a la derecha"
          style={btnStyle}
        >
          ⇥
        </button>
      </div>

      {/* hidden color inputs triggered by the small palette buttons */}
      <input ref={textColorRef} type="color" aria-hidden style={{ display: 'none' }} onChange={e => applyTextColor(e.target.value)} />
      <input ref={bgColorRef} type="color" aria-hidden style={{ display: 'none' }} onChange={e => applyBgColor(e.target.value)} />

      <div
        ref={ref}
        contentEditable={!disabled}
        suppressContentEditableWarning={true}
        onInput={handleInput}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        aria-label="Descripción"
        style={{ padding: '8px', borderRadius: 6, border: '1px solid #bbb', fontSize: 13, minHeight: 74, outline: 'none', background: editorBg, color: editorColor, lineHeight: 1.4, textAlign: 'left' }}
      />

      {!focused && !(value && value.length > 0) && (
        <div style={{ position: 'absolute', left: 12, top: 44, pointerEvents: 'none', color: '#888', fontSize: 13 }}>Descripción</div>
      )}
    </div>
  );
}

// Ensure any <a> tags in HTML open in a new tab and have safe rel attributes.
function ensureLinksOpenInBlank(html) {
  if (!html) return '';
  if (typeof window === 'undefined' || !window.DOMParser) return html;
  try {
    const parser = new window.DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const anchors = doc.querySelectorAll('a');
    anchors.forEach(a => {
      if (!a.hasAttribute('target')) a.setAttribute('target', '_blank');
      // ensure rel contains noopener noreferrer
      const rel = (a.getAttribute('rel') || '').split(/\s+/).filter(Boolean);
      if (!rel.includes('noopener')) rel.push('noopener');
      if (!rel.includes('noreferrer')) rel.push('noreferrer');
      a.setAttribute('rel', rel.join(' '));
    });
    return doc.body.innerHTML;
  } catch (err) {
    return html;
  }
}

function App() {
  // Estado para modal de Internos
  const [internosModalOpen, setInternosModalOpen] = useState(false);
  // Estado y lógica para Internos
  const [internosData, setInternosData] = useState([]);
  const [internosLoading, setInternosLoading] = useState(false);
  const [internosError, setInternosError] = useState(null);
  const [internosFiltro, setInternosFiltro] = useState("");
  const [internosFiltrados, setInternosFiltrados] = useState([]);

  useEffect(() => {
    if (internosModalOpen) {
      setInternosLoading(true);
      setInternosError(null);
      fetch('https://raw.githubusercontent.com/matnasama/buscador-de-aulas/refs/heads/main/public/json/internos.json')
        .then(res => res.json())
        .then(data => {
          setInternosData(data);
          setInternosFiltrados(data);
          setInternosLoading(false);
        })
        .catch(() => {
          setInternosError('No se pudo cargar el listado de internos');
          setInternosLoading(false);
        });
    } else {
      setInternosFiltro("");
      setInternosFiltrados([]);
    }
  }, [internosModalOpen]);

  // Función para quitar tildes/acentos
  function quitarTildes(str) {
    return str ? str.normalize('NFD').replace(/[ -\u007f-\u009f\u0300-\u036f]/g, '').toLowerCase() : '';
  }
  useEffect(() => {
    if (!internosFiltro) {
      setInternosFiltrados(internosData);
    } else {
      const filtro = quitarTildes(internosFiltro);
      setInternosFiltrados(
        internosData.filter(
          i => (i.area && quitarTildes(i.area).includes(filtro)) || (i.usuario && quitarTildes(i.usuario).includes(filtro))
        )
      );
    }
  }, [internosFiltro, internosData]);
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
  // Plantillas (antes 'Consultas')
  const [plantillasOpen, setPlantillasOpen] = useState(false);
  const [plantillasData, setPlantillasData] = useState(null);
  const [plantillasLoading, setPlantillasLoading] = useState(false);
  const [plantillasError, setPlantillasError] = useState(null);
  const [plantillaSelected, setPlantillaSelected] = useState(null);
  const [plantillaCopyFeedback, setPlantillaCopyFeedback] = useState('');
  const [bubbleMaxWidth, setBubbleMaxWidth] = useState(null);
  const containerRef = useRef(null);
  const [plantillasRemoteFailed, setPlantillasRemoteFailed] = useState(false);
  useEffect(() => {
    function compute() {
      // Prefer a viewport-based max width so long descriptions (p.ej. equivalencias)
      // can use most of the screen when needed. Cap to avoid extremely wide boxes.
      const vw95 = Math.floor(window.innerWidth * 0.95);
      const capped = Math.min(Math.max(vw95, 700), 1800); // min 700px, max 1800px
      setBubbleMaxWidth(capped + 'px');
    }
    if (plantillasOpen) {
      compute();
      window.addEventListener('resize', compute);
      return () => window.removeEventListener('resize', compute);
    }
  }, [plantillasOpen]);
  // Estado de usuario autenticado
  const [user, setUser] = useState(null);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState(null);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  // Estado para historial de actividades
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [historyData, setHistoryData] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState(null);

  // Estado y lógica para Auxiliares estudiantes
  const [auxiliaresModalOpen, setAuxiliaresModalOpen] = useState(false);
  const [auxiliaresData, setAuxiliaresData] = useState(null);
  const [auxiliaresLoading, setAuxiliaresLoading] = useState(false);
  const [auxiliaresError, setAuxiliaresError] = useState(null);
  const [auxiliaresDni, setAuxiliaresDni] = useState('');
  const [auxiliaresResult, setAuxiliaresResult] = useState(null);
  const [auxiliaresAccordionOpen, setAuxiliaresAccordionOpen] = useState([]);

  // Estado para Enlaces (nuevo botón en accesos directos)
  const [enlacesModalOpen, setEnlacesModalOpen] = useState(false);
  const [enlacesData, setEnlacesData] = useState(null);
  const [enlacesLoading, setEnlacesLoading] = useState(false);
  const [enlacesError, setEnlacesError] = useState(null);
  const [enlacesAccordionOpen, setEnlacesAccordionOpen] = useState({});

  useEffect(() => {
    if (auxiliaresModalOpen && !auxiliaresData && !auxiliaresLoading) {
      setAuxiliaresLoading(true);
      fetch('https://raw.githubusercontent.com/matnasama/buscador-de-aulas/refs/heads/main/public/json/reportes_unm_auxiliares.json')
        .then(res => res.json())
        .then(data => {
          setAuxiliaresData(data);
          setAuxiliaresLoading(false);
        })
        .catch(() => {
          setAuxiliaresError('No se pudo cargar el reporte de auxiliares');
          setAuxiliaresLoading(false);
        });
    }
    if (!auxiliaresModalOpen) {
      setAuxiliaresDni('');
      setAuxiliaresResult(null);
      setAuxiliaresError(null);
    }
  }, [auxiliaresModalOpen]);

  function handleBuscarAuxiliar(e) {
    e.preventDefault();
    setAuxiliaresError(null);
    setAuxiliaresResult(null);
    setAuxiliaresAccordionOpen([]); // cerrar todos los accordions
    if (!auxiliaresData) return;
    const dni = auxiliaresDni.trim();
    if (!dni) return;
    // Buscar solo con cant_aprobadas_final > 0
    const found = auxiliaresData.filter(
      p => String(p.nro_documento) === dni && Number(p.cant_aprobadas_final) > 0
    );
    if (found.length === 0) {
      setAuxiliaresError('No se encontró ningún auxiliar con ese DNI y materias aprobadas.');
    } else {
      setAuxiliaresResult(found);
    }
  }
  const theme = useSystemTheme();
  // Componente helper para títulos de modales que respetan el tema del sistema
  const ModalTitle = ({ children, size = 22, inlineStyle = {} }) => (
    <h2 style={{
      fontSize: size,
      marginBottom: size === 18 ? 0 : 14,
      margin: inlineStyle.margin !== undefined ? inlineStyle.margin : (size === 18 ? 0 : 14),
      color: theme === 'dark' ? '#ffffff' : '#1976d2',
      textAlign: inlineStyle.textAlign || 'center',
      whiteSpace: inlineStyle.whiteSpace || 'normal',
      flex: inlineStyle.flex || undefined,
      ...inlineStyle
    }}>{children}</h2>
  );
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
  // Formulario para agregar actividad (debajo del calendario)
  const [form, setForm] = useState({ title: '', description: '', to: '', periodo: false });

  // Añadir actividad (soporta periodo si form.periodo === true)
  async function handleAddActivity(e) {
    if (e && e.preventDefault) e.preventDefault();
    if (!user || !selectedDate) return;
    try {
      if (form.periodo && form.to) {
        const start = new Date(selectedDate);
        const end = new Date(form.to);
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
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
    } catch (err) {
      console.error('Error agregando actividad', err);
    }
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
      const actsBase = data.map(a => ({
        id: a.id,
        title: a.titulo,
        description: a.descripcion,
        date: a.fecha_inicio ? a.fecha_inicio.slice(0, 10) : '', // yyyy-mm-dd
        user_id: a.user_id,
        username: a.username,
        is_read: false,
        is_done: false
      }));
      let acts = actsBase;
      // If user is logged, fetch flags for all activities in a single batch request
      if (user && user.id && actsBase.length > 0) {
        try {
          const ids = actsBase.map(a => a.id);
          const br = await fetch(`${API}activities/flags/batch`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: String(user.id), activityIds: ids })
          });
          const bj = await br.json();
          const flagsMap = (bj && bj.flags) || {};
          acts = actsBase.map(a => ({ ...a, is_read: !!flagsMap[a.id]?.is_read, is_done: !!flagsMap[a.id]?.is_done }));
        } catch (e) {
          console.error('Error fetching batch flags', e);
          acts = actsBase;
        }
      }
      setActivities(acts);
    } catch {
      setActivities([]);
    }
  }

  // Toggle a flag (is_read or is_done) for the current user on an activity
  async function toggleFlag(activityId, flagName) {
    if (!user) return;
    const act = activities.find(a => a.id === activityId);
    if (!act) return;
    const newFlags = { is_read: act.is_read, is_done: act.is_done };
    newFlags[flagName] = !newFlags[flagName];
    // optimistic update
    setActivities(prev => prev.map(a => a.id === activityId ? { ...a, is_read: newFlags.is_read, is_done: newFlags.is_done } : a));
    try {
      const res = await fetch(`${API}activities/${activityId}/flags`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: String(user.id), is_read: !!newFlags.is_read, is_done: !!newFlags.is_done })
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j && j.error ? j.error : 'Network error');
      // reconcile with canonical values returned by server (if provided)
      if (j && j.row) {
        setActivities(prev => prev.map(a => a.id === activityId ? { ...a, is_read: j.row.is_read, is_done: j.row.is_done } : a));
      }
    } catch (err) {
      console.error('Error toggling flag', err);
      // rollback optimistic update
      setActivities(prev => prev.map(a => a.id === activityId ? { ...a, is_read: act.is_read, is_done: act.is_done } : a));
    }
  }
  // Render
  // Construir matriz de semanas para el mes (antes de renderizar JSX)
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

  return (
    <div style={{ display: 'flex', flexDirection: 'row', height: '93vh', minHeight: 500, minWidth: '98vw', background: theme === 'dark' ? '#181a1b' : '#f7f7f7', color: theme === 'dark' ? '#f7f7f7' : '#222', overflow: 'hidden' }}>
      {/* Login arriba a la derecha */}
      <div style={{ position: 'fixed', top: 10, right: 20, zIndex: 2000 }}>
        {user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontWeight: 600, color: '#1976d2' }}>{user.username} ({user.id})</span>
            <button onClick={handleLogout} style={{ padding: '6px 10px', borderRadius: 6, border: 'none', background: '#1976d2', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>Salir</button>
          </div>
        ) : (
          <>
            <button onClick={() => setLoginModalOpen(true)} style={{ padding: '6px 12px', borderRadius: 8, border: 'none', background: '#1976d2', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', boxShadow: '0 1px 6px #0002' }}>Iniciar sesión</button>
            <Modal open={loginModalOpen} onClose={() => setLoginModalOpen(false)}>
              <div style={{ width: '100%', maxWidth: 420, margin: '0 auto' }}>
                <ModalTitle inlineStyle={{ textAlign: 'center' }}>Iniciar sesión</ModalTitle>
                <form onSubmit={async (e) => {
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
                    localStorage.setItem('user', JSON.stringify(data));
                    setLoginForm({ username: '', password: '' });
                    setLoginModalOpen(false);
                  } catch (err) {
                    setLoginError('Usuario o contraseña incorrectos');
                  }
                }} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <input
                    type="text"
                    placeholder="Usuario"
                    value={loginForm.username}
                    onChange={e => setLoginForm(f => ({ ...f, username: e.target.value }))}
                    style={{ padding: '8px 10px', borderRadius: 6, border: '1px solid #bbb', fontSize: 14 }}
                    required
                    autoFocus
                  />
                  <input
                    type="password"
                    placeholder="Contraseña"
                    value={loginForm.password}
                    onChange={e => setLoginForm(f => ({ ...f, password: e.target.value }))}
                    style={{ padding: '8px 10px', borderRadius: 6, border: '1px solid #bbb', fontSize: 14 }}
                    required
                  />
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                    <button type="submit" style={{ padding: '8px 14px', borderRadius: 6, border: 'none', background: '#1976d2', color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>Ingresar</button>
                    <button type="button" onClick={() => setLoginModalOpen(false)} style={{ padding: '8px 14px', borderRadius: 6, border: '1px solid #bbb', background: '#fff', color: '#222', cursor: 'pointer' }}>Cancelar</button>
                  </div>
                  {loginError && <div style={{ color: 'red', fontSize: 13, marginTop: 4, textAlign: 'center' }}>{loginError}</div>}
                </form>
              </div>
            </Modal>
          </>
        )}
      </div>
      {/* Calendario y form */}
      <div style={{ width: 500, minWidth: 380, maxWidth: 650, padding: 8, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', height: '100%' }}>
        {/* Bloque calendario con altura fija */}
        <div style={{ width: '100%', maxWidth: 480, height: 330, background: theme === 'dark' ? '#181a1b' : '#f7f7f7', borderRadius: 16, boxShadow: theme === 'dark' ? '0 2px 12px #0006' : '0 2px 12px #0001', padding: '8px 0 10px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', marginBottom: 18 }}>
        <h2 style={{ textAlign: 'center', fontSize: 20, marginBottom: 8 }}>Calendario {year}</h2>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: 6, gap: 8 }}>
            <button onClick={handlePrevMonth} style={{ padding: '4px 10px', fontSize: 15, borderRadius: 6, border: '1px solid #ccc', background: theme === 'dark' ? '#23272f' : '#f5f5f5', color: theme === 'dark' ? '#f7f7f7' : '#222', cursor: 'pointer', width: 120 }}>
              &lt; {months[(month + 11) % 12]}
            </button>
            <h3 style={{ margin: 0, minWidth: 120, textAlign: 'center', fontWeight: 700, fontSize: 18, width: 120 }}>{months[month]}</h3>
            <button onClick={handleNextMonth} style={{ padding: '4px 10px', fontSize: 15, borderRadius: 6, border: '1px solid #ccc', background: theme === 'dark' ? '#23272f' : '#f5f5f5', color: theme === 'dark' ? '#f7f7f7' : '#222', cursor: 'pointer', width: 120 }}>
              {months[(month + 1) % 12]} &gt;
            </button>
          </div>
          {/* calendar table */}
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
        <div style={{ width: '100%', maxWidth: 500, height: 300, background: theme === 'dark' ? '#23272f' : '#fff', borderRadius: 8, boxShadow: theme === 'dark' ? '0 1px 4px #0008' : '0 1px 4px #0001', border: '1px solid #ddd', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', overflowY: 'auto' }}>
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
            {/* Rich text editor (lifted component) */}
            <div style={{ width: '100%' }}>
              <RichEditor value={form.description} onChange={val => setForm(f => ({ ...f, description: val }))} disabled={!selectedDate || !user} theme={theme} />
            </div>
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
                    toggleFlag={toggleFlag}
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
        <div
          style={{
            width: '100%',
            display: 'flex',
            flexWrap: 'wrap',
            gap: 14,
            justifyContent: 'center',
            marginTop: 10,
            maxWidth: '100vw',
            minWidth: 320,
            boxSizing: 'border-box',
            maxHeight: 'calc(100vh - 180px)', // deja espacio para el header y paddings
            overflowY: 'auto',
          }}
        >
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
                    logTramites(arr); // TEMP: ver estructura de cada trámite
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
            { label: 'Plantillas', onClick: () => {
                setPlantillasOpen(true);
                setPlantillasLoading(true);
                setPlantillasError(null);
                // Intentar fetch remoto; si falla usar fallback. Añadimos logs para
                // ayudar a depurar problemas con la URL o la respuesta remota.
                // Load plantillas from the repo's data.json (contains consultas)
                const plantillasUrl = 'https://raw.githubusercontent.com/matnasama/buscador-de-aulas/refs/heads/main/public/json/data.json';
                console.debug('Cargando plantillas desde', plantillasUrl);
                fetch(plantillasUrl)
                  .then(res => {
                    if (!res.ok) {
                      console.error('Fetch plantillas failed', plantillasUrl, res.status);
                      setPlantillasRemoteFailed(true);
                      throw new Error('No remote');
                    }
                    return res.json();
                  })
                  .then(data => {
                    if (data && data.consultas) {
                      setPlantillasData({ consultas: data.consultas });
                    } else {
                      setPlantillasData(data);
                    }
                    setPlantillasLoading(false);
                  })
                  .catch(err => {
                    console.error('Error cargando plantillas:', err && err.message);
                    setPlantillasData(PLANTILLAS_FALLBACK);
                    setPlantillasLoading(false);
                  });
              }
            },
            { label: 'Internos', onClick: () => setInternosModalOpen(true) },
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
            { label: 'Auxiliares estudiantes', onClick: () => setAuxiliaresModalOpen(true) },
            { label: 'Enlaces', onClick: () => {
                setEnlacesModalOpen(true);
                setEnlacesLoading(true);
                setEnlacesError(null);
                fetch('https://raw.githubusercontent.com/matnasama/buscador-de-aulas/refs/heads/main/public/json/enlaces.json')
                  .then(res => res.json())
                  .then(data => {
                    setEnlacesData(data);
                    setEnlacesLoading(false);
                  })
                  .catch(() => {
                    setEnlacesError('No se pudieron cargar los enlaces');
                    setEnlacesLoading(false);
                  });
              }
            },
// ...antes del return principal, junto a los otros modales...
/* Modal Auxiliares estudiantes */
// (Colocar esto junto a los otros modales, fuera del array de cards)
// <Modal open={auxiliaresModalOpen} onClose={() => setAuxiliaresModalOpen(false)}>
//   <h2 style={{ fontSize: 22, marginBottom: 14, color: '#1976d2', textAlign: 'center' }}>Auxiliares estudiantes</h2>
//   <form onSubmit={handleBuscarAuxiliar} style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center', marginBottom: 18 }}>
//     <input
//       type="text"
//       placeholder="Buscar por DNI"
//       value={auxiliaresDni}
//       onChange={e => setAuxiliaresDni(e.target.value.replace(/[^0-9]/g, ''))}
//       style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #bbb', fontSize: 15, width: 180, textAlign: 'center' }}
//       maxLength={12}
//       required
//       autoFocus
//       disabled={auxiliaresLoading}
//     />
//     <button type="submit" style={{ padding: '6px 18px', borderRadius: 6, border: 'none', background: '#1976d2', color: '#fff', fontWeight: 700, fontSize: 15, cursor: auxiliaresLoading ? 'not-allowed' : 'pointer' }} disabled={auxiliaresLoading}>Buscar</button>
//   </form>
//   {auxiliaresLoading && <div style={{ textAlign: 'center', margin: 18 }}>Cargando...</div>}
//   {auxiliaresError && <div style={{ color: '#d32f2f', textAlign: 'center', margin: 18 }}>{auxiliaresError}</div>}
//   {auxiliaresResult && auxiliaresResult.length > 0 && (
//     <div style={{ margin: '0 auto', maxWidth: 500, background: '#e3f2fd', borderRadius: 12, padding: 18, border: '1.5px solid #1976d2', boxShadow: '0 1px 4px #1976d233' }}>
//       {auxiliaresResult.map((aux, idx) => (
//         <div key={aux.documento + '-' + idx} style={{ marginBottom: 18 }}>
//           <div style={{ fontWeight: 700, fontSize: 18, color: '#1976d2', marginBottom: 6 }}>{aux.nombre || 'Sin nombre'}</div>
//           <div style={{ fontSize: 15, color: '#333', marginBottom: 4 }}><b>DNI:</b> {aux.documento}</div>
//           <div style={{ fontSize: 15, color: '#333', marginBottom: 4 }}><b>Carrera:</b> {aux.carrera || 'Sin carrera'}</div>
//           <div style={{ fontSize: 15, color: '#333', marginBottom: 4 }}><b>Materias aprobadas:</b> {aux.cant_aprobadas_final}</div>
//         </div>
//       ))}
//     </div>
//   )}
// </Modal>
            { label: 'Exámenes Finales', onClick: () => {
                setExamenesModalOpen(true);
              }
            }
          ].map(card => (
            <div
              key={typeof card.label === 'string' ? card.label : card.label?.props?.children || Math.random()}
              style={{
                flex: '1 1 120px',
                minWidth: 100,
                maxWidth: 150,
                width: '12vw',
                height: 62,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: theme === 'dark' ? 'linear-gradient(135deg, #1565c0 60%, #1976d2 100%)' : 'linear-gradient(135deg, #42a5f5 60%, #90caf9 100%)',
                color: theme === 'dark' ? '#fff' : '#0d2346',
                borderRadius: 20,
                boxShadow: theme === 'dark' ? '0 2px 12px #0008' : '0 2px 12px #1976d233',
                fontWeight: 600,
                fontSize: 14,
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'background 0.2s, color 0.2s, box-shadow 0.2s',
                border: 'none',
                userSelect: 'none',
                letterSpacing: 1,
                marginBottom: 0,
                padding: '0 8px',
                overflow: 'hidden',
                wordBreak: 'break-word',
              }}
              tabIndex={0}
              onClick={card.onClick}
              onMouseOver={e => {
                e.currentTarget.style.background = theme === 'dark'
                  ? 'linear-gradient(135deg, #1976d2 60%, #42a5f5 100%)'
                  : 'linear-gradient(135deg, #1976d2 60%, #42a5f5 100%)';
                e.currentTarget.style.boxShadow = '0 4px 18px #1976d288';
                e.currentTarget.style.color = '#fff';
              }}
              onMouseOut={e => {
                e.currentTarget.style.background = theme === 'dark'
                  ? 'linear-gradient(135deg, #1565c0 60%, #1976d2 100%)'
                  : 'linear-gradient(135deg, #42a5f5 60%, #90caf9 100%)';
                e.currentTarget.style.boxShadow = theme === 'dark'
                  ? '0 2px 12px #0008'
                  : '0 2px 12px #1976d233';
                e.currentTarget.style.color = theme === 'dark' ? '#fff' : '#0d2346';
              }}
            >
              <span style={{ width: '100%', textAlign: 'center', lineHeight: 1.2 }}>{typeof card.label === 'string' ? card.label : card.label}</span>
            </div>
          ))}
        </div>
        {/* Modal de exámenes finales */}
        {/* Modal Auxiliares estudiantes */}
        <Modal open={auxiliaresModalOpen} onClose={() => setAuxiliaresModalOpen(false)}>
          <form
            onSubmit={handleBuscarAuxiliar}
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              gap: 14,
              justifyContent: 'center',
              width: '100%',
              maxWidth: 480,
              margin: '0 auto 18px auto',
              marginTop: 0,
              padding: 0,
              position: 'relative',
            }}
          >
              <ModalTitle size={18} inlineStyle={{ margin: 0, whiteSpace: 'nowrap', flex: '0 0 auto' }}>Auxiliares estudiantes</ModalTitle>
            <input
              type="text"
              placeholder="Buscar por DNI"
              value={auxiliaresDni}
              onChange={e => setAuxiliaresDni(e.target.value.replace(/[^0-9]/g, ''))}
              style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #bbb', fontSize: 14, width: 140, textAlign: 'center', margin: 0, flex: '0 0 140px', minWidth: 0 }}
              maxLength={12}
              required
              autoFocus
              disabled={auxiliaresLoading}
            />
            <button
              type="submit"
              style={{ padding: '6px 0', borderRadius: 6, border: 'none', background: '#1976d2', color: '#fff', fontWeight: 700, fontSize: 14, cursor: auxiliaresLoading ? 'not-allowed' : 'pointer', margin: 0, flex: '0 0 70px', minWidth: 0, width: 70 }}
              disabled={auxiliaresLoading}
            >
              Buscar
            </button>
          </form>
          {auxiliaresLoading && <div style={{ textAlign: 'center', margin: 18 }}>Cargando...</div>}
          {auxiliaresError && <div style={{ color: '#d32f2f', textAlign: 'center', margin: 18 }}>{auxiliaresError}</div>}
          {auxiliaresResult && auxiliaresResult.length > 0 && (
            <AccordionResultadosAuxiliares
              resultados={auxiliaresResult}
              accordionOpen={auxiliaresAccordionOpen}
              setAccordionOpen={setAuxiliaresAccordionOpen}
            />
          )}
        </Modal>
        {/* Modal de Enlaces (nuevo) */}
        <Modal open={enlacesModalOpen} onClose={() => setEnlacesModalOpen(false)}>
          <ModalTitle>Enlaces</ModalTitle>
          {enlacesLoading && <div style={{ textAlign: 'center', margin: 18 }}>Cargando enlaces...</div>}
          {enlacesError && <div style={{ color: '#d32f2f', textAlign: 'center', margin: 18 }}>{enlacesError}</div>}
          {!enlacesLoading && !enlacesError && enlacesData && (
            (() => {
              // Normalizar la estructura de enlaces a un array de entradas { id, nombre, links: [{ nombre, href }] }
              let entries = [];
              try {
                if (!enlacesData) entries = [];
                else if (Array.isArray(enlacesData)) {
                  // Suponemos que cada item puede ser { nombre, href } o { nombre, links: [...] }
                  entries = enlacesData.map((v, i) => {
                    if (!v) return null;
                    if (v.links && Array.isArray(v.links)) {
                      return { id: v.id || String(i), nombre: v.nombre || v.title || String(i), links: v.links.map(l => (typeof l === 'string' ? { nombre: l, href: l } : { nombre: l.nombre || l.title || l.url || l.href || l.label || l.text || l.nombre || l, href: l.url || l.href || l.value || l })) };
                    }
                    if (v.href || v.url) {
                      return { id: v.id || String(i), nombre: v.nombre || v.title || v.url || v.href || String(i), links: [{ nombre: v.nombre || v.title || v.url || v.href || String(i), href: v.href || v.url || v }] };
                    }
                    // Fallback: stringify
                    return { id: v.id || String(i), nombre: v.nombre || v.title || String(i), links: [{ nombre: String(v), href: String(v) }] };
                  }).filter(Boolean);
                } else if (typeof enlacesData === 'object') {
                  entries = Object.keys(enlacesData).map(k => {
                    const v = enlacesData[k];
                    if (v == null) return null;
                    // Si es array de links
                    if (Array.isArray(v)) {
                      return { id: k, nombre: k, links: v.map(l => (typeof l === 'string' ? { nombre: l, href: l } : { nombre: l.nombre || l.title || l.url || l.href || l.label || l.text || l.nombre || l, href: l.url || l.href || l.value || l })) };
                    }
                    // Si es objeto con campos conocidos
                    if (typeof v === 'object') {
                      // Si tiene campo links/enlaces/urls
                      const list = v.links || v.enlaces || v.urls || v.items;
                      if (Array.isArray(list)) {
                        return { id: k, nombre: v.nombre || v.title || k, links: list.map(l => (typeof l === 'string' ? { nombre: l, href: l } : { nombre: l.nombre || l.title || l.url || l.href || l.label || l.text || l.nombre || l, href: l.url || l.href || l.value || l })) };
                      }
                      // Si tiene url/href
                      if (v.url || v.href) {
                        return { id: k, nombre: v.nombre || v.title || k, links: [{ nombre: v.nombre || v.title || v.url || v.href || k, href: v.url || v.href }] };
                      }
                      // Fallback: try to convert object to a single link
                      return { id: k, nombre: v.nombre || v.title || k, links: [{ nombre: String(v), href: '' }] };
                    }
                    // Si es string
                    return { id: k, nombre: k, links: [{ nombre: v, href: v }] };
                  }).filter(Boolean);
                }
              } catch (e) {
                entries = [];
              }

              if (!entries || entries.length === 0) {
                return <div style={{ color: '#888', textAlign: 'center', margin: 18 }}>No se encontraron enlaces.</div>;
              }

              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', maxWidth: 760, margin: '0 auto' }}>
                  {entries.map(en => {
                    const id = en.id || (en.nombre || Math.random()).toString();
                    // Preferir 'sitios' si existe, sino 'links'
                    const sitios = Array.isArray(en.sitios) ? en.sitios : (Array.isArray(en.links) ? en.links : []);
                    if (!sitios || sitios.length === 0) return null;
                    return (
                      <div key={id} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {sitios.map((s, idx) => {
                          const href = typeof s === 'string' ? s : (s.href || s.url || s.value || '');
                          const label = typeof s === 'string' ? s : (s.nombre || s.title || s.label || s.text || href || 'Enlace');
                          return (
                            <a
                              key={idx}
                              href={href || '#'}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                display: 'block',
                                background: theme === 'dark' ? '#1f2937' : '#ffffff',
                                color: theme === 'dark' ? '#cfe8ff' : '#0d47a1',
                                padding: '8px 10px',
                                borderRadius: 8,
                                textDecoration: 'none',
                                fontWeight: 700,
                                textAlign: 'left',
                                border: theme === 'dark' ? '1px solid #2b3946' : '1px solid #dbe9ff',
                                boxShadow: theme === 'dark' ? '0 1px 6px #0005' : '0 1px 6px #1976d222',
                                transition: 'transform 0.08s ease, box-shadow 0.12s ease',
                                cursor: 'pointer'
                              }}
                              onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = theme === 'dark' ? '0 8px 24px #0009' : '0 8px 24px #1976d233'; }}
                              onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = theme === 'dark' ? '0 1px 6px #0005' : '0 1px 6px #1976d222'; }}
                            >
                              {label}
                            </a>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              );
            })()
          )}
        </Modal>
        {/* Modal de Internos */}
        <Modal open={internosModalOpen} onClose={() => setInternosModalOpen(false)}>
          <div
            style={{
              position: 'sticky',
              top: 0,
              zIndex: 2,
              background: theme === 'dark' ? '#23272f' : '#fff',
              paddingBottom: 10,
              marginBottom: 10,
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              gap: 16,
              justifyContent: 'center',
              width: '100%',
              maxWidth: 480,
              margin: '0 auto 10px auto',
              minWidth: 0,
              flexWrap: 'nowrap',
              
            }}
          >
            <ModalTitle size={18} inlineStyle={{ margin: 0, whiteSpace: 'nowrap', flex: '0 0 auto' }}>Internos</ModalTitle>
            <input
              type="text"
              placeholder="Buscar por área o usuario"
              value={internosFiltro}
              onChange={e => setInternosFiltro(e.target.value)}
              style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #bbb', fontSize: 13, width: 180, textAlign: 'center', background: theme === 'dark' ? '#181a1b' : '#fff', color: theme === 'dark' ? '#fff' : '#222', margin: 0, flex: '0 0 160px', minWidth: 0 }}
              autoFocus
              disabled={internosLoading}
            />
          </div>
          <div
            style={{
              maxHeight: '65vh',
              overflowY: 'auto',
              paddingTop: 2,
              scrollbarWidth: 'thin',
              scrollbarColor: theme === 'dark' ? '#1976d2bb #23272f' : '#1976d2 #e3f2fd',
            }}
            className="scrollbar-internos"
          >
        {/* Estilos para la barra de scroll del listado de internos */}
        <style>{`
          .scrollbar-internos::-webkit-scrollbar {
            width: 8px;
            background: transparent;
          }
          .scrollbar-internos::-webkit-scrollbar-thumb {
            background: ${'${theme === "dark" ? "#1976d2bb" : "#1976d2"}'};
            border-radius: 6px;
            border: 2px solid ${'${theme === "dark" ? "#23272f" : "#e3f2fd"}'};
            min-height: 24px;
          }
          .scrollbar-internos::-webkit-scrollbar-thumb:hover {
            background: ${'${theme === "dark" ? "#42a5f5cc" : "#42a5f5"}'};
          }
          .scrollbar-internos::-webkit-scrollbar-track {
            background: transparent;
          }
        `}</style>
            {internosLoading && <div style={{ textAlign: 'center', margin: 18 }}>Cargando...</div>}
            {internosError && <div style={{ color: '#d32f2f', textAlign: 'center', margin: 18 }}>{internosError}</div>}
            {!internosLoading && !internosError && internosFiltrados && internosFiltrados.length > 0 && (
              <table
                style={{
                  width: '100%',
                  maxWidth: 600,
                  margin: 'auto',
                  borderCollapse: 'collapse',
                  background: theme === 'dark' ? '#23272f' : '#e3f2fd',
                  borderRadius: 12,
                  boxShadow: theme === 'dark' ? '0 1px 4px #0008' : '0 1px 4px #1976d233',
                  fontSize: 15,
                  color: theme === 'dark' ? '#fff' : '#222',
                }}
              >
                <thead>
                  <tr style={{ background: theme === 'dark' ? '#1976d2' : '#1976d2', color: '#fff' }}>
                    <th style={{ padding: 8, borderRadius: '12px 0 0 0' }}>Área</th>
                    <th style={{ padding: 8 }}>Usuario</th>
                    <th style={{ padding: 8, borderRadius: '0 12px 0 0' }}>Interno</th>
                  </tr>
                </thead>
                <tbody>
                  {internosFiltrados.map((i, idx) => (
                    <tr key={idx} style={{ background: theme === 'dark' ? (idx % 2 === 0 ? '#181a1b' : '#23272f') : (idx % 2 === 0 ? '#fff' : '#e3f2fd') }}>
                      <td style={{ padding: 8, color: theme === 'dark' ? '#fff' : '#222' }}>{i.area}</td>
                      <td style={{ padding: 8, color: theme === 'dark' ? '#fff' : '#222' }}>{i.usuario}</td>
                      <td style={{ padding: 8, color: theme === 'dark' ? '#fff' : '#222' }}>{i.interno}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {!internosLoading && !internosError && internosFiltrados && internosFiltrados.length === 0 && (
              <div style={{ color: '#888', textAlign: 'center', margin: 18 }}>No se encontraron internos.</div>
            )}
          </div>
        </Modal>
        <Modal open={examenesModalOpen} onClose={() => setExamenesModalOpen(false)}>
          <ModalTitle>Exámenes Finales</ModalTitle>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18, width: '100%', maxWidth: 600, margin: 'auto' }}>
            {/* Botón DCAYT */}
            <a
              href="https://docs.google.com/spreadsheets/u/2/d/e/2PACX-1vSSs7PbwGNijblVEd7VzY0YCgd4vAzAr8ZJtZMHAPtxkVFxYzRON50pBVhxvJwRzg/pubhtml?gid=1276171040&single=true&urp=gmail_link"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                background: '#42a5f5',
                borderRadius: 8,
                border: '2px solid #1976d2',
                padding: '22px 0',
                fontWeight: 'normal',
                fontSize: 18,
                color: '#fff',
                textAlign: 'center',
                textDecoration: 'none',
                width: '100%',
                maxWidth: 420,
                minWidth: 220,
                marginBottom: 0,
                display: 'block',
                boxShadow: '0 2px 12px #1976d233',
                transition: 'background 0.2s, color 0.2s, box-shadow 0.2s',
                cursor: 'pointer',
                letterSpacing: 0.5,
                marginLeft: 'auto',
                marginRight: 'auto',
                textTransform: 'uppercase',
              }}
            >
              Departamento de Ciencias Aplicadas y Tecnología
            </a>
            {/* Botón DCEyJ */}
            <a
              href="https://docs.google.com/spreadsheets/u/2/d/e/2PACX-1vSSs7PbwGNijblVEd7VzY0YCgd4vAzAr8ZJtZMHAPtxkVFxYzRON50pBVhxvJwRzg/pubhtml?gid=258106575&single=true&urp=gmail_link"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                background: '#006400',
                borderRadius: 8,
                border: '2px solid #1976d2',
                padding: '22px 0',
                fontWeight: 'normal',
                fontSize: 18,
                color: '#fff',
                textAlign: 'center',
                textDecoration: 'none',
                width: '100%',
                maxWidth: 420,
                minWidth: 220,
                marginBottom: 0,
                display: 'block',
                boxShadow: '0 2px 12px #1976d233',
                transition: 'background 0.2s, color 0.2s, box-shadow 0.2s',
                cursor: 'pointer',
                letterSpacing: 0.5,
                marginLeft: 'auto',
                marginRight: 'auto',
                textTransform: 'uppercase',
              }}
            >
              Departamento de Ciencias Económicas y Jurídicas
            </a>
            {/* Botón DHYCS */}
            <a
              href="https://docs.google.com/spreadsheets/u/2/d/e/2PACX-1vSSs7PbwGNijblVEd7VzY0YCgd4vAzAr8ZJtZMHAPtxkVFxYzRON50pBVhxvJwRzg/pubhtml?gid=1874348986&single=true&urp=gmail_link"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                background: '#f44336',
                borderRadius: 8,
                border: '2px solid #1976d2',
                padding: '22px 0',
                fontWeight: 'normal',
                fontSize: 18,
                color: '#fff',
                textAlign: 'center',
                textDecoration: 'none',
                width: '100%',
                maxWidth: 420,
                minWidth: 220,
                marginBottom: 0,
                display: 'block',
                boxShadow: '0 2px 12px #1976d233',
                transition: 'background 0.2s, color 0.2s, box-shadow 0.2s',
                cursor: 'pointer',
                letterSpacing: 0.5,
                marginLeft: 'auto',
                marginRight: 'auto',
                textTransform: 'uppercase',
              }}
            >
              Departamento de Humanidades y Ciencias Sociales
            </a>
          </div>
        </Modal>
        {/* Modal de formularios */}
        <Modal open={formulariosOpen} onClose={() => setFormulariosOpen(false)}>
          <ModalTitle inlineStyle={{ textAlign: 'center' }}>Formularios</ModalTitle>
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
                                  height: 140, /* ligeramente más pequeña */
                                  minWidth: 0,
                                  width: '100%',
                                  maxWidth: 150, /* reducir ancho máximo */
                                  background: '#e3f2fd',
                                  color: '#000000ff',
                                  fontWeight: 500,
                                  fontSize: 13, /* reducir tamaño de fuente */
                                  textAlign: 'center',
                                  textDecoration: 'none',
                                  borderRadius: 10,
                                  boxShadow: '0 1px 4px #1976d233',
                                  border: '1.5px solid #1976d2',
                                  transition: 'background 0.2s, color 0.2s, box-shadow 0.2s',
                                  cursor: 'pointer',
                                  letterSpacing: 0.4,
                                  padding: '8px 6px', /* menos padding */
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
        {/* Modal de Plantillas (antes Consultas) */}
  <Modal open={plantillasOpen} onClose={() => { setPlantillasOpen(false); setPlantillaSelected(null); }} width={'75vw'} maxWidth={1200} minWidth={520}>
          <ModalTitle inlineStyle={{ textAlign: 'center' }}>Plantillas</ModalTitle>
          {plantillasLoading && <div style={{ textAlign: 'center', margin: 18 }}>Cargando plantillas...</div>}
          {plantillasError && <div style={{ color: '#d32f2f', textAlign: 'center', margin: 18 }}>{plantillasError}</div>}
          {!plantillasLoading && !plantillasError && plantillasData && (
            (() => {
              // Normalizar plantillasData para soportar varios formatos:
              let items = [];
              try {
                if (!plantillasData) items = [];
                else if (Array.isArray(plantillasData)) items = plantillasData;
                else if (Array.isArray(plantillasData.consultas)) items = plantillasData.consultas;
                else if (plantillasData.consultas && typeof plantillasData.consultas === 'object') {
                  items = Object.keys(plantillasData.consultas).map(k => plantillasData.consultas[k]);
                } else {
                  const keys = Object.keys(plantillasData).filter(k => k !== 'meta' && k !== 'info');
                  if (keys.length > 0 && keys.every(k => plantillasData[k] && plantillasData[k].nombre)) {
                    items = keys.map(k => plantillasData[k]);
                  }
                }
              } catch (e) {
                items = [];
              }
              const byId = {};
              items.forEach(it => {
                if (!it) return;
                const id = it.id != null ? String(it.id) : (it.nombre || Math.random());
                if (!byId[id]) byId[id] = it;
              });
              items = Object.values(byId).filter(Boolean);
              items.sort((a, b) => (Number(a.id) || 0) - (Number(b.id) || 0));

              // Ahora el modal sólo renderiza los botones; al hacer click se abre una burbuja (tooltip/card)
              // Usaremos refs para posicionar la burbuja relativa al botón.
              const [bubble, setBubble] = [plantillaSelected, setPlantillaSelected];
              return (
                <div ref={containerRef} style={{ position: 'relative', width: '100%', maxWidth: 1200, margin: '0 auto' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 10, maxHeight: '85vh', overflowY: 'auto', padding: 8 }}>
                    {items.map(it => {
                      const selected = plantillaSelected && plantillaSelected.id === it.id;
                      const bg = selected ? (theme === 'dark' ? '#1976d2' : '#1976d2') : (theme === 'dark' ? '#1e2936' : '#e3f2fd');
                      const color = selected ? '#fff' : (theme === 'dark' ? '#f7f7f7' : '#0d2346');
                      return (
                        <div key={it.id || it.nombre} style={{ position: 'relative' }}>
                          <button
                            onClick={() => {
                              // Seleccionar y mostrar burbuja centrada en el modal
                              setPlantillaSelected(it);
                            }}
                            title={it.nombre}
                            style={{ padding: '6px 8px', minHeight: 44, borderRadius: 8, border: '1px solid ' + (selected ? (theme === 'dark' ? '#0b3a66' : '#0b3a66') : '#1976d2'), background: bg, color, cursor: 'pointer', textAlign: 'left', fontSize: 11, overflow: 'visible', whiteSpace: 'normal', lineHeight: 1.2, boxShadow: selected ? '0 6px 20px rgba(25,118,210,0.28)' : 'none', width: '100%' }}>
                            {it.nombre}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                  {/* Burbuja centrada con overlay para cerrar al click fuera */}
                  {plantillaSelected && (
                    <>
                      <div
                        onClick={() => setPlantillaSelected(null)}
                        style={{ position: 'fixed', left: 0, top: 0, width: '100vw', height: '100vh', zIndex: 1100, background: 'transparent'}}
                      />
                      <div
                        onClick={e => e.stopPropagation()}
                        style={{
                          position: 'fixed',
                          left: '50%',
                          top: '50%',
                          transform: 'translate(-50%, -50%)',
                          width: 'auto',
                          maxWidth: bubbleMaxWidth || '920px',
                          zIndex: 1200
                        }}
                      >
                        <div style={{ background: theme === 'dark' ? '#1e2530' : '#fff', color: theme === 'dark' ? '#fff' : '#222', border: '1px solid #ddd', borderRadius: 10, padding: '14px 15px', boxShadow: '0 12px 36px rgba(0,0,0,0.2)', maxHeight: '90vh', overflowY: 'auto', boxSizing: 'border-box' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                            <div style={{ fontWeight: 700, color: theme === 'dark' ? '#fff' : '#1976d2', textAlign: 'left', width: '100%' }}>{plantillaSelected.nombre}</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <button
                                onClick={async () => {
                                  try {
                                    // Construir texto: descripción y enlaces (no incluir el título)
                                    let text = (plantillaSelected.descripcion || '').trim();
                                    if (plantillaSelected.url) {
                                      text += (text ? '\n\n' : '') + plantillaSelected.url;
                                    }
                                    // Soportar si hay más de un link (campo urls hipotético)
                                    if (plantillaSelected.urls && Array.isArray(plantillaSelected.urls)) {
                                      plantillaSelected.urls.forEach(u => { text += '\n' + u; });
                                    }
                                    await navigator.clipboard.writeText(text);
                                    setPlantillaCopyFeedback('Copiado');
                                    setTimeout(() => setPlantillaCopyFeedback(''), 1500);
                                  } catch (e) {
                                    setPlantillaCopyFeedback('Error');
                                    setTimeout(() => setPlantillaCopyFeedback(''), 1500);
                                  }
                                }}
                                title="Copiar descripción y enlaces"
                                style={{ border: 'none', background: '#1976d2', color: '#fff', padding: '6px 10px', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}
                              >
                                {plantillaCopyFeedback || 'Copiar'}
                              </button>
                              <button onClick={() => setPlantillaSelected(null)} style={{ border: 'none', background: 'transparent', color: '#888', cursor: 'pointer' }}>✕</button>
                            </div>
                          </div>
                          <div style={{ marginTop: 10, whiteSpace: 'pre-wrap', color: theme === 'dark' ? '#f1f1f1' : '#222', textAlign: 'left' }}>{plantillaSelected.descripcion}</div>
                          {plantillaSelected.url && (
                            <div style={{ marginTop: 10, textAlign: 'left' }}>
                              <a href={plantillaSelected.url} target="_blank" rel="noopener noreferrer" style={{ color: '#1976d2' }}>{plantillaSelected.url}</a>
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              );
            })()
          )}
        </Modal>
        {/* Modal de trámites (layout fila, key robusta) */}
        <Modal open={tramitesOpen} onClose={() => setTramitesOpen(false)}>
          <ModalTitle>Trámites</ModalTitle>
          {tramitesLoading && <div style={{ textAlign: 'center', margin: 14 }}>Cargando...</div>}
          {tramitesError && <div style={{ color: '#d32f2f', textAlign: 'center', margin: 14 }}>{tramitesError}</div>}
          {!tramitesLoading && !tramitesError && tramites && tramites.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', maxWidth: 600, margin: 'auto' }}>
              {tramites.map((t, idx) => (
                <div key={(t.titulo || t.nombre || 'tramite') + '-' + idx} style={{ background: '#e3f2fd', borderRadius: 12, border: '1.2px solid #1976d2', padding: '4px 8px', fontSize: 14, color: '#1976d2', display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <div style={{ fontWeight: 700, fontSize: 15, marginRight: 18, flex: 1, textAlign: 'left', textTransform: 'uppercase' }}>{(t.titulo || t.nombre || 'Trámite')}
                  </div>
                  <div style={{ display: 'flex', gap: 5, marginLeft: 'auto' }}>
                    {t.formulario && (
                      <a href={t.formulario} target="_blank" rel="noopener noreferrer" style={{ background: '#1976d2', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 14px', fontWeight: 600, fontSize: 13, textDecoration: 'none', cursor: 'pointer', letterSpacing: 0.5, transition: 'background 0.2s, color 0.2s' }}>Formulario</a>
                    )}
                    {t.hoja_de_calculo && (
                      <a href={t.hoja_de_calculo} target="_blank" rel="noopener noreferrer" style={{ background: '#fff', color: '#1976d2', border: '1.2px solid #1976d2', borderRadius: 8, padding: '8px 18px', fontWeight: 600, fontSize: 13, textDecoration: 'none', cursor: 'pointer', letterSpacing: 0.5, transition: 'background 0.2s, color 0.2s' }}>Ver trámite</a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Modal>
        {/* Modal de grillas de cursada */}
        <Modal open={grillasModalOpen} onClose={() => setGrillasModalOpen(false)}>
          <ModalTitle>Grillas de cursada</ModalTitle>
          {grillasModalLoading && <div style={{ textAlign: 'center', margin: 18 }}>Cargando...</div>}
          {grillasModalError && <div style={{ color: '#d32f2f', textAlign: 'center', margin: 18 }}>{grillasModalError}</div>}
          {!grillasModalLoading && !grillasModalError && grillasModalData && grillasModalData.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18, width: '100%', maxWidth: 600, margin: 'auto' }}>
              {grillasModalData.map((g, idx) => {
                let nombreDepto = '';
                let colorFondo = '';
                let colorTexto = '#fff';
                if (/dcayt/i.test(g.nombre)) {
                  nombreDepto = 'Departamento de Ciencias Aplicadas y Tecnología';
                  colorFondo = '#42a5f5';
                } else if (/dceyj/i.test(g.nombre)) {
                  nombreDepto = 'Departamento de Ciencias Económicas y Jurídicas';
                  colorFondo = '#006400';
                } else if (/dhycs/i.test(g.nombre)) {
                  nombreDepto = 'Departamento de Humanidades y Ciencias Sociales';
                  colorFondo = '#f44336';
                } else {
                  nombreDepto = g.nombre;
                  colorFondo = 'linear-gradient(120deg, #e3f2fd 60%, #bbdefb 100%)';
                  colorTexto = '#1976d2';
                }
                // Capitalizar la palabra Grilla
                let nombreGrilla = g.nombre.replace(/grilla/gi, m => m.charAt(0).toUpperCase() + m.slice(1).toLowerCase());
                // Si el nombreDepto es distinto al nombre original, usarlo
                let label = nombreDepto !== g.nombre ? nombreDepto : nombreGrilla;
                return (
                  <a
                    key={(g.url ? g.url : 'grilla') + '-' + idx}
                    href={g.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      background: colorFondo,
                      borderRadius: 8,
                      border: '2px solid #1976d2',
                      padding: '22px 0',
                      fontWeight: 'normal',
                      fontSize: 18,
                      color: colorTexto,
                      textAlign: 'center',
                      textDecoration: 'none',
                      width: '100%',
                      maxWidth: 420,
                      minWidth: 220,
                      marginBottom: 0,
                      display: 'block',
                      boxShadow: '0 2px 12px #1976d233',
                      transition: 'background 0.2s, color 0.2s, box-shadow 0.2s',
                      cursor: 'pointer',
                      letterSpacing: 0.5,
                      marginLeft: 'auto',
                      marginRight: 'auto'
                    }}
                  >
                    {label.toUpperCase()}
                  </a>
                );
              })}
            </div>
          )}
        </Modal>
        {/* Modal para historial de versiones */}
        <Modal open={historyModalOpen} onClose={() => setHistoryModalOpen(false)}>
          <ModalTitle>Historial de versiones.</ModalTitle>
          {historyLoading && <div style={{ textAlign: 'center', margin: 18 }}>Cargando...</div>}
          {historyError && <div style={{ color: '#d32f2f', textAlign: 'center', margin: 18 }}>{historyError}</div>}
          {!historyLoading && !historyError && historyData && historyData.length > 0 && (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {historyData.map((h, idx) => (
                <li key={h.id} style={{ background: h.is_active ? '#e3f2fd' : '#eee', borderRadius: 8, marginBottom: 10, padding: 12, border: h.is_active ? '2px solid #1976d2' : '1px solid #bbb' }}>
                  <div style={{ fontWeight: 700, color: '#1976d2', fontSize: 16 }}>{h.titulo}</div>
                  <div style={{ fontSize: 14, color: '#333', marginBottom: 4 }} dangerouslySetInnerHTML={{ __html: ensureLinksOpenInBlank(h.descripcion || '') }} />
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
function AccordionItem({ act, theme, editingId, editForm, handleStartEdit, handleDeleteActivity, handleCancelEdit, handleSaveEdit, setEditForm, selectedDate, activities, user, handleSaveEditActivity, handleShowHistory, toggleFlag }) {
  const [open, setOpen] = useState(false);
  const isEditing = editingId === act.id;
  return (
    <li style={{ marginBottom: 10, borderRadius: 6, background: theme === 'dark' ? '#23272f' : '#fff', boxShadow: theme === 'dark' ? '0 1px 4px #0008' : '0 1px 4px #0001', overflow: 'hidden', border: '1px solid #ddd', position: 'relative', minHeight: 80 }}>
      <button
        onClick={() => {
          setOpen(o => !o);
          if (!isEditing && !open) {
            setEditForm({ title: act.title, description: act.description });
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
              <RichEditor
                value={editForm.description}
                onChange={val => setEditForm(f => ({ ...f, description: val }))}
                disabled={!user}
                theme={theme}
              />
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button type="submit" style={{ background: '#1976d2', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 18px', fontWeight: 700, fontSize: 15, cursor: user ? 'pointer' : 'not-allowed' }} disabled={!user}>Guardar</button>
                <button type="button" onClick={handleCancelEdit} style={{ background: '#eee', color: '#222', border: 'none', borderRadius: 6, padding: '6px 18px', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>Cancelar</button>
              </div>
            </form>
          ) : (
            <>
              <div style={{ wordBreak: 'break-word', overflowWrap: 'break-word', minWidth: 0 }} dangerouslySetInnerHTML={{ __html: ensureLinksOpenInBlank(act.description || '') }} />
              
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
                  {/* Botones para marcar como hecho / leido */}
                  <button onClick={() => toggleFlag && toggleFlag(act.id, 'is_done')} title={act.is_done ? 'Marcar como no hecho' : 'Marcar como hecho'} style={{ background: act.is_done ? '#4caf50' : 'none', color: act.is_done ? '#fff' : '#1976d2', border: 'none', padding: '6px 8px', borderRadius: 6, cursor: 'pointer', fontWeight: 700 }}>
                    {act.is_done ? '✓ Hecho' : 'Hecho'}
                  </button>
                  <button onClick={() => toggleFlag && toggleFlag(act.id, 'is_read')} title={act.is_read ? 'Marcar como no leído' : 'Marcar como leído'} style={{ background: act.is_read ? '#1976d2' : 'none', color: act.is_read ? '#fff' : '#1976d2', border: `1px solid ${act.is_read ? '#1976d2' : '#1976d2'}`, padding: '6px 8px', borderRadius: 6, cursor: 'pointer', fontWeight: 700 }}>
                    {act.is_read ? '✓ Leído' : 'Leído'}
                  </button>
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
  );
}

