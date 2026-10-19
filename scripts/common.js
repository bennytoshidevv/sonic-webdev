/* =========================================================
   common.js  -  shared helpers. Load this FIRST on every page.
   Everything is saved in localStorage (no backend):
     sonic_cart     -> array of items in the cart
     sonic_orders   -> array of placed orders
     sonic_users    -> array of registered accounts
     sonic_session  -> email of the signed-in user
     sonic_last_order -> id of the order just placed
   ========================================================= */

const CART_KEY = 'sonic_cart';
const ORDERS_KEY = 'sonic_orders';
const USERS_KEY = 'sonic_users';
const SESSION_KEY = 'sonic_session';
const LAST_ORDER_KEY = 'sonic_last_order';

const DELIVERY_FEE = 39;          // pesos
const FREE_DELIVERY_MIN = 300;    // free delivery when subtotal is at least this
const ORDER_DURATION = 60000;     // demo: an order is "delivered" 60 seconds after it is placed

/* ---------- localStorage helpers ---------- */
function load(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) {
    return fallback;
  }
}

function save(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

/* ---------- small utilities ---------- */
function peso(n) {
  return '₱' + n;
}

// stops text from being treated as HTML when we build markup with template strings
function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// today as yyyy-mm-dd in the user's LOCAL time (toISOString would use UTC and can be off by a day)
function todayString() {
  const d = new Date();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return d.getFullYear() + '-' + month + '-' + day;
}

function formatDateTime(timestamp) {
  return new Date(timestamp).toLocaleString('en-PH', {
    month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit'
  });
}

/* ---------- validation helpers ---------- */
function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function isValidPhone(value) {
  // allow spaces and dashes, then require exactly 11 digits
  return /^\d{11}$/.test(value.replace(/[\s-]/g, ''));
}

// shows or hides the red message (<p class="error">) inside the same <label> as the input
function setError(input, show, message) {
  const holder = input.closest('label') || input.parentElement;
  const err = holder.querySelector('.error');
  if (!err) return;
  if (!err.dataset.defaultText) err.dataset.defaultText = err.textContent;
  err.textContent = message || err.dataset.defaultText;
  err.classList.toggle('hidden', !show);
  input.style.borderColor = show ? '#C8341F' : '';
}

// clear the error as soon as the user starts typing again
function clearErrorOnInput(form) {
  form.querySelectorAll('input, textarea, select').forEach(function (field) {
    field.addEventListener('input', function () {
      setError(field, false);
    });
  });
}

/* ---------- toast (little message at the bottom) ---------- */
function showToast(message) {
  const toast = document.createElement('div');
  toast.textContent = message;
  toast.className = 'fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-blue-950 text-white text-sm font-medium px-5 py-3 rounded-full shadow-lg';
  document.body.appendChild(toast);
  setTimeout(function () { toast.remove(); }, 2000);
}

/* ---------- cart ---------- */
function getCart() {
  return load(CART_KEY, []);
}

function saveCart(cart) {
  save(CART_KEY, cart);
  updateCartBadge();
}

// item = { id, name, price, img }
function addToCart(item) {
  const cart = getCart();
  const existing = cart.find(function (line) { return line.id === item.id; });
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({ id: item.id, name: item.name, price: item.price, img: item.img, qty: 1 });
  }
  saveCart(cart);
}

function cartCount() {
  return getCart().reduce(function (sum, line) { return sum + line.qty; }, 0);
}

function cartTotals(items) {
  const subtotal = items.reduce(function (sum, line) { return sum + line.price * line.qty; }, 0);
  let fee = DELIVERY_FEE;
  if (items.length === 0 || subtotal >= FREE_DELIVERY_MIN) fee = 0;
  return { subtotal: subtotal, fee: fee, total: subtotal + fee };
}

// changes the "Cart (2)" link in the navbar
function updateCartBadge() {
  document.querySelectorAll('header a[href="cart.html"]').forEach(function (link) {
    link.textContent = 'Cart (' + cartCount() + ')';
  });
}

/* ---------- accounts ---------- */
function currentUser() {
  const email = localStorage.getItem(SESSION_KEY);
  if (!email) return null;
  return load(USERS_KEY, []).find(function (u) { return u.email === email; }) || null;
}

