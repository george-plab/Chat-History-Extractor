# 🔍 Chat History Extractor

A privacy-first web application to extract and export chat histories from various LLM platforms. **100% client-side processing** ensures your data never leaves your browser.

![Privacy First](https://img.shields.io/badge/Privacy-First-success)
![Client Side](https://img.shields.io/badge/Processing-Client%20Side-blue)
![No Server](https://img.shields.io/badge/Server-None-green)

## ✨ Features

- **🔒 Complete Privacy**: All processing happens in your browser - no data is sent to any server
- **🌐 Multi-Platform Support**:
  - **Local LLMs**: Ollama, LM Studio
  - **Online LLMs**: ChatGPT, Gemini (Google AI Studio), Claude (Anthropic)
- **📤 Multiple Export Formats**:
  - Markdown (.md) - Perfect for documentation and version control
  - PDF (.pdf) - Professional, formatted documents with styling
- **🎨 Modern UI**: Beautiful glassmorphism design with smooth animations
- **📊 Statistics Dashboard**: View conversation counts and message statistics
- **👁️ Live Preview**: Preview your conversations before exporting

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Clone or download this repository
2. Install dependencies:

```bash
npm install
```

3. Start the development server:

```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173`

## 📖 How to Use

### For Local LLMs (Ollama, LM Studio)

1. **Select Source Type**: Choose "Local Files"
2. **Select Platform**: Choose either Ollama or LM Studio
3. **Upload JSON**: Click to upload your chat history JSON file
4. **Export**: Choose Markdown or PDF format

#### Exporting from Ollama

Ollama stores conversations in a specific format. Export your chat history to JSON and upload it to this app.

#### Exporting from LM Studio

LM Studio allows you to export conversations. Save them as JSON and upload here.

### For Online LLMs (ChatGPT, Gemini, Claude)

1. **Select Source Type**: Choose "Online URL"
2. **Select Platform**: Choose ChatGPT, Gemini, or Claude
3. **Enter URL or Upload**: 
   - Enter a URL to a JSON file containing your chat history
   - Or download your chat history from the platform and upload the JSON file
4. **Export**: Choose Markdown or PDF format

#### Exporting from ChatGPT

1. Go to ChatGPT Settings → Data Controls → Export Data
2. Download your data
3. Extract the conversations.json file
4. Upload to this app

#### Exporting from Gemini (Google AI Studio)

1. Access your Google AI Studio
2. Export your conversation history
3. Upload the JSON file to this app

#### Exporting from Claude (Anthropic)

1. Access your Claude account settings
2. Export your conversation history
3. Upload the JSON file to this app

## 🛡️ Privacy & Security

This application is designed with privacy as the top priority:

- ✅ **No Server Processing**: Everything runs in your browser
- ✅ **No Data Collection**: We don't collect, store, or transmit any data
- ✅ **No Analytics**: No tracking, no cookies, no analytics
- ✅ **Open Source**: You can inspect the code yourself
- ✅ **Offline Capable**: Once loaded, works without internet (for local files)

## 🏗️ Technical Stack

- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **PDF Generation**: jsPDF
- **Styling**: Custom CSS with glassmorphism effects
- **Processing**: 100% client-side JavaScript

## 📁 Project Structure

```
├── src/
│   ├── App.tsx           # Main application component
│   ├── App.css           # Application-specific styles
│   ├── index.css         # Global styles and design system
│   ├── types.ts          # TypeScript type definitions
│   ├── parsers.ts        # Platform-specific JSON parsers
│   ├── exporters.ts      # Markdown and PDF export functions
│   └── main.tsx          # Application entry point
├── public/               # Static assets
├── index.html            # HTML template
└── package.json          # Dependencies and scripts
```

## 🎨 Supported JSON Formats

The app intelligently parses various JSON formats from different platforms:

### Ollama Format
```json
{
  "id": "conversation-id",
  "name": "Conversation Title",
  "messages": [
    {
      "role": "user",
      "content": "Message content",
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### LM Studio Format
```json
{
  "id": "conversation-id",
  "title": "Conversation Title",
  "messages": [
    {
      "role": "user",
      "content": "Message content",
      "timestamp": 1704067200000
    }
  ]
}
```

### ChatGPT Format
```json
{
  "id": "conversation-id",
  "title": "Conversation Title",
  "mapping": {
    "node-id": {
      "message": {
        "role": "user",
        "content": {
          "parts": ["Message content"]
        }
      }
    }
  }
}
```

## 🔧 Development

### Build for Production

```bash
npm run build
```

The production-ready files will be in the `dist/` directory.

### Preview Production Build

```bash
npm run preview
```

## 🤝 Contributing

Contributions are welcome! Feel free to:

- Report bugs
- Suggest new features
- Submit pull requests
- Improve documentation

## 📝 License

This project is open source and available under the MIT License.

## ⚠️ Disclaimer

This tool is designed to help you manage your own chat histories. Always ensure you have the right to export and process the data you're working with. Respect the terms of service of the platforms you're exporting from.

## 🙏 Acknowledgments

- Built with React and Vite
- PDF generation powered by jsPDF
- Icons from Unicode emoji
- Design inspired by modern glassmorphism trends

## 📞 Support

If you encounter any issues or have questions:

1. Check the documentation above
2. Review the code - it's all client-side and readable
3. Open an issue on the repository

---

**Remember**: Your data stays in your browser. Always. 🔒
