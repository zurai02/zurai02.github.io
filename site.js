/* ============================================
   zurai02 blog — site.js
   Particles, typewriter, posts, admin, markdown
   ============================================ */

// ─── CONFIG ─────────────────────────────────
const CONFIG = {
  particleCount: window.matchMedia('(pointer: coarse)').matches ? 30 : 60,
  typewriterPhrases: [
    'building compilers.',
    'optimizing frames.',
    'writing Luazi.',
    'breaking limits.'
  ],
  greetingMessages: {
    morning: 'good morning,',
    afternoon: 'good afternoon,',
    evening: 'good evening,',
    night: 'still awake?'
  }
};

// ─── PARTICLE SYSTEM ─────────────────────────
class ParticleSystem {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.particles = [];
    this.resize();
    this.init();
    this.animate();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.w = this.canvas.width;
    this.h = this.canvas.height;
  }

  init() {
    this.particles = [];
    for (let i = 0; i < CONFIG.particleCount; i++) {
      this.particles.push({
        x: Math.random() * this.w,
        y: Math.random() * this.h,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        radius: Math.random() * 2 + 0.5,
        opacity: Math.random() * 0.4 + 0.1,
        phase: Math.random() * Math.PI * 2
      });
    }
  }

  animate() {
    this.ctx.clearRect(0, 0, this.w, this.h);
    const time = Date.now() * 0.001;

    this.particles.forEach((p, i) => {
      p.x += p.vx;
      p.y += p.vy;

      if (p.x < 0) p.x = this.w;
      if (p.x > this.w) p.x = 0;
      if (p.y < 0) p.y = this.h;
      if (p.y > this.h) p.y = 0;

      const pulse = Math.sin(time * 1.5 + p.phase) * 0.15 + 0.85;
      const alpha = p.opacity * pulse;

      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      this.ctx.fillStyle = `rgba(124, 92, 255, ${alpha})`;
      this.ctx.fill();
    });

    // Draw connections
    for (let i = 0; i < this.particles.length; i++) {
      for (let j = i + 1; j < this.particles.length; j++) {
        const dx = this.particles[i].x - this.particles[j].x;
        const dy = this.particles[i].y - this.particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 120) {
          const alpha = (1 - dist / 120) * 0.08;
          this.ctx.beginPath();
          this.ctx.moveTo(this.particles[i].x, this.particles[i].y);
          this.ctx.lineTo(this.particles[j].x, this.particles[j].y);
          this.ctx.strokeStyle = `rgba(124, 92, 255, ${alpha})`;
          this.ctx.lineWidth = 0.5;
          this.ctx.stroke();
        }
      }
    }

    requestAnimationFrame(() => this.animate());
  }
}

// ─── TYPEWRITER ──────────────────────────────
class Typewriter {
  constructor(element, phrases, speed = 80, deleteSpeed = 40, pause = 2000) {
    this.el = element;
    this.phrases = phrases;
    this.speed = speed;
    this.deleteSpeed = deleteSpeed;
    this.pause = pause;
    this.phraseIndex = 0;
    this.charIndex = 0;
    this.isDeleting = false;
    this.tick();
  }

  tick() {
    const current = this.phrases[this.phraseIndex];
    if (this.isDeleting) {
      this.el.textContent = current.substring(0, this.charIndex - 1);
      this.charIndex--;
    } else {
      this.el.textContent = current.substring(0, this.charIndex + 1);
      this.charIndex++;
    }

    let delay = this.isDeleting ? this.deleteSpeed : this.speed;

    if (!this.isDeleting && this.charIndex === current.length) {
      delay = this.pause;
      this.isDeleting = true;
    } else if (this.isDeleting && this.charIndex === 0) {
      this.isDeleting = false;
      this.phraseIndex = (this.phraseIndex + 1) % this.phrases.length;
      delay = 500;
    }

    setTimeout(() => this.tick(), delay);
  }
}

