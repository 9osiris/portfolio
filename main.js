(() => {
	const $ = (sel, root = document) => root.querySelector(sel);
	const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

	// Year
	const y = $("#year");
	if (y) y.textContent = new Date().getFullYear();

	// Enable hero accent underline animation
	requestAnimationFrame(() => document.documentElement.classList.add('revealed'));

	// Reveal on scroll (IntersectionObserver)
	const revealEls = $$('[data-reveal]');
	const revealNow = (el) => el.classList.add('is-visible');
	if ('IntersectionObserver' in window) {
		const io = new IntersectionObserver(
			(entries) => {
				entries.forEach((entry) => {
					if (entry.isIntersecting) {
						revealNow(entry.target);
						io.unobserve(entry.target);
					}
				});
			},
			{ threshold: 0.12, rootMargin: '0px 0px -10% 0px' },
		);
		revealEls.forEach((el) => io.observe(el));
	} else {
		revealEls.forEach(revealNow);
	}

	// Subtle stagger for grids
	$$('[data-stagger]').forEach((group) => {
		const items = $$('[data-reveal]', group);
		items.forEach((el, i) => {
			el.style.transitionDelay = `${120 + i * 90}ms`;
		});
	});

	// Smooth scroll (extra smooth + header offset)
	const headerH = () => 0;
	const scrollToId = (href) => {
		const target = $(href);
		if (!target) return;
		const y = window.scrollY + target.getBoundingClientRect().top - headerH() - 10;
		window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
	};
	$$('a[href^="#"]').forEach((a) => {
		a.addEventListener("click", (e) => {
			const href = a.getAttribute("href");
			if (!href || href === "#") return;
			if (!$(href)) return;
			e.preventDefault();
			scrollToId(href);
		});
	});

	// page transitions for internal links
	const overlay = document.getElementById('transitionOverlay');
	const isInternal = (href) => {
		if (!href) return false;
		if (href.startsWith('#')) return false;
		if (href.startsWith('http')) return false;
		if (href.startsWith('mailto:') || href.startsWith('tel:')) return false;
		return href.endsWith('.html') || href.includes('.html#') || !href.includes('://');
	};
	const fadeTo = (url) => {
		if (!overlay) {
			window.location.href = url;
			return;
		}
		overlay.classList.add('is-on');
		setTimeout(() => {
			window.location.href = url;
		}, 320);
	};
	$$('a[href]').forEach((a) => {
		a.addEventListener('click', (e) => {
			const href = a.getAttribute('href');
			if (!isInternal(href)) return;
			// allow new tab
			if (a.target === '_blank' || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
			e.preventDefault();
			fadeTo(href);
		});
	});

	// fade-in on load
	if (overlay) {
		overlay.classList.add('is-on');
		requestAnimationFrame(() => {
			setTimeout(() => overlay.classList.remove('is-on'), 120);
		});
	}

	// "see work" button: temporary message
	const seeWork = document.getElementById('seeWork');
	if (seeWork) {
		const original = seeWork.textContent || 'see work';
		seeWork.addEventListener('click', () => {
			seeWork.textContent = 'coming soon ;)';
			seeWork.disabled = true;
			setTimeout(() => {
				seeWork.textContent = original;
				seeWork.disabled = false;
			}, 1400);
		});
	}


	// easter egg: konami code toggles "stealth mode"
	const seq = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a'];
	let i = 0;
	window.addEventListener('keydown', (e) => {
		const k = e.key;
		const want = seq[i];
		if (k === want || k.toLowerCase() === want) {
			i++;
			if (i === seq.length) {
				document.documentElement.classList.toggle('stealth');
				i = 0;
			}
		} else {
			i = 0;
		}
	});

	// easter egg: click the discord pill 5 times
	const discord = document.querySelector('[data-egg="discord"]');
	let taps = 0;
	discord?.addEventListener('click', (e) => {
		taps++;
		if (taps === 5) {
			e.preventDefault();
			alert('ok you found it. ship something today.');
			taps = 0;
		}
	});

	// Subtle background drift (pattern feels alive)
	let bgTick = false;
	const onScrollBg = () => {
		if (bgTick) return;
		bgTick = true;
		requestAnimationFrame(() => {
			const dy = Math.min(24, window.scrollY * 0.02);
			document.body.style.backgroundPosition = `center calc(50% + ${dy}px)`;
			bgTick = false;
		});
	};
	window.addEventListener('scroll', onScrollBg, { passive: true });
	onScrollBg();
})();
