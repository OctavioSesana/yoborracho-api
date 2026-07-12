export default function StepIndicator({ total, current }) {
  return (
    <div className="flex gap-1.5 px-4 py-3">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`h-1 flex-1 rounded-full ${
            i < current ? 'bg-accent' : 'bg-surface-4'
          }`}
        />
      ))}
    </div>
  )
}
