const sizes = {
  sm: 'w-9 h-9 text-xs',
  md: 'w-12 h-12 text-sm',
  lg: 'w-16 h-16 text-lg',
  xl: 'w-24 h-24 text-2xl',
}

function getInitials(name) {
  if (!name) return '?'
  return name
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export default function Avatar({ name, size = 'md', className = '' }) {
  return (
    <div
      className={`${sizes[size]} shrink-0 rounded-full bg-surface-3 border border-subtle flex items-center justify-center font-semibold text-accent-light ${className}`}
    >
      {getInitials(name)}
    </div>
  )
}
