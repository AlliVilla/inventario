# Frontend React - Ferretería Villamil

## Overview

Aplicación web moderna construida con React 19, Vite y TailwindCSS para el sistema de gestión de ferretería. Proporciona una interfaz intuitiva para administradores y repartidores con funcionalidades completas de gestión de inventario, pedidos y seguimiento en tiempo real.

## 🏗️ Arquitectura

### Tecnologías Principales
- **React 19** - Framework de UI con hooks modernos
- **Vite 7.2.4** - Build tool ultra-rápido
- **TailwindCSS** - Framework de CSS utility-first
- **React Router 7** - Enrutamiento del lado del cliente
- **Ant Design 6** - Componentes UI premium
- **Axios** - Cliente HTTP para API calls
- **Socket.io Client** - Comunicación en tiempo real
- **React Leaflet** - Mapas interactivos
- **Recharts** - Gráficos y visualizaciones
- **React Icons** - Iconos modernos

### Estructura del Proyecto

```
frontend/
├── public/                 # Archivos estáticos
│   ├── favicon.ico
│   └── index.html
├── src/
│   ├── components/         # Componentes React
│   │   ├── AdminLayout.jsx
│   │   ├── RepartidorLayout.jsx
│   │   ├── DashboardAdmin.jsx
│   │   ├── DashboardRepartidor.jsx
│   │   ├── LoginForm.jsx
│   │   ├── InventarioList.jsx
│   │   ├── ItemForm.jsx
│   │   ├── PedidoForm.jsx
│   │   ├── MapaSeguimientoPedido.jsx
│   │   ├── SidebarAdmin.jsx
│   │   ├── SidebarRepartidor.jsx
│   │   ├── UserListAdmin.jsx
│   │   ├── CrearUsuario.jsx
│   │   ├── EditarUsuario.jsx
│   │   ├── PerfilAdmin.jsx
│   │   ├── PerfilRepartidor.jsx
│   │   ├── ListaPedidosAdmin.jsx
│   │   ├── ListaPedidosRepartidor.jsx
│   │   ├── DetallePedidoModal.jsx
│   │   ├── PedidoCardRepartidor.jsx
│   │   ├── AsignarRepartidorModal.jsx
│   │   ├── CancelarEnvioModal.jsx
│   │   ├── ItemEstadoModal.jsx
│   │   ├── ItemBorrarModal.jsx
│   │   ├── ItemInventarioModal.jsx
│   │   ├── VerArticulo.jsx
│   │   ├── ProtectedRoute.jsx
│   │   └── InfoRepartidorCliente.jsx
│   ├── assets/            # Recursos estáticos
│   ├── location-tracking/  # Componentes de geolocalización
│   ├── utils/             # Utilidades y helpers
│   ├── App.jsx            # Componente principal
│   ├── App.css            # Estilos globales
│   ├── index.css          # Estilos de Tailwind
│   └── main.jsx           # Punto de entrada
├── .env                  # Variables de entorno
├── .gitignore           # Archivos ignorados por Git
├── Dockerfile            # Configuración Docker
├── eslint.config.js      # Configuración ESLint
├── index.html           # Template HTML
├── package.json         # Dependencias y scripts
├── postcss.config.js    # Configuración PostCSS
├── tailwind.config.js   # Configuración Tailwind
└── vite.config.js       # Configuración Vite
```

## 🚀 Configuración y Instalación

### Prerrequisitos
- Node.js 20+
- npm o yarn

### Instalación Local

```bash
# Clonar el repositorio
git clone <repository-url>
cd ferreteria_villamil/frontend

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con la URL del backend

# Iniciar servidor de desarrollo
npm run dev

# Construir para producción
npm run build

# Previsualizar build de producción
npm run preview
```

### Variables de Entorno

```env
VITE_API_URL=http://localhost:3000/api
```

## 📚 Componentes Principales

### Autenticación y Layout
- **LoginForm.jsx** - Formulario de inicio de sesión
- **ProtectedRoute.jsx** - Protección de rutas privadas
- **AdminLayout.jsx** - Layout para administradores
- **RepartidorLayout.jsx** - Layout para repartidores

### Dashboard
- **DashboardAdmin.jsx** - Panel principal del administrador
- **DashboardRepartidor.jsx** - Panel principal del repartidor

### Gestión de Usuarios
- **UserListAdmin.jsx** - Lista de usuarios
- **CrearUsuario.jsx** - Formulario crear usuario
- **EditarUsuario.jsx** - Formulario editar usuario
- **PerfilAdmin.jsx** - Perfil de administrador
- **PerfilRepartidor.jsx** - Perfil de repartidor

### Gestión de Inventario
- **InventarioList.jsx** - Lista de artículos
- **ItemForm.jsx** - Formulario crear/editar artículo
- **VerArticulo.jsx** - Vista detallada de artículo
- **ItemEstadoModal.jsx** - Modal cambiar estado
- **ItemBorrarModal.jsx** - Modal eliminar artículo
- **ItemInventarioModal.jsx** - Modal actualizar inventario

