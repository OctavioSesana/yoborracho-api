export default function PhoneFrame({ children }) {
  return (
    <div className="min-h-screen w-full bg-black flex items-center justify-center py-4">
      <div className="w-full max-w-[420px] min-h-screen sm:min-h-[860px] sm:my-4 sm:rounded-[2.5rem] sm:border-8 sm:border-surface-3 bg-surface text-ink overflow-hidden relative flex flex-col shadow-2xl font-sans">
        {children}
      </div>
    </div>
  )
}
