import { BellRing, X } from 'lucide-react'

interface ToastBarProps {
  visible: boolean
  message: string
  onAction: () => void
  onClose: () => void
}

export default function ToastBar({ visible, message, onAction, onClose }: ToastBarProps) {
  return (
    <div
      className={`pointer-events-none fixed left-1/2 top-6 z-40 -translate-x-1/2 transition ${
        visible ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0'
      }`}
    >
      <div className="pointer-events-auto flex items-center gap-3 rounded-2xl border border-sky-100 bg-white px-4 py-3 shadow-[0_18px_48px_rgba(14,30,66,0.18)]">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sky-50 text-sky-600">
          <BellRing className="h-4 w-4" />
        </div>
        <div className="text-sm text-slate-700">
          {message}
          <button type="button" onClick={onAction} className="ml-1 font-medium text-sky-600 hover:text-sky-700">
            申请权限
          </button>
        </div>
        <button type="button" onClick={onClose} className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
