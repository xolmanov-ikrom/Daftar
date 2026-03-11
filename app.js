// ===== STATE =====
let entries = JSON.parse(localStorage.getItem('daftar_entries') || '[]');
let categories = JSON.parse(localStorage.getItem('daftar_categories') || '[]');
let currentEntryId = null;
let currentFilter = 'all';
let currentScreen = 'home';
let previousScreen = 'home';

// ===== INIT =====
window.addEventListener('load', () => {
  // Splash screen
  setTimeout(() => {
    const splash = document.getElementById('splash');
    splash.classList.add('fade-out');
    setTimeout(() => {
      splash.classList.add('hidden');
      document.getElementById('app').classList.remove('hidden');
      renderHome();
      renderCategories();
      updateCategorySelects();
      setGreeting();
    }, 600);
  }, 1500);

  // Register service worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
});

// ===== GREETING =====
function setGreeting() {
  const h = new Date().getHours();
  let msg = '';
  if (h < 6)  msg = 'Yaxshi tun 🌙';
  else if (h < 12) msg = 'Xayrli tong ☀️';
  else if (h < 18) msg = 'Xayrli kun 🌤';
  else msg = 'Xayrli kech 🌇';
  document.getElementById('greeting-text').textContent = msg;
}

// ===== SCREEN NAVIGATION =====
function openScreen(name) {
  if (name === currentScreen) return;
  previousScreen = currentScreen;
  currentScreen = name;

  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById('screen-' + name).classList.add('active');

  // Topbar
  const titles = { home: 'Daftar', write: 'Yozuv', categories: 'Papkalar', search: 'Qidiruv' };
  document.getElementById('topbar-title').textContent = titles[name] || 'Daftar';

  const backBtn = document.getElementById('btn-back');
  const searchBtn = document.getElementById('btn-search-open');
  backBtn.classList.toggle('hidden', name === 'home');
  searchBtn.classList.toggle('hidden', name !== 'home');

  // Nav active
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  if (name === 'home') document.getElementById('nav-home').classList.add('active');
  if (name === 'categories') document.getElementById('nav-categories').classList.add('active');

  if (name === 'search') {
    setTimeout(() => document.getElementById('search-input').focus(), 300);
  }
}

function goBack() {
  if (currentScreen === 'write') {
    openScreen('home');
    renderHome();
  } else {
    openScreen('home');
  }
}

// ===== ENTRIES =====
function save() {
  localStorage.setItem('daftar_entries', JSON.stringify(entries));
}

