import type { BudgetTableRow, BudgetUnitNode, FilterSnapshot, QueryResult } from '@/types/budget'

export interface BudgetIndexes {
  flatNodes: BudgetUnitNode[]
  nodeMap: Record<string, BudgetUnitNode>
  childrenMap: Record<string, string[]>
}

export function buildBudgetIndexes(tree: BudgetUnitNode[]): BudgetIndexes {
  const flatNodes: BudgetUnitNode[] = []
  const nodeMap: Record<string, BudgetUnitNode> = {}
  const childrenMap: Record<string, string[]> = {}

  const walk = (nodes: BudgetUnitNode[]) => {
    nodes.forEach((node) => {
      flatNodes.push(node)
      nodeMap[node.id] = node
      childrenMap[node.id] = node.children?.map((child) => child.id) ?? []
      if (node.children?.length) {
        walk(node.children)
      }
    })
  }

  walk(tree)
  return { flatNodes, nodeMap, childrenMap }
}

export function parseSearchTokens(value: string) {
  return value
    .split(/[,\n\s，]+/)
    .map((token) => token.trim())
    .filter(Boolean)
}

export function parseDelimitedSelectionTokens(value: string) {
  return value
    .split(/[,\n，]+/)
    .map((token) => token.trim())
    .filter(Boolean)
}

export function resolveDelimitedSelectionInput(
  nodes: BudgetUnitNode[],
  value: string,
) {
  if (!/[,，\n]/.test(value)) {
    return {
      matchedNodes: [],
      remainingText: value,
      remainingTokens: [],
      invalidCount: 0,
    }
  }

  const tokens = parseDelimitedSelectionTokens(value)
  const exactMatchMap = new Map<string, BudgetUnitNode[]>()

  nodes.forEach((node) => {
    const keys = [node.name.toLowerCase(), node.id.toLowerCase()]
    keys.forEach((key) => {
      const current = exactMatchMap.get(key) ?? []
      current.push(node)
      exactMatchMap.set(key, current)
    })
  })

  const matchedNodes: BudgetUnitNode[] = []
  const remainingTokens: string[] = []
  const seenIds = new Set<string>()

  tokens.forEach((token) => {
    const exactMatches = exactMatchMap.get(token.toLowerCase()) ?? []
    if (!exactMatches.length) {
      remainingTokens.push(token)
      return
    }

    exactMatches.forEach((node) => {
      if (seenIds.has(node.id)) {
        return
      }
      seenIds.add(node.id)
      matchedNodes.push(node)
    })
  })

  return {
    matchedNodes,
    remainingText: remainingTokens.join(', '),
    remainingTokens,
    invalidCount: remainingTokens.length,
  }
}

export function collectDescendantIds(id: string, childrenMap: Record<string, string[]>) {
  const ids = [id]
  const stack = [...(childrenMap[id] ?? [])]

  while (stack.length > 0) {
    const current = stack.pop() as string
    ids.push(current)
    stack.push(...(childrenMap[current] ?? []))
  }

  return ids
}

export function toggleCascadeSelection(
  currentIds: string[],
  nodeId: string,
  childrenMap: Record<string, string[]>,
) {
  const relatedIds = collectDescendantIds(nodeId, childrenMap)
  const nextSet = new Set(currentIds)
  const shouldUnselect = relatedIds.every((id) => nextSet.has(id))

  relatedIds.forEach((id) => {
    if (shouldUnselect) {
      nextSet.delete(id)
      return
    }
    nextSet.add(id)
  })

  return Array.from(nextSet)
}

export function appendCascadeSelection(
  currentIds: string[],
  nodeIds: string[],
  childrenMap: Record<string, string[]>,
) {
  const nextSet = new Set(currentIds)

  nodeIds.forEach((nodeId) => {
    collectDescendantIds(nodeId, childrenMap).forEach((id) => {
      nextSet.add(id)
    })
  })

  return Array.from(nextSet)
}

export function getNodeCheckState(
  nodeId: string,
  selectedSet: Set<string>,
  childrenMap: Record<string, string[]>,
) {
  const relatedIds = collectDescendantIds(nodeId, childrenMap)
  const selectedCount = relatedIds.filter((id) => selectedSet.has(id)).length

  return {
    checked: selectedCount === relatedIds.length,
    indeterminate: selectedCount > 0 && selectedCount < relatedIds.length,
  }
}

