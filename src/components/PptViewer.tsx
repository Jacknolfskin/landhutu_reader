import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Presentation, 
  Download, 
  ExternalLink, 
  Calendar, 
  AlertCircle, 
  RefreshCw, 
  ChevronLeft, 
  ChevronRight, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw,
  LayoutGrid,
  Scroll,
  Minimize2,
  FileText,
  StickyNote,
  Tv,
  AlignLeft,
  Copy,
  Check,
  Maximize2,
  Layers
} from 'lucide-react';
import JSZip from 'jszip';
import { FileNode, OutlineItem } from '../types';
import { formatDate, formatFileSize } from '../utils/fileUtils';

interface PptViewerProps {
  fileNode: FileNode;
  onOutlineExtracted?: (outlineItems: OutlineItem[]) => void;
}

interface SlideParagraph {
  text: string;
  isBullet?: boolean;
  bold?: boolean;
  italic?: boolean;
  color?: string;
  fontSize?: number;
}

interface SlideElement {
  id: string;
  type: 'text' | 'image' | 'table' | 'shape';
  title?: boolean;
  x?: number; // percentage
  y?: number;
  w?: number;
  h?: number;
  paragraphs?: SlideParagraph[];
  imgSrc?: string;
  tableRows?: string[][];
  bgColor?: string;
  borderColor?: string;
}

interface SlideData {
  pageNumber: number;
  title: string;
  bgColor?: string;
  elements: SlideElement[];
  notes?: string;
  fullRawText?: string;
}

