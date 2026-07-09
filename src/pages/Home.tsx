import { useEffect, useMemo, useRef, useState } from 'react'

import BudgetUnitSelector from '@/components/BudgetUnitSelector'
import BudgetUnitSelectorDraft from '@/components/BudgetUnitSelectorDraft'
import type { BudgetUnitNode, FilterSnapshot } from '@/types/budget'
import { budgetTree } from '@/utils/budgetData'
import { fullBudgetTree } from '@/utils/fullBudgetData'
import {
  buildBudgetIndexes,
  buildTreeView,
  getEffectiveFilterIds,
  getSelectedNodes,
  resolveDelimitedSelectionInput,
  toggleCascadeSelection,
} from '@/utils/budgetHelpers'

const emptySnapshot: FilterSnapshot = {
  selectedIds: [],
  filterToTopLevel: false,
  showPermittedOnly: true,
}

function useSelectorPreview(options: { autoSelectOnDelimitedInput: boolean; tree?: BudgetUnitNode[] }) {
  const sourceTree = options.tree ?? budgetTree
  const selectorRef = useRef<HTMLDivElement>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [invalidPastedCount, setInvalidPastedCount] = useState(0)
  const [snapshot, setSnapshot] = useState<FilterSnapshot>(emptySnapshot)
  const indexes = useMemo(() => buildBudgetIndexes(sourceTree), [sourceTree])

  const treeView = useMemo(
    () => buildTreeView(sourceTree, snapshot.showPermittedOnly),
    [snapshot.showPermittedOnly, sourceTree],
  )
  const visibleIndexes = useMemo(() => buildBudgetIndexes(treeView), [treeView])
  const selectedNodes = useMemo(
    () => getSelectedNodes(snapshot.selectedIds, indexes.nodeMap),
    [snapshot.selectedIds, indexes.nodeMap],
  )
  const selectedSet = useMemo(() => new Set(snapshot.selectedIds), [snapshot.selectedIds])

  useEffect(() => {
    if (!isOpen) {
      return
    }

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node
      if (selectorRef.current?.contains(target)) {
        return
      }

      setIsOpen(false)
      setSearchText('')
      setInvalidPastedCount(0)
    }

    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [isOpen])

  const handleToggleNode = (nodeId: string) => {
    if (snapshot.filterToTopLevel) {
      const nextSet = new Set(snapshot.selectedIds)
      if (nextSet.has(nodeId)) {
        nextSet.delete(nodeId)
      } else {
        nextSet.add(nodeId)
      }

      setSnapshot((current) => ({
        ...current,
        selectedIds: Array.from(nextSet),
      }))
      return
    }

    setSnapshot((current) => ({
      ...current,
      selectedIds: toggleCascadeSelection(
        current.selectedIds,
        nodeId,
        current.showPermittedOnly ? visibleIndexes.childrenMap : indexes.childrenMap,
      ),
    }))
  }

  const handleSearchTextChange = (value: string) => {
    if (!/[,，\n]/.test(value)) {
      setInvalidPastedCount(0)
      setSearchText(value)
      return
    }

    const candidateNodes = snapshot.filterToTopLevel ? treeView : visibleIndexes.flatNodes
    const { matchedNodes, remainingText, invalidCount } = resolveDelimitedSelectionInput(candidateNodes, value)
    setInvalidPastedCount(invalidCount)

    if (!options.autoSelectOnDelimitedInput) {
      setSearchText(value)
      return
    }

    if (!matchedNodes.length) {
      setSearchText(invalidCount > 0 ? '' : value)
      return
    }

    setSnapshot((current) => {
      return {
        ...current,
        selectedIds: Array.from(new Set([...current.selectedIds, ...matchedNodes.map((node) => node.id)])),
      }
    })
    setSearchText(invalidCount > 0 ? '' : remainingText)
  }

  const handleFilterToTopLevelChange = (value: boolean) => {
    setSnapshot((current) => {
      if (!value) {
        return { ...current, filterToTopLevel: value }
      }

      const nextSelectedIds = getEffectiveFilterIds(current.selectedIds, true, indexes.nodeMap).filter(
        (id) => !current.showPermittedOnly || indexes.nodeMap[id]?.hasPermission,
      )

      return {
        ...current,
        filterToTopLevel: value,
        selectedIds: nextSelectedIds,
      }
    })
  }

  const handleShowPermittedOnlyChange = (value: boolean) => {
    setSnapshot((current) => ({
      ...current,
      showPermittedOnly: value,
      selectedIds: value
        ? current.selectedIds.filter((id) => indexes.nodeMap[id]?.hasPermission)
        : current.selectedIds,
    }))
  }

  return {
    selectorRef,
    isOpen,
    searchText,
    snapshot,
    invalidPastedCount,
    treeView,
    selectedNodes,
    selectedSet,
    openPanel: () => setIsOpen(true),
    setSearchText: handleSearchTextChange,
    handleToggleNode,
    handleFilterToTopLevelChange,
    handleShowPermittedOnlyChange,
    clearSelected: () =>
      setSnapshot((current) => ({
        ...current,
        selectedIds: [],
      })),
    removeSelected: (id: string) =>
      setSnapshot((current) => ({
        ...current,
        selectedIds: current.selectedIds.filter((item) => item !== id),
      })),
    setSelectedIds: (selectedIds: string[]) =>
      setSnapshot((current) => ({
        ...current,
        selectedIds,
      })),
  }
}

