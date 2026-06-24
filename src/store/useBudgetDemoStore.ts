import { create } from 'zustand'

import type { BudgetTableRow, FilterSnapshot, QueryResult } from '@/types/budget'

interface ToastState {
  visible: boolean
  blockedNames: string[]
  message: string
}

interface BudgetDemoState {
  isPanelOpen: boolean
  isDrawerOpen: boolean
  searchText: string
  draft: FilterSnapshot
  committed: FilterSnapshot
  resultRows: BudgetTableRow[]
  resultState: QueryResult['state']
  effectiveIds: string[]
  toast: ToastState
  drawerReason: string
  openPanel: () => void
  closePanel: () => void
  setSearchText: (value: string) => void
  setDraftSelectedIds: (selectedIds: string[]) => void
  removeDraftSelectedId: (id: string) => void
  setDraftFilterToTopLevel: (value: boolean) => void
  setDraftShowPermittedOnly: (value: boolean) => void
  applyQueryResult: (payload: {
    snapshot: FilterSnapshot
    result: QueryResult
    message: string
    drawerReason: string
  }) => void
  loadSnapshot: (payload: { snapshot: FilterSnapshot; result: QueryResult }) => void
  dismissToast: () => void
  openDrawer: () => void
  closeDrawer: () => void
}

const emptySnapshot: FilterSnapshot = {
  selectedIds: [],
  filterToTopLevel: false,
  showPermittedOnly: true,
}

export const useBudgetDemoStore = create<BudgetDemoState>((set) => ({
  isPanelOpen: false,
  isDrawerOpen: false,
  searchText: '',
  draft: emptySnapshot,
  committed: emptySnapshot,
  resultRows: [],
  resultState: 'all',
  effectiveIds: [],
  drawerReason: '',
  toast: {
    visible: false,
    blockedNames: [],
    message: '',
  },
  openPanel: () =>
    set((state) => ({
      isPanelOpen: true,
      searchText: '',
      draft: { ...state.committed, selectedIds: [...state.committed.selectedIds] },
    })),
  closePanel: () => set({ isPanelOpen: false, searchText: '' }),
  setSearchText: (value) => set({ searchText: value }),
  setDraftSelectedIds: (selectedIds) =>
    set((state) => ({
      draft: { ...state.draft, selectedIds },
    })),
  removeDraftSelectedId: (id) =>
    set((state) => ({
      draft: { ...state.draft, selectedIds: state.draft.selectedIds.filter((item) => item !== id) },
    })),
  setDraftFilterToTopLevel: (value) =>
    set((state) => ({
      draft: { ...state.draft, filterToTopLevel: value },
    })),
  setDraftShowPermittedOnly: (value) =>
    set((state) => ({
      draft: { ...state.draft, showPermittedOnly: value },
    })),
  applyQueryResult: ({ snapshot, result, message, drawerReason }) =>
    set({
      isPanelOpen: false,
      isDrawerOpen: false,
      searchText: '',
      committed: snapshot,
      draft: snapshot,
      resultRows: result.rows,
      resultState: result.state,
      effectiveIds: result.effectiveIds,
      drawerReason,
      toast: {
        visible: result.blockedNodes.length > 0,
        blockedNames: result.blockedNodes.map((node) => node.name),
        message,
      },
    }),
  loadSnapshot: ({ snapshot, result }) =>
    set({
      isPanelOpen: false,
      isDrawerOpen: false,
      committed: snapshot,
      draft: snapshot,
      searchText: '',
      resultRows: result.rows,
      resultState: result.state,
      effectiveIds: result.effectiveIds,
      drawerReason: '',
      toast: {
        visible: result.blockedNodes.length > 0,
        blockedNames: result.blockedNodes.map((node) => node.name),
        message: result.blockedNodes.length > 0 ? '存在无权限预算单元，相关数据未展示。' : '',
      },
    }),
  dismissToast: () =>
    set((state) => ({
      toast: { ...state.toast, visible: false },
    })),
  openDrawer: () => set({ isDrawerOpen: true }),
  closeDrawer: () => set({ isDrawerOpen: false }),
}))
