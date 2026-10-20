import { db } from '../core/db.js';
import { getLocale, initI18n, setLocale, t } from '../core/i18n.js';
import { anonymize, applyVars } from '../core/placeholders.js';
import '../content/mapping-templates.js';

const $ = (s) => document.querySelector(s);
const fallbackFields = () => [{ key: 'indicaciones', label: t('fieldIndicaciones') }];
const CONTENT_SCRIPT_FILES = [
  'content/registry.js',
  'content/mapping-templates.js',
  'content/mappings.js',
  'content/mapping-picker.js',
  'adapters/profile-mapped.js',
  'adapters/profile-classic.js',
  'adapters/profile-sectioned.js',
  'content/content.js',
];
const MAPPINGS_STORAGE_KEY = 'ehrCopilotMappings';
const MAPPING_TEMPLATES = window.EHR_MAPPING_TEMPLATES ?? [];

let tab = 'indicaciones';
let adapterFields = fallbackFields();
let connected = false;
let activeTag = null; // filtro por etiqueta en Medicamentos
let mappingDraft = null;

function localizeStatic() {
  document.querySelectorAll('[data-i18n]').forEach((element) => { element.textContent = t(element.dataset.i18n); });
  document.querySelectorAll('[data-i18n-placeholder]').forEach((element) => { element.placeholder = t(element.dataset.i18nPlaceholder); });
  document.querySelectorAll('[data-i18n-title]').forEach((element) => { element.title = t(element.dataset.i18nTitle); });
  document.querySelectorAll('[data-i18n-aria]').forEach((element) => { element.setAttribute('aria-label', t(element.dataset.i18nAria)); });
  if (!connected) $('#status').textContent = t('disconnected');
  $('#locale').value = getLocale();
}

// ---------- utilidades ----------
function el(tag, props = {}, ...kids) {
  const e = Object.assign(document.createElement(tag), props);
  e.append(...kids);
  return e;
}

let toastTimer;
function toast(msg, warn = false) {
  const t = $('#toast');
  t.textContent = msg;
  t.className = `show${warn ? ' warn' : ''}`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (t.className = ''), warn ? 6000 : 2500);
}

async function sendToPage(message) {
  const [active] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  if (!active?.id) throw new Error(t('noActiveTab'));
  try {
    return await chrome.tabs.sendMessage(active.id, message);
  } catch {
    // Sin content script (extensión recargada o ficha abierta antes): lo inyectamos y reintentamos.
    try {
      await chrome.scripting.executeScript({ target: { tabId: active.id }, files: CONTENT_SCRIPT_FILES });
      return await chrome.tabs.sendMessage(active.id, message);
    } catch (e) {
      throw new Error(t('incompatibleTab', { host: new URL(active.url).hostname }));
    }
  }
}

async function detect() {
  try {
    const r = await sendToPage({ type: 'EHR_DETECT' });
    connected = !!r?.ok;
    if (connected) adapterFields = r.fields;
    else adapterFields = fallbackFields();
    $('#status').textContent = connected ? t('connected') : t('incompatible');
    $('#status').title = connected ? '' : (r?.error ?? '');
  } catch (e) {
    connected = false;
    adapterFields = fallbackFields();
    $('#status').textContent = t('incompatible');
    $('#status').title = e.message;
  }
  $('#status').classList.toggle('ok', connected);
  setupCapture();
}

// Datos del paciente de la ficha en uso. Solo en memoria, nunca se guardan.
async function getPatient() {
  const r = await sendToPage({ type: 'EHR_PATIENT' });
  return r?.ok ? r.patient : null;
}

async function fillField(key, text, append = true) {
  const resolved = applyVars(text, await getPatient());
  const r = await sendToPage({ type: 'EHR_FILL_FIELD', key, text: resolved.text, append });
  if (!r?.ok) throw new Error(t('couldNotFill', { field: key }));
  if (resolved.missing.length) {
    toast(t('missingVars', { variables: resolved.missing.map((m) => `{{${m}}}`).join(', ') }), true);
  }
}

