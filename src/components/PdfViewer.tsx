import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  FileText, 
  Download, 
  ExternalLink, 
  Calendar, 
  AlertCircle,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCcw
} from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import { FileNode } from '../types';
import { formatDate, formatFileSize } from '../utils/fileUtils';

// Set PDF.js worker source matching installed pdfjs-dist 3.11.174
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

interface PdfViewerProps {
  fileNode: FileNode;
}

interface SinglePdfPageProps {
  pdfDoc: pdfjsLib.PDFDocumentProxy;
  pageNumber: number;
  scale: number;
  onPageVisible: (pageNumber: number) => void;
  registerRef: (pageNumber: number, el: HTMLDivElement | null) => void;
}

const SinglePdfPage: React.FC<SinglePdfPageProps> = ({
  pdfDoc,
  pageNumber,
  scale,
  onPageVisible,
  registerRef
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const renderTaskRef = useRef<any>(null);
  const [isRendering, setIsRendering] = useState(true);

  useEffect(() => {
    let isCancelled = false;

    const renderPage = async () => {
      if (!canvasRef.current) return;
      try {
        setIsRendering(true);
        if (renderTaskRef.current) {
          renderTaskRef.current.cancel();
        }

        const page = await pdfDoc.getPage(pageNumber);
        if (isCancelled) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const context = canvas.getContext('2d');
        if (!context) return;

        const viewport = page.getViewport({ scale });
        const outputScale = window.devicePixelRatio || 1;

        canvas.width = Math.floor(viewport.width * outputScale);
        canvas.height = Math.floor(viewport.height * outputScale);
        canvas.style.width = `${Math.floor(viewport.width)}px`;
        canvas.style.height = `${Math.floor(viewport.height)}px`;

        const transform = outputScale !== 1 ? [outputScale, 0, 0, outputScale, 0, 0] : undefined;

        const renderContext = {
          canvasContext: context,
          viewport: viewport,
          canvas: canvas,
          transform: transform
        };

        const renderTask = page.render(renderContext);
        renderTaskRef.current = renderTask;

        await renderTask.promise;
        if (!isCancelled) {
          setIsRendering(false);
        }
      } catch (err: any) {
        if (err?.name !== 'RenderingCancelledException') {
          console.error(`第 ${pageNumber} 页渲染出错:`, err);
        }
      }
    };

    renderPage();

    return () => {
      isCancelled = true;
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
      }
    };
  }, [pdfDoc, pageNumber, scale]);

  useEffect(() => {
    if (!containerRef.current) return;
    
    registerRef(pageNumber, containerRef.current);

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            onPageVisible(pageNumber);
          }
        });
      },
      { threshold: 0.4 }
    );

    observer.observe(containerRef.current);

    return () => {
      observer.disconnect();
      registerRef(pageNumber, null);
    };
  }, [pageNumber, onPageVisible, registerRef]);

  return (
    <div 
      ref={containerRef}
      data-page-number={pageNumber}
      className="relative flex flex-col items-center mb-6 last:mb-0"
    >
      <div className="relative shadow-xl rounded-lg overflow-hidden bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800">
        <canvas ref={canvasRef} className="block" />
        {isRendering && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-zinc-900/50 backdrop-blur-xs">
            <RefreshCw className="w-5 h-5 text-red-500 animate-spin" />
          </div>
        )}
      </div>
      <div className="mt-2 text-[11px] font-mono text-zinc-400 dark:text-zinc-500 font-medium select-none">
        第 {pageNumber} 页
      </div>
    </div>
  );
};

