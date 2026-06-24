import { describe, expect, it } from 'vitest'

import { budgetTableRows, budgetTree } from '@/utils/budgetData'
import {
  appendCascadeSelection,
  buildBudgetIndexes,
  getEffectiveFilterIds,
  parseSearchTokens,
  parseDelimitedSelectionTokens,
  resolveDelimitedSelectionInput,
  runBudgetQuery,
  searchBudgetUnits,
  toggleCascadeSelection,
} from '@/utils/budgetHelpers'

const indexes = buildBudgetIndexes(budgetTree)

describe('budgetHelpers', () => {
  it('支持逗号、空格与换行混合分词', () => {
    expect(parseSearchTokens('智能语音交互, 扣子 10023\n豆包大模型')).toEqual([
      '智能语音交互',
      '扣子',
      '10023',
      '豆包大模型',
    ])
  })

  it('自动选择输入仅按逗号和换行分词', () => {
    expect(parseDelimitedSelectionTokens('智能语音交互, 扣子\n10023，豆包大模型')).toEqual([
      '智能语音交互',
      '扣子',
      '10023',
      '豆包大模型',
    ])
  })

  it('输入多个值时会解析已匹配节点并保留未匹配残留', () => {
    const result = resolveDelimitedSelectionInput(indexes.flatNodes, '智能语音交互, 30011, 不存在项')
    expect(result.matchedNodes.map((item) => item.id)).toEqual(['10000', '30011'])
    expect(result.remainingText).toBe('不存在项')
  })

  it('单个 token 时执行名称模糊搜索', () => {
    const results = searchBudgetUnits(indexes.flatNodes, '扣子', true)
    expect(results.map((item) => item.id)).toEqual(['30011', '300111'])
  })

  it('多 token 时执行名称或 ID 精确匹配', () => {
    const results = searchBudgetUnits(indexes.flatNodes, '智能语音交互, 10012, 豆包大模型', false)
    expect(results.map((item) => item.id)).toEqual(['10000', '10012', '10013'])
  })

  it('父节点勾选会级联包含全部子节点', () => {
    const selectedIds = toggleCascadeSelection([], '30011', indexes.childrenMap)
    expect(selectedIds.sort()).toEqual(['30011', '300111', '300112'])
  })

  it('批量追加级联选择时会合并全部后代节点', () => {
    const selectedIds = appendCascadeSelection(['10000'], ['30011'], indexes.childrenMap)
    expect(selectedIds.sort()).toEqual(['10000', '30011', '300111', '300112'])
  })

  it('按一级预算单元筛选时自动提升到一级节点', () => {
    expect(getEffectiveFilterIds(['300111', '300112'], true, indexes.nodeMap)).toEqual(['10000'])
  })

  it('查询时会拦截无权限预算单元数据', () => {
    const result = runBudgetQuery(
      budgetTableRows,
      {
        selectedIds: ['300112'],
        filterToTopLevel: false,
        showPermittedOnly: false,
      },
      indexes.nodeMap,
    )

    expect(result.state).toBe('restricted')
    expect(result.rows).toHaveLength(0)
    expect(result.blockedNodes.map((node) => node.id)).toEqual(['300112'])
  })

  it('全部有权限但无数据时返回空状态', () => {
    const result = runBudgetQuery(
      budgetTableRows,
      {
        selectedIds: ['30013'],
        filterToTopLevel: false,
        showPermittedOnly: true,
      },
      indexes.nodeMap,
    )

    expect(result.state).toBe('empty')
    expect(result.rows).toHaveLength(0)
  })
})
