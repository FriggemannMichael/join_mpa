# Error Logger Service

Ein zentraler Error-Logging-Service mit Kontext-Unterstützung, Offline-Fallback und optionaler Sentry-Integration.

## Features

- ✅ Strukturiertes Error-Logging mit Kontext
- ✅ Offline-Support mit localStorage-Fallback
- ✅ Automatisches Queuing von Errors bei fehlender Internetverbindung
- ✅ Vorbereitet für Sentry-Integration
- ✅ Error-Severity-Levels (fatal, error, warning, info)
- ✅ Breadcrumb-System für Error-Tracking
- ✅ User-Context-Tracking
- ✅ Export-Funktion für Debugging

## Installation

```javascript
import errorLogger from './js/common/errorLogger.js';
```

## Basis-Verwendung

### Error erfassen

```javascript
try {
  // Ihr Code
  await saveTask(taskData);
} catch (error) {
  errorLogger.capture(error, {
    module: 'TaskService',
    tags: { feature: 'tasks', action: 'save' },
    extra: { taskId: taskData.id }
  });
}
```

### Mit verschiedenen Severity-Levels

```javascript
// Fatal Error
errorLogger.capture(error, {
  module: 'Database',
  severity: errorLogger.ErrorSeverity.FATAL
});

// Warning
errorLogger.capture('API response delayed', {
  module: 'ApiService',
  severity: errorLogger.ErrorSeverity.WARNING
});
```

### Exception vs. Message

```javascript
// Für Exception-Objekte
errorLogger.captureException(new Error('Failed to load'), {
  module: 'ContactService'
});

// Für einfache Nachrichten
errorLogger.captureMessage('User navigation completed', {
  module: 'Navigation',
  severity: errorLogger.ErrorSeverity.INFO
});
```

## Erweiterte Features

### User-Kontext setzen

```javascript
// Nach Login
errorLogger.setUser({
  id: '12345',
  email: 'user@example.com',
  username: 'john.doe'
});
```

### Breadcrumbs hinzufügen

```javascript
errorLogger.addBreadcrumb({
  message: 'User clicked save button',
  category: 'user-action',
  level: 'info',
  data: { taskId: 123 }
});
```

### Konfiguration

```javascript
// Am Anfang der Anwendung
errorLogger.configure({
  enabled: true,
  environment: 'production',
  useLocalStorage: true,
  maxLocalStorageEntries: 100,

  // Sentry aktivieren (wenn Sentry SDK integriert ist)
  useSentry: false,
  sentryDsn: 'https://your-sentry-dsn@sentry.io/project'
});
```

## Migration von console.error

### Vorher

```javascript
try {
  await fetchContacts();
} catch (error) {
  console.error('Failed to fetch contacts:', error);
}
```

### Nachher

```javascript
import errorLogger from './js/common/errorLogger.js';

try {
  await fetchContacts();
} catch (error) {
  errorLogger.capture(error, {
    module: 'ContactService',
    tags: { feature: 'contacts', action: 'fetch' }
  });
}
```

## Offline-Unterstützung

Der Error-Logger speichert automatisch alle Errors in localStorage, wenn:
- Keine Internetverbindung besteht
- Sentry nicht verfügbar ist
- Ein Fehler beim Senden auftritt

Wenn die Verbindung wiederhergestellt wird, werden alle gespeicherten Errors automatisch gesendet.

## Debugging

### Error-Logs abrufen

```javascript
const logs = errorLogger.getErrorLogs();
console.log(logs);
```

### Logs exportieren

```javascript
const jsonLogs = errorLogger.exportLogs();
// Logs als JSON-String für Download oder Debugging
```

### Logs löschen

```javascript
errorLogger.clearErrorLogs();
```

## Best Practices

### 1. Immer Kontext mitgeben

```javascript
// ❌ Schlecht
errorLogger.capture(error);

// ✅ Gut
errorLogger.capture(error, {
  module: 'TaskService',
  tags: { feature: 'tasks', action: 'delete' },
  extra: { taskId: 123, userId: currentUser.id }
});
```

### 2. Richtige Severity-Level verwenden

```javascript
// FATAL - Anwendung ist nicht mehr funktionsfähig
errorLogger.capture(error, {
  module: 'App',
  severity: errorLogger.ErrorSeverity.FATAL
});

// ERROR - Wichtige Funktion fehlgeschlagen
errorLogger.capture(error, {
  module: 'TaskService',
  severity: errorLogger.ErrorSeverity.ERROR
});

// WARNING - Unerwartetes Verhalten, aber nicht kritisch
errorLogger.capture('Slow response time', {
  module: 'ApiService',
  severity: errorLogger.ErrorSeverity.WARNING
});

// INFO - Informative Nachricht
errorLogger.captureMessage('Feature flag enabled', {
  severity: errorLogger.ErrorSeverity.INFO
});
```

### 3. Module-Namen konsistent verwenden

Verwenden Sie aussagekräftige, konsistente Module-Namen:
- `'TaskService'` statt `'tasks'`
- `'ContactService'` statt `'contacts.js'`
- `'ValidationHelper'` statt `'validation'`

## Sentry-Integration (zukünftig)

Um Sentry zu integrieren:

1. Sentry SDK installieren:
```bash
npm install @sentry/browser
```

2. In `errorLogger.js` Sentry initialisieren:
```javascript
import * as Sentry from '@sentry/browser';

// In der configure-Funktion
if (config.useSentry && config.sentryDsn) {
  Sentry.init({
    dsn: config.sentryDsn,
    environment: config.environment
  });
}
```

3. `sendToSentry` Funktion implementieren:
```javascript
async function sendToSentry(errorData) {
  Sentry.captureException(errorData);
}
```

## API-Referenz

### Methods

- `capture(error, context)` - Erfasst einen Error mit Kontext
- `captureException(error, context)` - Erfasst eine Exception
- `captureMessage(message, context)` - Erfasst eine Nachricht
- `addBreadcrumb(breadcrumb)` - Fügt einen Breadcrumb hinzu
- `setUser(user)` - Setzt User-Kontext
- `configure(options)` - Konfiguriert den Logger
- `getErrorLogs()` - Gibt alle Error-Logs zurück
- `clearErrorLogs()` - Löscht alle Error-Logs
- `exportLogs()` - Exportiert Logs als JSON

### Context-Objekt

```typescript
{
  module?: string,           // Modul-Name
  severity?: ErrorSeverity,  // Error-Level
  user?: object,            // User-Info
  tags?: object,            // Tags für Kategorisierung
  extra?: object,           // Zusätzliche Daten
  breadcrumbs?: array       // Breadcrumb-Trail
}
```

## Lizenz

Teil des Join Project
