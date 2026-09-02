import https from 'https';
import { URL } from 'url';

const MODEL = 'meta/llama-3.2-11b-vision-instruct';
const ENDPOINT = 'https://integrate.api.nvidia.com/v1/chat/completions';

const SYSTEM = `You are the sales assistant for AI Automation Solutions, a freelance AI-automation developer based in Davao City, Philippines.

Services offered (no prices are ever mentioned): AI Chatbots & Agents, Workflow Automation, Web Applications, Browser Automation, Data Processing.

Help the visitor with questions about these services and about hiring. Keep replies short (under 120 words) and friendly.

For every request to order/hire/start/proceed, you must collect four pieces of information:
1. name
2. email
3. project type (one of the five services)
4. a short description of the project

Rules:
- Never ask twice for something the visitor already gave. Use it.
- Infer the project type when obvious from what they say (e.g. "AI chatbot", "WhatsApp bot" → AI Chatbots & Agents; "scraping", "lead gen" → Browser Automation; "dashboard", "booking site" → Web Applications; "data cleaning", "reports" → Data Processing).
- Any description of features, scope, or use case counts as the short description.
- Once all four are gathered, reply with a short confirmation message followed by exactly this line at the very end:
__ORDER__ {"name":"<name>","email":"<email>","type":"<type>","details":"<details>"}
- Do not invent values the visitor never gave. Never repeat the line in any other situation. Never add the line and also keep chatting about missing fields.`;

function postJson(url, payload, key) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const data = JSON.stringify(payload);
    const req = https.request({
      hostname: u.hostname,
      path: u.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + key,
        'Content-Length': Buffer.byteLength(data)
      }
    }, res => {
      let chunks = '';
      res.on('data', c => (chunks += c));
      res.on('end', () => resolve({ status: res.statusCode, body: chunks }));
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method not allowed' });

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = null; }
  }
  let messages = body?.messages || [];

  if (!Array.isArray(messages)) return res.status(400).json({ error: 'bad request' });
  messages = messages.slice(-12).map(m => ({
    role: m.role === 'assistant' ? 'assistant' : 'user',
    content: String(m.content || '').slice(0, 2000)
  }));

  const r = await postJson(ENDPOINT, {
    model: MODEL,
    messages: [{ role: 'system', content: SYSTEM }, ...messages],
    max_tokens: 600,
    temperature: 0.7
  }, process.env.NVIDIA_API_KEY);

  let text = 'Sorry, something went wrong.';
  try {
    const json = JSON.parse(r.body);
    if (r.status === 200 && json.choices?.[0]?.message?.content) {
      text = json.choices[0].message.content;
    }
  } catch {}
  res.status(r.status === 200 ? 200 : 502).json({ text });
}