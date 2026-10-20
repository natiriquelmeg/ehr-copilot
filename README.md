# EHR Copilot

## Español

Extensión de Chrome (side panel, Manifest V3) con una biblioteca local de indicaciones
y medicamentos que rellena fichas clínicas. Sin build: se carga tal cual.

## Instalar

1. `chrome://extensions` → activar "Modo desarrollador".
2. "Cargar descomprimida" → elegir esta carpeta.
3. Abrir una atención en la ficha y pulsar el ícono de la extensión.

## Estructura

- `core/` — agnóstico a la ficha y casi a Chrome: `db.js` (IndexedDB) y marcadores de paciente.
  Es lo que se reutiliza al hacerlo standalone.
- `adapters/` — comportamiento de cada tipo de ficha. Implementa el contrato descrito en `content/registry.js`.
- `content/` — registro, perfiles de mapeo locales y content script (puente panel ↔ página).
- `sidepanel/` — interfaz.

## Agregar una segunda ficha

1. Crear un perfil de mapeo con sus selectores de campos y criterio de ruta.
2. Si requiere comportamientos complejos, agregar un adaptador que lea ese perfil.

## Mapear una ficha desde la extensión

1. Abre la ficha y, en la extensión, entra a ⚙ → **Mapear ficha activa**.
2. Para cada campo de texto, pulsa **Elegir** y haz clic en su textarea o input en la ficha.
3. Guarda el mapeo. Queda asociado localmente al sitio y a la ruta indicada, y tiene prioridad sobre las plantillas iniciales.

El selector manual solo mapea campos de texto. La detección de datos del paciente y los flujos de medicamentos requieren un perfil especializado y no se crean automáticamente.

## Seguridad y privacidad

- Nunca guarda ni rellena automáticamente: el usuario revisa y pulsa "Agregar"/"Previsualizar".
- Datos clínicos de pacientes no se almacenan; solo plantillas del profesional.
- Los perfiles de mapeo se guardan localmente y solo describen elementos de la interfaz de la ficha.
- El nombre del proveedor es un dato opcional del perfil local; la persona que usa la extensión puede asignarlo o cambiarlo en Ajustes.
- La extensión pide acceso temporal únicamente a la pestaña que la profesional abre; no mantiene permisos permanentes por dominio.

## Pendiente

- Verificar en una atención de prueba el autocompletar de medicamentos (`#input_codigoMedicamento`).
- Diagnóstico CIE-10 y exámenes (también autocompletar).
- Segundo adaptador.

---

## English

Chrome extension (side panel, Manifest V3) with a local library of instructions
and medications for filling clinical records. There is no build step: load the
folder directly.

### Install

1. Open `chrome://extensions` and enable **Developer mode**.
2. Select **Load unpacked** and choose this folder.
3. Open an appointment or clinical record and click the extension icon.

### Structure

- `core/` — independent from the record system and mostly independent from Chrome: `db.js` (IndexedDB) and patient placeholders. This is the reusable foundation for a standalone app.
- `adapters/` — behavior for each type of clinical record. They implement the contract described in `content/registry.js`.
- `content/` — adapter registry, local mapping profiles, and content scripts that bridge the side panel and the page.
- `sidepanel/` — the user interface.

### Add another clinical record system

1. Create a mapping profile with its field selectors and route-matching rule.
2. If it needs complex behavior, add an adapter that reads that profile.

### Map a record from the extension

1. Open the record and go to ⚙ → **Map active record** in the extension.
2. For each text field, click **Select**, then click its textarea or input in the record.
3. Save the mapping. It stays local, is associated with the selected site and route, and takes precedence over the built-in templates.

The manual picker currently maps text fields only. Patient-data detection and medication workflows require a specialized profile; they are not created automatically.

### Security and privacy

- It never saves or fills automatically: the clinician reviews and explicitly clicks the relevant action.
- Patient clinical data is not stored; only the professional's templates are stored locally.
- Mapping profiles are local and describe interface elements only.
- The provider name is optional local profile metadata; it can be set or changed in Settings.
- The extension requests temporary access only to the tab the clinician opens. It does not keep permanent site permissions.

### Current limitations

- Medication autocomplete still needs verification in a test appointment (`#input_codigoMedicamento`).
- ICD-10 diagnoses and examinations still need autocomplete support.
- Complex medication workflows and patient-data detection need specialized profiles.
