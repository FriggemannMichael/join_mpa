/**
 * Login page for user authentication
 * @module login
 */

import { login, startGuest, readAuthError } from "../common/authService.js";
import { redirectIfAuthenticated } from "../common/pageGuard.js";
import { validateEmail } from "../common/emailValidator.js";

initLoginPage();

/**
 * Initializes the login page with redirect check and UI setup
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
 * Binds event listeners for the login form
 */
function bindLoginForm() {
  const form = document.getElementById("loginForm");
  if (!form) return;
  form.addEventListener("submit", handleLoginSubmit);
}

/**
 * Binds event listener for the login button
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
 * Handles the login form submission with email validation
 * Validates email format before attempting authentication
 * 
 * @param {Event} event The submit event
 */
async function handleLoginSubmit(event) {
  event.preventDefault();
  const email = readInputValue("email");
  const password = readInputValue("password");
  
  // Basic presence check
  if (!email || !password) {
    return showLoginStatus("Please enter email & password", true);
  }
  
  // Validate email format to catch obvious typos early
  if (!validateEmail(email)) {
    return showLoginStatus("Please enter a valid email address", true);
  }
  
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
 * Binds event listener for the guest button
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
 * Binds event listener for the signup button
 */
function bindSignupButton() {
  const signupBtn = document.getElementById("signupBtn");
  if (!signupBtn) return;
  signupBtn.addEventListener("click", () => {
    window.location.href = "./signup.html";
  });
}

/**
 * Runs the intro animation for the login page
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
 * Reads the value of an input field and returns it trimmed
 * @param {string} id The ID of the input element
 * @returns {string} The trimmed value of the field or empty string
 */
function readInputValue(id) {
  const field = document.getElementById(id);
  return field ? field.value.trim() : "";
}

/**
 * Enables or disables a button
 * @param {string} id The ID of the button element
 * @param {boolean} disabled True to disable, false to enable
 */
function disableButton(id, disabled) {
  const button = document.getElementById(id);
  if (button) button.disabled = disabled;
}

/**
 * Displays a login status message
 * @param {string} message The message to display
 * @param {boolean} isError True for error message, false for normal message
 */
function showLoginStatus(message, isError) {
  const status = document.getElementById("loginStatus");
  if (!status) return;
  status.textContent = message;
  status.classList.toggle("error", !!isError);
}
