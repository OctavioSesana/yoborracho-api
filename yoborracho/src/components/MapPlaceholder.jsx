export default function MapPlaceholder({ height = 'h-56', children }) {
  return (
    <div
      className={`relative w-full ${height} rounded-xl overflow-hidden border border-subtle bg-surface-2`}
    >
      <svg className="absolute inset-0 w-full h-full opacity-20" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="grid" width="24" height="24" patternUnits="userSpaceOnUse">
            <path d="M 24 0 L 0 0 0 24" fill="none" stroke="#5C5C61" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        {children || <span className="text-ink-faint text-sm">Mapa (simulado)</span>}
      </div>
    </div>
  )
}
