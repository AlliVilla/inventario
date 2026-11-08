const { Existencia } = require('../models');
const { context } = require('./branch-context');

function branch() {
  const id = context.getStore();
  if (!id) throw new Error('La operación requiere una sucursal');
  return id;
}

async function stock(id_articulo, transaction, create = false) {
  const id_sucursal = branch();
  const where = { id_articulo, id_sucursal };
  if (create) await Existencia.findOrCreate({ where, transaction });
  return Existencia.findOne({ where, transaction, ...(transaction && { lock: transaction.LOCK.UPDATE }) });
}

async function attachStock(items) {
  if (!items.length) return [];
  const rows = await Existencia.findAll({
    where: { id_sucursal: branch(), id_articulo: items.map(item => item.id_articulo) }
  });
  const byArticle = new Map(rows.map(row => [row.id_articulo, row]));
  return items.map(item => {
    const row = byArticle.get(item.id_articulo);
    return {
      ...(item.toJSON ? item.toJSON() : item),
      cantidad_existencia: row?.cantidad_existencia ?? 0,
      stock_minimo: row?.stock_minimo ?? 0
    };
  });
}

async function updateStock(item, data, transaction) {
  const values = {};
  for (const field of ['cantidad_existencia', 'stock_minimo']) {
    if (data[field] === undefined) continue;
    const value = Number(data[field]);
    if (!Number.isFinite(value) || value < 0 || value >= 100000000) {
      throw new Error('Las existencias y el mínimo deben ser cantidades válidas y no negativas');
    }
    values[field] = value;
  }
  const row = await stock(item.id_articulo, transaction, true);
  await row.update(values, { transaction });
  return { ...item.toJSON(), cantidad_existencia: row.cantidad_existencia, stock_minimo: row.stock_minimo };
}

module.exports = { stock, attachStock, updateStock };