async function loadMedication(med) {
  const r = await sendToPage({ type: 'EHR_FILL_MEDICATION', med });
  if (!r?.ok) throw new Error(r?.error ?? 'No pude cargar el medicamento');
  toast(r.notes.join(' '), r.notes.length > 0);
}

const run = (fn) => async (...a) => {
  try { await fn(...a); } catch (e) { toast(e.message, true); }
};

// ---------- esquemas de edición ----------
const FIELD_LABEL_KEYS = { motivo: 'fieldMotivo', anamnesis: 'fieldAnamnesis', indicaciones: 'fieldIndicaciones', certificado: 'fieldCertificado', control: 'fieldControl', observacion: 'fieldObservacion' };
const fieldOptions = () => adapterFields.map((f) => [f.key, FIELD_LABEL_KEYS[f.key] ? t(FIELD_LABEL_KEYS[f.key]) : f.label]);

const SCHEMAS = {
  indicaciones: {
    title: (i) => i.title,
    preview: (i) => i.text,
    fields: () => [
      { name: 'title', label: t('title'), type: 'text', required: true },
      { name: 'field', label: t('ehrField'), type: 'select', options: fieldOptions() },
      { name: 'text', label: t('templateText'), type: 'textarea', rows: 6, required: true },
    ],
    defaults: { field: 'indicaciones' },
  },
  medicamentos: {
    title: (m) => m.name,
    preview: (m) => {
      const d = m.dose ?? {};
      return [d.posologia, d.formato, d.cada && `cada ${d.cada} ${d.unidadCada ?? ''}`, d.via, d.durante && `por ${d.durante} ${d.unidadDurante ?? ''}`]
        .filter(Boolean).join(' · ');
    },
    fields: () => [
      { name: 'name', label: t('medicationName'), type: 'text', required: true },
      { name: 'tags', label: t('tags'), type: 'tags' },
      { name: 'dose.posologia', label: t('dosage'), type: 'text' },
      { name: 'dose.formato', label: t('format'), type: 'text' },
      { name: 'dose.cada', label: t('every'), type: 'number' },
      { name: 'dose.unidadCada', label: t('unit'), type: 'text' },
      { name: 'dose.via', label: t('route'), type: 'text' },
      { name: 'dose.durante', label: t('during'), type: 'number' },
      { name: 'dose.unidadDurante', label: t('durationUnit'), type: 'text' },
      { name: 'dose.indicaciones', label: t('administration'), type: 'textarea', rows: 2 },
    ],
    defaults: {},
  },
};

const parseTags = (s) => [...new Set(s.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean))];
const allTags = (items) => [...new Set(items.flatMap((i) => i.tags ?? []))].sort((a, b) => a.localeCompare(b, getLocale()));

const getPath = (o, path) => path.split('.').reduce((v, k) => v?.[k], o);
function setPath(o, path, value) {
  const keys = path.split('.');
  const last = keys.pop();
  const target = keys.reduce((v, k) => (v[k] ??= {}), o);
  if (value === '' || value == null) delete target[last]; else target[last] = value;
}

// ---------- biblioteca ----------
// Nombres de respaldo para cuando no hay ficha conectada y adapterFields es la lista mínima.
const fieldLabel = (key) => FIELD_LABEL_KEYS[key] ? t(FIELD_LABEL_KEYS[key]) : adapterFields.find((f) => f.key === key)?.label ?? key;

function tagButton(tag) {
  return el('button', {
    type: 'button', textContent: tag, className: `tag${tag === activeTag ? ' on' : ''}`,
    onclick: () => { activeTag = activeTag === tag ? null : tag; renderList(); },
  });
}

function renderTagBar(tags) {
  const bar = $('#tagbar');
  bar.hidden = !tags.length;
  bar.replaceChildren(...tags.map(tagButton));
}

