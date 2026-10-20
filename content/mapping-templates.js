// Definiciones iniciales de los perfiles de ficha. Este archivo no identifica
// proveedores: solo describe estructuras de interfaz reutilizables.
window.EHR_MAPPING_TEMPLATES = [
  {
    templateId: 'classic-report',
    label: 'Ficha clínica',
    match: { pathIncludes: 'Atencion_Box' },
    fields: [
      { key: 'motivo', label: 'Motivo de consulta', selector: 'textarea[name="motivoConsultaMedico"]' },
      { key: 'anamnesis', label: 'Anamnesis / Antecedentes / Plan', selector: 'textarea[name="DiagnosticoMedico"]' },
      { key: 'otrosExamenes', label: 'Otros exámenes', selector: 'textarea[name="ExamenMedico"]' },
      { key: 'indicaciones', label: 'Indicaciones', selector: 'textarea[name="TratamientoMedico"]' },
      { key: 'certificado', label: 'Certificado médico', selector: 'textarea[name="CertificadoMedico"]' },
      { key: 'control', label: 'Control', selector: 'textarea[name="ControlMedico"]' },
      { key: 'observacion', label: 'Observación profesional (no visible)', selector: 'textarea[name="Observaciones"]' },
    ],
    patient: {
      namePattern: 'Atención con paciente\\s*:\\s*(.+?)\\s+-\\s+Teléfono',
      agePattern: 'Edad:\\s*(\\d+)',
    },
    medication: {
      listItemsSelector: '#listaMedicamentos li.medication-item',
      selects: {
        formato: '#select_formato', unidadCada: '#select_unidadTiempoCada',
        via: '#select_via', unidadDurante: '#select_unidadTiempoDurante',
      },
      inputs: { cada: '#input_cada', durante: '#input_durante' },
      doseWholeSelector: '#input_posologia',
      doseFractionSelector: '#input_posologia_decimal',
      administrationSelector: '#input_indicacionesadmin',
      searchSelector: '#input_codigoMedicamento',
    },
  },
  {
    templateId: 'sectioned-form',
    label: 'Ficha clínica por secciones',
    match: { pathStartsWith: '/box/' },
    fields: [
      { key: 'anamnesis', label: 'Anamnesis', section: 'Historia Clínica', selector: 'textarea[placeholder^="Ingrese anamnesis"]' },
      { key: 'indicaciones', label: 'Indicaciones generales', section: 'Indicaciones', selector: 'textarea[placeholder^="Ingrese indicaciones generales"]' },
      { key: 'certificado', label: 'Certificados', section: 'Indicaciones', selector: 'textarea[placeholder^="Ingrese certificados"]' },
    ],
    patient: { planSelector: 'span', headerSelector: 'h2[aria-haspopup="dialog"]' },
    medication: {
      recipeSection: 'Receta',
      searchSelector: 'input[placeholder^="Buscar medicamento"]',
      doseSelector: 'input[name="dosis"]',
      savedListHeadingPattern: '^medicamentos en ficha cl',
    },
  },
];
