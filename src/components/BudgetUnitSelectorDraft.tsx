import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode, RefObject } from 'react'
import { ChevronDown, ChevronRight, X } from 'lucide-react'
import { Checkbox as VeCheckbox, Switch, Tooltip } from '@ve-o-design/web-react'

import deleteIcon from '../../ic-delete.svg'
import PasteFilterNotice from '@/components/PasteFilterNotice'
import StatusBadge from '@/components/StatusBadge'
import TransferEmptyState from '@/components/TransferEmptyState'
import { cn } from '@/lib/utils'
import type { BudgetUnitNode } from '@/types/budget'
import {
  getNodeCheckState,
  parseDelimitedSelectionTokens,
  resolveDelimitedSelectionInput,
  searchBudgetUnits,
} from '@/utils/budgetHelpers'

const FIRST_CASCADE_COLUMN_WIDTH = 320
const CASCADE_COLUMN_WIDTH = 240
const SELECTED_PANEL_WIDTH = 320
const PRIMARY_COLOR = 'rgb(var(--arco-volc2-primary-6, var(--primary-6)))'
const PRIMARY_RING = '0 0 0 2px rgba(var(--arco-volc2-primary-6, var(--primary-6)), 0.16)'

interface BudgetUnitSelectorProps {
  containerRef: RefObject<HTMLDivElement>
  isOpen: boolean
  searchText: string
  filterToTopLevel: boolean
  showPermittedOnly: boolean
  invalidPastedCount: number
  tree: BudgetUnitNode[]
  selectedNodes: BudgetUnitNode[]
  selectedIds: string[]
  selectedSet: Set<string>
  onOpen: () => void
  onSearchTextChange: (value: string) => void
  onFilterToTopLevelChange: (value: boolean) => void
  onShowPermittedOnlyChange: (value: boolean) => void
  onToggleNode: (nodeId: string) => void
  onSetSelectedIds: (selectedIds: string[]) => void
  onClearSelected: () => void
  onRemoveSelected: (nodeId: string) => void
  enableOverflowTooltip?: boolean
  showSelectedPath?: boolean
  selectedListHorizontalPadding?: number
}

function flattenTree(nodes: BudgetUnitNode[]): BudgetUnitNode[] {
  return nodes.flatMap((node) => [node, ...(node.children ? flattenTree(node.children) : [])])
}

function buildVisibleNodeMap(nodes: BudgetUnitNode[]) {
  return Object.fromEntries(flattenTree(nodes).map((node) => [node.id, node]))
}

function getAncestorPath(nodeId: string, visibleNodeMap: Record<string, BudgetUnitNode>) {
  const path: string[] = []
  let current = visibleNodeMap[nodeId]

  while (current) {
    path.unshift(current.id)
    current = current.parentId ? visibleNodeMap[current.parentId] : undefined
  }

  return path
}

function getPathLabelText(node: BudgetUnitNode, visibleNodeMap: Record<string, BudgetUnitNode>) {
  return getAncestorPath(node.id, visibleNodeMap)
    .map((id) => visibleNodeMap[id]?.name)
    .filter((item): item is string => Boolean(item))
    .join(' / ')
}

function OverflowTooltip({
  enabled,
  content,
  className,
  children,
}: {
  enabled?: boolean
  content: string
  className: string
  children: ReactNode
}) {
  const textNode = <span className={className}>{children}</span>

  if (!enabled) {
    return textNode
  }

  return <Tooltip content={content}>{textNode}</Tooltip>
}

function renderSearchPathLabel(node: BudgetUnitNode, visibleNodeMap: Record<string, BudgetUnitNode>, keyword: string) {
  const pathIds = getAncestorPath(node.id, visibleNodeMap)
  const pathNodes = pathIds
    .map((id) => visibleNodeMap[id])
    .filter((item): item is BudgetUnitNode => Boolean(item))

  return pathNodes.map((pathNode, index) => {
    const isExactMatch = pathNode.name.toLowerCase() === keyword || pathNode.id.toLowerCase() === keyword

    return (
      <span key={pathNode.id}>
        {index > 0 ? <span className="text-slate-400"> / </span> : null}
        {isExactMatch ? (
          <span className="font-medium" style={{ color: PRIMARY_COLOR }}>{pathNode.name}</span>
        ) : (
          <span>{renderHighlightedText(pathNode.name, keyword)}</span>
        )}
      </span>
    )
  })
}

