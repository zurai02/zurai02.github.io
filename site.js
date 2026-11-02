/* ── 1. TOKENS & RESET ── */
:root {
  --bg: #07090e;
  --bg-2: #0b0f17;
  --panel: rgba(14, 18, 27, 0.78);
  --line: rgba(255, 255, 255, 0.08);
  --line-orange: rgba(255, 107, 53, 0.35);
  --text: #e9edf5;
  --muted: #8b95a7;
  --orange: #ff6b35;
  --orange-2: #ff8a50;
  --orange-3: #ffb27a;
  --green: #5fe3a1;
  --red: #ff5d6c;
  --amber: #ffcb6b;
  --soft: rgba(255, 255, 255, 0.04);
  --surface: rgba(10, 13, 20, 0.97);
  --topbar-from: rgba(7, 9, 14, 0.92);
  --topbar-to: rgba(7, 9, 14, 0);
  --on-orange: #1a0d05;
  --radius: 16px;
  --mono: ui-monospace, "JetBrains Mono", SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace;
  --sans: "Segoe UI", system-ui, -apple-system, BlinkMacSystemFont, "Helvetica Neue", Arial, sans-serif;
  color-scheme: dark;
}

*, *::before, *::after { box-sizing: border-box; }

html {
  scroll-behavior: smooth;
  scroll-padding-top: 84px;
  -webkit-text-size-adjust: 100%;
}

body {
  margin: 0;
  min-height: 100vh;
  background:
    radial-gradient(1100px 600px at 80% -10%, rgba(255, 107, 53, 0.10), transparent 60%),
    radial-gradient(900px 500px at -10% 110%, rgba(255, 138, 80, 0.07), transparent 60%),
    var(--bg);
  color: var(--text);
  font-family: var(--sans);
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
  overflow-x: hidden;
}

/* remaining CSS unchanged from the live stylesheet */
