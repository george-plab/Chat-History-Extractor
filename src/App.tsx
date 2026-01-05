import { useState } from 'react';
import type { Conversation, Platform } from './types';
import { parseConversations } from './parsers';
import { downloadMarkdown, exportToPDF } from './exporters';
import { detectPlatform, getPlatformName } from './platformDetector';
import './App.css';

function App() {
  const [platform, setPlatform] = useState<Platform>('ollama');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showHeaders, setShowHeaders] = useState(true);
  const [expandedPreview, setExpandedPreview] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [detectedPlatform, setDetectedPlatform] = useState<Platform | null>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);
    setSuccess(null);
    setDetectedPlatform(null);

    try {
      console.log('Reading file:', file.name);
      const text = await file.text();
      console.log('File content length:', text.length);

      const data = JSON.parse(text);
      console.log('Parsed JSON successfully');
      console.log('Data structure:', Object.keys(data));

      // Auto-detect platform
      const detected = detectPlatform(data);
      console.log('Detected platform:', detected);
      console.log('Selected platform:', platform);

      // Check if detected platform matches selected platform
      if (detected && detected !== platform) {
        setDetectedPlatform(detected);
        setError(
          `⚠️ Este JSON parece ser de ${getPlatformName(detected)}, pero seleccionaste ${getPlatformName(platform)}. ` +
          `Haz clic en "${getPlatformName(detected)}" arriba o continúa con ${getPlatformName(platform)}.`
        );
      }

      const parsed = parseConversations(data, detected || platform);
      console.log('Parsed conversations:', parsed.length);

      setConversations(parsed);
      setSuccess(`✅ Cargadas ${parsed.length} conversación(es) de ${getPlatformName(detected || platform)}`);
    } catch (err) {
      console.error('Error processing file:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to parse JSON file';
      setError(`❌ Error: ${errorMessage}`);
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
    setDetectedPlatform(null);

    try {
      console.log('Reading dropped file:', file.name);
      const text = await file.text();
      console.log('File content length:', text.length);

      const data = JSON.parse(text);
      console.log('Parsed JSON successfully');
      console.log('Data structure:', Object.keys(data));

      // Auto-detect platform
      const detected = detectPlatform(data);
      console.log('Detected platform:', detected);

      if (detected && detected !== platform) {
        setDetectedPlatform(detected);
        setError(
          `⚠️ Este JSON parece ser de ${getPlatformName(detected)}, pero seleccionaste ${getPlatformName(platform)}. ` +
          `Haz clic en "${getPlatformName(detected)}" arriba o continúa con ${getPlatformName(platform)}.`
        );
      }

      const parsed = parseConversations(data, detected || platform);
      console.log('Parsed conversations:', parsed.length);

      setConversations(parsed);
      setSuccess(`✅ Cargadas ${parsed.length} conversación(es) de ${getPlatformName(detected || platform)}`);
    } catch (err) {
      console.error('Error processing file:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to parse JSON file';
      setError(`❌ Error: ${errorMessage}`);
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
          {/* Header with Help Button */}
          <div className="glass-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2>1. Cargar Chat History</h2>
                <p className="mt-2">
                  Sube tu archivo JSON exportado desde cualquier plataforma LLM
                </p>
              </div>
              <button
                className="btn btn-info"
                onClick={() => setShowHelpModal(true)}
                style={{ minWidth: '200px' }}
              >
                📖 ¿Cómo exportar?
              </button>
            </div>
          </div>

          {/* Platform Selection */}
          <div className="glass-card">
            <h2>2. Selecciona tu Plataforma</h2>
            <div className="platform-grid">
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
            </div>
          </div>

          {/* Input Section */}
          <div className="glass-card">
            <h2>3. Cargar Archivo JSON</h2>
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
                    <span>Procesando...</span>
                  </>
                ) : (
                  <>
                    <span className="upload-icon">📤</span>
                    <span>Haz clic o arrastra tu archivo JSON aquí</span>
                  </>
                )}
              </label>
            </div>
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

        {/* Help Modal */}
        {showHelpModal && (
          <div className="modal-overlay" onClick={() => setShowHelpModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>📖 Cómo Exportar tu Chat History</h2>
                <button className="modal-close" onClick={() => setShowHelpModal(false)}>
                  ✕
                </button>
              </div>
              <div className="modal-body">
                <div className="help-section">
                  <h3>🦙 Ollama</h3>
                  <p>Exporta desde la interfaz web o usa el comando CLI para obtener el JSON de tu conversación.</p>
                </div>

                <div className="help-section">
                  <h3>💻 LM Studio</h3>
                  <ol>
                    <li>Abre LM Studio</li>
                    <li>Ve a la pestaña "Chat"</li>
                    <li>Haz clic en el menú de la conversación (⋮)</li>
                    <li>Selecciona "Export conversation"</li>
                    <li>Guarda el archivo .json</li>
                  </ol>
                </div>

                <div className="help-section">
                  <h3>🤖 ChatGPT</h3>
                  <ol>
                    <li>Ve a <a href="https://chatgpt.com" target="_blank" rel="noopener noreferrer">chatgpt.com</a></li>
                    <li>Haz clic en tu perfil (esquina superior derecha)</li>
                    <li>Selecciona "Settings" → "Data controls"</li>
                    <li>Haz clic en "Export data"</li>
                    <li>Espera el email con tu archivo ZIP</li>
                    <li>Extrae el archivo conversations.json</li>
                  </ol>
                </div>

                <div className="help-section">
                  <h3>✨ Gemini (Google AI Studio)</h3>
                  <ol>
                    <li>Ve a <a href="https://aistudio.google.com" target="_blank" rel="noopener noreferrer">aistudio.google.com</a></li>
                    <li>Abre tu conversación</li>
                    <li>Haz clic en "Get code" o "Export"</li>
                    <li>Copia el JSON de la conversación</li>
                    <li>Guárdalo como archivo .json</li>
                  </ol>
                </div>

                <div className="help-section">
                  <h3>🎭 Claude</h3>
                  <ol>
                    <li>Ve a <a href="https://claude.ai" target="_blank" rel="noopener noreferrer">claude.ai</a></li>
                    <li>Abre la conversación que quieres exportar</li>
                    <li>Haz clic en el menú (⋮) de la conversación</li>
                    <li>Selecciona "Export conversation"</li>
                    <li>Descarga el archivo JSON</li>
                  </ol>
                </div>

                <div className="help-note">
                  <p><strong>💡 Nota:</strong> Todos los archivos se procesan localmente en tu navegador. Tu información nunca sale de tu dispositivo.</p>
                </div>
              </div>
            </div>
          </div>
        )}

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
