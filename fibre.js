(() => {
	const thread = document.getElementById('thread');
	const composer = document.getElementById('composer');
	const prompt = document.getElementById('prompt');
	const modelSel = document.getElementById('model');
	const statusEl = document.getElementById('status');

	const nowTS = () => {
		const d = new Date();
		return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }).toLowerCase();
	};

	const escape = (s) =>
		String(s)
			.replaceAll('&', '&amp;')
			.replaceAll('<', '&lt;')
			.replaceAll('>', '&gt;')
			.replaceAll('"', '&quot;')
			.replaceAll("'", '&#39;');

	const addBubble = ({ role, html }) => {
		const row = document.createElement('div');
		row.className = role === 'user' ? 'row row--user' : 'row';

		const bubble = document.createElement('div');
		bubble.className = role === 'user' ? 'bubble bubble--user' : 'bubble';
		bubble.innerHTML = `${html}<div class="bubble__ts">${nowTS()}</div>`;

		row.appendChild(bubble);
		thread.appendChild(row);
		thread.scrollTo({ top: thread.scrollHeight, behavior: 'smooth' });
	};

	const setStatus = (t) => {
		if (!statusEl) return;
		statusEl.textContent = String(t || '').toLowerCase();
	};

	const getModel = () => {
		return modelSel?.value || localStorage.getItem('fibreModel') || 'fibre-4';
	};
	if (modelSel) {
		const saved = localStorage.getItem('fibreModel');
		if (saved) modelSel.value = saved;
		modelSel.addEventListener('change', () => {
			localStorage.setItem('fibreModel', modelSel.value);
			setStatus(`${modelSel.value} selected`);
			setTimeout(() => setStatus('ready'), 900);
		});
	}

	const addThinking = () => {
		const row = document.createElement('div');
		row.className = 'row';
		row.id = 'thinkingRow';

		const bubble = document.createElement('div');
		bubble.className = 'bubble';
		bubble.innerHTML = `<div class="thinking" aria-label="thinking"><span></span><span></span><span></span></div>`;

		row.appendChild(bubble);
		thread.appendChild(row);
		thread.scrollTo({ top: thread.scrollHeight, behavior: 'smooth' });
	};

	const removeThinking = () => {
		document.getElementById('thinkingRow')?.remove();
	};

	async function callFibreApi(userText) {
		// try real api endpoint (if you have one running). otherwise fall back to demo mode.
		try {
			const res = await fetch('/api/fibre', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ message: userText, model: getModel() }),
			});
			if (!res.ok) throw new Error(`http ${res.status}`);
			const data = await res.json();
			if (data && data.reply) return String(data.reply);
			throw new Error('bad response');
		} catch {
			return demoReply(userText);
		}
	}

	function demoReply(userText) {
		const m = getModel();
		const t = userText.toLowerCase().trim();
		if (t.includes('hello') || t === 'hi') return 'yo. whats up.';
		if (t.includes('who are you')) return 'im fibre. experimental.';
		if (t.includes('help')) return 'type anything. this is demo mode right now.';
		const prefix =
			m === 'fibre-3.5' ? 'fast take: ' :
			m === 'fibre-4-pro' ? 'deep take: ' :
			m === 'fibre-r1' ? 'reasoned take: ' :
			m === 'fibre-harmonic' ? 'harmonic take: ' :
			'';
		return `${prefix}${t.slice(0, 140)}${t.length > 140 ? '…' : ''}`;
	}

	composer?.addEventListener('submit', async (e) => {
		e.preventDefault();
		const text = (prompt?.value || '').trim();
		if (!text) return;

		addBubble({ role: 'user', html: `<div>${escape(text)}</div>` });
		prompt.value = '';
		prompt.focus();

		setStatus('thinking');
		addThinking();
		try {
			const reply = await callFibreApi(text);
			removeThinking();
			setStatus('ready');
			addBubble({ role: 'assistant', html: `<div>${escape(reply)}</div>` });
		} catch (err) {
			removeThinking();
			setStatus('offline');
			addBubble({
				role: 'assistant',
				html: `<div>something broke.</div><div class="bubble__ts">${escape(String(err.message || err))}</div>`,
			});
		}
	});

	// native-feel: focus input when you start typing
	window.addEventListener('keydown', (e) => {
		if (!prompt) return;
		if (e.key.length === 1 && document.activeElement !== prompt) prompt.focus();
	});

	setStatus('ready');
	addBubble({ role: 'assistant', html: `<div>type something. (demo mode if api isnt connected)</div>` });
})();
