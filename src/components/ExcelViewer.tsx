import React, { useEffect, useState } from 'react';
import * as XLSX from 'xlsx';
import { FileSpreadsheet, Search, Loader2, AlertCircle, FileText, Database } from 'lucide-react';
import { FileNode } from '../types';
import { formatFileSize } from '../utils/fileUtils';

interface ExcelViewerProps {
  fileNode: FileNode;
  content?: string;
}

export const ExcelViewer: React.FC<ExcelViewerProps> = ({ fileNode, content }) => {
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [currentSheet, setCurrentSheet] = useState<string>('');
  const [tableData, setTableData] = useState<any[][]>([]);
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    const parseSpreadsheet = async () => {
      try {
        let workbook: XLSX.WorkBook | null = null;

        if (content && typeof content === 'string' && fileNode.extension === 'csv') {
          // Parse CSV string
          workbook = XLSX.read(content, { type: 'string' });
        } else {
          let arrayBuffer: ArrayBuffer | null = null;

          if (fileNode.fileObject) {
            arrayBuffer = await fileNode.fileObject.arrayBuffer();
          } else if (fileNode.handle && fileNode.handle.kind === 'file') {
            const file = await (fileNode.handle as FileSystemFileHandle).getFile();
            arrayBuffer = await file.arrayBuffer();
          }

          if (arrayBuffer) {
            workbook = XLSX.read(arrayBuffer, { type: 'array' });
          } else if (content && typeof content === 'string') {
            workbook = XLSX.read(content, { type: 'string' });
          }
        }

        if (!workbook || workbook.SheetNames.length === 0) {
          throw new Error('无法正确读取表格或数据内容为空');
        }

        if (!isMounted) return;

        setSheetNames(workbook.SheetNames);
        const firstSheet = workbook.SheetNames[0];
        setCurrentSheet(firstSheet);

        const sheet = workbook.Sheets[firstSheet];
        const jsonData = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1 });

        setTableData(jsonData);
        setLoading(false);
      } catch (err: any) {
        console.error('Failed to parse spreadsheet:', err);
        if (isMounted) {
          setError(err.message || '电子表格解析失败');
          setLoading(false);
        }
      }
    };

    parseSpreadsheet();

    return () => {
      isMounted = false;
    };
  }, [fileNode, content]);

  const handleSwitchSheet = (sheetName: string) => {
    setCurrentSheet(sheetName);
    // Reload worksheet data
    try {
      let workbook: XLSX.WorkBook | null = null;
      if (content) {
        workbook = XLSX.read(content, { type: 'string' });
      }
      if (workbook && workbook.Sheets[sheetName]) {
        const sheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1 });
        setTableData(jsonData);
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-zinc-400">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500 mb-3" />
        <p className="text-xs font-medium">正在加载电子表格单元格与工作表...</p>
      </div>
    );
  }

  if (error || tableData.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-zinc-500">
        <AlertCircle className="w-10 h-10 text-amber-500 mb-3" />
        <h3 className="text-base font-semibold text-zinc-800 dark:text-zinc-200 mb-1">电子表格暂无有效内容</h3>
        <p className="text-xs text-zinc-500">{error || '工作表为空'}</p>
      </div>
    );
  }

  const headers = tableData[0] || [];
  const rows = tableData.slice(1);

  // Search filter across row cells
  const filteredRows = rows.filter(row => {
    if (!searchFilter) return true;
    return row.some(cell => 
      String(cell || '').toLowerCase().includes(searchFilter.toLowerCase())
    );
  });

  return (
    <div className="flex-1 flex flex-col bg-zinc-50 dark:bg-zinc-950 overflow-hidden">
      {/* Header toolbar */}
      <div className="px-6 py-4 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60">
            <FileSpreadsheet className="w-5 h-5" />
          </div>

          <div>
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <span>{fileNode.name}</span>
            </h2>
            <div className="flex items-center gap-3 text-xs text-zinc-500 font-normal">
              <span>{rows.length} 行记录</span>
              <span>•</span>
              <span>{headers.length} 列数据</span>
              {fileNode.size && (
                <>
                  <span>•</span>
                  <span>{formatFileSize(fileNode.size)}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Search input in sheet */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder="筛选单元格内容..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-md text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Sheet Tabs Bar if multiple sheets */}
      {sheetNames.length > 1 && (
        <div className="flex items-center gap-1 px-6 py-2 bg-zinc-100 dark:bg-zinc-900/60 border-b border-zinc-200 dark:border-zinc-800 overflow-x-auto">
          <Database className="w-3.5 h-3.5 text-zinc-400 shrink-0 mr-1" />
          {sheetNames.map((sheet) => (
            <button
              key={sheet}
              onClick={() => handleSwitchSheet(sheet)}
              className={`px-3 py-1 rounded text-xs font-medium transition-all ${
                currentSheet === sheet
                  ? 'bg-white dark:bg-zinc-800 text-emerald-600 dark:text-emerald-400 shadow-xs border border-zinc-200 dark:border-zinc-700'
                  : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800'
              }`}
            >
              {sheet}
            </button>
          ))}
        </div>
      )}

      {/* Table Data View */}
      <div className="flex-1 overflow-auto p-6 custom-scrollbar">
        <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden bg-white dark:bg-zinc-900 shadow-xs">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-semibold sticky top-0 border-b border-zinc-200 dark:border-zinc-700">
              <tr>
                <th className="px-3 py-2 w-12 text-center text-[10px] text-zinc-400 font-mono border-r border-zinc-200 dark:border-zinc-700/60 bg-zinc-200/50 dark:bg-zinc-800/80">
                  #
                </th>
                {headers.map((col: any, idx: number) => (
                  <th
                    key={idx}
                    className="px-4 py-2.5 font-medium border-r border-zinc-200 dark:border-zinc-700/60 last:border-r-0 whitespace-nowrap"
                  >
                    {String(col || `列 ${idx + 1}`)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800 text-zinc-800 dark:text-zinc-200">
              {filteredRows.map((row, rIdx) => (
                <tr
                  key={rIdx}
                  className="hover:bg-emerald-50/40 dark:hover:bg-emerald-950/20 transition-colors"
                >
                  <td className="px-3 py-2 text-center text-[10px] font-mono text-zinc-400 bg-zinc-50/50 dark:bg-zinc-800/30 border-r border-zinc-200 dark:border-zinc-800 select-none">
                    {rIdx + 1}
                  </td>
                  {headers.map((_, cIdx) => (
                    <td
                      key={cIdx}
                      className="px-4 py-2 border-r border-zinc-100 dark:border-zinc-800/50 last:border-r-0 whitespace-nowrap text-xs max-w-xs truncate"
                      title={String(row[cIdx] ?? '')}
                    >
                      {String(row[cIdx] ?? '')}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
