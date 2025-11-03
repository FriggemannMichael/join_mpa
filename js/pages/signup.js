/**
 * Signup-Seite für Benutzerregistrierung
 * @module signup
 */

import { registerUser, readAuthError } from "../common/authService.js";
import { redirectIfAuthenticated } from "../common/pageGuard.js";

initSignupPage();

/**
 * Initialisiert die Signup-Seite mit Redirect-Check und UI-Setup
 */
async function initSignupPage() {
  await redirectIfAuthenticated("./summary.html");
  bindSignupForm();
  bindBackButton();
  bindPasswordToggles();
}

/**
 * Bindet Event-Listener für das Signup-Formular
 */
function bindSignupForm() {
  const form = document.getElementById("signupForm");
  if (!form) return;
  form.addEventListener("submit", handleSignupSubmit);
  form.addEventListener("input", updateSubmitState);
  form.addEventListener("change", updateSubmitState);
}

/**
 * Bindet Event-Listener für den Zurück-Button
 */
function bindBackButton() {
  const backBtn = document.getElementById("signupBackBtn");
  if (!backBtn) return;
  backBtn.addEventListener("click", () => {
    window.location.href = "./index.html";
  });
}

/**
 * Bindet Event-Listener für Passwort-Sichtbarkeits-Toggles
 */
function bindPasswordToggles() {
  document.querySelectorAll("[data-toggle]").forEach((button) => {
    button.addEventListener("click", () =>
      togglePassword(button.dataset.toggle)
    );
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

/**
 * Validiert alle Eingaben des Signup-Formulars
 * @returns {boolean} True wenn alle Validierungen erfolgreich, sonst false
 */
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

/**
 * Aktualisiert den Status des Submit-Buttons basierend auf Formularvalidierung
 */
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

/**
 * Zeigt einen Hinweis an, wenn Passwörter nicht übereinstimmen
 * @param {string} password Das Passwort
 * @param {string} confirm Das Bestätigungspasswort
 */
function showPasswordMismatch(password, confirm) {
  const hint = document.getElementById("signupPasswordHint");
  if (!hint) return;
  const mismatch = password && confirm && password !== confirm;
  hint.textContent = mismatch ? "Passwörter stimmen nicht überein" : "";
}

/**
 * Aktiviert oder deaktiviert den Submit-Button
 * @param {boolean} disabled True zum Deaktivieren, false zum Aktivieren
 */
function disableSubmit(disabled) {
  const button = document.getElementById("signupSubmit");
  if (!button) return;
  button.disabled = disabled;
  button.classList.toggle("btn__disabled", disabled);
}

/**
 * Schaltet die Sichtbarkeit eines Passwort-Feldes um
 * @param {string} id Die ID des Passwort-Input-Feldes
 */
function togglePassword(id) {
  const field = document.getElementById(id);
  if (field) field.type = field.type === "password" ? "text" : "password";
}

/**
 * Liest den Wert eines Input-Feldes und gibt ihn getrimmt zurück
 * @param {string} id Die ID des Input-Elements
 * @returns {string} Der getrimmte Wert des Feldes oder leerer String
 */
function readValue(id) {
  const field = document.getElementById(id);
  return field ? field.value.trim() : "";
}

/**
 * Zeigt eine Statusmeldung auf der Signup-Seite an
 * @param {string} message Die anzuzeigende Nachricht
 * @param {boolean} isError True für Fehlermeldung, false für normale Meldung
 */
function setSignupStatus(message, isError) {
  const status = document.getElementById("signupStatus");
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
