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
 * Handles login form submission.
 * Validates credentials, disables the button, and performs login.
 *
 * @async
 * @param {SubmitEvent} event - The form submit event.
 * @returns {Promise<void>} Resolves when login flow is completed.
 */
async function handleLoginSubmit(event) {
  event.preventDefault();
  const [email, password] = getLoginCredentials();
  if (!isLoginInputValid(email, password)) return;
  disableButton("loginBtn", true);
  await tryLogin(email, password);
  disableButton("loginBtn", false);
}


/**
 * Reads email and password input values.
 * @returns {[string, string]} Array containing [email, password].
 */
function getLoginCredentials() {
  return ["email", "password"].map(readInputValue);
}


/**
 * Validates email and password presence and format.
 * Shows visible feedback if invalid.
 *
 * @param {string} email - Entered email address.
 * @param {string} password - Entered password.
 * @returns {boolean} Returns true if both inputs are valid.
 */
function isLoginInputValid(email, password) {
  if (!email || !password)
    return showLoginStatus("Please enter email & password", true), false;
  if (!validateEmail(email))
    return showLoginStatus("Please enter a valid email address", true), false;
  return true;
}


/**
 * Attempts login and handles success or error feedback.
 *
 * @async
 * @param {string} email - User email.
 * @param {string} password - User password.
 * @returns {Promise<void>} Resolves when login attempt finishes.
 */
async function tryLogin(email, password) {
  try {
    await login(email, password);
    sessionStorage.setItem("justLoggedIn", "true");
    window.location.href = "./summary.html";
  } catch (err) {
    showLoginStatus(readAuthError(err), true);
  }
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
