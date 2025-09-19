// Script para inspeccionar la estructura de los trámites recibidos
export function logTramites(tramites) {
  if (!Array.isArray(tramites)) {
    console.log('Trámites no es un array:', tramites);
    return;
  }
  tramites.forEach((t, i) => {
    console.log(`Trámite #${i}:`, t);
  });
}
