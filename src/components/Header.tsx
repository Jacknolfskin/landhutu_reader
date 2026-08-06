import React, { useState, useRef, useEffect } from 'react';
import { 
  FolderOpen, 
  Search, 
  Sun, 
  Moon, 
  Sidebar, 
  RotateCw,
  ListTree, 
  FileText, 
  FileSpreadsheet, 
  Presentation,
  Image as ImageIcon, 
  Code, 
  Video,
  Music,
  Sparkles,
  Layers,
  ChevronDown,
  Check,
  Plus,
  X,
  Trash2,
  FolderKanban,
  Archive,
  Mail,
  PenTool,
  Box,
  MapPin,
  Package
} from 'lucide-react';
import { CategoryGroupId, FileNode, ThemeMode } from '../types';
import { getAllFiles } from '../utils/fileUtils';

interface HeaderProps {
  folderName: string;
  loadedFolders?: FileNode[];
  activeFolderId?: string | null;
  onSwitchFolder?: (folderId: string) => void;
  onCloseFolder?: (folderId: string, e?: React.MouseEvent) => void;
  onOpenLocal: () => void;
  onSelectDirectoryInput: (files: FileList) => void;
  onLoadDemoFolder: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedCategory: CategoryGroupId;
  onCategoryChange: (cat: CategoryGroupId) => void;
  theme: ThemeMode;
  onToggleTheme: () => void;
  showFileTree: boolean;
  onToggleFileTree: () => void;
  onRefreshFolder?: () => void;
  isRefreshing?: boolean;
  showOutline: boolean;
  onToggleOutline: () => void;
  hasOutlineItems: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  folderName,
  loadedFolders = [],
  activeFolderId,
  onSwitchFolder,
  onCloseFolder,
  onOpenLocal,
  onSelectDirectoryInput: _onSelectDirectoryInput,
  onLoadDemoFolder,
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  theme,
  onToggleTheme,
  showFileTree,
  onToggleFileTree,
  onRefreshFolder,
  isRefreshing = false,
  showOutline,
  onToggleOutline,
  hasOutlineItems
}) => {
  const [isFolderMenuOpen, setIsFolderMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsFolderMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const categories: { id: CategoryGroupId; label: string; title?: string; icon: React.ReactNode }[] = [
    { id: 'all', label: '全部', icon: <Layers className="w-3.5 h-3.5" /> },
    { id: 'markdown', label: 'Markdown', title: '.md / .markdown / .mdown / .mkd / .mmd / .mermaid', icon: <FileText className="w-3.5 h-3.5 text-blue-500" /> },
    {
      id: 'office',
      label: 'Office',
      title: 'Word: .docx/.doc/.docm/.rtf/.odt/.dotx/.wps  |  表格: .xlsx/.xls/.xlsm/.csv/.tsv/.ods/.numbers  |  演示: .pptx/.ppt/.pptm/.ppsx/.odp/.key',
      icon: <FileText className="w-3.5 h-3.5 text-indigo-500" />,
    },
    { id: 'pdf', label: 'PDF', title: '.pdf / .epub / .xps / .oxps / .ofd', icon: <FileText className="w-3.5 h-3.5 text-red-500" /> },
    { id: 'image', label: '图片', title: '.jpg/.png/.gif/.webp/.svg/.bmp/.ico/.tif/.tiff/.avif/.jxl/.heic', icon: <ImageIcon className="w-3.5 h-3.5 text-amber-500" /> },
    { id: 'video', label: '视频', title: '.mp4/.webm/.mov/.mkv/.avi/.flv/.wmv/.m3u8 等', icon: <Video className="w-3.5 h-3.5 text-purple-500" /> },
    { id: 'audio', label: '音频', title: '.mp3/.wav/.aac/.flac/.m4a/.ogg/.opus 等', icon: <Music className="w-3.5 h-3.5 text-teal-500" /> },
    { id: 'textcode', label: '文本/代码', title: '.txt/.json/.js/.ts/.html/.css/.py 等', icon: <Code className="w-3.5 h-3.5 text-rose-500" /> },
    { id: 'archive', label: '压缩包', title: '.zip/.rar/.7z/.tar/.gz/.bz2/.xz', icon: <Archive className="w-3.5 h-3.5 text-stone-500" /> },
    { id: 'email', label: '邮件', title: '.eml/.msg/.mbox', icon: <Mail className="w-3.5 h-3.5 text-sky-500" /> },
    { id: 'drawing', label: '绘图', title: '.drawio/.dio/.excalidraw/.tldraw', icon: <PenTool className="w-3.5 h-3.5 text-cyan-500" /> },
    { id: 'cad', label: 'CAD', title: '.dwg/.dxf/.dwf/.step/.iges/.ifc 等', icon: <Box className="w-3.5 h-3.5 text-lime-500" /> },
    { id: 'model3d', label: '3D模型', title: '.gltf/.glb/.obj/.stl/.fbx/.3mf/.usdz 等', icon: <Box className="w-3.5 h-3.5 text-violet-500" /> },
    { id: 'gis', label: 'GIS', title: '.geojson/.topojson/.kml/.kmz/.gpx/.shp', icon: <MapPin className="w-3.5 h-3.5 text-green-500" /> },
    { id: 'asset', label: '其他资源', title: '字体/.psd/.ai/.eps/.sqlite/.db/.wasm 等', icon: <Package className="w-3.5 h-3.5 text-zinc-500" /> },
  ];

  return (
    <header className="sticky top-0 z-30 flex flex-col border-b border-black/5 dark:border-white/10 bg-white/70 dark:bg-zinc-900/70 backdrop-blur-xl transition-colors duration-200">
      {/* Upper toolbar */}
      <div className="flex items-center justify-between px-4 h-13 gap-3">
        {/* Left: Brand & Folder Switcher Dropdown */}
        <div className="flex items-center gap-2 min-w-0">
          <button
            onClick={onToggleFileTree}
            className={`p-1.5 rounded-lg transition-all ${
              showFileTree 
                ? 'bg-zinc-200/70 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100' 
                : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800/60'
            }`}
            title={showFileTree ? "隐藏侧边栏" : "展开侧边栏"}
          >
            <Sidebar className="w-4 h-4" />
          </button>

          {/* Multi-Folder Switcher Menu */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsFolderMenuOpen(v => !v)}
              className="flex items-center gap-2 pl-2 pr-2.5 py-1 rounded-full border border-zinc-200/80 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 transition-all text-left group min-w-0"
              title="切换或打开文件夹"
            >
              <FolderKanban className="w-3.5 h-3.5 text-blue-500 shrink-0" />
              <span className="font-semibold text-xs tracking-tight text-zinc-900 dark:text-zinc-100 truncate max-w-[150px] sm:max-w-[200px]">
                {folderName || '请选择文件夹'}
              </span>

              {loadedFolders.length > 0 && (
                <span className="px-1.5 py-0.2 text-[10px] font-medium bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-full shrink-0">
                  {loadedFolders.length} 个文件夹
                </span>
              )}

              <ChevronDown className={`w-3 h-3 text-zinc-400 transition-transform duration-200 ${isFolderMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Folder Switcher Popover Panel */}
            {isFolderMenuOpen && (
              <div className="absolute left-0 mt-1.5 w-72 rounded-2xl bg-white/95 dark:bg-zinc-900/95 backdrop-blur-2xl border border-zinc-200/90 dark:border-zinc-800 shadow-xl z-50 p-2 text-xs transition-all animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-2.5 py-1.5 flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 mb-1 text-zinc-400 font-medium">
                  <span>工作区文件夹 ({loadedFolders.length})</span>
                  <span className="text-[10px]">支持多库切换</span>
                </div>

                <div className="max-h-56 overflow-y-auto space-y-0.5 custom-scrollbar">
                  {loadedFolders.length === 0 ? (
                    <div className="py-4 text-center text-zinc-400 text-xs">
                      尚未加载任何文件夹
                    </div>
                  ) : (
                    loadedFolders.map((folder) => {
                      const isActive = folder.id === activeFolderId;
                      const fileCount = getAllFiles(folder).length;
                      return (
                        <div
                          key={folder.id}
                          onClick={() => {
                            if (onSwitchFolder) onSwitchFolder(folder.id);
                            setIsFolderMenuOpen(false);
                          }}
                          className={`flex items-center justify-between px-2.5 py-2 rounded-xl cursor-pointer transition-all group ${
                            isActive
                              ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 font-medium'
                              : 'hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0 pr-2">
                            {isActive ? (
                              <Check className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                            ) : (
                              <FolderOpen className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                            )}
                            <div className="truncate">
                              <div className="truncate font-medium leading-tight">{folder.name}</div>
                              <div className="text-[10px] text-zinc-400">{fileCount} 个文档</div>
                            </div>
                          </div>

                          {onCloseFolder && (
                            <button
                              onClick={(e) => {
                                onCloseFolder(folder.id, e);
                              }}
                              className="p-1 rounded-md opacity-0 group-hover:opacity-100 hover:bg-rose-500/10 hover:text-rose-500 transition-all text-zinc-400"
                              title="移除此文件夹"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>

                  <div className="pt-1.5 mt-1 border-t border-zinc-100 dark:border-zinc-800 space-y-1">
                    <button
                      onClick={() => {
                        setIsFolderMenuOpen(false);
                        onOpenLocal();
                      }}
                      className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-[#2b72ee] hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-500 text-white font-medium transition-all shadow-xs cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>打开文件/文件夹</span>
                    </button>

                    <button
                      onClick={() => {
                        setIsFolderMenuOpen(false);
                        onLoadDemoFolder();
                      }}
                      className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 font-medium transition-colors cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      <span>加载演示项目</span>
                    </button>
                  </div>
              </div>
            )}
          </div>
        </div>

        {/* Middle: Quick search bar */}
        <div className="flex-1 max-w-xs hidden md:block">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="搜索文档与大纲..."
              className="w-full pl-8 pr-7 py-1 text-xs bg-zinc-100/80 dark:bg-zinc-800/60 border border-transparent focus:border-blue-500 rounded-full text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:bg-white dark:focus:bg-zinc-900 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Right: Theme toggle */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={onToggleTheme}
            className="p-1.5 rounded-full text-zinc-500 hover:bg-zinc-200/60 dark:hover:bg-zinc-800 dark:text-zinc-400 transition-colors"
            title={theme === 'dark' ? "切换明亮模式" : "切换深色模式"}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-zinc-600" />}
          </button>
        </div>
      </div>

      {/* Filter Tabs Bar & Document Outline button at the exact same height */}
      <div className="flex items-center justify-between px-4 py-1 border-t border-black/5 dark:border-white/5">
        {/* Left: Category filter pills */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
          {categories.map((cat) => {
            const isActive = selectedCategory === cat.id;
            const activeIcon = React.isValidElement(cat.icon)
              ? React.cloneElement(
                  cat.icon as React.ReactElement<{ className?: string }>,
                  {
                    className: `${(cat.icon.props as { className?: string }).className ?? ''} ${isActive ? '!text-white' : ''}`,
                  }
                )
              : cat.icon;
            return (
              <button
                key={cat.id}
                onClick={() => onCategoryChange(cat.id)}
                title={cat.title}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-[#2b72ee] text-white dark:bg-blue-600 dark:text-white shadow-xs font-medium'
                    : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/80'
                }`}
              >
                {activeIcon}
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right: Document Outline toggle button - aligned with "全部" row */}
        <button
          onClick={onToggleOutline}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all shrink-0 ml-2 ${
            showOutline 
              ? 'bg-[#2b72ee] text-white dark:bg-blue-600 dark:text-white shadow-xs font-medium' 
              : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-800'
          }`}
          title={showOutline ? "隐藏大纲" : "显示文档大纲"}
        >
          <ListTree className="w-3.5 h-3.5" />
          <span>文档大纲</span>
          {hasOutlineItems && (
            <span className={`w-1.5 h-1.5 rounded-full ${showOutline ? 'bg-white' : 'bg-blue-500'} animate-pulse`} />
          )}
        </button>
      </div>
    </header>
  );
};
