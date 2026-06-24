export type BudgetUnitStatus = 'active' | 'expired'

export interface BudgetUnitNode {
  id: string
  name: string
  parentId: string | null
  level: 1 | 2 | 3
  hasPermission: boolean
  status: BudgetUnitStatus
  children?: BudgetUnitNode[]
}

export interface BudgetTableRow {
  rowId: string
  budgetUnitId: string
  budgetUnitName: string
  owner: string
  costCenter: string
  monthlyBudget: number
  updatedAt: string
  project: string
}

export interface FilterSnapshot {
  selectedIds: string[]
  filterToTopLevel: boolean
  showPermittedOnly: boolean
}

export interface QueryResult {
  rows: BudgetTableRow[]
  blockedNodes: BudgetUnitNode[]
  state: 'all' | 'table' | 'empty' | 'restricted'
  effectiveIds: string[]
}
