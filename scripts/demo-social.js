/* Local-only Google/Facebook-style demo account flow. No external authentication is used. */

const demoSocialDialog = document.getElementById('demo-social-dialog');
const demoSocialForm = document.getElementById('demo-social-form');
const demoSocialProviderName = document.getElementById('demo-social-title');
const demoSocialDescription = document.getElementById('demo-social-description');
let selectedDemoProvider = '';

function closeDemoSocialDialog() {
  demoSocialDialog.classList.add('hidden');
  demoSocialForm.reset();
  demoSocialForm.querySelectorAll('input').forEach(function (input) {
    setError(input, false);
  });
}

document.querySelectorAll('[data-demo-provider]').forEach(function (button) {
  button.addEventListener('click', function () {
    selectedDemoProvider = button.dataset.demoProvider;
    demoSocialProviderName.textContent = 'Continue with demo ' + selectedDemoProvider + ' account';
    demoSocialDescription.textContent =
      'Demo only. This will not connect to ' + selectedDemoProvider + '. Enter a sample name and email; never enter your provider password.';
    demoSocialDialog.classList.remove('hidden');
    demoSocialForm.elements['demo-name'].focus();
  });
});

document.getElementById('cancel-demo-social').addEventListener('click', closeDemoSocialDialog);

demoSocialDialog.addEventListener('click', function (event) {
  if (event.target === demoSocialDialog) closeDemoSocialDialog();
});

document.addEventListener('keydown', function (event) {
  if (event.key === 'Escape' && !demoSocialDialog.classList.contains('hidden')) {
    closeDemoSocialDialog();
  }
});

clearErrorOnInput(demoSocialForm);

demoSocialForm.addEventListener('submit', function (event) {
  event.preventDefault();

  const name = demoSocialForm.elements['demo-name'];
  const email = demoSocialForm.elements['demo-email'];
  const trimmedName = name.value.trim();
  const normalizedEmail = email.value.trim().toLowerCase();
  const nameIsValid = trimmedName.length >= 2;
  const emailIsValid = isValidEmail(normalizedEmail);

  setError(name, !nameIsValid);
  setError(email, !emailIsValid);
  if (!nameIsValid || !emailIsValid) return;

  const users = load(USERS_KEY, []);
  let account = users.find(function (user) {
    return user.email === normalizedEmail;
  });

  if (!account) {
    account = {
      name: trimmedName,
      email: normalizedEmail,
      phone: '',
      password: '',
      demoProvider: selectedDemoProvider
    };
    users.push(account);
    save(USERS_KEY, users);
  }

  localStorage.setItem(SESSION_KEY, account.email);
  closeDemoSocialDialog();
  showToast('Demo account ready. Opening the menu...');
  setTimeout(function () {
    window.location.href = 'menu.html';
  }, 700);
});
