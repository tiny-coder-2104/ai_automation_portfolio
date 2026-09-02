const chat = document.getElementById('chat');
const body = document.getElementById('chat-body');
const form = document.getElementById('chat-form');
const input = document.getElementById('chat-text');
const orderForm = document.getElementById('order-form');

const history = [];

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
  btn.onclick = () => {
    orderForm.name.value = order.name;
    orderForm.email.value = order.email;
    orderForm['project type'].value = order.type;
    orderForm.details.value = order.details;
    orderForm.submit();
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
  const typing = { role: 'bot', text: '…' };
  typing.el = null;
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

document.querySelectorAll('[data-open-chat]').forEach(b => b.addEventListener('click', () => {
  chat.hidden = false;
  if (history.length === 0) {
    render({ role: 'bot', text: 'Hi! I can answer questions about my services and pricing. Tell me about your project — or if you are ready to order, give me your name, email, project type, and a short description.' });
  }
  input.focus();
}));
document.querySelector('[data-close-chat]').addEventListener('click', () => { chat.hidden = true; });