### Gestión de Pedidos
- **PedidoForm.jsx** - Formulario crear pedido
- **ListaPedidosAdmin.jsx** - Lista pedidos admin
- **ListaPedidosRepartidor.jsx** - Lista pedidos repartidor
- **DetallePedidoModal.jsx** - Modal detalles pedido
- **PedidoCardRepartidor.jsx** - Card pedido repartidor
- **AsignarRepartidorModal.jsx** - Modal asignar repartidor
- **CancelarEnvioModal.jsx** - Modal cancelar envío

### Seguimiento y Mapas
- **MapaSeguimientoPedido.jsx** - Mapa de seguimiento en tiempo real
- **location-tracking/** - Componentes de geolocalización

### Componentes UI
- **SidebarAdmin.jsx** - Barra lateral administrador
- **SidebarRepartidor.jsx** - Barra lateral repartidor
- **InfoRepartidorCliente.jsx** - Información repartidor para cliente

## 🎨 Diseño y Estilos

### TailwindCSS Configuration
```javascript
// tailwind.config.js
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        }
      }
    },
  },
  plugins: [],
}
```

### Componentes Ant Design
- **Tables** - Listas de datos con paginación
- **Modals** - Diálogos y formularios
- **Forms** - Validación y envío de datos
- **Buttons** - Acciones principales
- **Cards** - Contenido organizado
- **Layouts** - Estructura de página

### Responsive Design
- **Mobile-first** approach
- **Breakpoints**: sm (640px), md (768px), lg (1024px), xl (1280px)
- **Grid System** - Tailwind grid utilities
- **Flexbox** - Layouts flexibles

## 🔄 Estado y Ciclo de Vida

### React Hooks Utilizados
- **useState** - Estado local de componentes
- **useEffect** - Efectos secundarios y lifecycle
- **useNavigate** - Navegación programática
- **useContext** - Context API para estado global
- **useRef** - Referencias a elementos DOM
- **useCallback** - Memoización de funciones
- **useMemo** - Memoización de valores

### Gestión de Estado
```javascript
// Estado local típico
const [loading, setLoading] = useState(false);
const [data, setData] = useState([]);
const [modalVisible, setModalVisible] = useState(false);

// Efectos para API calls
useEffect(() => {
  fetchData();
}, []);

// Manejo de eventos
const handleSubmit = async (values) => {
  setLoading(true);
  try {
    await api.post('/endpoint', values);
    message.success('Guardado exitosamente');
    fetchData();
  } catch (error) {
    message.error('Error al guardar');
  } finally {
    setLoading(false);
  }
};
```

## 🌐 Integración con API

### Configuración Axios
```javascript
// utils/api.js
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 10000,
});

// Interceptor para auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
```

### Ejemplos de API Calls
```javascript
// GET request
const fetchUsers = async () => {
  try {
    const response = await api.get('/usuarios');
    setUsers(response.data);
  } catch (error) {
    message.error('Error al cargar usuarios');
  }
};

// POST request
const createUser = async (userData) => {
  try {
    await api.post('/usuarios', userData);
    message.success('Usuario creado');
    fetchUsers();
  } catch (error) {
    message.error('Error al crear usuario');
  }
};

// PUT request
const updateUser = async (id, userData) => {
  try {
    await api.put(`/usuarios/${id}`, userData);
    message.success('Usuario actualizado');
    fetchUsers();
  } catch (error) {
    message.error('Error al actualizar usuario');
  }
};

// DELETE request
const deleteUser = async (id) => {
  try {
    await api.delete(`/usuarios/${id}`);
    message.success('Usuario eliminado');
    fetchUsers();
  } catch (error) {
    message.error('Error al eliminar usuario');
  }
};
```

## 🗺️ Mapas y Geolocalización

### React Leaflet Integration
```javascript
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

const MapaSeguimiento = ({ pedido }) => {
  const position = [pedido.latitud, pedido.longitud];
  
  return (
    <MapContainer 
      center={position} 
      zoom={13} 
      style={{ height: '400px', width: '100%' }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      <Marker position={position}>
        <Popup>
          Ubicación del pedido #{pedido.numero_pedido}
        </Popup>
      </Marker>
    </MapContainer>
  );
};
```

### Geolocalización en Tiempo Real
```javascript
// location-tracking/LocationTracker.jsx
import { useState, useEffect } from 'react';
import socket from '../utils/socket';

const LocationTracker = ({ pedidoId }) => {
  const [location, setLocation] = useState(null);

  useEffect(() => {
    socket.on('location_update', (data) => {
      if (data.pedidoId === pedidoId) {
        setLocation(data.location);
      }
    });

    return () => {
      socket.off('location_update');
    };
  }, [pedidoId]);

  return location ? (
    <div>
      Lat: {location.lat}, Lng: {location.lng}
    </div>
  ) : null;
};
```

## 📊 Gráficos y Visualizaciones

### Recharts Integration
```javascript
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

const EstadisticasChart = ({ data }) => {
  return (
    <BarChart width={600} height={300} data={data}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="name" />
      <YAxis />
      <Tooltip />
      <Legend />
      <Bar dataKey="ventas" fill="#3b82f6" />
      <Bar dataKey="pedidos" fill="#10b981" />
    </BarChart>
  );
};
```

## 🔄 Comunicación en Tiempo Real

### Socket.io Client
```javascript
// utils/socket.js
import { io } from 'socket.io-client';

const socket = io(import.meta.env.VITE_API_URL, {
  autoConnect: false,
});

socket.connect();

export default socket;
```

### Eventos Socket
```javascript
// Escuchar eventos
useEffect(() => {
  socket.on('pedido_actualizado', (pedido) => {
    // Actualizar estado local
    setPedidos(prev => 
      prev.map(p => p.id === pedido.id ? pedido : p)
    );
  });

  socket.on('nuevo_pedido', (pedido) => {
    // Agregar nuevo pedido a la lista
    setPedidos(prev => [pedido, ...prev]);
  });

  return () => {
    socket.off('pedido_actualizado');
    socket.off('nuevo_pedido');
  };
}, []);

// Emitir eventos
const actualizarEstado = (pedidoId, nuevoEstado) => {
  socket.emit('actualizar_pedido', {
    pedidoId,
    estado: nuevoEstado
  });
};
```

## 🛠️ Scripts Disponibles

```bash
# Desarrollo
npm run dev              # Iniciar servidor de desarrollo
npm run build            # Construir para producción
npm run preview          # Previsualizar build
npm run lint             # Ejecutar ESLint
```

## 🐳 Configuración Docker

### Dockerfile
```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host"]
```

### Variables de Entorno Docker
- `VITE_API_URL=http://localhost:3000/api`

### Docker Compose
```yaml
frontend:
  build:
    context: ./frontend
    dockerfile: Dockerfile
  environment:
    VITE_API_URL: http://localhost:3000/api
  ports:
    - "5173:5173"
  depends_on:
    - backend
  volumes:
    - ./frontend:/app
    - /app/node_modules
```

## 🎯 Features Implementadas

### Autenticación
- Login con JWT
- Protección de rutas
- Roles de usuario (Admin/Repartidor)
- Logout automático

### Dashboard Administrador
- Estadísticas en tiempo real
- Gestión de usuarios
- Gestión de inventario
- Gestión de pedidos
- Asignación de repartidores

### Dashboard Repartidor
- Lista de pedidos asignados
- Mapa de seguimiento
- Actualización de estados
- Información de contacto

### Gestión de Inventario
- CRUD completo de artículos
- Upload de imágenes
- Gestión de stock
- Búsqueda y filtrado

### Gestión de Pedidos
- Creación de pedidos
- Seguimiento en tiempo real
- Estados del pedido
- Cancelación de envíos

### Mapas y Geolocalización
- Seguimiento GPS
- Mapas interactivos
- Rutas de entrega
- Ubicación en tiempo real

## 📱 Responsive Design

### Breakpoints
- **Mobile**: < 768px
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px

### Adaptaciones
- **Sidebar** - Colapsable en mobile
- **Tables** - Scroll horizontal en mobile
- **Forms** - Stacked en mobile
- **Maps** - Full width en mobile
- **Cards** - Grid responsive

## 🔧 Optimización y Performance

### Code Splitting
```javascript
// Lazy loading de componentes
const DashboardAdmin = lazy(() => import('./components/DashboardAdmin.jsx'));
const DashboardRepartidor = lazy(() => import('./components/DashboardRepartidor.jsx'));

// Suspense wrapper
<Suspense fallback={<div>Cargando...</div>}>
  <DashboardAdmin />
</Suspense>
```

### Memoización
```javascript
// Memoización de componentes costosos
const ExpensiveComponent = memo(({ data }) => {
  // Componente costoso
});

// Memoización de cálculos
const expensiveValue = useMemo(() => {
  return data.reduce((acc, item) => acc + item.value, 0);
}, [data]);

// Memoización de funciones
const handleClick = useCallback((id) => {
  onItemClick(id);
}, [onItemClick]);
```

### Optimización de Imágenes
```javascript
// Lazy loading de imágenes
const LazyImage = ({ src, alt, ...props }) => {
  const [loaded, setLoaded] = useState(false);

  return (
    <img
      src={loaded ? src : placeholder}
      alt={alt}
      loading="lazy"
      onLoad={() => setLoaded(true)}
      {...props}
    />
  );
};
```



```



## 🚀 Despliegue

### Producción
```bash
# Construir para producción
npm run build

# Servir archivos estáticos
npm install -g serve
serve -s dist -l 3000
```

### Variables de Entorno Producción
```env
VITE_API_URL=https://api.ferreteria-villamil.com/api
```

### Nginx Configuration
```nginx
server {
    listen 80;
    server_name ferreteria-villamil.com;
    root /path/to/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://backend:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```



### Documentación Adicional
- [Documentación Backend](../README_BACKEND.md)
- [Documentación Docker](../README_DOCKER.md)
---


