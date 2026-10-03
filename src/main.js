import DOMPurify from "dompurify";
import { auditReasons, incidents, reportReasons } from "./data/incidents.js";
import { beginReview, confirmAudit, getAuditDecisionMessage, getIncident, getReportStatusMessage, isValidReport, reviewSignal } from "./domain.js";

const state = {
  view: "notice",
  incidentId: incidents[0].id,
  report: null,
  auditDecision: null,
  explanations: new Map(),
  notices: new Map(incidents.map((incident) => [incident.id, { verdict: incident.verdict, tone: incident.verdictTone, history: [...incident.history] }]))
};

const app = document.querySelector("#app");
const text = (value) => DOMPurify.sanitize(String(value), { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
const node = (tag, className, content) => {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (content !== undefined) element.textContent = text(content);
  return element;
};

function render() {
  const current = getIncident(state.incidentId);
  const noticeState = state.notices.get(current.id);
  app.replaceChildren();
  const shell = node("main", "shell");
  const header = node("header", "topbar");
  const brand = node("a", "brand", "Aviso Claro");
  brand.href = "#inicio";
  brand.addEventListener("click", (event) => { event.preventDefault(); state.view = "notice"; render(); });
  header.append(brand, node("span", "demo-pill", "Datos y auditoría simulados"));
  shell.append(header);

  const intro = node("section", "intro");
  intro.append(node("p", "eyebrow", "Registro de avisos · CDMX ficticia"), node("h1", "", state.view === "audit" ? "Mesa de revisión" : "Entiende el aviso. Decide con calma."));
  intro.append(node("p", "intro-copy", state.view === "audit"
    ? "Esta vista permite ensayar un rol distinto. Es solo una demostración y no es un paso para pacientes."
    : "Casos inventados para ensayar qué se sabe, qué no y cuál es el siguiente paso."));
  shell.append(intro);

  const tabs = node("nav", "view-tabs");
  tabs.setAttribute("aria-label", "Vistas de demostración");
  tabs.append(tabButton("notice", "Avisos"), tabButton("audit", "Auditoría · solo demostración"));
  shell.append(tabs);

  if (state.view === "audit") renderAudit(shell);
  else renderNotice(shell, current, noticeState);

  const footer = node("footer", "footer");
  footer.append(node("strong", "", "DEMO · NO ES UN SERVICIO REAL"), node("p", "", "No envíes datos personales. No se reciben denuncias reales, no hay contacto con clínicas y la recarga borra el ensayo."));
  shell.append(footer);
  app.append(shell);
}

function tabButton(view, label) {
  const button = node("button", `tab ${state.view === view ? "active" : ""}`, label);
  button.type = "button";
  button.setAttribute("aria-pressed", String(state.view === view));
  button.addEventListener("click", () => { state.view = view; render(); });
  return button;
}

function renderNotice(shell, incident, noticeState) {
  const layout = node("div", "notice-layout");
  const list = node("aside", "incident-list");
  list.append(node("h2", "section-label", "Avisos ficticios"));
  incidents.forEach((item) => {
    const button = node("button", `incident-choice ${item.id === incident.id ? "selected" : ""}`);
    button.type = "button";
    button.setAttribute("aria-current", String(item.id === incident.id));
    button.append(node("span", "choice-number", item.id.slice(-2)), node("span", "choice-title", item.title), node("span", `verdict-dot ${state.notices.get(item.id).tone}`, state.notices.get(item.id).verdict));
    button.addEventListener("click", () => { state.incidentId = item.id; render(); });
    list.append(button);
  });
  layout.append(list);

  const article = node("article", "notice-content");
  const heading = node("div", "case-heading");
  heading.append(node("p", "eyebrow", incident.clinic), node("h2", "", incident.title));
  const badge = node("span", `verdict-badge ${noticeState.tone}`, noticeState.verdict);
  heading.append(badge);
  article.append(heading);

  article.append(renderExplanation(incident));

  const facts = node("div", "fact-grid");
  facts.append(factSection("Lo que se sabe", incident.known, "known"));
  facts.append(factSection("Lo que aún no se sabe", incident.uncertain, "uncertain"));
  article.append(facts);
  const action = node("section", "next-action");
  action.append(node("p", "eyebrow", "Siguiente acción"), node("p", "action-copy", incident.nextAction));
  article.append(action);
  const update = node("section", "update-row");
  update.append(node("span", "", "Próxima actualización"), node("strong", "", incident.nextUpdate));
  update.append(node("small", "update-note", "Fecha para publicar información; no es una instrucción de esperar para actuar."));
  article.append(update);
  article.append(renderMetrics(incident.metrics));
  article.append(node("p", "evidence-note", incident.evidence));
  article.append(renderHistory(noticeState.history));

  const reportSection = node("section", "report-section");
  reportSection.append(node("h3", "", "¿Hay algo confuso o preocupante?"));
  reportSection.append(node("p", "", "Elige un motivo. No escribas tu nombre ni detalles personales; no hay campos de texto o archivos."));
  reportSection.append(reportForm(incident));
  if (state.report?.incidentId === incident.id) reportSection.append(reportStatus());
  article.append(reportSection);
  layout.append(article);
  shell.append(layout);
}

function factSection(title, items, tone) {
  const section = node("section", `fact-block ${tone}`);
  section.append(node("h3", "", title));
  const list = node("ul", "");
  items.forEach((item) => list.append(node("li", "", item)));
  section.append(list);
  return section;
}

function fixedExplanation(incident) {
  return {
    knownFacts: incident.known.join(" "),
    uncertainties: incident.uncertain.join(" "),
    concerningInstruction: incident.instructionRisk
    ? incident.summary
      : "El caso ficticio no incluye una instrucción preocupante específica."
  };
}

function renderExplanationSections(section, explanation) {
  [
    ["Hechos conocidos", explanation.knownFacts],
    ["Incertidumbres", explanation.uncertainties],
    ["Instrucción preocupante", explanation.concerningInstruction]
  ].forEach(([label, value]) => {
    const part = node("div", "explanation-part");
    part.append(node("strong", "", label), node("p", "", value));
    section.append(part);
  });
}

function renderExplanation(incident) {
  const section = node("section", "explanation");
  const result = state.explanations.get(incident.id);
  section.setAttribute("aria-live", "polite");
  section.setAttribute("aria-busy", String(result?.state === "loading"));

  if (result?.state === "real") {
    section.append(node("span", "model-label", "Respuesta real del modelo · Google Gemini"));
    renderExplanationSections(section, result.explanation);
    section.append(node("small", "", "El modelo solo explica los datos mostrados. Puede equivocarse y no decide ni modifica el resultado de la revisión ni la siguiente acción."));
  } else if (result?.state === "error") {
    section.append(node("span", "error-label", "No se obtuvo respuesta real del modelo"));
    section.append(node("p", "api-error", result.error));
    section.append(node("span", "simulated-label", "Alternativa fija · SIMULADA"));
    renderExplanationSections(section, fixedExplanation(incident));
    section.append(node("small", "", "La alternativa se construye con el caso ficticio; no es una respuesta del LLM."));
  } else {
    section.append(node("span", "simulated-label", "Explicación fija · SIMULADA"));
    renderExplanationSections(section, fixedExplanation(incident));
    section.append(node("small", "", "Texto preparado con datos ficticios. No es una respuesta del modelo."));
  }

  const loading = result?.state === "loading";
  const button = node("button", "button-secondary explain-button", loading
    ? "Consultando modelo…"
    : result?.state === "real" ? "Pedir otra explicación" : "Pedir explicación al modelo");
  button.type = "button";
  button.disabled = loading;
  button.addEventListener("click", () => requestExplanation(incident.id));
  section.append(button);
  return section;
}

async function requestExplanation(caseId) {
  state.explanations.set(caseId, { state: "loading" });
  render();

  try {
    const response = await fetch("/api/explain", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ caseId })
    });
    let body;
    try {
      body = await response.json();
    } catch {
      throw new Error(`El servicio de explicación devolvió una respuesta no válida (${response.status}).`);
    }
    if (!response.ok) throw new Error(body.error || `El servidor respondió con error ${response.status}.`);
    const fields = ["knownFacts", "uncertainties", "concerningInstruction"];
    if (body.source !== "model" || body.provider !== "Google Gemini" ||
      !body.explanation || fields.some((field) => typeof body.explanation[field] !== "string") ||
      Object.keys(body.explanation).some((field) => !fields.includes(field))) {
      throw new Error("La respuesta del servidor no se pudo verificar como respuesta del modelo.");
    }
    state.explanations.set(caseId, { state: "real", explanation: body.explanation });
  } catch (error) {
    state.explanations.set(caseId, {
      state: "error",
      error: error instanceof Error ? error.message : "No se pudo conectar con el servicio de explicación."
    });
  }
  render();
}

