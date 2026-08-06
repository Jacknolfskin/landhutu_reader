import React, { useState } from 'react';
import { 
  Folder, 
  FolderOpen, 
  FileText, 
  FileSpreadsheet, 
  Presentation,
  Image as ImageIcon, 
  Code, 
  Video,
  Music,
  File, 
  ChevronRight, 
  ChevronDown, 
  ChevronsUpDown,
  RotateCw,
  Archive,
  Mail,
  PenTool,
  Box,
  MapPin,
  Package
} from 'lucide-react';
import { CategoryGroupId, FileCategory, FileNode } from '../types';
import { CATEGORY_GROUPS, formatFileSize } from '../utils/fileUtils';

interface FileTreeProps {
  rootNode: FileNode | null;
  loadedFolders?: FileNode[];
  activeFolderId?: string | null;
  onSwitchFolder?: (folderId: string) => void;
  onCloseFolder?: (folderId: string, e?: React.MouseEvent) => void;
  onOpenFolder?: () => void;
  onLoadDemoFolder?: () => void;
  selectedFileId: string | null;
  onSelectFile: (file: FileNode) => void;
  searchQuery: string;
  categoryFilter: CategoryGroupId;
  onRefreshFolder?: () => void;
  isRefreshing?: boolean;
}

const FileTreeComponent: React.FC<FileTreeProps> = ({
  rootNode,
  loadedFolders = [],
  activeFolderId,
  onSwitchFolder,
  onCloseFolder,
  onOpenFolder,
  onLoadDemoFolder,
  selectedFileId,
  onSelectFile,
  searchQuery,
  categoryFilter,
  onRefreshFolder,
  isRefreshing = false
}) => {
  const [expandedFolderIds, setExpandedFolderIds] = useState<Record<string, boolean>>({});

  const toggleFolder = (folderId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedFolderIds(prev => ({
      ...prev,
      [folderId]: prev[folderId] === undefined ? false : !prev[folderId]
    }));
  };

  const isFolderExpanded = (folderId: string, defaultExpanded = true): boolean => {
    return expandedFolderIds[folderId] !== undefined 
      ? expandedFolderIds[folderId] 
      : defaultExpanded;
  };

  const getCategoryIcon = (category?: FileCategory, isSelected = false) => {
    switch (category) {
      case 'markdown':
        return <FileText className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-white' : 'text-blue-500'}`} />;
      case 'word':
        return <FileText className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-white' : 'text-indigo-500'}`} />;
      case 'excel':
        return <FileSpreadsheet className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-white' : 'text-emerald-500'}`} />;
      case 'pdf':
        return <FileText className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-white' : 'text-red-500'}`} />;
      case 'ppt':
        return <Presentation className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-white' : 'text-orange-500'}`} />;
      case 'image':
        return <ImageIcon className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-white' : 'text-amber-500'}`} />;
      case 'video':
        return <Video className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-white' : 'text-purple-500'}`} />;
      case 'audio':
        return <Music className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-white' : 'text-teal-500'}`} />;
      case 'code':
      case 'json':
        return <Code className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-white' : 'text-rose-500'}`} />;
      case 'archive':
        return <Archive className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-white' : 'text-stone-500'}`} />;
      case 'email':
        return <Mail className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-white' : 'text-sky-500'}`} />;
      case 'drawing':
        return <PenTool className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-white' : 'text-cyan-500'}`} />;
      case 'cad':
        return <Box className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-white' : 'text-lime-500'}`} />;
      case 'model3d':
        return <Box className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-white' : 'text-violet-500'}`} />;
      case 'gis':
        return <MapPin className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-white' : 'text-green-500'}`} />;
      case 'asset':
        return <Package className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-white' : 'text-zinc-500'}`} />;
      default:
        return <File className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-white' : 'text-zinc-400'}`} />;
    }
  };

  const matchesSearchAndCategory = (node: FileNode): boolean => {
    if (node.kind === 'file') {
      const nameMatches = !searchQuery || node.name.toLowerCase().includes(searchQuery.toLowerCase());
      const categoryMatches =
        categoryFilter === 'all' ||
        CATEGORY_GROUPS[categoryFilter].includes(node.category as FileCategory);
      return nameMatches && categoryMatches;
    }

    if (node.kind === 'directory' && node.children) {
      return node.children.some(child => matchesSearchAndCategory(child));
    }

    return false;
  };

  const renderNode = (node: FileNode, level = 0) => {
    const isDir = node.kind === 'directory';

    if (!matchesSearchAndCategory(node)) {
      return null;
    }

    const indentPx = level * 16 + 8;

    if (isDir) {
      const expanded = isFolderExpanded(node.id, level < 2);
      const childCount = node.children?.filter(c => matchesSearchAndCategory(c)).length || 0;

      return (
        <div key={node.id} className="select-none">
          <div
            onClick={(e) => toggleFolder(node.id, e)}
            className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/60 cursor-pointer transition-colors group"
            style={{ paddingLeft: `${indentPx}px` }}
          >
            <span className="text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-200 shrink-0 flex items-center justify-center w-3.5 h-3.5">
              {expanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            </span>
            {expanded ? (
              <FolderOpen className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            ) : (
              <Folder className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            )}
            <span className="truncate flex-1 font-medium">{node.name}</span>
            <span className="text-[10px] text-zinc-400 group-hover:text-zinc-500">
              {childCount}
            </span>
          </div>

          {expanded && node.children && (
            <div className="relative">
              <div 
                className="absolute top-0 bottom-0 w-px bg-zinc-200/90 dark:bg-zinc-800/90 pointer-events-none" 
                style={{ left: `${indentPx + 7}px` }} 
              />
              {node.children.map(child => renderNode(child, level + 1))}
            </div>
          )}
        </div>
      );
    }

    // File node
    const isSelected = selectedFileId === node.id;

    return (
      <div
        key={node.id}
        onClick={() => onSelectFile(node)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-2xl text-xs cursor-pointer transition-all group ${
          isSelected
            ? 'bg-[#2b72ee] text-white dark:bg-blue-600 dark:text-white font-medium shadow-xs'
            : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/80'
        }`}
        style={{ paddingLeft: `${indentPx}px` }}
      >
        <span className="w-3.5 h-3.5 shrink-0" />
        {getCategoryIcon(node.category, isSelected)}
        <span className="truncate flex-1 font-medium">{node.name}</span>
        {node.size && (
          <span className={`text-[10px] shrink-0 font-mono ${isSelected ? 'text-blue-100' : 'text-zinc-400 group-hover:text-zinc-500'}`}>
            {formatFileSize(node.size)}
          </span>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-zinc-50/50 dark:bg-zinc-900/40 border-r border-zinc-200 dark:border-zinc-800">
      {/* Optional Folders Action Header if rootNode exists */}
      {rootNode && (
        <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-200/80 dark:border-zinc-800/80 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
          <span className="truncate text-zinc-700 dark:text-zinc-300 font-medium">
            {rootNode.name}
          </span>
          <div className="flex items-center gap-1">
            {onRefreshFolder && (
              <button
                onClick={onRefreshFolder}
                disabled={isRefreshing}
                className="p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors disabled:opacity-40"
                title="刷新文件夹获取最新文件"
              >
                <RotateCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-blue-500' : ''}`} />
              </button>
            )}
            <button
              onClick={() => {
                const allExpanded = Object.values(expandedFolderIds).every(Boolean);
                const newState: Record<string, boolean> = {};
                const setAll = (node: FileNode) => {
                  if (node.kind === 'directory') {
                    newState[node.id] = !allExpanded;
                    node.children?.forEach(setAll);
                  }
                };
                setAll(rootNode);
                setExpandedFolderIds(newState);
              }}
              className="p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
              title="展开 / 折叠所有文件夹"
            >
              <ChevronsUpDown className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Tree Content */}
      <div className="flex-1 overflow-y-auto p-2 space-y-0.5 custom-scrollbar">
        {!rootNode ? (
          <div className="p-6 text-center text-xs text-zinc-400 flex flex-col items-center justify-center h-full">
            <p>尚未加载任何本地文件夹</p>
          </div>
        ) : (
          renderNode(rootNode, 0)
        )}
      </div>
    </div>
  );
};

export const FileTree = React.memo(FileTreeComponent);

