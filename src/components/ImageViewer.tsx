import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  Maximize2, 
  Grid, 
  Image as ImageIcon,
  Calendar,
  HardDrive
} from 'lucide-react';
import { FileNode } from '../types';
import { formatDate, formatFileSize } from '../utils/fileUtils';

interface ImageViewerProps {
  fileNode: FileNode;
  content?: string;
}

export const ImageViewer: React.FC<ImageViewerProps> = ({ fileNode, content }) => {
  const [imageUrl, setImageUrl] = useState<string>('');
  const [zoom, setZoom] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);
  const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null);
  const [bgStyle, setBgStyle] = useState<'checker' | 'light' | 'dark'>('checker');

  const stageRef = useRef<HTMLDivElement>(null);

  // Calculate auto-fit zoom scale factor so image fits completely inside stage viewport
  const calculateFitScale = useCallback((imgWidth: number, imgHeight: number, currentRotation: number = rotation) => {
    if (!stageRef.current || !imgWidth || !imgHeight) return 1;

    const padding = 48; // padding around stage container
    const availWidth = Math.max(100, stageRef.current.clientWidth - padding);
    const availHeight = Math.max(100, stageRef.current.clientHeight - padding);

    const isSwapped = (currentRotation / 90) % 2 !== 0;
    const effectiveWidth = isSwapped ? imgHeight : imgWidth;
    const effectiveHeight = isSwapped ? imgWidth : imgHeight;

    const scaleX = availWidth / effectiveWidth;
    const scaleY = availHeight / effectiveHeight;
    const fitScale = Math.min(scaleX, scaleY);

    if (fitScale >= 1.0) {
      return 1.0;
    }

    return Math.max(0.05, Number(fitScale.toFixed(2)));
  }, [rotation]);

  useEffect(() => {
    let url = '';

    if (content && typeof content === 'string' && fileNode.extension === 'svg') {
      // SVG content string -> Data URI
      const blob = new Blob([content], { type: 'image/svg+xml;charset=utf-8' });
      url = URL.createObjectURL(blob);
    } else if (fileNode.fileObject) {
      url = URL.createObjectURL(fileNode.fileObject);
    } else if (content && typeof content === 'string' && content.startsWith('data:image')) {
      url = content;
    }

    setImageUrl(url);
    setDimensions(null);
    setZoom(1);
    setRotation(0);

    return () => {
      if (url && url.startsWith('blob:')) {
        URL.revokeObjectURL(url);
      }
    };
  }, [fileNode, content]);

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { naturalWidth, naturalHeight } = e.currentTarget;
    setDimensions({ width: naturalWidth, height: naturalHeight });
    const autoScale = calculateFitScale(naturalWidth, naturalHeight, 0);
    setZoom(autoScale);
  };

  const handleZoomIn = () => setZoom(prev => Math.min(Number((prev + 0.15).toFixed(2)), 5.0));
  const handleZoomOut = () => setZoom(prev => Math.max(Number((prev - 0.15).toFixed(2)), 0.05));
  
  const handleRotate = () => {
    const nextRotation = (rotation + 90) % 360;
    setRotation(nextRotation);
    if (dimensions) {
      const autoScale = calculateFitScale(dimensions.width, dimensions.height, nextRotation);
      setZoom(autoScale);
    }
  };

  const handleReset = () => {
    setRotation(0);
    if (dimensions) {
      const autoScale = calculateFitScale(dimensions.width, dimensions.height, 0);
      setZoom(autoScale);
    } else {
      setZoom(1);
    }
  };

  // Recalculate fit scale on viewport resize
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const resizeObserver = new ResizeObserver(() => {
      if (dimensions) {
        // Auto adjust fit if container resizes significantly
        const autoScale = calculateFitScale(dimensions.width, dimensions.height, rotation);
        if (autoScale < 1.0) {
          setZoom(autoScale);
        }
      }
    });

    resizeObserver.observe(stage);
    return () => resizeObserver.disconnect();
  }, [dimensions, rotation, calculateFitScale]);

  return (
    <div className="flex-1 flex flex-col bg-zinc-100 dark:bg-zinc-950 overflow-hidden">
      {/* Control bar */}
      <div className="px-6 py-3 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-4 z-10 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/60">
            <ImageIcon className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">{fileNode.name}</h2>
            <div className="flex items-center gap-3 text-[11px] text-zinc-500 font-normal">
              {dimensions && (
                <span>{dimensions.width} × {dimensions.height} px</span>
              )}
              {fileNode.size && (
                <div className="flex items-center gap-1">
                  <HardDrive className="w-3 h-3" />
                  <span>{formatFileSize(fileNode.size)}</span>
                </div>
              )}
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                <span>{formatDate(fileNode.lastModified)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Toolbar Buttons */}
        <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-lg border border-zinc-200 dark:border-zinc-700">
          <button
            onClick={handleZoomOut}
            className="p-1.5 rounded text-zinc-600 dark:text-zinc-300 hover:bg-white dark:hover:bg-zinc-700 transition-colors"
            title="缩小"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="text-[11px] font-mono px-2 text-zinc-500 min-w-12 text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={handleZoomIn}
            className="p-1.5 rounded text-zinc-600 dark:text-zinc-300 hover:bg-white dark:hover:bg-zinc-700 transition-colors"
            title="放大"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <div className="w-px h-4 bg-zinc-300 dark:bg-zinc-700 mx-1" />
          <button
            onClick={handleRotate}
            className="p-1.5 rounded text-zinc-600 dark:text-zinc-300 hover:bg-white dark:hover:bg-zinc-700 transition-colors"
            title="顺时针旋转90°"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleReset}
            className="p-1.5 rounded text-zinc-600 dark:text-zinc-300 hover:bg-white dark:hover:bg-zinc-700 transition-colors"
            title="适应窗口完全显示"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
          <div className="w-px h-4 bg-zinc-300 dark:bg-zinc-700 mx-1" />
          <button
            onClick={() => setBgStyle(prev => prev === 'checker' ? 'light' : prev === 'light' ? 'dark' : 'checker')}
            className="p-1.5 rounded text-zinc-600 dark:text-zinc-300 hover:bg-white dark:hover:bg-zinc-700 transition-colors"
            title="切换背景样式 (棋盘格/浅色/深色)"
          >
            <Grid className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Image Stage */}
      <div 
        ref={stageRef}
        className={`flex-1 flex items-center justify-center p-6 overflow-auto custom-scrollbar relative ${
          bgStyle === 'checker' 
            ? 'bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:16px_16px] dark:bg-[radial-gradient(#334155_1px,transparent_1px)]' 
            : bgStyle === 'light'
            ? 'bg-white'
            : 'bg-zinc-950'
        }`}
      >
        {imageUrl ? (
          <div className="flex items-center justify-center min-h-full min-w-full">
            <img
              src={imageUrl}
              alt={fileNode.name}
              onLoad={handleImageLoad}
              className="max-w-none transition-transform duration-200 shadow-lg rounded object-contain"
              style={{
                transform: `scale(${zoom}) rotate(${rotation}deg)`,
                transformOrigin: 'center center'
              }}
            />
          </div>
        ) : (
          <div className="text-xs text-zinc-400">正在生成图像预览...</div>
        )}
      </div>
    </div>
  );
};
