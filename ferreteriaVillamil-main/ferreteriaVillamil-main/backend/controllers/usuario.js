const { Usuario, Pedido } = require("../models");
const crypt = require("bcrypt");
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const { uploadImage } = require('../middleware/upload');

const createUsuario = async (req, res) => {
  try {
    const { nombre, correo, clave, telefono, rol, foto_perfil } = req.body;

    if (!nombre || !correo || !clave || !telefono || !rol) {
      return res.status(400).json({ message: "Faltan datos obligatorios" });
    }

    if (await Usuario.findOne({ where: { correo } })) {
      return res
        .status(409)
        .json({ message: "El correo ya está registrado" });
    }
    const pw = await crypt.hash(clave, 10);

    const newUsuario = await Usuario.create({
      nombre,
      correo,
      clave: pw,
      telefono,
      rol,
      foto_perfil
    });

    res
      .status(201)
      .json({ message: "Usuario creado exitosamente", usuario: newUsuario });
  } catch (error) {
    res.status(500).json({ error, message: "Error interno creando usuario" });
  }
};

const updateUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, correo, clave, telefono, rol, estado } = req.body;
    const usuario = await Usuario.findByPk(id);
    if (!usuario) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }
    
    // Handle file upload
    if (req.file) {
      req.body.foto_perfil = `/uploads/${req.file.filename}`;
    }
    
    // Handle photo deletion (empty string means delete)
    if (req.body.foto_perfil === '') {
      req.body.foto_perfil = null;
    }
    
    if (clave) {
      usuario.clave = (await crypt.hash(clave, 10)) || usuario.clave;
    }
    usuario.nombre = nombre || usuario.nombre;
    usuario.correo = correo || usuario.correo;
    usuario.telefono = telefono || usuario.telefono;
    usuario.rol = rol || usuario.rol;
    usuario.estado = estado || usuario.estado;
    usuario.foto_perfil = req.body.foto_perfil !== undefined ? req.body.foto_perfil : usuario.foto_perfil;
    await usuario.save();
    res
      .status(200)
      .json({ message: "Usuario actualizado exitosamente", usuario });
  } catch (error) {
    res
      .status(500)
      .json({ error, message: "Error interno actualizando usuario" });
  }
};

const getUsuario = async (req, res) => {
  try {
    const usuarios = await Usuario.findAll();
    res.status(200).json(usuarios);
  } catch (error) {
    res
      .status(500)
      .json({ error, message: "Error interno obteniendo usuarios" });
  }
};

const getUsuarioById = async (req, res) => {
  try {
    const { id } = req.params;
    const usuario = await Usuario.findByPk(id);
    if (!usuario) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }
    res.status(200).json(usuario);
  } catch (error) {
    res
      .status(500)
      .json({ error, message: "Error interno obteniendo usuario" });
  }
};

const softDeleteUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const usuario = await Usuario.findByPk(id);
    if (!usuario) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }
    usuario.estado = "Inactivo";
    await usuario.save();
    res.status(200).json({ message: "Usuario eliminado exitosamente" });
  } catch (error) {
    res
      .status(500)
      .json({ error, message: "Error interno eliminando usuario" });
  }
};

const deleteUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const usuario = await Usuario.findByPk(id);
    if (!usuario) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }
    await usuario.destroy();
    res.status(200).json({ message: "Usuario eliminado exitosamente" });
  } catch (error) {
    res
      .status(500)
      .json({ error, message: "Error interno eliminando usuario" });
  }
};

const loginUsuario = async (req, res) => {
  try {
    const { usuario, contrasena } = req.body;
    
    if (!usuario || !contrasena) {
      return res.status(400).json({ message: "Usuario y contraseña son obligatorios" });
    }

    const usuarioInput = String(usuario).trim();

    const normalize = (value) =>
      String(value || '')
        .trim()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase();

    let user = await Usuario.findOne({
      where: {
        [Op.or]: [{ nombre: usuarioInput }, { correo: usuarioInput }]
      }
    });

    if (!user) {
      const usuariosActivos = await Usuario.findAll({
        where: { estado: 'Activo' }
      });
      const target = normalize(usuarioInput);
      user =
        usuariosActivos.find(
          (u) => normalize(u.nombre) === target || normalize(u.correo) === target
        ) || null;
    }
    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    if (user.estado !== 'Activo') {
      return res.status(403).json({ message: "Usuario inactivo" });
    }

    const contrasenaValida = await crypt.compare(contrasena, user.clave);
    if (!contrasenaValida) {
      return res.status(401).json({ message: "Contraseña incorrecta" });
    }

    const token = jwt.sign(
      { 
        id: user.id_usuario,
        usuario: user.nombre,
        rol: user.rol,
        nombre: user.nombre
      },
      process.env.JWT_SECRET || 'ferreteria_villamil_secret_key_2024',
      { expiresIn: '2h' }
    );

    const usuarioSinClave = {
      id_usuario: user.id_usuario,
      nombre: user.nombre,
      correo: user.correo,
      telefono: user.telefono,
      rol: user.rol,
      estado: user.estado,
      foto_perfil: user.foto_perfil
    };

    res.status(200).json({
      message: "Login exitoso",
      token,
      usuario: usuarioSinClave
    });
  } catch (error) {
    res.status(500).json({ error, message: "Error interno en inicio de sesión" });
  }
};

const inicioSesionUsuario = async (req, res) => {
  try {
    const { correo, clave } = req.params;
    const usuario = await Usuario.findOne({ where: { correo } });
    if (!usuario) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }
    if (usuario.clave !== clave) {
      return res.status(401).json({ message: "Clave incorrecta" });
    }

    res.status(200).json(usuario);
  } catch (error) {
    res
      .status(500)
      .json({ error, message: "Error interno en inicio de sesión" });
  }
};

const getRepartidoresConPedidosActivos = async (req, res) => {
  try {
    const repartidores = await Usuario.findAll({
      where: { 
        rol: 'Repartidor',
        estado: 'Activo'
      }
    });

    const repartidoresConConteo = await Promise.all(
      repartidores.map(async (repartidor) => {
        const pedidosActivos = await Pedido.count({
          where: { 
            id_repartidor_asignado: repartidor.id_usuario,
            estado: ['Asignado', 'En transcurso']
          }
        });
        
        return {
          ...repartidor.toJSON(),
          cantidad_pedidos_activos: pedidosActivos
        };
      })
    );

    res.status(200).json(repartidoresConConteo);
  } catch (error) {
    res
      .status(500)
      .json({ error, message: "Error interno obteniendo repartidores con pedidos activos" });
  }
};

const getRepartidorConPedidos = async (req, res) => {
  try {
    const { id } = req.params;
    const repartidor = await Usuario.findOne({
      where: { 
        id_usuario: id,
        rol: 'Repartidor'
      }
    });

    if (!repartidor) {
      return res.status(404).json({ message: "Repartidor no encontrado" });
    }

    const pedidos = await Pedido.findAll({
      where: { id_repartidor_asignado: id }
    });

    const repartidorConPedidos = {
      ...repartidor.toJSON(),
      pedidos: pedidos
    };

    res.status(200).json(repartidorConPedidos);
  } catch (error) {
    res
      .status(500)
      .json({ error, message: "Error interno obteniendo repartidor con sus pedidos" });
  }
};

module.exports = {
  createUsuario,
  updateUsuario,
  getUsuario,
  getUsuarioById,
  softDeleteUsuario,
  deleteUsuario,
  loginUsuario,
  inicioSesionUsuario,
  getRepartidoresConPedidosActivos,
  getRepartidorConPedidos
};
