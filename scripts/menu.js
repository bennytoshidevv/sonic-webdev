/* menu.js - SKELETON loading, LIVE SEARCH, category FILTER, MODAL, ADD TO CART */

const grid = document.getElementById('menu-grid');
const skeleton = document.getElementById('skeleton');
const searchInput = document.getElementById('search');
const suggestions = document.getElementById('suggestions');
const noResults = document.getElementById('no-results');
const filterButtons = document.querySelectorAll('#filters button');
const foodCategoryButtons = document.querySelectorAll('#food-filters button');
const cards = Array.from(document.querySelectorAll('.menu-item'));

const availableStores = Array.from(filterButtons).map(function (button) { return button.dataset.filter; });
const requestedStore = new URLSearchParams(window.location.search).get('store');
let activeStore = availableStores.includes(requestedStore) ? requestedStore : 'all';
let activeFoodCategory = 'all';

document.querySelectorAll('.store-photo img').forEach(function (image) {
  image.addEventListener('load', function () {
    image.classList.add('is-loaded');
  });
  image.addEventListener('error', function () {
    image.remove();
  });
  if (image.complete) {
    if (image.naturalWidth > 0) image.classList.add('is-loaded');
    else image.remove();
  }
});

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
    const matchesCategory = activeStore === 'all' || card.dataset.store === activeStore;
    const matchesFoodCategory = activeFoodCategory === 'all' || card.dataset.category === activeFoodCategory;
    const matchesSearch = data.name.toLowerCase().includes(query) || data.desc.toLowerCase().includes(query);
    const show = matchesCategory && matchesFoodCategory && matchesSearch;
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
    activeStore = button.dataset.filter;
    filterButtons.forEach(function (b) {
      const active = b === button;
      b.classList.toggle('is-active', active);
      b.setAttribute('aria-pressed', String(active));
    });
    applyFilters();
  });
});

foodCategoryButtons.forEach(function (button) {
  button.addEventListener('click', function () {
    activeFoodCategory = button.dataset.foodFilter;
    foodCategoryButtons.forEach(function (categoryButton) {
      const active = categoryButton === button;
      categoryButton.classList.toggle('bg-navyblue', active);
      categoryButton.classList.toggle('text-white', active);
      categoryButton.classList.toggle('bg-mist', !active);
      categoryButton.setAttribute('aria-pressed', String(active));
    });
    applyFilters();
  });
});

filterButtons.forEach(function (button) {
  const active = button.dataset.filter === activeStore;
  button.classList.toggle('is-active', active);
  button.setAttribute('aria-pressed', String(active));
});

foodCategoryButtons.forEach(function (button) {
  const active = button.dataset.foodFilter === activeFoodCategory;
  button.classList.toggle('bg-navyblue', active);
  button.classList.toggle('text-white', active);
  button.classList.toggle('bg-mist', !active);
  button.setAttribute('aria-pressed', String(active));
});

applyFilters();

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