async function renderList() {
  const schema = SCHEMAS[tab];
  const q = $('#search').value.trim().toLowerCase();
  const all = (await db.list(tab)).sort((a, b) => schema.title(a).localeCompare(schema.title(b), getLocale()));
  const tags = tab === 'medicamentos' ? allTags(all) : [];
  if (activeTag && !tags.includes(activeTag)) activeTag = null;
  renderTagBar(tags);
  const items = all.filter((i) => (!q || JSON.stringify(i).toLowerCase().includes(q)) && (!activeTag || i.tags?.includes(activeTag)));
  const ul = $('#list');
  ul.replaceChildren();
  if (!items.length) {
    ul.append(el('li', { className: 'empty' }, all.length ? t('emptySearch') : t('emptyLibrary')));
    return;
  }
  for (const item of items) {
    const actions = el('div', { className: 'actions' });
    if (tab === 'indicaciones') {
      actions.append(el('button', { textContent: t('insert'), className: 'primary', onclick: run(async () => {
        await fillField(item.field ?? 'indicaciones', item.text);
        toast(t('inserted'));
      }) }));
    } else if (tab === 'medicamentos') {
      actions.append(el('button', { textContent: t('loadInRecord'), className: 'primary', onclick: run(() => loadMedication(item)) }));
    }
    actions.append(
      el('button', { textContent: t('edit'), onclick: () => openEditor(item) }),
      el('button', { textContent: t('delete'), onclick: run(async () => {
        if (!confirm(t('deleteConfirm', { title: schema.title(item) }))) return;
        await db.remove(tab, item.id);
        renderList();
      }) }),
    );
    const head = el('div', { className: 'title-row' }, el('h4', {}, schema.title(item)));
    if (tab === 'indicaciones') head.append(el('span', { className: 'chip', textContent: fieldLabel(item.field ?? 'indicaciones') }));
    const card = el('li', {}, head, el('p', {}, schema.preview(item) ?? ''));
    if (item.tags?.length) card.append(el('div', { className: 'tags' }, ...item.tags.map((t) => tagButton(t))));
    card.append(actions);
    ul.append(card);
  }
}

// ---------- editor ----------
async function openEditor(item = null) {
  const schema = SCHEMAS[tab];
  const form = $('#editor');
  const data = structuredClone(item ?? schema.defaults);
  form.replaceChildren();

  for (const f of schema.fields()) {
    let input;
    if (f.type === 'textarea') input = el('textarea', { rows: f.rows ?? 3 });
    else if (f.type === 'select') {
      input = el('select');
      for (const [v, l] of f.options) input.append(el('option', { value: v, textContent: l }));
    } else if (f.type === 'meds') {
      const meds = await db.list('medicamentos');
      input = el('div');
      if (!meds.length) input.append(el('span', { className: 'hint', textContent: t('createMedicationsFirst') }));
      for (const m of meds) {
        const cb = el('input', { type: 'checkbox', value: m.id, checked: (data.medicamentoIds ?? []).includes(m.id) });
        cb.style.width = 'auto';
        input.append(el('label', {}, cb, ` ${m.name}`));
      }
      input.dataset.meds = '1';
    } else if (f.type === 'tags') {
      input = el('input', { type: 'text', value: (data.tags ?? []).join(', ') });
      input.dataset.tags = '1';
      const known = allTags(await db.list('medicamentos'));
      form.append(el('label', {}, f.label, input));
      if (known.length) {
        form.append(el('div', { className: 'tags suggest' }, ...known.map((t) => el('button', {
          type: 'button', className: 'tag', textContent: `+ ${t}`,
          onclick: () => { input.value = [...new Set([...parseTags(input.value), t])].join(', '); },
        }))));
      }
      continue;
    } else input = el('input', { type: f.type });

    if (!input.dataset.meds) {
      input.name = f.name;
      input.required = !!f.required;
      input.value = getPath(data, f.name) ?? '';
    }
    form.append(el('label', {}, f.label, input));
  }

  form.append(el('div', { className: 'row' },
    el('button', { type: 'submit', className: 'primary', textContent: t('save') }),
    el('button', { type: 'button', textContent: t('cancel'), onclick: closeEditor }),
  ));

  form.onsubmit = run(async (e) => {
    e.preventDefault();
    const out = { ...data };
    for (const input of form.querySelectorAll('[name]')) {
      setPath(out, input.name, input.type === 'number' && input.value ? Number(input.value) : input.value.trim());
    }
    const tagInput = form.querySelector('[data-tags]');
    if (tagInput) {
      const tags = parseTags(tagInput.value);
      if (tags.length) out.tags = tags; else delete out.tags;
    }
    const medBox = form.querySelector('[data-meds]');
    if (medBox) out.medicamentoIds = [...medBox.querySelectorAll('input:checked')].map((c) => c.value);
    await db.put(tab, out);
    closeEditor();
    toast(t('saved'));
  });

  $('#lib').hidden = true;
  form.hidden = false;
}

