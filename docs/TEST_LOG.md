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
- Se corrigió la validación obsoleta del formulario: cambiar la decisión o el motivo ahora limpia el error anterior. En navegador, seleccioné suspensión con motivo incompatible, vi el error, cambié solo la decisión a conservación y confirmé sin cambiar el motivo; el error desapareció y se mostró el resultado.
- Navegador a 390 px: el mensaje de paciente fue el texto de cierre solicitado, el único botón del bloque fue “Volver al aviso”, y la auditoría quedó en una pestaña separada con explicación de rol. Se vieron la definición de “dictamen” y la aclaración de la fecha de actualización. Tras suspender, auditoría mostró resultado/motivo sin texto dirigido a pacientes; al volver a Avisos, el mensaje público añadió el resultado/motivo. Sin errores JS ni scroll horizontal.
- Navegador a 320 px: “Volver al aviso” retornó al caso peligroso correcto; después se pudo ensayar su suspensión en la pestaña auditora. No hubo desbordamiento horizontal.
- Capturas reportadas como mezclas de casos se registran separadas de problemas de interfaz en [PERSONA_LOG.md](PERSONA_LOG.md). El reporte no especifica qué capturas/casos; no se inventa esa atribución y deberán regenerarse desde sesiones limpias.
- No se hizo entrevista real ni retest de Laura sintética; las comprobaciones técnicas automatizadas y manuales no representan ese retest.