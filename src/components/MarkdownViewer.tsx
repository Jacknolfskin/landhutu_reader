import React, { useState, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { 
  Copy, 
  Check, 
  Clock, 
  FileText, 
  Hash, 
  Calendar,
  Code2,
  ExternalLink,
  Info,
  CheckSquare,
  Square
} from 'lucide-react';
import { FileNode, ThemeMode } from '../types';
import { formatDate, formatFileSize } from '../utils/fileUtils';
import { calculateDocumentStats, slugifyHeading } from '../utils/outlineExtractor';

interface MarkdownViewerProps {
  fileNode: FileNode;
  content: string;
  theme?: ThemeMode;
  activeHeadingId?: string | null;
  onSelectHeading?: (elementId: string, headingText?: string) => void;
  onHeadingIntersect?: (elementId: string) => void;
}

// Helper to extract plain text string recursively from React children
function getTextFromChildren(children: any): string {
  if (!children) return '';
  if (typeof children === 'string' || typeof children === 'number') {
    return String(children);
  }
  if (Array.isArray(children)) {
    return children.map(getTextFromChildren).join('');
  }
  if (typeof children === 'object' && children?.props?.children) {
    return getTextFromChildren(children.props.children);
  }
  return '';
}

interface CodeBlockProps {
  language: string;
  codeString: string;
}

const CodeBlockComponent: React.FC<CodeBlockProps> = ({ language, codeString }) => {
  const [copied, setCopied] = useState(false);

  const fallbackCopy = () => {
    try {
      const textarea = document.createElement('textarea');
      textarea.value = codeString;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  };

  const handleCopy = () => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(codeString)
        .then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        })
        .catch(() => fallbackCopy());
    } else {
      fallbackCopy();
    }
  };

  const lineCount = codeString.split('\n').length;

  return (
    <div className="relative group my-6 rounded-xl overflow-hidden border border-zinc-800/90 shadow-md bg-zinc-900 dark:bg-zinc-950 text-zinc-100 transition-all">
      {/* Top Bar with Language Tag & Copy Action */}
      <div className="flex items-center justify-between px-4 py-2 bg-zinc-800/90 text-xs text-zinc-300 font-mono border-b border-zinc-700/60">
        <div className="flex items-center gap-2">
          <Code2 className="w-3.5 h-3.5 text-blue-400" />
          <span className="font-semibold uppercase tracking-wider text-[11px] text-zinc-200">
            {language || 'code'}
          </span>
          <span className="text-[10px] text-zinc-400 font-normal">
            ({lineCount} 行)
          </span>
        </div>

        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-700/70 hover:bg-zinc-700 text-[11px] text-zinc-200 transition-all active:scale-95 cursor-pointer"
          title="复制代码内容"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400 font-semibold">已复制</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 text-zinc-300" />
              <span>复制</span>
            </>
          )}
        </button>
      </div>

      {/* Syntax Highlighted Code Output */}
      <div className="overflow-x-auto text-xs sm:text-sm font-mono custom-scrollbar bg-zinc-900 dark:bg-zinc-950">
        <SyntaxHighlighter
          language={language || 'text'}
          style={vscDarkPlus}
          showLineNumbers={lineCount > 3}
          codeTagProps={{
            style: {
              background: 'transparent',
              fontFamily: 'inherit'
            }
          }}
          lineProps={{
            style: {
              background: 'transparent'
            }
          }}
          lineNumberStyle={{
            minWidth: '2.5em',
            paddingRight: '1em',
            color: '#52525b',
            textAlign: 'right',
            userSelect: 'none',
            background: 'transparent'
          }}
          customStyle={{
            margin: 0,
            padding: '1rem',
            background: 'transparent',
            fontSize: '0.85rem',
            lineHeight: '1.6',
            fontFamily: '"JetBrains Mono", "Fira Code", Monaco, Consolas, monospace'
          }}
        >
          {codeString}
        </SyntaxHighlighter>
      </div>
    </div>
  );
};

const CodeBlock = React.memo(CodeBlockComponent);

