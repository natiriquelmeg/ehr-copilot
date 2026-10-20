# Chrome Web Store listing

This file is the source text for the Chrome Web Store dashboard. It does not belong in the uploaded ZIP.

## Spanish (primary)

**Name**  
EHR Copilot

**Short description**  
Biblioteca local para completar fichas clínicas con revisión profesional.

**Detailed description**  
EHR Copilot es un panel lateral para Chrome que ayuda a profesionales a reutilizar textos, indicaciones y medicamentos al completar fichas clínicas.

Todo se guarda localmente en el navegador: biblioteca, preferencias y perfiles de mapeo. La extensión no usa inteligencia artificial, no requiere API keys y no transmite datos clínicos, identificadores de pacientes ni configuraciones a servidores externos.

La profesional revisa y confirma cada acción. EHR Copilot no rellena ni guarda información automáticamente.

Puedes mapear campos de texto de una ficha compatible para conservar su perfil localmente. Los flujos complejos, como la detección de pacientes y algunos formularios de medicamentos, pueden requerir un perfil especializado.

**Privacy policy**  
https://natiriquelmeg.github.io/ehr-copilot/privacy.html

## English

**Short description**  
Local library for completing clinical records with professional review.

**Detailed description**  
EHR Copilot is a Chrome side panel that helps professionals reuse text, instructions, and medications while completing clinical records.

Everything is stored locally in the browser: the library, preferences, and mapping profiles. The extension does not use artificial intelligence, does not require API keys, and does not send clinical data, patient identifiers, or settings to external servers.

The professional reviews and confirms each action. EHR Copilot never fills or saves information automatically.

You can map text fields in a compatible record to keep its profile locally. Complex workflows, such as patient detection and some medication forms, may require a specialized profile.

## French

**Short description**  
Bibliothèque locale pour compléter des dossiers cliniques avec validation professionnelle.

**Detailed description**  
EHR Copilot est un panneau latéral Chrome qui aide les professionnels à réutiliser des textes, indications et médicaments lors de la saisie de dossiers cliniques.

Tout est stocké localement dans le navigateur : la bibliothèque, les préférences et les profils d’association. L’extension n’utilise pas d’intelligence artificielle, ne requiert aucune clé API et ne transmet pas de données cliniques, d’identifiants de patients ou de réglages à des serveurs externes.

Le professionnel vérifie et confirme chaque action. EHR Copilot ne remplit ni n’enregistre jamais d’informations automatiquement.

Vous pouvez associer les champs de texte d’un dossier compatible afin de conserver son profil localement. Les flux complexes, tels que la détection du patient et certains formulaires de médicaments, peuvent nécessiter un profil spécialisé.

## Store declarations

- **Single purpose:** local, clinician-controlled assistance to insert reusable content into clinical-record fields.
- **Data handling:** the extension can handle health information in the active tab only to perform a user-requested action. This information is not transmitted off device.
- **No sale, sharing, advertising, analytics, remote code, or AI features.**
- **Permissions rationale:**
  - `storage`: local templates, preferences, and mapping profiles.
  - `activeTab` and `scripting`: access only the currently active tab after an explicit user action, to detect and fill selected fields.
  - `sidePanel`: display the extension interface.
- **Support/contact:** https://github.com/natiriquelmeg/ehr-copilot/issues
