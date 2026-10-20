const STORAGE_KEY = 'ehrCopilotLocale';
let locale = 'es';

const messages = {
  es: {
    texts: 'Textos', medications: 'Medicamentos', settings: 'Ajustes', reconnect: 'Reconectar con la ficha',
    search: 'Buscar…', new: '+ Nuevo', capture: 'Capturar', importPrescription: 'Importar de la receta',
    localData: 'Tus datos viven solo en este navegador. Exporta un respaldo de vez en cuando.',
    localMappings: 'Los perfiles de mapeo de las fichas también se guardan localmente en este navegador.',
    language: 'Idioma', profiles: 'Perfiles de ficha', mapActive: '+ Mapear ficha activa', exportJson: 'Exportar JSON', importJson: 'Importar JSON',
    connected: 'Conectado', disconnected: 'No conectado', incompatible: 'Sin ficha compatible', noActiveTab: 'No hay pestaña activa', incompatibleTab: 'La pestaña activa no es una ficha compatible ({{host}}).',
    couldNotFill: 'No pude rellenar "{{field}}" en la ficha', missingVars: 'No pude leer {{variables}} de la ficha: complétalo a mano.',
    title: 'Título', ehrField: 'Campo de la ficha', templateText: 'Texto (marcadores: {{nombre}}, {{primer_nombre}}, {{edad}}, {{hoy}})',
    medicationName: 'Nombre (como lo buscas en el autocompletar)', tags: 'Etiquetas / diagnósticos (separadas por coma)', dosage: 'Posología (ej. 1, ½)', format: 'Formato (ej. Comprimido, Mg)',
    every: 'Cada', unit: 'Unidad (hora, días…)', route: 'Vía', during: 'Durante', durationUnit: 'Unidad (días, semana…)', administration: 'Indicación de administración',
    emptySearch: 'Sin resultados', emptyLibrary: 'Aún no hay nada. Crea el primero con "+ Nuevo".', insert: 'Insertar', inserted: 'Insertado en la ficha', loadInRecord: 'Cargar en la ficha',
    edit: 'Editar', delete: 'Borrar', deleteConfirm: '¿Borrar "{{title}}"?', save: 'Guardar', cancel: 'Cancelar', saved: 'Guardado',
    createMedicationsFirst: 'Crea medicamentos primero.', privacyHint: 'Revisa el texto y quita nombres u otros datos del paciente antes de guardar.',
    patientUnreadable: 'No pude leer el paciente de la ficha. {{hint}}', patientReplaced: 'Reemplacé {{count}} dato(s) del paciente por marcadores. Revisa que no quede nada más.',
    patientNotFound: 'No encontré el nombre del paciente en el texto. {{hint}}', fieldEmpty: 'El campo está vacío o no está visible en la ficha',
    prescriptionNotFound: 'No encontré medicamentos en la receta de la ficha', medicationImported: '{{added}} medicamento(s) nuevo(s) importado(s){{existing}}.',
    mappingTitle: 'Mapear ficha activa', openRecordToMap: 'Abre primero la ficha que quieres mapear.', customRecord: 'Ficha personalizada', providerExample: 'Ej. nombre del proveedor',
    site: 'Sitio: {{origin}}', providerLocal: 'Proveedor (guardado solo localmente)', profileName: 'Nombre del perfil', routePrefix: 'Ruta o prefijo de ruta',
    mappingHelp: 'Para cada campo, pulsa “Elegir” y haz clic en un textarea o input de la ficha.', notSelected: 'Aún sin seleccionar', choose: 'Elegir', saveMapping: 'Guardar mapeo',
    chooseInRecord: 'Haz clic en {{field}} dentro de la ficha.', mapAtLeastOne: 'Selecciona al menos un campo de la ficha.', pathRequired: 'Indica la ruta o prefijo de ruta de la ficha.',
    mappingSaved: 'Mapeo guardado localmente.', fieldSelectionCancelled: 'Selección de campo cancelada.', fieldSelected: 'Campo seleccionado.',
    noProfiles: 'Aún no hay perfiles de mapeo.', providerName: 'Nombre del proveedor', profileSaved: 'Perfil guardado', availableToMap: 'Disponible para asociar a una ficha compatible',
    imported: 'Importado', pickerInstruction: 'Selecciona el campo: {{field}}. Pulsa Esc para cancelar.',
    fieldMotivo: 'Motivo de consulta', fieldAnamnesis: 'Anamnesis / antecedentes', fieldIndicaciones: 'Indicaciones', fieldCertificado: 'Certificado médico', fieldControl: 'Control', fieldObservacion: 'Observación profesional',
  },
  en: {
    texts: 'Texts', medications: 'Medications', settings: 'Settings', reconnect: 'Reconnect to record', search: 'Search…', new: '+ New', capture: 'Capture', importPrescription: 'Import from prescription',
    localData: 'Your data stays in this browser. Export a backup from time to time.', localMappings: 'Record mapping profiles are also stored locally in this browser.', language: 'Language', profiles: 'Record profiles', mapActive: '+ Map active record', exportJson: 'Export JSON', importJson: 'Import JSON',
    connected: 'Connected', disconnected: 'Not connected', incompatible: 'No compatible record', noActiveTab: 'No active tab', incompatibleTab: 'The active tab is not a compatible record ({{host}}).', couldNotFill: 'Could not fill "{{field}}" in the record', missingVars: 'Could not read {{variables}} from the record; complete it manually.',
    title: 'Title', ehrField: 'Record field', templateText: 'Text (placeholders: {{nombre}}, {{primer_nombre}}, {{edad}}, {{hoy}})', medicationName: 'Name (as searched in autocomplete)', tags: 'Tags / diagnoses (comma-separated)', dosage: 'Dosage (e.g. 1, ½)', format: 'Form (e.g. Tablet, mg)', every: 'Every', unit: 'Unit (hour, days…)', route: 'Route', during: 'For', durationUnit: 'Unit (days, weeks…)', administration: 'Administration instructions',
    emptySearch: 'No results', emptyLibrary: 'Nothing here yet. Create the first one with "+ New".', insert: 'Insert', inserted: 'Inserted in the record', loadInRecord: 'Load in record', edit: 'Edit', delete: 'Delete', deleteConfirm: 'Delete "{{title}}"?', save: 'Save', cancel: 'Cancel', saved: 'Saved', createMedicationsFirst: 'Create medications first.', privacyHint: 'Review the text and remove patient names or other data before saving.', patientUnreadable: 'Could not read the patient from the record. {{hint}}', patientReplaced: 'Replaced {{count}} patient data point(s) with placeholders. Check that nothing else remains.', patientNotFound: 'Could not find the patient name in the text. {{hint}}', fieldEmpty: 'The field is empty or not visible in the record', prescriptionNotFound: 'Could not find medications in the prescription', medicationImported: '{{added}} new medication(s) imported{{existing}}.',
    mappingTitle: 'Map active record', openRecordToMap: 'Open the record you want to map first.', customRecord: 'Custom record', providerExample: 'E.g. provider name', site: 'Site: {{origin}}', providerLocal: 'Provider (stored locally only)', profileName: 'Profile name', routePrefix: 'Route or route prefix', mappingHelp: 'For each field, choose “Select” and click a textarea or input in the record.', notSelected: 'Not selected yet', choose: 'Select', saveMapping: 'Save mapping', chooseInRecord: 'Click {{field}} in the record.', mapAtLeastOne: 'Select at least one record field.', pathRequired: 'Enter the record route or route prefix.', mappingSaved: 'Mapping saved locally.', fieldSelectionCancelled: 'Field selection cancelled.', fieldSelected: 'Field selected.', noProfiles: 'No mapping profiles yet.', providerName: 'Provider name', profileSaved: 'Profile saved', availableToMap: 'Available to associate with a compatible record', imported: 'Imported', pickerInstruction: 'Select the field: {{field}}. Press Esc to cancel.', fieldMotivo: 'Reason for visit', fieldAnamnesis: 'History / background', fieldIndicaciones: 'Instructions', fieldCertificado: 'Medical certificate', fieldControl: 'Follow-up', fieldObservacion: 'Professional note',
  },
  fr: {
    texts: 'Textes', medications: 'Médicaments', settings: 'Réglages', reconnect: 'Reconnecter au dossier', search: 'Rechercher…', new: '+ Nouveau', capture: 'Capturer', importPrescription: 'Importer depuis l’ordonnance',
    localData: 'Vos données restent dans ce navigateur. Exportez une sauvegarde de temps en temps.', localMappings: 'Les profils de mappage des dossiers sont aussi enregistrés localement dans ce navigateur.', language: 'Langue', profiles: 'Profils de dossier', mapActive: '+ Mapper le dossier actif', exportJson: 'Exporter JSON', importJson: 'Importer JSON',
    connected: 'Connecté', disconnected: 'Non connecté', incompatible: 'Aucun dossier compatible', noActiveTab: 'Aucun onglet actif', incompatibleTab: 'L’onglet actif n’est pas un dossier compatible ({{host}}).', couldNotFill: 'Impossible de remplir « {{field}} » dans le dossier', missingVars: 'Impossible de lire {{variables}} dans le dossier ; complétez-les manuellement.',
    title: 'Titre', ehrField: 'Champ du dossier', templateText: 'Texte (marqueurs : {{nombre}}, {{primer_nombre}}, {{edad}}, {{hoy}})', medicationName: 'Nom (tel que recherché dans l’autocomplétion)', tags: 'Étiquettes / diagnostics (séparés par des virgules)', dosage: 'Posologie (ex. 1, ½)', format: 'Forme (ex. comprimé, mg)', every: 'Toutes les', unit: 'Unité (heure, jours…)', route: 'Voie', during: 'Pendant', durationUnit: 'Unité (jours, semaines…)', administration: 'Instructions d’administration',
    emptySearch: 'Aucun résultat', emptyLibrary: 'Rien pour le moment. Créez le premier avec « + Nouveau ».', insert: 'Insérer', inserted: 'Inséré dans le dossier', loadInRecord: 'Charger dans le dossier', edit: 'Modifier', delete: 'Supprimer', deleteConfirm: 'Supprimer « {{title}} » ?', save: 'Enregistrer', cancel: 'Annuler', saved: 'Enregistré', createMedicationsFirst: 'Créez d’abord des médicaments.', privacyHint: 'Vérifiez le texte et retirez les noms ou autres données du patient avant d’enregistrer.', patientUnreadable: 'Impossible de lire le patient dans le dossier. {{hint}}', patientReplaced: '{{count}} donnée(s) patient remplacée(s) par des marqueurs. Vérifiez qu’il ne reste rien.', patientNotFound: 'Impossible de trouver le nom du patient dans le texte. {{hint}}', fieldEmpty: 'Le champ est vide ou non visible dans le dossier', prescriptionNotFound: 'Aucun médicament trouvé dans l’ordonnance', medicationImported: '{{added}} nouveau(x) médicament(s) importé(s){{existing}}.',
    mappingTitle: 'Mapper le dossier actif', openRecordToMap: 'Ouvrez d’abord le dossier à mapper.', customRecord: 'Dossier personnalisé', providerExample: 'Ex. nom du fournisseur', site: 'Site : {{origin}}', providerLocal: 'Fournisseur (enregistré uniquement localement)', profileName: 'Nom du profil', routePrefix: 'Route ou préfixe de route', mappingHelp: 'Pour chaque champ, choisissez « Sélectionner » puis cliquez sur un textarea ou input du dossier.', notSelected: 'Pas encore sélectionné', choose: 'Sélectionner', saveMapping: 'Enregistrer le mappage', chooseInRecord: 'Cliquez sur {{field}} dans le dossier.', mapAtLeastOne: 'Sélectionnez au moins un champ du dossier.', pathRequired: 'Indiquez la route ou le préfixe de route du dossier.', mappingSaved: 'Mappage enregistré localement.', fieldSelectionCancelled: 'Sélection de champ annulée.', fieldSelected: 'Champ sélectionné.', noProfiles: 'Aucun profil de mappage pour le moment.', providerName: 'Nom du fournisseur', profileSaved: 'Profil enregistré', availableToMap: 'Disponible pour associer à un dossier compatible', imported: 'Importé', pickerInstruction: 'Sélectionnez le champ : {{field}}. Appuyez sur Échap pour annuler.', fieldMotivo: 'Motif de consultation', fieldAnamnesis: 'Anamnèse / antécédents', fieldIndicaciones: 'Instructions', fieldCertificado: 'Certificat médical', fieldControl: 'Suivi', fieldObservacion: 'Note professionnelle',
  },
};

export async function initI18n() {
  const { [STORAGE_KEY]: saved } = await chrome.storage.local.get(STORAGE_KEY);
  const browserLocale = globalThis.navigator?.language?.toLowerCase().split('-')[0];
  locale = ['es', 'en', 'fr'].includes(saved)
    ? saved
    : ['es', 'en', 'fr'].includes(browserLocale) ? browserLocale : 'en';
  document.documentElement.lang = locale;
}

export function getLocale() { return locale; }

export async function setLocale(nextLocale) {
  if (!['es', 'en', 'fr'].includes(nextLocale)) return;
  locale = nextLocale;
  await chrome.storage.local.set({ [STORAGE_KEY]: locale });
}

export function t(key, values = {}) {
  const template = messages[locale]?.[key] ?? messages.es[key] ?? key;
  return template.replace(/\{\{(\w+)\}\}/g, (_, name) => String(values[name] ?? `{{${name}}}`));
}
