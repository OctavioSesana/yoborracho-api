// Configuración compartida para @react-google-maps/api.
// Usar el mismo `id` y el mismo array de `libraries` (misma referencia) en
// todos los componentes que carguen el script evita que la librería intente
// inyectar el script de Google Maps más de una vez.

export const GOOGLE_MAPS_SCRIPT_ID = 'yoborracho-google-maps-script'
export const GOOGLE_MAPS_LIBRARIES = ['places']

// Rosario, Argentina — ciudad de lanzamiento del producto.
export const ROSARIO_CENTER = { lat: -32.9468, lng: -60.6393 }
