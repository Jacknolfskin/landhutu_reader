import React, { useState, useEffect, useCallback, useRef } from 'react';
import { FileNode, FileCategory, OutlineItem, ThemeMode, FileStats } from './types';
import { getDemoFolderTree } from './utils/demoData';
import { 
  buildTreeFromDirectoryHandle, 
  buildTreeFromFiles, 
  getAllFiles,
  scanFilesFromDataTransferItems
} from './utils/fileUtils';
import { 
  extractMarkdownOutline, 
  extractHtmlOutline, 
  calculateDocumentStats 
} from './utils/outlineExtractor';
import { 
  loadWorkspaceFromStorage, 
  saveWorkspaceToStorage, 
  clearWorkspaceStorage 
} from './utils/storage';
import { FolderPlus, UploadCloud } from 'lucide-react';

import { Header } from './components/Header';
import { FileTree } from './components/FileTree';
import { MarkdownViewer } from './components/MarkdownViewer';
import { WordViewer } from './components/WordViewer';
import { ExcelViewer } from './components/ExcelViewer';
import { ImageViewer } from './components/ImageViewer';
import { PdfViewer } from './components/PdfViewer';
import { PptViewer } from './components/PptViewer';
import { TextViewer } from './components/TextViewer';
import { MediaViewer } from './components/MediaViewer';
import { OutlineSidebar } from './components/OutlineSidebar';
import { WelcomeScreen } from './components/WelcomeScreen';
import { OpenLocalModal } from './components/OpenLocalModal';

