import React, { useState } from 'react';

function formatFecha(fecha) {
  if (!fecha || typeof fecha !== 'string') return '-';
  // Soporta formatos AAAA-MM-DD, YYYY/MM/DD, etc.
  const match = fecha.match(/(\d{4})[-\/]?(\d{2})[-\/]?(\d{2})/);
  if (match) {
    return `${match[3]}/${match[2]}/${match[1]}`;
  }
  // Si ya está en formato DDMMAAAA o no matchea, devolver tal cual
  return fecha;
}

export default AccordionResultadosAuxiliares;

function AccordionResultadosAuxiliares({ resultados }) {
  const [openIdx, setOpenIdx] = useState(-1);
  const isControlled = typeof accordionOpen !== 'undefined' && typeof setAccordionOpen === 'function';
  const open = isControlled ? accordionOpen : [openIdx];
  const setOpen = isControlled ? setAccordionOpen : idxArr => {
    if (Array.isArray(idxArr)) setOpenIdx(idxArr[0] ?? -1);
    else setOpenIdx(idxArr);
  };
  return (
    <div style={{ margin: '0 auto', maxWidth: 600, background: '#e3f2fd', borderRadius: 12, padding: 18, border: '1.5px solid #1976d2', boxShadow: '0 1px 4px #1976d233' }}>
      {resultados.map((aux, idx) => (
        <div key={aux.nro_documento + '-' + idx} style={{ marginBottom: 12 }}>
          <button
            style={{
              width: '100%',
              textAlign: 'left',
              background: '#1976d2',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              padding: '10px 16px',
              fontWeight: 700,
              fontSize: 14,
              cursor: 'pointer',
              marginBottom: 4
            }}
                onClick={() => {
                  if (isControlled) {
                    if (open.includes(idx)) setOpen([]);
                    else setOpen([idx]);
                  } else {
                    setOpenIdx(openIdx === idx ? -1 : idx);
                  }
                }}
            aria-expanded={openIdx === idx}
          >
            {aux.carrera || 'Sin carrera'}
          </button>
              {(isControlled ? open.includes(idx) : openIdx === idx) && (
            <div style={{ background: '#fff', borderRadius: 8, padding: '14px 16px', border: '1px solid #1976d2', marginTop: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 18, color: '#1976d2', marginBottom: 6 }}>{aux.apellido || ''}, {aux.nombres || ''}</div>
              <div style={{ fontSize: 14, color: '#333', marginBottom: 4 }}><b>DNI:</b> {aux.nro_documento}</div>
              <div style={{ fontSize: 14, color: '#333', marginBottom: 4 }}><b>Fecha nacimiento:</b> {formatFecha(aux.fecha_nacimiento)}</div>
              <div style={{ fontSize: 14, color: '#333', marginBottom: 4 }}><b>Carrera:</b> {aux.carrera || '-'}</div>
              <div style={{ fontSize: 14, color: '#333', marginBottom: 4 }}><b>Cohorte:</b> {aux.cohorte || '-'}</div>
              <div style={{ fontSize: 14, color: '#333', marginBottom: 4 }}><b>Fecha egreso:</b> {formatFecha(aux.fecha_egreso)}</div>
              <div style={{ fontSize: 14, color: '#333', marginBottom: 4 }}><b>Estado trámite:</b> {aux.estado_tramite_desc || '-'}</div>
              <div style={{ fontSize: 14, color: '#333', marginBottom: 4 }}><b>Promedio con aplazos:</b> {aux.cnt_promedio_con_aplazos ?? '-'}</div>
              <div style={{ fontSize: 14, color: '#333', marginBottom: 4 }}><b>Promedio sin aplazos:</b> {aux.cnt_promedio_sin_aplazos ?? '-'}</div>
              <div style={{ fontSize: 14, color: '#333', marginBottom: 4 }}><b>Orientación elegida:</b> {aux.orientacion_elegida || '-'}</div>
              <div style={{ fontSize: 14, color: '#333', marginBottom: 4 }}><b>Certificado:</b> {aux.certificado || '-'}</div>
              <div style={{ fontSize: 14, color: '#333', marginBottom: 4 }}><b>Porcentaje avance final:</b> {aux.porcentaje_avance_final ?? '-'}</div>
              <div style={{ fontSize: 14, color: '#333', marginBottom: 4 }}><b>Materias aprobadas:</b> {aux.cant_aprobadas_final ?? '-'}</div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
