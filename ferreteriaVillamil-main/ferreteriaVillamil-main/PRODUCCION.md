# Despliegue de Ferretería Villamil

## VPS con Docker Compose

Esta opción usa Caddy para HTTPS y sirve React, la API y Socket.IO desde un solo dominio. PostgreSQL queda en la red interna de Docker.

1. Apunta el dominio al servidor y abre los puertos 80 y 443. Copia `.env.example` a `.env` y configura `SITE_DOMAIN`, `JWT_SECRET`, `DB_PASSWORD`, `SUPABASE_URL` y `SUPABASE_KEY`. Genera dos secretos distintos, por ejemplo con `openssl rand -hex 32`. Para la contraseña de PostgreSQL usa el valor hexadecimal para que pueda incluirse en la URL de conexión.
2. Ejecuta `docker compose -f compose.production.yml up -d --build`. El backend ejecuta las migraciones antes de arrancar.
3. Para una base nueva, pasa a `docker compose -f compose.production.yml exec -T backend node create-admin.js` un objeto JSON por entrada estándar con `nombre`, `correo`, `telefono` y `clave`. Lee la contraseña de un gestor de secretos. Evita los seeders de demostración.
4. Verifica `/healthz`, inicio de sesión, una venta, seguimiento de un pedido y carga de imágenes. Configura el bucket `articulos` en Supabase y comprueba los permisos de la clave en el backend.

[Docker Compose en producción](https://docs.docker.com/compose/how-tos/production/) · [HTTPS automático de Caddy](https://caddyserver.com/docs/automatic-https)

## Render con PostgreSQL administrado

1. Crea un PostgreSQL en la región del backend. Crea un servicio web para `backend` con Node 24. Usa `npm ci --include=dev` para compilar, `npm run db:migrate` antes del despliegue y `node bin/www` para iniciar. Configura `/healthz`.
2. Define `NODE_ENV=production`, `DATABASE_URL`, `JWT_SECRET`, `FRONTEND_URL` con el origen HTTPS exacto, `SUPABASE_URL` y `SUPABASE_KEY`. Usa la URL interna de PostgreSQL si están en la misma red de Render. Para una conexión externa que exige TLS, configura `DB_SSL=true` y usa un certificado que Node pueda verificar. Configura `TRUST_PROXY=1` si hay un único proxy de confianza.
3. Crea un sitio estático para `frontend` con `npm ci && npm run build` y directorio publicado `dist`. Define `VITE_API_URL=https://DOMINIO_BACKEND/api` y agrega una regla de reescritura de `/*` a `/index.html`. Usa la consola del backend para crear el primer administrador.
4. Ejecuta una sola instancia del backend inicialmente. Antes de escalar a varias réplicas, comparte la distribución de eventos de Socket.IO y los límites de solicitudes entre procesos.

[Servicios web de Render](https://render.com/docs/web-services) · [WebSocket](https://render.com/docs/websocket) · [PostgreSQL](https://render.com/docs/postgresql-creating-connecting)

## Sucursales en una misma instalación

La migración asigna los usuarios, pedidos, ventas, cotizaciones y existencias existentes a **Principal**. Todas las sucursales usan el mismo catálogo y cada una tiene sus propias cantidades y mínimos. Los artículos que todavía no tienen existencias en una sucursal muestran cero.

Para abrir otra sucursal, usa el mismo comando de creación de administrador y agrega el campo `sucursal` al JSON de entrada, por ejemplo `"sucursal": "Sucursal Centro"`. El comando crea la sucursal si hace falta y asigna allí el nuevo administrador. Inicia sesión con su correo y crea los demás usuarios desde el panel. El correo distingue cuentas con el mismo nombre en sucursales distintas.

Cada cuenta opera en una sucursal y el panel muestra la sucursal de la sesión. Las cantidades y los mínimos se editan en la sucursal activa. Los cambios de nombre, precio, foto y estado del artículo se aplican al catálogo compartido. La desactivación de un artículo conserva su historial de pedidos y ventas.

## Migración desde la instalación anterior

- Prueba la restauración y migración con una copia privada antes del corte. Comprueba que el inventario de Principal coincide con el original. La migración mueve las cantidades y mínimos de `Articulo` a `Existencia`; para revertir, restaura el respaldo previo.
- En pruebas, crea una segunda sucursal, registra cantidades diferentes para el mismo artículo y haz una venta en cada sede. Comprueba que solo se descuente de la sede correspondiente y que una cuenta de una sucursal no pueda abrir el pedido de la otra por ID.
- Para revisar los filtros de sucursal sin una base de datos, ejecuta `node --test backend/branch-scope.test.js`.
- Cambia la clave JWT y la contraseña de PostgreSQL. Si conservas un volumen existente, cambia también la contraseña del rol en PostgreSQL. La variable de Compose solo inicializa la contraseña en volúmenes nuevos. La rotación de JWT invalida sesiones y enlaces de seguimiento. Comparte enlaces nuevos desde el pedido.
- El respaldo SQL local está excluido de Git. Las revisiones que ya lo incluyeron conservan una copia. Evalúa qué clones y remotos tuvieron acceso, retira las copias expuestas y restablece las credenciales afectadas.