const MarkdownViewerComponent: React.FC<MarkdownViewerProps> = ({
  fileNode,
  content,
  theme = 'light',
  activeHeadingId,
  onSelectHeading,
  onHeadingIntersect
}) => {
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  const articleRef = React.useRef<HTMLElement>(null);

  const stats = useMemo(() => calculateDocumentStats(content), [content]);

  // Track occurrences of heading slugs for deterministic ID creation matching outlineExtractor
  const slugCountsRef = React.useRef(new Map<string, number>());
  slugCountsRef.current.clear();

  const createHeadingId = (children: any) => {
    const textStr = getTextFromChildren(children).trim();
    const slug = slugifyHeading(textStr);
    const count = (slugCountsRef.current.get(slug) || 0) + 1;
    slugCountsRef.current.set(slug, count);
    return { elementId: `hd-${slug}-${count}`, cleanText: textStr };
  };

  // Click handler to sync active outline item when clicking anywhere on headings or content
  const handleArticleClick = (e: React.MouseEvent) => {
    // Ignore text selection
    const selection = window.getSelection();
    if (selection && selection.toString().trim().length > 0) {
      return;
    }

    if (!onHeadingIntersect && !onSelectHeading) return;
    const target = e.target as HTMLElement;
    if (target.closest('a') || target.closest('button')) return;

    // 1. Direct heading element click
    const headingEl = target.closest('h1[id], h2[id], h3[id], h4[id], h5[id], h6[id]') as HTMLElement | null;
    if (headingEl && headingEl.id) {
      if (onHeadingIntersect) {
        onHeadingIntersect(headingEl.id);
      }
      return;
    }

    // 2. Click on content section - find closest preceding heading
    const article = articleRef.current;
    if (!article) return;
    const headings = Array.from(article.querySelectorAll('h1[id], h2[id], h3[id], h4[id], h5[id], h6[id]')) as HTMLElement[];
    if (headings.length === 0) return;

    const targetRect = target.getBoundingClientRect();
    let closestHeading: HTMLElement | null = null;

    for (const heading of headings) {
      const rect = heading.getBoundingClientRect();
      if (rect.top <= targetRect.top + 30) {
        closestHeading = heading;
      } else {
        break;
      }
    }

    if (!closestHeading && headings.length > 0) {
      closestHeading = headings[0];
    }

    if (closestHeading && closestHeading.id) {
      if (onHeadingIntersect) {
        onHeadingIntersect(closestHeading.id);
      }
    }
  };

  const isDarkMode = theme === 'dark';

  const components = useMemo(() => ({
    // Heading overrides to attach predictable elementIds for outline navigation
    h1({ children, ...props }: any) {
      const { elementId, cleanText } = createHeadingId(children);
      return (
        <h1 
          id={elementId} 
          data-heading-text={cleanText} 
          className="scroll-mt-24 text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100 border-b border-zinc-200/80 dark:border-zinc-800 pb-3 mt-10 mb-5 flex items-center gap-2 group" 
          {...props}
        >
          <span className="w-1.5 h-7 rounded-full bg-blue-600 dark:bg-blue-500 inline-block shrink-0 mr-1" />
          <span className="flex-1">{children}</span>
        </h1>
      );
    },
    h2({ children, ...props }: any) {
      const { elementId, cleanText } = createHeadingId(children);
      return (
        <h2 
          id={elementId} 
          data-heading-text={cleanText} 
          className="scroll-mt-24 text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 border-b border-zinc-100 dark:border-zinc-800/60 pb-2 mt-8 mb-4 flex items-center gap-2" 
          {...props}
        >
          <span className="w-1 h-5 rounded-full bg-blue-500/80 dark:bg-blue-400 inline-block shrink-0 mr-1" />
          <span className="flex-1">{children}</span>
        </h2>
      );
    },
    h3({ children, ...props }: any) {
      const { elementId, cleanText } = createHeadingId(children);
      return (
        <h3 
          id={elementId} 
          data-heading-text={cleanText} 
          className="scroll-mt-24 text-lg sm:text-xl font-semibold text-zinc-800 dark:text-zinc-200 mt-7 mb-3" 
          {...props}
        >
          {children}
        </h3>
      );
    },
    h4({ children, ...props }: any) {
      const { elementId, cleanText } = createHeadingId(children);
      return (
        <h4 
          id={elementId} 
          data-heading-text={cleanText} 
          className="scroll-mt-24 text-base sm:text-lg font-semibold text-zinc-800 dark:text-zinc-200 mt-6 mb-2" 
          {...props}
        >
          {children}
        </h4>
      );
    },
    h5({ children, ...props }: any) {
      const { elementId, cleanText } = createHeadingId(children);
      return (
        <h5 
          id={elementId} 
          data-heading-text={cleanText} 
          className="scroll-mt-24 text-sm font-semibold text-zinc-700 dark:text-zinc-300 mt-5 mb-1.5" 
          {...props}
        >
          {children}
        </h5>
      );
    },
    h6({ children, ...props }: any) {
      const { elementId, cleanText } = createHeadingId(children);
      return (
        <h6 
          id={elementId} 
          data-heading-text={cleanText} 
          className="scroll-mt-24 text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mt-4 mb-1" 
          {...props}
        >
          {children}
        </h6>
      );
    },

    // Paragraphs with comfortable line height and breathing space
    p({ children }: any) {
      return (
        <p className="my-4 leading-[1.8] text-zinc-700 dark:text-zinc-300 font-normal">
          {children}
        </p>
      );
    },

    // Links styled in Apple-blue with subtle underline
    a({ href, children }: any) {
      const isExternal = href?.startsWith('http');
      return (
        <a
          href={href}
          target={isExternal ? '_blank' : undefined}
          rel={isExternal ? 'noopener noreferrer' : undefined}
          className="inline-flex items-center gap-0.5 text-blue-600 dark:text-blue-400 hover:text-blue-500 font-medium underline underline-offset-4 decoration-blue-500/30 hover:decoration-blue-500 transition-colors"
        >
          <span>{children}</span>
          {isExternal && <ExternalLink className="w-3 h-3 inline opacity-70" />}
        </a>
      );
    },

    // Lists
    ul({ children }: any) {
      return (
        <ul className="my-4 pl-6 space-y-1.5 list-disc text-zinc-700 dark:text-zinc-300">
          {children}
        </ul>
      );
    },
    ol({ children }: any) {
      return (
        <ol className="my-4 pl-6 space-y-1.5 list-decimal text-zinc-700 dark:text-zinc-300 font-normal">
          {children}
        </ol>
      );
    },
    li({ children, className }: any) {
      // Task list item support
      const isTaskList = className?.includes('task-list-item');
      if (isTaskList) {
        return (
          <li className="list-none flex items-start gap-2 -ml-6 my-1 text-zinc-700 dark:text-zinc-300">
            {children}
          </li>
        );
      }
      return (
        <li className="leading-relaxed">
          {children}
        </li>
      );
    },

    // Checkbox inputs inside task lists
    input({ type, checked, readOnly, ...props }: any) {
      if (type === 'checkbox') {
        return (
          <span className="inline-flex items-center justify-center mr-1.5 align-middle">
            {checked ? (
              <CheckSquare className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
            ) : (
              <Square className="w-4 h-4 text-zinc-400 dark:text-zinc-600 shrink-0" />
            )}
          </span>
        );
      }
      return <input type={type} checked={checked} readOnly={readOnly} {...props} />;
    },

    // Unwrap pre tag to avoid nested pre/div HTML issue from react-markdown
    pre({ children }: any) {
      return <>{children}</>;
    },

    // Code blocks with full syntax highlighting & copy header
    code({ node, className, children, ...props }: any) {
      const match = /language-(\w+)/.exec(className || '');
      const language = match ? match[1] : '';
      const codeString = String(children).replace(/\n$/, '');
      const isInline = !match && !codeString.includes('\n');

      if (isInline) {
        return (
          <code 
            className="px-1.5 py-0.5 mx-0.5 rounded-md text-[13px] bg-blue-50/90 dark:bg-zinc-800/90 text-blue-700 dark:text-blue-300 font-mono border border-blue-200/60 dark:border-zinc-700/80 shadow-2xs inline font-medium" 
            {...props}
          >
            {children}
          </code>
        );
      }

      return <CodeBlock language={language} codeString={codeString} />;
    },

    // Tables
    table({ children }: any) {
      return (
        <div className="my-6 overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-2xs bg-white dark:bg-zinc-900/50">
          <table className="w-full text-xs sm:text-sm text-left border-collapse">
            {children}
          </table>
        </div>
      );
    },
    thead({ children }: any) {
      return (
        <thead className="bg-zinc-100/80 dark:bg-zinc-800/80 text-zinc-800 dark:text-zinc-200 font-semibold border-b border-zinc-200 dark:border-zinc-700/80">
          {children}
        </thead>
      );
    },
    th({ children }: any) {
      return <th className="px-4 py-3 font-semibold">{children}</th>;
    },
    td({ children }: any) {
      return <td className="px-4 py-2.5 border-t border-zinc-100 dark:border-zinc-800/60 text-zinc-700 dark:text-zinc-300">{children}</td>;
    },

    // Blockquotes with Apple callout styling
    blockquote({ children }: any) {
      return (
        <blockquote className="my-6 pl-4 pr-4 py-3 border-l-4 border-blue-500 bg-blue-50/50 dark:bg-blue-950/20 text-zinc-700 dark:text-zinc-300 rounded-r-xl text-sm italic font-medium flex items-start gap-2">
          <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5 not-italic" />
          <div className="flex-1 not-italic">{children}</div>
        </blockquote>
      );
    },

    // Images with rounded corners and captions
    img({ src, alt }: any) {
      return (
        <span className="my-6 block text-center">
          <img
            src={src}
            alt={alt}
            className="max-w-full h-auto mx-auto rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-md object-cover"
            loading="lazy"
          />
          {alt && (
            <span className="mt-2 block text-xs text-zinc-400 dark:text-zinc-500 italic">
              {alt}
            </span>
          )}
        </span>
      );
    },

    // Horizontal Rule
    hr() {
      return (
        <hr className="my-8 border-none h-px bg-gradient-to-r from-transparent via-zinc-200 dark:via-zinc-800 to-transparent" />
      );
    }
  }), [theme]);

  return (
    <div 
      ref={scrollContainerRef} 
      className="flex-1 overflow-y-auto bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 transition-colors custom-scrollbar"
    >
      {/* Top Document Header Bar */}
      <div className="max-w-4xl mx-auto px-6 sm:px-10 pt-8 pb-6 border-b border-zinc-100 dark:border-zinc-800/80 mb-8">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100 mb-3">
          {fileNode.name}
        </h1>

        {/* Metadata stats pill */}
        <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-500 dark:text-zinc-400 font-normal">
          <div className="flex items-center gap-1.5 bg-zinc-100/70 dark:bg-zinc-900 px-2.5 py-1 rounded-full border border-zinc-200/50 dark:border-zinc-800">
            <Clock className="w-3.5 h-3.5 text-blue-500" />
            <span>约 {stats.readingTimeMinutes} 分钟阅读</span>
          </div>

          <div className="flex items-center gap-1.5 bg-zinc-100/70 dark:bg-zinc-900 px-2.5 py-1 rounded-full border border-zinc-200/50 dark:border-zinc-800">
            <Hash className="w-3.5 h-3.5 text-emerald-500" />
            <span>{stats.wordCount.toLocaleString()} 字</span>
          </div>

          <div className="flex items-center gap-1.5 bg-zinc-100/70 dark:bg-zinc-900 px-2.5 py-1 rounded-full border border-zinc-200/50 dark:border-zinc-800">
            <Calendar className="w-3.5 h-3.5 text-amber-500" />
            <span>{formatDate(fileNode.lastModified)}</span>
          </div>

          {fileNode.size && (
            <div className="px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-[11px] font-mono text-zinc-600 dark:text-zinc-400">
              {formatFileSize(fileNode.size)}
            </div>
          )}
        </div>
      </div>

      {/* Main Markdown Article Content */}
      <article 
        ref={articleRef}
        onClick={handleArticleClick}
        className="max-w-4xl mx-auto px-6 sm:px-10 pb-24 text-[15px] sm:text-base leading-relaxed tracking-normal font-normal cursor-pointer"
      >
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={components}
        >
          {content}
        </ReactMarkdown>
      </article>
    </div>
  );
};

export const MarkdownViewer = React.memo(
  MarkdownViewerComponent,
  (prevProps, nextProps) =>
    prevProps.fileNode.id === nextProps.fileNode.id &&
    prevProps.fileNode.path === nextProps.fileNode.path &&
    prevProps.content === nextProps.content &&
    prevProps.theme === nextProps.theme
);
