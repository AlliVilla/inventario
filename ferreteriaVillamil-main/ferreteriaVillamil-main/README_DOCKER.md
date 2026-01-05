# Docker Setup - Ferretería Villamil

## Arquitectura Docker

Este proyecto utiliza Docker Compose para orquestar tres servicios principales:

- **PostgreSQL**: Base de datos
- **Backend**: API Node.js/Express
- **Frontend**: Aplicación React/Vite

## Requisitos

- Docker Desktop instalado
- Docker Compose (incluido en Docker Desktop)

## Inicio Rápido

### 1. Construir y levantar todos los servicios

```bash
docker-compose up --build
```

### 2. Verificar que todo funciona

- Frontend: http://localhost:5173
- Backend API: http://localhost:3000/api
- Base de datos: localhost:5432

## Comandos Útiles

### Levantar servicios en segundo plano
```bash
docker-compose up -d
```

### Ver logs de todos los servicios
```bash
docker-compose logs -f
```

### Ver logs de un servicio específico
```bash
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f db
```

### Detener servicios
```bash
docker-compose down
```

### Detener y eliminar volúmenes
```bash
docker-compose down -v
```

### Reconstruir imágenes
```bash
docker-compose build --no-cache
```

## Estructura de Servicios

### Base de Datos (db)
- **Imagen**: `postgres:15-alpine`
- **Puerto**: 5432
- **Base de datos**: `ferreteria_development`
- **Usuario**: `classux`
- **Contraseña**: `classux123`
- **Health check**: Verifica que PostgreSQL esté listo

### Backend (backend)
- **Build**: Contexto `./backend`
- **Puerto**: 3000
- **Variables de entorno**: Configuradas para conectar con la base de datos Docker
- **Migraciones**: Se ejecutan automáticamente al iniciar
- **Volumes**: Monta carpeta `uploads` para persistencia de archivos

### Frontend (frontend)
- **Build**: Contexto `./frontend`
- **Puerto**: 5173
- **Variables de entorno**: `VITE_API_URL` apunta al backend Docker
- **Volumes**: Monta código fuente para desarrollo en caliente

## Variables de Entorno

### Backend
- `DB_HOST=db` (nombre del servicio Docker)
- `DB_PORT=5432`
- `DB_USERNAME=classux`
- `DB_PASSWORD=classux123`
- `DB_NAME=ferreteria_development`
- `PORT=3000`
- `FRONTEND_URL=http://localhost:5173`

### Frontend
- `VITE_API_URL=http://localhost:3000/api`

## Flujo de Inicio

1. **PostgreSQL** inicia primero
2. **Health check** espera a que la BD esté lista
3. **Backend** inicia, ejecuta migraciones y levanta el API
4. **Frontend** inicia y se conecta al backend

## Desarrollo

### Para cambios en el backend:
Los cambios se reflejan automáticamente con nodemon.

### Para cambios en el frontend:
Los cambios se reflejan automáticamente con Vite HMR.

### Para cambios en la base de datos:
```bash
# Acceder al contenedor de la BD
docker-compose exec db psql -U classux -d ferreteria_development

# Ejecutar migraciones manualmente
docker-compose exec backend npm run db:migrate

# Revertir migraciones
docker-compose exec backend npm run db:m:undo
```

## Problemas Comunes

### "Database connection failed"
Asegúrate de que el servicio `db` esté saludable:
```bash
docker-compose ps
```

### "Port already in use"
Verifica que los puertos 3000, 5173 y 5432 estén libres:
```bash
# En Windows
netstat -ano | findstr :3000
netstat -ano | findstr :5173
netstat -ano | findstr :5432
```

### "Migration failed"
Reinicia el backend:
```bash
docker-compose restart backend
```

## Producción

Para producción, modifica las siguientes variables:
- Usa imágenes optimizadas (`node:18-alpine-slim`)
- Configura volúmenes persistentes
- Agrega networking seguro
- Configura health checks para todos los servicios

## Limpieza

Para eliminar completamente el entorno Docker:
```bash
docker-compose down -v --rmi all
```
