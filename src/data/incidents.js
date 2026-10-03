import incidents from "./incidents.json" with { type: "json" };

export { incidents };

export const reportReasons = [
  { id: "ambiguous", label: "La instrucción se puede entender de más de una forma" },
  { id: "missing-evidence", label: "Falta evidencia o una fecha importante" },
  { id: "unsafe-instruction", label: "La instrucción podría retrasar una acción urgente" },
  { id: "unsupported-claim", label: "El reporte afirma algo que este aviso no demuestra" }
];

export const auditReasons = [
  { id: "unsafe-delay", label: "La espera indicada puede retrasar una acción urgente" },
  { id: "material-omission", label: "Falta información necesaria para entender el riesgo" },
  { id: "insufficient-support", label: "La evidencia no permite sostener el reporte" },
  { id: "no-material-issue", label: "La revisión no encontró un problema material" }
];