function closeEditor() {
  $('#editor').hidden = true;
  showTab(tab);
}

// ---------- captura desde la ficha ----------
const privacyHint = () => t('privacyHint');

async function readField(key) {
  const r = await sendToPage({ type: 'EHR_READ_FIELD', key });
  return r?.ok ? r.text : null;
}

function setupCapture() {
  const show = tab === 'indicaciones' || tab === 'medicamentos';
  $('#capture').hidden = !show;
  $('#cap-field').hidden = $('#cap-one').hidden = tab !== 'indicaciones';
  $('#cap-meds').hidden = tab !== 'medicamentos';
  $('#cap-field').replaceChildren(...fieldOptions().map(([v, l]) => el('option', { value: v, textContent: l })));
}

// Cambia el nombre y la edad del paciente por marcadores antes de guardar la plantilla.
function captureResult(count, patient) {
  if (!patient) return t('patientUnreadable', { hint: privacyHint() });
  return count
    ? t('patientReplaced', { count })
    : t('patientNotFound', { hint: privacyHint() });
}

$('#cap-one').onclick = run(async () => {
  const key = $('#cap-field').value;
  const raw = await readField(key);
  if (!raw) throw new Error(t('fieldEmpty'));
  const patient = await getPatient();
  const { text, count } = anonymize(raw, patient);
  await openEditor({ field: key, text });
  toast(captureResult(count, patient), true);
});

// Guarda en la biblioteca los medicamentos de la receta (reusa los que ya existen igual).
async function captureMedications() {
  const r = await sendToPage({ type: 'EHR_READ_MEDICATIONS' });
  const existing = await db.list('medicamentos');
  const ids = [];
  let added = 0;
  for (const med of r?.meds ?? []) {
    const same = existing.find((m) => m.name === med.name && JSON.stringify(m.dose ?? {}) === JSON.stringify(med.dose));
    if (!same) added++;
    ids.push(same?.id ?? (await db.put('medicamentos', med)).id);
  }
  return { ids, added };
}

$('#cap-meds').onclick = run(async () => {
  const { ids, added } = await captureMedications();
  if (!ids.length) throw new Error(t('prescriptionNotFound'));
  await renderList();
  toast(t('medicationImported', { added, existing: ids.length > added ? `, ${ids.length - added}` : '' }));
});

// ---------- pestañas ----------
function showTab(name) {
  tab = name;
  activeTag = null;
  setupCapture();
  document.querySelectorAll('#tabs button').forEach((b) => b.classList.toggle('active', b.dataset.tab === name));
  const isLib = name in SCHEMAS;
  $('#lib').hidden = !isLib;
  $('#editor').hidden = true;
  $('#ajustes').hidden = name !== 'ajustes';
  if (isLib) renderList();
  if (name === 'ajustes') renderMappingProfiles();
}

// ---------- ajustes ----------
const MAP_FIELDS = [
  ['motivo', 'fieldMotivo'], ['anamnesis', 'fieldAnamnesis'], ['indicaciones', 'fieldIndicaciones'],
  ['certificado', 'fieldCertificado'], ['control', 'fieldControl'], ['observacion', 'fieldObservacion'],
];

