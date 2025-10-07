import { registerUser, readAuthError } from "../common/authService.js";
import { redirectIfAuthenticated } from "../common/pageGuard.js";

initSignupPage();

async function initSignupPage() {
  await redirectIfAuthenticated("./summary.html");
  bindSignupForm();
  bindBackButton();
  bindPasswordToggles();
}

function bindSignupForm() {
  const form = document.getElementById("signupForm");
  if (!form) return;
  form.addEventListener("submit", handleSignupSubmit);
  form.addEventListener("input", updateSubmitState);
  form.addEventListener("change", updateSubmitState);
}

function bindBackButton() {
  const backBtn = document.getElementById("signupBackBtn");
  if (!backBtn) return;
  backBtn.addEventListener("click", () => {
    window.location.href = "./index.html";
  });
}

function bindPasswordToggles() {
  document.querySelectorAll("[data-toggle]").forEach((button) => {
    button.addEventListener("click", () =>
      togglePassword(button.dataset.toggle)
    );
  });
}

async function handleSignupSubmit(event) {
  event.preventDefault();
  if (!validateSignup()) return;
  disableSubmit(true);
  try {
    await registerUser(
      readValue("signupName"),
      readValue("signupEmail"),
      readValue("signupPassword")
    );
    window.location.href = "./summary.html";
  } catch (err) {
    setSignupStatus(readAuthError(err), true);
  }
  disableSubmit(false);
}

function validateSignup() {
  const name = readValue("signupName");
  const email = readValue("signupEmail");
  const password = readValue("signupPassword");
  const confirm = readValue("signupPasswordConfirm");
  const accepted = document.getElementById("signupPrivacy")?.checked;
  if (!name || !email || !password || !confirm)
    return reportError("Bitte alle Felder ausfüllen");
  if (password.length < 6)
    return reportError("Passwort benötigt mindestens 6 Zeichen");
  if (password !== confirm)
    return reportError("Passwörter stimmen nicht überein");
  if (!accepted) return reportError("Bitte Datenschutz akzeptieren");
  setSignupStatus("", false);
  return true;
}

function updateSubmitState() {
  const password = readValue("signupPassword");
  const confirm = readValue("signupPasswordConfirm");
  const allFilled = [
    "signupName",
    "signupEmail",
    "signupPassword",
    "signupPasswordConfirm",
  ].every((id) => !!readValue(id));
  const accepted = document.getElementById("signupPrivacy")?.checked;
  const enabled =
    allFilled && accepted && password === confirm && password.length >= 6;
  disableSubmit(!enabled);
  showPasswordMismatch(password, confirm);
}

function showPasswordMismatch(password, confirm) {
  const hint = document.getElementById("signupPasswordHint");
  if (!hint) return;
  const mismatch = password && confirm && password !== confirm;
  hint.textContent = mismatch ? "Passwörter stimmen nicht überein" : "";
}

function disableSubmit(disabled) {
  const button = document.getElementById("signupSubmit");
  if (!button) return;
  button.disabled = disabled;
  button.classList.toggle("btn__disabled", disabled);
}

function togglePassword(id) {
  const field = document.getElementById(id);
  if (field) field.type = field.type === "password" ? "text" : "password";
}

function readValue(id) {
  const field = document.getElementById(id);
  return field ? field.value.trim() : "";
}

function setSignupStatus(message, isError) {
  const status = document.getElementById("signupStatus");
  if (!status) return;
  status.textContent = message;
  status.classList.toggle("error", !!isError);
}

function reportError(message) {
  setSignupStatus(message, true);
  return false;
}
