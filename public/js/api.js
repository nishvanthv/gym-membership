const API = '/api';

function getToken() {
  return localStorage.getItem('token') || '';
}

function getUser() {
  const raw = localStorage.getItem('user');
  return raw ? JSON.parse(raw) : null;
}

function setSession(token, user) {
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
}

function clearSession() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}

function authHeader() {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function api(path, options = {}) {
  const res = await fetch(API + path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...authHeader(),
      ...(options.headers || {})
    }
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(body.message || 'Request failed');
  }
  return body;
}

function showAlert(id, message, ok = false) {
  const el = document.getElementById(id);
  if (!el) return;
  el.style.display = 'block';
  el.className = `alert ${ok ? 'alert-success' : 'alert-danger'}`;
  el.textContent = message;
}

function requireRole(roles) {
  const user = getUser();
  if (!user || !getToken() || !roles.includes(user.role)) {
    window.location.href = '/index.html';
  }
  return user;
}

function logout() {
  clearSession();
  window.location.href = '/index.html';
}