function renderMetrics(metrics) {
  const section = node("section", "metrics");
  section.append(node("h3", "", "Alcance del aviso (simulado)"));
  const list = node("dl", "metric-list");
  [["Enviado", metrics.sent], ["Entregado", metrics.delivered], ["Comprendido", metrics.understood]].forEach(([label, value]) => {
    list.append(node("dt", "", label), node("dd", "", value));
  });
  section.append(list);
  return section;
}

function renderHistory(history) {
  const section = node("section", "history");
  section.append(node("h3", "", "Historial y plazos"));
  const list = node("ol", "timeline");
  history.forEach((entry) => {
    const item = node("li", "timeline-entry");
    item.append(node("time", "", entry.date), node("span", "timeline-kind", entry.kind), node("p", "", entry.text));
    list.append(item);
  });
  section.append(list);
  return section;
}

function reportForm(incident) {
  const form = node("form", "report-form");
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const reasonId = new FormData(form).get("reason");
    if (!isValidReport(incident.id, reasonId)) return;
    beginReview(state, { incidentId: incident.id, reasonId, signal: reviewSignal(incident, reasonId), time: "3 oct 2026 · hora de demo" });
    const entry = { date: state.report.time, kind: "Reporte", text: `Motivo seleccionado: ${reportReasons.find((reason) => reason.id === reasonId).label}. Reporte ficticio, sin datos personales.` };
    state.notices.get(incident.id).history.push(entry);
    render();
  });
  const fieldset = node("fieldset", "reason-options");
  fieldset.append(node("legend", "", "Motivo del reporte"));
  reportReasons.forEach((reason) => {
    const label = node("label", "radio-option");
    const input = document.createElement("input");
    input.type = "radio";
    input.name = "reason";
    input.value = reason.id;
    input.required = true;
    label.append(input, node("span", "", reason.label));
    fieldset.append(label);
  });
  form.append(fieldset, submitButton("Enviar reporte de ensayo", "button-primary"));
  return form;
}

