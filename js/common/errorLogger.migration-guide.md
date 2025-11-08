# Migration Guide: console.error → errorLogger

Diese Anleitung hilft dabei, bestehende `console.error` Aufrufe durch den neuen `errorLogger` zu ersetzen.

## Schritt 1: Import hinzufügen

Fügen Sie am Anfang jeder Datei, die Errors loggt, den Import hinzu:

```javascript
import errorLogger from './common/errorLogger.js';
// oder je nach Pfad:
import errorLogger from '../common/errorLogger.js';
import errorLogger from '../../common/errorLogger.js';
```

## Schritt 2: console.error ersetzen

### Pattern 1: Einfacher Error

**Vorher:**
```javascript
console.error('Failed to load contacts:', error);
```

**Nachher:**
```javascript
errorLogger.capture(error, {
  module: 'ContactService',
  tags: { feature: 'contacts', action: 'load' }
});
```

### Pattern 2: Error in try-catch

**Vorher:**
```javascript
try {
  await saveTask(taskData);
} catch (error) {
  console.error('Error saving task:', error);
}
```

**Nachher:**
```javascript
try {
  await saveTask(taskData);
} catch (error) {
  errorLogger.capture(error, {
    module: 'TaskService',
    tags: { feature: 'tasks', action: 'save' },
    extra: { taskId: taskData.id }
  });
}
```

### Pattern 3: Error mit zusätzlichen Daten

**Vorher:**
```javascript
console.error('Validation failed:', {
  field: 'email',
  value: emailValue,
  error: validationError
});
```

**Nachher:**
```javascript
errorLogger.capture(validationError, {
  module: 'ValidationService',
  severity: errorLogger.ErrorSeverity.WARNING,
  tags: { feature: 'validation', field: 'email' },
  extra: {
    field: 'email',
    value: emailValue
  }
});
```

### Pattern 4: Error ohne Error-Objekt

**Vorher:**
```javascript
console.error('User not found');
```

**Nachher:**
```javascript
errorLogger.captureMessage('User not found', {
  module: 'UserService',
  severity: errorLogger.ErrorSeverity.ERROR,
  tags: { feature: 'user', action: 'lookup' }
});
```

### Pattern 5: API Error

**Vorher:**
```javascript
fetch('/api/tasks')
  .then(response => response.json())
  .catch(error => {
    console.error('API Error:', error);
  });
```

**Nachher:**
```javascript
fetch('/api/tasks')
  .then(response => response.json())
  .catch(error => {
    errorLogger.capture(error, {
      module: 'ApiService',
      tags: {
        feature: 'tasks',
        action: 'fetch',
        endpoint: '/api/tasks'
      },
      extra: {
        method: 'GET',
        endpoint: '/api/tasks'
      }
    });
  });
```

## Schritt 3: Module-Namen definieren

Verwenden Sie konsistente Module-Namen für jede Datei:

| Datei | Module-Name |
|-------|-------------|
| `js/pages/contacts.js` | `ContactsPage` |
| `js/contacts/contactCache.js` | `ContactCache` |
| `js/board/state/liveTasks.js` | `LiveTasks` |
| `js/validation/validation-core.js` | `ValidationCore` |
| `js/pages/add-task-form.js` | `AddTaskForm` |
| etc. | ... |

## Schritt 4: Severity-Level richtig verwenden

```javascript
// FATAL - App kann nicht mehr funktionieren
errorLogger.capture(error, {
  module: 'App',
  severity: errorLogger.ErrorSeverity.FATAL
});

// ERROR - Wichtige Funktion fehlgeschlagen (Standard)
errorLogger.capture(error, {
  module: 'TaskService',
  severity: errorLogger.ErrorSeverity.ERROR
});

// WARNING - Problem, aber nicht kritisch
errorLogger.capture('API slow response', {
  module: 'ApiService',
  severity: errorLogger.ErrorSeverity.WARNING
});

// INFO - Nur zur Information
errorLogger.captureMessage('Feature flag activated', {
  module: 'FeatureFlags',
  severity: errorLogger.ErrorSeverity.INFO
});
```

## Beispiel: Komplette Datei-Migration

### Vorher: `js/pages/contacts.js`

