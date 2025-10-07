import { login, startGuest, readAuthError } from "../common/authService.js";
import { redirectIfAuthenticated } from "../common/pageGuard.js";

initLoginPage();

async function initLoginPage() {
  await redirectIfAuthenticated("./summary.html");
  bindLoginForm();
  bindGuestButton();
  bindSignupButton();
  runIntroAnimation();
}

function bindLoginForm() {
  const form = document.getElementById("loginForm");
  if (!form) return;
  form.addEventListener("submit", handleLoginSubmit);
}

async function handleLoginSubmit(event) {
  event.preventDefault();
  const email = readInputValue("email");
  const password = readInputValue("password");
  if (!email || !password)
    return showLoginStatus("Bitte E-Mail & Passwort eingeben", true);
  disableButton("loginBtn", true);
  try {
    await login(email, password);
    window.location.href = "./summary.html";
  } catch (err) {
    showLoginStatus(readAuthError(err), true);
  }
  disableButton("loginBtn", false);
}

function bindGuestButton() {
  const guestBtn = document.getElementById("guestBtn");
  if (!guestBtn) return;
  guestBtn.addEventListener("click", () => {
    startGuest();
    window.location.href = "./summary.html";
  });
}

function bindSignupButton() {
  const signupBtn = document.getElementById("signupBtn");
  if (!signupBtn) return;
  signupBtn.addEventListener("click", () => {
    window.location.href = "./signup.html";
  });
}

function runIntroAnimation() {
  const card = document.querySelector(".login-card");
  const splash = document.getElementById("brandSplash");
  if (!card || !splash) return;
  requestAnimationFrame(() => {
    setTimeout(() => {
      splash.classList.add("brand-fixed");
      setTimeout(() => card.classList.remove("login-card-hidden"), 900);
    }, 80);
  });
}

function readInputValue(id) {
  const field = document.getElementById(id);
  return field ? field.value.trim() : "";
}

function disableButton(id, disabled) {
  const button = document.getElementById(id);
  if (button) button.disabled = disabled;
}

function showLoginStatus(message, isError) {
  const status = document.getElementById("loginStatus");
  if (!status) return;
  status.textContent = message;
  status.classList.toggle("error", !!isError);
}
