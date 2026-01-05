
-- Base de datos Ferretería Villamil - Versión Actualizada
-- Reflejando el estado actual de los modelos Sequelize

-- Tipos ENUM
CREATE TYPE rol_usuario AS ENUM ('Administrador', 'Repartidor');
CREATE TYPE estado_usuario AS ENUM ('Activo', 'Inactivo');
CREATE TYPE estado_articulo AS ENUM ('Disponible', 'No Disponible');
CREATE TYPE estado_pedido AS ENUM ('Pendiente', 'Asignado', 'En transcurso', 'Entregado', 'Cancelado');

-- Tabla Usuario
CREATE TABLE Usuario (
  id_usuario SERIAL PRIMARY KEY,
  nombre VARCHAR,
  correo VARCHAR,
  clave VARCHAR,
  telefono VARCHAR,
  foto_perfil VARCHAR, -- Campo agregado para fotos de perfil
  rol rol_usuario,
  estado estado_usuario,
  fecha_creacion TIMESTAMP DEFAULT NOW()
);

-- Tabla Articulo
CREATE TABLE Articulo (
  id_articulo SERIAL PRIMARY KEY,
  codigo VARCHAR,
  nombre VARCHAR,
  descripcion VARCHAR,
  costo_unitario DECIMAL,
  precio DECIMAL,
  cantidad_existencia INTEGER,
  stock_minimo INTEGER,
  proveedor VARCHAR,
  foto_url VARCHAR, -- Campo agregado para fotos de artículos (permite NULL)
  estado estado_articulo,
  fecha_creacion TIMESTAMP DEFAULT NOW(),
  fecha_actualizacion TIMESTAMP
);

-- Tabla Pedido
CREATE TABLE Pedido (
  id_pedido SERIAL PRIMARY KEY,
  numero_pedido VARCHAR,
  cliente_nombre VARCHAR,
  cliente_telefono VARCHAR,
  cliente_identidad VARCHAR,
  id_repartidor_asignado INT,
  id_admin_creador INT,
  estado estado_pedido,
  codigo_confirmacion VARCHAR,
  costo_envio DECIMAL,
  total DECIMAL,
  direccion_entrega VARCHAR,
  observacion VARCHAR,
  fecha_creacion TIMESTAMP DEFAULT NOW(),
  fecha_asignacion TIMESTAMP,
  fecha_entrega TIMESTAMP,
  fecha_cancelacion TIMESTAMP,
  motivo_cancelacion VARCHAR,
  link_seguimiento VARCHAR,

  CONSTRAINT fk_repartidor FOREIGN KEY (id_repartidor_asignado) REFERENCES Usuario(id_usuario),
  CONSTRAINT fk_admin_creador FOREIGN KEY (id_admin_creador) REFERENCES Usuario(id_usuario)
);

-- Tabla Detalle_Pedido
CREATE TABLE Detalle_Pedido (
  id_detalle SERIAL PRIMARY KEY,
  id_pedido INT,
  id_articulo INT,
  cantidad INT,
  precio_unitario DECIMAL,
  subtotal DECIMAL,

  CONSTRAINT fk_dp_pedido FOREIGN KEY (id_pedido) REFERENCES Pedido(id_pedido),
  CONSTRAINT fk_dp_articulo FOREIGN KEY (id_articulo) REFERENCES Articulo(id_articulo)
);

-- Tabla Calificacion
CREATE TABLE Calificacion (
  id_calificacion SERIAL PRIMARY KEY,
  id_pedido INT UNIQUE,
  puntuacion INT,
  comentario VARCHAR,
  fecha_calificacion TIMESTAMP DEFAULT NOW(),

  CONSTRAINT fk_calif_pedido FOREIGN KEY (id_pedido) REFERENCES Pedido(id_pedido)
);

-- Índices para mejor rendimiento
CREATE INDEX idx_usuario_correo ON Usuario(correo);
CREATE INDEX idx_articulo_codigo ON Articulo(codigo);
CREATE INDEX idx_articulo_estado ON Articulo(estado);
CREATE INDEX idx_pedido_numero ON Pedido(numero_pedido);
CREATE INDEX idx_pedido_estado ON Pedido(estado);
CREATE INDEX idx_pedido_cliente ON Pedido(cliente_identidad);
CREATE INDEX idx_detalle_pedido_id ON Detalle_Pedido(id_pedido);
CREATE INDEX idx_detalle_articulo_id ON Detalle_Pedido(id_articulo);
CREATE INDEX idx_calificacion_pedido ON Calificacion(id_pedido);

-- Datos iniciales (opcional)
-- INSERT INTO Usuario (nombre, correo, clave, telefono, rol, estado) VALUES 
-- ('Admin Principal', 'admin@ferreteria.com', '$2b$10$hashed_password', '99990000', 'Administrador', 'Activo');

-- INSERT INTO Articulo (codigo, nombre, descripcion, costo_unitario, precio, cantidad_existencia, stock_minimo, proveedor, estado) VALUES
-- ('MART001', 'Martillo', 'Martillo de carpintero', 50.00, 75.00, 100, 10, 'Herramientas S.A.', 'Disponible');
