# Backend API - Ferretería Villamil

## Overview

Backend API RESTful para el sistema de gestión de ferretería construido con Node.js, Express y Sequelize ORM. Proporciona endpoints completos para la gestión de usuarios, artículos, pedidos, calificaciones y estadísticas del negocio.

## 🏗️ Arquitectura

### Tecnologías Principales
- **Node.js** - Runtime environment
- **Express.js** - Framework web
- **Sequelize** - ORM para PostgreSQL
- **PostgreSQL** - Base de datos relacional
- **JWT** - Autenticación y autorización
- **Socket.io** - Comunicación en tiempo real
- **Multer** - Manejo de archivos y uploads
- **Bcrypt** - Encriptación de contraseñas

### Estructura del Proyecto

```
backend/
├── app.js                 # Configuración principal de Express
├── bin/
│   └── www               # Punto de entrada del servidor
├── config/
│   └── config.js         # Configuración de base de datos
├── controllers/          # Lógica de negocio
│   ├── articulo.js
│   ├── calificacion.js
│   ├── pedido.js
│   ├── usuario.js
│   └── estadisticas.js
├── middleware/
│   ├── auth.js           # Middleware de autenticación JWT
│   └── upload.js         # Middleware para uploads de archivos
├── models/               # Modelos Sequelize
│   ├── articulo.js
│   ├── calificacion.js
│   ├── detalle_pedido.js
│   ├── pedido.js
│   ├── usuario.js
│   └── index.js
├── routes/               # Definición de rutas API
│   ├── articulo.js
│   ├── calificacion.js
│   ├── detalles.js
│   ├── estadisticas.js
│   ├── pedido.js
│   ├── tracking.js
│   └── usuario.js
├── migrations/           # Migraciones de base de datos
├── seeders/              # Datos iniciales
├── uploads/              # Archivos subidos
├── utils/                # Utilidades
├── .env                  # Variables de entorno
├── package.json          # Dependencias y scripts
└── Dockerfile            # Configuración Docker
```

## 🚀 Configuración y Instalación

### Prerrequisitos
- Node.js 18+
- PostgreSQL 15+
- npm o yarn

### Instalación Local

```bash
# Clonar el repositorio
git clone <repository-url>
cd ferreteria_villamil/backend

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales

# Crear base de datos
npm run db:create

# Ejecutar migraciones
npm run db:migrate

# Ejecutar seeders (datos iniciales)
npm run db:m:seed

# Iniciar servidor en modo desarrollo
npm start
```

### Variables de Entorno

```env
DB_USERNAME="classux"
DB_PASSWORD="classux123"
DB_NAME="ferreteria_development"
DB_HOST="127.0.0.1"
DB_PORT="5432"
PORT="3000"
FRONTEND_URL="http://localhost:5173"
```

## 📚 API Endpoints

### Autenticación
- `POST /api/login` - Inicio de sesión de usuarios

### Gestión de Usuarios (`/api/usuarios`)
- `GET /api/usuarios` - Listar todos los usuarios
- `GET /api/usuarios/:id` - Obtener usuario por ID
- `POST /api/usuarios` - Crear nuevo usuario
- `PUT /api/usuarios/:id` - Actualizar usuario
- `DELETE /api/usuarios/:id` - Eliminar usuario

### Gestión de Artículos (`/api/articulos`)
- `GET /api/articulos` - Listar todos los artículos
- `GET /api/articulos/:id` - Obtener artículo por ID
- `POST /api/articulos` - Crear nuevo artículo
- `PUT /api/articulos/:id` - Actualizar artículo
- `DELETE /api/articulos/:id` - Eliminar artículo
- `POST /api/articulos/upload` - Subir imagen de artículo

### Gestión de Pedidos (`/api/pedidos`)
- `GET /api/pedidos` - Listar todos los pedidos
- `GET /api/pedidos/:id` - Obtener pedido por ID
- `POST /api/pedidos` - Crear nuevo pedido
- `PUT /api/pedidos/:id` - Actualizar pedido
- `DELETE /api/pedidos/:id` - Eliminar pedido

