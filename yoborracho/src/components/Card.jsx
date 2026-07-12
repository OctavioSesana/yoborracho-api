export default function Card({ children, className = '', ...props }) {
  return (
    <div
      className={`bg-surface-2 border border-subtle rounded-xl p-4 ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}
