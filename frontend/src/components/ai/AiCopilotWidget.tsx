import React, { useState, useRef, useEffect } from 'react';
import { aiApi } from '../../services/api';
import {
  Sparkles,
  X,
  Send,
  CheckCircle,
  Copy,
  Loader2,
  Key,
  RotateCcw,
  Bot,
  User as UserIcon,
} from 'lucide-react';

interface AiCopilotWidgetProps {
  onTaskCreated?: () => void;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

const INITIAL_WELCOME: ChatMessage = {
  id: 'welcome-1',
  role: 'assistant',
  text: `Hello! I am your AI Chatbot.`,
  timestamp: 'Just now',
};

export const AiCopilotWidget: React.FC<AiCopilotWidgetProps> = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [promptInput, setPromptInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_WELCOME]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Gemini API Key state
  const [geminiApiKey, setGeminiApiKey] = useState<string>(() => {
    return localStorage.getItem('teamcrm_gemini_api_key') || '';
  });
  const [showKeySettings, setShowKeySettings] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 150);
    }
  }, [isOpen]);

  const handleSendMessage = async (overrideText?: string) => {
    const textToSend = (overrideText !== undefined ? overrideText : promptInput).trim();
    if (!textToSend || isLoading) return;

    const userMsg: ChatMessage = {
      id: 'msg-' + Date.now(),
      role: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (overrideText === undefined) {
      setPromptInput('');
    }
    setIsLoading(true);

    try {
      const res = await aiApi.generate(
        'COPILOT_CHAT',
        textToSend,
        undefined,
        geminiApiKey ? geminiApiKey.trim() : undefined
      );

      const aiMsg: ChatMessage = {
        id: 'msg-ai-' + Date.now(),
        role: 'assistant',
        text: res.result || 'Response received.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      console.error('AI Chatbot request error:', err);
      const fallbackMsg: ChatMessage = {
        id: 'msg-ai-' + Date.now(),
        role: 'assistant',
        text: `I'm having trouble connecting right now. Please ensure the backend server is running and try again.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const clearChat = () => {
    setMessages([INITIAL_WELCOME]);
  };

  return (
    <>
      {/* Floating Trigger Button */}
      <div className="fixed bottom-5 right-5 z-40">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-gradient-to-r from-primary to-accent-pink text-white font-bold text-xs shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all cursor-pointer group"
          aria-label="Open AI Chatbot"
        >
          <Sparkles className="w-4 h-4 animate-spin-slow group-hover:rotate-12 transition-transform" />
          <span className="tracking-wide">AI Chatbot</span>
        </button>
      </div>

      {/* Floating Chatbot Window */}
      {isOpen && (
        <div className="fixed inset-x-3 bottom-20 sm:inset-x-auto sm:right-6 sm:bottom-20 z-50 sm:w-[460px] h-[580px] max-h-[85vh] bg-white rounded-2xl border border-border-custom shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200">
          {/* Header */}
          <div className="px-4 py-3 bg-gradient-to-r from-purple-50 via-pink-50 to-white border-b border-border-custom flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-primary text-white flex items-center justify-center font-bold shadow-xs">
                <Bot className="w-4.5 h-4.5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-xs text-text-primary tracking-tight">Gemini AI Chatbot</h3>
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-semibold bg-emerald-100 text-emerald-800">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    {geminiApiKey ? 'Gemini Cloud API' : 'Online'}
                  </span>
                </div>
                <p className="text-[10px] text-text-secondary leading-none mt-0.5">
                  Ask anything, elaborate tasks, or chat freely
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={clearChat}
                className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-white/80 transition-colors cursor-pointer"
                title="Reset conversation"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              {/* Key icon commented out per user request */}
              {/* <button
                type="button"
                onClick={() => setShowKeySettings(!showKeySettings)}
                className={`p-1.5 rounded-lg text-text-secondary hover:text-text-primary transition-colors cursor-pointer ${showKeySettings ? 'bg-purple-100 text-primary' : 'hover:bg-white/80'
                  }`}
                title="Configure Google Gemini API Key"
              >
                <Key className="w-3.5 h-3.5" />
              </button> */}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-white/80 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Optional Gemini API Key Drawer */}
          {showKeySettings && (
            <div className="p-3 bg-purple-50/80 border-b border-border-custom space-y-2 animate-in fade-in shrink-0">
              <div className="flex items-center justify-between text-xs font-semibold text-text-primary">
                <span className="flex items-center gap-1.5 text-primary">
                  <Key className="w-3.5 h-3.5" /> Google Gemini API Key
                </span>
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[10px] text-primary hover:underline"
                >
                  Get free key ↗
                </a>
              </div>
              <div className="flex gap-2">
                <input
                  type="password"
                  value={geminiApiKey}
                  onChange={(e) => {
                    const val = e.target.value.trim();
                    setGeminiApiKey(val);
                    localStorage.setItem('teamcrm_gemini_api_key', val);
                  }}
                  placeholder="Paste AIzaSy... key (optional)"
                  className="flex-1 px-3 py-1.5 text-xs bg-white text-text-primary rounded-lg border border-border-custom focus:border-primary outline-none font-mono"
                />
                {geminiApiKey && (
                  <button
                    type="button"
                    onClick={() => {
                      setGeminiApiKey('');
                      localStorage.removeItem('teamcrm_gemini_api_key');
                    }}
                    className="px-2 py-1 text-[11px] text-rose-600 hover:bg-rose-50 rounded font-semibold cursor-pointer"
                  >
                    Clear
                  </button>
                )}
              </div>
              <p className="text-[10px] text-text-secondary">
                {geminiApiKey
                  ? '✓ Direct Google Gemini cloud model is active.'
                  : '✓ Built-in Chatbot engine is active. You can enter an optional Google Gemini API key for cloud model responses.'}
              </p>
            </div>
          )}

          {/* Chat Messages Stream */}
          <div className="flex-1 p-3.5 space-y-3.5 overflow-y-auto text-xs bg-gray-50/30">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="w-3.5 h-3.5" />
                  </div>
                )}

                <div className={`flex flex-col max-w-[85%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                  {/* Bubble Container */}
                  <div
                    className={`rounded-2xl p-3 shadow-xs ${msg.role === 'user'
                      ? 'bg-gradient-to-r from-primary to-accent-pink text-white rounded-br-xs'
                      : 'bg-white border border-border-custom text-text-primary rounded-bl-xs'
                      }`}
                  >
                    {/* Header inside assistant message */}
                    {msg.role === 'assistant' && (
                      <div className="flex items-center justify-between font-bold text-text-primary mb-1 pb-1 border-b border-border-custom/40">
                        <span className="flex items-center gap-1 text-primary text-[10px]">
                          <Sparkles className="w-3 h-3" /> Gemini AI
                        </span>
                        <button
                          onClick={() => copyToClipboard(msg.text, msg.id)}
                          className="p-1 hover:bg-gray-100 rounded text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
                          title="Copy response"
                        >
                          {copiedId === msg.id ? (
                            <CheckCircle className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    )}

                    {/* Body Text */}
                    <div className="whitespace-pre-wrap leading-relaxed text-xs selection:bg-purple-200">
                      {msg.text}
                    </div>
                  </div>

                  <span className="text-[9px] text-text-secondary mt-1 px-1">
                    {msg.timestamp}
                  </span>
                </div>

                {msg.role === 'user' && (
                  <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                    <UserIcon className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex items-start gap-2">
                <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="w-3.5 h-3.5" />
                </div>
                <div className="bg-white border border-border-custom rounded-2xl rounded-bl-xs p-3 flex items-center gap-2 text-text-secondary text-xs shadow-xs">
                  <Loader2 className="w-3.5 h-3.5 text-primary animate-spin" />
                  <span>Gemini AI is thinking...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Footer */}
          <div className="p-3 bg-white border-t border-border-custom shrink-0">
            <div className="relative flex items-center">
              <textarea
                ref={textareaRef}
                rows={1}
                value={promptInput}
                onChange={(e) => setPromptInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="Ask anything... (Press Enter to send)"
                className="w-full py-2.5 pl-3 pr-10 bg-gray-50/70 text-xs text-text-primary rounded-xl border border-border-custom focus:border-primary focus:bg-white outline-none resize-none placeholder:text-text-secondary leading-normal transition-all"
              />
              <button
                type="button"
                disabled={isLoading || !promptInput.trim()}
                onClick={() => handleSendMessage()}
                className="absolute right-2 p-1.5 rounded-lg bg-primary hover:bg-primary-hover text-white disabled:opacity-40 transition-colors cursor-pointer"
                title="Send message"
              >
                {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
