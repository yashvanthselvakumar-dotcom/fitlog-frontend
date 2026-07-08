/* ============================================================
   FitLog — Common Shared Script (MPA Auth & Roles Helper)
   ============================================================ */

let API_BASE = 'https://fitlog-backend-tv2v.onrender.com';
if (API_BASE.endsWith('/')) {
  API_BASE = API_BASE.slice(0, -1);
}

// Check Auth & Redirect if not logged in
const token = localStorage.getItem('fitlog_token');
const currentUser = JSON.parse(localStorage.getItem('fitlog_user') || 'null');
const isLoginPage = window.location.pathname.endsWith('index.html') || window.location.pathname.endsWith('/') || window.location.pathname === '';

if (!token && !isLoginPage) {
  window.location.href = 'index.html';
}

// Global initialization on DOM load
document.addEventListener('DOMContentLoaded', () => {
  if (isLoginPage) {
    if (token) window.location.href = 'dashboard.html';
    return;
  }
  
  // Populate sidebar user details
  if (currentUser) {
    document.getElementById('userName').textContent = currentUser.username;
    const displayRole = currentUser.role.replace('ROLE_', '').split('_').map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(' ');
    document.getElementById('userRole').textContent = displayRole;
    document.getElementById('userAvatar').textContent = currentUser.username.charAt(0).toUpperCase();
  }

  // Active state for sidebar navigation
  const currentFile = window.location.pathname.split('/').pop() || 'dashboard.html';
  document.querySelectorAll('.sidebar-nav .nav-item').forEach(item => {
    const itemHref = item.getAttribute('href');
    if (itemHref && currentFile.includes(itemHref)) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });

  // Role visibility checks
  updateRoleVisibility();
});

// Update Role Button Visibility (Frontend Enforcement)
function updateRoleVisibility() {
  if (!currentUser) return;
  const role = currentUser.role;
  const canWriteRoutines = role === 'ADMIN' || role === 'TRAINER';
  const canWriteFitness = role === 'ADMIN' || role === 'FITNESS_MEMBER';

  document.querySelectorAll('.role-write-routines').forEach(el => el.style.display = canWriteRoutines ? 'inline-flex' : 'none');
  document.querySelectorAll('.role-write-fitness').forEach(el => el.style.display = canWriteFitness ? 'inline-flex' : 'none');
}

// Generic API Fetch Wrapper
async function apiFetch(url, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${url}`, { ...options, headers });
  if (res.status === 401 || res.status === 403) {
    handleLogout();
    throw new Error('Unauthorized');
  }
  if (!res.ok) throw new Error((await res.text()) || 'Request failed');
  const text = await res.text();
  try { return JSON.parse(text); } catch { return text; }
}

// Check local storage details
function handleLogout() {
  localStorage.removeItem('fitlog_token');
  localStorage.removeItem('fitlog_user');
  window.location.href = 'index.html';
}

function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
}

// Toast System
function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  const icons = { success: '', error: '', info: '' };
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span>${icons[type] || ''}</span> ${escHtml(message)}`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('toast-exit');
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// Escapes
function escHtml(str) {
  const div = document.createElement('div'); div.textContent = str || ''; return div.innerHTML;
}
function escAttr(str) { return (str || '').replace(/"/g, '&quot;').replace(/'/g, '&#39;'); }
function todayStr() { return new Date().toISOString().split('T')[0]; }

function formatDate(dateStr) {
  if (!dateStr) return '—';
  try { return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); } catch { return dateStr; }
}
function formatDateShort(dateStr) {
  if (!dateStr) return '—';
  try { return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); } catch { return dateStr; }
}
