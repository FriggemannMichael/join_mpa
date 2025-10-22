
/**
 * Initialisiert die Suche auf dem Board
 */
export function initBoardSearch() {
  const button = document.getElementById("searchButton");
  const input  = document.getElementById("searchInput");

  const run = () => runSearch(input.value.trim());
  button.addEventListener("click", run);
  input.addEventListener("keydown", (e) => { if (e.key === "Enter") run(); });

  toggleSearchMessage(false);
}

/**
 * Führt die Suche aus und blendet Karten ein/aus
 */
function runSearch(term) {
  const cards = Array.from(document.querySelectorAll(".task_card"));
  const hasTerm = !!term;
  let foundAny = false;

  cards.forEach((card) => {
    const isMatch = hasTerm && matchTask(card, term);
    card.style.display = (!hasTerm || isMatch) ? "" : "none";
    if (isMatch) foundAny = true;
  });

  toggleSearchMessage(hasTerm && !foundAny);
}

/**
 * Prüft Titel, Beschreibung, Kategorie
 */
function matchTask(card, term) {
  const title = card.querySelector(".task_header")?.textContent || "";
  const description = card.querySelector(".task_description")?.textContent || "";
  const category = card.querySelector(".task_category")?.textContent || "";
  const text = `${title} ${description} ${category}`.toLowerCase();
  return text.includes(term.toLowerCase());
}

/**
 * Zeigt oder versteckt „Keine Ergebnisse“-Nachricht
 */
function toggleSearchMessage(show) {
  const msg = document.getElementById("search_error");
  if (!msg) return;
  msg.style.display = show ? "block" : "none";
}

