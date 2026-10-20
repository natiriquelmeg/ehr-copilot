// Perfiles de fichas guardados solo en este navegador. Un perfil contiene
// selectores y etiquetas de interfaz; nunca datos de pacientes. Los perfiles
// iniciales se copian una vez por origen, de modo que después se puedan editar
// o ampliar sin permisos permanentes sobre sitios web.
(() => {
  const STORAGE_KEY = 'ehrCopilotMappings';
  const PROFILE_VERSION = 1;

  const DEFAULT_PROFILES = window.EHR_MAPPING_TEMPLATES ?? [];

  let profiles = [];

  function sameOriginProfile(profile, templateId, origin) {
    return profile.templateId === templateId && profile.origin === origin;
  }

  async function load() {
    const saved = await chrome.storage.local.get(STORAGE_KEY);
    const data = saved[STORAGE_KEY] ?? { version: PROFILE_VERSION, templates: [], profiles: [] };
    data.templates ??= [];
    data.profiles ??= [];
    const currentOrigin = location.origin;
    let changed = false;

    for (const template of DEFAULT_PROFILES) {
      if (data.templates.some((p) => p.templateId === template.templateId)) continue;
      data.templates.push({
        ...structuredClone(template),
        id: crypto.randomUUID(),
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      changed = true;
    }

    for (const template of data.templates) {
      if (!pathMatches(template)) continue;
      if (data.profiles.some((p) => sameOriginProfile(p, template.templateId, currentOrigin))) continue;
      data.profiles.push({
        ...structuredClone(template),
        id: crypto.randomUUID(),
        origin: currentOrigin,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      changed = true;
    }

    if (changed || !saved[STORAGE_KEY]) await chrome.storage.local.set({ [STORAGE_KEY]: data });
    profiles = data.profiles;
  }

  function matches(profile, loc = location) {
    if (profile.origin !== loc.origin) return false;
    return pathMatches(profile, loc);
  }

  function pathMatches(profile, loc = location) {
    const match = profile.match ?? {};
    return (!match.pathIncludes || loc.pathname.includes(match.pathIncludes))
      && (!match.pathStartsWith || loc.pathname.startsWith(match.pathStartsWith));
  }

  window.EHR_MAPPINGS = {
    get: (templateId, loc = location) => profiles.find((p) => p.templateId === templateId && matches(p, loc)) ?? null,
    findCustom: (loc = location) => profiles.find((p) => p.kind === 'custom' && matches(p, loc)) ?? null,
    matches,
    storageKey: STORAGE_KEY,
    reload: load,
  };
  window.EHR_MAPPINGS_READY = load();
})();
