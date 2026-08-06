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

/** Check whether a string is a remote http(s) URL. */
function isRemoteUrl(value: string): boolean {
  return /^https?:\/\//i.test(value.trim());
}

/**
 * Convert a data: URI (e.g. a base64 PDF or an inline SVG) into a Blob.
 * Returns null when the string is not a valid data URI.
 */
function dataUriToBlob(dataUri: string): Blob | null {
  const match = /^data:([^;,]+)?(;base64)?,(.*)$/s.exec(dataUri.trim());
  if (!match) return null;

  const mimeType = match[1] || 'text/plain';
  const isBase64 = Boolean(match[2]);
  const payload = match[3];

  try {
    if (isBase64) {
      const binary = atob(payload.replace(/\s+/g, ''));
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      return new Blob([bytes], { type: mimeType });
    }

    return new Blob([decodeURIComponent(payload)], { type: mimeType });
  } catch (err) {
    console.warn('FilePreviewViewer: data URI 解析失败', err);
    return null;
  }
}

/**
 * Resolve a browser-usable file source (File / Blob / ArrayBuffer / URL string)
 * from a FileNode. Returns null when no binary data can be obtained.
 *
 * A string `content` may be:
 *  - a remote http(s) URL. For media (audio/video) we pass the URL through to
 *    the SDK directly — <audio>/<video> elements load cross-origin media
 *    natively without needing CORS. For every other type the SDK has to read
 *    the bytes, so we fetch it into a Blob first (the server must allow CORS).
 *  - a data: URI               -> decoded into a Blob;
 *  - plain text content        -> encoded as an ArrayBuffer (legacy behaviour).
 */
async function resolveFileSource(
  fileNode: FileNode
): Promise<File | Blob | ArrayBuffer | string | null> {
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
      const trimmed = fileNode.content.trim();

      // Remote media (audio/video): hand the URL to the SDK unchanged. Native
      // media elements can play cross-origin files without a CORS header.
      if (
        isRemoteUrl(trimmed) &&
        (fileNode.category === 'audio' || fileNode.category === 'video')
      ) {
        return trimmed;
      }

      // Other remote files: fetch into a Blob so the previewer can read them.
      // The server must allow CORS; if it doesn't, we fail gracefully below.
      if (isRemoteUrl(trimmed)) {
        try {
          const res = await fetch(trimmed);
          if (!res.ok) {
            throw new Error(`HTTP ${res.status}`);
          }
          return await res.blob();
        } catch (err) {
          console.warn('FilePreviewViewer: 远程文件拉取失败', trimmed, err);
          throw new Error(
            '远程文件拉取失败，请检查网络或目标地址是否允许跨域 (CORS)。'
          );
        }
      }

      // Data URI: decode into a Blob.
      const blob = dataUriToBlob(trimmed);
      if (blob) {
        return blob;
      }

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
    File | Blob | ArrayBuffer | string | null
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
            <li>Word: .docx / .doc / .docm / .rtf / .odt / .fodt / .dotx / .wps</li>
            <li>表格: .xlsx / .xls / .xlsm / .xlsb / .csv / .tsv / .ods / .numbers</li>
            <li>演示: .pptx / .ppt / .pptm / .ppsx / .odp / .fodp / .key</li>
            <li>PDF / EPUB / XPS / OFD: .pdf / .epub / .xps / .oxps / .ofd</li>
            <li>图片: .jpg / .png / .gif / .webp / .svg / .bmp / .ico / .tif / .avif / .jxl / .heic</li>
            <li>视频: .mp4 / .webm / .mov / .mkv / .avi / .flv / .wmv / .m3u8 等</li>
            <li>音频: .mp3 / .wav / .aac / .flac / .m4a / .ogg / .opus 等</li>
            <li>文本/代码: .txt / .json / .js / .ts / .html / .css / .py / .md 等</li>
            <li>压缩包: .zip / .rar / .7z / .tar / .gz / .bz2 / .xz</li>
            <li>邮件: .eml / .msg / .mbox</li>
            <li>绘图/思维导图: .drawio / .excalidraw / .tldraw / .xmind</li>
            <li>CAD: .dwg / .dxf / .dwf / .step / .iges / .ifc 等</li>
            <li>3D模型: .gltf / .glb / .obj / .stl / .fbx / .3mf 等</li>
            <li>GIS / 其他资源文件: .geojson / .kml / .gpx / 字体等</li>
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