function newEntry() {
  currentEntryId = null;
  document.getElementById('write-title').value = '';
  document.getElementById('write-body').value = '';
  document.getElementById('write-reminder').value = '';
  document.getElementById('btn-delete-entry').classList.add('hidden');
  updateCategorySelects();
  document.getElementById('write-category').value = '';

  const now = new Date();
  document.getElementById('write-date').textContent =
    now.toLocaleDateString('uz-UZ', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  openScreen('write');
  setTimeout(() => document.getElementById('write-title').focus(), 300);
}

function editEntry(id) {
  const entry = entries.find(e => e.id === id);
  if (!entry) return;
  currentEntryId = id;

  document.getElementById('write-title').value = entry.title;
  document.getElementById('write-body').value = entry.body;
  document.getElementById('write-reminder').value = entry.reminder || '';
  document.getElementById('btn-delete-entry').classList.remove('hidden');
  updateCategorySelects();
  document.getElementById('write-category').value = entry.category || '';

  const d = new Date(entry.date);
  document.getElementById('write-date').textContent =
    d.toLocaleDateString('uz-UZ', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  openScreen('write');
}

function saveEntry() {
  const title = document.getElementById('write-title').value.trim();
  const body  = document.getElementById('write-body').value.trim();
  const category = document.getElementById('write-category').value;
  const reminder = document.getElementById('write-reminder').value;

  if (!title && !body) { showToast('Yozuv bo\'sh bo\'lmasin!'); return; }

  if (currentEntryId) {
    const idx = entries.findIndex(e => e.id === currentEntryId);
    if (idx > -1) {
      entries[idx] = { ...entries[idx], title: title || 'Sarlavsiz', body, category, reminder, updatedAt: Date.now() };
    }
    showToast('✓ Saqlandi');
  } else {
    entries.unshift({
      id: Date.now().toString(),
      title: title || 'Sarlavsiz',
      body,
      category,
      reminder,
      date: new Date().toISOString(),
      updatedAt: Date.now()
    });
    showToast('✓ Yangi yozuv saqlandi');
  }

  save();
  openScreen('home');
  renderHome();
}

function deleteCurrentEntry() {
  if (!currentEntryId) return;
  if (!confirm('Bu yozuvni o\'chirasizmi?')) return;
  entries = entries.filter(e => e.id !== currentEntryId);
  save();
  currentEntryId = null;
  showToast('🗑 O\'chirildi');
  openScreen('home');
  renderHome();
}

// ===== RENDER HOME =====
function renderHome() {
  const list = document.getElementById('entries-list');
  const empty = document.getElementById('empty-state');

  let filtered = currentFilter === 'all'
    ? entries
    : entries.filter(e => e.category === currentFilter);

  if (filtered.length === 0) {
    list.innerHTML = '';
    list.appendChild(empty);
    empty.classList.remove('hidden');
    return;
  }

  empty.classList.add('hidden');

  list.innerHTML = filtered.map(e => {
    const d = new Date(e.date);
    const dateStr = d.toLocaleDateString('uz-UZ', { day: 'numeric', month: 'short', year: 'numeric' });
    const preview = e.body ? e.body.slice(0, 100) : '';
    const catBadge = e.category ? `<span class="entry-card-cat">📁 ${e.category}</span>` : '';
    return `
      <div class="entry-card" onclick="editEntry('${e.id}')">
        <div class="entry-card-header">
          <div class="entry-card-title">${escHtml(e.title)}</div>
          <div class="entry-card-date">${dateStr}</div>
        </div>
        ${preview ? `<div class="entry-card-body">${escHtml(preview)}</div>` : ''}
        ${catBadge}
      </div>`;
  }).join('');
}

// ===== CATEGORIES =====
function filterByCategory(cat, btn) {
  currentFilter = cat;
  document.querySelectorAll('#category-pills .pill').forEach(p => p.classList.remove('active'));
  btn.classList.add('active');
  renderHome();
}

function renderCategoryPills() {
  const container = document.getElementById('category-pills');
  container.innerHTML = `<button class="pill ${currentFilter === 'all' ? 'active' : ''}" data-cat="all" onclick="filterByCategory('all', this)">Barchasi</button>`;
  categories.forEach(cat => {
    const active = currentFilter === cat ? 'active' : '';
    container.innerHTML += `<button class="pill ${active}" data-cat="${escHtml(cat)}" onclick="filterByCategory('${escHtml(cat)}', this)">${escHtml(cat)}</button>`;
  });
}

function updateCategorySelects() {
  const sel = document.getElementById('write-category');
  const current = sel.value;
  sel.innerHTML = '<option value="">Kategoriyasiz</option>';
  categories.forEach(cat => {
    const opt = document.createElement('option');
    opt.value = cat;
    opt.textContent = cat;
    sel.appendChild(opt);
  });
  sel.value = current;
}

function addCategory() {
  const input = document.getElementById('new-cat-input');
  const name = input.value.trim();
  if (!name) return;
  if (categories.includes(name)) { showToast('Bu kategoriya mavjud!'); return; }
  categories.push(name);
  localStorage.setItem('daftar_categories', JSON.stringify(categories));
  input.value = '';
  renderCategories();
  renderCategoryPills();
  updateCategorySelects();
  showToast(`📁 "${name}" qo'shildi`);
}

function deleteCategory(cat) {
  if (!confirm(`"${cat}" kategoriyasini o'chirasizmi?`)) return;
  categories = categories.filter(c => c !== cat);
  localStorage.setItem('daftar_categories', JSON.stringify(categories));
  // Remove category from entries
  entries = entries.map(e => e.category === cat ? { ...e, category: '' } : e);
  save();
  renderCategories();
  renderCategoryPills();
  updateCategorySelects();
  if (currentFilter === cat) { currentFilter = 'all'; renderHome(); }
  showToast(`🗑 "${cat}" o'chirildi`);
}

function renderCategories() {
  const list = document.getElementById('cat-list');
  if (categories.length === 0) {
    list.innerHTML = '<div class="empty-state"><div class="empty-icon">📂</div><p>Hali kategoriya yo\'q</p></div>';
    return;
  }
  list.innerHTML = categories.map(cat => {
    const count = entries.filter(e => e.category === cat).length;
    return `
      <div class="cat-item">
        <div class="cat-item-left">
          <div class="cat-dot"></div>
          <span class="cat-name">${escHtml(cat)}</span>
          <span class="cat-count">${count} ta yozuv</span>
        </div>
        <button class="btn-delete-cat" onclick="deleteCategory('${escHtml(cat)}')">×</button>
      </div>`;
  }).join('');
  renderCategoryPills();
}

// ===== SEARCH =====
function doSearch() {
  const q = document.getElementById('search-input').value.trim().toLowerCase();
  const results = document.getElementById('search-results');

  if (!q) {
    results.innerHTML = '<div class="empty-state"><div class="empty-icon">🔎</div><p>Qidirish uchun yozing...</p></div>';
    return;
  }

  const found = entries.filter(e =>
    e.title.toLowerCase().includes(q) || e.body.toLowerCase().includes(q)
  );

  if (found.length === 0) {
    results.innerHTML = '<div class="empty-state"><div class="empty-icon">😕</div><p>Hech narsa topilmadi</p></div>';
    return;
  }

  results.innerHTML = found.map(e => {
    const d = new Date(e.date);
    const dateStr = d.toLocaleDateString('uz-UZ', { day: 'numeric', month: 'short' });
    const body = e.body ? highlight(e.body.slice(0, 100), q) : '';
    return `
      <div class="entry-card" onclick="editEntry('${e.id}')">
        <div class="entry-card-header">
          <div class="entry-card-title">${highlight(escHtml(e.title), q)}</div>
          <div class="entry-card-date">${dateStr}</div>
        </div>
        ${body ? `<div class="entry-card-body">${body}</div>` : ''}
      </div>`;
  }).join('');
}

function highlight(text, q) {
  const re = new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  return text.replace(re, '<mark style="background:var(--gold);color:#0f0e0c;border-radius:2px;padding:0 2px">$1</mark>');
}

// ===== REMINDERS =====
function setReminder() {
  const time = document.getElementById('write-reminder').value;
  if (!time) { showToast('Vaqt tanlang!'); return; }

  if (!('Notification' in window)) { showToast('Brauzeringiz bildirishnomalarni qo\'llab-quvvatlamaydi'); return; }

  Notification.requestPermission().then(perm => {
    if (perm === 'granted') {
      scheduleNotification(time);
      showToast(`⏰ Eslatma ${time} ga o'rnatildi`);
    } else {
      showToast('Bildirishnoma ruxsati berilmadi');
    }
  });
}

function scheduleNotification(timeStr) {
  const [h, m] = timeStr.split(':').map(Number);
  const now = new Date();
  const target = new Date();
  target.setHours(h, m, 0, 0);
  if (target <= now) target.setDate(target.getDate() + 1);
  const delay = target - now;

  setTimeout(() => {
    new Notification('Daftar ⏰', {
      body: 'Bugungi kundalikni yozishni unutmang!',
      icon: 'icons/icon-192.png'
    });
  }, delay);
}

// ===== TOAST =====
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.remove('hidden');
  t.classList.add('show');
  setTimeout(() => {
    t.classList.remove('show');
    setTimeout(() => t.classList.add('hidden'), 300);
  }, 2200);
}

// ===== UTILS =====
function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Enter key on new category
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('new-cat-input')?.addEventListener('keydown', e => {
    if (e.key === 'Enter') addCategory();
  });
});
