export default function PhoneFrame({ children }) {
  return (
    // En mobile real esto ES la app (sin marco, sin padding): min-h-dvh en vez
    // de min-h-screen porque 100vh en Safari/Chrome mobile incluye la barra de
    // direcciones, lo que dejaba ~unos pixeles de scroll de más y el bottom nav
    // "flotando" fuera de la vista. sm:py-4 (antes py-4 sin el prefijo) es lo
    // que agregaba esos mismos pixeles de más también en mobile.
    <div className="min-h-dvh w-full bg-black flex items-center justify-center sm:py-4">
      <div className="w-full max-w-[420px] min-h-dvh sm:min-h-[860px] sm:my-4 sm:rounded-[2.5rem] sm:border-8 sm:border-surface-3 bg-surface text-ink overflow-hidden relative flex flex-col shadow-2xl font-sans">
        {children}
      </div>
    </div>
  )
}