export function getTopLevelAncestorId(id: string, nodeMap: Record<string, BudgetUnitNode>) {
  let current = nodeMap[id]

  while (current && current.parentId) {
    current = nodeMap[current.parentId]
  }

  return current?.id ?? id
}

export function getEffectiveFilterIds(
  selectedIds: string[],
  filterToTopLevel: boolean,
  nodeMap: Record<string, BudgetUnitNode>,
) {
  if (!filterToTopLevel) {
    return Array.from(new Set(selectedIds))
  }

  return Array.from(new Set(selectedIds.map((id) => getTopLevelAncestorId(id, nodeMap))))
}

export function getSelectedNodes(selectedIds: string[], nodeMap: Record<string, BudgetUnitNode>) {
  return selectedIds
    .map((id) => nodeMap[id])
    .filter((node): node is BudgetUnitNode => Boolean(node))
    .sort((first, second) => Number(first.id) - Number(second.id))
}

export function searchBudgetUnits(
  flatNodes: BudgetUnitNode[],
  searchText: string,
  showPermittedOnly: boolean,
) {
  const tokens = parseSearchTokens(searchText)
  const filteredNodes = showPermittedOnly
    ? flatNodes.filter((node) => node.hasPermission)
    : flatNodes

  if (!tokens.length) {
    return []
  }

  if (tokens.length === 1) {
    const keyword = tokens[0].toLowerCase()
    return filteredNodes.filter((node) => {
      const name = node.name.toLowerCase()
      return name.includes(keyword) || node.id.includes(keyword)
    })
  }

  const tokenSet = new Set(tokens.map((token) => token.toLowerCase()))
  return filteredNodes.filter((node) => {
    return tokenSet.has(node.name.toLowerCase()) || tokenSet.has(node.id.toLowerCase())
  })
}

export function buildTreeView(tree: BudgetUnitNode[], showPermittedOnly: boolean): BudgetUnitNode[] {
  const nextTree = tree
    .map<BudgetUnitNode | null>((node) => {
      const nextChildren = node.children ? buildTreeView(node.children, showPermittedOnly) : []
      const visibleByPermission = showPermittedOnly ? node.hasPermission : true

      if (!visibleByPermission && nextChildren.length === 0) {
        return null
      }

      return {
        ...node,
        children: nextChildren,
      }
    })
  return nextTree.filter((node): node is BudgetUnitNode => node !== null)
}

export function buildPermissionMessage(blockedNodes: BudgetUnitNode[]) {
  const names = blockedNodes.map((node) => node.name)
  return `[${names.join('、')}] 暂无权限，相关数据未展示。`
}

export function buildDrawerReason(blockedNodes: BudgetUnitNode[]) {
  return `申请开通以下预算单元的数据查看权限：${blockedNodes
    .map((node) => node.name)
    .join('、')}。`
}

export function runBudgetQuery(
  allRows: BudgetTableRow[],
  snapshot: FilterSnapshot,
  nodeMap: Record<string, BudgetUnitNode>,
): QueryResult {
  const blockedNodes = getSelectedNodes(snapshot.selectedIds, nodeMap).filter((node) => !node.hasPermission)
  const effectiveIds = getEffectiveFilterIds(snapshot.selectedIds, snapshot.filterToTopLevel, nodeMap)
  const accessibleIds = effectiveIds.filter((id) => nodeMap[id]?.hasPermission)

  if (effectiveIds.length === 0) {
    const rows = allRows.filter((row) => nodeMap[row.budgetUnitId]?.hasPermission)
    return {
      rows,
      blockedNodes: [],
      state: 'all',
      effectiveIds,
    }
  }

  const rows = allRows.filter((row) => accessibleIds.includes(row.budgetUnitId))

  if (rows.length === 0 && blockedNodes.length > 0) {
    return {
      rows,
      blockedNodes,
      state: 'restricted',
      effectiveIds,
    }
  }

  if (rows.length === 0) {
    return {
      rows,
      blockedNodes,
      state: 'empty',
      effectiveIds,
    }
  }

  return {
    rows,
    blockedNodes,
    state: 'table',
    effectiveIds,
  }
}
