# Aviso Claro · Decisiones de implementación

Actualizado: 4 de octubre de 2026. Estado: prototipo local de demostración; no desplegado.

## Stack

- Interfaz: HTML, CSS y JavaScript sin framework; Vite para desarrollo y compilación local.
- Datos: tres fixtures ficticios en `src/data/incidents.json`; motivos de reporte y auditoría como opciones cerradas.
- Seguridad: DOMPurify + `textContent` para no interpretar la salida como HTML; CSP de mismo origen en navegador; Zod valida el body estricto y la allowlist de IDs; el endpoint limita el body a 1 KiB mientras lee y rechaza `Origin` cruzado. Diagnóstico en servidor usa solo categoría allowlist y estado HTTP entero. Esto no autentica ni limita la tasa; el endpoint es público y puede consumir cuota.
- LLM: integración preparada con AI SDK y Google Gemini `gemini-3.8-flash` en Vercel Function Node (`api/explain.js`). Devuelve un objeto Zod estricto de tres campos: hechos conocidos, incertidumbres e instrucción preocupante. Solo recibe datos existentes del caso ficticio; no recibe acción siguiente, dictamen ni texto libre. No decide ni aprueba suspensiones/conservaciones.
- Respuestas: UI distingue “Respuesta real del modelo · Google Gemini” de “Explicación fija · SIMULADA”. Si falta configuración o falla el endpoint, muestra el error y etiqueta la alternativa fija como simulada.
- Secretos: `GOOGLE_GENERATIVE_AI_API_KEY` se configura solo en variables de entorno Vercel, nunca con prefijo `VITE_`, en código ni GitHub. `.env*` está ignorado. No hay clave disponible en este entorno, por lo que no se probó una llamada real.
- Publicación: preparada para Vercel Hobby, sin despliegue. `vercel.json` publica `dist/`, ejecuta tests/build y fija cabeceras HTTP de seguridad. No se creó URL pública ni se hicieron deployments.

## Criterios de aceptación

| Criterio | Condición del Packet | Comprobación de este slice |
|---|---|---|
| AC1 · No crear exposición | Sin datos sensibles, manipulación ni detalles técnicos explotables | Solo casos inventados; reportes de opciones cerradas; no hay campos personales/archivos ni persistencia. La función stateless acepta solo ID allowlist y envía a Gemini resumen/hechos/incertidumbres/preocupación de ese caso; no envía texto libre, acción, dictamen ni detalles técnicos. |
| AC2 · Avisar antes de revisar | La clínica no espera al auditor y no existe sello de seguridad | Cada aviso muestra su estado limitado y sus fechas ficticias; la publicación inicial precede a la revisión en los fixtures. No se afirma que una clínica sea segura. |
| AC3 · Responsabilidad humana | IA no aprueba; evidencia insuficiente significa no verificable | La señal orienta y no cambia el dictamen. La vista de auditor ficticio confirma suspensión o conservación y exige un motivo cerrado. |
| AC4 · Independencia/transparencia | Publicar todos los casos, incluidos fallos; el pagador no controla resultados | Los tres casos permanecen visibles, incluido el peligroso y el no verificable. No hay controles de pagador. La independencia institucional no está probada por una demo. |
| AC5 · Comprensión | Separar enviado/entregado/comprendido; desconocido no equivale a cero; comprobar claridad con personas | Las tres métricas aparecen separadas y los desconocidos se muestran como desconocidos. No se hizo una prueba con diez personas; el umbral de comprensión queda pendiente. |
| AC6 · Suspensión y parada | Auditor suspende ante riesgo plausible; corrección material en 24 h; detener expansión ante señales de parada | Caso peligroso puede suspenderse con razón y deja una corrección pendiente con plazo de 24 h. No se exige probar daño bancario. No se autoriza piloto ni expansión; pagador, demora real o instrucciones peligrosas en producción obligan a detenerla. |

## Pruebas ejecutadas

Runtime temporal Node v22.16.0 en `/tmp`; no se instaló globalmente. La última `npm ci` instaló 28 paquetes y reportó cero vulnerabilidades en 29 paquetes auditados.

