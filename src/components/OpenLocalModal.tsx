import React, { useEffect } from 'react';
import { X, FileText, FolderOpen, UploadCloud } from 'lucide-react';

interface OpenLocalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenFile: () => void;
  onOpenFolder: () => void;
}

export const OpenLocalModal: React.FC<OpenLocalModalProps> = ({
  isOpen,
  onClose,
  onOpenFile,
  onOpenFolder
}) => {
  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      {/* Click outside backdrop */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Modal Card */}
      <div className="relative w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden z-10 animate-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-zinc-100 dark:border-zinc-800/80">
          <div>
            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
              打开本地文档或项目
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              请选择要加载的内容类型
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-all cursor-pointer"
            title="关闭"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: Selection Options */}
        <div className="p-6 space-y-3">
          {/* Option 1: File(s) */}
          <button
            onClick={() => {
              onClose();
              onOpenFile();
            }}
            className="w-full flex items-start gap-4 p-4 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 hover:bg-blue-50/60 dark:hover:bg-blue-950/30 hover:border-blue-300 dark:hover:border-blue-800 text-left transition-all group cursor-pointer"
          >
            <div className="p-3 rounded-xl bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 shrink-0 group-hover:scale-105 transition-transform">
              <FileText className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  打开具体文件
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-zinc-200/60 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400">
                  单文件 / 多选
                </span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
                选择单个或按 Ctrl/Cmd 多选文件，如 Markdown、Word、Excel、PDF、音视频或代码
              </p>
            </div>
          </button>

          {/* Option 2: Folder */}
          <button
            onClick={() => {
              onClose();
              onOpenFolder();
            }}
            className="w-full flex items-start gap-4 p-4 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 hover:bg-emerald-50/60 dark:hover:bg-emerald-950/30 hover:border-emerald-300 dark:hover:border-emerald-800 text-left transition-all group cursor-pointer"
          >
            <div className="p-3 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 shrink-0 group-hover:scale-105 transition-transform">
              <FolderOpen className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  打开本地文件夹
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-zinc-200/60 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400">
                  完整项目
                </span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
                选择整个文件夹目录，自动建立树状层级大纲与文档索引
              </p>
            </div>
          </button>

          {/* Drag & Drop Prompt Box */}
          <div className="pt-2">
            <div className="flex items-center justify-center gap-2 p-3 rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700/80 bg-zinc-100/50 dark:bg-zinc-800/30 text-xs text-zinc-500 dark:text-zinc-400 text-center">
              <UploadCloud className="w-4 h-4 text-zinc-400 shrink-0" />
              <span>提示：也可直接将文件或文件夹拖入应用窗口</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
