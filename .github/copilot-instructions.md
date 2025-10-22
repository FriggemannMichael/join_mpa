# Copilot Instructions: JOIN MPA

## Architekturregeln
- Jede Hauptansicht ist eine eigene HTML-Datei (z. B. login, summary, board, contacts).
- Jede Seite hat ein eigenes JS-File im Ordner `js/pages/`.
- Gemeinsame Logik liegt in `js/common/`.
- Kein Inline-JavaScript in HTML.

## Codequalität
- Maximal 14 Zeilen pro Funktion (außer HTML-Generierung).
- Maximal 400 Zeilen pro Datei.
- Jede Funktion hat eine einzelne Verantwortung.
- Nur camelCase für Namen.
- Zwei Leerzeilen zwischen Funktionen.
- Alle Funktionen sind mit JSDoc dokumentiert.
- Kein `console.log` oder `console.error` im finalen Code.

## Design-Integrität
- Keine Änderungen an CSS-Klassen, Variablen oder Animationen.
- Layout und Transitions bleiben exakt erhalten.
- Nur bestehende CSS-Dateien verwenden, keine neuen Design-Tokens.

## Struktur & Dateien
- `/html` → Alle HTML-Seiten
- `/js` → Ein JS-File pro Seite + globale Utilities
- `/css` → Bestehende CSS-Dateien
- `/templates` → HTML-Fragmente
- `/img` → Bilder und Icons
- Statischer HTML-Content bleibt in den HTML-Dateien (nicht dynamisch generiert).

## Funktion & Verhalten
- Alle User Stories und Acceptance Criteria aus der Checkliste müssen erfüllt sein.
- Die MPA funktioniert konsistent auf Chrome, Firefox, Safari und Edge.
- Responsive Layout: 320px bis 1920px, kein horizontales Scrollen.
- Alle Buttons nutzen `cursor: pointer;`.
- Keine HTML5-Validierung, nur eigene JS-Validierung.

## Workflow
1. MPA-Ordnerstruktur aufbauen.
2. SPA-Logik in modulare JS-Files splitten.
3. Seiteninitialisierung pro Datei sicherstellen.
4. Globale Utilities schlank und wiederverwendbar halten.
5. Jeden Checklistenpunkt vor Commit abhaken.
6. Aussagekräftige Commit-Messages verwenden.

## Output-Erwartung
- Sauberer, modularer Code, der alle Checklistenpunkte exakt erfüllt.
- Keine Design- oder UX-Änderungen.
- Keine Funktionskompression zur Umgehung der Zeilenlimits.
- Striktes Refactoring nach Vorgabe.
