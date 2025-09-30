// Lightweight logger for tramites. It logs only when DEBUG is enabled.
const ENABLE_LOGS = (typeof process !== 'undefined' && process.env && process.env.REACT_APP_DEBUG_LOGS === 'true') || (typeof process !== 'undefined' && process.env && process.env.NODE_ENV !== 'production');

export function logTramites(tramites) {
  if (!ENABLE_LOGS) return;
  if (!Array.isArray(tramites)) {
    console.debug && console.debug('Trámites no es un array:', tramites);
    return;
  }
  tramites.forEach((t, i) => {
    console.debug && console.debug(`Trámite #${i}:`, t);
  });
}
