# 🚀 Landhutu's Reader · A Smart Local Document Reader

A **minimalist** local document and outline reader. Open folders directly from your computer and browse **Markdown, Office documents, images, PDFs, audio/video, CAD, 3D models** and dozens of other file formats — entirely offline — with automatic multi-level outline extraction.

> Runs completely in your browser locally. Your files never leave your machine and are never uploaded to any server.

🌐 **Live Demo**: [https://reader.landhutu.cc/](https://reader.landhutu.cc/)

---

## ✨ Key Features

### 1. Full Local Folder Browsing
- **Secure & Efficient**: Pure browser-side local processing; your privacy stays on your device.
- **File Tree Navigation**: Quickly expand / collapse directories, with filtering by 14 major categories and real-time keyword search.
- **Smooth Interaction**: Left and right side panels freely expand / collapse (with transition animations) for an immersive reading experience.

### 2. Markdown Rendering & Outline Extraction
- Full support for GFM (GitHub Flavored Markdown) syntax.
- **Auto-generated Outline (TOC)**: The right-side outline panel automatically extracts headings from H1 to H6.
- **Click to Jump**: Click any heading and the content smoothly scrolls to the corresponding section.

### 3. Multi-category File Preview
- Covers 14 major categories: Office, PDF, images, audio/video, text/code, archives, email, drawings, CAD, 3D models, GIS, fonts & design sources, and more.
- One-click filtering via the top category tabs to quickly locate target file types.

---

## 📁 Supported File Types

| Category | Extensions (examples) | Core Features |
| :--- | :--- | :--- |
| **Markdown** | `.md`, `.markdown`, `.mdx`, `.mermaid` | GFM syntax, multi-level outline, task lists, code highlighting |
| **Office Docs** | `.docx`, `.xlsx`, `.pptx`, `.odt`, `.numbers` … | Text/spreadsheet/presentation rendering, heading extraction, outline navigation |
| **PDF** | `.pdf` | Document viewing, page navigation |
| **Images** | `.png`, `.jpg`, `.svg`, `.webp`, `.avif`, `.heic`, `.tif` … | Rotate, zoom, grid background, size & property inspection |
| **Video** | `.mp4`, `.webm`, `.mov`, `.mkv`, `.avi`, `.m3u8` … | Local playback, seek control |
| **Audio** | `.mp3`, `.wav`, `.flac`, `.m4a`, `.midi`, `.opus` … | Local playback, seek control |
| **Text / Code** | `.txt`, `.json`, `.js`, `.ts`, `.py`, `.go`, `.css`, `.yaml` … | Line numbers, syntax highlighting, word count |
| **Archives** | `.zip`, `.rar`, `.7z`, `.tar`, `.gz`, `.tgz`, `.xz` | Structure preview |
| **Email** | `.eml`, `.msg`, `.mbox` | Email content viewing |
| **Drawings** | `.drawio`, `.dio`, `.excalidraw`, `.tldraw` | Graphical preview |
| **CAD** | `.dxf`, `.dwg`, `.step`, `.iges`, `.skp`, `.sldprt`, `.gds` … | Engineering drawing preview |
| **3D Models** | `.gltf`, `.glb`, `.obj`, `.stl`, `.fbx`, `.ply`, `.usdz` … | Model preview |
| **GIS** | `.geojson`, `.topojson`, `.kml`, `.kmz`, `.gpx`, `.shp` | Geographic data preview |
| **Other Assets** | `.ttf`, `.otf`, `.psd`, `.ai`, `.sqlite`, `.wasm`, `.parquet` … | Fonts / design sources / databases preview |

> The list above reflects the formats supported in the current version. Please refer to the category tabs in the app's header for the authoritative set.

---

## 🎨 Minimalist Design

> "Design is not just what it looks like and feels like. Design is how it works." — Steve Jobs

- **Swiss Graphic Design Style**: High-contrast black/white/gray tones with a soft background that keeps you focused.
- **Comfortable Reading**: Strict golden-ratio line height (1.6) to reduce eye strain during long reading sessions.

---

## 💡 Usage Tips

1. **Click "Open Folder" (top-left)**: Select a project or notes directory on your computer.
2. **Switch the top filter tabs**: Quickly filter files by major categories such as Markdown, Office, Images, etc.
3. **Right-side outline panel**: When reading long documents, use the outline to quickly locate chapters.

*Happy reading!*

---

## 🛠 Run Locally

**Prerequisites:** Node.js

```bash
# 1. Install dependencies
npm install

# 2. (Optional) Set GEMINI_API_KEY in .env.local
#    GEMINI_API_KEY=your_api_key

# 3. Start the dev server
npm run dev
```
