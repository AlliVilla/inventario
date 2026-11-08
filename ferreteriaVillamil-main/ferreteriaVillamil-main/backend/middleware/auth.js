const { Usuario } = require('../models');
const { context } = require('../utils/branch-context');
const { verify } = require('../utils/tokens');

async function activeUser(token) {
  const { id } = verify(token, 'session');
  if (!Number.isSafeInteger(id)) return null;
  return Usuario.findOne({
    where: { id_usuario: id, estado: 'Activo' },
    attributes: ['id_usuario', 'rol', 'id_sucursal']
  });
}

async function authenticate(req, res, next) {
  try {
    const token = /^Bearer (\S+)$/i.exec(req.get('Authorization') || '')?.[1];
    const user = token && await activeUser(token);
    if (user && Number.isSafeInteger(user.id_sucursal)) {
      req.usuario = user;
      return context.run(user.id_sucursal, next);
    }
  } catch (error) {
    if (!['JsonWebTokenError', 'TokenExpiredError', 'NotBeforeError'].includes(error.name)) return next(error);
  }
  return res.status(401).json({ message: 'Sesión inválida' });
}

function admin(req, res, next) {
  if (req.usuario.rol === 'Administrador') return next();
  return res.status(403).json({ message: 'Acceso restringido a administradores' });
}

module.exports = { authenticate, admin, activeUser };