- `npm ci`: instaló 28 paquetes; cero vulnerabilidades reportadas en 29 paquetes auditados.
- `npm test`: 17/17 pruebas aprobadas, incluyendo categorías/status HTTP, timeout envuelto y comprobaciones de que logs no contienen mensaje, URL ni encabezados.
- `npm run build`: Vite v7.3.6 generó `dist/`; `git diff --check` pasó. No equivale a deployment ni a una llamada real a Gemini.
- Diagnóstico 502: errores HTTP se asignan a `authentication`, `permissions`, `quota`, `model`, `provider_request` o `provider_error`; timeouts y respuesta incompatible quedan en `timeout` y `response_validation`. En logs solo se emiten evento fijo, categoría y estado HTTP; nunca mensaje, URL, encabezados ni objeto/cause. No se accedió a Vercel Logs reales; instrucciones en [DEPLOYMENT.md](DEPLOYMENT.md).
- Se ejecutó de extremo a extremo `npm ci && npm test && npm run build`, igual que en Vercel. La configuración fija Node 22, `npm ci`, test antes de compilar, `dist` y cabeceras HTTP; no equivale a validar un deployment real. Pasos en [DEPLOYMENT.md](DEPLOYMENT.md).
- Navegador a 390 px: flujo de reporte urgente → revisión → suspensión con motivo; se vio la corrección pendiente de 24 horas; 0 px de desbordamiento horizontal, 0 campos de texto/archivo y 0 errores de página.
- Navegador a 320 px: reporte sin sustento no pudo suspender; se conservó con motivo; el formulario aceptó la selección corregida; 0 px de desbordamiento horizontal.
- Navegador a 320 px: una fixture de prueba con `<img onerror>` se mostró como texto; se renderizaron 0 imágenes inyectadas. A 320 y 1440 px hubo 0 px de desbordamiento horizontal.
- Recarga del navegador: el reporte de ensayo desapareció y la vista de auditor volvió al estado vacío.

La prueba automatizada de inyección valida que valores no incluidos en la lista cerrada se rechazan. El render usa DOMPurify sin etiquetas ni atributos permitidos y asigna el resultado como texto; no se afirma que esto sea una auditoría de seguridad completa.

## Defectos encontrados y corrección

1. **Decisión anterior asociada al siguiente reporte.** Al seguir el estado, `auditDecision` sobrevivía al iniciar otro reporte; la vista podía ocultar la nueva revisión detrás del resultado anterior. `beginReview` ahora reinicia la decisión al abrir cada reporte. La prueba “starting a new report clears the prior auditor decision” pasa.
2. **Reporte sin sustento podía combinarse con una suspensión incompatible.** `confirmAudit` no cotejaba el motivo recibido con el caso. Ahora la suspensión se rechaza para reportes sin sustento y exige que el motivo de auditoría coincida con la evidencia ficticia. Las pruebas de dominio y el recorrido manual del formulario pasan.
3. **Historial anunciaba un reporte que aún no estaba cargado.** Se quitó el evento adelantado del fixture; el reporte aparece en historial solo al crear o cargarlo. La prueba de fixtures comprueba este estado inicial.

## Límites y pendientes

- Configurar `GOOGLE_GENERATIVE_AI_API_KEY` en Vercel, restringirla a Gemini API y establecer cuota; desplegar y verificar una respuesta real sin copiar la clave a logs, GitHub o chat.
- No se promete uso gratuito del modelo; tarifas y cuotas dependen del proveedor/cuenta. La función es pública y no incorpora autenticación ni rate limiting; aplicar cuota/restricción del proveedor y vigilar abuso.
- Hacer prueba de claridad con diez personas reales bajo el umbral del Packet; el arquetipo de Laura sigue siendo sintético.
- Ratificar el Blueprint del equipo, incorporar el mockup al PDF y validar la shadow clause con el equipo.
- Completar manualmente la importación de GitHub en Vercel, verificar términos de Hobby y registrar la URL/build solo después de un deployment real. No publicar antes de revisar los criterios de parada.
- No hay denuncias reales, clínicas reales, asesoría legal/médica, métricas de comprensión reales ni autoridad auditora.

## Siguiente paso

La integración de Gemini está implementada, pero aún no está configurada ni verificada con una llamada real porque no hay clave en este entorno. Siguiente paso: definir `GOOGLE_GENERATIVE_AI_API_KEY` en Vercel, desplegar y comprobar la respuesta real y el comportamiento de error en producción, sin compartir la clave por chat o GitHub. La evaluación sintética de capturas del 3 de octubre resolvió la confusión de roles solo en ese alcance; no fue entrevista ni prueba interactiva. La secuencia inválida → válida del auditor se reprodujo en navegador y tiene cobertura automatizada. También regenerar capturas limpias, un caso por secuencia. Ver [DEPLOYMENT.md](DEPLOYMENT.md), [docs/TEST_LOG.md](docs/TEST_LOG.md) y [docs/PERSONA_LOG.md](docs/PERSONA_LOG.md). El auditor humano mantiene todas las decisiones.