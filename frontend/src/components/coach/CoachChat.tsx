import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { MessageCircle, Send, X, Sparkles } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { settingsApi, CoachSource } from '../../services/api';
import { useAppStore } from '../../store/useAppStore';
import { useAuthStore } from '../../store/authStore';
import { buildCoachClient } from '../../utils/coachClient';
import { localCoachGreeting } from '../../utils/coachGreeting';

type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
  source?: CoachSource | 'system';
};

export default function CoachChat() {
  const navigate = useNavigate();
  const location = useLocation();
  const settings = useAppStore((s) => s.settings);
  const dashboard = useAppStore((s) => s.dashboard);
  const user = useAuthStore((s) => s.user);
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [ollamaReady, setOllamaReady] = useState<boolean | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const welcomedRef = useRef(false);

  const coachEnabled = settings?.ai_coach_enabled ?? true;

  useEffect(() => {
    const openCoach = () => setOpen(true);
    window.addEventListener('focus-coach-open', openCoach);
    return () => window.removeEventListener('focus-coach-open', openCoach);
  }, []);

  useEffect(() => {
    if (!open || !coachEnabled) return;

    settingsApi
      .coachStatus()
      .then((r) => setOllamaReady(r.data.ollama_ready))
      .catch(() => setOllamaReady(false));

    if (welcomedRef.current) return;
    welcomedRef.current = true;

    const client = buildCoachClient(location.pathname);
    const instant =
      localCoachGreeting(dashboard, user?.name) ||
      'Hi! Ask me about your tasks, streak, or next focus session.';
    setMessages([{ role: 'assistant', content: instant, source: 'system' }]);

    settingsApi
      .coachGreeting(client)
      .then((r) => {
        if (r.data.message) {
          setMessages([{ role: 'assistant', content: r.data.message, source: r.data.source }]);
        }
      })
      .catch(() => {});
  }, [open, coachEnabled, location.pathname, dashboard, user?.name]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading, open]);

  async function handleSend() {
    const text = input.trim();
    if (!text || loading) return;

    if (!coachEnabled) {
      navigate('/settings');
      return;
    }

    const userMsg: ChatMessage = { role: 'user', content: text };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput('');
    setLoading(true);

    try {
      const history = next
        .filter((m) => m.role === 'user' || m.role === 'assistant')
        .map((m) => ({ role: m.role, content: m.content }));
      const res = await settingsApi.coachChat(history, buildCoachClient(location.pathname));
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: res.data.message,
          source: res.data.source,
        },
      ]);
      if (res.data.source === 'ollama') setOllamaReady(true);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content:
            "I couldn't reach the coach right now. Check that the backend is running. Ollama is optional for chat.",
          source: 'fallback',
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  const ui = (
    <div className="fixed bottom-4 right-4 z-[200] flex flex-col items-end gap-3">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            className="flex h-[min(520px,70vh)] w-[min(380px,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl backdrop-blur-md"
          >
            <header className="flex items-center justify-between border-b border-border px-4 py-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-semibold text-text">Focus coach</p>
                  <p className="text-xs text-text-muted">
                    {!coachEnabled
                      ? 'Disabled in settings'
                      : ollamaReady === null
                        ? 'Checking AI…'
                        : ollamaReady
                          ? 'Personalized · Ollama'
                          : 'Personalized · offline AI'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="btn-icon text-text-muted"
                aria-label="Close coach chat"
              >
                <X className="h-5 w-5" />
              </button>
            </header>

            <div className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
              {messages.map((m, i) => (
                <div
                  key={`${m.role}-${i}`}
                  className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                      m.role === 'user'
                        ? 'bg-primary text-white'
                        : 'bg-surface-hover text-text-secondary'
                    }`}
                  >
                    {m.content}
                  </div>
                </div>
              ))}
              {loading && <p className="text-xs text-text-subtle">Coach is thinking…</p>}
              <div ref={bottomRef} />
            </div>

            {!coachEnabled ? (
              <div className="border-t border-border px-4 py-3 text-center text-sm text-text-muted">
                Enable{' '}
                <button
                  type="button"
                  className="text-primary underline"
                  onClick={() => navigate('/settings')}
                >
                  AI focus coach
                </button>{' '}
                in Settings to chat.
              </div>
            ) : (
              <form
                className="flex gap-2 border-t border-border p-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
              >
                <input
                  type="text"
                  className="input-field flex-1 py-2 text-sm"
                  placeholder="Ask your coach…"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  disabled={loading}
                />
                <button
                  type="submit"
                  className="btn-primary shrink-0 px-3 py-2"
                  disabled={loading || !input.trim()}
                  aria-label="Send message"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        type="button"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setOpen((v) => !v)}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-primary to-secondary text-white shadow-lg shadow-primary/40"
        aria-label={open ? 'Close focus coach' : 'Open focus coach chat'}
        title="Chat with your focus coach"
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </motion.button>
    </div>
  );

  return createPortal(ui, document.body);
}
