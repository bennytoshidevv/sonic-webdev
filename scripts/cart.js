/* cart.js - show the cart, change quantities, validate the delivery form,
   DISABLE PAST DATES, and place the order (save it, then go to track.html) */

const cartList = document.getElementById('cart-list');
const form = document.getElementById('checkout-form');
const placeBtn = document.getElementById('place-order');
const dateInput = document.getElementById('delivery-date');

/* ---------- 1. draw the cart ---------- */
function renderCart() {
  const cart = getCart();
  const selectedItems = cart.filter(function (item) { return item.checkoutSelected !== false; });

  if (cart.length === 0) {
    cartList.innerHTML =
      '<li class="p-10 text-center">' +
      '<p class="text-4xl">🛒</p>' +
      '<p class="mt-2 font-bold">Your cart is empty</p>' +
      '<a href="menu.html" class="text-sm underline">Browse the menu</a>' +
      '</li>';
  } else {
    cartList.innerHTML = cart.map(function (item) {
      const picture = item.img
        ? '<img src="' + escapeHtml(item.img) + '" alt="' + escapeHtml(item.name) + '" class="w-full h-full object-cover">'
        : '🍽️';
      return (
        '<li class="p-4 flex items-center gap-4">' +
        '<input type="checkbox" data-action="select" data-id="' + escapeHtml(item.id) + '"' +
        (item.checkoutSelected === false ? '' : ' checked') +
        ' class="h-5 w-5 shrink-0 accent-blue-950" aria-label="Include ' + escapeHtml(item.name) + ' in checkout">' +
        '<div class="w-16 h-16 bg-calamansi/50 rounded-xl overflow-hidden grid place-items-center text-3xl">' + picture + '</div>' +
        '<div class="flex-1">' +
        '<p class="font-bold">' + escapeHtml(item.name) + '</p>' +
        '<p class="text-sm text-ink/60">' + peso(item.price) + ' each</p>' +
        '</div>' +
        '<div class="flex items-center gap-2">' +
        '<button data-action="dec" data-id="' + escapeHtml(item.id) + '" class="w-8 h-8 rounded-full bg-mist" aria-label="Decrease quantity">-</button>' +
        '<span>' + item.qty + '</span>' +
        '<button data-action="inc" data-id="' + escapeHtml(item.id) + '" class="w-8 h-8 rounded-full bg-mist" aria-label="Increase quantity">+</button>' +
        '</div>' +
        '<p class="w-16 text-right font-bold">' + peso(item.price * item.qty) + '</p>' +
        '</li>'
      );
    }).join('');
  }

  // summary box
  const totals = cartTotals(selectedItems);
  document.getElementById('subtotal').textContent = peso(totals.subtotal);
  document.getElementById('fee').textContent = totals.fee === 0 && selectedItems.length > 0 ? 'Free' : peso(totals.fee);
  document.getElementById('total').textContent = peso(totals.total);

  // cannot place an empty order or one with no selected items
  placeBtn.disabled = selectedItems.length === 0;
  placeBtn.classList.toggle('opacity-50', selectedItems.length === 0);
  placeBtn.classList.toggle('cursor-not-allowed', selectedItems.length === 0);
}

/* ---------- 2. + and - buttons (one listener for the whole list) ---------- */
cartList.addEventListener('change', function (e) {
  const checkbox = e.target.closest('input[data-action="select"]');
  if (!checkbox) return;

  const cart = getCart();
  const line = cart.find(function (item) { return item.id === checkbox.dataset.id; });
  if (!line) return;

  line.checkoutSelected = checkbox.checked;
  saveCart(cart);
  renderCart();
});

cartList.addEventListener('click', function (e) {
  const button = e.target.closest('button[data-action]');
  if (!button) return;

  let cart = getCart();
  const line = cart.find(function (l) { return l.id === button.dataset.id; });
  if (!line) return;

  if (button.dataset.action === 'inc') line.qty += 1;
  if (button.dataset.action === 'dec') line.qty -= 1;

  // quantity 0 removes the item
  cart = cart.filter(function (l) { return l.qty > 0; });
  saveCart(cart);
  renderCart();
});

/* ---------- 3. delivery date: no past dates ---------- */
dateInput.min = todayString();   // the date picker greys out earlier days
dateInput.value = todayString(); // default to today

/* ---------- 4. fill the form for signed-in users ---------- */
const user = currentUser();
if (user) {
  form.elements.fullname.value = user.name;
  form.elements.phone.value = user.phone || '';
  const lastOrder = myOrders()[0];
  if (lastOrder) form.elements.address.value = lastOrder.address;
}
clearErrorOnInput(form);

/* ---------- 5. validate + place order ---------- */
form.addEventListener('submit', function (e) {
  e.preventDefault();

  const name = form.elements.fullname;
  const phone = form.elements.phone;
  const address = form.elements.address;

  const nameOk = name.value.trim().length >= 2;
  const phoneOk = isValidPhone(phone.value);
  const addressOk = address.value.trim().length >= 5;
  // typed dates can still be in the past, so check again in JS (yyyy-mm-dd strings compare correctly)
  const dateOk = dateInput.value !== '' && dateInput.value >= todayString();

  setError(name, !nameOk);
  setError(phone, !phoneOk);
  setError(address, !addressOk);
  setError(dateInput, !dateOk);

  if (!(nameOk && phoneOk && addressOk && dateOk)) return;

  const cart = getCart();
  const selectedItems = cart.filter(function (item) { return item.checkoutSelected !== false; });
  if (selectedItems.length === 0) {
    showToast(cart.length === 0 ? 'Your cart is empty.' : 'Select at least one item to checkout.');
    return;
  }

  // build the order object and save it with the other orders
  const orders = getOrders();
  const totals = cartTotals(selectedItems);
  const order = {
    id: 'SN-' + (1024 + orders.length + 1),
    createdAt: Date.now(),
    user: userKey(),
    items: selectedItems,
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
  save(ORDERS_KEY, orders);
  localStorage.setItem(LAST_ORDER_KEY, order.id);
  saveCart(cart.filter(function (item) { return item.checkoutSelected === false; }));

  // small "loading" moment, then go to the tracking page
  placeBtn.disabled = true;
  placeBtn.textContent = 'Placing order...';
  setTimeout(function () { window.location.href = 'track.html'; }, 1200);
});

renderCart();
