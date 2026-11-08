const { readFileSync } = require('node:fs');
const bcrypt = require('bcrypt');
const { Usuario, Sucursal, sequelize } = require('./models');

async function createAdmin() {
  const { nombre, correo, telefono, clave, sucursal = "Principal" } = JSON.parse(readFileSync(0, 'utf8'));
  if (![nombre, correo, telefono, clave, sucursal].every(value => typeof value === 'string' && value.trim()) ||
      clave.length < 16 || Buffer.byteLength(clave) > 72) {
    throw new Error('Completa nombre, correo y teléfono. Usa una contraseña de 16 caracteres o más y hasta 72 bytes.');
  }

  const hash = await bcrypt.hash(clave, 12);
  const { user, branch } = await sequelize.transaction(async transaction => {
    const [branch] = await Sucursal.findOrCreate({
      where: { nombre: sucursal.trim() },
      transaction
    });
    const [user, created] = await Usuario.findOrCreate({
      where: { correo: correo.trim().toLowerCase() },
      defaults: {
        nombre: nombre.trim(),
        telefono: telefono.trim(),
        clave: hash,
        rol: 'Administrador',
        estado: 'Activo',
        id_sucursal: branch.id_sucursal
      },
      transaction
    });
    if (!created) throw new Error('Ya existe una cuenta con ese correo.');
    return { user, branch };
  });
  console.log('Administrador creado con ID ' + user.id_usuario + ' en ' + branch.nombre);

}

createAdmin()
  .catch(error => {
    console.error(error.name === 'SequelizeDatabaseError' ? 'Error al crear la cuenta en PostgreSQL' : error.message);
    process.exitCode = 1;
  })
  .finally(() => sequelize.close());
