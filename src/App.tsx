import { useState, useEffect } from 'react';
import type { Conversation, Platform, SourceType } from '../server/types';
import { processFile, processUrl, exportMarkdown, checkServerHealth, downloadFile } from './api';
import { exportToPDF } from './exporters';
import './App.css';

function App() {
  const [platform, setPlatform] = useState<Platform>('chatgpt');
  const [sourceType, setSourceType] = useState<SourceType>('file');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showHeaders, setShowHeaders] = useState(true);
  const [expandedPreview, setExpandedPreview] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [serverOnline, setServerOnline] = useState<boolean | null>(null);
  const [showPrivacyWarning, setShowPrivacyWarning] = useState(false);

  // Check server health on mount
  useEffect(() => {
    const checkServer = async () => {
      const online = await checkServerHealth();
      setServerOnline(online);
      if (!online) {
        setError('⚠️ El servidor backend no está disponible. Por favor, inicia el servidor con: npm run dev:server');
      }
    };
    checkServer();

    // Check periodically
    const interval = setInterval(checkServer, 30000);
    return () => clearInterval(interval);
  }, []);

  // Show privacy warning when switching to URL mode
  useEffect(() => {
    if (sourceType === 'url') {
      setShowPrivacyWarning(true);
    }
  }, [sourceType]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const text = await file.text();
      const result = await processFile(text, platform);

      if (!result.success) {
        setError(`❌ Error: ${result.error}`);
        setConversations([]);
      } else {
        if (result.warning) {
          setError(`⚠️ ${result.warning}`);
        }
        setConversations(result.conversations || []);
        const convCount = result.conversations?.length || 0;
        const platformName = result.detectedPlatform || platform;
        setSuccess(`✅ Cargadas ${convCount} conversación(es) de ${platformName.toUpperCase()}`);
      }
    } catch (err) {
      console.error('Error processing file:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to process file';
      setError(`❌ Error: ${errorMessage}`);
      setConversations([]);
    } finally {
      setLoading(false);
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
      const text = await file.text();
      const result = await processFile(text, platform);

      if (!result.success) {
        setError(`❌ Error: ${result.error}`);
        setConversations([]);
      } else {
        if (result.warning) {
          setError(`⚠️ ${result.warning}`);
        }
        setConversations(result.conversations || []);
        const convCount = result.conversations?.length || 0;
        const platformName = result.detectedPlatform || platform;
        setSuccess(`✅ Cargadas ${convCount} conversación(es) de ${platformName.toUpperCase()}`);
      }
    } catch (err) {
      console.error('Error processing file:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to process file';
      setError(`❌ Error: ${errorMessage}`);
      setConversations([]);
    } finally {
      setLoading(false);
    }
  };

  const handleUrlSubmit = async () => {
    if (!urlInput.trim()) {
      setError('Por favor, ingresa una URL');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await processUrl(urlInput.trim());

      if (!result.success) {
        setError(`❌ Error: ${result.error}`);
        setConversations([]);
      } else {
        setConversations(result.conversations || []);
        const convCount = result.conversations?.length || 0;
        const msgCount = result.conversations?.reduce((t, c) => t + c.messages.length, 0) || 0;
        const platformName = result.detectedPlatform || 'unknown';
        setSuccess(`✅ Extraídas ${convCount} conversación(es) con ${msgCount} mensajes de ${platformName.toUpperCase()}`);
        if (result.detectedPlatform) {
          setPlatform(result.detectedPlatform);
        }
      }
    } catch (err) {
      console.error('Error processing URL:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to process URL';
      setError(`❌ Error: ${errorMessage}`);
      setConversations([]);
    } finally {
      setLoading(false);
    }
  };

  const handleExportMarkdown = async () => {
    if (conversations.length === 0) {
      setError('No conversations to export');
      return;
    }

    setLoading(true);
    try {
      const result = await exportMarkdown(conversations, showHeaders, `${platform}-chat-history.md`);
      if (result.success && result.content) {
        downloadFile(result.content, result.filename, result.mimeType);
        setSuccess('✅ Archivo Markdown descargado correctamente');
      } else {
        setError(`❌ Error: ${result.error}`);
      }
    } catch (err) {
      setError(`❌ Error: ${err instanceof Error ? err.message : 'Export failed'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = () => {
    if (conversations.length === 0) {
      setError('No conversations to export');
      return;
    }
    exportToPDF(conversations, showHeaders, `${platform}-chat-history.pdf`);
    setSuccess('✅ Archivo PDF descargado correctamente');
  };

  const getTotalMessages = () => {
    return conversations.reduce((total, conv) => total + conv.messages.length, 0);
  };

  const getPlatformName = (p: Platform): string => {
    const names: Record<Platform, string> = {
      ollama: 'Ollama',
      lmstudio: 'LM Studio',
      chatgpt: 'ChatGPT',
      gemini: 'Gemini',
      claude: 'Claude',
    };
    return names[p] || p;
  };

  return (
    <div className="app">
      <div className="container">
        {/* Header */}
        <header className="header">
          <h1>🔍 Chat History Extractor</h1>
          <p className="subtitle">
            Extract and export your LLM chat histories
          </p>
          <div className="privacy-badge">
            <span className={`badge ${serverOnline ? 'badge-success' : 'badge-warning'}`}>
              {serverOnline ? '🟢 Server Online' : '🔴 Server Offline'}
            </span>
            <span className="badge">🔒 No Data Stored</span>
            <span className="badge">⚡ In-Memory Processing</span>
          </div>
        </header>

        {/* Privacy Warning Banner - Only for URL mode */}
        {showPrivacyWarning && sourceType === 'url' && (
          <div className="privacy-warning-banner">
            <div className="privacy-warning-content">
              <h3>⚠️ Aviso de Privacidad y Seguridad</h3>
              <ul>
                <li>🔒 <strong>No almacenamos ningún dato</strong> - Todo el procesamiento es temporal y en memoria.</li>
                <li>🗑️ <strong>Los datos se eliminan inmediatamente</strong> después de procesarlos.</li>
                <li>⚡ <strong>Procesamiento efímero</strong> - No guardamos logs ni historiales.</li>
                <li>🚨 <strong>Ten cuidado</strong> al compartir URLs que contengan información sensible o privada.</li>
              </ul>
              <button
                className="btn btn-small"
                onClick={() => setShowPrivacyWarning(false)}
              >
                Entendido, continuar
              </button>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="main-content">
          {/* Source Type Selection */}
          <div className="glass-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2>1. Selecciona el Origen</h2>
                <p className="mt-2">
                  Elige cómo quieres cargar tu conversación
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
            <div className="source-toggle">
              <button
                className={`source-btn ${sourceType === 'file' ? 'active' : ''}`}
                onClick={() => setSourceType('file')}
              >
                <span className="source-icon">📁</span>
                <span className="source-name">Archivo JSON Local</span>
              </button>
              <button
                className={`source-btn ${sourceType === 'url' ? 'active' : ''}`}
                onClick={() => setSourceType('url')}
              >
                <span className="source-icon">🌐</span>
                <span className="source-name">URL Pública</span>
              </button>
            </div>
          </div>

          {/* Platform Selection */}
          <div className="glass-card">
            <h2>2. Selecciona tu Plataforma</h2>
            <div className="platform-grid">
              {/* ChatGPT - available in both modes */}
              <button
                className={`platform-btn ${platform === 'chatgpt' ? 'active' : ''}`}
                onClick={() => setPlatform('chatgpt')}
              >
                <span className="platform-icon">🤖</span>
                <span className="platform-name">ChatGPT</span>
                {sourceType === 'url' && <span className="platform-tag">URL</span>}
              </button>

              {/* Claude & Gemini - only in URL mode */}
              {sourceType === 'url' && (
                <>
                  <button
                    className={`platform-btn ${platform === 'claude' ? 'active' : ''}`}
                    onClick={() => setPlatform('claude')}
                  >
                    <span className="platform-icon">🎭</span>
                    <span className="platform-name">Claude</span>
                    <span className="platform-tag">URL</span>
                  </button>
                  <button
                    className={`platform-btn ${platform === 'gemini' ? 'active' : ''}`}
                    onClick={() => setPlatform('gemini')}
                  >
                    <span className="platform-icon">✨</span>
                    <span className="platform-name">Gemini</span>
                    <span className="platform-tag">URL</span>
                  </button>
                </>
              )}

              {/* Ollama & LM Studio - only in file mode */}
              {sourceType === 'file' && (
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
              )}
            </div>
          </div>

          {/* Input Section - File Upload */}
          {sourceType === 'file' && (
            <div className="glass-card">
              <h2>3. Cargar Archivo JSON</h2>
              <div className="file-upload">
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileUpload}
                  className="file-upload-input"
                  id="file-input"
                  disabled={loading || !serverOnline}
                />
                <label
                  htmlFor="file-input"
                  className={`file-upload-label ${loading || !serverOnline ? 'disabled' : ''}`}
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
          )}

          {/* Input Section - URL */}
          {sourceType === 'url' && (
            <div className="glass-card">
              <h2>3. Ingresa la URL Pública</h2>
              <p className="url-description">
                Pega la URL compartida de {getPlatformName(platform)} para extraer la conversación
              </p>
              <div className="url-input-container">
                <input
                  type="url"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder={`https://chat.openai.com/share/...`}
                  className="url-input"
                  disabled={loading || !serverOnline}
                />
                <button
                  className="btn btn-primary"
                  onClick={handleUrlSubmit}
                  disabled={loading || !serverOnline || !urlInput.trim()}
                >
                  {loading ? (
                    <>
                      <div className="spinner-small"></div>
                      Procesando...
                    </>
                  ) : (
                    '🔍 Extraer'
                  )}
                </button>
              </div>
              <div className="url-examples">
                <span className="url-examples-label">Ejemplos de URLs soportadas:</span>
                <code>https://chat.openai.com/share/xxxxx</code>
                <code>https://claude.ai/share/xxxxx</code>
                <code>https://gemini.google.com/share/xxxxx</code>
              </div>
            </div>
          )}

          {/* Alerts */}
          {error && (
            <div className="alert alert-error">
              {error}
            </div>
          )}
          {success && (
            <div className="alert alert-success">
              {success}
            </div>
          )}

          {/* Results */}
          {conversations.length > 0 && (
            <>
              <div className="glass-card">
                <h2>📊 Estadísticas</h2>
                <div className="stats-grid">
                  <div className="stat-item">
                    <div className="stat-value">{conversations.length}</div>
                    <div className="stat-label">Conversaciones</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-value">{getTotalMessages()}</div>
                    <div className="stat-label">Mensajes Totales</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-value">{platform.toUpperCase()}</div>
                    <div className="stat-label">Plataforma</div>
                  </div>
                </div>
              </div>

              <div className="glass-card">
                <h2>4. Exportar Chat History</h2>
                <p className="mb-3">Elige el formato de exportación</p>

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
                    disabled={loading}
                  >
                    📝 Exportar como Markdown
                  </button>
                  <button
                    className="btn btn-secondary"
                    onClick={handleExportPDF}
                    disabled={loading}
                  >
                    📄 Exportar como PDF
                  </button>
                </div>
              </div>

              {/* Preview */}
              <div className="glass-card">
                <h2>👁️ Vista Previa</h2>
                <div className="preview-section">
                  {(expandedPreview ? conversations : conversations.slice(0, 2)).map((conv) => (
                    <div key={conv.id} className="conversation-preview">
                      <h3>{conv.title}</h3>
                      <div className="conversation-meta">
                        <span className="badge">{conv.messages.length} mensajes</span>
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
                            +{conv.messages.length - 3} mensajes más
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {!expandedPreview && conversations.length > 2 && (
                    <div className="more-conversations">
                      +{conversations.length - 2} conversaciones más
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
                <h2>📖 Cómo Obtener tu Chat History</h2>
                <button className="modal-close" onClick={() => setShowHelpModal(false)}>
                  ✕
                </button>
              </div>
              <div className="modal-body">
                {/* URL Mode Instructions */}
                {sourceType === 'url' && (
                  <>
                    <div className="help-section">
                      <h3>🤖 ChatGPT (URL)</h3>
                      <ol>
                        <li>Abre la conversación que quieres exportar en ChatGPT</li>
                        <li>Haz clic en el botón de compartir (↗️) en la esquina superior</li>
                        <li>Selecciona "Share link to Chat"</li>
                        <li>Copia la URL pública generada</li>
                        <li>Pégala aquí en el campo de URL</li>
                      </ol>
                    </div>

                    <div className="help-section">
                      <h3>🎭 Claude (URL)</h3>
                      <ol>
                        <li>Abre la conversación en Claude</li>
                        <li>Haz clic en el menú (⋮) o botón "Share"</li>
                        <li>Activa "Share" y copia la URL pública</li>
                        <li>Pégala aquí</li>
                      </ol>
                    </div>

                    <div className="help-section">
                      <h3>✨ Gemini (URL)</h3>
                      <ol>
                        <li>Abre la conversación en Gemini</li>
                        <li>Haz clic en "Share" o el icono de compartir</li>
                        <li>Copia la URL compartida</li>
                        <li>Pégala aquí</li>
                      </ol>
                    </div>
                  </>
                )}

                {/* File Mode Instructions */}
                {sourceType === 'file' && (
                  <>
                    <div className="help-section">
                      <h3>💻 LM Studio (JSON)</h3>
                      <ol>
                        <li>Abre LM Studio</li>
                        <li>En el panel de chats, busca la conversación</li>
                        <li>Haz clic derecho en el nombre del chat</li>
                        <li>Selecciona <strong>"Show in File Explorer"</strong></li>
                        <li>Te llevará a la carpeta con el archivo .json de la conversación</li>
                        <li>Carga ese archivo aquí</li>
                      </ol>
                    </div>

                    <div className="help-section">
                      <h3>🦙 Ollama (JSON)</h3>
                      <ol>
                        <li>Ollama guarda las conversaciones en archivos JSON</li>
                        <li>Busca la carpeta de datos de Ollama en tu sistema</li>
                        <li>Los chats se guardan en formato JSON</li>
                        <li>Carga el archivo de conversación aquí</li>
                      </ol>
                    </div>

                    <div className="help-section">
                      <h3>🤖 ChatGPT (JSON)</h3>
                      <ol>
                        <li>Ve a <a href="https://chatgpt.com" target="_blank" rel="noopener noreferrer">chatgpt.com</a></li>
                        <li>Haz clic en tu perfil → Settings → Data controls</li>
                        <li>Haz clic en "Export data"</li>
                        <li>Recibirás un email con un ZIP</li>
                        <li>Extrae el archivo <code>conversations.json</code></li>
                        <li>Cárgalo aquí</li>
                      </ol>
                    </div>
                  </>
                )}

                <div className="help-note">
                  <p><strong>🔒 Nota de Privacidad:</strong></p>
                  <p>No almacenamos ningún dato. Todo el procesamiento es temporal y los datos se eliminan inmediatamente después de darte el resultado.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="footer">
          <p>
            🔒 Procesamiento seguro - No almacenamos datos. Todo es temporal y efímero.
          </p>
          <p className="footer-note">
            Ten cuidado al compartir URLs que contengan información sensible.
          </p>
        </footer>
      </div>
    </div>
  );
}

export default App;
