/* menu.js - SKELETON loading, LIVE SEARCH, category FILTER, MODAL, ADD TO CART */

const grid = document.getElementById('menu-grid');
const skeleton = document.getElementById('skeleton');
const searchInput = document.getElementById('search');
const suggestions = document.getElementById('suggestions');
const noResults = document.getElementById('no-results');
const filterButtons = document.querySelectorAll('#filters button');
const cards = Array.from(document.querySelectorAll('.menu-item'));

let activeCategory = 'all';

/* ---------- read the data of one card ---------- */
function cardData(card) {
  const name = card.querySelector('h3').textContent.trim();
  const priceText = card.querySelector('.add-btn').previousElementSibling.textContent;
  const img = card.querySelector('img');
  return {
    id: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'), // "Chicken Inasal" -> "chicken-inasal"
    name: name,
    desc: card.querySelector('p').textContent.trim(),
    price: Number(priceText.replace(/[^\d]/g, '')),     // "₱149" -> 149
    img: img ? img.getAttribute('src') : '',
    category: card.dataset.category
  };
}

/* ---------- 1. SKELETON LOADING ---------- */
// copy the one gray card so we have 6, show them, then swap in the real grid after 1.5 seconds
const skeletonCard = skeleton.firstElementChild;
for (let i = 0; i < 5; i++) {
  skeleton.appendChild(skeletonCard.cloneNode(true));
}
setTimeout(function () {
  skeleton.remove();
  grid.classList.remove('hidden');
}, 1500);

/* ---------- 2. SEARCH + FILTER ---------- */
// a card is shown only if it matches BOTH the category and the search text
function applyFilters() {
  const query = searchInput.value.trim().toLowerCase();
  let visible = 0;

  cards.forEach(function (card) {
    const data = cardData(card);
    const matchesCategory = activeCategory === 'all' || data.category === activeCategory;
    const matchesSearch = data.name.toLowerCase().includes(query) || data.desc.toLowerCase().includes(query);
    const show = matchesCategory && matchesSearch;
    card.classList.toggle('hidden', !show);
    if (show) visible++;
  });

  noResults.classList.toggle('hidden', visible !== 0);
}

function showSuggestions() {
  const query = searchInput.value.trim().toLowerCase();
  if (query === '') {
    suggestions.classList.add('hidden');
    return;
  }

  // up to 5 dish names that contain what the user typed
  const matches = cards
    .map(function (card) { return cardData(card).name; })
    .filter(function (name) { return name.toLowerCase().includes(query); })
    .slice(0, 5);

  if (matches.length === 0) {
    suggestions.classList.add('hidden');
    return;
  }

  suggestions.innerHTML = matches.map(function (name) {
    return '<li class="px-5 py-2 hover:bg-mist cursor-pointer">' + escapeHtml(name) + '</li>';
  }).join('');
  suggestions.classList.remove('hidden');
}

searchInput.addEventListener('input', function () {
  applyFilters();
  showSuggestions();
});

// clicking a suggestion fills the search box
suggestions.addEventListener('click', function (e) {
  const item = e.target.closest('li');
  if (!item) return;
  searchInput.value = item.textContent;
  suggestions.classList.add('hidden');
  applyFilters();
});

// clicking anywhere else closes the suggestions
document.addEventListener('click', function (e) {
  if (e.target !== searchInput && !suggestions.contains(e.target)) {
    suggestions.classList.add('hidden');
  }
});

filterButtons.forEach(function (button) {
  button.addEventListener('click', function () {
    activeCategory = button.dataset.filter;
    filterButtons.forEach(function (b) {
      const active = b === button;
      b.classList.toggle('bg-navyblue', active);
      b.classList.toggle('text-white', active);
      b.classList.toggle('bg-mist', !active);
    });
    applyFilters();
  });
});

/* ---------- 3. ADD TO CART ---------- */
function addAndNotify(data, button) {
  addToCart(data);
  showToast(data.name + ' added to cart');
  if (button) {
    const oldText = button.textContent;
    button.textContent = 'Added ✓';
    setTimeout(function () { button.textContent = oldText; }, 1000);
  }
}

cards.forEach(function (card) {
  card.querySelector('.add-btn').addEventListener('click', function (e) {
    addAndNotify(cardData(card), e.currentTarget);
  });
});

/* ---------- 4. MODAL ---------- */
const modal = document.getElementById('modal');
let modalItem = null; // the food currently shown in the modal

function openModal(data) {
  modalItem = data;
  document.getElementById('modal-img').src = data.img;
  document.getElementById('modal-img').alt = data.name;
  document.getElementById('modal-title').textContent = data.name;
  document.getElementById('modal-desc').textContent = data.desc;
  document.getElementById('modal-price').textContent = peso(data.price);
  modal.classList.remove('hidden');
}

function closeModal() {
  modal.classList.add('hidden');
}

// clicking the food picture opens the modal
cards.forEach(function (card) {
  card.querySelector('button[title="View details"]').addEventListener('click', function () {
    openModal(cardData(card));
  });
});

document.getElementById('close-modal').addEventListener('click', closeModal);

document.getElementById('modal-add').addEventListener('click', function () {
  addAndNotify(modalItem);
  closeModal();
});

// click on the dark background closes it too
modal.addEventListener('click', function (e) {
  if (e.target === modal) closeModal();
});

// Escape key closes it
document.addEventListener('keydown', function (e) {
  if (e.key === 'Escape') closeModal();
});
