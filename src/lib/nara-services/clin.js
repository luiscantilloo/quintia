/** Editar SOLO este archivo para Psicólogo clínico. */
export default {
  id: "clin",
  name: "Psicólogo clínico",
  navLabel: "Clínico",
  note: "Canal según capacidad digital (persona / teléfono / videollamada)",
  freqs: ["Semanal", "Quincenal", "Mensual"],
  /** Horas en las que se agendan las citas (agenda del clínico). */
  horas: ["08:00", "09:30", "11:00", "14:00", "15:30"],
  /** Canal de la cita según capacidad digital (0 baja · 1 media · 2 alta). */
  canales: ["En persona", "Por teléfono", "Videollamada o teléfono"],
  /** Festivos de Colombia (oct 2026 – dic 2027): no se agendan citas. */
  festivos: {
    "2026-10-12": "Día de la Raza", "2026-11-02": "Todos los Santos", "2026-11-16": "Independencia de Cartagena",
    "2026-12-08": "Inmaculada Concepción", "2026-12-25": "Navidad",
    "2027-01-01": "Año Nuevo", "2027-01-11": "Reyes Magos", "2027-03-22": "San José", "2027-03-25": "Jueves Santo",
    "2027-03-26": "Viernes Santo", "2027-05-01": "Día del Trabajo", "2027-05-10": "Ascensión", "2027-05-31": "Corpus Christi",
    "2027-06-07": "Sagrado Corazón", "2027-07-05": "San Pedro y San Pablo", "2027-07-20": "Independencia",
    "2027-08-07": "Batalla de Boyacá", "2027-08-16": "Asunción", "2027-10-18": "Día de la Raza", "2027-11-01": "Todos los Santos",
    "2027-11-15": "Independencia de Cartagena", "2027-12-08": "Inmaculada Concepción", "2027-12-25": "Navidad",
  },
};
