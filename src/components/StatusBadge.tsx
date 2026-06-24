import type { BudgetUnitNode } from '@/types/budget'

interface StatusBadgeProps {
  node: BudgetUnitNode
}

export default function StatusBadge({ node }: StatusBadgeProps) {
  if (node.status !== 'expired') {
    return null
  }

  return (
    <span className="inline-flex h-[18px] items-center rounded bg-[#F1F3F5] px-[6px] text-[10px] font-medium leading-[18px] text-[#42464E]">
      已失效
    </span>
  )
}
