// fibre-server.example.js
// minimal node server that keeps your groq keys OFF the client.
//
// 1) npm i express
// 2) set env var GROQ_API_KEYS (comma-separated) and GROQ_FALLBACK_KEYS
// 3) node fibre-server.example.js
//
// WARNING: do NOT commit real keys.

import express from 'express';

const app = express();
app.use(express.json());
app.use(express.static('osiris-rocks'));

const API_KEYS = (process.env.GROQ_API_KEYS || '').split(',').map(s => s.trim()).filter(Boolean);
const COMPLETE_FALLBACK_KEYS = (process.env.GROQ_FALLBACK_KEYS || '').split(',').map(s => s.trim()).filter(Boolean);

const API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

async function groqChat({ message, apiKey }) {
	const res = await fetch(API_URL, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${apiKey}`,
		},
		body: JSON.stringify({
			model: MODEL,
			messages: [
				{ role: 'system', content: 'you are fibre. keep replies short and clean.' },
				{ role: 'user', content: message },
			],
			temperature: 0.7,
			max_tokens: 400,
		}),
	});
	if (!res.ok) throw new Error(`groq ${res.status}`);
	const data = await res.json();
	return data?.choices?.[0]?.message?.content || '';
}

app.post('/api/fibre', async (req, res) => {
	const message = String(req.body?.message || '').slice(0, 4000);
	if (!message) return res.status(400).json({ error: 'missing message' });

	const keys = [...API_KEYS, ...COMPLETE_FALLBACK_KEYS];
	let lastErr = null;
	for (const key of keys) {
		try {
			const reply = await groqChat({ message, apiKey: key });
			return res.json({ reply });
		} catch (e) {
			lastErr = e;
		}
	}

	return res.status(502).json({ error: 'all keys failed', detail: String(lastErr?.message || lastErr) });
});

app.listen(8787, () => {
	console.log('running on http://localhost:8787');
});
