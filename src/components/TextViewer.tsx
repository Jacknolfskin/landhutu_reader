import React, { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Copy, Check, Code, FileText } from 'lucide-react';
import { FileNode, ThemeMode } from '../types';
import { formatFileSize } from '../utils/fileUtils';
import { calculateDocumentStats } from '../utils/outlineExtractor';

interface TextViewerProps {
  fileNode: FileNode;
  content: string;
  theme?: ThemeMode;
}

const getLanguageFromFileName = (filename: string): string => {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  const langMap: Record<string, string> = {
    js: 'javascript',
    jsx: 'jsx',
    ts: 'typescript',
    tsx: 'tsx',
    json: 'json',
    html: 'html',
    css: 'css',
    py: 'python',
    sh: 'bash',
    bash: 'bash',
    sql: 'sql',
    rs: 'rust',
    go: 'go',
    java: 'java',
    cpp: 'cpp',
    c: 'c',
    md: 'markdown',
    xml: 'xml',
    yaml: 'yaml',
    yml: 'yaml'
  };
  return langMap[ext] || 'text';
};

export const TextViewer: React.FC<TextViewerProps> = ({ fileNode, content, theme = 'dark' }) => {
  const [copied, setCopied] = useState<boolean>(false);

  const lines = (content || '').split('\n');
  const stats = calculateDocumentStats(content || '');
  const language = getLanguageFromFileName(fileNode.name);

  const isDarkMode = theme === 'dark';
  const syntaxTheme = isDarkMode ? vscDarkPlus : oneLight;

  const fallbackCopy = () => {
    try {
      const textarea = document.createElement('textarea');
      textarea.value = content;
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
      navigator.clipboard.writeText(content)
        .then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        })
        .catch(() => fallbackCopy());
    } else {
      fallbackCopy();
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-zinc-950 overflow-hidden">
      {/* File header */}
      <div className="px-6 py-3 border-b border-zinc-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-4 bg-zinc-50/50 dark:bg-zinc-900/50">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/60">
            <Code className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">{fileNode.name}</h2>
              <span className="px-1.5 py-0.5 rounded text-[10px] uppercase font-mono bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-semibold">
                {language}
              </span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-zinc-500 font-normal mt-0.5">
              <span>{lines.length} 行</span>
              <span>•</span>
              <span>{stats.charCount.toLocaleString()} 字符</span>
              {fileNode.size && (
                <>
                  <span>•</span>
                  <span>{formatFileSize(fileNode.size)}</span>
                </>
              )}
            </div>
          </div>
        </div>

        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-600 hover:bg-blue-500 text-white shadow-xs transition-all cursor-pointer"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-white" />
              <span>已复制</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>复制全部代码</span>
            </>
          )}
        </button>
      </div>

      {/* Syntax Highlighted Code Content */}
      <div className="flex-1 overflow-auto bg-zinc-900 dark:bg-zinc-950 text-xs sm:text-sm font-mono custom-scrollbar">
        <SyntaxHighlighter
          language={language}
          style={vscDarkPlus}
          showLineNumbers={true}
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
            minWidth: '3em',
            paddingRight: '1em',
            color: '#52525b',
            textAlign: 'right',
            userSelect: 'none',
            background: 'transparent'
          }}
          customStyle={{
            margin: 0,
            padding: '1.25rem',
            background: 'transparent',
            fontSize: '0.875rem',
            lineHeight: '1.6',
            fontFamily: '"JetBrains Mono", "Fira Code", Monaco, Consolas, monospace'
          }}
        >
          {content || ''}
        </SyntaxHighlighter>
      </div>
    </div>
  );
};