### Gestión de Calificaciones (`/api/calificaciones`)
- `GET /api/calificaciones` - Listar todas las calificaciones
- `GET /api/calificaciones/:id` - Obtener calificación por ID
- `POST /api/calificaciones` - Crear nueva calificación
- `PUT /api/calificaciones/:id` - Actualizar calificación
- `DELETE /api/calificaciones/:id` - Eliminar calificación

### Estadísticas (`/api/estadisticas`)
- `GET /api/estadisticas/dashboard` - Estadísticas del dashboard
- `GET /api/estadisticas/articulos` - Estadísticas de artículos
- `GET /api/estadisticas/pedidos` - Estadísticas de pedidos
- `GET /api/estadisticas/usuarios` - Estadísticas de usuarios

### Tracking Público (`/cliente/tracking`)
- `GET /cliente/tracking/:codigo` - Tracking de pedido (público)

## 🔐 Autenticación y Autorización

### JWT Tokens
La API utiliza JSON Web Tokens (JWT) para la autenticación. El token debe incluirse en el header `Authorization`:

```
Authorization: Bearer <token>
```

### Roles de Usuario
- **Administrador**: Acceso completo a todos los endpoints
- **Repartidor**: Acceso limitado a pedidos asignados

### Middleware de Autenticación
Todos los endpoints protegidos utilizan el middleware `authMiddleware` que:
- Verifica la validez del token JWT
- Extrae la información del usuario
- Permite el acceso según el rol

## 📊 Modelos de Datos

### Usuario
```javascript
{
  id: Integer (PK),
  nombre: String,
  correo: String (Unique),
  clave: String (Hashed),
  telefono: String,
  rol: Enum['Administrador', 'Repartidor'],
  estado: Enum['Activo', 'Inactivo'],
  foto_perfil: String (Optional),
  fecha_creacion: Date,
  fecha_actualizacion: Date
}
```

### Artículo
```javascript
{
  id: Integer (PK),
  codigo: String (Unique),
  nombre: String,
  descripcion: Text,
  costo_unitario: Decimal,
  precio: Decimal,
  cantidad_existencia: Integer,
  stock_minimo: Integer,
  proveedor: String,
  estado: Enum['Disponible', 'No Disponible'],
  foto_url: String (Optional),
  fecha_creacion: Date,
  fecha_actualizacion: Date
}
```

### Pedido
```javascript
{
  id: Integer (PK),
  numero_pedido: String (Unique),
  cliente_nombre: String,
  cliente_telefono: String,
  cliente_identidad: String,
  id_repartidor_asignado: Integer (FK),
  id_admin_creador: Integer (FK),
  estado: Enum['Pendiente', 'Asignado', 'En Camino', 'Entregado', 'Cancelado'],
  codigo_confirmacion: String,
  costo_envio: Decimal,
  total: Decimal,
  direccion_entrega: Text,
  observacion: Text (Optional),
  fecha_creacion: Date,
  fecha_asignacion: Date (Optional),
  fecha_entrega: Date (Optional),
  fecha_cancelacion: Date (Optional),
  motivo_cancelacion: Text (Optional),
  link_seguimiento: String (Optional)
}
```

### Detalle Pedido
```javascript
{
  id: Integer (PK),
  id_pedido: Integer (FK),
  id_articulo: Integer (FK),
  cantidad: Integer,
  precio_unitario: Decimal,
  subtotal: Decimal
}
```

### Calificación
```javascript
{
  id_pedido: Integer (PK, FK),
  puntuacion: Integer (1-5),
  comentario: Text (Optional),
  fecha_calificacion: Date
}
```

## 🛠️ Scripts Disponibles

```bash
# Desarrollo
npm start              # Iniciar servidor con nodemon
npm run db:create      # Crear base de datos
npm run db:migrate     # Ejecutar migraciones
npm run db:m:undo      # Deshacer todas las migraciones
npm run db:m:seed      # Ejecutar todos los seeders
npm run db:s:undo      # Deshacer todos los seeders
```