function renderTokenizedPathLabel(node: BudgetUnitNode, visibleNodeMap: Record<string, BudgetUnitNode>, matchedTokens: Set<string>) {
  const pathIds = getAncestorPath(node.id, visibleNodeMap)
  const pathNodes = pathIds
    .map((id) => visibleNodeMap[id])
    .filter((item): item is BudgetUnitNode => Boolean(item))

  return pathNodes.map((pathNode, index) => {
    const isMatched = matchedTokens.has(pathNode.name.toLowerCase()) || matchedTokens.has(pathNode.id.toLowerCase())

    return (
      <span key={pathNode.id}>
        {index > 0 ? <span className="text-slate-400"> / </span> : null}
        <span
          className={isMatched ? 'font-medium' : undefined}
          style={isMatched ? { color: PRIMARY_COLOR } : undefined}
        >
          {pathNode.name}
        </span>
      </span>
    )
  })
}


function renderHighlightedText(text: string, keyword: string) {
  if (!keyword) {
    return text
  }

  const lowerText = text.toLowerCase()
  const matchIndex = lowerText.indexOf(keyword)
  if (matchIndex === -1) {
    return text
  }

  const matchEnd = matchIndex + keyword.length

  return (
    <>
      {text.slice(0, matchIndex)}
      <span className="font-medium" style={{ color: PRIMARY_COLOR }}>{text.slice(matchIndex, matchEnd)}</span>
      {text.slice(matchEnd)}
    </>
  )
}

