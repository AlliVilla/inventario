const assert = require('node:assert/strict');
const { test } = require('node:test');
const { context } = require('./utils/branch-context');
const { sequelize, Pedido, Venta, Usuario, Existencia } = require('./models');
const { attachStock } = require('./utils/inventory');

test('parallel requests scope queries to their own branches', async t => {
  const queries = [];
  t.mock.method(sequelize, 'query', async (sql, options) => {
    queries.push(sql);
    return options.type === 'SELECT' ? [] : 1;
  });

  await Promise.all([
    context.run(2, () => Pedido.findByPk(7)),
    context.run(3, () => Venta.findAll({ where: { id_sucursal: 1 } }))
  ]);
  assert(queries.some(sql => sql.includes('"Pedido"."id_sucursal" = 2')));
  assert(queries.some(sql => sql.includes('"Venta"."id_sucursal" = 3')));

  await context.run(3, () => Pedido.update({ estado: 'Asignado' }, { where: { id_pedido: 5 } }));
  assert.match(queries.at(-1).query, /WHERE .*"id_sucursal" =/);
  assert.equal(queries.at(-1).bind.at(-1), 3);
});

test('creation uses the authenticated branch and existing records cannot change branch', async () => {
  const created = await context.run(2, () => Usuario.build({ id_sucursal: 1 }).validate());
  assert.equal(created.id_sucursal, 2);

  const existing = Usuario.build({ id_sucursal: 2 }, { isNewRecord: false, raw: true });
  existing.id_sucursal = 3;
  await assert.rejects(context.run(2, () => existing.validate()), /sucursal/);
});

test('shared articles show branch stock and missing stock displays zero', async t => {
  t.mock.method(Existencia, 'findAll', async ({ where }) => [{
    id_articulo: 4,
    cantidad_existencia: where.id_sucursal === 2 ? '7' : '1'
  }]);

  const catalog = [{ id_articulo: 4 }, { id_articulo: 5 }];
  const [branch2, branch3] = await Promise.all([2, 3].map(id =>
    context.run(id, () => attachStock(catalog))
  ));
  assert.deepEqual(branch2.map(row => row.cantidad_existencia), ['7', 0]);
  assert.deepEqual(branch3.map(row => row.cantidad_existencia), ['1', 0]);
});
