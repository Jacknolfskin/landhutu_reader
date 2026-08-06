import { FileCategory, CategoryGroupId, FileNode } from '../types';

/**
 * 大分类 -> 细分类映射，用于标题栏分组筛选。
 * 每个分组对应一个或多个细分的 FileCategory。
 */
export const CATEGORY_GROUPS: Record<Exclude<CategoryGroupId, 'all'>, FileCategory[]> = {
  markdown: ['markdown'],
  office: ['word', 'excel', 'ppt'],
  pdf: ['pdf'],
  image: ['image'],
  video: ['video'],
  audio: ['audio'],
  textcode: ['text', 'json', 'code'],
  archive: ['archive'],
  email: ['email'],
  drawing: ['drawing'],
  cad: ['cad'],
  model3d: ['model3d'],
  gis: ['gis'],
  asset: ['asset'],
};

export const CATEGORY_GROUP_IDS: CategoryGroupId[] = [
  'all',
  'markdown',
  'office',
  'pdf',
  'image',
  'video',
  'audio',
  'textcode',
  'archive',
  'email',
  'drawing',
  'cad',
  'model3d',
  'gis',
  'asset',
];

export function getFileCategory(filename: string): FileCategory {
  const ext = filename.split('.').pop()?.toLowerCase() || '';

  if (['md', 'markdown', 'mdown', 'mkd', 'mmd', 'mermaid'].includes(ext)) {
    return 'markdown';
  }
  // Word 文档（含 RTF / ODT / WPS 等文本处理格式）
  if (['docx', 'docm', 'doc', 'dotx', 'dotm', 'dot', 'rtf', 'odt', 'fodt', 'wps'].includes(ext)) {
    return 'word';
  }
  // 表格（含 CSV / TSV / ODS 等）
  if (['xlsx', 'xls', 'xlsm', 'xlsb', 'xlt', 'xltx', 'xltm', 'csv', 'tsv', 'ods', 'fods', 'numbers', 'et'].includes(ext)) {
    return 'excel';
  }
  // 图片
  if (['jpg', 'jpeg', 'jfif', 'pjpe', 'pjpeg', 'png', 'gif', 'webp', 'avif', 'jxl', 'svg', 'bmp', 'ico', 'cur', 'tif', 'tiff', 'apng', 'heic', 'heif'].includes(ext)) {
    return 'image';
  }
  // 视频
  if (['mp4', 'mpg', 'mpeg', 'mpe', 'mpv', 'webm', 'ogv', 'mov', 'm4v', 'mkv', 'avi', 'flv', 'wmv', '3gp', '3g2', 'm2ts', 'm3u8'].includes(ext)) {
    return 'video';
  }
  // 音频
  if (['mp3', 'wav', 'aif', 'aiff', 'aifc', 'ogg', 'oga', 'aac', 'm4a', 'flac', 'opus', 'weba', 'amr', 'mid', 'midi', 'caf', 'au', 'snd', 'wma'].includes(ext)) {
    return 'audio';
  }
  if (ext === 'pdf') {
    return 'pdf';
  }
  // 演示文稿
  if (['pptx', 'pptm', 'ppt', 'pps', 'ppsx', 'ppsm', 'potx', 'potm', 'odp', 'fodp', 'key', 'dps'].includes(ext)) {
    return 'ppt';
  }
  // 代码文件
  if (['json', 'jsonc', 'json5', 'ipynb', 'jsonl', 'ndjson', 'xml', 'yaml', 'yml', 'js', 'mjs', 'cjs', 'jsx', 'ts', 'tsx', 'vue', 'html', 'htm', 'css', 'scss', 'less', 'toml', 'ini', 'proto', 'tf', 'tfvars', 'hcl', 'tex', 'latex', 'bib', 'gv', 'http', 'java', 'py', 'go', 'rs', 'rb', 'swift', 'kt', 'kts', 'scala', 'lua', 'r', 'dart', 'svelte', 'astro', 'elm', 'ex', 'exs', 'clj', 'cljs', 'erl', 'hrl', 'fs', 'fsx', 'hs', 'lhs', 'php', 'c', 'cpp', 'h', 'hpp', 'cs', 'sql', 'sh', 'bash', 'zsh', 'fish', 'ps1', 'bat', 'cmd', 'dockerfile', 'nginxconf', 'gradle', 'graphql', 'gql', 'pem', 'crt', 'cer', 'ics', 'vcf', 'diff', 'patch'].includes(ext)) {
    return 'code';
  }
  // 纯文本 / 配置文件
  if (['txt', 'log', 'env', 'conf', 'config', 'properties', 'lock'].includes(ext)) {
    return 'text';
  }
  // 压缩包
  if (['zip', 'rar', '7z', 'tar', 'gz', 'tgz', 'bz2', 'xz'].includes(ext)) {
    return 'archive';
  }
  // 邮件
  if (['eml', 'msg', 'mbox'].includes(ext)) {
    return 'email';
  }
  // 绘图（drawio / excalidraw / tldraw）
  if (['drawio', 'dio', 'excalidraw', 'tldraw'].includes(ext)) {
    return 'drawing';
  }
  // CAD
  if (['dxf', 'dwg', 'dwf', 'step', 'stp', 'iges', 'igs', 'ifc', 'sat', 'sab', 'x_t', 'x_b', '3dm', 'skp', 'sldprt', 'sldasm', 'gds', 'gdsii', 'oas', 'oasis'].includes(ext)) {
    return 'cad';
  }
  // 3D 模型
  if (['gltf', 'glb', 'obj', 'stl', 'fbx', 'dae', 'ply', '3mf', '3ds', 'usd', 'usda', 'usdc', 'usdz', 'wrl', 'vrml'].includes(ext)) {
    return 'model3d';
  }
  // GIS
  if (['geojson', 'topojson', 'kml', 'kmz', 'gpx', 'shp'].includes(ext)) {
    return 'gis';
  }
  // 其他资源（字体 / 设计源文件 / 数据库 / WASM / 大数据格式等）
  if (['ttf', 'otf', 'woff', 'woff2', 'eot', 'psd', 'psb', 'ai', 'eps', 'ps', 'webarchive', 'sqlite', 'sqlite3', 'db', 'wasm', 'parquet', 'avro'].includes(ext)) {
    return 'asset';
  }

  return 'unknown';
}

