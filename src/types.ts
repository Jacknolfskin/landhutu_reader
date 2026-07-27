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
  | 'unknown';

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
