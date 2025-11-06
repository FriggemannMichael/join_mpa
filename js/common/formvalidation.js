// common/validation-ui.js
export const byName = (form, name) => form.querySelector(`[name="${name}"]`);

export function showFaultMsg(el, msg) {
  if (!el) return;
  let faultMsg = el.parentElement.querySelector(".field-fault-msg");
  if (!faultMsg) {
    faultMsg = document.createElement("div");
    faultMsg.className = "field-fault-msg";
    el.parentElement.appendChild(faultMsg);
  }
  faultMsg.textContent = msg;
  faultMsg.classList.add("visible");
  el.classList.add("input-fault");
}

export function clearFaultMsg(el) {
  if (!el) return;
  el.classList.remove("input-fault");
  const faultMsg = el.parentElement.querySelector(".field-fault-msg");
  if (faultMsg) faultMsg.classList.remove("visible");
}

export function toggleFaultMsg(el, ok, msg) {
  ok ? clearFaultMsg(el) : showFaultMsg(el, msg);
  return ok;
}