// ─── GREETING ────────────────────────────────
function setGreeting() {
  const hour = new Date().getHours();
  let key = 'night';
  if (hour >= 5 && hour < 12) key = 'morning';
  else if (hour >= 12 && hour < 17) key = 'afternoon';
  else if (hour >= 17 && hour < 22) key = 'evening';

  const el = document.getElementById('greeting');
  if (el) el.textContent = CONFIG.greetingMessages[key];
}

// ─── POSTS DATA ──────────────────────────────
let postsData = [];

async function loadPosts() {
  try {
    const res = await fetch('posts.json');
    postsData = await res.json();
    postsData.sort((a, b) => new Date(b.date) - new Date(a.date));
    return postsData;
  } catch (e) {
    console.error('Failed to load posts:', e);
    return [];
  }
}

function renderPostCard(post) {
  const excerpt = post.content
    .replace(/```[\s\S]*?```/g, '[code]')
    .replace(/[#*_`]/g, '')
    .substring(0, 140) + '...';

  const tagsHtml = post.tags.map(t => `<span class="tag">${t}</span>`).join('');

  return `
    <a href="post.html?id=${post.id}" class="post-card reveal">
      <div class="post-card-header">
        <span class="post-card-title">${escapeHtml(post.title)}</span>
        <span class="post-card-date">${post.date}</span>
      </div>
      <p class="post-card-excerpt">${escapeHtml(excerpt)}</p>
      <div class="post-card-tags">${tagsHtml}</div>
    </a>
  `;
}

async function renderPosts() {
  const posts = await loadPosts();
  const grid = document.getElementById('posts-grid');
  const count = document.getElementById('post-count');
  if (!grid) return;

  if (count) count.textContent = `${posts.length} total`;

  grid.innerHTML = posts.map(renderPostCard).join('');

  // Scroll reveal
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
}

// ─── SINGLE POST ─────────────────────────────
async function loadPost(postId) {
  const posts = await loadPosts();
  const post = posts.find(p => p.id === postId);
  if (!post) { location.href = '/'; return; }

  document.getElementById('page-title').textContent = `zurai02 — ${post.title}`;
  document.getElementById('post-title').textContent = post.title;
  document.getElementById('post-date').textContent = post.date;
  document.getElementById('post-tags').innerHTML = post.tags
    .map(t => `<span class="tag">${t}</span>`).join('');
  document.getElementById('post-content').innerHTML = markdownToHtml(post.content);
}

// ─── MARKDOWN PARSER ─────────────────────────
function markdownToHtml(md) {
  let html = md
    // Escape HTML
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    // Code blocks
    .replace(/```(lz|luau)?\n?([\s\S]*?)```/g, '<pre><code>$2</code></pre>')
    // Inline code
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    // Headers
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    // Bold
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    // Italic
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Blockquote
    .replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')
    // Lists
    .replace(/^\d+\. (.+)$/gm, '<li>$1</li>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    // Paragraphs
    .split('\n\n').map(p => {
      p = p.trim();
      if (!p) return '';
      if (p.startsWith('<h') || p.startsWith('<pre') || p.startsWith('<blockquote') || p.startsWith('<li')) {
        // Wrap consecutive li in ul
        if (p.startsWith('<li>')) {
          return '<ul>' + p + '</ul>';
        }
        return p;
      }
      return `<p>${p.replace(/\n/g, '<br>')}</p>`;
    }).join('\n')
    // Fix consecutive lists
    .replace(/<\/ul>\s*<ul>/g, '');

  return html;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// ─── ADMIN ───────────────────────────────────
// NOTE: In production, these checks MUST happen server-side.
// This client-side check is for demo/static hosting only.
// The .env file is NOT accessible from the browser.

const ADMIN_CREDS = {
  // These are placeholders. In a real setup, a backend reads .env
  // For static hosting, you'd use a serverless function or similar.
  email: 'admin@zurai02.dev',
  password: 'changeme123'
};

async function attemptLogin() {
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  const errorEl = document.getElementById('login-error');

  // Try to load real creds from a server endpoint if available
  // Fallback to hardcoded for static demo
  if (email === ADMIN_CREDS.email && password === ADMIN_CREDS.password) {
    localStorage.setItem('zurai_admin', 'true');
    document.getElementById('admin-login').style.display = 'none';
    document.getElementById('admin-dashboard').style.display = 'block';
    renderAdminPosts();
  } else {
    errorEl.textContent = 'invalid credentials';
    setTimeout(() => errorEl.textContent = '', 3000);
  }
}

async function renderAdminPosts() {
  const posts = await loadPosts();
  const list = document.getElementById('admin-posts-list');
  if (!list) return;

  list.innerHTML = posts.map(post => `
    <div class="admin-post-item">
      <div class="admin-post-info">
        <span class="admin-post-title">${escapeHtml(post.title)}</span>
        <span class="admin-post-date">${post.date} · ${post.id}</span>
      </div>
      <div class="admin-post-actions">
        <button class="btn-ghost btn-small" onclick="editPost('${post.id}')">edit</button>
        <button class="btn-ghost btn-small" onclick="deletePost('${post.id}')">delete</button>
      </div>
    </div>
  `).join('');
}

let editingId = null;

function showEditor(id = null) {
  editingId = id;
  const overlay = document.getElementById('editor-overlay');
  const label = document.getElementById('editor-title-label');
  overlay.style.display = 'flex';

  if (id) {
    label.textContent = 'edit post';
    const post = postsData.find(p => p.id === id);
    if (post) {
      document.getElementById('edit-id').value = post.id;
      document.getElementById('edit-title').value = post.title;
      document.getElementById('edit-date').value = post.date;
      document.getElementById('edit-tags').value = post.tags.join(', ');
      document.getElementById('edit-content').value = post.content;
    }
  } else {
    label.textContent = 'new post';
    document.getElementById('edit-id').value = '';
    document.getElementById('edit-title').value = '';
    document.getElementById('edit-date').value = new Date().toISOString().split('T')[0];
    document.getElementById('edit-tags').value = '';
    document.getElementById('edit-content').value = '';
  }
}

function closeEditor() {
  document.getElementById('editor-overlay').style.display = 'none';
  editingId = null;
}

function savePost() {
  const id = editingId || document.getElementById('edit-id').value.trim();
  const title = document.getElementById('edit-title').value.trim();
  const date = document.getElementById('edit-date').value;
  const tags = document.getElementById('edit-tags').value.split(',').map(t => t.trim()).filter(Boolean);
  const content = document.getElementById('edit-content').value;

  if (!id || !title || !content) {
    alert('id, title, and content are required');
    return;
  }

  const existingIndex = postsData.findIndex(p => p.id === id);
  const newPost = { id, title, date, tags, content };

  if (existingIndex >= 0) {
    postsData[existingIndex] = newPost;
  } else {
    postsData.push(newPost);
  }

  // In a real app, you'd POST this to a server to update posts.json
  // For static hosting, download the updated JSON:
  const blob = new Blob([JSON.stringify(postsData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'posts.json';
  a.click();
  URL.revokeObjectURL(url);

  closeEditor();
  renderAdminPosts();
  alert('posts.json downloaded. Replace the old one to update your blog.');
}

function editPost(id) {
  showEditor(id);
}

function deletePost(id) {
  if (!confirm('delete this post?')) return;
  postsData = postsData.filter(p => p.id !== id);

  const blob = new Blob([JSON.stringify(postsData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'posts.json';
  a.click();
  URL.revokeObjectURL(url);

  renderAdminPosts();
}

// ─── INIT ────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  // Particles
  const canvas = document.getElementById('particle-canvas');
  if (canvas) new ParticleSystem(canvas);

  // Greeting
  setGreeting();

  // Typewriter
  const tw = document.getElementById('typewriter');
  if (tw) new Typewriter(tw, CONFIG.typewriterPhrases);

  // Render posts on index
  if (document.getElementById('posts-grid')) {
    renderPosts();
  }

  // Admin enter key
  const loginPw = document.getElementById('login-password');
  if (loginPw) {
    loginPw.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') attemptLogin();
    });
  }
});