export const PdfViewer: React.FC<PdfViewerProps> = ({ fileNode }) => {
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.2);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  const pageElementsRef = useRef<{ [key: number]: HTMLDivElement | null }>({});

  const registerPageRef = useCallback((pageNumber: number, el: HTMLDivElement | null) => {
    pageElementsRef.current[pageNumber] = el;
  }, []);

  const handlePageVisible = useCallback((pageNumber: number) => {
    setCurrentPage(pageNumber);
  }, []);

  const scrollToPage = (pageNum: number) => {
    const el = pageElementsRef.current[pageNum];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setCurrentPage(pageNum);
    }
  };

  // Load PDF Document
  useEffect(() => {
    let active = true;
    let createdObjectUrl: string | null = null;

    setIsLoading(true);
    setError(null);
    setPdfDoc(null);
    setCurrentPage(1);
    pageElementsRef.current = {};

    const loadPdf = async () => {
      try {
        let arrayBuffer: ArrayBuffer | null = null;
        let fileObj = fileNode.fileObject;

        if (!fileObj && fileNode.handle && fileNode.handle.kind === 'file') {
          fileObj = await (fileNode.handle as FileSystemFileHandle).getFile();
        }

        if (fileObj) {
          arrayBuffer = await fileObj.arrayBuffer();
          const blob = new Blob([fileObj], { type: 'application/pdf' });
          createdObjectUrl = URL.createObjectURL(blob);
          if (active) setPdfUrl(createdObjectUrl);
        } else if (typeof fileNode.content === 'string') {
          if (fileNode.content.startsWith('data:application/pdf;base64,')) {
            const base64Data = fileNode.content.split(',')[1];
            const binaryString = atob(base64Data);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
              bytes[i] = binaryString.charCodeAt(i);
            }
            arrayBuffer = bytes.buffer;
            if (active) setPdfUrl(fileNode.content);
          } else {
            const encoder = new TextEncoder();
            arrayBuffer = encoder.encode(fileNode.content).buffer;
          }
        }

        if (!arrayBuffer) {
          throw new Error('无法提取 PDF 文件二进制数据');
        }

        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        const doc = await loadingTask.promise;

        if (active) {
          setPdfDoc(doc);
          setNumPages(doc.numPages);
          setIsLoading(false);
        }
      } catch (err: any) {
        console.error('PDF 解析失败:', err);
        if (active) {
          setError(err.message || 'PDF 解析失败，文件可能已损坏或受到安全限制。');
          setIsLoading(false);
        }
      }
    };

    loadPdf();

    return () => {
      active = false;
      if (createdObjectUrl) {
        URL.revokeObjectURL(createdObjectUrl);
      }
    };
  }, [fileNode]);

  const handlePrevPage = () => {
    const prev = Math.max(1, currentPage - 1);
    scrollToPage(prev);
  };

  const handleNextPage = () => {
    const next = Math.min(numPages, currentPage + 1);
    scrollToPage(next);
  };

  const handleZoomIn = () => {
    setScale(prev => Math.min(3.0, prev + 0.2));
  };

  const handleZoomOut = () => {
    setScale(prev => Math.max(0.5, prev - 0.2));
  };

  const handleResetZoom = () => {
    setScale(1.2);
  };

  const handleDownload = () => {
    if (!pdfUrl) return;
    const a = document.createElement('a');
    a.href = pdfUrl;
    a.download = fileNode.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleOpenInNewTab = () => {
    if (!pdfUrl) return;
    window.open(pdfUrl, '_blank');
  };

  const pageNumbers = Array.from({ length: numPages }, (_, i) => i + 1);

  return (
    <div className="flex-1 flex flex-col h-full bg-zinc-100 dark:bg-zinc-950 overflow-hidden">
      {/* Top File Info & Main Toolbar */}
      <div className="px-4 sm:px-6 py-3 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex flex-wrap items-center justify-between gap-3 shrink-0 shadow-2xs">
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200/60 dark:border-red-800/60 shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">{fileNode.name}</h2>
              <span className="px-1.5 py-0.5 rounded text-[10px] uppercase font-mono bg-red-100 dark:bg-red-900/60 text-red-700 dark:text-red-300 font-semibold shrink-0">
                PDF
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
              {fileNode.size && <span>{formatFileSize(fileNode.size)}</span>}
              {fileNode.lastModified && (
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-zinc-400" />
                  <span>修改时间: {formatDate(fileNode.lastModified)}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {pdfUrl && (
            <>
              <button
                onClick={handleOpenInNewTab}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 transition-all cursor-pointer"
                title="在新标签页全屏打开"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">新窗口打开</span>
              </button>

              <button
                onClick={handleDownload}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-red-600 hover:bg-red-500 text-white shadow-xs transition-all cursor-pointer"
                title="下载 PDF"
              >
                <Download className="w-3.5 h-3.5" />
                <span>下载 PDF</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* PDF Controls Sub-bar (Pages & Zoom) */}
      {!error && numPages > 0 && (
        <div className="px-4 py-2 border-b border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50 dark:bg-zinc-900/60 flex items-center justify-between gap-4 shrink-0 text-xs text-zinc-700 dark:text-zinc-300">
          {/* Pagination Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevPage}
              disabled={currentPage <= 1}
              className="p-1.5 rounded-md hover:bg-zinc-200 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              title="上一页"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-1.5 font-medium">
              <span>第</span>
              <input
                type="number"
                min={1}
                max={numPages}
                value={currentPage}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  if (val >= 1 && val <= numPages) {
                    scrollToPage(val);
                  }
                }}
                className="w-12 px-1.5 py-0.5 text-center bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded text-xs font-mono focus:outline-none focus:ring-1 focus:ring-red-500"
              />
              <span>/ {numPages} 页</span>
            </div>

            <button
              onClick={handleNextPage}
              disabled={currentPage >= numPages}
              className="p-1.5 rounded-md hover:bg-zinc-200 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              title="下一页"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Zoom Controls */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleZoomOut}
              disabled={scale <= 0.5}
              className="p-1.5 rounded-md hover:bg-zinc-200 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              title="缩小"
            >
              <ZoomOut className="w-4 h-4" />
            </button>

            <span className="w-12 text-center font-mono font-medium text-xs">
              {Math.round(scale * 100)}%
            </span>

            <button
              onClick={handleZoomIn}
              disabled={scale >= 3.0}
              className="p-1.5 rounded-md hover:bg-zinc-200 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              title="放大"
            >
              <ZoomIn className="w-4 h-4" />
            </button>

            <button
              onClick={handleResetZoom}
              className="p-1.5 rounded-md hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors ml-1 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
              title="重置缩放 (120%)"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Main Continuous Scroll Container */}
      <div className="flex-1 relative overflow-auto custom-scrollbar bg-zinc-200/80 dark:bg-zinc-950 p-4 sm:p-8 flex flex-col items-center">
        {isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xs z-10 gap-3">
            <RefreshCw className="w-6 h-6 text-red-500 animate-spin" />
            <p className="text-xs font-medium text-zinc-600 dark:text-zinc-300">正在解析 PDF 文档...</p>
          </div>
        )}

        {error ? (
          <div className="my-auto flex flex-col items-center justify-center p-8 text-center bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-md max-w-md">
            <AlertCircle className="w-10 h-10 text-rose-500 mb-3" />
            <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 mb-1">无法打开 PDF 文档</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4">{error}</p>
            {pdfUrl && (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleOpenInNewTab}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-medium bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 text-zinc-700 dark:text-zinc-200 transition-all cursor-pointer"
                >
                  在新窗口尝试打开
                </button>
                <button
                  onClick={handleDownload}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-medium bg-red-600 hover:bg-red-500 text-white shadow-xs transition-all cursor-pointer"
                >
                  下载原始文件
                </button>
              </div>
            )}
          </div>
        ) : (
          pdfDoc && (
            <div className="flex flex-col items-center w-full max-w-5xl py-2">
              {pageNumbers.map(pageNumber => (
                <SinglePdfPage
                  key={pageNumber}
                  pdfDoc={pdfDoc}
                  pageNumber={pageNumber}
                  scale={scale}
                  onPageVisible={handlePageVisible}
                  registerRef={registerPageRef}
                />
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
};

