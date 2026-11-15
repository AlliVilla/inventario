const { AsyncLocalStorage } = require('node:async_hooks');

const context = new AsyncLocalStorage();
const scopedModels = new Set(['Usuario', 'Pedido', 'Detalle_Pedido', 'Calificacion',
  'Venta', 'Detalle_Venta', 'Cotizacion', 'Detalle_Cotizacion', 'Existencia']);

function installScope(model) {
  if (!scopedModels.has(model.name)) return;

  function scope(options) {
    const id = context.getStore();
    if (id) options.where = { ...options.where, id_sucursal: id };
  }

  model.addHook('beforeFind', scope);
  model.addHook('beforeCount', scope);
  model.addHook('beforeBulkDestroy', scope);
  model.addHook('beforeBulkUpdate', options => {
    scope(options);
    if (model.name !== 'Usuario' && options.attributes) {
      delete options.attributes.id_sucursal;
    }
  });
  model.addHook('beforeValidate', (record, options) => {
    const id = context.getStore();
    if (!id) return;
    if (record.isNewRecord) {
      if (!record.id_sucursal) {
        record.id_sucursal = id;
      }
      if (options.fields && !options.fields.includes('id_sucursal')) options.fields.push('id_sucursal');
    } else if (record.changed('id_sucursal')) {
      if (model.name !== 'Usuario') {
        throw new Error('No se puede cambiar la sucursal del registro');
      }
    }
  });
  model.addHook('beforeBulkCreate', records => {
    const id = context.getStore();
    if (id) for (const record of records) record.id_sucursal = id;
  });
}

module.exports = { context, installScope };
