export default function Button({
  children,
  variant = 'primary',
  className = '',
  as: Comp = 'button',
  ...props
}) {
  const base =
    'w-full flex items-center justify-center gap-2 rounded-lg font-semibold text-sm py-3.5 px-4 transition-colors active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none'
  const variants = {
    primary: 'bg-accent hover:bg-accent-light text-white',
    secondary: 'bg-surface-3 hover:bg-surface-4 text-ink border border-subtle',
    outline: 'border border-accent text-accent hover:bg-accent/10',
    danger: 'bg-red-600 hover:bg-red-500 text-white',
    success: 'bg-emerald-600 hover:bg-emerald-500 text-white',
    ghost: 'bg-transparent text-ink-muted hover:bg-surface-3 hover:text-ink',
  }
  return (
    <Comp className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </Comp>
  )
}
