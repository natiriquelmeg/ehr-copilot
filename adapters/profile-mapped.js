(() => {
  const profile = () => window.EHR_MAPPINGS.findCustom(location);
  const fieldFor = (key) => profile()?.fields?.find((field) => field.key === key);
  const q = (selector) => document.querySelector(selector);

  function setValue(el, value) {
    const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, value);
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }

  window.EHR_ADAPTERS.push({
    id: 'mapped-profile',
    matches: () => !!profile(),
    get fields() { return (profile()?.fields ?? []).map(({ key, label }) => ({ key, label })); },
    getPatient: () => null,
    readField(key) {
      const field = fieldFor(key);
      const el = field && q(field.selector);
      return el ? el.value.trim() : null;
    },
    fillField(key, text, { append = true } = {}) {
      const field = fieldFor(key);
      const el = field && q(field.selector);
      if (!el) return false;
      const current = el.value.trim();
      setValue(el, append && current ? `${current}\n${text}` : text);
      return true;
    },
    readMedications: () => [],
    fillMedication: () => ({ ok: false, error: 'Este perfil aún no tiene medicamentos mapeados.' }),
  });
})();
