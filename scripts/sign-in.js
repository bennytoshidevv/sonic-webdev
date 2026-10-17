/* signin.js - FORM VALIDATION for the sign in page.
   Accounts are created in signup.js and saved in localStorage (a prototype only: real sites never store passwords like this). */

const signinForm = document.getElementById('signin-form');

clearErrorOnInput(signinForm);

signinForm.addEventListener('submit', function (e) {
  e.preventDefault();

  const email = signinForm.elements.email;
  const password = signinForm.elements.password;

  const emailOk = isValidEmail(email.value);
  const passwordOk = password.value !== '';
  setError(email, !emailOk);
  setError(password, !passwordOk);
  if (!(emailOk && passwordOk)) return;

  // look for an account with this email and password
  const users = load(USERS_KEY, []);
  const account = users.find(function (u) {
    return u.email === email.value.trim().toLowerCase() && u.password === password.value;
  });

  if (!account) {
    setError(password, true, 'Wrong email or password.');
    return;
  }

  localStorage.setItem(SESSION_KEY, account.email); // this is the "logged in" flag
  showToast('Welcome back, ' + account.name.split(' ')[0] + '!');
  setTimeout(function () { window.location.href = 'menu.html'; }, 800);
});