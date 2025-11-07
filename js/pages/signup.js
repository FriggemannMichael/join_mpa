/**
 * Signup page for user registration
 * @module signup
 */

import { registerUser, readAuthError } from "../common/authService.js";
import { redirectIfAuthenticated } from "../common/pageGuard.js";
import { validateEmail } from "../common/emailValidator.js";

initSignupPage();

const RX_NAME = /^[A-ZÄÖÜ][a-zäöüß]+(?:[ -][A-ZÄÖÜ][a-zäöüß]+)*$/;

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

const el = (id) => document.getElementById(id);
const val = (id) => (el(id)?.value ?? "").trim();

const ERR = {
  name: "Please enter a valid name (first letter capitalized).",
  email: "Please enter a valid email address.",
  emailDouble: "Email cannot contain consecutive dots (..).",
  emailBlocked: "This email address cannot be used.",
  password: "Password requires at least 6 characters.",
  confirm: "Passwords do not match.",
};

function getContainer(id) {
  const node = el(id);
  return node ? node.closest(".inputField__container") || node : null;
}

function setFieldState(id, ok) {
  const node = el(id);
  const container = getContainer(id);
  if (!node || !container) return;
  container.classList.toggle("input-fault", !ok);
  node.setAttribute("aria-invalid", String(!ok));
}

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

function markTouched(id) {
  const c = getContainer(id);
  if (c) c.dataset.touched = "true";
}

async function initSignupPage() {
  await redirectIfAuthenticated("./summary.html");
  bindSignupForm();
  bindBackButton();
  bindPasswordToggles();
  updateSubmitState();
}

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

function validateName(value) {
  const ok = !!value && RX_NAME.test(value);
  return { ok, msg: ok ? "" : ERR.name };
}

function validateEmailField(value) {
  if (!value || !validateEmail(value)) {
    const msg = value.includes("..") ? ERR.emailDouble : ERR.email;
    return { ok: false, msg };
  }
  if (BLOCKED_EMAILS.includes(value.toLowerCase())) {
    return { ok: false, msg: ERR.emailBlocked };
  }
  return { ok: true, msg: "" };
}

function validatePasswordField(value) {
  const ok = value.length >= 6;
  return { ok, msg: ok ? "" : ERR.password };
}

function validatePasswordConfirm(value, password) {
  const ok = value.length >= 6 && value === password;
  return { ok, msg: ok ? "" : ERR.confirm };
}

function getFieldValidator(id) {
  const validators = {
    signupName: () => validateName(val(id)),
    signupEmail: () => validateEmailField(val(id)),
    signupPassword: () => validatePasswordField(val(id)),
    signupPasswordConfirm: () =>
      validatePasswordConfirm(val(id), val("signupPassword")),
  };
  return validators[id] || (() => ({ ok: true, msg: "" }));
}

/**
 * Validate single field with comprehensive email validation
 * @param {string} id Field ID
 * @param {{showErrors?: boolean, markTouch?: boolean}} opts Validation options
 * @returns {boolean} True if field is valid
 */
function validateSingleField(id, opts = {}) {
  const { showErrors = false, markTouch = false } = opts;
  const validator = getFieldValidator(id);
  const { ok, msg } = validator();
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

function bindBackButton() {
  const backBtn = el("signupBackBtn");
  if (backBtn) {
    backBtn.addEventListener(
      "click",
      () => (window.location.href = "./index.html")
    );
  }
}

function bindPasswordToggles() {
  document.querySelectorAll("[data-toggle]").forEach((button) => {
    button.addEventListener("click", () =>
      togglePassword(button.dataset.toggle)
    );
  });
}

function validateAllFields() {
  const nameOk = validateSingleField("signupName", {
    showErrors: true,
    markTouch: true,
  });
  const emailOk = validateSingleField("signupEmail", {
    showErrors: true,
    markTouch: true,
  });
  const passwordOk = validateSingleField("signupPassword", {
    showErrors: true,
    markTouch: true,
  });
  const confirmOk = validateSingleField("signupPasswordConfirm", {
    showErrors: true,
    markTouch: true,
  });
  return nameOk && emailOk && passwordOk && confirmOk;
}

function checkPrivacyAccepted() {
  const accepted = el("signupPrivacy")?.checked ?? false;
  if (!accepted) {
    setSignupStatus("Please accept the privacy policy.", true);
  }
  return accepted;
}

async function submitRegistration() {
  disableSubmit(true);
  try {
    await registerUser(
      val("signupName"),
      val("signupEmail"),
      val("signupPassword")
    );
    clearFaultMsgs();
    window.location.href = "./summary.html";
  } catch (err) {
    setSignupStatus(readAuthError(err), true);
  } finally {
    disableSubmit(false);
  }
}

async function handleSignupSubmit(event) {
  event.preventDefault();
  if (!validateAllFields()) return;
  if (!checkPrivacyAccepted()) return;
  await submitRegistration();
}

function checkAllFieldsValid() {
  const name = val("signupName");
  const email = val("signupEmail");
  const password = val("signupPassword");
  const confirm = val("signupPasswordConfirm");
  const okName = !!name && RX_NAME.test(name);
  const okEmail = !!email && validateEmail(email);
  const okPwLen = password.length >= 6;
  const okConfirm = confirm.length >= 6 && password === confirm;
  return okName && okEmail && okPwLen && okConfirm;
}

function updateSubmitState() {
  const accepted = el("signupPrivacy")?.checked ?? false;
  const allValid = checkAllFieldsValid();
  const enabled = allValid && accepted;
  disableSubmit(!enabled);
  showPasswordMismatch(val("signupPassword"), val("signupPasswordConfirm"));
}

function showPasswordMismatch(password, confirm) {
  const hint = el("signupPasswordHint");
  if (!hint) return;
  hint.textContent =
    password && confirm && password !== confirm ? ERR.confirm : "";
}

function disableSubmit(disabled) {
  const button = el("signupSubmit");
  if (!button) return;
  button.disabled = disabled;
  button.classList.toggle("btn__disabled", disabled);
}

function togglePassword(id) {
  const field = el(id);
  if (field) field.type = field.type === "password" ? "text" : "password";
}

function setSignupStatus(message, isError) {
  const status = el("signupStatus");
  if (!status) return;
  status.textContent = message;
  status.classList.toggle("error", !!isError);
}

function clearFaultMsgs() {
  document.querySelectorAll(".field-fault-msg.visible").forEach((el) => {
    el.textContent = "";
    el.classList.remove("visible");
  });
}
