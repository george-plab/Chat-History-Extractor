import { useState } from 'react';
import type { Conversation, Platform, SourceType } from './types';
import { parseConversations } from './parsers';
import { downloadMarkdown, exportToPDF } from './exporters';
import './App.css';

function App() {
  const [sourceType, setSourceType] = useState<SourceType>('local');
  const [platform, setPlatform] = useState<Platform>('ollama');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [urlInput, setUrlInput] = useState('');
  const [showHeaders, setShowHeaders] = useState(true);
  const [expandedPreview, setExpandedPreview] = useState(false);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      console.log('Reading file:', file.name);
      const text = await file.text();
      console.log('File content length:', text.length);

      const data = JSON.parse(text);
      console.log('Parsed JSON successfully');
      console.log('Data structure:', Object.keys(data));

      const parsed = parseConversations(data, platform);
      console.log('Parsed conversations:', parsed.length);

      setConversations(parsed);
      setSuccess(`Successfully loaded ${parsed.length} conversation(s) from ${platform.toUpperCase()}`);
    } catch (err) {
      console.error('Error processing file:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to parse JSON file';
      setError(`Error: ${errorMessage}`);
      setConversations([]);
    } finally {
      setLoading(false);
      // Reset file input
      event.target.value = '';
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const handleDrop = async (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    event.stopPropagation();

    const file = event.dataTransfer.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.json')) {
      setError('Please drop a JSON file');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      console.log('Reading dropped file:', file.name);
      const text = await file.text();
      console.log('File content length:', text.length);

      const data = JSON.parse(text);
      console.log('Parsed JSON successfully');
      console.log('Data structure:', Object.keys(data));

      const parsed = parseConversations(data, platform);
      console.log('Parsed conversations:', parsed.length);

      setConversations(parsed);
      setSuccess(`Successfully loaded ${parsed.length} conversation(s) from ${platform.toUpperCase()}`);
    } catch (err) {
      console.error('Error processing file:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to parse JSON file';
      setError(`Error: ${errorMessage}`);
      setConversations([]);
    } finally {
      setLoading(false);
    }
  };

  const handleUrlFetch = async () => {
    if (!urlInput.trim()) {
      setError('Please enter a valid URL');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(urlInput);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      const parsed = parseConversations(data, platform);
      setConversations(parsed);
      setSuccess(`Successfully loaded ${parsed.length} conversation(s) from ${platform.toUpperCase()}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch or parse data from URL');
      setConversations([]);
    } finally {
      setLoading(false);
    }
  };

  const handleExportMarkdown = () => {
    if (conversations.length === 0) {
      setError('No conversations to export');
      return;
    }
    downloadMarkdown(conversations, showHeaders, `${platform}-chat-history.md`);
    setSuccess('Markdown file downloaded successfully!');
  };

  const handleExportPDF = () => {
    if (conversations.length === 0) {
      setError('No conversations to export');
      return;
    }
    exportToPDF(conversations, showHeaders, `${platform}-chat-history.pdf`);
    setSuccess('PDF file downloaded successfully!');
  };

  const getTotalMessages = () => {
    return conversations.reduce((total, conv) => total + conv.messages.length, 0);
  };

  return (
    <div className="app">
      <div className="container">
        {/* Header */}
        <header className="header">
          <h1>🔍 Chat History Extractor</h1>
          <p className="subtitle">
            Extract and export your LLM chat histories - 100% client-side processing
          </p>
          <div className="privacy-badge">
            <span className="badge badge-success">🔒 Privacy First</span>
            <span className="badge">⚡ No Server Processing</span>
            <span className="badge">💾 Local Only</span>
          </div>
        </header>

        {/* Main Content */}
        <div className="main-content">
          {/* Source Type Selection */}
          <div className="glass-card">
            <h2>1. Select Source Type</h2>
            <div className="tabs">
              <button
                className={`tab ${sourceType === 'local' ? 'active' : ''}`}
                onClick={() => setSourceType('local')}
              >
                📁 Local Files
              </button>
              <button
                className={`tab ${sourceType === 'online' ? 'active' : ''}`}
                onClick={() => setSourceType('online')}
              >
                🌐 Online URL
              </button>
            </div>
            <p className="mt-2">
              {sourceType === 'local'
                ? 'Upload JSON files from Ollama or LM Studio'
                : 'Fetch chat history from ChatGPT, Gemini, or Claude via URL'}
            </p>
          </div>

          {/* Platform Selection */}
          <div className="glass-card">
            <h2>2. Select Platform</h2>
            <div className="platform-grid">
              {sourceType === 'local' ? (
                <>
                  <button
                    className={`platform-btn ${platform === 'ollama' ? 'active' : ''}`}
                    onClick={() => setPlatform('ollama')}
                  >
                    <span className="platform-icon">🦙</span>
                    <span className="platform-name">Ollama</span>
                  </button>
                  <button
                    className={`platform-btn ${platform === 'lmstudio' ? 'active' : ''}`}
                    onClick={() => setPlatform('lmstudio')}
                  >
                    <span className="platform-icon">💻</span>
                    <span className="platform-name">LM Studio</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    className={`platform-btn ${platform === 'chatgpt' ? 'active' : ''}`}
                    onClick={() => setPlatform('chatgpt')}
                  >
                    <span className="platform-icon">🤖</span>
                    <span className="platform-name">ChatGPT</span>
                  </button>
                  <button
                    className={`platform-btn ${platform === 'gemini' ? 'active' : ''}`}
                    onClick={() => setPlatform('gemini')}
                  >
                    <span className="platform-icon">✨</span>
                    <span className="platform-name">Gemini</span>
                  </button>
                  <button
                    className={`platform-btn ${platform === 'claude' ? 'active' : ''}`}
                    onClick={() => setPlatform('claude')}
                  >
                    <span className="platform-icon">🎭</span>
                    <span className="platform-name">Claude</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Input Section */}
          <div className="glass-card">
            <h2>3. Load Chat History</h2>
            {sourceType === 'local' ? (
              <div className="file-upload">
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileUpload}
                  className="file-upload-input"
                  id="file-input"
                  disabled={loading}
                />
                <label
                  htmlFor="file-input"
                  className={`file-upload-label ${loading ? 'disabled' : ''}`}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                >
                  {loading ? (
                    <>
                      <div className="spinner"></div>
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <span className="upload-icon">📤</span>
                      <span>Click to upload or drag & drop JSON file</span>
                    </>
                  )}
                </label>
              </div>
            ) : (
              <div className="url-input-section">
                <div className="input-group">
                  <label className="input-label">Enter JSON URL</label>
                  <input
                    type="url"
                    className="input-field"
                    placeholder="https://example.com/chat-history.json"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    disabled={loading}
                  />
                </div>
                <button
                  className="btn btn-primary w-full"
                  onClick={handleUrlFetch}
                  disabled={loading || !urlInput.trim()}
                >
                  {loading ? (
                    <>
                      <div className="spinner"></div>
                      <span>Fetching...</span>
                    </>
                  ) : (
                    'Fetch Chat History'
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Alerts */}
          {error && (
            <div className="alert alert-error">
              <strong>Error:</strong> {error}
            </div>
          )}
          {success && (
            <div className="alert alert-success">
              <strong>Success:</strong> {success}
            </div>
          )}

          {/* Results */}
          {conversations.length > 0 && (
            <>
              <div className="glass-card">
                <h2>📊 Statistics</h2>
                <div className="stats-grid">
                  <div className="stat-item">
                    <div className="stat-value">{conversations.length}</div>
                    <div className="stat-label">Conversations</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-value">{getTotalMessages()}</div>
                    <div className="stat-label">Total Messages</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-value">{platform.toUpperCase()}</div>
                    <div className="stat-label">Platform</div>
                  </div>
                </div>
              </div>

              <div className="glass-card">
                <h2>4. Export Chat History</h2>
                <p className="mb-3">Choose your preferred export format</p>

                {/* Toggle for headers */}
                <div className="input-group">
                  <label className="toggle-container">
                    <input
                      type="checkbox"
                      checked={showHeaders}
                      onChange={(e) => setShowHeaders(e.target.checked)}
                      className="toggle-input"
                    />
                    <span className="toggle-label">
                      {showHeaders ? 'Mostrar encabezados de Usuario/Asistente' : 'Solo contenido (sin encabezados)'}
                    </span>
                  </label>
                </div>

                <div className="export-buttons">
                  <button
                    className="btn btn-primary"
                    onClick={handleExportMarkdown}
                  >
                    📝 Export as Markdown
                  </button>
                  <button
                    className="btn btn-secondary"
                    onClick={handleExportPDF}
                  >
                    📄 Export as PDF
                  </button>
                </div>
              </div>

              {/* Preview */}
              <div className="glass-card">
                <h2>👁️ Preview</h2>
                <div className="preview-section">
                  {(expandedPreview ? conversations : conversations.slice(0, 2)).map((conv) => (
                    <div key={conv.id} className="conversation-preview">
                      <h3>{conv.title}</h3>
                      <div className="conversation-meta">
                        <span className="badge">{conv.messages.length} messages</span>
                        {conv.timestamp && (
                          <span className="timestamp">
                            {new Date(conv.timestamp).toLocaleString()}
                          </span>
                        )}
                      </div>
                      <div className="messages-preview">
                        {(expandedPreview ? conv.messages : conv.messages.slice(0, 3)).map((msg, msgIdx) => (
                          <div
                            key={msgIdx}
                            className={`message-preview ${msg.role}`}
                          >
                            {showHeaders && (
                              <div className="message-role">
                                {msg.role === 'user' ? 'Usuario' : 'Asistente'}
                              </div>
                            )}
                            <div className="message-content">
                              {msg.content ? msg.content.substring(0, 200) : '(No content)'}
                              {msg.content && msg.content.length > 200 ? '...' : ''}
                            </div>
                          </div>
                        ))}
                        {!expandedPreview && conv.messages.length > 3 && (
                          <div className="more-messages">
                            +{conv.messages.length - 3} more messages
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {!expandedPreview && conversations.length > 2 && (
                    <div className="more-conversations">
                      +{conversations.length - 2} more conversations
                    </div>
                  )}

                  {/* Expand button */}
                  {conversations.length > 0 && (
                    <div className="preview-actions">
                      <button
                        className="btn btn-success"
                        onClick={() => setExpandedPreview(!expandedPreview)}
                      >
                        {expandedPreview ? '📦 Mostrar menos' : '📂 Cargar todo el contenido'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <footer className="footer">
          <p>
            🔒 All processing happens in your browser. No data is sent to any server.
          </p>
          <p className="footer-note">
            Your privacy is guaranteed - this app runs 100% client-side
          </p>
        </footer>
      </div>
    </div>
  );
}

export default App;