async function openMappingEditor() {
  const [active] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  if (!active?.url || !/^https?:/.test(active.url)) throw new Error(t('openRecordToMap'));
  const url = new URL(active.url);
  mappingDraft = {
    providerName: '', label: t('customRecord'), origin: url.origin, pathPrefix: url.pathname, fields: {},
  };
  const form = $('#mapping-editor');
  form.replaceChildren();

  const provider = el('input', { type: 'text', placeholder: t('providerExample') });
  provider.oninput = () => { mappingDraft.providerName = provider.value; };
  const label = el('input', { type: 'text', value: mappingDraft.label });
  label.oninput = () => { mappingDraft.label = label.value; };
  const path = el('input', { type: 'text', value: mappingDraft.pathPrefix });
  path.oninput = () => { mappingDraft.pathPrefix = path.value; };
  form.append(
    el('h3', { textContent: t('mappingTitle') }),
    el('p', { className: 'hint', textContent: t('site', { origin: url.origin }) }),
    el('label', {}, t('providerLocal'), provider), el('label', {}, t('profileName'), label), el('label', {}, t('routePrefix'), path),
    el('p', { className: 'hint', textContent: t('mappingHelp') }),
  );

  for (const [key, labelKey] of MAP_FIELDS) {
    const fieldLabel = t(labelKey);
    const selector = el('input', { type: 'text', readOnly: true, placeholder: t('notSelected') });
    selector.dataset.mapField = key;
    const choose = el('button', { type: 'button', textContent: t('choose') });
    choose.onclick = run(async () => {
      const result = await sendToPage({ type: 'EHR_MAP_START', key, label: fieldLabel, instruction: t('pickerInstruction', { field: fieldLabel }) });
      if (!result?.ok) throw new Error(result?.error ?? 'No pude iniciar el selector');
      toast(t('chooseInRecord', { field: fieldLabel }));
    });
    form.append(el('div', { className: 'mapping-field' }, el('label', { textContent: fieldLabel }, selector), choose));
  }

  form.append(el('div', { className: 'row' },
    el('button', { type: 'submit', className: 'primary', textContent: t('saveMapping') }),
    el('button', { type: 'button', textContent: t('cancel'), onclick: closeMappingEditor }),
  ));
  form.onsubmit = run(saveMapping);
  $('#mapping-list').hidden = true;
  $('#start-mapping').hidden = true;
  form.hidden = false;
}

function closeMappingEditor() {
  mappingDraft = null;
  $('#mapping-editor').hidden = true;
  $('#mapping-list').hidden = false;
  $('#start-mapping').hidden = false;
  sendToPage({ type: 'EHR_MAP_STOP' }).catch(() => {});
}

async function saveMapping(event) {
  event.preventDefault();
  const fields = MAP_FIELDS.flatMap(([key, labelKey]) => {
    const selector = mappingDraft.fields[key];
    return selector ? [{ key, label: t(labelKey), selector }] : [];
  });
  if (!fields.length) throw new Error(t('mapAtLeastOne'));
  if (!mappingDraft.pathPrefix.trim()) throw new Error(t('pathRequired'));

  const mappings = await ensureMappingTemplates();
  const now = Date.now();
  mappings.profiles.push({
    id: crypto.randomUUID(),
    templateId: `custom-${crypto.randomUUID()}`,
    kind: 'custom',
    providerName: mappingDraft.providerName.trim(),
    label: mappingDraft.label.trim() || t('customRecord'),
    origin: mappingDraft.origin,
    match: { pathStartsWith: mappingDraft.pathPrefix.trim() },
    fields,
    createdAt: now,
    updatedAt: now,
  });
  await chrome.storage.local.set({ [MAPPINGS_STORAGE_KEY]: mappings });
  await sendToPage({ type: 'EHR_MAPPING_REFRESH' });
  closeMappingEditor();
  await detect();
  await renderMappingProfiles();
  toast(t('mappingSaved'));
}

chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'EHR_MAPPING_PICK_CANCELLED') toast(t('fieldSelectionCancelled'));
  if (message.type !== 'EHR_MAPPING_FIELD_PICKED' || !mappingDraft) return;
  mappingDraft.fields[message.key] = message.selector;
  const input = document.querySelector(`[data-map-field="${message.key}"]`);
  if (input) input.value = message.selector;
  toast(t('fieldSelected'));
});

