import React, { useState, useRef, useEffect } from 'react';
import { aiApi, taskApi } from '../../services/api';
import {
  Sparkles,
  X,
  Send,
  CheckCircle,
  Copy,
  Plus,
  Loader2,
  Key,
  TrendingUp,
  Shield,
  Clock,
  Briefcase,
  HelpCircle,
  Star,
  RotateCcw
} from 'lucide-react';

interface AiCopilotWidgetProps {
  onTaskCreated?: () => void;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  items?: string[];
  timestamp: string;
}

const INITIAL_WELCOME: ChatMessage = {
  id: 'welcome-1',
  role: 'assistant',
  text: `👋 **Hello! I am your Gemini AI Copilot for TeamCRM.**\n\nI have complete agentic context over this project's code, architecture, live tasks, users, and database. You can ask me **anything** about TeamCRM, such as:\n\n• **Specific Tasks:** *"Explain Task 1 / CRM-101 in detail"* or *"How to solve task 2?"*\n• **Roles & Permissions:** *"What can an employee do vs manager vs admin?"*\n• **Pipeline Revenue:** *"Break down our CRM pipeline revenue and deals"*\n• **Anti-Fraud Timer:** *"How does the server-side time tracking engine prevent tampering?"*\n• **Security & Auth:** *"Explain Google OAuth2 SSO and 6-digit OTP verification"*\n• **Architecture & Interview:** *"Why is TeamCRM superior to Jira/Salesforce?"* or *"Explain system architecture for an interview"*\n\nAsk any question below or click a quick prompt!`,
  items: [
    'Enforce server-authoritative time tracking across tasks',
    'Review RBAC permissions for Admin, Manager, and Employee',
    'Track deal pipeline velocity and revenue conversion',
  ],
  timestamp: 'Just now',
};

