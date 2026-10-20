// Registro de adaptadores. Cada ficha (EHR) añade el suyo en adapters/<nombre>.js.
// Contrato de un adaptador:
//   id: string
//   matches(location): boolean
//   fields: lista de { key, label } que sabe rellenar (para mostrar en el panel)
//   getPatient(): { nombre, edad? } | null   // datos del encabezado, solo en memoria
//   readField(key): string | null          // texto actual del campo (null si no existe)
//   fillField(key, text, { append }): boolean
//   fillMedication(med): { ok, notes[] }   // NO guarda: el usuario confirma
window.EHR_ADAPTERS = window.EHR_ADAPTERS || [];
