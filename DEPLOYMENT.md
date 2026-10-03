# Publicar Aviso Claro en Vercel

La configuración de [vercel.json](vercel.json) construye la aplicación con Vite y publica únicamente `dist/`. Ejecuta `npm ci`, corre `npm test` y después `npm run build`. También añade cabeceras CSP, `nosniff`, protección contra framing, política de referrer y permisos de cámara/micrófono/ubicación desactivados.

## Publicación desde GitHub

1. Confirma y sube a GitHub la rama que contiene `vercel.json`, `package.json` y `package-lock.json`.
2. Inicia sesión en Vercel con GitHub y elige **Add New → Project**.
3. Importa `isabellazevada/aviso-claro-week8`. Autoriza el acceso al repositorio si Vercel lo solicita.
4. Usa la raíz del repositorio como **Root Directory**. Vercel debería detectar Vite y leer los comandos/salida de `vercel.json`: instalación `npm ci`, build `npm test && npm run build`, carpeta `dist`.
5. No añadas variables de entorno: esta demo no tiene claves, APIs ni servicios externos.
6. Revisa el plan y los ajustes; pulsa **Deploy**. Vercel generará una URL `*.vercel.app`. No es necesario comprar un dominio para usar esa URL.
7. Verifica la URL de producción: los tres avisos y las etiquetas de simulación deben aparecer; ensaya una revisión; confirma que al recargar se borra el estado temporal. Comprueba también las cabeceras de respuesta desde las herramientas de red del navegador.

Con Git conectado, Vercel genera deployments de vista previa para otras ramas y publica la rama de producción configurada, normalmente `main`, al recibir cambios. Confirma esa rama en **Project Settings → Environments → Production → Branch Tracking**.

## Precio y límites

Vercel anuncia Hobby a $0 al mes, con límites de uso. Sus términos lo destinan a uso personal y no comercial; verifica que el uso académico concreto y la visibilidad del repositorio cumplen los términos vigentes antes de publicar. Superar el uso incluido no convierte este proyecto en un despliegue ilimitado gratuito.

Este proyecto solo contiene casos ficticios. No conectes expedientes, información personal, claves ni un LLM desde el navegador. La explicación continúa siendo simulada y visible como tal; la publicación no es prueba de independencia, seguridad de una clínica ni comprensión de pacientes.

## Estado y comprobaciones

La preparación de configuración no publica el proyecto. La publicación solo queda confirmada cuando el usuario completa **Deploy** y comprueba la URL de producción.

- Local: `npm test` y `npm run build`.
- En el build de Vercel: el comando de build repite ambas comprobaciones antes de publicar.
- No se han hecho deployments ni se ha validado una URL Vercel.

Documentación oficial consultada el 3 de octubre de 2026: [Vite en Vercel](https://vercel.com/docs/frameworks/frontend/vite), [configuración `vercel.json`](https://vercel.com/docs/project-configuration/vercel-json), [deployments desde Git](https://vercel.com/docs/git) y [precios](https://vercel.com/pricing).