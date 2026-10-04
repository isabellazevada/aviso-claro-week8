# Aviso Claro · Decisiones de implementación

Actualizado: 4 de octubre de 2026. Estado: prototipo local de demostración; no desplegado.

## Stack

- Interfaz: HTML, CSS y JavaScript sin framework; Vite para desarrollo y compilación local.
- Datos: tres fixtures ficticios en `src/data/incidents.json`; motivos de reporte y auditoría como opciones cerradas.
- Seguridad: DOMPurify + `textContent` para no interpretar la salida como HTML; CSP de mismo origen en navegador; Zod valida el body estricto y la allowlist de IDs; el endpoint limita el body a 1 KiB mientras lee y rechaza `Origin` cruzado. Diagnóstico en servidor usa etapa, categoría, estado HTTP entero y códigos de validación allowlist. Esto no autentica ni limita la tasa; el endpoint es público y puede consumir cuota.
- LLM: AI SDK y Google Gemini `gemini-3.8-flash` en Vercel Function Node (`api/explain.js`). Schema remoto de tres strings requeridos; Zod local posterior mantiene trim y límites. Salida máxima actualizada de 220 a 512 tokens y razonamiento fijado a `minimal` para dar margen al objeto estructurado. Es mitigación preventiva, no confirmación de truncamiento. Diagnóstico SDK incluye finishReason, presencia/longitud y causa tipada allowlist; post-Zod va por etapa separada. Solo tres campos explicativos; no acción ni dictamen.
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
- `npm test`: 21/21 pruebas aprobadas, incluyendo schema remoto compatible, separación SDK/Zod, salida vacía/truncada, finishReason y causa tipada allowlist.
- `npm run build`: Vite v7.3.6 generó `dist/`; `git diff --check` pasó. No equivale a deployment ni a una llamada real a Gemini.
- Diagnóstico 502: `stage` distingue `sdk_generation` de `post_zod_validation`; para `NoObjectGeneratedError` añade finishReason, presencia/longitud del texto y causa tipada allowlist. En logs nunca se emiten mensaje, URL, encabezados, respuesta, objeto/cause ni texto parcial. El esquema enviado a Gemini no incluye `minLength`/`maxLength`; Zod local mantiene límites. El tope subió a 512 y reasoning a minimal como margen preventivo, no causa confirmada. No se accedió a Vercel Logs reales; instrucciones en [DEPLOYMENT.md](DEPLOYMENT.md).
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

Desplegar y recoger finishReason/presencia/longitud/causa segura en Vercel Logs, luego verificar una llamada real. `length` con texto presente indicaría truncamiento; `stop` con texto presente y fallo SDK justificaría evaluar REST estructurada directa + Zod local. No se afirma que producción esté corregida hasta verificarlo. La evaluación sintética de capturas del 3 de octubre resolvió la confusión de roles en ese alcance limitado; no fue entrevista ni prueba interactiva. La secuencia inválida → válida del auditor se reprodujo en navegador y está cubierta por una prueba automatizada. Pendientes independientes: verificar LLM real y regenerar capturas limpias, un caso por secuencia. Ver [DEPLOYMENT.md](DEPLOYMENT.md), [docs/TEST_LOG.md](docs/TEST_LOG.md) y [docs/PERSONA_LOG.md](docs/PERSONA_LOG.md). Las decisiones de auditoría siguen siendo humanas.