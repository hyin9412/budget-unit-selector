import { Inbox } from 'lucide-react'

import { cn } from '@/lib/utils'

interface EmptyProps {
  title?: string
  description?: string
}

export default function Empty({
  title = '暂无数据',
  description = '当前筛选条件下没有可展示内容。',
}: EmptyProps) {
  return (
    <div className={cn('flex h-full flex-col items-center justify-center gap-4 px-6 text-center')}>
      <div className="flex h-16 w-16 items-center justify-center rounded-[20px] bg-white text-slate-300 shadow-[0_10px_24px_rgba(15,23,42,0.06)]">
        <Inbox className="h-7 w-7" />
      </div>
      <div>
        <div className="text-base font-semibold text-slate-700">{title}</div>
        <p className="mt-2 max-w-md text-sm leading-6 text-slate-400">{description}</p>
      </div>
    </div>
  )
}
