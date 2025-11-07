const templateCache = new Map();

/**
 * Loads an HTML template from the specified URL with caching
 * @param {string} path Path to the HTML template
 * @returns {Promise<string>} HTML content of the template
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
 * Loads a template and inserts it into the specified DOM element
 * @param {string} selector CSS selector for the target element
 * @param {string} path Path to the HTML template
 * @returns {Promise<void>}
 */
export async function injectTemplate(selector, path) {
  const host = document.querySelector(selector);
  if (!host) return;
  const html = await fetchTemplate(path);
  host.innerHTML = html;
}

/**
 * Loads multiple templates in parallel and inserts them into their target elements
 * @param {Array<Array<string>>} pairs Array of [selector, path] tuples
 * @returns {Promise<void>}
 */
export async function insertTemplates(pairs) {
  const tasks = pairs.map(([selector, path]) => injectTemplate(selector, path));
  await Promise.all(tasks);
}
