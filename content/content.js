(() => {
  // En apps de una sola página la URL cambia sin recargar: se resuelve en cada mensaje.
  const currentAdapter = () => window.EHR_ADAPTERS.find((a) => a.matches(location));

  async function handle(msg) {
    await window.EHR_MAPPINGS_READY;
    switch (msg.type) {
      case 'EHR_MAP_START':
        return window.EHR_MAPPING_PICKER.start(msg.key, msg.label, msg.instruction);
      case 'EHR_MAP_STOP':
        window.EHR_MAPPING_PICKER.stop();
        return { ok: true };
      case 'EHR_MAPPING_REFRESH':
        await window.EHR_MAPPINGS.reload();
        return { ok: true };
    }
    const adapter = currentAdapter();
    if (!adapter) return { ok: false, error: `Ningún adaptador reconoce ${location.hostname}${location.pathname}` };
    switch (msg.type) {
      case 'EHR_DETECT':
        return { ok: true, id: adapter.id, fields: adapter.fields };
      case 'EHR_PATIENT':
        return { ok: true, patient: adapter.getPatient?.() ?? null };
      case 'EHR_READ_FIELD':
        return { ok: true, text: adapter.readField(msg.key) };
      case 'EHR_FILL_FIELD':
        return { ok: await adapter.fillField(msg.key, msg.text, { append: msg.append !== false }) };
      case 'EHR_READ_MEDICATIONS':
        return { ok: true, meds: adapter.readMedications?.() ?? [] };
      case 'EHR_FILL_MEDICATION':
        return adapter.fillMedication(msg.med);
      default:
        return { ok: false, error: 'Mensaje desconocido' };
    }
  }

  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    handle(msg).then(sendResponse, (e) => sendResponse({ ok: false, error: e.message }));
    return true; // respuesta asíncrona
  });
})();
