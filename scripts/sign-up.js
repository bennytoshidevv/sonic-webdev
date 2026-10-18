/* signup.js - FORM VALIDATION for the sign up page.
   The new account is saved in localStorage (a prototype only: real sites never store passwords like this). */

const registerForm = document.getElementById('register-form');

clearErrorOnInput(registerForm);

registerForm.addEventListener('submit', function (e) {
  e.preventDefault();

  const name = registerForm.elements.fullname;
  const email = registerForm.elements.email;
  const phone = registerForm.elements.phone;
  const password = registerForm.elements.password;
  const confirm = registerForm.elements.confirm;

  const nameOk = name.value.trim().length >= 2;
  const emailOk = isValidEmail(email.value);
  const phoneOk = isValidPhone(phone.value);
  const passwordOk = password.value.length >= 8;
  const confirmOk = confirm.value === password.value && confirm.value !== '';

  setError(name, !nameOk);
  setError(email, !emailOk);
  setError(phone, !phoneOk);
  setError(password, !passwordOk);
  setError(confirm, !confirmOk);
  if (!(nameOk && emailOk && phoneOk && passwordOk && confirmOk)) return;

  const users = load(USERS_KEY, []);
  const newEmail = email.value.trim().toLowerCase();

  // one account per email
  if (users.some(function (u) { return u.email === newEmail; })) {
    setError(email, true, 'This email is already registered. Please sign in.');
    return;
  }

  users.push({
    name: name.value.trim(),
    email: newEmail,
    phone: phone.value.replace(/[\s-]/g, ''),
    password: password.value
  });
  save(USERS_KEY, users);

  showToast('Account created. Redirecting to sign in...');
  setTimeout(function () { window.location.href = 'signin.html?created=1'; }, 900);
});