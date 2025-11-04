/**
 * Signup-Seite für Benutzerregistrierung
 * @module signup
 */

import { registerUser, readAuthError } from "../common/authService.js";
import { redirectIfAuthenticated } from "../common/pageGuard.js";

initSignupPage();

/** ===== Regex ===== */
const RX_EMAIL = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const RX_NAME  = /^[A-ZÄÖÜ][a-zäöüß]+(?:[ -][A-ZÄÖÜ][a-zäöüß]+)*$/;

/** ===== DOM-Helper ===== */
const el  = (id) => document.getElementById(id);
const val = (id) => (el(id)?.value ?? "").trim();

/** Fehlermeldungen pro Feld */
const ERR = {
  name: "Bitte einen gültigen Namen eingeben (z. B. „Max Mustermann“).",
  email: "Bitte eine gültige E-Mail-Adresse eingeben.",
  password: "Passwort benötigt mindestens 6 Zeichen.",
  confirm: "Passwörter stimmen nicht überein.",
};

/** Eltern Container finden */
function getContainer(id) {
  const node = el(id);
  return node ? (node.closest(".inputField__container") || node) : null;
}

/** roten Rand + aria-invalid toggeln */
function setFieldState(id, ok) {
  const node = el(id);
  const container = getContainer(id);
  if (!node || !container) return;
  container.classList.toggle("input-fault", !ok);
  node.setAttribute("aria-invalid", String(!ok));
}

/** Tooltip-Element am Container sicherstellen (absolut positioniert) */
function ensureTooltip(container) {
  let faultMessage = container.querySelector(".field-tooltip-error");
  if (!tip) {
    faultMessage = document.createElement("div");
    faultMessage.className = "field-tooltip-error";
    faultMessage.setAttribute("role", "status");
    faultMessage.setAttribute("aria-live", "polite");
    container.appendChild(faultMessage);
  }
  return faultMessage;
}

/** Tooltip setzen/entfernen (leerer Text = ausblenden) */
function setFieldTooltip(id, message = "") {
  const container = getContainer(id);
  if (!container) return;
  const tip = ensureTooltip(container);
  if (message) {
    tip.textContent = message;
    tip.classList.add("visible");
  } else {
    tip.textContent = "";
    tip.classList.remove("visible");
  }
}

/** Feld als „touched“ markieren (nach blur) */
function markTouched(id) {
  const c = getContainer(id);
  if (c) c.dataset.touched = "true";
}

/** ===== Init ===== */
async function initSignupPage() {
  await redirectIfAuthenticated("./summary.html");
  bindSignupForm();
  bindBackButton();
  bindPasswordToggles();
  updateSubmitState();
}

/**
 * Bindet Event-Listener für das Signup-Formular
 */
function bindSignupForm() {
  const form = el("signupForm");
  if (!form) return;

  form.addEventListener("input", handleLiveInput);
  form.addEventListener("change", handleLiveInput);

  form.querySelectorAll("input").forEach((input) => {
    input.addEventListener("blur", () =>
      validateSingleField(input.id, { showErrors: true, markTouch: true })
    );
  });

  form.addEventListener("submit", handleSignupSubmit);
}


function handleLiveInput() {
  ["signupName","signupEmail","signupPassword","signupPasswordConfirm"].forEach((id) => {
    const c = getContainer(id);
    if (c?.dataset.touched === "true") {
      validateSingleField(id, { showErrors: true }); 
    }
  });
  updateSubmitState();
}

/**
 * Einzelnes Feld prüfen
 * @param {string} id
 * @param {{showErrors?: boolean, markTouch?: boolean}} opts
 */
function validateSingleField(id, opts = {}) {
  const { showErrors = false, markTouch = false } = opts;
  const v = val(id);
  let ok = true, msg = "";

  switch (id) {
    case "signupName":
      ok = !!v && RX_NAME.test(v);
      if (!ok) msg = ERR.name;
      break;
    case "signupEmail":
      ok = !!v && RX_EMAIL.test(v);
      if (!ok) msg = ERR.email;
      break;
    case "signupPassword":
      ok = v.length >= 6;
      if (!ok) msg = ERR.password;
      break;
    case "signupPasswordConfirm":
      ok = v.length >= 6 && v === val("signupPassword");
      if (!ok) msg = ERR.confirm;
      break;
    default:
      ok = true;
  }

  if (markTouch) markTouched(id);

  const touched = getContainer(id)?.dataset.touched === "true";
  const shouldShow = showErrors || touched;

  if (shouldShow) {
    setFieldState(id, ok);
    setFieldTooltip(id, ok ? "" : msg);
  } else {
    setFieldState(id, true);
    setFieldTooltip(id, "");
  }

  return ok;
}

/** Navigation */
function bindBackButton() {
  const backBtn = el("signupBackBtn");
  if (backBtn) backBtn.addEventListener("click", () => (window.location.href = "./index.html"));
}

/**
 * Bindet Event-Listener für Passwort-Sichtbarkeits-Toggles
 */
function bindPasswordToggles() {
  document.querySelectorAll("[data-toggle]").forEach((button) => {
    button.addEventListener("click", () => togglePassword(button.dataset.toggle));
  });
}

/** Submit-Handler */
async function handleSignupSubmit(event) {
  event.preventDefault();

  const okAll =
    validateSingleField("signupName", { showErrors: true, markTouch: true }) &&
    validateSingleField("signupEmail", { showErrors: true, markTouch: true }) &&
    validateSingleField("signupPassword", { showErrors: true, markTouch: true }) &&
    validateSingleField("signupPasswordConfirm", { showErrors: true, markTouch: true });

  const accepted = el("signupPrivacy")?.checked ?? false;
  if (!accepted) {
    setSignupStatus("Bitte Datenschutz akzeptieren.", true);
    return;
  }
  if (!okAll) return;

  disableSubmit(true);
  try {
    await registerUser(val("signupName"), val("signupEmail"), val("signupPassword"));
    window.location.href = "./summary.html";
  } catch (err) {
    setSignupStatus(readAuthError(err), true);
  }
  disableSubmit(false);
}

/** Button-Zustand & Mismatch-Hinweis */
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

  const enabled = okName && okEmail && okPwLen && okConfirm && accepted;
  disableSubmit(!enabled);
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
  hint.textContent = password && confirm && password !== confirm ? ERR.confirm : "";
}

/**
 * Aktiviert oder deaktiviert den Submit-Button
 * @param {boolean} disabled True zum Deaktivieren, false zum Aktivieren
 */
function disableSubmit(disabled) {
  const button = el("signupSubmit");
  if (button) {
    button.disabled = disabled;
    button.classList.toggle("btn__disabled", disabled);
  }
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
  if (status) {
    status.textContent = message;
    status.classList.toggle("error", !!isError);
  }
}
