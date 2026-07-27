import React, { useState, useEffect, useMemo } from 'react';
import { 
  ListTree, 
  Search, 
  Hash, 
  ChevronRight, 
  ChevronDown,
  ChevronsUp,
  ChevronsDown,
  Bookmark, 
  Clock, 
  FileText,
  X
} from 'lucide-react';
import { OutlineItem, FileStats } from '../types';

interface OutlineSidebarProps {
  outlineItems: OutlineItem[];
  activeHeadingId: string | null;
  onSelectHeading: (elementId: string, headingText?: string) => void;
  stats?: FileStats;
  fileName?: string;
  onClose?: () => void;
  width?: number;
  onResizeStart?: (e: React.MouseEvent) => void;
  onResetWidth?: () => void;
  isResizing?: boolean;
}

const OutlineSidebarComponent: React.FC<OutlineSidebarProps> = ({
  outlineItems,
  activeHeadingId,
  onSelectHeading,
  stats,
  fileName,
  onClose,
  width = 288,
  onResizeStart,
  onResetWidth,
  isResizing = false
}) => {
  const [filterQuery, setFilterQuery] = useState<string>('');
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set());

  // Find all items that have children (sub-headings)
  const parentItemIds = useMemo(() => {
    const parentIds: string[] = [];
    for (let i = 0; i < outlineItems.length; i++) {
      if (i + 1 < outlineItems.length && outlineItems[i + 1].level > outlineItems[i].level) {
        parentIds.push(outlineItems[i].id);
      }
    }
    return parentIds;
  }, [outlineItems]);

  const parentSet = useMemo(() => new Set(parentItemIds), [parentItemIds]);

  const isAllCollapsed = parentItemIds.length > 0 && parentItemIds.every(id => collapsedIds.has(id));

  const handleToggleExpandAll = () => {
    if (isAllCollapsed) {
      setCollapsedIds(new Set());
    } else {
      setCollapsedIds(new Set(parentItemIds));
    }
  };

  const toggleCollapse = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCollapsedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Helper to check if an item is hidden by any collapsed ancestor
  const isItemHiddenByAncestor = (index: number): boolean => {
    if (collapsedIds.size === 0 || filterQuery) return false;
    let currentLevel = outlineItems[index].level;
    for (let j = index - 1; j >= 0; j--) {
      if (outlineItems[j].level < currentLevel) {
        if (collapsedIds.has(outlineItems[j].id)) {
          return true;
        }
        currentLevel = outlineItems[j].level;
        if (currentLevel === 1) break;
      }
    }
    return false;
  };

  const visibleItems = useMemo(() => {
    return outlineItems.filter((item, index) => {
      // Filter by search query first if query exists
      if (filterQuery && !item.text.toLowerCase().includes(filterQuery.toLowerCase())) {
        return false;
      }
      // If search query is empty, respect tree collapse state
      if (!filterQuery && isItemHiddenByAncestor(index)) {
        return false;
      }
      return true;
    });
  }, [outlineItems, collapsedIds, filterQuery]);

  return (
    <aside 
      className="border-l border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/40 flex flex-col h-full shrink-0 select-none relative group z-10"
      style={{ width: `${width}px` }}
    >
      {/* Resizer Handle on Left Edge of Right Sidebar */}
      {onResizeStart && (
        <div
          onMouseDown={onResizeStart}
          onDoubleClick={onResetWidth}
          className="absolute top-0 -left-1.5 w-3 h-full cursor-col-resize z-30 flex justify-center"
          title="拖拽调节大纲宽度，双击恢复默认"
        >
          <div 
            className={`w-[2px] h-full transition-colors duration-150 ${
              isResizing 
                ? 'bg-blue-500 dark:bg-blue-400' 
                : 'bg-transparent active:bg-blue-500 dark:active:bg-blue-400'
            }`} 
          />
        </div>
      )}
      {/* Sidebar Header */}
      <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ListTree className="w-4 h-4 text-blue-500" />
          <h2 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">文档大纲</h2>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900">
            {outlineItems.length}
          </span>
        </div>

        <div className="flex items-center gap-1">
          {parentItemIds.length > 0 && !filterQuery && (
            <button
              onClick={handleToggleExpandAll}
              className="p-1 rounded text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
              title={isAllCollapsed ? "全部展开" : "全部折叠"}
            >
              {isAllCollapsed ? <ChevronsDown className="w-3.5 h-3.5" /> : <ChevronsUp className="w-3.5 h-3.5" />}
            </button>
          )}

          {onClose && (
            <button
              onClick={onClose}
              className="p-1 rounded text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
              title="关闭大纲"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Filter / Search within outline */}
      {outlineItems.length > 5 && (
        <div className="px-3 py-2 border-b border-zinc-100 dark:border-zinc-800/60">
          <div className="relative">
            <Search className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              placeholder="大纲关键字筛选..."
              className="w-full pl-7 pr-3 py-1 text-[11px] bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700/80 rounded text-zinc-800 dark:text-zinc-200 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>
      )}

      {/* Outline Items Tree */}
      <div className="flex-1 overflow-y-auto p-2 space-y-0.5 custom-scrollbar">
        {visibleItems.length === 0 ? (
          <div className="p-6 text-center text-xs text-zinc-400">
            {outlineItems.length === 0 ? '该文档未检测到 H1-H6 标题大纲' : '未找到匹配的大纲标题'}
          </div>
        ) : (
          visibleItems.map((item) => {
            const isActive = activeHeadingId === item.elementId;
            const hasChildren = parentSet.has(item.id);
            const isCollapsed = collapsedIds.has(item.id);

            // Indent padding based on heading level (level 1..6)
            const indentLevel = Math.max(0, item.level - 1);
            const paddingLeftPx = 6 + indentLevel * 12;

            return (
              <div
                key={item.id}
                onClick={() => onSelectHeading(item.elementId, item.text)}
                className={`group flex items-center gap-2 py-2 pr-3 rounded-xl text-xs cursor-pointer transition-all ${
                  isActive
                    ? 'bg-[#ebf3fe] dark:bg-blue-950/80 text-blue-600 dark:text-blue-300 font-normal shadow-2xs'
                    : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 hover:text-zinc-900 dark:hover:text-zinc-100'
                }`}
                style={{ paddingLeft: `${paddingLeftPx}px` }}
              >
                {/* Expand / Collapse Icon for parents or bullet for leaf */}
                {hasChildren && !filterQuery ? (
                  <button
                    onClick={(e) => toggleCollapse(item.id, e)}
                    className={`p-0.5 rounded hover:bg-black/5 dark:hover:bg-white/10 shrink-0 transition-transform ${
                      isActive ? 'text-blue-600 dark:text-blue-400' : 'text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300'
                    }`}
                    title={isCollapsed ? '展开子项' : '折叠子项'}
                  >
                    {isCollapsed ? (
                      <ChevronRight className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5" />
                    )}
                  </button>
                ) : (
                  <span className={`shrink-0 w-3.5 flex items-center justify-center`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      isActive 
                        ? 'bg-blue-600 dark:bg-blue-400' 
                        : item.level === 1 
                        ? 'bg-zinc-400 dark:bg-zinc-500' 
                        : 'bg-zinc-300 dark:bg-zinc-700'
                    }`} />
                  </span>
                )}

                <span className="truncate flex-1 leading-tight">
                  {item.text}
                </span>

                {item.line && (
                  <span className={`text-[10px] font-mono shrink-0 opacity-0 group-hover:opacity-100 ${
                    isActive ? 'text-blue-500 dark:text-blue-400' : 'text-zinc-400'
                  }`}>
                    L{item.line}
                  </span>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Bottom document summary */}
      {stats && (
        <div className="p-3 border-t border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 text-[11px] text-zinc-500 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-zinc-400">阅读统计:</span>
            <span className="font-medium text-zinc-700 dark:text-zinc-300">{stats.wordCount} 字</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-zinc-400">预估用时:</span>
            <span className="font-medium text-zinc-700 dark:text-zinc-300">~{stats.readingTimeMinutes} 分钟</span>
          </div>
        </div>
      )}
    </aside>
  );
};

export const OutlineSidebar = React.memo(OutlineSidebarComponent);

