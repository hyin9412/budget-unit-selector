import { FileText, Lock, X } from 'lucide-react'

interface PermissionDrawerProps {
  visible: boolean
  blockedNames: string[]
  reason: string
  onClose: () => void
}

export default function PermissionDrawer({
  visible,
  blockedNames,
  reason,
  onClose,
}: PermissionDrawerProps) {
  return (
    <>
      <div
        className={`fixed inset-0 z-30 bg-slate-900/20 transition ${visible ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
        onClick={onClose}
      />
      <aside
        className={`fixed right-0 top-0 z-40 flex h-full w-[420px] flex-col border-l border-slate-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.2)] transition ${
          visible ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
          <div>
            <div className="text-lg font-semibold text-slate-900">申请权限</div>
            <div className="mt-1 text-sm text-slate-400">系统已自动带入待申请预算单元</div>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6">
          <section className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-sky-600 shadow-sm">
                <Lock className="h-4 w-4" />
              </div>
              <div>
                <div className="text-sm font-medium text-slate-800">待申请资源</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {blockedNames.map((name) => (
                    <span key={name} className="rounded-full bg-white px-3 py-1 text-xs text-slate-600 shadow-sm">
                      {name}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <label className="block">
            <div className="mb-2 text-sm font-medium text-slate-700">资源类型</div>
            <div className="flex h-11 items-center rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-700">
              预算单元
            </div>
          </label>

          <label className="block">
            <div className="mb-2 text-sm font-medium text-slate-700">申请原因</div>
            <textarea
              readOnly
              value={reason}
              className="h-36 w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none"
            />
          </label>

          <section className="rounded-2xl border border-dashed border-slate-200 px-4 py-4">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
              <FileText className="h-4 w-4 text-sky-600" />
              审批说明
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Demo 中不发起真实审批流，抽屉仅用于演示 Toast 到权限申请表单的自动串联。
            </p>
          </section>
        </div>

        <div className="border-t border-slate-100 px-6 py-4">
          <button
            type="button"
            className="flex h-11 w-full items-center justify-center rounded-xl bg-sky-500 text-sm font-medium text-white shadow-[0_10px_24px_rgba(14,165,233,0.28)] transition hover:bg-sky-600"
          >
            提交申请（Demo）
          </button>
        </div>
      </aside>
    </>
  )
}
