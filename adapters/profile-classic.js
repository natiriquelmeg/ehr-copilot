(() => {
  const q = (sel) => document.querySelector(sel);

  const profile = () => window.EHR_MAPPINGS.get('classic-report');
  const fieldFor = (key) => profile()?.fields?.find((field) => field.key === key);

  // Asigna valor y dispara los eventos que la página necesita para registrarlo.
  function setValue(el, value) {
    const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype
      : el instanceof HTMLSelectElement ? HTMLSelectElement.prototype
      : HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, value);
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }

  const norm = (t) => String(t ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();

  // Selecciona una opción por value o por texto visible, sin tildes ni mayúsculas y
  // tolerando plural/singular ("horas" -> "hora").
  function setSelect(el, wanted) {
    const w = norm(wanted);
    const opts = [...el.options].filter((o) => o.value !== '');
    const same = (x) => (o) => norm(o.value) === x || norm(o.text) === x;
    const opt = opts.find(same(w)) ?? opts.find(same(w.replace(/(es|s)$/, '')));
    if (!opt) return false;
    setValue(el, opt.value);
    return true;
  }

  // "1", "1/2", "1 1/2", "0,5" -> { whole, frac }. La ficha separa entero y fracción en dos selects.
  function splitPosologia(text) {
    let total = 0;
    for (const part of String(text).trim().replace(',', '.').split(/\s+/)) {
      const [n, d] = part.split('/');
      total += d ? Number(n) / Number(d) : Number(part);
    }
    if (!Number.isFinite(total)) return null;
    const whole = Math.floor(total);
    const frac = Math.round((total - whole) * 100) / 100;
    return whole === 0 ? { whole: frac, frac: 0 } : { whole, frac };
  }

  // Lee los medicamentos ya agregados a la receta:
  //   NOMBRE / Posología: 1 comprimido / Frecuencia: Cada 8 hora / Duración: Durante 3 dias / Vía: Oral
  function readMedications() {
    const field = (lines, label) => lines.find((l) => l.toLowerCase().startsWith(label))?.slice(label.length).trim();
    const listItemsSelector = profile()?.medication?.listItemsSelector;
    if (!listItemsSelector) return [];
    return [...document.querySelectorAll(listItemsSelector)].map((li) => {
      const lines = li.innerText.split('\n').map((l) => l.trim()).filter(Boolean);
      const pos = field(lines, 'posología:')?.match(/^(\S+(?: \d+\/\d+)?)\s+(.+)$/);
      const cada = field(lines, 'frecuencia:')?.match(/(\d+)\s+(\S+)/);
      const durante = field(lines, 'duración:')?.match(/(\d+)\s+(\S+)/);
      const via = field(lines, 'vía:');
      const dose = {};
      if (pos) Object.assign(dose, { posologia: pos[1], formato: pos[2] });
      if (cada) Object.assign(dose, { cada: Number(cada[1]), unidadCada: cada[2] });
      if (durante) Object.assign(dose, { durante: Number(durante[1]), unidadDurante: durante[2] });
      if (via) dose.via = via;
      return { name: lines[0], dose };
    }).filter((m) => m.name && m.dose.posologia);
  }

  window.EHR_ADAPTERS.push({
    id: 'classic-report',
    matches: () => !!profile(),
    get fields() { return (profile()?.fields ?? []).map(({ key, label }) => ({ key, label })); },

    // Encabezado: "Atención con paciente : NOMBRE - Teléfono: … - Edad: 36 años"
    getPatient() {
      const text = document.body.innerText;
      const patient = profile()?.patient ?? {};
      const nombre = patient.namePattern && text.match(new RegExp(patient.namePattern, 'i'))?.[1];
      const edad = patient.agePattern && text.match(new RegExp(patient.agePattern, 'i'))?.[1];
      return nombre ? { nombre, edad } : null;
    },

    readField(key) {
      const def = fieldFor(key);
      const el = def && q(def.selector);
      return el ? el.value.trim() : null;
    },

    fillField(key, text, { append = true } = {}) {
      const def = fieldFor(key);
      const el = def && q(def.selector);
      if (!el) return false;
      const current = el.value.trim();
      setValue(el, append && current ? `${current}\n${text}` : text);
      return true;
    },

    // Rellena el formulario de medicamento. El nombre del fármaco es un
    // autocompletar: se escribe en el buscador pero la opción la elige la usuaria,
    // y "Agregar medicamento" tampoco se pulsa solo.
    readMedications,

    fillMedication(med) {
      const notes = [];
      const d = med.dose || {};
      const medication = profile()?.medication ?? {};

      if (d.posologia != null && d.posologia !== '') {
        const p = splitPosologia(d.posologia);
        const whole = q(medication.doseWholeSelector);
        const frac = q(medication.doseFractionSelector);
        if (!p || !whole || !setSelect(whole, p.whole)) notes.push(`No pude fijar posologia="${d.posologia}"`);
        else if (p.frac && !(frac && setSelect(frac, p.frac))) notes.push(`No pude fijar la fracción de "${d.posologia}"`);
      }
      for (const [key, sel] of Object.entries(medication.selects ?? {})) {
        if (d[key] == null || d[key] === '') continue;
        const el = q(sel);
        if (!el || !setSelect(el, d[key])) notes.push(`No pude fijar ${key}="${d[key]}"`);
      }
      for (const [key, sel] of Object.entries(medication.inputs ?? {})) {
        if (d[key] == null || d[key] === '') continue;
        const el = q(sel);
        if (el) setValue(el, String(d[key]));
        else notes.push(`No encontré ${key}`);
      }
      if (d.indicaciones) {
        const el = q(medication.administrationSelector);
        if (el) setValue(el, d.indicaciones);
      }

      const search = q(medication.searchSelector);
      if (search && med.name) {
        search.focus();
        setValue(search, med.name);
        notes.push(`Elige "${med.name}" en la lista del buscador y pulsa "Agregar medicamento".`);
      } else {
        notes.push('No encontré el buscador de medicamentos.');
      }
      return { ok: true, notes };
    },
  });
})();
