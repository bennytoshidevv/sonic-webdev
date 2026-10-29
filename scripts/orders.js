const orderList = document.getElementById('order-list');
const emptyMessage = document.getElementById('orders-empty');
const orderFilters = document.querySelectorAll('[data-order-filter]');
let activeOrderFilter = 'All';

function orderStatusClasses(status) {
  if (status === 'Cancelled') return 'bg-red-50 text-chili';
  if (status === 'Delivered') return 'bg-blue-100 text-blue-950';
  return 'bg-calamansi text-ink';
}

function orderItemsSummary(items) {
  return items.map(function (item) {
    return escapeHtml(item.qty) + ' x ' + escapeHtml(item.name);
  }).join(', ');
}

function renderOrder(order, index) {
  const status = orderGroup(order);
  const detailsId = 'order-details-' + index;
  const total = Number(order.total);
  const deliveryFee = Number(order.fee);
  const summary = orderItemsSummary(order.items || []);

  return '<article class="order border border-blue-950/10 rounded-2xl p-5" data-status="' + status + '">' +
    '<div class="flex flex-wrap items-center justify-between gap-3">' +
      '<div><p class="font-bold">Order #' + escapeHtml(order.id) + '</p>' +
        '<p class="text-sm text-navyblue/60">' + escapeHtml(formatDateTime(order.createdAt)) + '</p></div>' +
      '<span class="text-sm font-semibold px-3 py-1 rounded-full ' + orderStatusClasses(status) + '">' + status + '</span>' +
      '<p class="font-bold">' + escapeHtml(peso(Number.isFinite(total) ? total : 0)) + '</p>' +
    '</div>' +
    '<p class="mt-2 text-sm text-navyblue/70">' + summary + '</p>' +
    '<div class="mt-4 flex flex-wrap gap-3">' +
      '<button type="button" class="details-btn text-sm font-semibold underline" aria-expanded="false" aria-controls="' + detailsId + '">View details</button>' +
      '<a href="menu.html" class="text-sm font-semibold bg-blue-950 text-white px-4 py-2 rounded-full hover:bg-blue-900">Reorder</a>' +
    '</div>' +
    '<div id="' + detailsId + '" class="details-panel hidden mt-4 border-t border-blue-950/10 pt-4 text-sm space-y-1 text-navyblue/70">' +
      '<p>Delivered to: ' + escapeHtml(order.address || 'Address not available') + '</p>' +
      '<p>Payment: ' + escapeHtml(order.payment || 'Not specified') + '</p>' +
      '<p>Delivery fee: ' + escapeHtml(peso(Number.isFinite(deliveryFee) ? deliveryFee : 0)) + '</p>' +
    '</div>' +
  '</article>';
}

function applyOrderFilter() {
  const visibleOrders = Array.from(orderList.children).filter(function (article) {
    return activeOrderFilter === 'All' || article.dataset.status === activeOrderFilter;
  });
  Array.from(orderList.children).forEach(function (article) {
    article.classList.toggle('hidden', activeOrderFilter !== 'All' && article.dataset.status !== activeOrderFilter);
  });

  if (orderList.children.length === 0) {
    emptyMessage.textContent = 'You have not placed any orders yet.';
    emptyMessage.classList.remove('hidden');
  } else if (visibleOrders.length === 0) {
    emptyMessage.textContent = 'No orders match this status.';
    emptyMessage.classList.remove('hidden');
  } else {
    emptyMessage.classList.add('hidden');
  }
}

function renderOrders() {
  orderList.innerHTML = myOrders().map(renderOrder).join('');
  applyOrderFilter();
}

orderFilters.forEach(function (button) {
  button.addEventListener('click', function () {
    activeOrderFilter = button.dataset.orderFilter;
    orderFilters.forEach(function (filter) {
      const active = filter === button;
      filter.classList.toggle('bg-blue-950', active);
      filter.classList.toggle('text-white', active);
      filter.classList.toggle('bg-blue-50', !active);
      filter.setAttribute('aria-pressed', String(active));
    });
    applyOrderFilter();
  });
});

orderList.addEventListener('click', function (event) {
  const button = event.target.closest('.details-btn');
  if (!button) return;

  const panel = document.getElementById(button.getAttribute('aria-controls'));
  const expanded = button.getAttribute('aria-expanded') === 'true';
  button.setAttribute('aria-expanded', String(!expanded));
  panel.classList.toggle('hidden', expanded);
  button.textContent = expanded ? 'View details' : 'Hide details';
});

renderOrders();
