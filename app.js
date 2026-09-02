const chat = document.getElementById('chat');
const body = document.getElementById('chat-body');
const form = document.getElementById('chat-form');
const input = document.getElementById('chat-text');
const themeToggle = document.getElementById('theme-toggle');

const history = [];
let chatOpened = false;

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function render(m) {
  const div = document.createElement('div');
  div.className = 'msg ' + m.role;
  div.textContent = m.text;
  body.appendChild(div);
  body.scrollTop = body.scrollHeight;
}

function renderOrder(order) {
  const panel = document.createElement('div');
  panel.className = 'order-panel';
  function row(label, val) {
    const p = document.createElement('p');
    p.innerHTML = `<strong>${label}:</strong> ${esc(val)}`;
    return p;
  }
  panel.appendChild(row('Name', order.name));
  panel.appendChild(row('Email', order.email));
  panel.appendChild(row('Project type', order.type));
  panel.appendChild(row('Details', order.details));
  const btn = document.createElement('button');
  btn.className = 'btn';
  btn.textContent = 'Send Order Request';
  btn.onclick = async () => {
    btn.disabled = true;
    btn.textContent = 'Sending…';
    try {
      const res = await fetch('/api/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(order)
      });
      const ok = res.ok;
      btn.remove();
      const done = document.createElement('p');
      done.textContent = ok
        ? `Order sent! I'll get back to you at ${order.email} soon.`
        : 'Failed to send. Please email tiny-coder-2104@agentmail.to directly.';
      panel.appendChild(done);
    } catch {
      btn.disabled = false;
      btn.textContent = 'Send Order Request';
    }
  };
  panel.appendChild(btn);
  body.appendChild(panel);
  body.scrollTop = body.scrollHeight;
}

async function send() {
  const text = input.value.trim();
  if (!text) return;
  input.value = '';
  render({ role: 'user', text });
  history.push({ role: 'user', content: text });
  const tdiv = document.createElement('div');
  tdiv.className = 'msg bot typing';
  tdiv.textContent = 'typing…';
  body.appendChild(tdiv);
  body.scrollTop = body.scrollHeight;
  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: history })
    });
    if (!res.ok) throw new Error('bad status');
    const data = await res.json();
    history.push({ role: 'assistant', content: data.text });
    tdiv.remove();
    const orderMatch = data.text.match(/__ORDER__\s*(\{[\s\S]*\})/);
    if (orderMatch) {
      const order = JSON.parse(orderMatch[1]);
      render({ role: 'bot', text: data.text.replace(/__ORDER__\s*\{[\s\S]*\}/, '')});
      renderOrder(order);
    } else {
      render({ role: 'bot', text: data.text });
    }
  } catch (e) {
    tdiv.remove();
    render({ role: 'bot', text: 'Sorry, something went wrong. Please try again in a moment.' });
  }
}

form.addEventListener('submit', e => { e.preventDefault(); send(); });

function openChat() {
  chat.hidden = false;
  if (!chatOpened) {
    chatOpened = true;
    render({ role: 'bot', text: 'Hi! I can help with:\n\n• AI chatbots & agents\n• Workflow automation\n• Web applications\n• Browser automation\n• Data processing\n\nAsk me anything, or tell me about your project to get started!' });
  }
  input.focus();
}

document.querySelectorAll('[data-open-chat]').forEach(b => b.addEventListener('click', openChat));
document.querySelector('[data-close-chat]').addEventListener('click', () => { chat.hidden = true; });

// Theme toggle
const savedTheme = localStorage.getItem('theme') || 'dark';
if (savedTheme === 'light') {
  document.body.classList.add('light');
  themeToggle.textContent = '🌙';
}

themeToggle.addEventListener('click', () => {
  document.body.classList.toggle('light');
  const isLight = document.body.classList.contains('light');
  themeToggle.textContent = isLight ? '🌙' : '☀️';
  localStorage.setItem('theme', isLight ? 'light' : 'dark');
});