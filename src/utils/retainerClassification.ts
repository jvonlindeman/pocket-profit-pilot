// Lista de especialidades médicas conocidas
const MEDICAL_SPECIALTIES = [
  "Alergologo",
  "Cardiologo",
  "Cardiovascular",
  "Cirjuano Cardiovascular",
  "Cirujano Cardiovascular",
  "Cirujano",
  "Cirujano Plástico",
  "Clinica Radiologia",
  "Clínica Ultrasonidos",
  "Dentista",
  "Dermatologo",
  "Fondoaudiologa",
  "Gastro",
  "Ginecologo",
  "Hospital",
  "Internista",
  "Laboratorio",
  "Oftalmologo",
  "Oncologo",
  "Ortopeda",
  "Otorrino",
  "Resonancia",
  "Urólogo",
  "Varices",
];

export function isMedicalClient(specialty: string | null): boolean {
  if (!specialty) return false;
  return MEDICAL_SPECIALTIES.some(
    (s) => s.toLowerCase() === specialty.toLowerCase()
  );
}

export type ClientGroup = "doctor-premier" | "webart";

export function getClientGroup(specialty: string | null): ClientGroup {
  return isMedicalClient(specialty) ? "doctor-premier" : "webart";
}
