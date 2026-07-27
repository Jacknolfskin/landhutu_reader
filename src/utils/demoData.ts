import { FileNode } from '../types';
import JSZip from 'jszip';

export async function createDemoPptxBuffer(): Promise<ArrayBuffer> {
  const zip = new JSZip();
  zip.file('[Content_Types].xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/><Override PartName="/ppt/slides/slide1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/><Override PartName="/ppt/slides/slide2.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/><Override PartName="/ppt/slides/slide3.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/></Types>`);

  zip.file('_rels/.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="ppt/presentation.xml"/></Relationships>`);

  zip.file('ppt/presentation.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><p:presentation xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"><p:sldSz cx="12192000" cy="6858000"/></p:presentation>`);

  zip.file('ppt/slides/slide1.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sld xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">
  <p:cSld>
    <p:spTree>
      <p:sp>
        <p:nvSpPr><p:cNvPr id="1" name="Title"/><p:nvPr><p:ph type="title"/></p:nvPr></p:nvSpPr>
        <p:txBody><a:bodyPr/><a:p><a:r><a:t>🚀 2026 年度产品规划与设计汇报</a:t></a:r></a:p></p:txBody>
      </p:sp>
      <p:sp>
        <p:nvSpPr><p:cNvPr id="2" name="Subtitle"/><p:nvPr/></p:nvSpPr>
        <p:txBody><a:bodyPr/>
          <a:p><a:r><a:t>• 主题：极简本地文档与大纲阅读器升级</a:t></a:r></a:p>
          <a:p><a:r><a:t>• 汇报人：产品研发团队</a:t></a:r></a:p>
          <a:p><a:r><a:t>• 包含 Markdown、Word、Excel、PDF 及 PPT 全套支持</a:t></a:r></a:p>
        </p:txBody>
      </p:sp>
    </p:spTree>
  </p:cSld>
</p:sld>`);

  zip.file('ppt/slides/slide2.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sld xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">
  <p:cSld>
    <p:spTree>
      <p:sp>
        <p:nvSpPr><p:cNvPr id="1" name="Title"/><p:nvPr><p:ph type="title"/></p:nvPr></p:nvSpPr>
        <p:txBody><a:bodyPr/><a:p><a:r><a:t>✨ 核心功能与架构特性</a:t></a:r></a:p></p:txBody>
      </p:sp>
      <p:sp>
        <p:nvSpPr><p:cNvPr id="2" name="Content"/><p:nvPr/></p:nvSpPr>
        <p:txBody><a:bodyPr/>
          <a:p><a:buChar char="•"/><a:r><a:t>侧边栏与文档大纲宽度支持拖拽调节，记住用户偏好</a:t></a:r></a:p>
          <a:p><a:buChar char="•"/><a:r><a:t>支持 PPT/PPTX 全排版预览，多模式自由切换</a:t></a:r></a:p>
          <a:p><a:buChar char="•"/><a:r><a:t>提供连续滚动模式、单页专注模式、网格视图与全屏演示放映</a:t></a:r></a:p>
          <a:p><a:buChar char="•"/><a:r><a:t>自动提取各页 Slide 标题形成导航大纲，点击一键直达</a:t></a:r></a:p>
        </p:txBody>
      </p:sp>
    </p:spTree>
  </p:cSld>
</p:sld>`);

  zip.file('ppt/slides/slide3.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sld xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">
  <p:cSld>
    <p:spTree>
      <p:sp>
        <p:nvSpPr><p:cNvPr id="1" name="Title"/><p:nvPr><p:ph type="title"/></p:nvPr></p:nvSpPr>
        <p:txBody><a:bodyPr/><a:p><a:r><a:t>📊 研发里程碑与后续计划</a:t></a:r></a:p></p:txBody>
      </p:sp>
      <p:graphicFrame>
        <a:graphic>
          <a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/table">
            <a:tbl>
              <a:tr><a:tc><a:txBody><a:p><a:r><a:t>阶段</a:t></a:r></a:p></a:txBody></a:tc><a:tc><a:txBody><a:p><a:r><a:t>里程碑任务</a:t></a:r></a:p></a:txBody></a:tc><a:tc><a:txBody><a:p><a:r><a:t>状态</a:t></a:r></a:p></a:txBody></a:tc></a:tr>
              <a:tr><a:tc><a:txBody><a:p><a:r><a:t>Q1</a:t></a:r></a:p></a:txBody></a:tc><a:tc><a:txBody><a:p><a:r><a:t>基础文档阅读与多端布局适配</a:t></a:r></a:p></a:txBody></a:tc><a:tc><a:txBody><a:p><a:r><a:t>已完成</a:t></a:r></a:p></a:txBody></a:tc></a:tr>
              <a:tr><a:tc><a:txBody><a:p><a:r><a:t>Q2</a:t></a:r></a:p></a:txBody></a:tc><a:tc><a:txBody><a:p><a:r><a:t>PPT 演示预览与自由拖拽拉伸</a:t></a:r></a:p></a:txBody></a:tc><a:tc><a:txBody><a:p><a:r><a:t>已完成</a:t></a:r></a:p></a:txBody></a:tc></a:tr>
            </a:tbl>
          </a:graphicData>
        </a:graphic>
      </p:graphicFrame>
    </p:spTree>
  </p:cSld>
</p:sld>`);

  zip.file('ppt/notesSlides/notesSlide2.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:notes xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">
  <p:cSld><p:spTree><p:sp><p:txBody><a:p><a:r><a:t>强调侧边栏与大纲自由拉伸的交互细节，提醒听众双击重置默认宽度。</a:t></a:r></a:p></p:txBody></p:sp></p:spTree></p:cSld>
</p:notes>`);

  return zip.generateAsync({ type: 'arraybuffer' });
}

export const DEMO_MARKDOWN_CONTENT = `# 🚀 智能本地文档阅读器指南

欢迎使用**简约风格**本地文档与大纲阅读器！本工具支持直接打开本机电脑文件夹，离线高效浏览 **Markdown、Office 文档、图片** 等各类文件，并自动提取多级文档大纲。

---

## 核心功能亮点

### 1. 本地文件夹全量浏览
* **安全高效**：完全基于浏览器端本地处理，文件隐私绝不上传任何服务器。
* **文件树导航**：快速展开/折叠目录，支持文件类型筛选与实时关键词检索。
* **平滑交互**：左右双侧栏自由展开折叠，沉浸式阅读模式。

### 2. Markdown 高清渲染与大纲提取
* 支持完整的 GFM (GitHub Flavored Markdown) 语法。
* **自动生成大纲 (TOC)**：右侧大纲栏自动提取 H1-H6 各级标题。
* **点击跳转**：在大纲中点击任意标题，正文自动平滑滚动至对应区域。

---

## 代码与数据表格展示

### 代码块示例
\`\`\`typescript
interface DocumentViewerProps {
  filePath: string;
  autoExtractOutline: boolean;
  theme: 'light' | 'dark' | 'sepia';
}

function renderOutline(nodes: OutlineItem[]) {
  return nodes.map(item => (
    <div key={item.id} style={{ paddingLeft: item.level * 12 }}>
      {item.text}
    </div>
  ));
}
\`\`\`

### 快捷快捷键与文件支持情况

| 文件类型 | 扩展名 | 核心特性支持 |
| :--- | :--- | :--- |
| **Markdown** | \`.md\`, \`.markdown\` | GFM语法、多级大纲、任务列表、代码高亮 |
| **Office Word** | \`.docx\` | 文本格式化、标题提取、表格渲染、大纲导航 |
| **Office Excel** | \`.xlsx\`, \`.xls\`, \`.csv\` | 工作表切换、单元格表格交互、网格检索 |
| **图片文件** | \`.png\`, \`.jpg\`, \`.svg\`, \`.webp\` | 旋转、缩放、网格背景、尺寸与文件属性查看 |
| **纯文本/代码** | \`.txt\`, \`.json\`, \`.js\`, \`.css\` | 行号显示、代码预览、词数统计 |

---

## 极简设计美学

> "Design is not just what it looks like and feels like. Design is how it works."
> — Steve Jobs

* **瑞士平面设计风格**：高对比度黑白灰调，配以暖暖的柔和背景，不分散注意力。
* **字号与行距**：严格采用黄金比例行高（1.6），长时间阅读眼睛不易疲劳。

---

## 使用技巧提示

1. **点击左上角【打开文件夹】**：选择您电脑中的项目或笔记目录。
2. **切换顶部筛选标签**：按 Markdown、Office、图片分类迅速筛选。
3. **右侧大纲栏**：长文档阅读时，使用大纲快速精确定位章节。

*祝您阅读愉快！*
`;

export const DEMO_PROJECT_NOTE = `# 项目研发与设计规范 standard.md

## 1. 视觉设计原则

### 1.1 简约与无干扰
保持界面的高密度与高可读性，避免无意义的装饰性元素。

### 1.2 颜色系统
* **主色调**：深邃纯灰 (\`#18181b\`) 与温润暖白 (\`#fafafa\`)
* **点缀色**：极简青蓝 (\`#2563eb\`) 与暖杏色

## 2. 交互与性能目标

### 2.1 极速加载
* 本地文件解析延迟控制在 50ms 以内。
* 不依赖网络接口，全功能离线可用。

### 2.2 大纲同步算法
滚动时实时识别当前视口中的最高权重标题，自动高亮右侧对应的大纲项。

## 3. 未来规划路线图

### 3.1 近期目标
- [x] 本地文件夹直接读取
- [x] Markdown 语法与自动大纲
- [x] Word & Excel 文件视图
- [x] 图片旋转缩放工具

### 3.2 远期规划
- [ ] 导出 PDF 与大纲打印
- [ ] 全文全文检索功能
`;

export const DEMO_CSV_CONTENT = `ID,文件名,分类,大小(KB),修改时间,状态
1,README.md,Markdown,12.4,2026-07-20,已发布
2,产品设计规范.docx,Office Word,145.2,2026-07-21,审核中
3,季度财务报表.xlsx,Office Excel,88.6,2026-07-22,已归档
4,系统架构图.png,图片,420.0,2026-07-23,已完成
5,产品说明书.pdf,PDF,210.5,2026-07-24,最新
6,app_config.json,代码/配置,2.1,2026-07-23,常用
`;

export const DEMO_PDF_DATA_URI = `data:application/pdf;base64,JVBERi0xLjQKMSAwIG9iago8PAovVHlwZSAvQ2F0YWxvZwovUGFnZXMgMiAwIFIKPj4KZW5kb2JqCjIgMCBvYmoKPDwKL1R5cGUgL1BhZ2VzCi9LaWRzIFszIDAgUl0KL0NvdW50IDEKPj4KZW5kb2JqCjMgMCBvYmoKPDwKL1R5cGUgL1BhZ2UKL1BhcmVudCAyIDAgUgovTWVkaWFCb3ggWzAgMCA2MTIgNzkyXQovUmVzb3VyY2VzIDw8Ci9Gb250IDw8Ci9GMSA0IDAgUgo+Pgo+PgovQ29udGVudHMgNSAwIFIKPj4KZW5kb2JqCjQgMCBvYmoKPDwKL1R5cGUgL0ZvbnQKL1N1YnR5cGUgL1R5cGUxCi9CYXNlRm9udCAvSGVsdmV0aWNhCj4+CmVuZG9iago1IDAgb2JqCjw8Ci9MZW5ndGggNzcKPj4Kc3RyZWFtCkJUCi9GMSAyNCBUZgoxMDAgNzAwIFRkCihQREYgRGVtb25zdHJhdGlvbiBEb2N1bWVudCkgVGoKRVQKZW5kc3RyZWFtCmVuZG9iagp0cmFpbGVyCjw8Ci9Sb290IDEgMCBSCj4+CiUlRU9G`;

export async function getDemoFolderTree(): Promise<FileNode> {
  const pptBuffer = await createDemoPptxBuffer();

  return {
    id: 'root-demo',
    name: '示例文档库 (Demo Folder)',
    path: '',
    kind: 'directory',
    isExpanded: true,
    children: [
      {
        id: 'file-readme',
        name: 'README.md',
        path: 'README.md',
        kind: 'file',
        category: 'markdown',
        extension: 'md',
        size: 2048,
        lastModified: Date.now() - 3600000,
        content: DEMO_MARKDOWN_CONTENT,
      },
      {
        id: 'dir-docs',
        name: '设计规范与文档',
        path: '设计规范与文档',
        kind: 'directory',
        isExpanded: true,
        children: [
          {
            id: 'file-project-note',
            name: '项目研发规范.md',
            path: '设计规范与文档/项目研发规范.md',
            kind: 'file',
            category: 'markdown',
            extension: 'md',
            size: 1536,
            lastModified: Date.now() - 7200000,
            content: DEMO_PROJECT_NOTE,
          },
          {
            id: 'file-ppt-demo',
            name: '2026年度产品规划与汇报.pptx',
            path: '设计规范与文档/2026年度产品规划与汇报.pptx',
            kind: 'file',
            category: 'ppt',
            extension: 'pptx',
            size: 12400,
            lastModified: Date.now() - 10800000,
            content: pptBuffer,
          },
          {
            id: 'file-csv-demo',
            name: '项目进度表.csv',
            path: '设计规范与文档/项目进度表.csv',
            kind: 'file',
            category: 'excel',
            extension: 'csv',
            size: 820,
            lastModified: Date.now() - 14400000,
            content: DEMO_CSV_CONTENT,
          },
          {
            id: 'file-pdf-demo',
            name: '产品设计与技术白皮书.pdf',
            path: '设计规范与文档/产品设计与技术白皮书.pdf',
            kind: 'file',
            category: 'pdf',
            extension: 'pdf',
            size: 215500,
            lastModified: Date.now() - 28800000,
            content: DEMO_PDF_DATA_URI,
          }
        ]
      },
      {
        id: 'dir-images',
        name: '示例图库',
        path: '示例图库',
        kind: 'directory',
        isExpanded: true,
        children: [
          {
            id: 'file-demo-img-1',
            name: 'Minimalist_Workspace.svg',
            path: '示例图库/Minimalist_Workspace.svg',
            kind: 'file',
            category: 'image',
            extension: 'svg',
            size: 3200,
            lastModified: Date.now() - 86400000,
            content: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" width="100%" height="100%">
  <rect width="800" height="500" fill="#f8fafc"/>
  <rect x="50" y="380" width="700" height="20" rx="4" fill="#cbd5e1"/>
  <rect x="120" y="240" width="220" height="140" rx="8" fill="#0f172a"/>
  <rect x="130" y="250" width="200" height="120" rx="4" fill="#38bdf8"/>
  <circle cx="230" cy="310" r="25" fill="#ffffff" opacity="0.9"/>
  <path d="M 230 295 L 245 310 L 230 325 M 220 310 L 245 310" stroke="#0f172a" stroke-width="4" stroke-linecap="round" fill="none"/>
  <rect x="420" y="280" width="160" height="100" rx="6" fill="#e2e8f0" stroke="#94a3b8" stroke-width="2"/>
  <line x1="440" y1="310" x2="550" y2="310" stroke="#64748b" stroke-width="3" stroke-linecap="round"/>
  <line x1="440" y1="330" x2="520" y2="330" stroke="#94a3b8" stroke-width="3" stroke-linecap="round"/>
  <line x1="440" y1="350" x2="500" y2="350" stroke="#94a3b8" stroke-width="3" stroke-linecap="round"/>
  <circle cx="680" cy="320" r="30" fill="#f1f5f9" stroke="#cbd5e1" stroke-width="3"/>
  <path d="M 670 300 C 670 340, 690 340, 690 300" fill="none" stroke="#0f172a" stroke-width="3"/>
  <text x="400" y="100" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="28" font-weight="600" fill="#0f172a" text-anchor="middle">Minimalist Document Reader Workspace</text>
  <text x="400" y="135" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="16" fill="#64748b" text-anchor="middle">Clean, Local &amp; Fast File Management</text>
</svg>`,
          }
        ]
      },
      {
        id: 'dir-media',
        name: '音视频媒体',
        path: '音视频媒体',
        kind: 'directory',
        isExpanded: true,
        children: [
          {
            id: 'file-demo-video-1',
            name: 'Sample_Blazes_Video.mp4',
            path: '音视频媒体/Sample_Blazes_Video.mp4',
            kind: 'file',
            category: 'video',
            extension: 'mp4',
            size: 15400000,
            lastModified: Date.now() - 43200000,
            content: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
          },
          {
            id: 'file-demo-audio-1',
            name: 'Acoustic_Soundtrack.mp3',
            path: '音视频媒体/Acoustic_Soundtrack.mp3',
            kind: 'file',
            category: 'audio',
            extension: 'mp3',
            size: 4200000,
            lastModified: Date.now() - 21600000,
            content: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
          }
        ]
      },
      {
        id: 'file-config-json',
        name: 'package.json',
        path: 'package.json',
        kind: 'file',
        category: 'json',
        extension: 'json',
        size: 512,
        lastModified: Date.now() - 360000,
        content: `{\n  "name": "local-folder-viewer",\n  "version": "1.0.0",\n  "description": "Minimalist Local Folder & Outline Reader",\n  "main": "src/main.tsx",\n  "private": true\n}`,
      }
    ]
  };
}
