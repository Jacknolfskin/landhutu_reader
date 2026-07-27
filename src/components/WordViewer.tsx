import React, { useEffect, useState } from 'react';
import mammoth from 'mammoth';
import { FileText, Loader2, AlertCircle, Clock, Hash, Calendar } from 'lucide-react';
import { FileNode } from '../types';
import { formatDate, formatFileSize } from '../utils/fileUtils';
import { calculateDocumentStats } from '../utils/outlineExtractor';

interface WordViewerProps {
  fileNode: FileNode;
  onOutlineExtracted?: (htmlContent: string) => void;
}

export const WordViewer: React.FC<WordViewerProps> = ({ fileNode, onOutlineExtracted }) => {
  const [htmlContent, setHtmlContent] = useState<string>('');
  const [rawText, setRawText] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    const loadWordDocument = async () => {
      try {
        let arrayBuffer: ArrayBuffer | null = null;

        if (fileNode.fileObject) {
          arrayBuffer = await fileNode.fileObject.arrayBuffer();
        } else if (fileNode.handle && fileNode.handle.kind === 'file') {
          const file = await (fileNode.handle as FileSystemFileHandle).getFile();
          arrayBuffer = await file.arrayBuffer();
        } else if (fileNode.content && typeof fileNode.content !== 'string') {
          arrayBuffer = fileNode.content as ArrayBuffer;
        }

        if (!arrayBuffer) {
          throw new Error('无法调取该 Word 文档的二进制数据');
        }

        const result = await mammoth.convertToHtml({ arrayBuffer });
        const rawTextResult = await mammoth.extractRawText({ arrayBuffer });

        if (!isMounted) return;

        let processedHtml = result.value;

        // Inject element IDs into H1-H6 tags for outline jumping
        let idx = 0;
        processedHtml = processedHtml.replace(/<h([1-6])([^>]*)>(.*?)<\/h\1>/gi, (match, level, attrs, text) => {
          const cleanText = text.replace(/<[^>]+>/g, '').trim();
          const elementId = `word-heading-${idx++}-${cleanText.toLowerCase().replace(/[^\w\u4e00-\u9fa5]+/g, '-')}`;
          return `<h${level}${attrs} id="${elementId}" class="scroll-m-20 font-bold tracking-tight text-zinc-900 dark:text-zinc-100 my-4">${text}</h${level}>`;
        });

        setHtmlContent(processedHtml);
        setRawText(rawTextResult.value);
        setLoading(false);

        if (onOutlineExtracted) {
          onOutlineExtracted(processedHtml);
        }
      } catch (err: any) {
        console.error('Failed to parse docx:', err);
        if (isMounted) {
          setError(err.message || 'Word 文档解析失败，请确保文件格式为 .docx');
          setLoading(false);
        }
      }
    };

    loadWordDocument();

    return () => {
      isMounted = false;
    };
  }, [fileNode]);

  const stats = calculateDocumentStats(rawText);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-zinc-400">
        <Loader2 className="w-8 h-8 animate-spin text-zinc-600 dark:text-zinc-300 mb-3" />
        <p className="text-xs font-medium">正在解析 Word 文档，提取样式与标题大纲...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-zinc-500">
        <AlertCircle className="w-10 h-10 text-rose-500 mb-3" />
        <h3 className="text-base font-semibold text-zinc-800 dark:text-zinc-200 mb-1">无法直接渲染 Word 文档</h3>
        <p className="text-xs max-w-md text-zinc-500 mb-4">{error}</p>
        <div className="p-4 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 text-xs text-left max-w-lg w-full">
          <p className="font-medium text-zinc-700 dark:text-zinc-300 mb-1">建议：</p>
          <ul className="list-disc list-inside space-y-1 text-zinc-500">
            <li>请确认文件后缀为 <code className="text-xs bg-zinc-200 dark:bg-zinc-800 px-1 rounded">.docx</code> 格式</li>
            <li>老旧的 <code className="text-xs bg-zinc-200 dark:bg-zinc-800 px-1 rounded">.doc</code> 格式建议用 Word 保存为 <code className="text-xs bg-zinc-200 dark:bg-zinc-800 px-1 rounded">.docx</code> 或转换为 Markdown</li>
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-zinc-100/50 dark:bg-zinc-950/60 p-6 sm:p-10 custom-scrollbar">
      {/* Paper container */}
      <div className="max-w-4xl mx-auto bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xs overflow-hidden">
        {/* Document Metadata header */}
        <div className="p-6 sm:p-8 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
          <div className="flex items-center gap-2 text-xs font-medium text-indigo-600 dark:text-indigo-400 mb-2">
            <FileText className="w-4 h-4" />
            <span>Word 文档预览 (.docx)</span>
          </div>

          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-3">
            {fileNode.name}
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-500 font-normal">
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              <span>阅读时间约 {stats.readingTimeMinutes} 分钟</span>
            </div>

            <div className="flex items-center gap-1.5">
              <Hash className="w-3.5 h-3.5" />
              <span>{stats.wordCount.toLocaleString()} 字</span>
            </div>

            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              <span>修改时间: {formatDate(fileNode.lastModified)}</span>
            </div>

            {fileNode.size && (
              <span className="px-2 py-0.5 rounded bg-zinc-200/60 dark:bg-zinc-800 text-[11px]">
                {formatFileSize(fileNode.size)}
              </span>
            )}
          </div>
        </div>

        {/* Word Document Body */}
        <div 
          className="p-8 sm:p-12 prose dark:prose-invert max-w-none text-zinc-800 dark:text-zinc-200 leading-relaxed word-content"
          dangerouslySetInnerHTML={{ __html: htmlContent }}
        />
      </div>
    </div>
  );
};
