// Testskript für Join-MPA: Task-Erstellung und Sichtbarkeit
// Voraussetzungen: Die Seite läuft lokal, Firebase ist konfiguriert, Board und Summary sind erreichbar
(() => {
  const titleInput = document.getElementById("taskTitle");
  const descInput = document.getElementById("taskDescription");
  const dueInput = document.getElementById("taskDueDate");
  if (!titleInput || !descInput || !dueInput) {
    alert(
      "Dieses Testskript muss auf der Seite add-task.html ausgeführt werden!"
    );
    return;
  }

  (async function testCreateTaskAndCheckBoardAndSummary() {
  // Hilfsfunktionen
  function randomString(len = 6) {
    return Math.random()
      .toString(36)
      .substring(2, 2 + len);
  }

  // 1. Task-Daten generieren
  const testTitle = "TestTask-" + randomString();
  const testDesc = "Automatischer Testtask";
  const testDue = new Date(Date.now() + 86400000).toISOString().slice(0, 10); // morgen
  const testCategory = "technical-task";
  const testPriority = "urgent";

  // 2. Task anlegen (simulate UI)
  document.getElementById("taskTitle").value = testTitle;
  document.getElementById("taskDescription").value = testDesc;
  document.getElementById("taskDueDate").value = testDue;
  window.selectCategory(testCategory);
  document
    .querySelector('.priority-btn[data-priority="' + testPriority + '"]')
    .click();

  // Assignee wählen (ersten nehmen)
  const firstAssignee = document.querySelector(
    '#assignee-dropdown input[type="checkbox"]'
  );
  if (firstAssignee) firstAssignee.checked = true;

  // Task erstellen
  document.getElementById("taskCreateBtn").click();

  // 3. Warte auf Firebase-Sync
  await new Promise((r) => setTimeout(r, 2000));

  // 4. Firebase prüfen
  const db = await import("../js/common/database.js");
  const fb = await db.loadFirebaseDatabase();
  const snap = await fb.get(fb.ref(fb.getDatabase(), "tasks"));
  const allTasks = snap.exists() ? snap.val() : {};
  const found = Object.values(allTasks).find((t) => t.title === testTitle);
  if (!found) {
    console.error("Task wurde NICHT in Firebase angelegt!");
    return;
  } else {
    console.log("Task in Firebase gefunden:", found);
  }

  // 5. Board prüfen (DOM)
  const boardTask = Array.from(
    document.querySelectorAll(".task_card .task_header")
  ).find((e) => e.textContent === testTitle);
  if (!boardTask) {
    console.error("Task wird NICHT auf dem Board angezeigt!");
  } else {
    console.log("Task auf dem Board gefunden.");
  }

  // 6. Summary prüfen (DOM)
  // Annahme: Summary zeigt die Anzahl aller Tasks in einem Element mit id="summary-tasks-count"
  // und/oder listet den Task-Titel irgendwo auf der Seite
  let summaryCount = null;
  try {
    summaryCount = document.getElementById("summary-tasks-count")?.textContent;
  } catch {}
  const summaryTask = Array.from(
    document.querySelectorAll(".summary-task-title")
  ).find((e) => e.textContent === testTitle);
  if (summaryTask || (summaryCount && Number(summaryCount) > 0)) {
    console.log("Task in Summary gefunden oder gezählt.");
  } else {
    console.error("Task NICHT in der Summary gefunden!");
  }

  // Ergebnis
  if (
    found &&
    boardTask &&
    (summaryTask || (summaryCount && Number(summaryCount) > 0))
  ) {
    alert("Test erfolgreich: Task wurde überall korrekt angelegt!");
  } else {
    alert("Test FEHLGESCHLAGEN: Siehe Konsole für Details.");
  }
  })();
})();