export const PptViewer: React.FC<PptViewerProps> = ({ fileNode, onOutlineExtracted }) => {
  const [slides, setSlides] = useState<SlideData[]>([]);
  const [aspectRatio, setAspectRatio] = useState<number>(16 / 9);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const [viewMode, setViewMode] = useState<'scroll' | 'single' | 'grid' | 'outline'>('scroll');
  const [fitHeightMode, setFitHeightMode] = useState<boolean>(true); // Default true: full display without clipping
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showNotes, setShowNotes] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [pptUrl, setPptUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const slideRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});

  const registerSlideRef = useCallback((pageNum: number, el: HTMLDivElement | null) => {
    slideRefs.current[pageNum] = el;
  }, []);

  const scrollToSlide = (pageNum: number) => {
    setCurrentPage(pageNum);
    if (viewMode === 'scroll') {
      const el = slideRefs.current[pageNum];
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  // Safe helper to extract element nodes with localName matching (ignores XML namespaces)
  const getLocalElements = (parent: Element | Document, tagName: string): Element[] => {
    const all = parent.getElementsByTagName('*');
    const result: Element[] = [];
    const target = tagName.toLowerCase();
    for (let i = 0; i < all.length; i++) {
      if (all[i].localName.toLowerCase() === target) {
        result.push(all[i]);
      }
    }
    return result;
  };

  // Extract paragraphs from a txBody XML element
  const parseTxBody = (txBody: Element): { paragraphs: SlideParagraph[]; fullText: string } => {
    const paragraphs: SlideParagraph[] = [];
    let fullText = '';

    const pList = getLocalElements(txBody, 'p');
    for (const p of pList) {
      const isBullet = getLocalElements(p, 'buChar').length > 0 || getLocalElements(p, 'buAutoNum').length > 0;
      let pText = '';
      let bold = false;
      let italic = false;
      let color: string | undefined = undefined;

      // Iterate through child nodes of paragraph to preserve sequence (runs, fields, line breaks)
      for (let i = 0; i < p.childNodes.length; i++) {
        const node = p.childNodes[i];
        if (node.nodeType !== 1) continue; // Element nodes only
        const elem = node as Element;
        const local = elem.localName.toLowerCase();

        if (local === 'r' || local === 'fld') {
          const tList = getLocalElements(elem, 't');
          for (const t of tList) {
            pText += t.textContent || '';
          }
          const rPr = getLocalElements(elem, 'rPr')[0];
          if (rPr) {
            if (rPr.getAttribute('b') === '1') bold = true;
            if (rPr.getAttribute('i') === '1') italic = true;
            const srgbClr = getLocalElements(rPr, 'srgbClr')[0];
            if (srgbClr) {
              const hex = srgbClr.getAttribute('val');
              if (hex) color = `#${hex}`;
            }
          }
        } else if (local === 'br') {
          pText += '\n';
        } else if (local === 't') {
          pText += elem.textContent || '';
        }
      }

      // Fallback if child iteration yielded nothing
      if (!pText) {
        const tList = getLocalElements(p, 't');
        pText = tList.map(t => t.textContent || '').join('');
      }

      const trimmed = pText.trim();
      if (trimmed) {
        paragraphs.push({
          text: trimmed,
          isBullet,
          bold,
          italic,
          color
        });
        fullText += (fullText ? '\n' : '') + trimmed;
      }
    }

    return { paragraphs, fullText };
  };

  // Recursively collect all shape elements (handles p:grpSp group shapes)
  const collectShapeElements = (
    parent: Element | Document, 
    widthEmu: number, 
    heightEmu: number, 
    mediaMap: { [key: string]: string },
    rIdToMedia: { [rId: string]: string },
    elements: SlideElement[],
    visitedTxBodies: Set<Element>,
    shapeCounter: { val: number }
  ): string => {
    let mainSlideTitle = '';

    // 1. Process shapes (<p:sp> & <p:cxnSp>)
    const shapes = [...getLocalElements(parent, 'sp'), ...getLocalElements(parent, 'cxnSp')];
    for (const shape of shapes) {
      shapeCounter.val++;
      
      // Calculate coordinates
      let x = 5, y = 5, w = 90, h = 20;
      const xfrm = getLocalElements(shape, 'xfrm')[0];
      if (xfrm) {
        const off = getLocalElements(xfrm, 'off')[0];
        const ext = getLocalElements(xfrm, 'ext')[0];
        if (off && ext) {
          const offX = parseInt(off.getAttribute('x') || '0', 10);
          const offY = parseInt(off.getAttribute('y') || '0', 10);
          const extX = parseInt(ext.getAttribute('cx') || '0', 10);
          const extY = parseInt(ext.getAttribute('cy') || '0', 10);
          if (extX > 0 && extY > 0) {
            x = Math.max(0, Math.min(95, (offX / widthEmu) * 100));
            y = Math.max(0, Math.min(95, (offY / heightEmu) * 100));
            w = Math.max(5, Math.min(100, (extX / widthEmu) * 100));
            h = Math.max(5, Math.min(100, (extY / heightEmu) * 100));
          }
        }
      }

      const ph = getLocalElements(shape, 'ph')[0];
      const phType = ph?.getAttribute('type');
      const isTitleShape = phType === 'title' || phType === 'ctrTitle' || phType === 'subTitle';

      const txBody = getLocalElements(shape, 'txBody')[0];
      if (txBody) {
        visitedTxBodies.add(txBody);
        const { paragraphs, fullText } = parseTxBody(txBody);

        if (paragraphs.length > 0) {
          if (isTitleShape && !mainSlideTitle) {
            mainSlideTitle = paragraphs[0].text;
          }

          elements.push({
            id: `sp-${shapeCounter.val}`,
            type: 'text',
            title: isTitleShape,
            x, y, w, h,
            paragraphs
          });
        }
      }
    }

    // 2. Process Pictures (<p:pic>)
    const pics = getLocalElements(parent, 'pic');
    for (let pIdx = 0; pIdx < pics.length; pIdx++) {
      const pic = pics[pIdx];
      const blip = getLocalElements(pic, 'blip')[0];
      const embed = blip?.getAttribute('r:embed') || blip?.getAttribute('embed');
      const imgSrc = embed ? rIdToMedia[embed] : undefined;

      let x = 10, y = 10, w = 80, h = 50;
      const xfrm = getLocalElements(pic, 'xfrm')[0];
      if (xfrm) {
        const off = getLocalElements(xfrm, 'off')[0];
        const ext = getLocalElements(xfrm, 'ext')[0];
        if (off && ext) {
          const offX = parseInt(off.getAttribute('x') || '0', 10);
          const offY = parseInt(off.getAttribute('y') || '0', 10);
          const extX = parseInt(ext.getAttribute('cx') || '0', 10);
          const extY = parseInt(ext.getAttribute('cy') || '0', 10);
          if (extX > 0 && extY > 0) {
            x = Math.max(0, Math.min(95, (offX / widthEmu) * 100));
            y = Math.max(0, Math.min(95, (offY / heightEmu) * 100));
            w = Math.max(5, Math.min(100, (extX / widthEmu) * 100));
            h = Math.max(5, Math.min(100, (extY / heightEmu) * 100));
          }
        }
      }

      if (imgSrc) {
        elements.push({
          id: `pic-${shapeCounter.val}-${pIdx}`,
          type: 'image',
          x, y, w, h,
          imgSrc
        });
      }
    }

    // 3. Process Graphic Frames & Tables (<a:tbl>)
    const tables = getLocalElements(parent, 'tbl');
    for (let tIdx = 0; tIdx < tables.length; tIdx++) {
      const tbl = tables[tIdx];
      const rows = getLocalElements(tbl, 'tr');
      const tableData: string[][] = [];

      for (const r of rows) {
        const cells = getLocalElements(r, 'tc');
        const rowData: string[] = [];
        for (const c of cells) {
          const textNodes = getLocalElements(c, 't');
          const cellText = textNodes.map(t => t.textContent || '').join(' ').trim();
          rowData.push(cellText);
        }
        if (rowData.length > 0) {
          tableData.push(rowData);
        }
      }

      if (tableData.length > 0) {
        elements.push({
          id: `tbl-${shapeCounter.val}-${tIdx}`,
          type: 'table',
          x: 10, y: 25, w: 80, h: 50,
          tableRows: tableData
        });
      }
    }

    return mainSlideTitle;
  };

  // Main PPTX Parsing Effect
  useEffect(() => {
    let active = true;
    let createdUrl: string | null = null;

    setLoading(true);
    setError(null);
    setSlides([]);
    setCurrentPage(1);

    const parsePptx = async () => {
      try {
        let arrayBuffer: ArrayBuffer | null = null;

        if (fileNode.fileObject) {
          arrayBuffer = await fileNode.fileObject.arrayBuffer();
          const blob = new Blob([fileNode.fileObject], { type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' });
          createdUrl = URL.createObjectURL(blob);
          if (active) setPptUrl(createdUrl);
        } else if (fileNode.handle && fileNode.handle.kind === 'file') {
          const file = await (fileNode.handle as FileSystemFileHandle).getFile();
          arrayBuffer = await file.arrayBuffer();
          const blob = new Blob([file], { type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' });
          createdUrl = URL.createObjectURL(blob);
          if (active) setPptUrl(createdUrl);
        } else if (fileNode.content) {
          if (typeof fileNode.content === 'string') {
            const encoder = new TextEncoder();
            arrayBuffer = encoder.encode(fileNode.content).buffer;
          } else {
            arrayBuffer = fileNode.content;
          }
        }

        if (!arrayBuffer) {
          throw new Error('无法调取 PPT 文件二进制数据');
        }

        const zip = await JSZip.loadAsync(arrayBuffer);
        const parser = new DOMParser();

        // 1. Read Slide Dimensions
        let widthEmu = 12192000;
        let heightEmu = 6858000;
        const presFile = zip.file('ppt/presentation.xml');
        let presentationRels: { [rId: string]: string } = {};

        // Parse ppt/_rels/presentation.xml.rels to resolve Slide ordering accurately
        const presRelsFile = zip.file('ppt/_rels/presentation.xml.rels');
        if (presRelsFile) {
          const relsText = await presRelsFile.async('text');
          const relsDoc = parser.parseFromString(relsText, 'text/xml');
          const rels = getLocalElements(relsDoc, 'Relationship');
          for (const rel of rels) {
            const id = rel.getAttribute('Id');
            const target = rel.getAttribute('Target');
            if (id && target) {
              presentationRels[id] = target.startsWith('ppt/') ? target : `ppt/${target}`;
            }
          }
        }

        let orderedSlidePaths: string[] = [];

        if (presFile) {
          const presText = await presFile.async('text');
          const presDoc = parser.parseFromString(presText, 'text/xml');
          const sldSz = getLocalElements(presDoc, 'sldSz')[0];
          if (sldSz) {
            const cx = parseInt(sldSz.getAttribute('cx') || '12192000', 10);
            const cy = parseInt(sldSz.getAttribute('cy') || '6858000', 10);
            if (cx > 0 && cy > 0) {
              widthEmu = cx;
              heightEmu = cy;
              if (active) setAspectRatio(cx / cy);
            }
          }

          // Extract ordered slides from <p:sldIdLst>
          const sldIds = getLocalElements(presDoc, 'sldId');
          for (const sldId of sldIds) {
            const rId = sldId.getAttribute('r:id') || sldId.getAttribute('id');
            if (rId && presentationRels[rId]) {
              orderedSlidePaths.push(presentationRels[rId]);
            }
          }
        }

        // Fallback: If ordered list is empty, scan all files under ppt/slides/
        if (orderedSlidePaths.length === 0) {
          orderedSlidePaths = Object.keys(zip.files)
            .filter(f => /^ppt\/slides\/slide\d+\.xml$/i.test(f))
            .sort((a, b) => {
              const numA = parseInt(a.match(/slide(\d+)\.xml/i)?.[1] || '0', 10);
              const numB = parseInt(b.match(/slide(\d+)\.xml/i)?.[1] || '0', 10);
              return numA - numB;
            });
        }

        if (orderedSlidePaths.length === 0) {
          throw new Error('未在 PPTX 文件中检测到有效的幻灯片页面。');
        }

        // 2. Pre-extract Media files into Base64 Data URLs
        const mediaMap: { [path: string]: string } = {};
        const mediaFiles = Object.keys(zip.files).filter(f => f.startsWith('ppt/media/'));
        for (const mediaPath of mediaFiles) {
          const file = zip.file(mediaPath);
          if (file) {
            const base64 = await file.async('base64');
            const ext = mediaPath.split('.').pop()?.toLowerCase() || 'png';
            const mime = ext === 'svg' ? 'image/svg+xml' : ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : `image/${ext}`;
            const dataUrl = `data:${mime};base64,${base64}`;
            mediaMap[mediaPath] = dataUrl;
            mediaMap[mediaPath.replace('ppt/media/', '')] = dataUrl;
          }
        }

        const parsedSlides: SlideData[] = [];
        const outlineItems: OutlineItem[] = [];

        for (let i = 0; i < orderedSlidePaths.length; i++) {
          const slidePath = orderedSlidePaths[i];
          const pageNumber = i + 1;
          const slideFile = zip.file(slidePath);
          if (!slideFile) continue;

          const slideXmlText = await slideFile.async('text');
          const slideDoc = parser.parseFromString(slideXmlText, 'text/xml');

          // Parse Slide Relationships (_rels/slideX.xml.rels)
          const relsPath = slidePath.replace('ppt/slides/', 'ppt/slides/_rels/') + '.rels';
          const relsFile = zip.file(relsPath);
          const rIdToMedia: { [rId: string]: string } = {};

          if (relsFile) {
            const relsText = await relsFile.async('text');
            const relsDoc = parser.parseFromString(relsText, 'text/xml');
            const rels = getLocalElements(relsDoc, 'Relationship');
            for (const rel of rels) {
              const rId = rel.getAttribute('Id');
              const target = rel.getAttribute('Target');
              if (rId && target) {
                const cleanTarget = target.replace('../media/', '').replace('media/', '');
                if (mediaMap[cleanTarget]) {
                  rIdToMedia[rId] = mediaMap[cleanTarget];
                }
              }
            }
          }

          // Parse Speaker Notes if available
          let notesText = '';
          const notesPath = `ppt/notesSlides/notesSlide${pageNumber}.xml`;
          const notesFile = zip.file(notesPath);
          if (notesFile) {
            const nText = await notesFile.async('text');
            const nDoc = parser.parseFromString(nText, 'text/xml');
            const textNodes = getLocalElements(nDoc, 't');
            notesText = textNodes.map(n => n.textContent || '').join(' ').trim();
          }

          const elements: SlideElement[] = [];
          const visitedTxBodies = new Set<Element>();
          const shapeCounter = { val: 0 };

          // Extract shapes recursively (handles group shapes <p:grpSp>)
          const detectedTitle = collectShapeElements(
            slideDoc,
            widthEmu,
            heightEmu,
            mediaMap,
            rIdToMedia,
            elements,
            visitedTxBodies,
            shapeCounter
          );

          // Safety Net: Catch any txBody element missed in shape tree
          const allTxBodies = getLocalElements(slideDoc, 'txBody');
          for (let tbIdx = 0; tbIdx < allTxBodies.length; tbIdx++) {
            const tb = allTxBodies[tbIdx];
            if (!visitedTxBodies.has(tb)) {
              const { paragraphs } = parseTxBody(tb);
              if (paragraphs.length > 0) {
                elements.push({
                  id: `missed-tb-${tbIdx}`,
                  type: 'text',
                  x: 5, y: 10, w: 90, h: 20,
                  paragraphs
                });
              }
            }
          }

          // Derive Slide Title
          let finalTitle = detectedTitle;
          if (!finalTitle) {
            const titleElem = elements.find(e => e.title && e.paragraphs && e.paragraphs.length > 0);
            if (titleElem && titleElem.paragraphs) {
              finalTitle = titleElem.paragraphs[0].text;
            } else {
              const firstText = elements.find(e => e.paragraphs && e.paragraphs.length > 0);
              if (firstText && firstText.paragraphs) {
                finalTitle = firstText.paragraphs[0].text;
              }
            }
          }
          if (!finalTitle || finalTitle.trim().length === 0) {
            finalTitle = `第 ${pageNumber} 页幻灯片`;
          }

          // Generate full raw text for text view mode
          let fullRawText = `## 第 ${pageNumber} 页: ${finalTitle}\n\n`;
          for (const el of elements) {
            if (el.paragraphs) {
              for (const p of el.paragraphs) {
                fullRawText += (p.isBullet ? '• ' : '') + p.text + '\n';
              }
              fullRawText += '\n';
            } else if (el.tableRows) {
              fullRawText += '【表格数据】:\n';
              for (const row of el.tableRows) {
                fullRawText += '| ' + row.join(' | ') + ' |\n';
              }
              fullRawText += '\n';
            }
          }
          if (notesText) {
            fullRawText += `【演讲备注】: ${notesText}\n\n`;
          }

          parsedSlides.push({
            pageNumber,
            title: finalTitle,
            elements,
            notes: notesText || undefined,
            fullRawText
          });

          outlineItems.push({
            id: `ppt-slide-${pageNumber}`,
            text: `P${pageNumber}: ${finalTitle}`,
            level: 1,
            elementId: `ppt-slide-container-${pageNumber}`
          });
        }

        if (active) {
          setSlides(parsedSlides);
          setLoading(false);

          if (onOutlineExtracted && outlineItems.length > 0) {
            onOutlineExtracted(outlineItems);
          }
        }
      } catch (err: any) {
        console.error('PPT 解析失败:', err);
        if (active) {
          setError(err.message || 'PPT 解析失败，文件可能已被损坏或是不兼容的传统 .ppt 格式。');
          setLoading(false);
        }
      }
    };

    parsePptx();

    return () => {
      active = false;
      if (createdUrl) {
        URL.revokeObjectURL(createdUrl);
      }
    };
  }, [fileNode]);

  // Sync current slide on scroll using IntersectionObserver
  useEffect(() => {
    if (viewMode !== 'scroll' || slides.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const pageNum = parseInt(entry.target.getAttribute('data-page-number') || '1', 10);
            setCurrentPage(pageNum);
          }
        });
      },
      { threshold: 0.3 }
    );

    Object.values(slideRefs.current).forEach(el => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [viewMode, slides]);

  // Fullscreen slideshow keyboard navigation
  useEffect(() => {
    if (!isFullscreen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === ' ') {
        e.preventDefault();
        setCurrentPage(prev => Math.min(slides.length, prev + 1));
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        setCurrentPage(prev => Math.max(1, prev - 1));
      } else if (e.key === 'Escape') {
        setIsFullscreen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen, slides.length]);

  const handleDownload = () => {
    if (!pptUrl) return;
    const a = document.createElement('a');
    a.href = pptUrl;
    a.download = fileNode.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleOpenInNewTab = () => {
    if (!pptUrl) return;
    window.open(pptUrl, '_blank');
  };

  const handleCopyFullText = () => {
    const allText = slides.map(s => s.fullRawText).join('\n-------------------\n\n');
    navigator.clipboard.writeText(allText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Render a Single Slide Card
  const renderSlideCard = (slide: SlideData, isMini = false) => {
    return (
      <div 
        className={`w-full relative overflow-hidden bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-lg flex flex-col p-5 sm:p-7 transition-all ${
          fitHeightMode && !isMini ? 'min-h-[420px] h-auto' : 'h-full'
        }`}
        style={!fitHeightMode && !isMini ? { aspectRatio: `${aspectRatio}` } : undefined}
      >
        {/* Subtle background decoration */}
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 via-transparent to-blue-500/5 pointer-events-none" />

        {/* Slide Header / Title */}
        <div className="relative z-10 mb-4 shrink-0 pb-3 border-b border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-orange-100 dark:bg-orange-950/80 text-orange-600 dark:text-orange-400 shrink-0">
              SLIDE {slide.pageNumber}
            </span>
            <h3 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100 truncate">
              {slide.title}
            </h3>
          </div>
          {!isMini && (
            <span className="text-[11px] text-zinc-400 font-mono hidden sm:inline shrink-0">
              {slide.elements.length} 个元素
            </span>
          )}
        </div>

        {/* Slide Content Frame (No clipping when fitHeightMode is active) */}
        <div className={`relative flex-1 w-full ${fitHeightMode ? '' : 'overflow-auto custom-scrollbar'}`}>
          {slide.elements.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-zinc-400 text-xs italic">
              空白幻灯片或无排版文本元素
            </div>
          ) : (
            <div className="space-y-4">
              {slide.elements.map((elem) => {
                if (elem.type === 'text' && elem.paragraphs) {
                  return (
                    <div 
                      key={elem.id} 
                      className={`p-3.5 rounded-lg transition-colors ${
                        elem.title 
                          ? 'bg-orange-50/70 dark:bg-orange-950/30 border border-orange-200/60 dark:border-orange-900/40' 
                          : 'bg-zinc-50/80 dark:bg-zinc-800/40 border border-zinc-200/40 dark:border-zinc-800/40'
                      }`}
                    >
                      {elem.paragraphs.map((p, pIdx) => (
                        <div 
                          key={pIdx} 
                          className={`flex items-start gap-2 my-1 text-sm text-zinc-800 dark:text-zinc-200 leading-relaxed ${
                            p.bold ? 'font-bold' : ''
                          } ${p.italic ? 'italic' : ''}`}
                          style={{ color: p.color }}
                        >
                          {p.isBullet && <span className="text-orange-500 font-bold shrink-0 mt-0.5">•</span>}
                          <span className="whitespace-pre-wrap break-words">{p.text}</span>
                        </div>
                      ))}
                    </div>
                  );
                }

                if (elem.type === 'image' && elem.imgSrc) {
                  return (
                    <div key={elem.id} className="flex justify-center my-3">
                      <img 
                        src={elem.imgSrc} 
                        alt="Slide graphic" 
                        className="max-h-72 object-contain rounded-lg border border-zinc-200 dark:border-zinc-800 shadow-xs"
                      />
                    </div>
                  );
                }

                if (elem.type === 'table' && elem.tableRows) {
                  return (
                    <div key={elem.id} className="my-3 overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800 shadow-2xs">
                      <table className="w-full text-xs text-left text-zinc-700 dark:text-zinc-300">
                        <tbody>
                          {elem.tableRows.map((row, rIdx) => (
                            <tr 
                              key={rIdx} 
                              className={
                                rIdx === 0 
                                  ? 'bg-orange-100/70 dark:bg-orange-950/70 font-semibold text-zinc-900 dark:text-zinc-100' 
                                  : 'border-t border-zinc-200/60 dark:border-zinc-800'
                              }
                            >
                              {row.map((cell, cIdx) => (
                                <td key={cIdx} className="px-3 py-2 whitespace-normal break-words">
                                  {cell}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  );
                }

                return null;
              })}
            </div>
          )}
        </div>

        {/* Slide Speaker Notes */}
        {slide.notes && !isMini && (
          <div className="mt-4 pt-2.5 border-t border-zinc-100 dark:border-zinc-800/80 text-[11px] text-zinc-600 dark:text-zinc-400 flex items-start gap-1.5 shrink-0 bg-amber-50/60 dark:bg-amber-950/20 p-2.5 rounded-lg border border-amber-200/50 dark:border-amber-900/40">
            <StickyNote className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
            <p className="leading-relaxed"><span className="font-semibold text-amber-700 dark:text-amber-400">演讲者备注: </span>{slide.notes}</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-zinc-100 dark:bg-zinc-950 overflow-hidden">
      {/* Top Header Bar */}
      <div className="px-4 sm:px-6 py-3 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex flex-wrap items-center justify-between gap-3 shrink-0 shadow-2xs">
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2 rounded-xl bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 border border-orange-200/60 dark:border-orange-800/60 shrink-0">
            <Presentation className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">{fileNode.name}</h2>
              <span className="px-1.5 py-0.5 rounded text-[10px] uppercase font-mono bg-orange-100 dark:bg-orange-900/60 text-orange-700 dark:text-orange-300 font-semibold shrink-0">
                {fileNode.extension?.toUpperCase() || 'PPT'}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
              <span>共 {slides.length} 页幻灯片</span>
              {fileNode.size && <span>• {formatFileSize(fileNode.size)}</span>}
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
          {slides.length > 0 && (
            <button
              onClick={() => setIsFullscreen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-orange-600 hover:bg-orange-500 text-white shadow-xs transition-all cursor-pointer"
              title="进入全屏幻灯片放映模式"
            >
              <Tv className="w-3.5 h-3.5" />
              <span>全屏放映</span>
            </button>
          )}

          {pptUrl && (
            <>
              <button
                onClick={handleOpenInNewTab}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 transition-all cursor-pointer"
                title="在新标签页中打开"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">新窗口</span>
              </button>

              <button
                onClick={handleDownload}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 text-zinc-800 dark:text-zinc-200 transition-all cursor-pointer"
                title="下载 PPT"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">下载</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Toolbar: Mode Switcher, Layout Toggle & Page Controls */}
      {!error && slides.length > 0 && (
        <div className="px-4 py-2 border-b border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50 dark:bg-zinc-900/60 flex flex-wrap items-center justify-between gap-3 shrink-0 text-xs text-zinc-700 dark:text-zinc-300">
          {/* View Modes */}
          <div className="flex items-center bg-zinc-200/80 dark:bg-zinc-800 p-0.5 rounded-lg">
            <button
              onClick={() => setViewMode('scroll')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${
                viewMode === 'scroll'
                  ? 'bg-white dark:bg-zinc-900 text-orange-600 dark:text-orange-400 shadow-2xs font-semibold'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
              }`}
              title="连续纵向滑动页面"
            >
              <Scroll className="w-3.5 h-3.5" />
              <span>连续滚动</span>
            </button>

            <button
              onClick={() => setViewMode('single')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${
                viewMode === 'single'
                  ? 'bg-white dark:bg-zinc-900 text-orange-600 dark:text-orange-400 shadow-2xs font-semibold'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
              }`}
              title="单页专注浏览"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>单页模式</span>
            </button>

            <button
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-zinc-900 text-orange-600 dark:text-orange-400 shadow-2xs font-semibold'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
              }`}
              title="网格平铺全览"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>网格视图</span>
            </button>

            <button
              onClick={() => setViewMode('outline')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${
                viewMode === 'outline'
                  ? 'bg-white dark:bg-zinc-900 text-orange-600 dark:text-orange-400 shadow-2xs font-semibold'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
              }`}
              title="查看抽取出的完整文本与结构大纲"
            >
              <AlignLeft className="w-3.5 h-3.5" />
              <span>大纲文本</span>
            </button>
          </div>

          {/* Layout Display Height Mode Toggle */}
          {viewMode !== 'grid' && viewMode !== 'outline' && (
            <div className="flex items-center gap-2 border-l border-zinc-200 dark:border-zinc-800 pl-3">
              <button
                onClick={() => setFitHeightMode(prev => !prev)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border transition-all cursor-pointer ${
                  fitHeightMode 
                    ? 'bg-orange-50 dark:bg-orange-950/40 border-orange-300 dark:border-orange-800 text-orange-600 dark:text-orange-400 font-semibold' 
                    : 'bg-white dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400'
                }`}
                title={fitHeightMode ? '当前为自适应高度模式（内容100%完全展示）' : '当前为标准 16:9 视口模式'}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>{fitHeightMode ? '自适应撑开 (完整显示)' : '标准 16:9 比例'}</span>
              </button>
            </div>
          )}

          {/* Page Navigator */}
          {viewMode !== 'outline' && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => scrollToSlide(Math.max(1, currentPage - 1))}
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
                  max={slides.length}
                  value={currentPage}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    if (val >= 1 && val <= slides.length) {
                      scrollToSlide(val);
                    }
                  }}
                  className="w-12 px-1.5 py-0.5 text-center bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded text-xs font-mono focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
                <span>/ {slides.length} 页</span>
              </div>

              <button
                onClick={() => scrollToSlide(Math.min(slides.length, currentPage + 1))}
                disabled={currentPage >= slides.length}
                className="p-1.5 rounded-md hover:bg-zinc-200 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                title="下一页"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Zoom Controls */}
          {viewMode !== 'grid' && viewMode !== 'outline' && (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setScale(s => Math.max(0.6, s - 0.1))}
                disabled={scale <= 0.6}
                className="p-1.5 rounded-md hover:bg-zinc-200 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                title="缩小"
              >
                <ZoomOut className="w-4 h-4" />
              </button>

              <span className="w-12 text-center font-mono font-medium text-xs">
                {Math.round(scale * 100)}%
              </span>

              <button
                onClick={() => setScale(s => Math.min(2.0, s + 0.1))}
                disabled={scale >= 2.0}
                className="p-1.5 rounded-md hover:bg-zinc-200 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                title="放大"
              >
                <ZoomIn className="w-4 h-4" />
              </button>

              <button
                onClick={() => setScale(1.0)}
                className="p-1.5 rounded-md hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors ml-1 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                title="重置缩放"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Main Content Workspace */}
      <div 
        ref={containerRef}
        className="flex-1 relative overflow-auto custom-scrollbar p-4 sm:p-8 flex flex-col items-center justify-start bg-zinc-200/80 dark:bg-zinc-950"
      >
        {loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xs z-10 gap-3">
            <RefreshCw className="w-6 h-6 text-orange-500 animate-spin" />
            <p className="text-xs font-medium text-zinc-600 dark:text-zinc-300">正在全量提取 PPT 幻灯片、组合文本与矢量图表...</p>
          </div>
        )}

        {error ? (
          <div className="my-auto flex flex-col items-center justify-center p-8 text-center bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-md max-w-md">
            <AlertCircle className="w-10 h-10 text-rose-500 mb-3" />
            <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 mb-1">无法直接预览该 PPT</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4">{error}</p>
            {pptUrl && (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleOpenInNewTab}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-medium bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 text-zinc-700 dark:text-zinc-200 transition-all cursor-pointer"
                >
                  在新窗口打开
                </button>
                <button
                  onClick={handleDownload}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-medium bg-orange-600 hover:bg-orange-500 text-white shadow-xs transition-all cursor-pointer"
                >
                  下载原始文件
                </button>
              </div>
            )}
          </div>
        ) : (
          slides.length > 0 && (
            <div className="w-full max-w-5xl flex flex-col items-center">
              {/* Mode 1: Continuous Scroll */}
              {viewMode === 'scroll' && (
                <div className="w-full space-y-8 flex flex-col items-center">
                  {slides.map((slide) => (
                    <div 
                      key={slide.pageNumber}
                      id={`ppt-slide-container-${slide.pageNumber}`}
                      data-page-number={slide.pageNumber}
                      ref={(el) => registerSlideRef(slide.pageNumber, el)}
                      className="w-full transition-transform duration-200"
                      style={{ transform: `scale(${scale})`, transformOrigin: 'top center' }}
                    >
                      {renderSlideCard(slide)}
                    </div>
                  ))}
                </div>
              )}

              {/* Mode 2: Single Focus */}
              {viewMode === 'single' && (
                <div 
                  className="w-full flex flex-col items-center transition-transform duration-200 my-auto"
                  style={{ transform: `scale(${scale})`, transformOrigin: 'top center' }}
                >
                  {renderSlideCard(slides[currentPage - 1])}
                </div>
              )}

              {/* Mode 3: Grid Matrix View */}
              {viewMode === 'grid' && (
                <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {slides.map((slide) => (
                    <div 
                      key={slide.pageNumber}
                      onClick={() => {
                        setCurrentPage(slide.pageNumber);
                        setViewMode('single');
                      }}
                      className="cursor-pointer group hover:scale-[1.02] transition-all"
                    >
                      {renderSlideCard(slide, true)}
                    </div>
                  ))}
                </div>
              )}

              {/* Mode 4: Full Text Outline View */}
              {viewMode === 'outline' && (
                <div className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 sm:p-10 shadow-lg">
                  <div className="flex items-center justify-between pb-4 border-b border-zinc-200 dark:border-zinc-800 mb-6">
                    <div>
                      <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                        <AlignLeft className="w-4 h-4 text-orange-500" />
                        PPT 提取文字与结构大纲
                      </h3>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                        以下为从 PPTX 全量解析导出的文本内容，方便一键阅读与复制
                      </p>
                    </div>

                    <button
                      onClick={handleCopyFullText}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-orange-600 hover:bg-orange-500 text-white transition-all cursor-pointer shadow-xs"
                    >
                      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied ? '已复制全部文字' : '复制全篇文本'}</span>
                    </button>
                  </div>

                  <div className="space-y-8">
                    {slides.map((slide) => (
                      <div key={slide.pageNumber} className="p-5 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/60 dark:border-zinc-800">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-orange-100 dark:bg-orange-950 text-orange-600 dark:text-orange-400">
                            P{slide.pageNumber}
                          </span>
                          <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                            {slide.title}
                          </h4>
                        </div>

                        <div className="space-y-3 pl-2 border-l-2 border-orange-500/40">
                          {slide.elements.map((el, elIdx) => (
                            <div key={elIdx} className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed">
                              {el.paragraphs && el.paragraphs.map((p, pIdx) => (
                                <p key={pIdx} className="my-1">
                                  {p.isBullet ? '• ' : ''}{p.text}
                                </p>
                              ))}

                              {el.tableRows && (
                                <div className="my-2 overflow-x-auto">
                                  <table className="w-full text-xs text-left border border-zinc-200 dark:border-zinc-700">
                                    <tbody>
                                      {el.tableRows.map((row, rIdx) => (
                                        <tr key={rIdx} className={rIdx === 0 ? 'bg-orange-100/50 dark:bg-orange-900/30 font-semibold' : 'border-t border-zinc-200 dark:border-zinc-700'}>
                                          {row.map((cell, cIdx) => (
                                            <td key={cIdx} className="px-2 py-1">{cell}</td>
                                          ))}
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              )}
                            </div>
                          ))}

                          {slide.notes && (
                            <div className="mt-3 p-2 rounded bg-amber-50 dark:bg-amber-950/30 text-[11px] text-amber-800 dark:text-amber-300">
                              <strong>演讲者备注：</strong>{slide.notes}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        )}
      </div>

      {/* Fullscreen Slideshow Modal */}
      {isFullscreen && slides.length > 0 && (
        <div className="fixed inset-0 z-50 bg-black text-white flex flex-col select-none">
          {/* Fullscreen Top Bar */}
          <div className="px-6 py-4 flex items-center justify-between border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <span className="px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-orange-600 text-white">
                SLIDE {currentPage} / {slides.length}
              </span>
              <h3 className="text-sm font-semibold truncate max-w-xl">
                {slides[currentPage - 1]?.title}
              </h3>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowNotes(v => !v)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  showNotes ? 'bg-amber-500 text-black font-semibold' : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'
                }`}
              >
                <StickyNote className="w-3.5 h-3.5" />
                <span>备注</span>
              </button>

              <button
                onClick={() => setIsFullscreen(false)}
                className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors cursor-pointer"
                title="退出全屏 (Esc)"
              >
                <Minimize2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Fullscreen Slide View */}
          <div className="flex-1 relative flex items-center justify-center p-6 sm:p-12 overflow-hidden bg-zinc-950">
            <div className="w-full max-w-5xl max-h-full">
              {renderSlideCard(slides[currentPage - 1])}
            </div>

            {/* Speaker Notes Overlay */}
            {showNotes && slides[currentPage - 1]?.notes && (
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 max-w-2xl w-full mx-auto bg-zinc-900/90 border border-amber-500/40 backdrop-blur-md p-4 rounded-xl shadow-2xl text-xs text-amber-200">
                <p className="font-bold text-amber-400 mb-1 flex items-center gap-1.5">
                  <StickyNote className="w-3.5 h-3.5" />
                  演讲者备注
                </p>
                <p className="leading-relaxed">{slides[currentPage - 1].notes}</p>
              </div>
            )}
          </div>

          {/* Fullscreen Navigation Bar */}
          <div className="px-6 py-3 border-t border-zinc-800 bg-zinc-950 flex items-center justify-between">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className="flex items-center gap-1 px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 text-xs font-semibold cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>上一页 (←)</span>
            </button>

            <span className="text-xs text-zinc-400 font-mono">
              使用键盘方向键或空格键切换页面
            </span>

            <button
              onClick={() => setCurrentPage(p => Math.min(slides.length, p + 1))}
              disabled={currentPage >= slides.length}
              className="flex items-center gap-1 px-4 py-2 rounded-lg bg-orange-600 hover:bg-orange-500 disabled:opacity-30 text-xs font-semibold cursor-pointer"
            >
              <span>下一页 (→ / Space)</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