export default function Home() {
  const original = useSelectorPreview({ autoSelectOnDelimitedInput: true })
  const draft = useSelectorPreview({ autoSelectOnDelimitedInput: false })
  const realDataDraft = useSelectorPreview({ autoSelectOnDelimitedInput: false, tree: fullBudgetTree })
  const realDataTagDraft = useSelectorPreview({ autoSelectOnDelimitedInput: false, tree: fullBudgetTree })

  return (
    <div className="min-h-screen bg-white px-6 py-10 text-slate-900">
      <main className="w-[285px] space-y-6">
        <div className="space-y-2">
          <div className="w-max whitespace-nowrap text-xs font-medium text-slate-400">6/23 自动分组后自动选中</div>
          <BudgetUnitSelector
            containerRef={original.selectorRef}
            isOpen={original.isOpen}
            searchText={original.searchText}
            filterToTopLevel={original.snapshot.filterToTopLevel}
            showPermittedOnly={original.snapshot.showPermittedOnly}
            invalidPastedCount={original.invalidPastedCount}
            tree={original.treeView}
            selectedNodes={original.selectedNodes}
            selectedIds={original.snapshot.selectedIds}
            selectedSet={original.selectedSet}
            onOpen={() => !original.isOpen && original.openPanel()}
            onSearchTextChange={original.setSearchText}
            onFilterToTopLevelChange={original.handleFilterToTopLevelChange}
            onShowPermittedOnlyChange={original.handleShowPermittedOnlyChange}
            onToggleNode={original.handleToggleNode}
            onSetSelectedIds={original.setSelectedIds}
            onClearSelected={original.clearSelected}
            onRemoveSelected={original.removeSelected}
          />
        </div>

        <div className="space-y-2">
          <div className="w-max whitespace-nowrap text-xs font-medium text-slate-400">6/23 ✅ 【选择方案，仅作交互示意，视觉参考设计稿】</div>
          <BudgetUnitSelectorDraft
            containerRef={draft.selectorRef}
            isOpen={draft.isOpen}
            searchText={draft.searchText}
            filterToTopLevel={draft.snapshot.filterToTopLevel}
            showPermittedOnly={draft.snapshot.showPermittedOnly}
            invalidPastedCount={draft.invalidPastedCount}
            tree={draft.treeView}
            selectedNodes={draft.selectedNodes}
            selectedIds={draft.snapshot.selectedIds}
            selectedSet={draft.selectedSet}
            onOpen={() => !draft.isOpen && draft.openPanel()}
            onSearchTextChange={draft.setSearchText}
            onFilterToTopLevelChange={draft.handleFilterToTopLevelChange}
            onShowPermittedOnlyChange={draft.handleShowPermittedOnlyChange}
            onToggleNode={draft.handleToggleNode}
            onSetSelectedIds={draft.setSelectedIds}
            onClearSelected={draft.clearSelected}
            onRemoveSelected={draft.removeSelected}
          />
        </div>

        <div className="space-y-2">
          <div className="w-max whitespace-nowrap text-xs font-medium text-slate-400">7/9 【选择方案，灌入真实数据，已选择改/分割展示层级】</div>
          <BudgetUnitSelectorDraft
            containerRef={realDataDraft.selectorRef}
            isOpen={realDataDraft.isOpen}
            searchText={realDataDraft.searchText}
            filterToTopLevel={realDataDraft.snapshot.filterToTopLevel}
            showPermittedOnly={realDataDraft.snapshot.showPermittedOnly}
            invalidPastedCount={realDataDraft.invalidPastedCount}
            tree={realDataDraft.treeView}
            selectedNodes={realDataDraft.selectedNodes}
            selectedIds={realDataDraft.snapshot.selectedIds}
            selectedSet={realDataDraft.selectedSet}
            onOpen={() => !realDataDraft.isOpen && realDataDraft.openPanel()}
            onSearchTextChange={realDataDraft.setSearchText}
            onFilterToTopLevelChange={realDataDraft.handleFilterToTopLevelChange}
            onShowPermittedOnlyChange={realDataDraft.handleShowPermittedOnlyChange}
            onToggleNode={realDataDraft.handleToggleNode}
            onSetSelectedIds={realDataDraft.setSelectedIds}
            onClearSelected={realDataDraft.clearSelected}
            onRemoveSelected={realDataDraft.removeSelected}
            enableOverflowTooltip
            showSelectedPath
            collapseLongTriggerPreview
            selectedListHorizontalPadding={6}
          />
        </div>

        <div className="space-y-2">
          <div className="w-max whitespace-nowrap text-xs font-medium text-slate-400">7/9 【选择方案，灌入真实数据，已选择改Tag展示层级，hover出全部路径】</div>
          <BudgetUnitSelectorDraft
            containerRef={realDataTagDraft.selectorRef}
            isOpen={realDataTagDraft.isOpen}
            searchText={realDataTagDraft.searchText}
            filterToTopLevel={realDataTagDraft.snapshot.filterToTopLevel}
            showPermittedOnly={realDataTagDraft.snapshot.showPermittedOnly}
            invalidPastedCount={realDataTagDraft.invalidPastedCount}
            tree={realDataTagDraft.treeView}
            selectedNodes={realDataTagDraft.selectedNodes}
            selectedIds={realDataTagDraft.snapshot.selectedIds}
            selectedSet={realDataTagDraft.selectedSet}
            onOpen={() => !realDataTagDraft.isOpen && realDataTagDraft.openPanel()}
            onSearchTextChange={realDataTagDraft.setSearchText}
            onFilterToTopLevelChange={realDataTagDraft.handleFilterToTopLevelChange}
            onShowPermittedOnlyChange={realDataTagDraft.handleShowPermittedOnlyChange}
            onToggleNode={realDataTagDraft.handleToggleNode}
            onSetSelectedIds={realDataTagDraft.setSelectedIds}
            onClearSelected={realDataTagDraft.clearSelected}
            onRemoveSelected={realDataTagDraft.removeSelected}
            enableOverflowTooltip
            selectedDisplayMode="name"
            showSelectedLevelTag
            collapseLongTriggerPreview
            selectedListHorizontalPadding={6}
          />
        </div>
      </main>
    </div>
  )
}