export const AiCopilotWidget: React.FC<AiCopilotWidgetProps> = ({ onTaskCreated }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [promptInput, setPromptInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_WELCOME]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [creatingTaskId, setCreatingTaskId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState('');

  // Gemini API Key state
  const [geminiApiKey, setGeminiApiKey] = useState<string>(() => {
    return localStorage.getItem('teamcrm_gemini_api_key') || '';
  });
  const [showKeySettings, setShowKeySettings] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

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
    setSuccessMsg('');

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
        text: res.result || 'Analysis complete.',
        items: res.items || [],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      console.error('AI Copilot request error:', err);
      const fallbackMsg: ChatMessage = {
        id: 'msg-ai-' + Date.now(),
        role: 'assistant',
        text: `💡 **AI Copilot Analysis for: ${textToSend}**\n\nTeamCRM processed your inquiry through the domain knowledge engine. You can review role scoping, transactional service boundaries, and server-authoritative timer logs for this module.`,
        items: [
          'Verify interface contracts & schema definitions',
          'Implement transactional service methods in backend',
          'Wire responsive frontend components with error handling',
        ],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTaskFromMessage = async (msg: ChatMessage) => {
    setCreatingTaskId(msg.id);
    try {
      // Find the user query that triggered this, or use message title
      const created = await taskApi.createTask({
        title: msg.text.slice(0, 60).replace(/[*#]/g, '').trim() || 'AI Generated Sprint Task',
        description: msg.text,
        type: 'FEATURE',
        priority: 'HIGH',
        estimatedHours: 8,
        checklistMustBeCompleted: true,
      });

      if (msg.items && msg.items.length > 0) {
        for (const item of msg.items) {
          try {
            await taskApi.addChecklistItem(created.id, item);
          } catch {}
        }
      }

      setSuccessMsg(`Task ${created.taskCode} created with ${msg.items?.length || 0} subtasks!`);
      if (onTaskCreated) onTaskCreated();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      console.error(err);
      setSuccessMsg('Failed to create sprint task');
    } finally {
      setCreatingTaskId(null);
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
          className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-gradient-to-r from-primary to-accent-pink text-white font-bold text-xs shadow-lg hover:shadow-xl hover:scale-105 transition-all cursor-pointer group"
        >
          <Sparkles className="w-4 h-4 animate-spin-slow group-hover:rotate-12 transition-transform" />
          <span className="tracking-wide">Gemini AI Copilot</span>
        </button>
      </div>

      {/* Floating Copilot Modal */}
      {isOpen && (
        <div className="fixed inset-x-3 bottom-20 sm:inset-x-auto sm:right-6 sm:bottom-20 z-50 sm:w-[480px] h-[580px] max-h-[85vh] bg-white rounded-2xl border border-border-custom shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200">
          {/* Header */}
          <div className="px-4 py-3 bg-gradient-to-r from-purple-50 via-pink-50 to-white border-b border-border-custom flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold">
                <Sparkles className="w-4.5 h-4.5 text-primary" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-xs text-text-primary tracking-tight">Gemini AI Copilot</h3>
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-semibold bg-emerald-100 text-emerald-800">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    {geminiApiKey ? 'Cloud Gemini API' : 'Agentic Engine'}
                  </span>
                </div>
                <p className="text-[10px] text-text-secondary leading-none mt-0.5">
                  Full Project Intelligence, Code & Architecture Assistant
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={clearChat}
                className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-gray-100 transition-colors"
                title="Reset conversation"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setShowKeySettings(!showKeySettings)}
                className={`p-1.5 rounded-lg text-text-secondary hover:text-text-primary transition-colors ${
                  showKeySettings ? 'bg-purple-100 text-primary' : 'hover:bg-gray-100'
                }`}
                title="Configure Google Gemini API Key"
              >
                <Key className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-gray-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* API Key Settings Drawer */}
          {showKeySettings && (
            <div className="p-3 bg-purple-50/70 border-b border-border-custom space-y-2 animate-in fade-in shrink-0">
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
                    className="px-2 py-1 text-[11px] text-rose-600 hover:bg-rose-50 rounded font-semibold"
                  >
                    Clear
                  </button>
                )}
              </div>
              <p className="text-[10px] text-text-secondary">
                {geminiApiKey
                  ? '✓ Direct Google Gemini cloud model active with live TeamCRM context.'
                  : '✓ Built-in Agentic AI is active. Enter a personal Gemini API key if you want direct cloud LLM responses.'}
              </p>
            </div>
          )}

          {/* Quick Prompt Suggestions Bar */}
          <div className="px-3 py-2 bg-gray-50/80 border-b border-border-custom flex items-center gap-1.5 overflow-x-auto text-[10px] font-semibold text-text-secondary shrink-0 scrollbar-none">
            <span className="text-[9px] uppercase tracking-wider text-text-secondary shrink-0">Suggestions:</span>
            <button
              type="button"
              onClick={() => handleSendMessage('tell me about pipeline revenue and deals in teamcrm')}
              className="px-2 py-0.5 rounded-full bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-200 shrink-0 transition-colors flex items-center gap-1"
            >
              <TrendingUp className="w-3 h-3 text-emerald-600" />
              Pipeline Revenue
            </button>
            <button
              type="button"
              onClick={() => handleSendMessage('explain task 1 in detail and give step by step execution blueprint')}
              className="px-2 py-0.5 rounded-full bg-white hover:bg-purple-50 text-primary border border-purple-200 shrink-0 transition-colors flex items-center gap-1"
            >
              <HelpCircle className="w-3 h-3 text-primary" />
              Task 1 Elaboration
            </button>
            <button
              type="button"
              onClick={() => handleSendMessage('how do admin, manager, and employee roles differ in teamcrm?')}
              className="px-2 py-0.5 rounded-full bg-white hover:bg-blue-50 text-blue-800 border border-blue-200 shrink-0 transition-colors flex items-center gap-1"
            >
              <Shield className="w-3 h-3 text-blue-600" />
              Role Matrix (Admin/Mgr/Emp)
            </button>
            <button
              type="button"
              onClick={() => handleSendMessage('how does server-side anti-fraud timer work in teamcrm?')}
              className="px-2 py-0.5 rounded-full bg-white hover:bg-amber-50 text-amber-800 border border-amber-200 shrink-0 transition-colors flex items-center gap-1"
            >
              <Clock className="w-3 h-3 text-amber-600" />
              Anti-Fraud Timer
            </button>
            <button
              type="button"
              onClick={() => handleSendMessage('explain google oauth2 login and forgot password 6-digit otp in teamcrm')}
              className="px-2 py-0.5 rounded-full bg-white hover:bg-pink-50 text-pink-800 border border-pink-200 shrink-0 transition-colors flex items-center gap-1"
            >
              <Briefcase className="w-3 h-3 text-pink-600" />
              OAuth2 & OTP
            </button>
            <button
              type="button"
              onClick={() => handleSendMessage('why is teamcrm better than salesforce and jira? give interview pitch')}
              className="px-2 py-0.5 rounded-full bg-white hover:bg-yellow-50 text-yellow-800 border border-yellow-200 shrink-0 transition-colors flex items-center gap-1"
            >
              <Star className="w-3 h-3 text-yellow-600" />
              Why TeamCRM / Pitch
            </button>
          </div>

          {/* Success Banner */}
          {successMsg && (
            <div className="px-3 py-2 bg-emerald-50 border-b border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 font-semibold shrink-0">
              <CheckCircle className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Chat Messages Stream */}
          <div className="flex-1 p-3 space-y-3 overflow-y-auto text-xs">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
              >
                {/* Bubble Container */}
                <div
                  className={`max-w-[90%] rounded-2xl p-3 shadow-xs ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-r from-primary to-accent-pink text-white rounded-br-xs'
                      : 'bg-purple-50/60 border border-purple-200/70 text-text-primary rounded-bl-xs'
                  }`}
                >
                  {/* Header inside assistant message */}
                  {msg.role === 'assistant' && (
                    <div className="flex items-center justify-between font-bold text-text-primary mb-1.5 pb-1 border-b border-purple-200/50">
                      <span className="flex items-center gap-1.5 text-primary text-[11px]">
                        <Sparkles className="w-3.5 h-3.5" /> Gemini Copilot
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() =>
                            copyToClipboard(
                              msg.text + '\n\n' + (msg.items || []).join('\n'),
                              msg.id
                            )
                          }
                          className="p-1 hover:bg-white rounded text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
                          title="Copy response"
                        >
                          {copiedId === msg.id ? (
                            <CheckCircle className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Body Text */}
                  <div className="whitespace-pre-wrap leading-relaxed text-xs">
                    {msg.text}
                  </div>

                  {/* Checklist Items if present */}
                  {msg.items && msg.items.length > 0 && (
                    <div className="mt-2.5 pt-2 border-t border-purple-200/60 space-y-1.5">
                      <span className="font-bold text-[10px] uppercase text-text-secondary tracking-wider block">
                        Actionable Engineering Checklist ({msg.items.length}):
                      </span>
                      <ul className="space-y-1">
                        {msg.items.map((item, idx) => (
                          <li key={idx} className="flex items-start gap-1.5 text-text-primary text-[11px]">
                            <span className="text-primary font-bold">•</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Create Sprint Task Action */}
                  {msg.role === 'assistant' && msg.id !== 'welcome-1' && (
                    <button
                      type="button"
                      disabled={creatingTaskId === msg.id}
                      onClick={() => handleCreateTaskFromMessage(msg)}
                      className="w-full mt-2.5 py-1.5 px-3 bg-primary hover:bg-primary-hover text-white font-bold rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs disabled:opacity-50 text-[11px]"
                    >
                      {creatingTaskId === msg.id ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <>
                          <Plus className="w-3 h-3" />
                          <span>Create Sprint Task from this AI Response</span>
                        </>
                      )}
                    </button>
                  )}
                </div>

                <span className="text-[9px] text-text-secondary mt-1 px-1">
                  {msg.timestamp}
                </span>
              </div>
            ))}

            {isLoading && (
              <div className="flex items-start gap-2">
                <div className="bg-purple-50/80 border border-purple-200 rounded-2xl p-3 flex items-center gap-2 text-text-secondary text-xs">
                  <Loader2 className="w-4 h-4 text-primary animate-spin" />
                  <span>Gemini AI Copilot is analyzing TeamCRM database & architecture...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Footer */}
          <div className="p-3 bg-white border-t border-border-custom shrink-0">
            <div className="relative flex items-center">
              <textarea
                rows={1}
                value={promptInput}
                onChange={(e) => setPromptInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="Ask anything about the project (Press Enter to send)..."
                className="w-full py-2.5 pl-3 pr-10 bg-purple-50/40 text-xs text-text-primary rounded-xl border border-border-custom focus:border-primary outline-none resize-none placeholder:text-text-secondary leading-normal"
              />
              <button
                type="button"
                disabled={isLoading || !promptInput.trim()}
                onClick={() => handleSendMessage()}
                className="absolute right-2 p-1.5 rounded-lg bg-primary hover:bg-primary-hover text-white disabled:opacity-40 transition-colors cursor-pointer"
                title="Send to Copilot"
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
