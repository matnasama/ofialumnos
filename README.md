# Proyecto React + Node.js

Este repositorio contiene dos carpetas principales:

- `front`: Aplicación React creada con Vite.
- `back`: API backend con Node.js y Express.

## Cómo iniciar

### Frontend
1. Ve a la carpeta `front`.
2. Ejecuta `npm install`.
3. Ejecuta `npm run dev` para iniciar el servidor de desarrollo.

### Backend
1. Ve a la carpeta `back`.
2. Ejecuta `npm install`.
3. Ejecuta `node index.js` para iniciar el servidor Express.

## Despliegue / Variables de entorno recomendadas
En producción debes configurar las siguientes variables de entorno para que el backend acepte peticiones desde el frontend y se conecte a la base de datos:

- `PGHOST`, `PGDATABASE`, `PGUSER`, `PGPASSWORD`, `PGSSLMODE` — configuración de la base de datos (Postgres).
- `CORS_ORIGIN` — orígenes permitidos para CORS. Ejemplo: `https://ofialumnos.vercel.app` o una lista separada por comas `https://ofialumnos.vercel.app,https://midominio.com`. Si no se define, el servidor permite todos los orígenes (`*`) (no recomendado en producción).
- `CORS_ALLOW_CREDENTIALS` — `true` si necesitas permitir cookies/sesiones entre dominios.
- `DEBUG_CORS` — `true` para activar logs de origen entrante en el backend (útil al desplegar).

### Debug / Admin
- `DEBUG_FLAGS` — `true` para permitir el endpoint de depuración `/api/activities/flags/all` que lista todas las filas en `activity_user_flags`. Útil para inspección rápida en entornos controlados (no recomendable en producción pública sin protección).
- `ADMIN_TOKEN` — si prefieres mantener `DEBUG_FLAGS=false`, puedes definir un token en `ADMIN_TOKEN` y acceder al endpoint `/api/activities/flags/all` enviando el header `x-admin-token: <ADMIN_TOKEN>`.
- `PORT` — puerto donde correrá el backend (útil si no usas el puerto por defecto o tu hosting lo requiere).

Ejemplo en Vercel: añadir estas variables en la sección Environment Variables del proyecto antes de desplegar.
