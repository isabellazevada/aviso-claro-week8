# Publicar Aviso Claro en Vercel

La configuración de [vercel.json](vercel.json) construye la interfaz con Vite en `dist/`; Vercel despliega por separado `api/explain.js` como función Node. Ejecuta `npm ci`, corre `npm test` y después `npm run build`. También añade cabeceras CSP, `nosniff`, protección contra framing, política de referrer y permisos de cámara/micrófono/ubicación desactivados.

## Publicación desde GitHub

1. Confirma y sube a GitHub la rama que contiene `vercel.json`, `package.json` y `package-lock.json`.
2. Inicia sesión en Vercel con GitHub y elige **Add New → Project**.
3. Importa `isabellazevada/aviso-claro-week8`. Autoriza el acceso al repositorio si Vercel lo solicita.
4. Usa la raíz del repositorio como **Root Directory**. Vercel debería detectar Vite y leer los comandos/salida de `vercel.json`: instalación `npm ci`, build `npm test && npm run build`, carpeta `dist`.
5. En **Project Settings → Environment Variables**, configura `GOOGLE_GENERATIVE_AI_API_KEY` con una clave de Google AI Studio para los entornos que uses (Production y, si corresponde, Preview). No la nombres `VITE_*`, no la pongas en GitHub ni en el chat. Restringe la clave a la Gemini API y fija una cuota/límite de gasto desde Google cuando esté disponible.
6. Revisa el plan y los ajustes; pulsa **Deploy**. Vercel generará una URL `*.vercel.app`. No es necesario comprar un dominio para usar esa URL.
7. Verifica la URL de producción: los tres avisos y etiquetas de datos/auditoría simulados deben aparecer; con la variable ya configurada, pide una explicación y confirma el rótulo “Respuesta real del modelo · Google Gemini”. Ensaya una revisión, confirma que al recargar se borra el estado temporal y comprueba cabeceras en las herramientas de red.

Con Git conectado, Vercel genera deployments de vista previa para otras ramas y publica la rama de producción configurada, normalmente `main`, al recibir cambios. Confirma esa rama en **Project Settings → Environments → Production → Branch Tracking**.

## Precio y límites

Vercel anuncia Hobby a $0 al mes, con límites de uso. Sus términos lo destinan a uso personal y no comercial; verifica que el uso académico concreto y la visibilidad del repositorio cumplen los términos vigentes antes de publicar. Superar el uso incluido no convierte este proyecto en un despliegue ilimitado gratuito.

Este proyecto solo contiene casos ficticios. No conectes expedientes, información personal, claves ni un LLM desde el navegador. La publicación no es prueba de independencia, seguridad de una clínica ni comprensión de pacientes.

## Explicación LLM

`/api/explain` es una Vercel Function Node que usa AI SDK y Google Gemini (`gemini-3.8-flash`). La clave se lee solo desde `GOOGLE_GENERATIVE_AI_API_KEY` en el servidor. El cliente envía únicamente `{ "caseId": "aviso-01" | "aviso-02" | "aviso-03" }`; Zod rechaza campos extra e IDs desconocidos. El servidor selecciona los datos de `src/data/incidents.json` y manda solo resumen, hechos conocidos, incertidumbres e instrucción preocupante. No manda la acción siguiente, el dictamen ni texto libre.

La pantalla marca por separado “Respuesta real del modelo · Google Gemini” y “Explicación fija · SIMULADA”. Ante error HTTP/red, muestra el error y “Alternativa fija · SIMULADA”. Una respuesta del modelo puede equivocarse: no sustituye los hechos visibles, no cambia la acción aprobada y no decide, aprueba, suspende ni conserva revisiones.

En el cliente, DOMPurify más `textContent` evita interpretar la respuesta como HTML; CSP limita scripts y conexiones del navegador a mismo origen. Zod valida tamaño, forma y allowlist del ID; el chequeo de `Origin` reduce solicitudes web cross-origin. Ninguna medida autentica a quien llama ni proporciona rate limiting: la función es pública y podría consumir cuota. Restringe la clave y configura cuota en Google; supervisa uso. Las cuotas/precios dependen de Google y de la cuenta, así que no se promete inferencia gratuita.

Para desarrollo, `npm run dev` sirve Vite pero no emula funciones `/api`; usa Vercel CLI (`vercel dev`) conectado al proyecto para probar la ruta allí. No publiques un `.env.local`; `.env*` está ignorado por Git. Sin clave, el endpoint devuelve error de configuración y la UI conserva solo la alternativa simulada.

## Estado y comprobaciones

La preparación de configuración no publica el proyecto. La publicación solo queda confirmada cuando el usuario completa **Deploy** y comprueba la URL de producción.

- Local: `npm test` y `npm run build`.
- En el build de Vercel: el comando de build repite ambas comprobaciones antes de publicar.
- No se ha configurado una clave ni se ha hecho una llamada real a Gemini. Tampoco se han hecho deployments ni se ha validado una URL Vercel.

Documentación oficial consultada el 3 de octubre de 2026: [Vite en Vercel](https://vercel.com/docs/frameworks/frontend/vite), [funciones Node en Vercel](https://vercel.com/docs/functions/runtimes/node-js), [Google provider de AI SDK](https://ai-sdk.dev/providers/ai-sdk-providers/google-generative-ai), [configuración `vercel.json`](https://vercel.com/docs/project-configuration/vercel-json), [deployments desde Git](https://vercel.com/docs/git) y [precios](https://vercel.com/pricing).