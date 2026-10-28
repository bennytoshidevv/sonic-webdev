document.querySelectorAll('.details-btn').forEach(function (button) {
  const panel = document.getElementById(button.getAttribute('aria-controls'));

  button.addEventListener('click', function () {
    const expanded = button.getAttribute('aria-expanded') === 'true';
    button.setAttribute('aria-expanded', String(!expanded));
    panel.classList.toggle('hidden', expanded);
    button.textContent = expanded ? 'View details' : 'Hide details';
  });
});
