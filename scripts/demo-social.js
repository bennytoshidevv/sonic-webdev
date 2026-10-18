/* Route social buttons into the local SSO demo. No external authentication is used. */

document.querySelectorAll('[data-demo-provider]').forEach(function (button) {
  button.addEventListener('click', function () {
    const provider = button.dataset.demoProvider.toLowerCase();
    const source = window.location.pathname.split('/').pop().replace('.html', '');
    const query = new URLSearchParams({ provider: provider, return: source });
    window.location.href = 'login-sso.html?' + query.toString();
  });
});
