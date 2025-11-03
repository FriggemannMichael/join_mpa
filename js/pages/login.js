/**
 * Login-Seite für Benutzeranmeldung
 * @module login
 */

import { login, startGuest, readAuthError } from "../common/authService.js";
import { redirectIfAuthenticated } from "../common/pageGuard.js";

initLoginPage();

/**
 * Initialisiert die Login-Seite mit Redirect-Check und UI-Setup
 */
async function initLoginPage() {
  await redirectIfAuthenticated("./summary.html");
  bindLoginForm();
  bindLoginButton();
  bindGuestButton();
  bindSignupButton();
  runIntroAnimation();
}

/**
 * Bindet Event-Listener für das Login-Formular
 */
function bindLoginForm() {
  const form = document.getElementById("loginForm");
  if (!form) return;
  form.addEventListener("submit", handleLoginSubmit);
}

/**
 * Bindet Event-Listener für den Login-Link
 */
function bindLoginButton() {
  const loginBtn = document.getElementById("loginBtn");
  if (!loginBtn) return;
  loginBtn.addEventListener("click", (event) => {
    event.preventDefault();
    const form = document.getElementById("loginForm");
    if (form) {
      form.requestSubmit();
    }
  });
}

/**
 * Verarbeitet das Login-Formular-Submit
 * @param {Event} event Das Submit-Event
 */
async function handleLoginSubmit(event) {
  event.preventDefault();
  const email = readInputValue("email");
  const password = readInputValue("password");
  if (!email || !password)
    return showLoginStatus("Bitte E-Mail & Passwort eingeben", true);
  disableButton("loginBtn", true);
  try {
    await login(email, password);
    sessionStorage.setItem("justLoggedIn", "true");
    window.location.href = "./summary.html";
  } catch (err) {
    showLoginStatus(readAuthError(err), true);
  }
  disableButton("loginBtn", false);
}

/**
 * Bindet Event-Listener für den Guest-Button
 */
function bindGuestButton() {
  const guestBtn = document.getElementById("guestBtn");
  if (!guestBtn) return;
  guestBtn.addEventListener("click", (event) => {
    event.preventDefault();
    startGuest();
    sessionStorage.setItem("justLoggedIn", "true");
    window.location.href = "./summary.html";
  });
}

/**
 * Bindet Event-Listener für den Signup-Button
 */
function bindSignupButton() {
  const signupBtn = document.getElementById("signupBtn");
  if (!signupBtn) return;
  signupBtn.addEventListener("click", () => {
    window.location.href = "./signup.html";
  });
}

/**
 * Führt die Intro-Animation für die Login-Seite aus
 */
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

/**
 * Liest den Wert eines Input-Feldes und gibt ihn getrimmt zurück
 * @param {string} id Die ID des Input-Elements
 * @returns {string} Der getrimmte Wert des Feldes oder leerer String
 */
function readInputValue(id) {
  const field = document.getElementById(id);
  return field ? field.value.trim() : "";
}

/**
 * Aktiviert oder deaktiviert einen Button
 * @param {string} id Die ID des Button-Elements
 * @param {boolean} disabled True zum Deaktivieren, false zum Aktivieren
 */
function disableButton(id, disabled) {
  const button = document.getElementById(id);
  if (button) button.disabled = disabled;
}

/**
 * Zeigt eine Login-Statusmeldung an
 * @param {string} message Die anzuzeigende Nachricht
 * @param {boolean} isError True für Fehlermeldung, false für normale Meldung
 */
function showLoginStatus(message, isError) {
  const status = document.getElementById("loginStatus");
  if (!status) return;
  status.textContent = message;
  status.classList.toggle("error", !!isError);
}
