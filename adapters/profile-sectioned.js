(() => {
  // Ficha React con componentes Radix. Los ids son generados y no hay `name`, así que
  // los campos se ubican por el perfil local. Los acordeones cerrados no
  // montan su contenido: hay que abrirlos antes de buscar el campo.
  const profile = () => window.EHR_MAPPINGS.get('sectioned-form');
  const fieldFor = (key) => profile()?.fields?.find((field) => field.key === key);

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const q = (sel) => document.querySelector(sel);

  function setValue(el, value) {
    const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, value);
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }

  async function waitFor(sel, ms = 1500) {
    for (let t = 0; t < ms; t += 100) {
      const el = q(sel);
      if (el) return el;
      await sleep(100);
    }
    return null;
  }

  const norm = (t) => String(t ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();

  // Los <select> de Radix son un espejo oculto del combobox: asignar value + `change`
  // actualiza el estado de React. Devuelve true si la opción existe.
  function setNativeSelect(sel, wanted) {
    const w = norm(wanted);
    const opts = [...sel.options].filter((o) => o.value !== '');
    const opt = opts.find((o) => norm(o.value) === w || norm(o.text) === w)
      ?? opts.find((o) => norm(o.text).startsWith(w) || w.startsWith(norm(o.text)));
    if (!opt) return false;
    Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set.call(sel, opt.value);
    sel.dispatchEvent(new Event('change', { bubbles: true }));
    return true;
  }

  // Espera el modal de detalles (hasta 60 s) y lo rellena. Orden de los selects del modal:
  // formato, unidad de "cada", unidad de "durante", vía.
  async function fillDoseWhenModalOpens(d) {
    const dosis = await waitFor(profile()?.medication?.doseSelector, 60000);
    if (!dosis) return;
    const modal = dosis.closest('[role="dialog"]') ?? dosis.closest('form') ?? document;
    const text = (name, v) => {
      const el = modal.querySelector(`[name="${name}"]`);
      if (el && v != null && v !== '') setValue(el, String(v));
    };
    text('dosis', d.posologia);
    text('cada', d.cada);
    text('durante', d.durante);
    text('indicacionAdministracion', d.indicaciones);

    const [formato, unidadCada, unidadDurante, via] = modal.querySelectorAll('select');
    const failed = [];
    for (const [key, sel] of Object.entries({ formato, unidadCada, unidadDurante, via })) {
      if (d[key] == null || d[key] === '' || !sel) continue;
      if (!setNativeSelect(sel, d[key])) failed.push(`${key}="${d[key]}"`);
    }
    if (failed.length) console.warn('[EHR Copilot] No pude fijar:', failed.join(', '));
  }

  // Lee los medicamentos ya guardados en la receta (tarjetas bajo "Medicamentos en ficha
  // clínica"). Cada tarjeta: nombre, código ATC, "<dosis> <formato> cada N <unidad> durante
  // N <unidad>" y, si se eligió, "Vía: X". No se lee nada del paciente.
  const DOSE_LINE = /^(\d+(?:[.,]\d+)?(?: \d+\/\d+)?|\d+\/\d+) (.+?) cada (\S+) (\S+) durante (\S+) (\S+)$/;

  // Las tarjetas comparten un mismo contenedor, así que se lee el texto en secuencia: el
  // nombre es la última línea que no es código ATC, vía ni dosis antes de cada línea de dosis.
  function parseMeds(text) {
    const lines = text.split('\n').map((l) => l.trim()).filter((l) => l && l !== '×');
    const isNoise = (l) => /^\([A-Z0-9]+\)$/.test(l) || /^vía:/i.test(l) || DOSE_LINE.test(l) || /^medicamentos en ficha/i.test(l);
    const meds = [];
    lines.forEach((line, i) => {
      const m = line.match(DOSE_LINE);
      if (!m) return;
      const name = lines.slice(0, i).reverse().find((l) => !isNoise(l));
      if (!name) return;
      const dose = {
        posologia: m[1], formato: m[2], cada: Number(m[3]), unidadCada: m[4],
        durante: Number(m[5]), unidadDurante: m[6],
      };
      // La vía, si existe, va tras la dosis y antes del nombre de la siguiente tarjeta.
      for (const l of lines.slice(i + 1)) {
        if (/^vía:/i.test(l)) { dose.via = l.replace(/^vía:\s*/i, ''); break; }
        if (!isNoise(l)) break;
      }
      meds.push({ name, dose });
    });
    return meds;
  }

  function readMedications() {
    const headingPattern = new RegExp(profile()?.medication?.savedListHeadingPattern ?? '^medicamentos en ficha cl', 'i');
    const heading = [...document.querySelectorAll('*')]
      .find((e) => e.children.length === 0 && headingPattern.test(e.textContent.trim()));
    let box = heading?.parentElement;
    for (let up = 0; box && up < 3; up++, box = box.parentElement) {
      const meds = parseMeds(box.innerText);
      if (meds.length) return meds;
    }
    return [];
  }

  // Abre el acordeón cuyo encabezado empieza con `title` (si está cerrado).
  async function openSection(title) {
    const btn = [...document.querySelectorAll('button[aria-expanded]')]
      .find((b) => b.innerText.trim().toLowerCase().startsWith(title.toLowerCase()));
    if (btn && btn.getAttribute('aria-expanded') === 'false') btn.click();
  }

  window.EHR_ADAPTERS.push({
    id: 'sectioned-form',
    matches: () => !!profile(),
    get fields() { return (profile()?.fields ?? []).map(({ key, label }) => ({ key, label })); },

    // Encabezado: <h2 aria-haspopup="dialog">NOMBRE APELLIDO</h2> junto a "Plan: …".
    // La edad no se muestra en el encabezado, así que {{edad}} queda sin resolver.
    getPatient() {
      const patient = profile()?.patient ?? {};
      const plan = [...document.querySelectorAll(patient.planSelector ?? 'span')].find((s) => /^plan:/i.test(s.textContent.trim()));
      const h2 = plan?.closest('div.mb-3')?.querySelector('h2') ?? q(patient.headerSelector);
      const nombre = h2?.textContent.trim();
      return nombre ? { nombre } : null;
    },

    // Solo lee campos ya montados: no despliega acordeones para no alterar la pantalla.
    readField(key) {
      const def = fieldFor(key);
      const el = def && q(def.selector);
      return el ? el.value.trim() : null;
    },

    async fillField(key, text, { append = true } = {}) {
      const def = fieldFor(key);
      if (!def) return false;
      let el = q(def.selector);
      if (!el) {
        await openSection(def.section);
        el = await waitFor(def.selector);
      }
      if (!el) return false;
      const current = el.value.trim();
      setValue(el, append && current ? `${current}\n${text}` : text);
      return true;
    },

    readMedications,

    // El fármaco lo elige la usuaria en la lista (hay presentaciones repetidas). Al elegirlo
    // se abre el modal "Detalles del medicamento": ahí rellenamos la posología. "Guardar" lo
    // pulsa ella.
    async fillMedication(med) {
      const medication = profile()?.medication ?? {};
      await openSection(medication.recipeSection ?? 'Receta');
      const search = await waitFor(medication.searchSelector);
      if (!search) return { ok: false, error: 'No encontré el buscador de medicamentos' };
      search.focus();
      setValue(search, med.name);
      const hasDose = Object.values(med.dose ?? {}).some((v) => v != null && v !== '');
      if (hasDose) fillDoseWhenModalOpens(med.dose);
      return {
        ok: true,
        notes: [`Elige "${med.name}" en la lista${hasDose ? ': completaré la posología y tú pulsas "Guardar"' : ''}.`],
      };
    },
  });
})();
