/**
 * Signup page for user registration
 * @module signup
 */

import { registerUser, readAuthError } from "../common/authService.js";
import { redirectIfAuthenticated } from "../common/pageGuard.js";

initSignupPage();

/** ===== Regex ===== */
const RX_EMAIL = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const RX_NAME = /^[A-ZÄÖÜ][a-zäöüß]+(?:[ -][A-ZÄÖÜ][a-zäöüß]+)*$/;

/** ===== Blocked email addresses ===== */
const BLOCKED_EMAILS = [
  "test@test.de",
  "example@example.com",
  "no-reply@example.com",
  "admin@admin.com",
  "info@info.de",
  "user@user.com",
  "demo@demo.com",
  "fake@fake.com",
  "123@123.com",
  "placeholder@domain.com",
];

/** ===== DOM-Helper ===== */
const el = (id) => document.getElementById(id);
const val = (id) => (el(id)?.value ?? "").trim();

/** Error messages per field */
const ERR = {
  name: "Please enter a valid name (first letter capitalized).",
  email: "Please enter a valid email address.",
  emailBlocked: "This email address cannot be used.",
  password: "Password requires at least 6 characters.",
  confirm: "Passwords do not match.",
};

/** Find parent container */
function getContainer(id) {
  const node = el(id);
  return node ? node.closest(".inputField__container") || node : null;
}

/** Toggle red border + aria-invalid */
function setFieldState(id, ok) {
  const node = el(id);
  const container = getContainer(id);
  if (!node || !container) return;
  container.classList.toggle("input-fault", !ok);
  node.setAttribute("aria-invalid", String(!ok));
}

/** Ensure error message element at container */
function ensureFaultMsg(container) {
  let faultMsg = container.querySelector(".field-fault-msg");
  if (!faultMsg) {
    faultMsg = document.createElement("div");
    faultMsg.className = "field-fault-msg";
    faultMsg.setAttribute("role", "status");
    faultMsg.setAttribute("aria-live", "polite");
    container.appendChild(faultMsg);
  }
  return faultMsg;
}

/** Set or remove error message */
function setFieldFaultMsg(id, message = "") {
  const container = getContainer(id);
  if (!container) return;
  const faultMsg = ensureFaultMsg(container);
  if (message) {
    faultMsg.textContent = message;
    faultMsg.classList.add("visible");
  } else {
    faultMsg.textContent = "";
    faultMsg.classList.remove("visible");
  }
}

/** Mark field as "touched" (after blur) */
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
 * Binds event listeners for the signup form
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

/** Live validation on input */
function handleLiveInput() {
  [
    "signupName",
    "signupEmail",
    "signupPassword",
    "signupPasswordConfirm",
  ].forEach((id) => {
    const c = getContainer(id);
    if (c?.dataset.touched === "true") {
      validateSingleField(id, { showErrors: true });
    }
  });
  updateSubmitState();
}

/**
 * Validate single field
 * @param {string} id
 * @param {{showErrors?: boolean, markTouch?: boolean}} opts
 */
function validateSingleField(id, opts = {}) {
  const { showErrors = false, markTouch = false } = opts;
  const v = val(id);
  let ok = true,
    msg = "";

  switch (id) {
    case "signupName":
      ok = !!v && RX_NAME.test(v);
      if (!ok) msg = ERR.name;
      break;
    case "signupEmail":
      ok = !!v && RX_EMAIL.test(v);
      if (!ok) {
        msg = ERR.email;
      } else if (BLOCKED_EMAILS.includes(v.toLowerCase())) {
        ok = false;
        msg = ERR.emailBlocked;
      }
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
    setFieldFaultMsg(id, ok ? "" : msg);
  } else {
    setFieldState(id, true);
    setFieldFaultMsg(id, "");
  }

  return ok;
}

/** Navigation */
function bindBackButton() {
  const backBtn = el("signupBackBtn");
  if (backBtn)
    backBtn.addEventListener(
      "click",
      () => (window.location.href = "./index.html")
    );
}

/**
 * Binds event listeners for password visibility toggles
 */
function bindPasswordToggles() {
  document.querySelectorAll("[data-toggle]").forEach((button) => {
    button.addEventListener("click", () =>
      togglePassword(button.dataset.toggle)
    );
  });
}

/** Submit-Handler */
async function handleSignupSubmit(event) {
  event.preventDefault();

  const okAll =
    validateSingleField("signupName", { showErrors: true, markTouch: true }) &&
    validateSingleField("signupEmail", { showErrors: true, markTouch: true }) &&
    validateSingleField("signupPassword", {
      showErrors: true,
      markTouch: true,
    }) &&
    validateSingleField("signupPasswordConfirm", {
      showErrors: true,
      markTouch: true,
    });

  const accepted = el("signupPrivacy")?.checked ?? false;
  if (!accepted) {
    setSignupStatus("Please accept the privacy policy.", true);
    return;
  }
  if (!okAll) return;

  disableSubmit(true);
  try {
    await registerUser(
      val("signupName"),
      val("signupEmail"),
      val("signupPassword")
    );
    clearFaultMsgs(); // Nach Erfolg alle Fehlermeldungen entfernen
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
 * Displays a hint when passwords don't match
 * @param {string} password The password
 * @param {string} confirm The confirmation password
 */
function showPasswordMismatch(password, confirm) {
  const hint = el("signupPasswordHint");
  if (!hint) return;
  hint.textContent =
    password && confirm && password !== confirm ? ERR.confirm : "";
}

/**
 * Enables or disables the submit button
 * @param {boolean} disabled True to disable, false to enable
 */
function disableSubmit(disabled) {
  const button = el("signupSubmit");
  if (button) {
    button.disabled = disabled;
    button.classList.toggle("btn__disabled", disabled);
  }
}

/**
 * Toggles the visibility of a password field
 * @param {string} id The ID of the password input field
 */
function togglePassword(id) {
  const field = el(id);
  if (field) field.type = field.type === "password" ? "text" : "password";
}

/**
 * Displays a status message on the signup page
 * @param {string} message The message to display
 * @param {boolean} isError True for error message, false for normal message
 */
function setSignupStatus(message, isError) {
  const status = el("signupStatus");
  if (status) {
    status.textContent = message;
    status.classList.toggle("error", !!isError);
  }
}

/**
 * Removes all visible error messages
 */
function clearFaultMsgs() {
  document.querySelectorAll(".field-fault-msg.visible").forEach((el) => {
    el.textContent = "";
    el.classList.remove("visible");
  });
}