## 📁 Manejo de Archivos

### Upload de Imágenes
- **Ruta**: `/api/articulos/upload`
- **Método**: POST
- **Formato**: multipart/form-data
- **Campo**: `foto`
- **Destino**: `uploads/`
- **URL pública**: `/uploads/[filename]`

### Tipos de Archivos Permitidos
- Imágenes: jpg, jpeg, png, gif, webp
- Tamaño máximo: 5MB

## 🔧 Configuración CORS

La API está configurada para aceptar peticiones desde:
- `http://localhost:5173` (Frontend local)
- `http://localhost:3000` (Backend)
- Dominios Cloudflare Tunnel: `*.trycloudflare.com`
- Redes locales: `192.168.x.x`, `10.x.x.x`

## 🐳 Configuración Docker

### Dockerfile
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN mkdir -p uploads
EXPOSE 3000
CMD ["npm", "start"]
```

### Variables de Entorno Docker
- `DB_HOST: db` (nombre del servicio en docker-compose)
- `DB_PORT: 5432`
- `DB_USERNAME: classux`
- `DB_PASSWORD: classux123`
- `DB_NAME: ferreteria_development`
- `PORT: 3000`
- `FRONTEND_URL: http://localhost:5173`

## 🔄 Comunicación en Tiempo Real

### Socket.io Events
- **Servidor → Cliente**:
  - `pedido_actualizado`: Notificación de cambios en pedidos
  - `nuevo_pedido`: Notificación de nuevos pedidos
  - `pedido_asignado`: Asignación a repartidor

- **Cliente → Servidor**:
  - `actualizar_pedido`: Actualizar estado de pedido
  - `marcar_entregado`: Marcar pedido como entregado

## 🧪 Testing

### Pruebas de Endpoints
```bash
# Login
curl -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -d '{"correo":"admin1@mail.com","clave":"123456"}'

# Obtener artículos (con token)
curl -X GET http://localhost:3000/api/articulos \
  -H "Authorization: Bearer <token>"
```

## 📝 Logs y Monitoreo

### Morgan Logger
- Formato: `dev` en desarrollo
- Niveles: `combined`, `common`, `dev`, `short`, `tiny`
- Logs de peticiones HTTP con método, URL, status y tiempo

### Manejo de Errores
- Errores 404: Recurso no encontrado
- Errores 500: Error interno del servidor
- Respuestas JSON consistentes con formato de error

## 🔒 Seguridad

### Medidas Implementadas
- **Hashing de contraseñas** con Bcrypt (salt rounds: 10)
- **Tokens JWT** con expiración configurable
- **Validación de inputs** en controllers
- **CORS configurado** para dominios permitidos
- **Sanitización de archivos** en uploads

### Best Practices
- No exponer información sensible en respuestas de error
- Validar todos los datos de entrada
- Usar HTTPS en producción
- Rotación de claves JWT regularmente

## 🚀 Despliegue

### Producción
```bash
# Variables de entorno adicionales
NODE_ENV=production
JWT_SECRET=<secret-key>
JWT_EXPIRES_IN=<time>

# Iniciar servidor
npm start
```

### Docker Compose
```bash
# Construir y levantar servicios
docker-compose up --build

# Ver logs
docker-compose logs -f backend

# Detener servicios
docker-compose down
```

## 📞 Soporte y Contacto

### Issues y Bugs
- Reportar issues en el repositorio del proyecto
- Incluir logs detallados y pasos para reproducir
- Especificar versión de Node.js y entorno

### Documentación Adicional
- [Documentación Docker](../README_DOCKER.md)
- [API Postman Collection](./docs/postman-collection.json)
- [Diagrama de Base de Datos](./docs/database-diagram.png)

---

**Versión**: 1.0.0  
**Última Actualización**: Enero 2026  
**Desarrollado por**: Equipo Ferretería Villamil
