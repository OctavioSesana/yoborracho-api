import Button from './Button'

// Modal de confirmación propio de la app (reemplaza al window.confirm() nativo
// del navegador, que se ve fuera de lugar y varía según el sistema/navegador).
export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Volver',
  danger = false,
  onConfirm,
  onCancel,
}) {
  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm px-4 pb-6 sm:pb-4"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-sm bg-surface-2 border border-subtle rounded-2xl p-5 flex flex-col gap-4 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div>
          <h3 className="text-base font-bold text-ink tracking-tight">{title}</h3>
          {message && <p className="text-sm text-ink-muted mt-1.5">{message}</p>}
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" className="flex-1" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button variant={danger ? 'danger' : 'primary'} className="flex-1" onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}
