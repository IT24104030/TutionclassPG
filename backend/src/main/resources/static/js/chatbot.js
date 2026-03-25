/* ============================================
   chatbot.js - Minimal AI Chat Widget
   ============================================ */

(() => {
    const state = {
        open: false,
        history: [],
        sending: false,
    };

    function el(id) { return document.getElementById(id); }

    function setOpen(open) {
        const panel = el('chatbotPanel');
        if (!panel) return;
        state.open = open;
        panel.classList.toggle('d-none', !open);
        panel.setAttribute('aria-hidden', open ? 'false' : 'true');

        if (open) {
            const input = el('chatbotText');
            if (input) input.focus();
            if (state.history.length === 0) {
                addAssistant("Hi! I’m your Tuition Assistant. Ask me anything about Students, Batches, Attendance, Income/Payments, Schedule, Marketing, Resources, Staff, or Results.");
            }
        }
    }

    function scrollToBottom() {
        const box = el('chatbotMessages');
        if (!box) return;
        box.scrollTop = box.scrollHeight;
    }

    function addMessage(role, text, meta) {
        const box = el('chatbotMessages');
        if (!box) return;

        const row = document.createElement('div');
        row.className = `chatbot-msg chatbot-msg-${role}`;

        const bubble = document.createElement('div');
        bubble.className = 'chatbot-bubble';
        bubble.textContent = text;
        row.appendChild(bubble);

        if (meta) {
            const m = document.createElement('div');
            m.className = 'chatbot-meta';
            m.textContent = meta;
            row.appendChild(m);
        }

        box.appendChild(row);
        scrollToBottom();
    }

    function addUser(text) {
        addMessage('user', text);
        state.history.push({ role: 'user', content: text });
    }

    function addAssistant(text, provider) {
        const meta = provider ? `via ${provider}` : '';
        addMessage('assistant', text, meta);
        state.history.push({ role: 'assistant', content: text });
    }

    function setSending(sending) {
        state.sending = sending;
        const input = el('chatbotText');
        const btn = el('chatbotSend');
        if (input) input.disabled = sending;
        if (btn) btn.disabled = sending;
    }

    function getAuthToken() {
        const stored = localStorage.getItem('token');
        if (!stored || stored === 'null' || stored === 'undefined') return null;
        return stored;
    }

    async function chatApi(message, history) {
        const authToken = getAuthToken();
        if (!authToken) throw new Error('Session expired. Please login again.');

        const res = await fetch('http://localhost:8081/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ message, history })
        });

        if (res.status === 401) {
            throw new Error('Session expired. Please login again.');
        }

        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.message || `Chat error ${res.status}`);
        }

        return res.json().catch(() => ({}));
    }

    async function send() {
        if (state.sending) return;

        const input = el('chatbotText');
        if (!input) return;
        const text = (input.value || '').trim();
        if (!text) return;

        input.value = '';
        addUser(text);
        setSending(true);

        try {
            // Only send last few turns to keep it lightweight
            const history = state.history.slice(-10);
            const res = await chatApi(text, history);
            if (!res || !res.reply) {
                addAssistant('Sorry — I could not get a response right now.');
            } else {
                addAssistant(res.reply, res.provider);
            }
        } catch (e) {
            addAssistant(e?.message || 'Sorry — chat is temporarily unavailable.');
        } finally {
            setSending(false);
        }
    }

    document.addEventListener('DOMContentLoaded', () => {
        const fab = el('chatbotFab');
        const close = el('chatbotClose');
        const sendBtn = el('chatbotSend');
        const input = el('chatbotText');

        if (fab) fab.addEventListener('click', () => setOpen(!state.open));
        if (close) close.addEventListener('click', () => setOpen(false));
        if (sendBtn) sendBtn.addEventListener('click', send);

        if (input) {
            input.addEventListener('keydown', (ev) => {
                if (ev.key === 'Enter') {
                    ev.preventDefault();
                    send();
                }
                if (ev.key === 'Escape') {
                    setOpen(false);
                }
            });
        }
    });
})();
