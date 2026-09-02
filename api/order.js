import { sendOrder } from './_mail.js';

function clean(s) {
  return String(s || '').trim().slice(0, 500);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method not allowed' });

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  const order = {
    name: clean(body.name),
    email: clean(body.email),
    type: clean(body.type),
    details: clean(body.details)
  };
  if (!order.name || !order.email || !order.type || !order.details) {
    return res.status(400).json({ error: 'missing fields' });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(order.email)) {
    return res.status(400).json({ error: 'invalid email' });
  }

  const r = await sendOrder(order);
  if (r.status >= 200 && r.status < 300) {
    return res.json({ ok: true });
  }
  res.status(502).json({ error: 'failed to send' });
}