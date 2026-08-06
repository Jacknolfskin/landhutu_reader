# 🚀 兰德糊涂's Reader · 智能本地文档阅读器

一款**简约风格**的本地文档与大纲阅读器。直接打开本机电脑文件夹，离线高效浏览 **Markdown、Office 文档、图片、PDF、音视频、CAD、3D 模型**等数十种文件格式，并自动提取多级文档大纲。

> 完全基于浏览器端本地处理，文件隐私绝不上传任何服务器。

🌐 **在线演示**：[https://reader.landhutu.cc/](https://reader.landhutu.cc/)

---

## ✨ 核心功能亮点

### 1. 本地文件夹全量浏览
- **安全高效**：纯浏览器端本地处理，隐私不出本机。
- **文件树导航**：快速展开 / 折叠目录，支持按 14 大分类筛选与实时关键词检索。
- **平滑交互**：左右双侧栏自由展开 / 折叠（带过渡动画），沉浸式阅读体验。

### 2. Markdown 高清渲染与大纲提取
- 支持完整的 GFM（GitHub Flavored Markdown）语法。
- **自动生成大纲（TOC）**：右侧大纲栏自动提取 H1–H6 各级标题。
- **点击跳转**：点击任意标题，正文自动平滑滚动至对应区域。

### 3. 多类别文件预览
- 覆盖 Office、PDF、图片、音视频、文本 / 代码、压缩包、邮件、绘图、CAD、3D 模型、GIS、字体设计源文件等 14 大类别。
- 顶部大分类标签一键筛选，快速定位目标文件类型。

---

## 📁 文件类型支持情况

| 分类 | 扩展名（示例） | 核心特性支持 |
| :--- | :--- | :--- |
| **Markdown** | `.md`, `.markdown`, `.mdx`, `.mermaid` | GFM 语法、多级大纲、任务列表、代码高亮 |
| **Office 文档** | `.docx`, `.xlsx`, `.pptx`, `.odt`, `.numbers` … | 文本/表格/演示渲染、标题提取、大纲导航 |
| **PDF** | `.pdf` | 文档浏览、页面导航 |
| **图片** | `.png`, `.jpg`, `.svg`, `.webp`, `.avif`, `.heic`, `.tif` … | 旋转、缩放、网格背景、尺寸与属性查看 |
| **视频** | `.mp4`, `.webm`, `.mov`, `.mkv`, `.avi`, `.m3u8` … | 本地播放、进度控制 |
| **音频** | `.mp3`, `.wav`, `.flac`, `.m4a`, `.midi`, `.opus` … | 本地播放、进度控制 |
| **文本 / 代码** | `.txt`, `.json`, `.js`, `.ts`, `.py`, `.go`, `.css`, `.yaml` … | 行号显示、语法高亮、词数统计 |
| **压缩包** | `.zip`, `.rar`, `.7z`, `.tar`, `.gz`, `.tgz`, `.xz` | 结构预览 |
| **邮件** | `.eml`, `.msg`, `.mbox` | 邮件内容查看 |
| **绘图** | `.drawio`, `.dio`, `.excalidraw`, `.tldraw` | 图形化预览 |
| **CAD** | `.dxf`, `.dwg`, `.step`, `.iges`, `.skp`, `.sldprt`, `.gds` … | 工程图纸预览 |
| **3D 模型** | `.gltf`, `.glb`, `.obj`, `.stl`, `.fbx`, `.ply`, `.usdz` … | 模型预览 |
| **GIS** | `.geojson`, `.topojson`, `.kml`, `.kmz`, `.gpx`, `.shp` | 地理数据预览 |
| **其他资源** | `.ttf`, `.otf`, `.psd`, `.ai`, `.sqlite`, `.wasm`, `.parquet` … | 字体 / 设计源 / 数据库等预览 |

> 以上为当前版本支持的格式集，实际以应用内标题栏的分类标签为准。

---

## 🎨 极简设计美学

> "Design is not just what it looks like and feels like. Design is how it works." — Steve Jobs

- **瑞士平面设计风格**：高对比度黑白灰调，柔和背景，不分散注意力。
- **舒适阅读**：严格采用黄金比例行高（1.6），长时间阅读不易疲劳。

---

## 💡 使用技巧

1. **点击左上角【打开文件夹】**：选择你电脑中的项目或笔记目录。
2. **切换顶部筛选标签**：按 Markdown、Office、图片等大分类迅速筛选文件。
3. **右侧大纲栏**：长文档阅读时，使用大纲快速精确定位章节。

*祝你阅读愉快！*

---

## 🛠 Run Locally

**Prerequisites:** Node.js

```bash
# 1. 安装依赖
npm install

# 2. （可选）在 .env.local 中配置 GEMINI_API_KEY
#    GEMINI_API_KEY=your_api_key

# 3. 启动开发服务器
npm run dev
```
