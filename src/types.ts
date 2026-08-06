export type FileCategory =
  | 'markdown'
  | 'word'
  | 'excel'
  | 'image'
  | 'pdf'
  | 'ppt'
  | 'video'
  | 'audio'
  | 'text'
  | 'json'
  | 'code'
  | 'archive'
  | 'email'
  | 'drawing'
  | 'cad'
  | 'model3d'
  | 'gis'
  | 'asset'
  | 'unknown';

/**
 * 大分类筛选分组 ID。标题栏据此对文件进行分组筛选。
 * 每个分组映射到一个或多个细分的 FileCategory。
 */
export type CategoryGroupId =
  | 'all'
  | 'markdown'
  | 'office'
  | 'pdf'
  | 'image'
  | 'video'
  | 'audio'
  | 'textcode'
  | 'archive'
  | 'email'
  | 'drawing'
  | 'cad'
  | 'model3d'
  | 'gis'
  | 'asset';

export interface FileNode {
  id: string;
  name: string;
  path: string; // Relative path inside selected root folder
  kind: 'file' | 'directory';
  category?: FileCategory;
  extension?: string;
  size?: number; // bytes
  lastModified?: number;
  handle?: FileSystemFileHandle | FileSystemDirectoryHandle;
  fileObject?: File;
  sourceFiles?: File[];
  content?: string | ArrayBuffer;
  children?: FileNode[];
  isExpanded?: boolean;
}

export interface OutlineItem {
  id: string;
  text: string;
  level: number; // 1 to 6
  elementId: string;
  line?: number;
}

export interface FileStats {
  wordCount: number;
  charCount: number;
  readingTimeMinutes: number;
  headingsCount: number;
}

export type ThemeMode = 'light' | 'dark' | 'sepia';
