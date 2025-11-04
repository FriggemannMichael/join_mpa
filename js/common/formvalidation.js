/** @file Generic FormValidator: attach/detach validation inside any container */

const RX_EMAIL = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const RX_NAME  = /^[A-ZÄÖÜ][a-zäöüß]+(?:[ -][A-ZÄÖÜ][a-zäöüß]+)*$/;
const RX_PHONE = /^\+?\d{1,3}?[ -.]?\(?\d{1,4}\)?([ -.]?\d{2,4}){2,4}$/;

const HANDLERS = new WeakMap();

function getValue(el) {
  return el.type === "checkbox" ? el.checked : (el.value ?? "").trim();
}

const RULES = {
  required: (el) => {
    return el.type === "checkbox" ? el.checked : getValue(el).length > 0;
  },
  email:    (el) => RX_EMAIL.test(getValue(el)),
  name:     (el) => RX_NAME.test(getValue(el)),
  phone:    (el) => RX_PHONE.test(getValue(el)),
  minlen:   (el) => {
    const n = Number(el.dataset.minlen || 0);
    const v = getValue(el);
    return typeof v === "string" ? v.length >= n : false;
  },
  match:    (el, container) => {
    const sel = el.dataset.match; // CSS-Selector des Referenzfelds
    const ref = sel ? container.querySelector(sel) : null;
    return ref ? getValue(el) === getValue(ref) : true;
  },
  pattern:  (el) => {
    const p = el.dataset.pattern;
    if (!p) return true;
    const rx = new RegExp(p);
    return rx.test(getValue(el));
  },
};

function validateField(el, container) {
  const types = (el.dataset.validate || "").split(/\s+/).filter(Boolean);
  const ok = types.every((t) => (RULES[t] ? RULES[t](el, container) : true));
  el.classList.toggle("input-fault", !ok);
  el.setAttribute("aria-invalid", String(!ok));
  return ok;
}

function updateSubmitState(container) {
  const fields = container.querySelectorAll("[data-validate]");
  const allOk = [...fields].every((el) => validateField(el, container));
  container.querySelectorAll('button[type="submit"], #signupSubmit').forEach(btn => {
    btn.disabled = !allOk;
    btn.classList.toggle("btn__disabled", !allOk);
  });
  // Optional: simple password-hint by convention (if present)
  const hint = container.querySelector("#signupPasswordHint");
  if (hint) {
    const confirm = container.querySelector("[data-validate~='match']");
    const show = confirm && confirm.classList.contains("input-fault");
    hint.textContent = show ? "Passwords must match and meet length policy." : "";
  }
}

export function FormValidator(container) {
  const fields = container.querySelectorAll("[data-validate]");
  fields.forEach((el) => {
    const onBlur  = () => { validateField(el, container); updateSubmitState(container); };
    const onInput = () => { el.classList.remove("input-fault"); el.removeAttribute("aria-invalid"); updateSubmitState(container); };
    el.addEventListener("blur", onBlur);
    el.addEventListener("input", onInput);
    el.addEventListener("change", onInput);
    HANDLERS.set(el, { onBlur, onInput });
  });
  updateSubmitState(container);
}

export function destroyFormValidator(container) {
  const fields = container.querySelectorAll("[data-validate]");
  fields.forEach((el) => {
    const h = HANDLERS.get(el);
    if (!h) return;
    el.removeEventListener("blur", h.onBlur);
    el.removeEventListener("input", h.onInput);
    el.removeEventListener("change", h.onInput);
    HANDLERS.delete(el);
  });
}