function reportStatus() {
  const status = node("div", "report-status");
  status.setAttribute("role", "status");
  status.append(node("strong", "", "Reporte recibido en esta sesión"), node("p", "", getReportStatusMessage(state.report, state.auditDecision)));
  const go = node("button", "text-button", "Volver al aviso");
  go.type = "button";
  go.addEventListener("click", () => { state.view = "notice"; state.incidentId = state.report.incidentId; render(); });
  status.append(go);
  return status;
}

function renderAudit(shell) {
  const panel = node("section", "audit-panel");
  panel.append(node("span", "simulated-label", "AUDITOR/A DE DEMOSTRACIÓN · NO ES UNA DECISIÓN REAL"));
  panel.append(node("p", "audit-intro", "Aquí, “dictamen” significa el resultado de la revisión del aviso. Esta vista ensaya otro rol y no es un paso para pacientes."));
  if (!state.report) {
    panel.append(node("h2", "", "No hay un reporte en esta sesión"), node("p", "", "Puedes crear un reporte desde un aviso o cargar el caso de prueba sintético. No representa una denuncia real."));
    const sample = node("button", "button-secondary", "Cargar reporte sintético de prueba");
    sample.type = "button";
    sample.addEventListener("click", () => {
      const incident = getIncident("aviso-02");
      beginReview(state, { incidentId: incident.id, reasonId: "unsafe-instruction", signal: reviewSignal(incident, "unsafe-instruction"), time: "Caso ficticio de prueba" });
      state.notices.get(incident.id).history.push({ date: state.report.time, kind: "Reporte", text: "Reporte sintético cargado para probar revisión humana." });
      render();
    });
    panel.append(sample);
  } else {
    renderAuditReport(panel);
  }
  shell.append(panel);
}

