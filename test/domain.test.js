import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { incidents } from "../src/data/incidents.js";
import { beginReview, confirmAudit, getIncident, getReportStatusMessage, isValidReport, reviewSignal } from "../src/domain.js";

test("ambiguous instruction creates a review signal, never a verdict", () => {
  const incident = getIncident("aviso-02");
  const signal = reviewSignal(incident, "unsafe-instruction");
  assert.equal(signal.plausible, true);
  assert.equal(reviewSignal(incident, "ambiguous").plausible, null);
  assert.match(reviewSignal(incident, "ambiguous").label, /humana/i);
  assert.equal(incident.verdict, "Vigente, bajo revisión de demostración");
  assert.equal(confirmAudit(incident.id, "unsafe-instruction", "suspend", "unsafe-delay").decision, "suspend");
});

test("missing dates remain unverifiable, not timely or late", () => {
  const incident = getIncident("aviso-03");
  assert.equal(incident.evidenceMissing, true);
  assert.match(incident.verdict, /no verificable/i);
  assert.equal(reviewSignal(incident, "missing-evidence").plausible, true);
  assert.match(incident.evidence, /no verificable/i);
  assert.equal(confirmAudit(incident.id, "missing-evidence", "suspend", "material-omission").decision, "suspend");
});

test("unsupported report has no asserted harm and can only be retained with a reason", () => {
  const incident = getIncident("aviso-01");
  const signal = reviewSignal(incident, "unsupported-claim");
  assert.equal(signal.plausible, false);
  assert.match(signal.basis, /no demuestra/i);
  assert.equal(confirmAudit(incident.id, "unsupported-claim", "retain", "insufficient-support").decision, "retain");
  assert.equal(confirmAudit(incident.id, "unsupported-claim", "suspend", "unsafe-delay"), null);
  assert.equal(confirmAudit(incident.id, "unsupported-claim", "suspend", "no-material-issue"), null);
});

test("injection attempts and free-form report values are rejected", () => {
  const payload = "<img src=x onerror=alert(1)>";
  assert.equal(isValidReport("aviso-01", payload), false);
  assert.equal(isValidReport(payload, "ambiguous"), false);
  assert.equal(reviewSignal(incidents[0], payload).plausible, false);
  assert.equal(confirmAudit("aviso-02", payload, "suspend", "unsafe-delay"), null);
});

test("starting a new report clears the prior auditor decision", () => {
  const state = { report: { incidentId: "aviso-01" }, auditDecision: { decision: "suspend", reason: "Decisión previa" } };
  beginReview(state, { incidentId: "aviso-02", reasonId: "unsafe-instruction" });
  assert.equal(state.report.incidentId, "aviso-02");
  assert.equal(state.auditDecision, null);
});

test("report status changes from pending to the confirmed decision and reason", () => {
  const report = { signal: { label: "Revisión humana necesaria", basis: "La opción necesita revisión." } };
  assert.match(getReportStatusMessage(report, null), /^Revisión pendiente\./);

  for (const decision of ["suspend", "retain"]) {
    const message = getReportStatusMessage(report, { decision, reason: "Motivo de prueba" });
    assert.match(message, decision === "suspend" ? /Dictamen suspendido/ : /Dictamen conservado/);
    assert.match(message, /Motivo: Motivo de prueba/);
    assert.doesNotMatch(message, /Revisión pendiente/);
  }
});

test("exactly three fictitious notices are published, with independent reach metrics", () => {
  assert.equal(incidents.length, 3);
  for (const incident of incidents) {
    assert.deepEqual(Object.keys(incident.metrics), ["sent", "delivered", "understood"]);
  }
  assert.equal(getIncident("aviso-02").history.some((entry) => entry.kind === "Reporte"), false);
});

test("Vercel configuration runs tests and serves the Vite output with restrictive headers", () => {
  const config = JSON.parse(readFileSync(new URL("../vercel.json", import.meta.url), "utf8"));
  const headers = config.headers[0].headers;
  const headerValue = (name) => headers.find((header) => header.key === name)?.value;
  assert.equal(config.framework, "vite");
  assert.equal(config.installCommand, "npm ci");
  assert.equal(config.buildCommand, "npm test && npm run build");
  assert.equal(config.outputDirectory, "dist");
  assert.match(headerValue("Content-Security-Policy"), /connect-src 'self'/);
  assert.equal(headerValue("X-Content-Type-Options"), "nosniff");
  assert.equal(headerValue("X-Frame-Options"), "DENY");
});