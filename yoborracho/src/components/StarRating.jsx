import { useState } from 'react'
import { Star } from 'lucide-react'

const sizeMap = {
  'text-3xl': 30,
  'text-2xl': 26,
  'text-xl': 22,
  'text-lg': 18,
}

export default function StarRating({ value = 0, onChange, size = 'text-3xl', readOnly = false }) {
  const [hover, setHover] = useState(0)
  const display = hover || value
  const px = sizeMap[size] || 28
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          type="button"
          key={n}
          disabled={readOnly}
          onClick={() => onChange && onChange(n)}
          onMouseEnter={() => !readOnly && setHover(n)}
          onMouseLeave={() => !readOnly && setHover(0)}
          className={`leading-none transition ${readOnly ? 'cursor-default' : 'cursor-pointer active:scale-90'}`}
        >
          <Star
            size={px}
            strokeWidth={1.5}
            className={n <= display ? 'fill-yellow-400 text-yellow-400' : 'fill-transparent text-surface-5'}
          />
        </button>
      ))}
    </div>
  )
}
