import React, { useEffect, useMemo, useState } from 'react';
import { FileViewer } from '@open-file-viewer/react';
import {
  imagePlugin,
  videoPlugin,
  audioPlugin,
  textPlugin,
  pdfPlugin,
  epubPlugin,
  xpsPlugin,
  officePlugin,
  ofdPlugin,
  archivePlugin,
  emailPlugin,
  drawingPlugin,
  xmindPlugin,
  cadPlugin,
  model3dPlugin,
  gisPlugin,
  assetPlugin,
  fallbackPlugin,
} from '@open-file-viewer/core';
import '@open-file-viewer/core/style.css';
import * as pdfjsLib from 'pdfjs-dist';
// Let Vite resolve the worker URL as a static asset.
import pdfWorkerSrc from 'pdfjs-dist/build/pdf.worker.min.js?url';
import { AlertCircle, FileText, Loader2 } from 'lucide-react';
import { FileNode, ThemeMode } from '../types';

interface FilePreviewViewerProps {
  fileNode: FileNode;
  /**
   * App-level theme. Maps to the SDK theme:
   *  - 'dark' -> 'dark'
   *  - 'light' | 'sepia' -> 'light'
   */
  appTheme?: ThemeMode;
}

/**
 * Resolve a browser-usable file source (File / Blob / ArrayBuffer) from a FileNode.
 * Returns null when no binary data can be obtained.
 */
async function resolveFileSource(
  fileNode: FileNode
): Promise<File | Blob | ArrayBuffer | null> {
  if (fileNode.fileObject) {
    return fileNode.fileObject;
  }

  if (fileNode.handle && fileNode.handle.kind === 'file') {
    try {
      return await (fileNode.handle as FileSystemFileHandle).getFile();
    } catch (err) {
      console.warn('FilePreviewViewer: 无法通过 handle 获取文件', err);
    }
  }

  if (fileNode.content) {
    if (typeof fileNode.content === 'string') {
      return new TextEncoder().encode(fileNode.content).buffer;
    }
    return fileNode.content;
  }

  return null;
}

export const FilePreviewViewer: React.FC<FilePreviewViewerProps> = ({
  fileNode,
  appTheme,
}) => {
  const [fileSource, setFileSource] = useState<
    File | Blob | ArrayBuffer | null
  >(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Resolve the binary source whenever the file changes.
  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);
    setFileSource(null);

    resolveFileSource(fileNode)
      .then((source) => {
        if (!mounted) return;
        if (!source) {
          setError('无法调取该文件的二进制数据');
          setLoading(false);
          return;
        }
        setFileSource(source);
        setLoading(false);
      })
      .catch((err) => {
        if (!mounted) return;
        console.error('FilePreviewViewer: 读取文件失败', err);
        setError(err?.message || '文件读取失败');
        setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [fileNode]);

  // Build the plugin list once. All plugins exposed by the Open File Viewer
  // SDK are registered so that every supported format can be previewed:
  // office, image, pdf, video, audio, text, epub, xps, ofd, archive, email,
  // drawing (psd/ai), xmind, cad (dwg/dwf), 3d models, gis, assets, plus a
  // final fallback for anything unmatched.
  const plugins = useMemo(() => {
    return [
      officePlugin(),
      imagePlugin(),
      pdfPlugin({
        pdfjs: pdfjsLib,
        workerSrc: pdfWorkerSrc,
      }),
      videoPlugin(),
      audioPlugin(),
      textPlugin(),
      epubPlugin(),
      xpsPlugin(),
      ofdPlugin(),
      archivePlugin(),
      emailPlugin(),
      drawingPlugin(),
      xmindPlugin(),
      cadPlugin(),
      model3dPlugin(),
      gisPlugin(),
      assetPlugin(),
      fallbackPlugin(),
    ];
  }, []);

  const viewerTheme: 'light' | 'dark' | 'auto' =
    appTheme === 'dark' ? 'dark' : 'light';

  // Loading state
  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-zinc-400">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-3" />
        <p className="text-xs font-medium">正在准备文件预览...</p>
      </div>
    );
  }

  // Error state — no binary source available
  if (error || !fileSource) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-zinc-500">
        <AlertCircle className="w-10 h-10 text-rose-500 mb-3" />
        <h3 className="text-base font-semibold text-zinc-800 dark:text-zinc-200 mb-1">
          无法预览该文件
        </h3>
        <p className="text-xs max-w-md text-zinc-500 mb-4">
          {error || '未能获取文件内容'}
        </p>
        <div className="p-4 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 text-xs text-left max-w-lg w-full">
          <p className="font-medium text-zinc-700 dark:text-zinc-300 mb-1">
            支持的格式：
          </p>
          <ul className="list-disc list-inside space-y-1 text-zinc-500">
            <li>Office: Word / Excel / PowerPoint (.doc/.docx/.xls/.xlsx/.ppt/.pptx 等)</li>
            <li>PDF / EPUB / XPS / OFD: .pdf / .epub / .xps / .ofd</li>
            <li>图片: .png / .jpg / .gif / .svg / .webp / .bmp / .ico / .avif</li>
            <li>视频: .mp4 / .webm / .ogg / .mov / .mkv / .avi 等</li>
            <li>音频: .mp3 / .wav / .aac / .flac / .m4a 等</li>
            <li>文本/代码: .txt / .json / .js / .ts / .html / .css / .py 等</li>
            <li>压缩包: .zip / .tar / .gz 等</li>
            <li>邮件: .eml / .msg</li>
            <li>设计/思维导图: .psd / .ai / .xmind</li>
            <li>CAD: .dwg / .dwf</li>
            <li>3D 模型 / GIS / 其他资源文件</li>
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-zinc-100 dark:bg-zinc-950 overflow-hidden">
      <FileViewer
        file={fileSource}
        fileName={fileNode.name}
        height="100%"
        width="100%"
        theme={viewerTheme}
        toolbar
        plugins={plugins}
        fallback="inline"
        onError={(err) => {
          console.error('FilePreviewViewer SDK error:', err);
        }}
        onUnsupported={(file) => {
          console.warn('FilePreviewViewer: unsupported file', file);
        }}
      />
    </div>
  );
};
