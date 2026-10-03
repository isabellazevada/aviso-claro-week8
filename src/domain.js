import { auditReasons, incidents, reportReasons } from "./data/incidents.js";

export function getIncident(id) {
  return incidents.find((incident) => incident.id === id) ?? null;
}

export function isValidReport(incidentId, reasonId) {
  return Boolean(getIncident(incidentId) && reportReasons.some((reason) => reason.id === reasonId));
}

export function beginReview(state, report) {
  state.report = report;
  state.auditDecision = null;
  return state;
}

export function getReportStatusMessage(report, decision) {
  const received = "Tu reporte fue recibido. Ya terminaste. La revisión corresponde al auditor; tú no necesitas confirmar ninguna decisión.";
  if (decision) {
    return `${received} ${getAuditDecisionMessage(decision)}`;
  }
  return received;
}

export function getAuditDecisionMessage(decision) {
  const label = decision.decision === "suspend" ? "suspendido" : "conservado";
  return `Resultado de la revisión: ${label}. Motivo: ${decision.reason}. Decisión ficticia, confirmada por auditor/a de demostración.`;
}

export function reviewSignal(incident, reasonId) {
  if (!incident || !reportReasons.some((reason) => reason.id === reasonId)) {
    return { plausible: false, label: "Opción no válida", basis: "El reporte debe usar una opción permitida." };
  }
  if (reasonId === "unsupported-claim") {
    return { plausible: false, label: "Sin sustento en el aviso", basis: "El aviso no demuestra la afirmación del reporte." };
  }
  if (reasonId === "unsafe-instruction" && incident.instructionRisk) {
    return { plausible: true, label: "Revisión prioritaria sugerida", basis: "El texto del aviso contiene una instrucción de espera ante un acceso activo." };
  }
  if (reasonId === "missing-evidence" && incident.evidenceMissing) {
    return { plausible: true, label: "Evidencia faltante confirmada", basis: "El caso ficticio no contiene fechas verificables." };
  }
  if (reasonId === "ambiguous") {
    return { plausible: null, label: "Revisión humana necesaria", basis: "La selección por sí sola no confirma que el aviso sea ambiguo." };
  }
  return { plausible: false, label: "No se confirma plausibilidad", basis: "La opción y la evidencia del caso ficticio no coinciden." };
}

export function confirmAudit(incidentId, reportReasonId, decision, reasonId) {
  const incident = getIncident(incidentId);
  const signal = reviewSignal(incident, reportReasonId);
  const validDecision = decision === "suspend" || decision === "retain";
  const validReason = auditReasons.some((reason) => reason.id === reasonId);
  if (!incident || !validDecision || !validReason || !isValidReport(incidentId, reportReasonId)) return null;
  if (decision === "suspend" && reasonId === "no-material-issue") return null;
  if (decision === "retain" && reasonId !== "insufficient-support" && reasonId !== "no-material-issue") return null;
  if (decision === "suspend" && reasonId !== "unsafe-delay" && reasonId !== "material-omission") return null;
  if (decision === "suspend" && (signal.plausible === false || reportReasonId === "unsupported-claim")) return null;
  if (decision === "suspend" && reasonId === "unsafe-delay" && !incident.instructionRisk) return null;
  if (decision === "suspend" && reasonId === "material-omission" && !incident.evidenceMissing) return null;
  return { incident, decision, reason: auditReasons.find((reason) => reason.id === reasonId).label };
}