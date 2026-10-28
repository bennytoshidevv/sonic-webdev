document.querySelectorAll('.faq-btn').forEach(function (button) {
  const panel = document.getElementById(button.getAttribute('aria-controls'));
  const indicator = button.querySelector('[aria-hidden="true"]');

  button.addEventListener('click', function () {
    const expanded = button.getAttribute('aria-expanded') === 'true';
    button.setAttribute('aria-expanded', String(!expanded));
    panel.classList.toggle('hidden', expanded);
    indicator.textContent = expanded ? '+' : '−';
  });
});
