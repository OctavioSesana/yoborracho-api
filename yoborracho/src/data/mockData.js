// Etiquetas estáticas para el formulario de calificación (no son datos de
// usuario ni datos de prueba — son la configuración fija de qué criterios se
// preguntan al calificar, iguales para todos).
//
// Antes este archivo tenía datos mock de usuarios, viajes, notificaciones,
// contactos y ganancias que se usaban en el prototipo inicial (sin backend).
// Ya no se usan: todas esas pantallas ahora traen datos reales de la API
// (ver src/api/client.js) y se eliminaron de acá.

export const CRITERIOS_USUARIO_CALIFICA = [
  { key: 'manejoDefensivo', label: 'Manejo defensivo' },
  { key: 'puntualidad', label: 'Puntualidad' },
  { key: 'trato', label: 'Trato respetuoso' },
  { key: 'estadoAuto', label: 'Estado del auto al llegar' },
]

export const CRITERIOS_CONDUCTOR_CALIFICA = [
  { key: 'comportamiento', label: 'Comportamiento' },
  { key: 'estadoInterior', label: 'Estado interior del auto al retirar' },
  { key: 'disponibilidad', label: 'Disponibilidad' },
  { key: 'infoCorrecta', label: 'Información correcta' },
]
