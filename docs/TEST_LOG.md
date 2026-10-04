# Registro de pruebas · Aviso Claro

Fecha: 3 de octubre de 2026. Todos los avisos, reportes y decisiones de este registro son ficticios; no hubo usuarios ni clínicas reales.

## Bug del primer despliegue

**Síntoma:** después de enviar un reporte sobre el aviso peligroso y confirmar la suspensión en la vista de auditor, el estado público mostraba “Suspendido · corrección pendiente”, pero el bloque “Reporte recibido en esta sesión” seguía mostrando “Revisión humana necesaria”. La decisión estaba confirmada, aunque ese bloque conservaba el mensaje inicial del reporte.

**Reproducción:**

1. Abrir el aviso “Instrucción que podría causar daño”.
2. Elegir “La instrucción podría retrasar una acción urgente” y enviar el reporte.
3. Abrir la vista de auditoría y confirmar “Suspender el dictamen” con “La espera indicada puede retrasar una acción urgente”.
4. Volver a Avisos y mirar el bloque del reporte: el dictamen ya aparecía suspendido, pero el mensaje decía que seguía necesitando revisión humana.

**Causa:** el bloque público leía únicamente `state.report.signal`, creado al enviar el reporte. La decisión del auditor quedaba guardada por separado en `state.auditDecision` y solo se mostraba en la vista de auditoría.

**Corrección:** una función compartida deriva el mensaje del reporte y de la decisión confirmada. Antes de decidir, indica “Revisión pendiente” y aclara que el reporte no cambia el dictamen. Después de decidir, muestra “Dictamen suspendido” o “Dictamen conservado”, con el motivo confirmado. La vista pública y la de auditor usan el mismo mensaje. Los textos visibles que decían “fixture” ahora dicen “caso ficticio”.

## Pruebas ejecutadas para la corrección

- Prueba automatizada `report status changes from pending to the confirmed decision and reason`: pasa para estado pendiente, suspensión y conservación; comprueba que, después de decidir, desaparece “Revisión pendiente” y se incluye el motivo.
- `npm test`: 8/8 pruebas aprobadas (Node v22.16.0).
- `npm run build`: Vite v7.3.6 aprobó la compilación de producción y generó `dist/`.
- Navegador local: reproduje el reporte urgente; el bloque pasó de pendiente a “Dictamen suspendido” y mostró el motivo. Repetí con un reporte sin sustento; el bloque pasó a “Dictamen conservado” y mostró el motivo.
- Búsqueda en la pantalla: no se muestra la palabra técnica “fixture”. Sin errores de página en esos recorridos.
- No se ha hecho un segundo despliegue todavía; el cambio queda listo para subirse y desplegarse desde GitHub.

## Alcance

La prueba automatizada verifica la función de estado usada por ambos bloques. Los datos siguen en memoria, la decisión es de auditor/a simulado y no hay reporte real, identidad, adjuntos ni contacto con clínicas.

## Ajustes por hallazgos de Laura sintética

- Se quitó el enlace al rol auditor del bloque de paciente. El mensaje exacto confirma que el reporte fue recibido, que la persona terminó y que no debe confirmar decisiones; el botón vuelve al aviso.
- Auditoría queda como pestaña separada “Auditoría · solo demostración”, con una explicación explícita de que es otro rol y no un paso para pacientes.
- Se explica “dictamen” como “resultado de la revisión del aviso” y se aclara junto a la próxima actualización que la fecha no es una instrucción de esperar.
- Se corrigió la validación obsoleta del formulario: cambiar la decisión o el motivo ahora limpia el error anterior. En la verificación solicitada, seleccioné “Conservar el dictamen” con el motivo urgente incompatible, vi el error, cambié solo la decisión a “Suspender el dictamen” y confirmé con el mismo motivo; el error desapareció y se mostró el resultado.
- Navegador a 390 px: el mensaje de paciente fue el texto de cierre solicitado, el único botón del bloque fue “Volver al aviso”, y la auditoría quedó en una pestaña separada con explicación de rol. Se vieron la definición de “dictamen” y la aclaración de la fecha de actualización. Tras suspender, auditoría mostró resultado/motivo sin texto dirigido a pacientes; al volver a Avisos, el mensaje público añadió el resultado/motivo. Sin errores JS ni scroll horizontal.
- Navegador a 320 px: “Volver al aviso” retornó al caso peligroso correcto; después se pudo ensayar su suspensión en la pestaña auditora. No hubo desbordamiento horizontal.
- Capturas reportadas como mezclas de casos se registran separadas de problemas de interfaz en [PERSONA_LOG.md](PERSONA_LOG.md). El reporte no especifica qué capturas/casos; no se inventa esa atribución y deberán regenerarse desde sesiones limpias.
- No se hizo entrevista real ni retest de Laura sintética; las comprobaciones técnicas automatizadas y manuales no representan ese retest.

