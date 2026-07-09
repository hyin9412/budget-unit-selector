import type { BudgetUnitNode } from '@/types/budget'

import fullBudgetMarkdown from '../../预算单元数据（完整版）.md?raw'

interface BudgetMarkdownRow {
  name: string
  level: BudgetUnitNode['level']
}

function parseLevel(value: string): BudgetUnitNode['level'] {
  if (value.startsWith('1')) {
    return 1
  }

  if (value.startsWith('2')) {
    return 2
  }

  return 3
}

function parseBudgetMarkdown(markdown: string): BudgetUnitNode[] {
  const rows: BudgetMarkdownRow[] = markdown
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.startsWith('|') && !line.includes(':---'))
    .slice(1)
    .map((line) => {
      const [name = '', level = ''] = line
        .split('|')
        .slice(1, -1)
        .map((cell) => cell.trim())

      return {
        name,
        level: parseLevel(level),
      }
    })
    .filter((row) => row.name)

  const roots: BudgetUnitNode[] = []
  const stack: BudgetUnitNode[] = []

  rows.forEach((row, index) => {
    const parent = row.level > 1 ? stack[row.level - 2] : null
    const node: BudgetUnitNode = {
      id: `full-${index + 1}`,
      name: row.name,
      parentId: parent?.id ?? null,
      level: row.level,
      hasPermission: true,
      status: row.name.includes('待失效') ? 'expired' : 'active',
    }

    if (row.level === 1 || !parent) {
      roots.push(node)
    } else {
      parent.children ??= []
      parent.children.push(node)
    }

    stack[row.level - 1] = node
    stack.length = row.level
  })

  return roots
}

export const fullBudgetTree = parseBudgetMarkdown(fullBudgetMarkdown)