export function formatFileSize(bytes?: number): string {
  if (bytes === undefined || bytes === null || isNaN(bytes)) return '未知大小';
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export function formatDate(timestamp?: number): string {
  if (!timestamp) return '未知时间';
  const d = new Date(timestamp);
  return d.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Builds a hierarchical FileNode tree from webkitdirectory FileList or File array
 */
export function buildTreeFromFiles(files: File[]): FileNode {
  if (files.length === 0) {
    return {
      id: 'root-' + Date.now(),
      name: '未命名',
      path: '',
      kind: 'directory',
      isExpanded: true,
      children: []
    };
  }

  const firstRelPath = files[0]?.webkitRelativePath;
  let rootName = '本地文件';

  if (firstRelPath && firstRelPath.includes('/')) {
    rootName = firstRelPath.split('/')[0];
  } else if (files.length === 1) {
    rootName = files[0].name;
  } else if (files.length > 1) {
    rootName = `已打开的文件 (${files.length})`;
  }

  const rootNode: FileNode = {
    id: 'root-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
    name: rootName,
    path: '',
    kind: 'directory',
    isExpanded: true,
    children: [],
    sourceFiles: files
  };

  const isFolderUpload = Boolean(firstRelPath && firstRelPath.includes('/'));

  files.forEach((file, index) => {
    // Relative path e.g. "my-folder/sub-folder/doc.md" or "doc.md"
    const relPath = file.webkitRelativePath || file.name;
    const parts = relPath.split('/');
    
    // Skip system hidden files like .DS_Store
    if (parts.some(p => p.startsWith('.') && p !== '.env' && p !== '.gitignore')) {
      return;
    }

    let current = rootNode;
    
    // If parts start with root directory name, omit root name for inner relative path
    const pathParts = (parts.length > 1 && isFolderUpload) ? parts.slice(1) : parts;

    pathParts.forEach((part, idx) => {
      const isLast = idx === pathParts.length - 1;
      const currentPath = pathParts.slice(0, idx + 1).join('/');

      if (isLast) {
        // File node
        const ext = part.split('.').pop()?.toLowerCase() || '';
        const category = getFileCategory(part);
        current.children?.push({
          id: `file-${index}-${part}-${Date.now()}`,
          name: part,
          path: currentPath,
          kind: 'file',
          category,
          extension: ext,
          size: file.size,
          lastModified: file.lastModified,
          fileObject: file
        });
      } else {
        // Directory node
        let dirNode = current.children?.find(c => c.kind === 'directory' && c.name === part);
        if (!dirNode) {
          dirNode = {
            id: `dir-${currentPath}`,
            name: part,
            path: currentPath,
            kind: 'directory',
            isExpanded: true,
            children: []
          };
          current.children?.push(dirNode);
        }
        current = dirNode;
      }
    });
  });

  sortFileTree(rootNode);
  return rootNode;
}

/**
 * Reads a FileSystemDirectoryHandle recursively using modern Web File System Access API
 */
export async function buildTreeFromDirectoryHandle(
  dirHandle: FileSystemDirectoryHandle,
  parentPath = ''
): Promise<FileNode> {
  const children: FileNode[] = [];

  for await (const entry of (dirHandle as any).values()) {
    // Skip hidden files
    if (entry.name.startsWith('.') && entry.name !== '.env' && entry.name !== '.gitignore') {
      continue;
    }

    const currentPath = parentPath ? `${parentPath}/${entry.name}` : entry.name;

    if (entry.kind === 'directory') {
      const subTree = await buildTreeFromDirectoryHandle(
        entry as FileSystemDirectoryHandle,
        currentPath
      );
      children.push({
        id: `dir-${currentPath}`,
        name: entry.name,
        path: currentPath,
        kind: 'directory',
        handle: entry,
        isExpanded: true,
        children: subTree.children
      });
    } else if (entry.kind === 'file') {
      const fileHandle = entry as FileSystemFileHandle;
      let fileObj: File | null = null;
      try {
        fileObj = await fileHandle.getFile();
      } catch (err) {
        console.warn('Unable to get file handle:', err);
      }

      const category = getFileCategory(entry.name);
      const ext = entry.name.split('.').pop()?.toLowerCase() || '';

      children.push({
        id: `file-${currentPath}`,
        name: entry.name,
        path: currentPath,
        kind: 'file',
        category,
        extension: ext,
        size: fileObj?.size,
        lastModified: fileObj?.lastModified,
        handle: fileHandle,
        fileObject: fileObj || undefined
      });
    }
  }

  const rootNode: FileNode = {
    id: `dir-${dirHandle.name}`,
    name: dirHandle.name,
    path: parentPath,
    kind: 'directory',
    handle: dirHandle,
    isExpanded: true,
    children
  };

  sortFileTree(rootNode);
  return rootNode;
}

/**
 * Sorts directory trees so folders come first (A-Z), then files (A-Z)
 */
export function sortFileTree(node: FileNode) {
  if (!node.children) return;

  node.children.sort((a, b) => {
    if (a.kind !== b.kind) {
      return a.kind === 'directory' ? -1 : 1;
    }
    return a.name.localeCompare(b.name, 'zh-CN', { sensitivity: 'base' });
  });

  node.children.forEach(child => sortFileTree(child));
}

/**
 * Flatten all files in tree for searching/filtering
 */
export function getAllFiles(node: FileNode): FileNode[] {
  let results: FileNode[] = [];
  if (node.kind === 'file') {
    results.push(node);
  } else if (node.children) {
    for (const child of node.children) {
      results = results.concat(getAllFiles(child));
    }
  }
  return results;
}

/**
 * Scans files and folders dropped via DataTransferItems (drag & drop)
 */
export async function scanFilesFromDataTransferItems(items: DataTransferItemList): Promise<File[]> {
  const files: File[] = [];

  const scanEntry = async (entry: any, parentPath = ''): Promise<void> => {
    if (!entry) return;
    if (entry.isFile) {
      await new Promise<void>((resolve) => {
        entry.file((file: File) => {
          const relPath = parentPath ? `${parentPath}/${file.name}` : file.name;
          try {
            Object.defineProperty(file, 'webkitRelativePath', {
              value: relPath,
              writable: false,
              configurable: true
            });
          } catch (e) {
            // ignore if property cannot be redefined
          }
          files.push(file);
          resolve();
        });
      });
    } else if (entry.isDirectory) {
      const dirReader = entry.createReader();
      const currentPath = parentPath ? `${parentPath}/${entry.name}` : entry.name;

      const readEntries = (): Promise<any[]> => {
        return new Promise((resolve) => {
          dirReader.readEntries((entries: any[]) => resolve(entries));
        });
      };

      let entries: any[] = [];
      let batch = await readEntries();
      while (batch.length > 0) {
        entries = entries.concat(batch);
        batch = await readEntries();
      }

      for (const subEntry of entries) {
        await scanEntry(subEntry, currentPath);
      }
    }
  };

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (item.kind === 'file') {
      const entry = item.webkitGetAsEntry ? item.webkitGetAsEntry() : null;
      if (entry) {
        await scanEntry(entry);
      } else {
        const file = item.getAsFile();
        if (file) files.push(file);
      }
    }
  }

  return files;
}
