/* Local-only social sign-in demo. No Google or Facebook authentication is performed. */

const socialLoginParams = new URLSearchParams(window.location.search);
const socialProvider = (socialLoginParams.get('provider') || '').toLowerCase();
const socialProviderNames = {
  google: 'Google',
  facebook: 'Facebook'
};
const socialProviderLogos = {
  google: 'images/signup_logo/google-logo.png',
  facebook: 'images/signup_logo/facebook_logo.png'
};
const socialProviderName = Object.prototype.hasOwnProperty.call(socialProviderNames, socialProvider)
  ? socialProviderNames[socialProvider]
  : '';
const returnPage = ['signin', 'signup'].includes(socialLoginParams.get('return'))
  ? socialLoginParams.get('return')
  : 'signin';

function initializeSocialLogin() {
  const returnLink = document.getElementById('return-link');
  const providerName = document.getElementById('provider-name');
  const providerLogo = document.getElementById('provider-logo');
  const accountsStep = document.getElementById('step-accounts');
  const permissionStep = document.getElementById('step-permission');
  const loadingStep = document.getElementById('step-loading');
  const anotherButton = document.getElementById('another-btn');
  const anotherForm = document.getElementById('another-form');
  const selectedInitial = document.getElementById('selected-initial');
  const selectedName = document.getElementById('selected-name');
  const selectedEmail = document.getElementById('selected-email');
  const allowButton = document.getElementById('allow-btn');
  let selectedAccount = null;

  document.title = 'Continue with ' + socialProviderName + ' | Sonic';
  providerName.textContent = socialProviderName;
  providerLogo.src = socialProviderLogos[socialProvider];
  providerLogo.alt = socialProviderName + ' logo';
  returnLink.href = returnPage + '.html';
  returnLink.textContent = returnPage === 'signup' ? 'Back to sign up' : 'Back to sign in';

  function showStep(step) {
    accountsStep.classList.toggle('hidden', step !== 'accounts');
    permissionStep.classList.toggle('hidden', step !== 'permission');
    loadingStep.classList.toggle('hidden', step !== 'loading');
  }

  function chooseAccount(name, email) {
    selectedAccount = {
      name: name.trim(),
      email: email.trim().toLowerCase()
    };
    selectedInitial.textContent = selectedAccount.name.charAt(0).toUpperCase();
    selectedName.textContent = selectedAccount.name;
    selectedEmail.textContent = selectedAccount.email;
    showStep('permission');
  }

  document.querySelectorAll('.account-btn').forEach(function (button) {
    button.addEventListener('click', function () {
      chooseAccount(button.dataset.name, button.dataset.email);
    });
  });

  anotherButton.addEventListener('click', function () {
    anotherForm.classList.remove('hidden');
    anotherForm.elements.fullname.focus();
  });

  clearErrorOnInput(anotherForm);
  anotherForm.addEventListener('submit', function (event) {
    event.preventDefault();

    const name = anotherForm.elements.fullname;
    const email = anotherForm.elements.email;
    const nameIsValid = name.value.trim().length >= 2;
    const emailIsValid = isValidEmail(email.value);
    setError(name, !nameIsValid);
    setError(email, !emailIsValid);
    if (!nameIsValid || !emailIsValid) return;

    chooseAccount(name.value, email.value);
  });

  document.getElementById('change-account-btn').addEventListener('click', function () {
    showStep('accounts');
  });

  function returnToAuthPage() {
    window.location.href = returnPage + '.html';
  }

  document.getElementById('cancel-btn').addEventListener('click', returnToAuthPage);

  allowButton.addEventListener('click', function () {
    if (!selectedAccount || allowButton.disabled) return;

    allowButton.disabled = true;
    const users = load(USERS_KEY, []);
    let account = users.find(function (user) {
      return user.email === selectedAccount.email;
    });

    if (!account) {
      account = {
        name: selectedAccount.name,
        email: selectedAccount.email,
        phone: '',
        password: '',
        demoProvider: socialProviderName
      };
      users.push(account);
      save(USERS_KEY, users);
    }

    localStorage.setItem(SESSION_KEY, account.email);
    showStep('loading');
    setTimeout(function () {
      window.location.href = 'menu.html';
    }, 1500);
  });
}

if (socialProviderName) {
  initializeSocialLogin();
} else {
  showToast('Choose Google or Facebook to continue.');
  window.location.replace('signin.html');
}
