import { DatabaseZap, Filter, Sparkles } from 'lucide-react'

import Empty from '@/components/Empty'
import type { BudgetTableRow } from '@/types/budget'

interface ResultsTableProps {
  rows: BudgetTableRow[]
  state: 'all' | 'table' | 'empty' | 'restricted'
  summary: string
}

export default function ResultsTable({ rows, state, summary }: ResultsTableProps) {
  return (
    <section className="rounded-[28px] border border-white/70 bg-white/90 p-6 shadow-[0_28px_80px_rgba(15,23,42,0.08)] backdrop-blur">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
            <DatabaseZap className="h-4 w-4 text-sky-500" />
            模拟查询结果
          </div>
          <p className="mt-2 text-sm text-slate-500">{summary}</p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-500">
          <Filter className="h-3.5 w-3.5" />
          当前展示 {rows.length} 条
        </div>
      </div>

      {state === 'empty' ? (
        <div className="mt-6 h-[320px] rounded-3xl border border-dashed border-slate-200 bg-slate-50/70">
          <Empty
            title="暂无数据"
            description="当前筛选条件下没有命中的预算数据，请调整预算单元或关闭“按 1 级预算单元筛选”后重试。"
          />
        </div>
      ) : null}

      {state === 'restricted' ? (
        <div className="mt-6 flex h-[320px] flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-slate-50/70 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-sky-600 shadow-sm">
            <Sparkles className="h-6 w-6" />
          </div>
          <div className="mt-4 text-base font-semibold text-slate-800">当前结果被权限拦截</div>
          <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
            你选择的预算单元中存在无权限项，表格未展示相关数据。可通过顶部 Toast 入口打开抽屉发起权限申请。
          </p>
        </div>
      ) : null}

      {(state === 'all' || state === 'table') && rows.length ? (
        <div className="mt-6 overflow-hidden rounded-3xl border border-slate-100">
          <table className="min-w-full border-collapse bg-white text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">预算单元</th>
                <th className="px-4 py-3 font-medium">项目</th>
                <th className="px-4 py-3 font-medium">负责人</th>
                <th className="px-4 py-3 font-medium">成本中心</th>
                <th className="px-4 py-3 font-medium">月度预算</th>
                <th className="px-4 py-3 font-medium">最近更新</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.rowId} className="border-t border-slate-100 text-slate-700 transition hover:bg-sky-50/40">
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-800">{row.budgetUnitName}</div>
                    <div className="mt-1 text-xs text-slate-400">ID {row.budgetUnitId}</div>
                  </td>
                  <td className="px-4 py-3">{row.project}</td>
                  <td className="px-4 py-3">{row.owner}</td>
                  <td className="px-4 py-3">{row.costCenter}</td>
                  <td className="px-4 py-3 text-slate-900">¥ {row.monthlyBudget.toLocaleString('zh-CN')}</td>
                  <td className="px-4 py-3 text-slate-500">{row.updatedAt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  )
}
