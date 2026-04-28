/* ─── App.tsx ─────────────────────────────────────────────
   Root component — lays out the chat sidebar + output panel.
   ─────────────────────────────────────────────────────── */

import { useState } from "react";
import {
  Activity,
  Send,
  BarChart3,
  Settings,
  X,
  TrendingUp,
  Zap,
} from "lucide-react";
import MessageBubble from "./components/MessageBubble";
import ToolResultCard from "./components/ToolResultCard";
import useChatEngine from "./components/ChatInterface";

function App() {
  const [showSettings, setShowSettings] = useState(false);

  const {
    messages,
    toolResults,
    input,
    isLoading,
    messagesEndRef,
    textareaRef,
    handleTextareaChange,
    sendMessage,
    handleSuggestion,
    handleKeyDown,
  } = useChatEngine();

  const suggestions = [
    "Analyze AAPL stock",
    "Show me TSLA chart",
    "What's the RSI for NVDA?",
    "Compare MSFT and GOOG",
    "Latest news on AMZN",
    "Get META financials",
  ];

  return (
    <div className="app-layout">
      {/* ── Chat Sidebar ──────────────────────────────── */}
      <aside className="chat-sidebar">
        <div className="chat-header">
          <div className="chat-header-logo">
            <TrendingUp size={20} />
          </div>
          <div className="chat-header-info">
            <h1>StockPilot</h1>
            <p>AI-Powered Analysis</p>
          </div>
          <button
            className="settings-close"
            style={{ marginLeft: "auto" }}
            onClick={() => setShowSettings(true)}
            title="Settings"
            id="settings-button"
          >
            <Settings size={18} />
          </button>
        </div>

        <div className="messages-container" id="messages-container">
          {messages.length === 0 && !isLoading && (
            <div style={{ padding: "20px", textAlign: "center" }}>
              <p
                style={{
                  color: "var(--text-tertiary)",
                  fontSize: "0.82rem",
                  marginBottom: "12px",
                }}
              >
                Ask me anything about stocks, charts, or market analysis.
              </p>
            </div>
          )}

          {messages.map((msg) => (
            <MessageBubble key={msg.id} role={msg.role} content={msg.content} />
          ))}

          {isLoading && (
            <div className="typing-indicator">
              <span />
              <span />
              <span />
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <div className="chat-input-area">
          <div className="chat-input-wrapper">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleTextareaChange}
              onKeyDown={handleKeyDown}
              placeholder="Ask about any stock…"
              rows={1}
              id="chat-input"
            />
            <button
              className="send-button"
              onClick={sendMessage}
              disabled={!input.trim() || isLoading}
              id="send-button"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main Content (Output Panel) ───────────────── */}
      <main className="main-content">
        <div className="main-header">
          <div className="main-header-title">
            <BarChart3 size={18} />
            Analysis Dashboard
          </div>
          <div className="main-header-title">
            <Zap size={14} />
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
              {toolResults.length} result{toolResults.length !== 1 ? "s" : ""}
            </span>
          </div>
        </div>

        <div className="output-area" id="output-area">
          {toolResults.length === 0 ? (
            <div className="welcome-state">
              <div className="welcome-icon">
                <Activity size={36} />
              </div>
              <h2>Welcome to StockPilot</h2>
              <p>
                Your AI-powered stock analysis assistant. Ask about any stock to
                see real-time quotes, interactive charts, technical indicators,
                and more.
              </p>
              <div className="suggestion-chips">
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    className="suggestion-chip"
                    onClick={() => handleSuggestion(s)}
                    id={`suggestion-${i}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            toolResults.map((result, i) => (
              <ToolResultCard key={i} result={result} />
            ))
          )}
        </div>
      </main>

      {/* ── Settings Modal ────────────────────────────── */}
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
    </div>
  );
}

// ── Settings Modal Component ─────────────────────────────
function SettingsModal({ onClose }: { onClose: () => void }) {
  const [proxyUrl, setProxyUrl] = useState(
    () => localStorage.getItem("stockpilot_proxy_url") || "http://localhost:3001"
  );

  const handleSave = () => {
    localStorage.setItem("stockpilot_proxy_url", proxyUrl);
    onClose();
    // Reload to pick up new proxy URL (simple approach)
    window.location.reload();
  };

  return (
    <div className="settings-overlay" onClick={onClose}>
      <div className="settings-modal" onClick={(e) => e.stopPropagation()}>
        <div className="settings-header">
          <h2>Settings</h2>
          <button className="settings-close" onClick={onClose} id="settings-close">
            <X size={18} />
          </button>
        </div>
        <div className="settings-body">
          <div className="settings-field">
            <label>Proxy Server URL</label>
            <input
              type="text"
              value={proxyUrl}
              onChange={(e) => setProxyUrl(e.target.value)}
              placeholder="http://localhost:3001"
              id="proxy-url-input"
            />
          </div>
          <p style={{ fontSize: "0.75rem", color: "var(--text-tertiary)" }}>
            The proxy server handles API calls to OpenAI and Finnhub. Make sure it's
            running before using StockPilot.
          </p>
          <button className="settings-save" onClick={handleSave} id="save-settings">
            Save & Reload
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
