/**
 * chatbot.js — "Ask about zurai02"
 *
 * A tiny, fully static Q&A assistant for the portfolio. No server, no API key,
 * no tracking: questions are matched against the answers below, in the browser.
 *
 * EDITING: everything people can ask about lives in the KB array. Add an entry
 * with `keys` (single words), `phrases` (multi-word) and an `answer`.
 * Only put things in here that you are happy to make public.
 */
(function () {
  'use strict';

  /* ── Public links (edit freely) ───────────────────────────────────────── */
  var L = {
    portfolio: { label: 'DevForum portfolio', href: 'https://devforum.roblox.com/t/zurai02-scripting-portfolio/4679442' },
    devforum:  { label: 'DevForum profile',   href: 'https://devforum.roblox.com/u/zurai02' },
    blog:      { label: 'Blog',               href: 'https://zurai02.is-a.dev/Blog' },
    github:    { label: 'GitHub',             href: 'https://github.com/zurai02' },
    roblox:    { label: 'Roblox profile',     href: 'https://www.roblox.com/users/5674181802/profile' }
  };

  var DISCORD = 'lol066351';

  /* ── Knowledge base ───────────────────────────────────────────────────── */
  var KB = [
    {
      id: 'about',
      keys: ['about', 'intro', 'introduce', 'bio', 'background', 'specialist', 'developer', 'scripter', 'programmer', 'roblox', 'luau', 'profession', 'job', 'occupation', 'doing', 'creator'],
      phrases: ['who is', 'what do', 'tell me about', 'what does', 'what is zurai02', 'what is he', 'what is she'],
      answer: 'zurai02 is a Roblox Scripting & Engine Optimization Specialist. They write Luau and focus on squeezing out every frame and byte: client-side performance, lightweight networking and memory-safe systems.\n\nTheir GitHub tagline: "Creator | Innovator | Optimizer | Script Coder".',
      links: [L.portfolio]
    },
    {
      id: 'skills',
      keys: ['skill', 'specialize', 'specialise', 'expertise', 'good', 'strength', 'capable', 'ability', 'speciality', 'specialty', 'offer', 'expert'],
      phrases: ['what can', 'good at', 'key skills', 'areas of'],
      answer: 'Three main areas:\n\n1. Client-side optimization: custom tweening modules that bypass TweenService limits.\n2. Performance analysis: MicroProfiler, StreamingEnabled setups and leak-proof memory management.\n3. Networking: lightweight RemoteEvent structures that cut down on packet loss.\n\nThe common thread is a 100% client-side performance focus.',
      links: [L.portfolio]
    },
    {
      id: 'performance',
      keys: ['performance', 'optimization', 'optimisation', 'optimize', 'optimise', 'optimizer', 'fps', 'frame', 'lag', 'fast', 'faster', 'speed', 'memory', 'leak', 'profile', 'profiler', 'microprofiler', 'streaming', 'pool', 'pooling', 'heartbeat', 'engine'],
      phrases: ['engine optimization', 'memory leak', 'object pooling', 'streaming enabled'],
      answer: 'Performance is the core of zurai02\'s work. That means micro-profiling with the MicroProfiler, StreamingEnabled configurations, object pooling, Heartbeat-driven systems and memory management that catches leaks before they ship.\n\nThe goal: zero wasted frames.',
      links: [L.portfolio]
    },
    {
      id: 'networking',
      keys: ['network', 'networking', 'remote', 'remoteevent', 'remotefunction', 'packet', 'latency', 'batch', 'batching', 'replication', 'netbatcher', 'ratelimit', 'signal'],
      phrases: ['remote event', 'remote function', 'packet loss', 'rate limit', 'rate limiting', 'client server'],
      answer: 'On networking, zurai02 builds lightweight RemoteEvent structures designed to mitigate packet loss: batching, rate-limiting and reliability layers, all written in Luau. They also work with a Signal library and client-server architecture.',
      links: [L.portfolio]
    },
    {
      id: 'tween',
      keys: ['tween', 'tweening', 'tweenservice', 'animation', 'animate', 'easing', 'interpolation', 'interpolate'],
      phrases: ['custom tween'],
      answer: 'zurai02 writes custom tweening modules that bypass TweenService\'s limits, with direct control over interpolation, easing and cancellation, and without the overhead.',
      links: [L.portfolio]
    },
    {
      id: 'stack',
      keys: ['stack', 'tool', 'tech', 'technology', 'technologies', 'use', 'software', 'studio', 'platform'],
      phrases: ['tech stack', 'what tools', 'roblox studio', 'do you use', 'they use', 'does he use', 'does she use'],
      answer: 'Day to day: Luau, Roblox Studio, RemoteEvents / RemoteFunctions, the MicroProfiler, custom Luau modules, StreamingEnabled, client-server architecture, object pooling, a Signal library and RunService.Heartbeat.',
      links: []
    },
    {
      id: 'languages',
      keys: ['language', 'languages', 'code', 'coding', 'lua', 'typescript', 'javascript', 'rust', 'webassembly', 'wasm', 'python', 'program'],
      phrases: ['programming language', 'what language'],
      answer: 'Luau is the main language. The portfolio site itself is built with HTML, CSS and JavaScript/TypeScript, with some WebAssembly-powered pieces.',
      links: [L.github]
    },
    {
      id: 'projects',
      keys: ['project', 'projects', 'work', 'portfolio', 'example', 'examples', 'sample', 'made', 'built', 'built', 'create', 'created', 'showcase', 'experience', 'testimonial', 'review'],
      phrases: ['past work', 'previous work', 'what have', 'show me', 'see your work', 'see their work'],
      answer: 'The best place to see real examples is the DevForum scripting portfolio. The site also mentions work like custom tweening modules, a Signal library, object pooling and network batching systems.',
      links: [L.portfolio, L.devforum]
    },
    {
      id: 'hire',
      keys: ['hire', 'hiring', 'commission', 'freelance', 'available', 'availability', 'price', 'prices', 'pricing', 'cost', 'rate', 'rates', 'pay', 'paid', 'quote', 'charge', 'fee', 'budget', 'afford', 'expensive', 'cheap', 'order', 'client', 'collab', 'collaborate', 'collaboration', 'opportunity'],
      phrases: ['work with', 'work for', 'open to', 'for hire', 'looking for', 'make me', 'build me', 'script me', 'can you make', 'can you build', 'can you script', 'take commission'],
      answer: 'I don\'t have anything about zurai02\'s availability or rates, since those aren\'t listed publicly. The best route is a message on Discord (' + DISCORD + ') or through the DevForum portfolio thread.',
      links: [L.portfolio]
    },
    {
      id: 'contact',
      keys: ['contact', 'reach', 'message', 'dm', 'touch', 'talk', 'speak', 'chat', 'social', 'socials', 'where', 'find', 'discord', 'username', 'tag', 'add'],
      phrases: ['get in touch', 'how do i', 'how can i', 'find you', 'find them', 'your discord', 'their discord'],
      answer: 'The quickest way is Discord: ' + DISCORD + ' (there\'s a tap-to-copy button on the site). You can also reach them through DevForum.',
      links: [L.devforum, L.portfolio, L.github]
    },
    {
      id: 'links',
      keys: ['link', 'links', 'url', 'website', 'site', 'github', 'devforum', 'forum', 'profile', 'profiles'],
      phrases: ['roblox profile', 'github profile'],
      answer: 'Here are the official places to find zurai02:',
      links: [L.portfolio, L.devforum, L.blog, L.github, L.roblox]
    },
    {
      id: 'blog',
      keys: ['blog', 'article', 'articles', 'post', 'posts', 'write', 'writing', 'tutorial', 'guide'],
      phrases: ['latest post'],
      answer: 'zurai02 blogs about Luau, systems programming and squeezing out frames.',
      links: [L.blog]
    },
    {
      id: 'verify',
      keys: ['verify', 'verification', 'legit', 'legitimate', 'fake', 'scam', 'scammer', 'scamming', 'impersonate', 'impersonating', 'impersonator', 'impersonation', 'official', 'authentic', 'genuine', 'trust'],
      phrases: ['is this real', 'is that real', 'real zurai02', 'the real', 'is it really', 'are you really', 'using your name', 'using their name', 'in your name', 'pretending to be'],
      answer: 'To make sure you\'re talking to the real zurai02, use the Discord handle ' + DISCORD + ' and the links on this site. Be careful with anyone offering work or trades from a different account.',
      links: [L.portfolio, L.devforum]
    },
    {
      id: 'site',
      keys: ['pwa', 'offline', 'install', 'particle', 'particles', 'animation', 'theme', 'design', 'source', 'repo', 'repository', 'maintenance'],
      phrases: ['how is this site', 'this website', 'this site', 'built this', 'made this', 'source code'],
      answer: 'This site is hand-built: particle background, typewriter hero, a live Luau terminal, glass cards and an installable PWA that works offline. The source is public on GitHub.',
      links: [L.github]
    },
    {
      id: 'private',
      keys: ['age', 'old', 'birthday', 'birth', 'born', 'name', 'real', 'country', 'city', 'location', 'live', 'address', 'phone', 'number', 'school', 'family', 'gender', 'married', 'girlfriend', 'boyfriend', 'salary', 'income', 'personal', 'private', 'nationality', 'timezone'],
      phrases: ['real name', 'how old', 'where do you live', 'where does', 'where are you from', 'phone number', 'full name', 'last name'],
      answer: 'I only share what zurai02 has made public on their portfolio, and personal details like that aren\'t part of it. I can tell you about their work, skills and how to get in touch.',
      links: []
    },
    {
      id: 'bot',
      keys: ['bot', 'chatbot', 'chatgpt', 'gpt', 'llm', 'robot', 'human', 'ai', 'assistant', 'automated'],
      phrases: ['who are you', 'what are you', 'are you a', 'are you real', 'are you ai', 'are you human', 'who made you', 'who built you', 'how do you work'],
      answer: 'I\'m a small assistant built into this site. I run entirely in your browser with a fixed set of answers about zurai02: no AI service is involved, and nothing you type is sent or saved anywhere.',
      links: []
    },
    {
      id: 'help',
      keys: ['help', 'ask', 'topics', 'options', 'menu', 'commands'],
      phrases: ['what can i ask', 'what can you do', 'what can you tell'],
      answer: 'You can ask me about zurai02\'s skills, tech stack, projects, blog, or how to get in touch. Tap a suggestion below, or type your own question.',
      links: []
    }
  ];

  /* Short conversational intents, checked before the KB. */
  var SMALLTALK = [
    { test: /^(hi|hello|hey|heya|hiya|yo|sup|hola|salam|assalam[a-z ]*|good (morning|afternoon|evening)|greetings)\b/,
      answer: 'Hey! Ask me anything about zurai02: what they do, their skills, their tech stack, or how to get in touch.' },
    { test: /^(thanks|thank you|thx|ty|cheers|appreciate)\b/,
      answer: 'You\'re welcome! Anything else you\'d like to know?' },
    { test: /^(bye|goodbye|cya|see ya|later|gn|good night)\b/,
      answer: 'See you around!' }
  ];

  var FALLBACK = 'I don\'t have an answer for that. I only know what\'s on zurai02\'s portfolio. Try asking about their skills, tech stack or how to get in touch.';

  var SUGGESTIONS = ['What do you do?', 'Skills', 'Tech stack', 'See their work', 'Contact'];

  /* ── Matching engine ──────────────────────────────────────────────────── */
  var STOP = {};
  ('a an the is are was were be been am do does did can could would should will you your yours he she they them their his her him it its i me my we our us ' +
   'of in on at to for with from by as and or but if so this that these those there here what whats who whos how hows when where why which tell please any ' +
   'has have had get know want about zurai zurai02 s t just really also very much more some').split(' ').forEach(function (w) { STOP[w] = 1; });

  function normalize(s) {
    return String(s).toLowerCase()
      .replace(/[‘’]/g, "'")
      .replace(/'/g, '')
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function stem(w) {
    if (w.length > 5 && /ing$/.test(w)) return w.slice(0, -3);
    if (w.length > 4 && /ed$/.test(w)) return w.slice(0, -2);
    if (w.length > 4 && /es$/.test(w)) return w.slice(0, -2);
    if (w.length > 3 && /s$/.test(w) && !/ss$/.test(w)) return w.slice(0, -1);
    return w;
  }

  function tokens(norm) {
    return norm.split(' ').filter(function (w) { return w && !STOP[w]; }).map(stem);
  }

  function within1(a, b) {
    if (a === b) return true;
    var la = a.length, lb = b.length;
    if (Math.abs(la - lb) > 1 || la < 5 || lb < 5) return false;
    var i = 0, j = 0, edits = 0;
    while (i < la && j < lb) {
      if (a[i] === b[j]) { i++; j++; continue; }
      if (++edits > 1) return false;
      /* swapped neighbours ("discrod" / "discord") count as one edit */
      if (la === lb && a[i] === b[j + 1] && a[i + 1] === b[j]) { i += 2; j += 2; continue; }
      if (la > lb) i++; else if (lb > la) j++; else { i++; j++; }
    }
    return edits + (la - i) + (lb - j) <= 1;
  }

  /* Pre-compute stemmed key sets once. */
  KB.forEach(function (e) {
    e._keys = {};
    e.keys.forEach(function (k) { e._keys[stem(k)] = 1; });
    e._keyList = Object.keys(e._keys);
  });

  function score(entry, norm, toks) {
    var s = 0, i;
    for (i = 0; i < entry.phrases.length; i++) {
      if ((' ' + norm + ' ').indexOf(' ' + entry.phrases[i] + ' ') !== -1) s += 4;
    }
    var seen = {};
    for (i = 0; i < toks.length; i++) {
      var t = toks[i];
      if (seen[t]) continue;
      seen[t] = 1;
      if (entry._keys[t]) { s += 2; continue; }
      for (var k = 0; k < entry._keyList.length; k++) {
        if (within1(t, entry._keyList[k])) { s += 2; break; }
      }
    }
    return s;
  }

  function answer(input) {
    var norm = normalize(input);
    if (!norm) return null;

    if (norm.split(' ').length <= 5) {
      for (var i = 0; i < SMALLTALK.length; i++) {
        if (SMALLTALK[i].test.test(norm)) return { text: SMALLTALK[i].answer, links: [], id: 'smalltalk' };
      }
    }

    var toks = tokens(norm);
    var best = null, bestScore = 0;
    for (var j = 0; j < KB.length; j++) {
      var sc = score(KB[j], norm, toks);
      if (sc > bestScore) { best = KB[j]; bestScore = sc; }
    }
    if (best && bestScore >= 2) return { text: best.answer, links: best.links, id: best.id };
    return { text: FALLBACK, links: [], id: 'fallback', chips: true };
  }

  /* Export for tests (Node) and stop here when there is no DOM. */
  if (typeof module !== 'undefined' && module.exports) module.exports = { answer: answer, KB: KB };
  if (typeof document === 'undefined') return;

  /* ── UI ────────────────────────────────────────────────────────────────── */
  var SVGNS = 'http://www.w3.org/2000/svg';

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  function icon(paths) {
    var svg = document.createElementNS(SVGNS, 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('width', '22');
    svg.setAttribute('height', '22');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', '2');
    svg.setAttribute('stroke-linecap', 'round');
    svg.setAttribute('stroke-linejoin', 'round');
    svg.setAttribute('aria-hidden', 'true');
    paths.forEach(function (d) {
      var p = document.createElementNS(SVGNS, 'path');
      p.setAttribute('d', d);
      svg.appendChild(p);
    });
    return svg;
  }

  var ICON_CHAT  = ['M21 11.5a8.5 8.5 0 0 1-12.6 7.4L3 20.5l1.6-5A8.5 8.5 0 1 1 21 11.5z'];
  var ICON_CLOSE = ['M18 6 6 18', 'm6 6 12 12'];
  var ICON_SEND  = ['M22 2 11 13', 'M22 2 15 22l-4-9-9-4 20-7z'];

  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function init() {
    if (document.getElementById('zc-root')) return;

    var root = el('div', 'zc-root'); root.id = 'zc-root';

    var toggle = el('button', 'zc-toggle');
    toggle.type = 'button';
    toggle.setAttribute('aria-label', 'Ask about zurai02');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-controls', 'zc-panel');
    toggle.appendChild(icon(ICON_CHAT));

    /* A div, not a <section>: the site styles bare `section` elements. */
    var panel = el('div', 'zc-panel');
    panel.id = 'zc-panel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-label', 'Chat about zurai02');
    panel.hidden = true;

    var head = el('div', 'zc-head');
    var titleWrap = el('div', 'zc-title');
    titleWrap.appendChild(el('span', 'zc-dot'));
    var tt = el('div');
    tt.appendChild(el('strong', null, 'Ask about zurai02'));
    tt.appendChild(el('small', null, 'Answers from the public portfolio'));
    titleWrap.appendChild(tt);
    var closeBtn = el('button', 'zc-icon-btn');
    closeBtn.type = 'button';
    closeBtn.setAttribute('aria-label', 'Close chat');
    closeBtn.appendChild(icon(ICON_CLOSE));
    head.appendChild(titleWrap);
    head.appendChild(closeBtn);

    var log = el('div', 'zc-log');
    log.setAttribute('role', 'log');
    log.setAttribute('aria-live', 'polite');
    log.setAttribute('aria-label', 'Conversation');

    var chips = el('div', 'zc-chips');

    var form = el('form', 'zc-form');
    form.autocomplete = 'off';
    var input = el('input', 'zc-input');
    input.type = 'text';
    input.id = 'zc-input';
    input.name = 'zc-question';
    input.maxLength = 200;
    input.placeholder = 'Ask a question…';
    input.setAttribute('aria-label', 'Your question');
    var send = el('button', 'zc-send');
    send.type = 'submit';
    send.setAttribute('aria-label', 'Send');
    send.appendChild(icon(ICON_SEND));
    form.appendChild(input);
    form.appendChild(send);

    panel.appendChild(head);
    panel.appendChild(log);
    panel.appendChild(chips);
    panel.appendChild(form);
    root.appendChild(panel);
    root.appendChild(toggle);
    document.body.appendChild(root);

    function scrollDown() { log.scrollTop = log.scrollHeight; }

    function addUser(text) {
      var row = el('div', 'zc-msg zc-user');
      row.appendChild(el('div', 'zc-bubble', text));
      log.appendChild(row);
      scrollDown();
    }

    function addBot(res) {
      var row = el('div', 'zc-msg zc-bot');
      var b = el('div', 'zc-bubble');
      res.text.split('\n').forEach(function (line) {
        if (line.trim()) b.appendChild(el('p', null, line));
      });
      if (res.links && res.links.length) {
        var wrap = el('div', 'zc-links');
        res.links.forEach(function (l) {
          var a = el('a', 'zc-link', l.label + ' ↗');
          a.href = l.href;
          a.target = '_blank';
          a.rel = 'noopener noreferrer';
          wrap.appendChild(a);
        });
        b.appendChild(wrap);
      }
      row.appendChild(b);
      log.appendChild(row);
      scrollDown();
    }

    function typing() {
      var row = el('div', 'zc-msg zc-bot zc-typing');
      var b = el('div', 'zc-bubble');
      b.setAttribute('aria-label', 'zurai02 assistant is typing');
      for (var i = 0; i < 3; i++) b.appendChild(el('span', 'zc-tdot'));
      row.appendChild(b);
      log.appendChild(row);
      scrollDown();
      return row;
    }

    function ask(q) {
      q = q.trim();
      if (!q) return;
      addUser(q);
      var res = answer(q);
      if (!res) return;
      var t = reduceMotion ? null : typing();
      window.setTimeout(function () {
        if (t) t.remove();
        addBot(res);
      }, reduceMotion ? 0 : 350 + Math.min(res.text.length * 3, 500));
    }

    SUGGESTIONS.forEach(function (s) {
      var c = el('button', 'zc-chip', s);
      c.type = 'button';
      c.addEventListener('click', function () { ask(s); input.focus(); });
      chips.appendChild(c);
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var v = input.value;
      input.value = '';
      ask(v);
    });

    var greeted = false;
    function open() {
      panel.hidden = false;
      toggle.setAttribute('aria-expanded', 'true');
      root.classList.add('zc-open');
      if (!greeted) {
        greeted = true;
        addBot({ text: 'Hi! I\'m a small assistant for zurai02\'s portfolio. Ask me about their work, skills or how to get in touch.', links: [] });
      }
      window.setTimeout(function () { input.focus(); }, 30);
    }
    function close() {
      panel.hidden = true;
      toggle.setAttribute('aria-expanded', 'false');
      root.classList.remove('zc-open');
      toggle.focus();
    }

    toggle.addEventListener('click', function () { panel.hidden ? open() : close(); });
    closeBtn.addEventListener('click', close);
    panel.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