## Verificación de recuperación de validación

- Desde el aviso peligroso envié “La instrucción podría retrasar una acción urgente”.
- En auditoría elegí “Conservar el dictamen” + “La espera indicada puede retrasar una acción urgente” y confirmé. El navegador mostró “El motivo debe corresponder a la decisión.”; la decisión no se guardó.
- Cambié la decisión a “Suspender el dictamen” manteniendo el motivo. El mensaje de validación quedó vacío.
- Confirmé de nuevo: se guardó “Resultado de la revisión: suspendido” con el motivo esperado y el formulario se cerró.
- La prueba `an incompatible audit choice can be corrected and then saved` cubre el rechazo y la llamada válida consecutiva a la regla de dominio.
- Validación final: `npm test` pasó 9/9 y `npm run build` terminó correctamente con Vite v7.3.6; `git diff --check` no reportó problemas.

## Integración LLM server-side

- Pruebas directas del handler `/api/explain`: cubren allowlist de IDs, rechazo de campos extra, origen cruzado, payload malformado/grande (incluido stream que falsea `Content-Length`), falta de clave, falla del proveedor y rechazo de salida fuera del esquema estricto de tres campos. El adaptador de generación es falso en las pruebas; no se llamó a Google.
- La prueba de la ruta de éxito confirma que el contexto pasado al adaptador no contiene `nextAction` ni `verdict`. Verifica el contrato local, no la salida ni disponibilidad de Gemini.
- Navegador: intercepté `/api/explain` con una respuesta 503 de prueba; la UI mostró el error y “Alternativa fija · SIMULADA”. Después intercepté una respuesta estructurada de prueba; la UI mostró tres apartados bajo “Respuesta real del modelo · Google Gemini”. La acción y el resultado de revisión no cambiaron. Ambas fueron respuestas de prueba, no llamadas reales al proveedor.
- Navegador: una respuesta de prueba con `<img onerror>` produjo cero imágenes bajo la explicación; la acción y el resultado del aviso permanecieron iguales.
- No hay `GOOGLE_GENERATIVE_AI_API_KEY` en este entorno, por lo que la llamada real y su resultado no se han probado. Tras configurar la variable en Vercel, verificar desde el deployment y registrar el resultado real sin copiar la clave a logs.
- `npm ci`: instaló 28 paquetes; cero vulnerabilidades reportadas en 29 paquetes auditados.
- `npm test`: 15/15 pruebas aprobadas, incluidas las pruebas de seguridad/errores del endpoint.
- `npm run build`: Vite v7.3.6 generó `dist/`; `git diff --check` pasó.
- No se hizo una llamada real a Gemini porque este entorno no tiene `GOOGLE_GENERATIVE_AI_API_KEY`. El éxito browser y el generador de las pruebas son mocks, no inferencia real.

## Diagnóstico seguro 502

Fecha de esta verificación: 4 de octubre de 2026.

- Clasificación automatizada probada para HTTP 401/authentication, 403/permissions, 429/quota, 404/model, 400/provider_request, 503/provider_error, 408/504/timeout, AbortError/TimeoutError y error de objeto de respuesta/response_validation.
- Prueba de handler: estado 503 se devuelve como HTTP 502 con diagnóstico `{ category: "provider_error", providerHttpStatus: 503 }`; el evento de servidor registra únicamente `event`, `category`, `providerHttpStatus`.
- Prueba de timeout envuelto en `cause`: clasifica como `timeout`, estado nulo, sin imprimir texto sensible, URL, header ni causa.
- La respuesta que falla el esquema se clasifica `response_validation`; el cliente mantiene error visible y alternativa “SIMULADA”.
- `npm test`: 17/17 pruebas aprobadas. `npm run build`: Vite v7.3.6 generó `dist/`. `git diff --check`: sin errores.
- No se accedió a logs de un deployment real ni se hizo llamada real al proveedor en esta sesión. En producción, consultar Vercel Project → **Logs** (o el deployment → **Functions** → `/api/explain`) y filtrar `llm_provider_failure`.