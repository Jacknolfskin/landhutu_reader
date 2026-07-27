import { FileNode } from '../types';

const DB_NAME = 'DocReaderWorkspaceDB';
const DB_VERSION = 1;
const STORE_NAME = 'workspace';

export interface SavedWorkspace {
  loadedFolders: FileNode[];
  activeFolderId: string | null;
  selectedFileId: string | null;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Prepares a FileNode for IndexedDB storage.
 * Keeps File / Blob / string / ArrayBuffer objects which IndexedDB supports natively.
 */
function cleanNodeForStorage(node: FileNode, includeHandles = true): FileNode {
  const cleaned: FileNode = {
    id: node.id,
    name: node.name,
    path: node.path,
    kind: node.kind,
    category: node.category,
    extension: node.extension,
    size: node.size,
    lastModified: node.lastModified,
    isExpanded: node.isExpanded ?? true,
    content: node.content,
    fileObject: node.fileObject,
  };

  if (includeHandles && node.handle) {
    cleaned.handle = node.handle;
  }

  if (node.children && Array.isArray(node.children)) {
    cleaned.children = node.children.map(child => cleanNodeForStorage(child, includeHandles));
  }

  return cleaned;
}

export async function saveWorkspaceToStorage(
  loadedFolders: FileNode[],
  activeFolderId: string | null,
  selectedFileId: string | null
): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);

    // Try saving with handles first; fallback to handles-stripped if DataCloneError occurs
    try {
      const cleanedFolders = loadedFolders.map(f => cleanNodeForStorage(f, true));
      store.put(cleanedFolders, 'loadedFolders');
    } catch {
      const cleanedFolders = loadedFolders.map(f => cleanNodeForStorage(f, false));
      store.put(cleanedFolders, 'loadedFolders');
    }

    store.put(activeFolderId, 'activeFolderId');
    store.put(selectedFileId, 'selectedFileId');

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.error('Failed to save workspace to IndexedDB:', err);
  }
}

export async function loadWorkspaceFromStorage(): Promise<SavedWorkspace | null> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);

    const getReq = (key: string) => new Promise<any>((resolve) => {
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    });

    const loadedFolders = await getReq('loadedFolders');
    const activeFolderId = await getReq('activeFolderId');
    const selectedFileId = await getReq('selectedFileId');

    if (!loadedFolders || !Array.isArray(loadedFolders) || loadedFolders.length === 0) {
      return null;
    }

    return {
      loadedFolders,
      activeFolderId: activeFolderId || null,
      selectedFileId: selectedFileId || null
    };
  } catch (err) {
    console.error('Failed to load workspace from IndexedDB:', err);
    return null;
  }
}

export async function clearWorkspaceStorage(): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.clear();
  } catch (err) {
    console.error('Failed to clear workspace storage:', err);
  }
}
