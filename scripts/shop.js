/* =========================================================
   shop.js  -  the whole transaction in ONE file:
     1. add food to the cart        (menu.html)
     2. show / change the cart      (cart.html)
     3. checkout and save the order (cart.html)

   HOW TO USE
   - On menu.html and cart.html load ONLY this file:
         <script src="js/shop.js"></script>
     (do not load common.js, menu.js or cart.js on those two pages,
      they do the same job and the buttons would fire twice)
   - track.html and orders.html still use common.js + their own file.
     shop.js saves data in the same format, so they keep working.

   DATA (saved in localStorage, no backend):
     sonic_cart       -> [ { id, name, price, img, qty }, ... ]
     sonic_orders     -> [ { id, createdAt, user, items, subtotal, fee, total, ... }, ... ]
     sonic_last_order -> id of the order just placed
   ========================================================= */

const CART_KEY = 'sonic_cart';
const ORDERS_KEY = 'sonic_orders';
const LAST_ORDER_KEY = 'sonic_last_order';
const SESSION_KEY = 'sonic_session';

const DELIVERY_FEE = 39;        // pesos
const FREE_DELIVERY_MIN = 300;  // delivery is free when the subtotal reaches this


/* ---------------------------------------------------------
   PART 1: CART DATA  (read, save, add, totals)
   --------------------------------------------------------- */

// read the cart array from localStorage (empty array if nothing saved yet)
function getCart() {
  return JSON.parse(localStorage.getItem(CART_KEY)) || [];
}

// save the cart array, then refresh the number in the navbar
function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  updateBadge();
}

// add ONE piece of food. If it is already in the cart, only increase its qty.
function addToCart(food) {
  const cart = getCart();
  const line = cart.find(function (item) { return item.id === food.id; });

  if (line) {
    line.qty = line.qty + 1;
  } else {
    cart.push({ id: food.id, name: food.name, price: food.price, img: food.img, qty: 1 });
  }
  saveCart(cart);
}

// subtotal = sum of (price x qty). Delivery is free at FREE_DELIVERY_MIN or more.
function getTotals(cart) {
  let subtotal = 0;
  cart.forEach(function (item) { subtotal = subtotal + item.price * item.qty; });

  let fee = DELIVERY_FEE;
  if (cart.length === 0 || subtotal >= FREE_DELIVERY_MIN) fee = 0;

  return { subtotal: subtotal, fee: fee, total: subtotal + fee };
}

// changes "Cart (0)" in the navbar to the real number of pieces
function updateBadge() {
  let count = 0;
  getCart().forEach(function (item) { count = count + item.qty; });
  document.querySelectorAll('header a[href="cart.html"]').forEach(function (link) {
    link.textContent = 'Cart (' + count + ')';
  });
}


/* ---------------------------------------------------------
   PART 2: MENU PAGE  - the "Add to cart" buttons
   --------------------------------------------------------- */

// menu.html starts with the food grid hidden (the skeleton loading in menu.js shows it later).
// Without menu.js nothing would reveal it, so show the grid right away here.
const menuGrid = document.getElementById('menu-grid');
if (menuGrid) {
  menuGrid.classList.remove('hidden');
  const skeletonBox = document.getElementById('skeleton');
  if (skeletonBox) skeletonBox.remove();
}

document.querySelectorAll('.menu-item').forEach(function (card) {
  const button = card.querySelector('.add-btn');
  if (!button) return;

  button.addEventListener('click', function () {
    const name = card.querySelector('h3').textContent.trim();
    const priceText = button.previousElementSibling.textContent;  // "₱149"
    const picture = card.querySelector('img');

    addToCart({
      id: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),  // "Chicken Inasal" -> "chicken-inasal"
      name: name,
      price: Number(priceText.replace(/[^\d]/g, '')),        // "₱149" -> 149
      img: picture ? picture.getAttribute('src') : ''
    });

    // tiny feedback on the button
    button.textContent = 'Added ✓';
    setTimeout(function () { button.textContent = 'Add to cart'; }, 1000);
  });
});


/* ---------------------------------------------------------
   PART 3: CART PAGE  - show items, + / - buttons, totals
   --------------------------------------------------------- */

const cartList = document.getElementById('cart-list');

