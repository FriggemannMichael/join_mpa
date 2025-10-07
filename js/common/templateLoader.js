const templateCache = new Map();

async function fetchTemplate(path) {
  if (templateCache.has(path)) return templateCache.get(path);
  const response = await fetch(path);
  if (!response.ok) return "";
  const html = await response.text();
  templateCache.set(path, html);
  return html;
}

export async function injectTemplate(selector, path) {
  const host = document.querySelector(selector);
  if (!host) return;
  const html = await fetchTemplate(path);
  host.innerHTML = html;
}

export async function insertTemplates(pairs) {
  const tasks = pairs.map(([selector, path]) => injectTemplate(selector, path));
  await Promise.all(tasks);
}
