import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

export default function TopBar({ title, onBack, right = null }) {
  const navigate = useNavigate()
  return (
    <div className="flex items-center justify-between px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))] border-b border-subtle bg-surface/80 backdrop-blur sticky top-0 z-10">
      <button
        onClick={() => (onBack ? onBack() : navigate(-1))}
        className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-surface-3 text-ink"
        aria-label="Volver"
      >
        <ArrowLeft size={20} strokeWidth={1.75} />
      </button>
      <h1 className="text-base font-semibold tracking-tight truncate">{title}</h1>
      <div className="w-9 h-9 flex items-center justify-center">{right}</div>
    </div>
  )
}