// orders are stored with the owner's email, or "guest" when nobody is signed in
function userKey() {
  const user = currentUser();
  return user ? user.email : 'guest';
}

// turns the "Sign In" item in the navbar into "Sign out (Name)" when someone is signed in
function setupAuthLink() {
  const nav = document.querySelector('header nav');
  if (!nav) return;
  const el = Array.from(nav.querySelectorAll('a, button')).find(function (e) {
    const label = e.textContent.trim().toLowerCase();
    return label === 'sign in' || label === 'get started';
  });
  if (!el) return;
  const user = currentUser();
  if (user) {
    el.textContent = 'Sign out (' + user.name.split(' ')[0] + ')';
    el.setAttribute('href', '#');
    const logoutDialog = document.createElement('dialog');
    logoutDialog.className = 'w-full max-w-md rounded-3xl bg-white p-6 text-navyblue shadow-xl backdrop:bg-navyblue/60';
    logoutDialog.setAttribute('aria-labelledby', 'logout-dialog-title');
    logoutDialog.innerHTML =
      '<h2 id="logout-dialog-title" class="font-display text-2xl font-bold">Sign out?</h2>' +
      '<p class="mt-2 text-sm text-navyblue/70">Are you sure you want to log out of your account?</p>' +
      '<div class="mt-6 flex justify-end gap-3">' +
        '<button type="button" data-logout-cancel class="rounded-full border border-navyblue/20 px-5 py-3 font-semibold hover:bg-blue-50">Cancel</button>' +
        '<button type="button" data-logout-confirm class="rounded-full bg-blue-950 px-5 py-3 font-bold text-white hover:bg-blue-900">Sign out</button>' +
      '</div>';
    document.body.appendChild(logoutDialog);

    const cancelLogoutButton = logoutDialog.querySelector('[data-logout-cancel]');
    const confirmLogoutButton = logoutDialog.querySelector('[data-logout-confirm]');
    cancelLogoutButton.addEventListener('click', function () {
      logoutDialog.close();
    });
    confirmLogoutButton.addEventListener('click', function () {
      localStorage.removeItem(SESSION_KEY);
      window.location.href = 'home.html';
    });
    logoutDialog.addEventListener('click', function (event) {
      if (event.target === logoutDialog) logoutDialog.close();
    });
    logoutDialog.addEventListener('close', function () {
      el.focus();
    });
    el.addEventListener('click', function (e) {
      e.preventDefault();
      logoutDialog.showModal();
      cancelLogoutButton.focus();
    });
  } else if (el.tagName === 'BUTTON') {
    el.addEventListener('click', function () { window.location.href = 'signin.html'; });
  }
}

function requireAuthentication() {
  const protectedPages = ['menu.html', 'cart.html', 'track.html', 'orders.html', 'contact.html'];
  const page = window.location.pathname.split('/').pop().toLowerCase();
  if (protectedPages.includes(page) && !currentUser()) {
    window.location.replace('signup.html');
  }
}

/* ---------- orders ---------- */
function getOrders() {
  return load(ORDERS_KEY, []);
}

// newest first, only the current user's orders
function myOrders() {
  return getOrders()
    .filter(function (o) { return o.user === userKey(); })
    .sort(function (a, b) { return b.createdAt - a.createdAt; });
}

// 0 to 100, based on how much time passed since the order was placed
function orderProgress(order) {
  if (order.cancelled) return 0;
  return Math.min(100, Math.round((Date.now() - order.createdAt) / ORDER_DURATION * 100));
}

// 0 = received, 1 = preparing, 2 = out for delivery, 3 = delivered
function orderStage(order) {
  const p = orderProgress(order);
  if (p >= 100) return 3;
  if (p >= 50) return 2;
  if (p >= 25) return 1;
  return 0;
}

// used by the My orders page: "On the way" | "Delivered" | "Cancelled"
function orderGroup(order) {
  if (order.cancelled) return 'Cancelled';
  return orderStage(order) === 3 ? 'Delivered' : 'On the way';
}

/* ---------- run on every page ---------- */
updateCartBadge();
setupAuthLink();
requireAuthentication();