function renderCart() {
  const cart = getCart();

  if (cart.length === 0) {
    cartList.innerHTML = '<li class="p-10 text-center font-bold">Your cart is empty. <a href="menu.html" class="underline">Browse the menu</a></li>';
  } else {
    let html = '';
    cart.forEach(function (item) {
      html += '<li class="p-4 flex items-center gap-4">' +
        '<div class="w-16 h-16 bg-calamansi/50 rounded-xl overflow-hidden">' +
        '<img src="' + item.img + '" alt="" class="w-full h-full object-cover"></div>' +
        '<div class="flex-1"><p class="font-bold">' + item.name + '</p>' +
        '<p class="text-sm text-ink/60">₱' + item.price + ' each</p></div>' +
        '<div class="flex items-center gap-2">' +
        '<button data-action="dec" data-id="' + item.id + '" class="w-8 h-8 rounded-full bg-mist">-</button>' +
        '<span>' + item.qty + '</span>' +
        '<button data-action="inc" data-id="' + item.id + '" class="w-8 h-8 rounded-full bg-mist">+</button></div>' +
        '<p class="w-16 text-right font-bold">₱' + (item.price * item.qty) + '</p>' +
        '</li>';
    });
    cartList.innerHTML = html;
  }

  const totals = getTotals(cart);
  document.getElementById('subtotal').textContent = '₱' + totals.subtotal;
  document.getElementById('fee').textContent = totals.fee === 0 && cart.length > 0 ? 'Free' : '₱' + totals.fee;
  document.getElementById('total').textContent = '₱' + totals.total;
}

if (cartList) {
  // one click listener for every + and - button in the list
  cartList.addEventListener('click', function (e) {
    const button = e.target.closest('button[data-action]');
    if (!button) return;

    let cart = getCart();
    const line = cart.find(function (item) { return item.id === button.dataset.id; });

    if (button.dataset.action === 'inc') line.qty = line.qty + 1;
    if (button.dataset.action === 'dec') line.qty = line.qty - 1;

    // qty 0 means remove the item
    cart = cart.filter(function (item) { return item.qty > 0; });
    saveCart(cart);
    renderCart();
  });

  renderCart();
}


/* ---------------------------------------------------------
   PART 4: CHECKOUT  - validate the form, save the order
   --------------------------------------------------------- */

const form = document.getElementById('checkout-form');

// yyyy-mm-dd of today in LOCAL time (the date picker needs this format)
function todayString() {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

// show or hide the red message under a field
function showError(input, show) {
  const message = input.closest('label').querySelector('.error');
  message.classList.toggle('hidden', !show);
  input.style.borderColor = show ? '#C8341F' : '';
}

if (form) {
  const dateInput = document.getElementById('delivery-date');
  dateInput.min = todayString();    // past days are greyed out in the date picker
  dateInput.value = todayString();  // default = today

  form.addEventListener('submit', function (e) {
    e.preventDefault();  // stop the page from reloading

    const name = form.elements.fullname;
    const phone = form.elements.phone;
    const address = form.elements.address;

    // 1. check every field
    const nameOk = name.value.trim().length >= 2;
    const phoneOk = /^\d{11}$/.test(phone.value.replace(/[\s-]/g, ''));  // exactly 11 digits
    const addressOk = address.value.trim().length >= 5;
    const dateOk = dateInput.value !== '' && dateInput.value >= todayString();  // not in the past

    showError(name, !nameOk);
    showError(phone, !phoneOk);
    showError(address, !addressOk);
    showError(dateInput, !dateOk);

    if (!(nameOk && phoneOk && addressOk && dateOk)) return;  // stop: something is wrong

    // 2. the cart must not be empty
    const cart = getCart();
    if (cart.length === 0) {
      alert('Your cart is empty.');
      return;
    }

    // 3. build the order and save it
    const orders = JSON.parse(localStorage.getItem(ORDERS_KEY)) || [];
    const totals = getTotals(cart);
    const order = {
      id: 'SN-' + (1024 + orders.length + 1),            // SN-1025, SN-1026, ...
      createdAt: Date.now(),                              // used by the progress bar on track.html
      user: localStorage.getItem(SESSION_KEY) || 'guest', // signed-in email, or "guest"
      items: cart,
      subtotal: totals.subtotal,
      fee: totals.fee,
      total: totals.total,
      name: name.value.trim(),
      phone: phone.value.trim(),
      address: address.value.trim(),
      deliveryDate: dateInput.value,
      payment: form.elements.payment.value,
      cancelled: false
    };
    orders.push(order);
    localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
    localStorage.setItem(LAST_ORDER_KEY, order.id);

    // 4. empty the cart and go to the tracking page
    saveCart([]);
    const button = document.getElementById('place-order');
    button.disabled = true;
    button.textContent = 'Placing order...';
    setTimeout(function () { window.location.href = 'track.html'; }, 1200);
  });
}

// show the right number in the navbar when the page opens
updateBadge();