export default function BudgetUnitSelector({
  containerRef,
  isOpen,
  searchText,
  filterToTopLevel,
  showPermittedOnly,
  invalidPastedCount,
  tree,
  selectedNodes,
  selectedIds,
  selectedSet,
  onOpen,
  onSearchTextChange,
  onFilterToTopLevelChange,
  onShowPermittedOnlyChange,
  onToggleNode,
  onSetSelectedIds,
  onClearSelected,
  onRemoveSelected,
  enableOverflowTooltip = false,
  showSelectedPath = false,
  selectedListHorizontalPadding = 12,
}: BudgetUnitSelectorProps) {
  const [activePath, setActivePath] = useState<string[]>([])
  const [isTriggerHovered, setIsTriggerHovered] = useState(false)
  const keyword = searchText.trim().toLowerCase()
  const hasSearch = keyword.length > 0
  const hasDelimitedSearch = /[,，\n]/.test(searchText)
  const delimitedTokens = useMemo(
    () => parseDelimitedSelectionTokens(searchText).map((token) => token.toLowerCase()),
    [searchText],
  )
  const matchedTokenSet = useMemo(() => new Set(delimitedTokens), [delimitedTokens])
  const visibleNodeMap = useMemo(() => buildVisibleNodeMap(tree), [tree])
  const visibleNodes = useMemo(() => flattenTree(tree), [tree])
  const visibleChildrenMap = useMemo(
    () =>
      Object.fromEntries(
        visibleNodes.map((node) => [node.id, node.children?.map((child) => child.id) ?? []]),
      ) as Record<string, string[]>,
    [visibleNodes],
  )
  const topLevelNodes = tree
  const triggerPreviewNodes = selectedNodes.slice(0, 1)
  const extraSelectedCount = Math.max(selectedNodes.length - triggerPreviewNodes.length, 0)
  const showClearIcon = isOpen || isTriggerHovered

  const matchesKeyword = useCallback(
    (node: BudgetUnitNode) => {
      if (!keyword) {
        return true
      }
      return node.name.toLowerCase().includes(keyword) || node.id.toLowerCase().includes(keyword)
    },
    [keyword],
  )

  useEffect(() => {
    if (!isOpen) {
      return
    }

    if (filterToTopLevel) {
      setActivePath([])
      return
    }

    const firstVisibleSelection = selectedNodes.find((node) => visibleNodeMap[node.id])
    if (firstVisibleSelection) {
      setActivePath(getAncestorPath(firstVisibleSelection.id, visibleNodeMap))
      return
    }

    setActivePath([])
  }, [filterToTopLevel, isOpen, selectedNodes, visibleNodeMap])

  const cascadeColumns = useMemo(() => {
    if (filterToTopLevel) {
      return [topLevelNodes.filter(matchesKeyword)]
    }

    const columns: BudgetUnitNode[][] = [topLevelNodes.filter(matchesKeyword)]

    activePath.forEach((nodeId) => {
      const node = visibleNodeMap[nodeId]
      if (!node?.children?.length) {
        return
      }

      const nextColumn = node.children.filter(matchesKeyword)
      if (nextColumn.length) {
        columns.push(nextColumn)
      }
    })

    return columns.filter((column) => column.length > 0)
  }, [activePath, filterToTopLevel, matchesKeyword, topLevelNodes, visibleNodeMap])

  const searchResults = useMemo(
    () =>
      hasSearch
        ? searchBudgetUnits(filterToTopLevel ? topLevelNodes : visibleNodes, searchText, false)
        : [],
    [filterToTopLevel, hasSearch, searchText, topLevelNodes, visibleNodes],
  )

  const tokenizedResults = useMemo(() => {
    if (!hasDelimitedSearch) {
      return []
    }

    return resolveDelimitedSelectionInput(filterToTopLevel ? topLevelNodes : visibleNodes, searchText).matchedNodes
  }, [filterToTopLevel, hasDelimitedSearch, searchText, topLevelNodes, visibleNodes])

  const leftSelectableNodes = useMemo(
    () =>
      hasDelimitedSearch
        ? tokenizedResults
        : hasSearch
        ? searchResults
        : filterToTopLevel
          ? topLevelNodes.filter(matchesKeyword)
          : visibleNodes.filter(matchesKeyword),
    [filterToTopLevel, hasDelimitedSearch, hasSearch, matchesKeyword, searchResults, tokenizedResults, topLevelNodes, visibleNodes],
  )
  const bulkSelectableIds = leftSelectableNodes.map((node) => node.id)
  const leftAllSelected = bulkSelectableIds.length > 0 && bulkSelectableIds.every((id) => selectedSet.has(id))
  const leftSomeSelected = bulkSelectableIds.some((id) => selectedSet.has(id))
  const leftPanelWidth = hasSearch
    ? FIRST_CASCADE_COLUMN_WIDTH
    : FIRST_CASCADE_COLUMN_WIDTH + Math.max(cascadeColumns.length - 1, 0) * CASCADE_COLUMN_WIDTH

  const toggleBulkSelection = () => {
    if (leftAllSelected) {
      onSetSelectedIds(selectedIds.filter((id) => !bulkSelectableIds.includes(id)))
      return
    }

    onSetSelectedIds(Array.from(new Set([...selectedIds, ...bulkSelectableIds])))
  }

  const handleActivateNode = (level: number, node: BudgetUnitNode) => {
    if (filterToTopLevel) {
      return
    }

    setActivePath((previous) => {
      const next = previous.slice(0, level)
      next[level] = node.id
      return next
    })
  }

  return (
    <div ref={containerRef} className="budget-unit-selector relative">
      <div
        className="group flex h-8 rounded-[4px] transition"
        onMouseEnter={() => setIsTriggerHovered(true)}
        onMouseLeave={() => setIsTriggerHovered(false)}
      >
        <div className="flex shrink-0 items-center self-stretch rounded-l-[4px] border border-r-0 border-[#dde2e9] bg-white px-3 text-[13px] leading-[22px] text-[#42464e]">
          预算单元
        </div>
        <div
          className={cn(
            'flex min-w-0 flex-1 items-center gap-1 rounded-r-[4px] border bg-white px-3',
            isOpen ? '' : 'border-[#dde2e9]',
          )}
          style={isOpen ? { borderColor: PRIMARY_COLOR, boxShadow: PRIMARY_RING } : undefined}
          onClick={() => {
            if (!isOpen) {
              onOpen()
            }
          }}
        >
          <div className="flex min-w-0 flex-1 items-center gap-1 overflow-hidden">
            {triggerPreviewNodes.map((node) => (
              <span
                key={node.id}
                className="inline-flex max-w-[160px] shrink-0 items-center gap-1 rounded-[4px] bg-[#f1f3f5] px-2 py-[1px] text-[13px] leading-[20px] text-[#42464e]"
              >
                <OverflowTooltip enabled={enableOverflowTooltip} content={node.name} className="truncate">
                  {node.name}
                </OverflowTooltip>
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation()
                    onRemoveSelected(node.id)
                  }}
                  className="rounded p-0.5 text-[#8f96a3] transition hover:bg-[#e7eaee] hover:text-[#5c6370]"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
            {extraSelectedCount > 0 ? (
              <span className="inline-flex shrink-0 items-center rounded-[4px] bg-[#f1f3f5] px-2 py-[1px] text-[13px] leading-[20px] text-[#737a87]">
                +{extraSelectedCount}
              </span>
            ) : null}
            <input
              value={searchText}
              onFocus={() => {
                if (!isOpen) {
                  onOpen()
                }
              }}
              onChange={(event) => onSearchTextChange(event.target.value)}
              placeholder={selectedNodes.length ? '' : '多选请换行/逗号分隔'}
              className="w-0 min-w-0 flex-1 border-0 bg-transparent text-[13px] leading-[22px] text-[#42464e] outline-none placeholder:text-[#737a87]"
            />
          </div>
          <button
            type="button"
            onClick={(event) => {
              if (showClearIcon) {
                event.stopPropagation()
                onClearSelected()
                if (searchText.trim()) {
                  onSearchTextChange('')
                }
                return
              }

              if (!isOpen) {
                onOpen()
              }
            }}
            className="flex h-4 w-4 shrink-0 items-center justify-center text-[#737a87] transition hover:text-[#42464e]"
          >
            {showClearIcon ? <X className="h-3 w-3" /> : <ChevronDown className={cn('h-3 w-3 transition', isOpen && 'rotate-180')} />}
          </button>
        </div>
      </div>

      {isOpen ? (
        <div
          className="absolute left-0 top-[36px] z-30 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.18)]"
          style={{ width: leftPanelWidth + SELECTED_PANEL_WIDTH }}
        >
          <div className="flex items-center gap-4 border-b border-slate-200 bg-[#f7f8fa] px-4 py-3">
            <div className="flex min-w-0 items-center gap-4">
              <label className="flex items-center gap-2 text-[13px] leading-[22px] text-slate-700">
                <span>仅看一级预算单元</span>
                <Switch size="small" checked={filterToTopLevel} onChange={onFilterToTopLevelChange} />
              </label>
              <label className="flex items-center gap-2 text-[13px] leading-[22px] text-slate-700">
                <span>仅看我有权限的</span>
                <Switch size="small" checked={showPermittedOnly} onChange={onShowPermittedOnlyChange} />
              </label>
            </div>
            <div className="ml-auto pl-4">
              <PasteFilterNotice invalidCount={invalidPastedCount} />
            </div>
          </div>

          <div className="relative flex">
            <div
              className="pointer-events-none absolute bottom-0 top-0 z-10 w-px bg-slate-200"
              style={{ left: leftPanelWidth }}
            />
            <div style={{ width: leftPanelWidth }}>
              <div className="flex h-[42px] items-center border-b border-slate-200 pl-[18px] pr-4">
                <label className="flex items-center gap-2 text-[13px] leading-[22px] font-medium text-slate-700">
                  <VeCheckbox checked={leftAllSelected} indeterminate={!leftAllSelected && leftSomeSelected} onChange={toggleBulkSelection} />
                  全部选择：{bulkSelectableIds.length} 项
                </label>
              </div>
              <div className="h-[344px]" style={{ width: leftPanelWidth }}>
                {hasDelimitedSearch ? (
                  <div className="hover-scrollbar h-full overflow-y-auto bg-white p-2">
                    {tokenizedResults.length ? (
                      <div className="space-y-2">
                        {tokenizedResults.map((node) => {
                          const checkState = getNodeCheckState(node.id, selectedSet, visibleChildrenMap)

                          return (
                            <div
                              key={node.id}
                              className="flex cursor-pointer items-center gap-3 rounded-md bg-slate-50 px-3 py-3 text-[13px] leading-[22px] text-slate-800 transition hover:bg-slate-100"
                              onClick={() => onToggleNode(node.id)}
                            >
                              <div onClick={(event) => event.stopPropagation()}>
                                <VeCheckbox
                                  checked={checkState.checked}
                                  indeterminate={checkState.indeterminate}
                                  onChange={() => onToggleNode(node.id)}
                                />
                              </div>
                              <div className="min-w-0 flex-1">
                                <OverflowTooltip
                                  enabled={enableOverflowTooltip}
                                  content={getPathLabelText(node, visibleNodeMap)}
                                  className="block truncate"
                                >
                                  {renderTokenizedPathLabel(node, visibleNodeMap, matchedTokenSet)}
                                </OverflowTooltip>
                              </div>
                              <StatusBadge node={node} />
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <TransferEmptyState message="暂未匹配到相关预算单元" />
                    )}
                  </div>
                ) : hasSearch ? (
                  <div className="hover-scrollbar h-full overflow-y-auto bg-white pb-[6px] pl-[6px] pr-[5px] pt-[6px]">
                    {searchResults.length ? (
                      <div className="space-y-1">
                        {searchResults.map((node) => {
                          const checkState = getNodeCheckState(node.id, selectedSet, visibleChildrenMap)

                          return (
                            <div
                              key={node.id}
                              className="flex items-center gap-2 rounded-[4px] bg-white px-3 py-[5px] text-[13px] leading-[22px] text-slate-800 transition hover:bg-[#f7f8fa]"
                            >
                              <VeCheckbox
                                checked={checkState.checked}
                                indeterminate={checkState.indeterminate}
                                onChange={() => onToggleNode(node.id)}
                              />
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-[6px]">
                                  <OverflowTooltip
                                    enabled={enableOverflowTooltip}
                                    content={getPathLabelText(node, visibleNodeMap)}
                                    className="block truncate text-slate-800"
                                  >
                                    {renderSearchPathLabel(node, visibleNodeMap, keyword)}
                                  </OverflowTooltip>
                                  <StatusBadge node={node} />
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <TransferEmptyState message="暂未匹配到相关预算单元" />
                    )}
                  </div>
                ) : cascadeColumns.length ? (
                  <div className="flex h-full" style={{ width: leftPanelWidth }}>
                    {cascadeColumns.map((column, level) => (
                      <div
                        key={`column-${level}`}
                        className={cn(
                          'hover-scrollbar h-full overflow-y-auto bg-white py-2',
                          level < cascadeColumns.length - 1 && 'border-r border-slate-200',
                        )}
                        style={{ width: level === 0 ? FIRST_CASCADE_COLUMN_WIDTH : CASCADE_COLUMN_WIDTH }}
                      >
                        {column.map((node) => {
                          const hasChildren = Boolean(node.children?.length) && !filterToTopLevel
                          const checkState = getNodeCheckState(node.id, selectedSet, visibleChildrenMap)
                          const isActive = !filterToTopLevel && activePath[level] === node.id

                          return (
                            <div
                              key={node.id}
                              className={cn(
                                'mx-[6px] flex cursor-pointer items-center gap-2 rounded px-3 py-[7px] text-[13px] leading-[22px] transition',
                                isActive ? 'bg-slate-100 text-slate-900' : 'text-slate-700 hover:bg-slate-50',
                              )}
                              onClick={() => handleActivateNode(level, node)}
                            >
                              <div onClick={(event) => event.stopPropagation()}>
                                <VeCheckbox
                                  checked={checkState.checked}
                                  indeterminate={checkState.indeterminate}
                                  onChange={() => onToggleNode(node.id)}
                                />
                              </div>
                              <div className="flex min-w-0 flex-1 items-center gap-[6px]">
                                <OverflowTooltip
                                  enabled={enableOverflowTooltip}
                                  content={node.name}
                                  className="min-w-0 shrink truncate"
                                >
                                  {node.name}
                                </OverflowTooltip>
                                {!filterToTopLevel && node.level > 1 ? <StatusBadge node={node} /> : null}
                              </div>
                              {hasChildren ? <ChevronRight className="h-4 w-4 text-slate-400" /> : null}
                            </div>
                          )
                        })}
                      </div>
                    ))}
                  </div>
                ) : (
                  <TransferEmptyState message="暂未匹配到相关预算单元" />
                )}
              </div>
            </div>

            <div className="bg-white" style={{ width: SELECTED_PANEL_WIDTH }}>
              <div className="flex h-[42px] items-center justify-between border-b border-slate-200 px-4">
                <label className="flex items-center gap-2 text-[13px] leading-[22px] font-medium text-slate-700">
                  <VeCheckbox checked={leftAllSelected} indeterminate={!leftAllSelected && leftSomeSelected} onChange={toggleBulkSelection} />
                  已选择：{selectedNodes.length} 项
                </label>
                <button
                  type="button"
                  onClick={onClearSelected}
                  className="rounded p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                >
                  <img src={deleteIcon} alt="" aria-hidden="true" className="h-5 w-5" />
                </button>
              </div>
              <div
                className="hover-scrollbar h-[344px] overflow-y-auto py-3"
                style={{ paddingLeft: selectedListHorizontalPadding, paddingRight: selectedListHorizontalPadding }}
              >
                {selectedNodes.length ? (
                  <div className="space-y-1">
                    {selectedNodes.map((node) => (
                      <div key={node.id} className="flex items-center gap-3 rounded px-3 py-2 text-[13px] leading-[22px] text-slate-700 hover:bg-slate-50">
                        <div className="min-w-0 flex-1">
                          <div className="flex min-w-0 items-center gap-[6px]">
                            <OverflowTooltip
                              enabled={enableOverflowTooltip}
                              content={showSelectedPath ? getPathLabelText(node, visibleNodeMap) : node.name}
                              className="block truncate"
                            >
                              {showSelectedPath ? getPathLabelText(node, visibleNodeMap) : node.name}
                            </OverflowTooltip>
                            <StatusBadge node={node} />
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => onRemoveSelected(node.id)}
                          className="rounded p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <TransferEmptyState message="暂未选择预算单元" />
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
