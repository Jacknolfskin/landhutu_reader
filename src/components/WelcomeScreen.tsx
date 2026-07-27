import React from 'react';
import { 
  FolderOpen, 
  Sparkles, 
  FileText, 
  FileSpreadsheet, 
  Image as ImageIcon, 
  ListTree, 
  ShieldCheck, 
  Zap,
  MousePointerClick
} from 'lucide-react';

interface WelcomeScreenProps {
  onOpenLocal: () => void;
  onLoadDemoFolder: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  onOpenLocal,
  onLoadDemoFolder
}) => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 bg-zinc-50/50 dark:bg-zinc-950/60 overflow-y-auto">
      <div className="max-w-xl w-full text-center space-y-8">
        {/* Brand Icon & Heading */}
        <div className="space-y-3">
          <div className="inline-flex p-4 rounded-2xl bg-[#2b72ee] text-white dark:bg-blue-600 dark:text-white shadow-md shadow-blue-500/20">
            <FolderOpen className="w-8 h-8" />
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            打开文件，轻松阅读
          </h1>

          <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-md mx-auto leading-relaxed">
            极简离线阅读体验，即刻解析Markdown、Office、PDF、图片、音视频及代码大纲。
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={onOpenLocal}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-[#2b72ee] hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-500 text-white text-sm font-semibold transition-all shadow-md shadow-blue-500/20 active:scale-95 cursor-pointer"
          >
            <FolderOpen className="w-4 h-4" />
            <span>打开文件 / 文件夹</span>
          </button>

          <button
            onClick={onLoadDemoFolder}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 rounded-full border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-sm font-medium transition-colors cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>加载演示项目</span>
          </button>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 border-t border-zinc-200 dark:border-zinc-800 text-left">
          <div className="p-3.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-xs">
            <FileText className="w-4 h-4 text-blue-500 mb-2" />
            <h3 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 mb-0.5">Markdown</h3>
            <p className="text-[11px] text-zinc-500 leading-tight">GFM语法、实时渲染与代码复制</p>
          </div>

          <div className="p-3.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-xs">
            <ListTree className="w-4 h-4 text-emerald-500 mb-2" />
            <h3 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 mb-0.5">智能大纲</h3>
            <p className="text-[11px] text-zinc-500 leading-tight">自动提取 H1-H6 标题大纲点击跳转</p>
          </div>

          <div className="p-3.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-xs">
            <FileSpreadsheet className="w-4 h-4 text-indigo-500 mb-2" />
            <h3 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 mb-0.5">Office 文档</h3>
            <p className="text-[11px] text-zinc-500 leading-tight">Word (.docx) &amp; Excel/CSV 交互表格</p>
          </div>

          <div className="p-3.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-xs">
            <ImageIcon className="w-4 h-4 text-amber-500 mb-2" />
            <h3 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 mb-0.5">图片与媒体</h3>
            <p className="text-[11px] text-zinc-500 leading-tight">高清预览、旋转缩放与格式适配</p>
          </div>
        </div>

        {/* Security badge */}
        <div className="flex items-center justify-center gap-2 text-xs text-zinc-400 font-medium">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>100% 浏览器前端本地运行，隐私零风险</span>
        </div>
      </div>
    </div>
  );
};