async function renderMappingProfiles() {
  const mappings = await ensureMappingTemplates();
  const profiles = [...(mappings?.templates ?? []), ...(mappings?.profiles ?? []).filter((profile) => profile.kind === 'custom')];
  const list = $('#mapping-list');
  list.replaceChildren();
  if (!profiles.length) {
    list.append(el('p', { className: 'hint', textContent: t('noProfiles') }));
    return;
  }

  for (const profile of profiles) {
    const name = el('input', { type: 'text', value: profile.providerName ?? '', placeholder: t('providerName') });
    const save = el('button', { type: 'button', textContent: t('save') });
    save.onclick = run(async () => {
      const { [MAPPINGS_STORAGE_KEY]: current } = await chrome.storage.local.get(MAPPINGS_STORAGE_KEY);
      const collection = current?.profiles?.some((item) => item.id === profile.id) ? 'profiles' : 'templates';
      const saved = current?.[collection]?.map((item) => {
        if (item.id !== profile.id) return item;
        const providerName = name.value.trim();
        const updated = { ...item, updatedAt: Date.now() };
        if (providerName) updated.providerName = providerName;
        else delete updated.providerName;
        return updated;
      }) ?? [];
      await chrome.storage.local.set({ [MAPPINGS_STORAGE_KEY]: { ...current, [collection]: saved } });
      toast(t('profileSaved'));
      renderMappingProfiles();
    });
    list.append(el('div', { className: 'mapping' },
      el('strong', { textContent: profile.providerName || profile.label }),
      el('p', { className: 'hint', textContent: profile.origin ?? t('availableToMap') }),
      el('label', {}, t('providerName'), name),
      save,
    ));
  }
}

async function ensureMappingTemplates() {
  const { [MAPPINGS_STORAGE_KEY]: saved } = await chrome.storage.local.get(MAPPINGS_STORAGE_KEY);
  const mappings = saved ?? { version: 1, templates: [], profiles: [] };
  mappings.templates ??= [];
  mappings.profiles ??= [];
  let changed = false;
  for (const template of MAPPING_TEMPLATES) {
    if (mappings.templates.some((item) => item.templateId === template.templateId)) continue;
    mappings.templates.push({
      ...structuredClone(template), id: crypto.randomUUID(), createdAt: Date.now(), updatedAt: Date.now(),
    });
    changed = true;
  }
  if (changed || !saved) await chrome.storage.local.set({ [MAPPINGS_STORAGE_KEY]: mappings });
  return mappings;
}

$('#s-export').onclick = run(async () => {
  const backup = await db.exportAll();
  const { [MAPPINGS_STORAGE_KEY]: mappings } = await chrome.storage.local.get(MAPPINGS_STORAGE_KEY);
  if (mappings) backup.mappings = mappings;
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const a = el('a', { href: URL.createObjectURL(blob), download: `ehr-copilot-${new Date().toISOString().slice(0, 10)}.json` });
  a.click();
  URL.revokeObjectURL(a.href);
});
$('#s-import').onclick = () => $('#s-file').click();
$('#s-file').onchange = run(async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const backup = JSON.parse(await file.text());
  await db.importAll(backup);
  if (backup.mappings?.profiles) await chrome.storage.local.set({ [MAPPINGS_STORAGE_KEY]: backup.mappings });
  e.target.value = '';
  if (!$('#ajustes').hidden) await renderMappingProfiles();
  toast(t('imported'));
});

// ---------- arranque ----------
document.querySelectorAll('#tabs button').forEach((b) => (b.onclick = () => showTab(b.dataset.tab)));
$('#settings').onclick = () => showTab('ajustes');
$('#start-mapping').onclick = run(openMappingEditor);
$('#locale').onchange = run(async () => {
  await setLocale($('#locale').value);
  location.reload();
});
$('#search').oninput = renderList;
$('#new').onclick = () => openEditor();
$('#refresh').onclick = async () => {
  const btn = $('#refresh');
  btn.classList.add('spin');
  await detect();
  btn.classList.remove('spin');
  if (!$('#editor').hidden) return; // no cerrar un formulario a medias
  showTab(tab);
  toast(connected ? t('connected') : $('#status').title || t('incompatible'), !connected);
};
chrome.tabs.onActivated.addListener(detect);
chrome.tabs.onUpdated.addListener((_id, info) => info.status === 'complete' && detect());
initI18n().then(() => {
  localizeStatic();
  detect().then(() => showTab('indicaciones'));
});
