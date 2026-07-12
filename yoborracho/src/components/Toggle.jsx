// Medidas en px, resueltas a mano con estilos inline (no clases de Tailwind).
// Motivo: este componente venía mostrando el círculo desalineado/fuera de la
// barra en el entorno del usuario de forma persistente pese a que la clase
// Tailwind equivalente era matemáticamente correcta — la sospecha es una
// combinación de caché de Vite/Docker sobre una carpeta sincronizada por
// OneDrive. Con estilos inline no depende de que Tailwind genere/purge la
// clase correcta ni de ningún build intermedio: el navegador la interpreta
// directo, así que si esto sigue viéndose mal, el bundle servido no es el
// que está en este archivo (haría falta un restart/rebuild del contenedor).
const TRACK_W = 44
const TRACK_H = 24
const THUMB = 16
const PAD = (TRACK_H - THUMB) / 2 // 4px de margen arriba/abajo y en el extremo "apagado"

export default function Toggle({ checked, onChange }) {
  return (
    <button
      type="button"
      onClick={onChange}
      aria-pressed={checked}
      style={{
        width: TRACK_W,
        height: TRACK_H,
        borderRadius: TRACK_H / 2,
        position: 'relative',
        display: 'block',
        flexShrink: 0,
        border: 'none',
        padding: 0,
        margin: 0,
        cursor: 'pointer',
        backgroundColor: checked ? '#2E75B6' : '#26262C',
        transition: 'background-color 0.15s ease',
      }}
    >
      <span
        style={{
          position: 'absolute',
          top: PAD,
          left: PAD,
          width: THUMB,
          height: THUMB,
          borderRadius: 9999,
          backgroundColor: '#ffffff',
          boxShadow: '0 1px 2px rgba(0,0,0,0.35)',
          transform: `translateX(${checked ? TRACK_W - THUMB - PAD * 2 : 0}px)`,
          transition: 'transform 0.15s ease',
        }}
      />
    </button>
  )
}
