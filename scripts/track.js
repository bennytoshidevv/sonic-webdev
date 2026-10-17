/* track.js - LOADING SPINNER and PROGRESS BAR for the latest order.
   The progress comes from time: 0% when the order is placed, 100% after ORDER_DURATION (60 seconds, see common.js).
   Because it is calculated from the saved time, refreshing the page does not restart it. */

const params = new URLSearchParams(window.location.search);
const wantedId = params.get('id') || localStorage.getItem(LAST_ORDER_KEY);

// find the order: the one in the link / just placed, otherwise the newest of this user
let order = getOrders().find(function (o) { return o.id === wantedId; });
if (!order) order = myOrders()[0];

const tracker = document.getElementById('tracker');
const noOrder = document.getElementById('no-order');
const spinner = document.getElementById('spinner');
const bar = document.getElementById('bar');
const percent = document.getElementById('percent');
const steps = document.querySelectorAll('#steps li');

const titles = [
  'We received your order',
  'Your meal is being prepared',
  'Your food is on the way',
  'Your food has arrived'
];

if (!order) {
  // nothing to track yet
  tracker.classList.add('hidden');
  noOrder.classList.remove('hidden');
} else {
  document.getElementById('order-label').textContent = 'Order #' + order.id;

  function update() {
    // re-read the order so a cancel from another tab is noticed
    const fresh = getOrders().find(function (o) { return o.id === order.id; });
    if (fresh) order = fresh;

    const p = orderProgress(order);
    const stage = orderStage(order);

    bar.style.width = p + '%';
    percent.textContent = p + '%';

    if (order.cancelled) {
      document.getElementById('status-title').textContent = 'This order was cancelled';
      document.getElementById('eta').textContent = 'You can order again from the menu.';
    } else {
      document.getElementById('status-title').textContent = titles[stage];
      // the demo runs in 60 seconds, so we scale it to a 25 minute delivery for the text
      const minutesLeft = Math.ceil((100 - p) / 100 * 25);
      document.getElementById('eta').textContent =
        stage === 3 ? 'Enjoy your meal!' : 'Estimated arrival in ' + minutesLeft + ' minutes.';
    }

    // style each step: done (check mark), current (yellow), or waiting (faded)
    steps.forEach(function (li, i) {
      const circle = li.querySelector('span');
      const done = !order.cancelled && (i < stage || stage === 3);
      const current = !order.cancelled && i === stage && stage < 3;

      li.classList.toggle('opacity-50', !done && !current);
      circle.textContent = done ? '✓' : String(i + 1);
      circle.className = 'w-10 h-10 rounded-full grid place-items-center font-bold ' +
        (done ? 'bg-blue-950 text-white' : current ? 'bg-calamansi text-ink' : 'bg-mist');
    });

    // stop updating when the order is finished
    if (p >= 100 || order.cancelled) clearInterval(refreshTimer);
  }

  // start the one-second timer first, then draw once right away
  // (update() stops the timer by itself when the order is finished)
  var refreshTimer = setInterval(update, 1000);
  update();

  // spinner: "checking the latest status..." for 1.5 seconds, then hide
  setTimeout(function () { spinner.classList.add('hidden'); }, 1500);
}
