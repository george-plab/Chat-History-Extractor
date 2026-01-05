# 📚 Platform-Specific Export Instructions

This guide provides detailed instructions on how to export your chat histories from each supported platform.

## 🦙 Ollama

### Method 1: Using Ollama CLI

Ollama stores conversations locally. To export them:

1. **Locate Ollama data directory**:
   - **Windows**: `%USERPROFILE%\.ollama`
   - **macOS**: `~/.ollama`
   - **Linux**: `~/.ollama`

2. **Export conversation**:
   ```bash
   # List available models and conversations
   ollama list
   
   # Export specific conversation (if supported by your Ollama version)
   ollama show <model-name> --history > ollama-chat.json
   ```

3. **Manual export** (if CLI doesn't support history export):
   - Check the `.ollama` directory for conversation files
   - Look for JSON files in the data folder
   - Copy the conversation JSON file

### Expected JSON Format:
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

---

## 💻 LM Studio

### Export from LM Studio:

1. **Open LM Studio**
2. **Navigate to Chat History**:
   - Click on the chat you want to export
   - Look for the "Export" or "Save" option in the menu
3. **Export as JSON**:
   - Select "Export as JSON" or similar option
   - Choose a location to save the file
   - Save with `.json` extension

### Alternative Method:

1. **Locate LM Studio data**:
   - **Windows**: `%APPDATA%\LM Studio\`
   - **macOS**: `~/Library/Application Support/LM Studio/`
   - **Linux**: `~/.config/lm-studio/`

2. **Find conversation files**:
   - Look in the `chats` or `conversations` folder
   - Copy the JSON file for the conversation you want

### Expected JSON Format:
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

---

## 🤖 ChatGPT (OpenAI)

### Official Export Method:

1. **Go to ChatGPT Settings**:
   - Click on your profile picture (bottom left)
   - Select "Settings"

2. **Navigate to Data Controls**:
   - Click on "Data controls" in the left sidebar
   - Find "Export data" section

3. **Request Export**:
   - Click "Export" button
   - Confirm your request
   - You'll receive an email when your data is ready (usually within 24 hours)

4. **Download and Extract**:
   - Click the link in the email
   - Download the ZIP file
   - Extract the ZIP file
   - Find `conversations.json` file

5. **Upload to App**:
   - Use the extracted `conversations.json` file
   - Or upload individual conversation JSON files

### Expected JSON Format:
```json
{
  "id": "conversation-id",
  "title": "Conversation Title",
  "create_time": 1704067200,
  "mapping": {
    "node-id": {
      "message": {
        "role": "user",
        "content": {
          "parts": ["Message content"]
        },
        "create_time": 1704067200
      }
    }
  }
}
```

### Alternative - Browser Extension:

You can use browser extensions like "ChatGPT Exporter" to export individual conversations:
1. Install the extension
2. Open a ChatGPT conversation
3. Click the export button
4. Save as JSON

---

## ✨ Gemini (Google AI Studio)

### Export from Google AI Studio:

1. **Access Google AI Studio**:
   - Go to [https://aistudio.google.com](https://aistudio.google.com)
   - Sign in with your Google account

2. **Navigate to Your Chats**:
   - Click on "My chats" or "History"
   - Select the conversation you want to export

3. **Export Options**:
   - Look for the "More options" menu (three dots)
   - Select "Export" or "Download"
   - Choose JSON format

### Alternative - Using Google Takeout:

1. **Go to Google Takeout**:
   - Visit [https://takeout.google.com](https://takeout.google.com)

2. **Select Gemini Data**:
   - Deselect all
   - Find and select "Gemini" or "Bard"
   - Click "Next step"

3. **Choose Export Settings**:
   - Select delivery method (email, Drive, etc.)
   - Choose file type and size
   - Click "Create export"

4. **Download and Extract**:
   - Wait for the export to complete
   - Download the archive
   - Extract and find conversation JSON files

### Expected JSON Format:
```json
{
  "id": "conversation-id",
  "name": "Conversation Title",
  "contents": [
    {
      "role": "user",
      "parts": [
        { "text": "Message content" }
      ]
    }
  ],
  "createTime": "2024-01-01T00:00:00Z"
}
```

---

## 🎭 Claude (Anthropic)

### Export from Claude:

1. **Access Claude**:
   - Go to [https://claude.ai](https://claude.ai)
   - Sign in to your account

2. **Navigate to Conversation**:
   - Open the conversation you want to export
   - Click on the conversation settings (gear icon or three dots)

3. **Export Conversation**:
   - Look for "Export" or "Download" option
   - Select JSON format
   - Save the file

### Alternative - Account Settings:

1. **Go to Settings**:
   - Click on your profile
   - Select "Settings" or "Account"

2. **Data Export**:
   - Look for "Data & Privacy" or "Export Data"
   - Request a full data export
   - Wait for email confirmation

3. **Download**:
   - Click the link in the email
   - Download the archive
   - Extract conversation JSON files

### Expected JSON Format:
```json
{
  "id": "conversation-id",
  "name": "Conversation Title",
  "messages": [
    {
      "role": "user",
      "content": "Message content",
      "timestamp": "2024-01-01T00:00:00Z"
    }
  ],
  "created_at": "2024-01-01T00:00:00Z"
}
```

---

## 🔧 Troubleshooting

### Common Issues:

1. **JSON Format Not Recognized**:
   - Make sure the file is valid JSON
   - Use a JSON validator: [jsonlint.com](https://jsonlint.com)
   - Check if the file matches the expected format for your platform

2. **File Too Large**:
   - Some platforms export all conversations in one file
   - You may need to split the file into individual conversations
   - Use a JSON editor to extract specific conversations

3. **Missing Timestamps**:
   - Some exports may not include timestamps
   - The app will still work, but dates won't be shown
   - Timestamps are optional in the app

4. **Different JSON Structure**:
   - Platform APIs may change over time
   - If your JSON doesn't match the expected format, please report it
   - The app tries to be flexible with different structures

### Need Help?

If you're having trouble exporting from a specific platform:
1. Check the platform's official documentation
2. Look for community guides and tutorials
3. Try using browser extensions or third-party tools
4. Contact the platform's support team

---

## 📝 Notes

- **Privacy**: All exports contain your conversation data. Handle them securely.
- **File Size**: Large conversation histories may take time to process.
- **Updates**: Platform export methods may change. Check official documentation for the latest instructions.
- **Formats**: This app supports the most common export formats. If your format differs, please let us know.

---

**Remember**: This app processes everything locally in your browser. Your data never leaves your device! 🔒
