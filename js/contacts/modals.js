/**
 * Signup-Seite für Benutzerregistrierung
 * @module signup
 */

import { registerUser, readAuthError } from "../common/authService.js";
import { redirectIfAuthenticated } from "../common/pageGuard.js";

initSignupPage();

/** ===== Regex für Basis-Checks ===== */
const RX_EMAIL = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const RX_NAME  = /^[A-ZÄÖÜ][a-zäöüß]+(?:[ -][A-ZÄÖÜ][a-zäöüß]+)*$/;

/** ===== kleine DOM-Helper ===== */
const el = (id) => document.getElementById(id);
const val = (id) => (el(id)?.value ?? "").trim();

/** Toggle rote Umrandung + aria-invalid */
function setFieldState(id, ok) {
  const node = el(id);
  if (!node) return;
  node.classList.toggle("input-fault", !ok);
  node.setAttribute("aria-invalid", String(!ok));
}

/**
 * Initialisiert die Signup-Seite mit Redirect-Check und UI-Setup
 */
async function initSignupPage() {
  await redirectIfAuthenticated("./summary.html");
  bindSignupForm();
  bindBackButton();
  bindPasswordToggles();
  // Initialer State beim Laden
  updateSubmitState();
}

/**
 * Bindet Event-Listener für das Signup-Formular
 */
function bindSignupForm() {
  const form = el("signupForm");
  if (!form) return;
  form.addEventListener("submit", handleSignupSubmit);
  form.addEventListener("input", updateSubmitState);
  form.addEventListener("change", updateSubmitState);
}

/**
 * Bindet Event-Listener für den Zurück-Button
 */
function bindBackButton() {
  const backBtn = el("signupBackBtn");
  if (!backBtn) return;
  backBtn.addEventListener("click", () => (window.location.href = "./index.html"));
}

/**
 * Bindet Event-Listener für Passwort-Sichtbarkeits-Toggles
 */
function bindPasswordToggles() {
  document.querySelectorAll("[data-toggle]").forEach((button) => {
    button.addEventListener("click", () => togglePassword(button.dataset.toggle));
  });
}

/**
 * Verarbeitet das Signup-Formular-Submit
 * @param {Event} event Das Submit-Event
 */
async function handleSignupSubmit(event) {
  event.preventDefault();
  if (!validateSignup()) return;
  disableSubmit(true);
  try {
    await registerUser(val("signupName"), val("signupEmail"), val("signupPassword"));
    window.location.href = "./summary.html";
  } catch (err) {
    setSignupStatus(readAuthError(err), true);
  }
  disableSubmit(false);
}

/**
 * Validiert alle Eingaben des Signup-Formulars
 * und markiert fehlerhafte Felder mit rotem Rand
 * @returns {boolean} True wenn alle Validierungen erfolgreich, sonst false
 */
function validateSignup() {
  const name = val("signupName");
  const email = val("signupEmail");
  const password = val("signupPassword");
  const confirm = val("signupPasswordConfirm");
  const accepted = el("signupPrivacy")?.checked ?? false;

  const okName = !!name && RX_NAME.test(name);
  const okEmail = !!email && RX_EMAIL.test(email);
  const okPwLen = password.length >= 6;
  const okConfirm = confirm.length >= 6 && password === confirm;
  const okPrivacy = accepted === true;

  setFieldState("signupName", okName);
  setFieldState("signupEmail", okEmail);
  setFieldState("signupPassword", okPwLen);
  setFieldState("signupPasswordConfirm", okConfirm);

  if (!okName)  return reportError("Bitte einen gültigen Namen eingeben (z. B. „Max Mustermann“).");
  if (!okEmail) return reportError("Bitte eine gültige E-Mail-Adresse eingeben.");
  if (!okPwLen) return reportError("Passwort benötigt mindestens 6 Zeichen.");
  if (!okConfirm) return reportError("Passwörter stimmen nicht überein.");
  if (!okPrivacy) return reportError("Bitte Datenschutz akzeptieren.");

  setSignupStatus("", false);
  return true;
}

/**
 * Aktualisiert den Status des Submit-Buttons und die roten Ränder live
 */
function updateSubmitState() {
  const name = val("signupName");
  const email = val("signupEmail");
  const password = val("signupPassword");
  const confirm = val("signupPasswordConfirm");
  const accepted = el("signupPrivacy")?.checked ?? false;

  const okName = !!name && RX_NAME.test(name);
  const okEmail = !!email && RX_EMAIL.test(email);
  const okPwLen = password.length >= 6;
  const okConfirm = confirm.length >= 6 && password === confirm;

  // Live-Feldzustände (roter Rand an/aus)
  setFieldState("signupName", name ? okName : true);
  setFieldState("signupEmail", email ? okEmail : true);
  setFieldState("signupPassword", password ? okPwLen : true);
  setFieldState("signupPasswordConfirm", confirm ? okConfirm : true);

  // Button aktivieren, wenn alles passt
  const enabled = okName && okEmail && okPwLen && okConfirm && accepted;
  disableSubmit(!enabled);

  // Hinweistext bei Passwort-Mismatch
  showPasswordMismatch(password, confirm);
}

/**
 * Zeigt einen Hinweis an, wenn Passwörter nicht übereinstimmen
 * @param {string} password Das Passwort
 * @param {string} confirm Das Bestätigungspasswort
 */
function showPasswordMismatch(password, confirm) {
  const hint = el("signupPasswordHint");
  if (!hint) return;
  const mismatch = password && confirm && password !== confirm;
  hint.textContent = mismatch ? "Passwörter stimmen nicht überein" : "";
}

/**
 * Aktiviert oder deaktiviert den Submit-Button
 * @param {boolean} disabled True zum Deaktivieren, false zum Aktivieren
 */
function disableSubmit(disabled) {
  const button = el("signupSubmit");
  if (!button) return;
  button.disabled = disabled;
  button.classList.toggle("btn__disabled", disabled);
}

/**
 * Schaltet die Sichtbarkeit eines Passwort-Feldes um
 * @param {string} id Die ID des Passwort-Input-Feldes
 */
function togglePassword(id) {
  const field = el(id);
  if (field) field.type = field.type === "password" ? "text" : "password";
}

/**
 * Zeigt eine Statusmeldung auf der Signup-Seite an
 * @param {string} message Die anzuzeigende Nachricht
 * @param {boolean} isError True für Fehlermeldung, false für normale Meldung
 */
function setSignupStatus(message, isError) {
  const status = el("signupStatus");
  if (!status) return;
  status.textContent = message;
  status.classList.toggle("error", !!isError);
}

/**
 * Zeigt eine Fehlermeldung an und gibt false zurück
 * @param {string} message Die Fehlermeldung
 * @returns {boolean} Immer false
 */
function reportError(message) {
  setSignupStatus(message, true);
  return false;
}