```javascript
async function loadContacts() {
  try {
    const response = await fetch('/api/contacts');
    const contacts = await response.json();
    renderContacts(contacts);
  } catch (error) {
    console.error('Failed to load contacts:', error);
  }
}

function deleteContact(id) {
  if (!id) {
    console.error('Contact ID is required');
    return;
  }

  fetch(`/api/contacts/${id}`, { method: 'DELETE' })
    .then(() => {
      console.log('Contact deleted');
      loadContacts();
    })
    .catch(error => {
      console.error('Failed to delete contact:', error);
    });
}
```

### Nachher: `js/pages/contacts.js`

```javascript
import errorLogger from '../common/errorLogger.js';

async function loadContacts() {
  try {
    const response = await fetch('/api/contacts');
    const contacts = await response.json();
    renderContacts(contacts);
  } catch (error) {
    errorLogger.capture(error, {
      module: 'ContactsPage',
      tags: { feature: 'contacts', action: 'load' },
      extra: { endpoint: '/api/contacts' }
    });
  }
}

function deleteContact(id) {
  if (!id) {
    errorLogger.captureMessage('Contact ID is required for deletion', {
      module: 'ContactsPage',
      severity: errorLogger.ErrorSeverity.WARNING,
      tags: { feature: 'contacts', action: 'delete', validation: 'failed' }
    });
    return;
  }

  fetch(`/api/contacts/${id}`, { method: 'DELETE' })
    .then(() => {
      console.log('Contact deleted'); // Normale Logs können bleiben
      loadContacts();
    })
    .catch(error => {
      errorLogger.capture(error, {
        module: 'ContactsPage',
        tags: { feature: 'contacts', action: 'delete' },
        extra: { contactId: id, endpoint: `/api/contacts/${id}` }
      });
    });
}
```

## Checkliste für jede Datei

- [ ] `import errorLogger` hinzugefügt
- [ ] Alle `console.error` durch `errorLogger.capture` ersetzt
- [ ] Module-Name definiert und konsistent verwendet
- [ ] Sinnvolle Tags hinzugefügt (feature, action, etc.)
- [ ] Extra-Daten für Debugging hinzugefügt
- [ ] Richtige Severity-Level verwendet
- [ ] Getestet, dass Errors korrekt geloggt werden

## Automatische Migration (Optional)

Sie können folgendes Script verwenden, um automatisch zu suchen und zu ersetzen:

```javascript
// find-console-errors.js
const fs = require('fs');
const path = require('path');

function findConsoleErrors(dir) {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      findConsoleErrors(fullPath);
    } else if (file.endsWith('.js')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      const matches = content.match(/console\.error\([^)]+\)/g);

      if (matches) {
        console.log(`\n${fullPath}:`);
        matches.forEach(match => {
          console.log(`  ${match}`);
        });
      }
    }
  });
}

findConsoleErrors('./js');
```

## Häufige Fehler vermeiden

### ❌ Nicht zu viele Informationen loggen

```javascript
// Schlecht - sensible Daten
errorLogger.capture(error, {
  extra: {
    password: user.password,  // NIEMALS!
    creditCard: user.cc       // NIEMALS!
  }
});
```

### ❌ Nicht zu wenig Kontext

```javascript
// Schlecht - kein Kontext
errorLogger.capture(error);

// Gut - mit Kontext
errorLogger.capture(error, {
  module: 'TaskService',
  tags: { feature: 'tasks', action: 'save' },
  extra: { taskId: 123 }
});
```

### ❌ Nicht Error-Objekte mit String mischen

```javascript
// Schlecht
errorLogger.capture('Error message', { ... });

// Gut
errorLogger.captureMessage('Error message', { ... });
// oder
errorLogger.capture(new Error('Error message'), { ... });
```

## Testing

Nach der Migration testen Sie:

1. Öffnen Sie die Demo-Seite: `error-logger-demo.html`
2. Testen Sie verschiedene Fehler-Szenarien
3. Prüfen Sie localStorage: `errorLogger.getErrorLogs()`
4. Exportieren Sie Logs: `errorLogger.exportLogs()`

## Nächste Schritte

1. Migration durchführen Datei für Datei
2. User-Context nach Login setzen
3. Breadcrumbs an wichtigen Stellen hinzufügen
4. (Optional) Sentry-Integration aktivieren
5. Monitoring und Analyse der Logs einrichten