function renderAuditReport(panel) {
  const incident = getIncident(state.report.incidentId);
  const noticeState = state.notices.get(incident.id);
  const reason = reportReasons.find((item) => item.id === state.report.reasonId);
  panel.append(node("h2", "", "Reporte recibido (simulado)"));
  const reportCard = node("div", "audit-report");
  reportCard.append(node("p", "eyebrow", `${incident.clinic} · ${incident.title}`), node("p", "", reason.label), node("p", "", `Hora: ${state.report.time}`));
  reportCard.append(node("strong", "signal-label", state.report.signal.label), node("p", "", state.report.signal.basis));
  reportCard.append(node("p", "audit-caveat", "La señal no decide ni suspende. El auditor debe revisar el aviso y confirmar una decisión con motivo."));
  panel.append(reportCard);
  if (state.auditDecision) {
    const result = node("div", "audit-result", getAuditDecisionMessage(state.auditDecision));
    result.setAttribute("role", "status");
    panel.append(result, renderHistory(noticeState.history));
    return;
  }
  const controls = node("form", "audit-form");
  const decisionLabel = node("label", "form-label", "Decisión del auditor");
  const decision = document.createElement("select");
  decision.name = "decision";
  decision.required = true;
  decision.append(new Option("Elige una decisión", ""), new Option("Suspender el dictamen", "suspend"), new Option("Conservar el dictamen", "retain"));
  decisionLabel.append(decision);
  const reasonLabel = node("label", "form-label", "Motivo (opción cerrada)");
  const auditReason = document.createElement("select");
  auditReason.name = "auditReason";
  auditReason.required = true;
  auditReason.append(new Option("Elige un motivo", ""));
  auditReasons.forEach((item) => auditReason.append(new Option(item.label, item.id)));
  const clearAuditValidation = () => auditReason.setCustomValidity("");
  decision.addEventListener("change", clearAuditValidation);
  auditReason.addEventListener("change", clearAuditValidation);
  reasonLabel.append(auditReason);
  controls.append(decisionLabel, reasonLabel, submitButton("Confirmar decisión de demostración", "button-primary"));
  controls.addEventListener("submit", (event) => {
    event.preventDefault();
    const result = confirmAudit(incident.id, state.report.reasonId, new FormData(controls).get("decision"), new FormData(controls).get("auditReason"));
    if (!result) {
      auditReason.setCustomValidity("El motivo debe corresponder con la decisión.");
      controls.reportValidity();
      return;
    }
    const decisionText = result.decision === "suspend" ? "Dictamen suspendido" : "Dictamen conservado";
    if (result.decision === "suspend") {
      noticeState.verdict = "Suspendido · corrección pendiente";
      noticeState.tone = "warn";
      noticeState.history.push({ date: "3 oct 2026 · decisión de demo", kind: "Decisión", text: `${decisionText}: ${result.reason}. Auditor/a de demostración.` });
      noticeState.history.push({ date: "Plazo: 24 horas desde el reporte", kind: "Corrección pendiente", text: "Corrección material pendiente en la simulación; no hay corrección real ni recordatorio." });
    } else {
      noticeState.history.push({ date: "3 oct 2026 · decisión de demo", kind: "Decisión", text: `${decisionText}: ${result.reason}. Auditor/a de demostración.` });
    }
    state.auditDecision = { decision: result.decision, reason: result.reason };
    render();
  });
  panel.append(controls);
  panel.append(renderHistory(noticeState.history));
}

function submitButton(label, className) {
  const button = node("button", className, label);
  button.type = "submit";
  return button;
}

render();