export default function App() {
  const [loadedFolders, setLoadedFolders] = useState<FileNode[]>([]);
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);

  const [selectedFile, setSelectedFile] = useState<FileNode | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  
  const [outlineItems, setOutlineItems] = useState<OutlineItem[]>([]);
  const [activeHeadingId, setActiveHeadingId] = useState<string | null>(null);
  const [fileStats, setFileStats] = useState<FileStats | undefined>(undefined);

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<FileCategory | 'all'>('all');
  const [theme, setTheme] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('app-theme');
    if (saved === 'dark' || saved === 'light') return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  const [showFileTree, setShowFileTree] = useState<boolean>(() => {
    const saved = localStorage.getItem('app-show-file-tree');
    return saved !== null ? saved === 'true' : false;
  });
  const [showOutline, setShowOutline] = useState<boolean>(() => {
    const saved = localStorage.getItem('app-show-outline');
    return saved !== null ? saved === 'true' : true;
  });

  useEffect(() => {
    localStorage.setItem('app-show-file-tree', showFileTree.toString());
  }, [showFileTree]);

  useEffect(() => {
    localStorage.setItem('app-show-outline', showOutline.toString());
  }, [showOutline]);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [isOpenModalOpen, setIsOpenModalOpen] = useState<boolean>(false);

  // Resizable sidebar widths
  const [fileTreeWidth, setFileTreeWidth] = useState<number>(() => {
    const saved = localStorage.getItem('fileTreeWidth');
    return saved ? parseInt(saved, 10) : 256;
  });
  const [outlineWidth, setOutlineWidth] = useState<number>(() => {
    const saved = localStorage.getItem('outlineWidth');
    return saved ? parseInt(saved, 10) : 288;
  });

  const [isResizingLeft, setIsResizingLeft] = useState<boolean>(false);
  const [isResizingRight, setIsResizingRight] = useState<boolean>(false);

  const folderInputRef = useRef<HTMLInputElement>(null);
  const singleFileInputRef = useRef<HTMLInputElement>(null);

  // Load content when selected file changes
  const handleSelectFile = useCallback(async (file: FileNode) => {
    setSelectedFile(file);
    setOutlineItems([]);
    setActiveHeadingId(null);
    setFileContent('');

    if (file.content && typeof file.content === 'string') {
      // Pre-loaded content
      setFileContent(file.content);
      if (file.category === 'markdown') {
        const outline = extractMarkdownOutline(file.content);
        setOutlineItems(outline);
        setFileStats(calculateDocumentStats(file.content));
      }
      return;
    }

    // Read file from handle or fileObject
    let text = '';
    try {
      if (file.fileObject) {
        if (['markdown', 'text', 'code', 'json', 'excel'].includes(file.category || '')) {
          text = await file.fileObject.text();
        }
      } else if (file.handle && file.handle.kind === 'file') {
        const f = await (file.handle as FileSystemFileHandle).getFile();
        if (['markdown', 'text', 'code', 'json', 'excel'].includes(file.category || '')) {
          text = await f.text();
        }
      }

      setFileContent(text);

      if (file.category === 'markdown') {
        const outline = extractMarkdownOutline(text);
        setOutlineItems(outline);
        setFileStats(calculateDocumentStats(text));
      } else if (['text', 'code', 'json'].includes(file.category || '')) {
        setFileStats(calculateDocumentStats(text));
      }
    } catch (err) {
      console.error('Error reading file content:', err);
    }
  }, []);

  // Restore workspace from IndexedDB on initial mount
  useEffect(() => {
    let isMounted = true;

    async function restoreWorkspace() {
      try {
        const saved = await loadWorkspaceFromStorage();
        if (saved && saved.loadedFolders && saved.loadedFolders.length > 0 && isMounted) {
          setLoadedFolders(saved.loadedFolders);

          const activeId = saved.activeFolderId || saved.loadedFolders[0].id;
          setActiveFolderId(activeId);

          const activeFolder = saved.loadedFolders.find(f => f.id === activeId) || saved.loadedFolders[0];
          const allFiles = getAllFiles(activeFolder);

          let targetFile: FileNode | null = null;
          if (saved.selectedFileId) {
            targetFile = allFiles.find(f => f.id === saved.selectedFileId) || null;
          }
          if (!targetFile && allFiles.length > 0) {
            targetFile = allFiles[0];
          }

          if (targetFile) {
            handleSelectFile(targetFile);
          }
        }
      } catch (err) {
        console.error('Failed to restore workspace from storage:', err);
      } finally {
        if (isMounted) {
          setIsInitialized(true);
        }
      }
    }

    restoreWorkspace();

    return () => {
      isMounted = false;
    };
  }, [handleSelectFile]);

  // Save workspace state to IndexedDB whenever loadedFolders, activeFolderId, or selectedFile changes
  useEffect(() => {
    if (!isInitialized) return;

    if (loadedFolders.length === 0) {
      clearWorkspaceStorage();
    } else {
      saveWorkspaceToStorage(loadedFolders, activeFolderId, selectedFile?.id || null);
    }
  }, [loadedFolders, activeFolderId, selectedFile, isInitialized]);

  // Handle Left Sidebar Resizing
  const handleLeftResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizingLeft(true);
  };

  useEffect(() => {
    if (!isResizingLeft) return;

    let rafId = 0;
    let lastWidth = 0;

    const handleMouseMove = (e: MouseEvent) => {
      const newWidth = Math.min(Math.max(160, e.clientX), Math.min(600, window.innerWidth * 0.45));
      lastWidth = newWidth;
      // Coalesce multiple mousemoves into a single render per animation frame
      // so dragging stays smooth even with a large markdown document open.
      if (!rafId) {
        rafId = requestAnimationFrame(() => {
          rafId = 0;
          setFileTreeWidth(lastWidth);
        });
      }
    };

    const handleMouseUp = () => {
      if (rafId) cancelAnimationFrame(rafId);
      if (lastWidth > 0) {
        setFileTreeWidth(lastWidth);
        localStorage.setItem('fileTreeWidth', lastWidth.toString());
      }
      setIsResizingLeft(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [isResizingLeft]);

  // Handle Right Sidebar Resizing
  const handleRightResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizingRight(true);
  };

  useEffect(() => {
    if (!isResizingRight) return;

    let rafId = 0;
    let lastWidth = 0;

    const handleMouseMove = (e: MouseEvent) => {
      const newWidth = Math.min(Math.max(180, window.innerWidth - e.clientX), Math.min(600, window.innerWidth * 0.45));
      lastWidth = newWidth;
      if (!rafId) {
        rafId = requestAnimationFrame(() => {
          rafId = 0;
          setOutlineWidth(lastWidth);
        });
      }
    };

    const handleMouseUp = () => {
      if (rafId) cancelAnimationFrame(rafId);
      if (lastWidth > 0) {
        setOutlineWidth(lastWidth);
        localStorage.setItem('outlineWidth', lastWidth.toString());
      }
      setIsResizingRight(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [isResizingRight]);

  // Derived current active folder
  const activeFolder = loadedFolders.find(f => f.id === activeFolderId) || loadedFolders[0] || null;

  // Sync theme class on <html> and save to localStorage
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('app-theme', theme);
  }, [theme]);

  // Helper to add or activate a folder in the workspace
  const addFolderToWorkspace = useCallback((newTree: FileNode) => {
    setLoadedFolders(prev => {
      // Check if folder with same name already exists
      const existingIdx = prev.findIndex(f => f.name === newTree.name);
      if (existingIdx >= 0) {
        const updated = [...prev];
        updated[existingIdx] = newTree;
        return updated;
      }
      return [...prev, newTree];
    });
    setActiveFolderId(newTree.id);
    setShowFileTree(true);

    // Auto select first file
    const allFiles = getAllFiles(newTree);
    if (allFiles.length > 0) {
      handleSelectFile(allFiles[0]);
    }
  }, []);

  // Switch active folder
  const handleSwitchFolder = useCallback((folderId: string) => {
    const targetFolder = loadedFolders.find(f => f.id === folderId);
    if (!targetFolder) return;

    setActiveFolderId(folderId);

    // Check if currently selected file belongs to this folder
    const targetFiles = getAllFiles(targetFolder);
    const fileInTarget = selectedFile && targetFiles.some(f => f.id === selectedFile.id);

    if (!fileInTarget && targetFiles.length > 0) {
      handleSelectFile(targetFiles[0]);
    }
  }, [loadedFolders, selectedFile]);

  // Remove/close a folder from workspace
  const handleCloseFolder = useCallback((folderId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    
    setLoadedFolders(prev => {
      const nextFolders = prev.filter(f => f.id !== folderId);
      
      if (activeFolderId === folderId) {
        if (nextFolders.length > 0) {
          const nextFolder = nextFolders[nextFolders.length - 1];
          setActiveFolderId(nextFolder.id);
          const files = getAllFiles(nextFolder);
          if (files.length > 0) {
            handleSelectFile(files[0]);
          } else {
            setSelectedFile(null);
          }
        } else {
          setActiveFolderId(null);
          setSelectedFile(null);
        }
      }
      return nextFolders;
    });
  }, [activeFolderId]);

  // Open Local modal trigger
  const handleOpenLocal = () => {
    setIsOpenModalOpen(true);
  };

  // Handle File(s) Picker with fallback
  const handleOpenFilePicker = async () => {
    let pickerSuccess = false;

    try {
      const isIframe = window.self !== window.top;

      if (!isIframe && 'showOpenFilePicker' in window) {
        const handles = await (window as any).showOpenFilePicker({ 
          multiple: true 
        });

        if (handles && handles.length > 0) {
          const fileObjects: File[] = [];
          for (const h of handles) {
            try {
              const f = await h.getFile();
              fileObjects.push(f);
            } catch (err) {
              console.warn('Failed to read file handle:', err);
            }
          }
          if (fileObjects.length > 0) {
            const tree = buildTreeFromFiles(fileObjects);
            addFolderToWorkspace(tree);
            pickerSuccess = true;
          }
        }
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        return; // User cancelled
      }
      console.warn('showOpenFilePicker failed or restricted by iframe policy, falling back to standard input:', err);
    }

    if (!pickerSuccess) {
      singleFileInputRef.current?.click();
    }
  };

  // Handle Directory Picker with fallback for cross-origin iframe restrictions
  const handleOpenFolderPicker = async () => {
    let pickerSuccess = false;

    try {
      // Check if inside iframe
      const isIframe = window.self !== window.top;

      if (!isIframe && 'showDirectoryPicker' in window) {
        const dirHandle = await (window as any).showDirectoryPicker();
        const tree = await buildTreeFromDirectoryHandle(dirHandle);
        addFolderToWorkspace(tree);
        pickerSuccess = true;
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        return; // User cancelled
      }
      console.warn('showDirectoryPicker failed or restricted by iframe policy, falling back to standard directory input:', err);
    }

    // Fallback to standard input if showDirectoryPicker failed or was blocked by cross-origin iframe rules
    if (!pickerSuccess) {
      folderInputRef.current?.click();
    }
  };

  // Handle file(s) input selection
  const handleSelectFilesInput = (files: FileList) => {
    const fileArray = Array.from(files);
    if (fileArray.length > 0) {
      const tree = buildTreeFromFiles(fileArray);
      addFolderToWorkspace(tree);
    }
  };

  // Handle directory input selection (Fallback & standard upload)
  const handleSelectDirectoryInput = (files: FileList) => {
    const fileArray = Array.from(files);
    if (fileArray.length > 0) {
      const tree = buildTreeFromFiles(fileArray);
      addFolderToWorkspace(tree);
    }
  };

  // Handle Drag & Drop of Folders/Files
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      try {
        const files = await scanFilesFromDataTransferItems(e.dataTransfer.items);
        if (files.length > 0) {
          const tree = buildTreeFromFiles(files);
          addFolderToWorkspace(tree);
        }
      } catch (err) {
        console.error('Error parsing dropped files/folder:', err);
      }
    } else if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleSelectDirectoryInput(e.dataTransfer.files);
    }
  };

  // Load Built-in Demo Folder
  const handleLoadDemoFolder = async () => {
    const demoTree = await getDemoFolderTree();
    addFolderToWorkspace(demoTree);
    if (demoTree.children && demoTree.children.length > 0) {
      const readme = demoTree.children.find(c => c.name === 'README.md');
      if (readme) {
        handleSelectFile(readme);
      }
    }
  };

  // Word viewer extracts HTML outline callback
  const handleWordOutlineExtracted = (htmlContent: string) => {
    const wordOutline = extractHtmlOutline(htmlContent);
    setOutlineItems(wordOutline);
  };

  // PPT viewer extracts outline callback
  const handlePptOutlineExtracted = (items: OutlineItem[]) => {
    setOutlineItems(items);
  };

  // Jump to heading in view with multi-level fallbacks
  const handleSelectHeading = (elementId: string, headingText?: string) => {
    setActiveHeadingId(elementId);

    // 1. Direct ID lookup
    let element = document.getElementById(elementId);

    // 2. Fallback: Search by heading text content or data-heading-text attribute
    if (!element && headingText) {
      const cleanTarget = headingText.trim().toLowerCase();
      const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6, [data-heading-text]'));
      element = (headings.find(h => {
        const textAttr = h.getAttribute('data-heading-text')?.trim().toLowerCase();
        const textContent = h.textContent?.trim().toLowerCase();
        return textAttr === cleanTarget || textContent === cleanTarget;
      }) as HTMLElement) || null;
    }

    // 3. Fallback: Search by partial ID matching
    if (!element && elementId) {
      element = document.querySelector(`[id*="${elementId}"]`) as HTMLElement;
    }

    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Render appropriate viewer based on file category
  const renderViewer = () => {
    if (!selectedFile) {
      return (
        <WelcomeScreen
          onOpenLocal={handleOpenLocal}
          onLoadDemoFolder={handleLoadDemoFolder}
        />
      );
    }

    switch (selectedFile.category) {
      case 'markdown':
        return <MarkdownViewer fileNode={selectedFile} content={fileContent} theme={theme} />;
      case 'word':
        return (
          <WordViewer 
            fileNode={selectedFile} 
            onOutlineExtracted={handleWordOutlineExtracted} 
          />
        );
      case 'excel':
        return <ExcelViewer fileNode={selectedFile} content={fileContent} />;
      case 'image':
        return <ImageViewer fileNode={selectedFile} content={fileContent} />;
      case 'video':
      case 'audio':
        return <MediaViewer file={selectedFile} />;
      case 'pdf':
        return <PdfViewer fileNode={selectedFile} />;
      case 'ppt':
        return (
          <PptViewer
            fileNode={selectedFile}
            onOutlineExtracted={handlePptOutlineExtracted}
          />
        );
      case 'code':
      case 'json':
      case 'text':
      default:
        return <TextViewer fileNode={selectedFile} content={fileContent} theme={theme} />;
    }
  };

  return (
    <div 
      className="flex flex-col h-screen w-screen overflow-hidden bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans antialiased relative"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Hidden fallback directory picker input */}
      <input
        ref={folderInputRef}
        type="file"
        // @ts-expect-error webkitdirectory is standard for directory picker
        webkitdirectory=""
        directory=""
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            handleSelectDirectoryInput(e.target.files);
          }
          e.target.value = '';
        }}
      />

      {/* Hidden file(s) picker input */}
      <input
        ref={singleFileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            handleSelectFilesInput(e.target.files);
          }
          e.target.value = '';
        }}
      />

      {/* Drag and drop overlay */}
      {isDragging && (
        <div className="absolute inset-0 z-50 bg-zinc-900/80 backdrop-blur-sm flex flex-col items-center justify-center text-white border-4 border-dashed border-zinc-400 p-8 transition-all animate-in fade-in duration-150">
          <UploadCloud className="w-16 h-16 mb-4 text-emerald-400 animate-bounce" />
          <h2 className="text-2xl font-bold mb-2">释放以载入文件或文件夹</h2>
          <p className="text-sm text-zinc-300">将本地文件或文件夹拖拽至此，自动解析并渲染预览与大纲</p>
        </div>
      )}

      {/* Top Header */}
      <Header
        folderName={activeFolder ? activeFolder.name : ''}
        loadedFolders={loadedFolders}
        activeFolderId={activeFolderId}
        onSwitchFolder={handleSwitchFolder}
        onCloseFolder={handleCloseFolder}
        onOpenLocal={handleOpenLocal}
        onSelectDirectoryInput={handleSelectDirectoryInput}
        onLoadDemoFolder={handleLoadDemoFolder}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        theme={theme}
        onToggleTheme={() => setTheme(t => t === 'light' ? 'dark' : 'light')}
        showFileTree={showFileTree}
        onToggleFileTree={() => setShowFileTree(v => !v)}
        showOutline={showOutline}
        onToggleOutline={() => setShowOutline(v => !v)}
        hasOutlineItems={outlineItems.length > 0}
      />

      {/* Modal for selecting file vs folder */}
      <OpenLocalModal
        isOpen={isOpenModalOpen}
        onClose={() => setIsOpenModalOpen(false)}
        onOpenFile={handleOpenFilePicker}
        onOpenFolder={handleOpenFolderPicker}
      />

      {/* Overlay to prevent iframe/canvas interaction while dragging sidebar resizers */}
      {(isResizingLeft || isResizingRight) && (
        <div className="fixed inset-0 z-50 cursor-col-resize select-none bg-transparent" />
      )}

      {/* Main Workspace Layout */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Sidebar: File Tree Directory */}
        {showFileTree && (
          <div 
            className="h-full shrink-0 relative group z-10"
            style={{ width: `${fileTreeWidth}px` }}
          >
            <FileTree
              rootNode={activeFolder}
              loadedFolders={loadedFolders}
              activeFolderId={activeFolderId}
              onSwitchFolder={handleSwitchFolder}
              onCloseFolder={handleCloseFolder}
              onOpenFolder={handleOpenLocal}
              onLoadDemoFolder={handleLoadDemoFolder}
              selectedFileId={selectedFile?.id || null}
              onSelectFile={handleSelectFile}
              searchQuery={searchQuery}
              categoryFilter={selectedCategory}
            />

            {/* Left Resizer Drag Handle */}
            <div
              onMouseDown={handleLeftResizeStart}
              onDoubleClick={() => {
                setFileTreeWidth(256);
                localStorage.setItem('fileTreeWidth', '256');
              }}
              className="absolute top-0 -right-1.5 w-3 h-full cursor-col-resize z-30 flex justify-center"
              title="拖拽调节侧边栏宽度，双击恢复默认"
            >
              <div 
                className={`w-[2px] h-full transition-colors duration-150 ${
                  isResizingLeft 
                    ? 'bg-blue-500 dark:bg-blue-400' 
                    : 'bg-transparent active:bg-blue-500 dark:active:bg-blue-400'
                }`} 
              />
            </div>
          </div>
        )}

        {/* Center: File Content Viewer */}
        <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden relative">
          {renderViewer()}
        </main>

        {/* Right Sidebar: Document Outline (大纲) */}
        {showOutline && selectedFile && (
          <OutlineSidebar
            outlineItems={outlineItems}
            activeHeadingId={activeHeadingId}
            onSelectHeading={handleSelectHeading}
            stats={fileStats}
            fileName={selectedFile.name}
            onClose={() => setShowOutline(false)}
            width={outlineWidth}
            onResizeStart={handleRightResizeStart}
            onResetWidth={() => {
              setOutlineWidth(288);
              localStorage.setItem('outlineWidth', '288');
            }}
            isResizing={isResizingRight}
          />
        )}
      </div>
    </div>
  );
}
