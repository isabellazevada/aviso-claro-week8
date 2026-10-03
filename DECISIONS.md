# Aviso Claro · Decisiones de implementación

Actualizado: 3 de octubre de 2026. Estado: prototipo local de demostración; no desplegado.

## Stack gratuito

- Interfaz: HTML, CSS y JavaScript sin framework; Vite para desarrollo y compilación local.
- Datos: tres fixtures ficticios en `src/data/incidents.json`; motivos de reporte y auditoría como opciones cerradas.
- Seguridad: DOMPurify empaquetado localmente, renderizado como texto, CSP restrictiva, sin formularios de texto/archivos, sin persistencia y sin llamadas de red de la aplicación.
- LLM: **simulado**. La explicación fija aparece marcada como simulada; no se llama a un modelo, no aprueba dictámenes y no se envían prompts. Una futura opción gratuita sería un modelo local mediante Ollama, tras revisar licencia, calidad y operación. Esa integración no existe en este prototipo; queda pendiente confirmar si la simulación satisface el requisito académico de LLM.
- Secretos: no hay claves ni API externa configurada. No introducir claves en frontend.
- Publicación: preparada para Vercel Hobby, sin despliegue. `vercel.json` publica `dist/`, ejecuta tests/build y fija cabeceras HTTP de seguridad. No se creó URL pública ni se hicieron deployments.

## Criterios de aceptación

| Criterio | Condición del Packet | Comprobación de este slice |
|---|---|---|
| AC1 · No crear exposición | Sin datos sensibles, manipulación ni detalles técnicos explotables | Solo fixtures inventados; reportes de opciones cerradas; no hay campos personales, archivos, servidor, telemetría ni persistencia. |
| AC2 · Avisar antes de revisar | La clínica no espera al auditor y no existe sello de seguridad | Cada aviso muestra su estado limitado y sus fechas ficticias; la publicación inicial precede a la revisión en los fixtures. No se afirma que una clínica sea segura. |
| AC3 · Responsabilidad humana | IA no aprueba; evidencia insuficiente significa no verificable | La señal orienta y no cambia el dictamen. La vista de auditor ficticio confirma suspensión o conservación y exige un motivo cerrado. |
| AC4 · Independencia/transparencia | Publicar todos los casos, incluidos fallos; el pagador no controla resultados | Los tres casos permanecen visibles, incluido el peligroso y el no verificable. No hay controles de pagador. La independencia institucional no está probada por una demo. |
| AC5 · Comprensión | Separar enviado/entregado/comprendido; desconocido no equivale a cero; comprobar claridad con personas | Las tres métricas aparecen separadas y los desconocidos se muestran como desconocidos. No se hizo una prueba con diez personas; el umbral de comprensión queda pendiente. |
| AC6 · Suspensión y parada | Auditor suspende ante riesgo plausible; corrección material en 24 h; detener expansión ante señales de parada | Caso peligroso puede suspenderse con razón y deja una corrección pendiente con plazo de 24 h. No se exige probar daño bancario. No se autoriza piloto ni expansión; pagador, demora real o instrucciones peligrosas en producción obligan a detenerla. |

## Pruebas ejecutadas

Runtime temporal Node v22.16.0 en `/tmp`; no se instaló globalmente. `npm ci` instaló 16 paquetes y reportó cero vulnerabilidades en 17 paquetes auditados.

- `npm test`: 7/7 pruebas aprobadas. Cubre instrucción ambigua, evidencia temporal faltante, reporte sin sustento, valores de inyección/no permitidos, reinicio de decisión anterior, tres casos/métricas independientes y configuración Vercel.
- `npm run build`: compilación Vite aprobada; genera `dist/` local. No equivale a despliegue.
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

- Ratificar con el equipo/curso si el adaptador LLM simulado cumple; de lo contrario, acordar un modelo local gratuito y mantenerlo fuera del cliente.
- Hacer prueba de claridad con diez personas reales bajo el umbral del Packet; el arquetipo de Laura sigue siendo sintético.
- Ratificar el Blueprint del equipo, incorporar el mockup al PDF y validar la shadow clause con el equipo.
- Completar manualmente la importación de GitHub en Vercel, verificar términos de Hobby y registrar la URL/build solo después de un deployment real. No publicar antes de revisar los criterios de parada.
- No hay denuncias reales, clínicas reales, asesoría legal/médica, métricas de comprensión reales ni autoridad auditora.

## Siguiente paso

Seguir [DEPLOYMENT.md](DEPLOYMENT.md) para importar el repositorio en Vercel Hobby y comprobar su URL sin añadir datos reales. En paralelo, pedir ratificación al equipo y al curso sobre el LLM simulado. Si no basta, decidir una integración local gratuita de Ollama antes de conectar cualquier modelo; mantener sin cambios la regla de que el auditor humano, nunca la IA, toma la decisión.