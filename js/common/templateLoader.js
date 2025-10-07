const templateCache = new Map();

/**
 * Lädt ein HTML-Template von der angegebenen URL mit Caching
 * @param {string} path Pfad zum HTML-Template
 * @returns {Promise<string>} HTML-Inhalt des Templates
 */
async function fetchTemplate(path) {
  if (templateCache.has(path)) return templateCache.get(path);
  const response = await fetch(path);
  if (!response.ok) return "";
  const html = await response.text();
  templateCache.set(path, html);
  return html;
}

/**
 * Lädt ein Template und fügt es in das angegebene DOM-Element ein
 * @param {string} selector CSS-Selektor für das Ziel-Element
 * @param {string} path Pfad zum HTML-Template
 * @returns {Promise<void>}
 */
export async function injectTemplate(selector, path) {
  const host = document.querySelector(selector);
  if (!host) return;
  const html = await fetchTemplate(path);
  host.innerHTML = html;
}

/**
 * Lädt mehrere Templates parallel und fügt sie in ihre Ziel-Elemente ein
 * @param {Array<Array<string>>} pairs Array von [selector, path] Tupeln
 * @returns {Promise<void>}
 */
export async function insertTemplates(pairs) {
  const tasks = pairs.map(([selector, path]) => injectTemplate(selector, path));
  await Promise.all(tasks);
}
