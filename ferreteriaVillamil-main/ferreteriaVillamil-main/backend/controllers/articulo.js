const { Articulo, Detalle_Pedido, sequelize } = require('../models');
const { Op, Sequelize } = require("sequelize");
const { uploadImage } = require('../middleware/upload');

function checkForNull(data, res) {
    if (!data || Object.keys(data).length === 0) {
        res.status(400).json({
            status: "Error",
            message: "Request body cannot be empty"
        });
        return false;
    };
    if (!data.codigo) {
        res.status(422).json({
            status: "Error",
            message: "Field 'codigo' is required"
        });
        return false;
    }
    return true;
}

const nuevoArticulo = async (request, response) => {
    try {
        const data = request.body;

        // File upload handles by middleware setting data.foto_url
        if (request.file) {
            // data.foto_url is already set by middleware
        }

        if (!checkForNull(data, response)) return;

        const check = await Articulo.findOne({
            where: { codigo: data.codigo }
        });
        if (!check) {
            const newArticulo = await Articulo.create(data);
            return response.status(201).json({
                status: "Success",
                message: "Creado articulo con éxito",
                data: newArticulo
            });
        } else {
            return response.status(409).json({
                status: "Non-unique Code",
                message: "Unique code already exists, please try another code"
            });
        }
    } catch (error) {
        console.error("DEBUG ERROR NUEVOARTICULO:", error);
        return response.status(500).json({
            status: "Error",
            message: error.message
        });
    }
}

const editArticulo = async (request, response) => {
    try {
        const data = request.body;

        console.log('=== BACKEND: Datos recibidos ===');
        console.log('request.body:', data);
        console.log('request.file:', request.file);

        // File upload handled by middleware
        if (request.file) {
            console.log('=== BACKEND: Archivo detectado, foto_url ya viene de Supabase');
        }

        // Handle photo deletion (empty string means delete)
        if (data.foto_url === '') {
            data.foto_url = null;
            console.log('=== BACKEND: Foto eliminada, foto_url establecido a null');
        }

        console.log('=== BACKEND: Datos finales para actualizar ===');
        console.log('data final:', data);

        if (!data || Object.keys(data).length === 0) {
            response.status(400).json({
                status: "Error",
                message: "Request body cannot be empty"
            });
            return false;
        };

        const articulo = await Articulo.findOne({
            where: { codigo: request.params.codigo }
        });

        if (articulo) {
            await articulo.update(data)
            return response.status(200).json({
                status: "Success",
                message: "Item updated successfully",
                data: articulo
            });
        } else {
            return response.status(404).json({
                status: "Not Found",
                message: "Requested code does not exist"
            });
        };

    } catch (error) {
        console.log('=== BACKEND: Error en editArticulo ===');
        console.log('Error:', error);
        response.status(500).json({
            status: "Error",
            message: error.message
        });
    }
}

const lowStockItems = async (request, response) => {
    try {
        const items = await Articulo.findAll({
            where: {
                cantidad_existencia: {
                    [Op.lte]: Sequelize.col('stock_minimo')
                }
            }
        })

        return response.status(200).json({
            status: "Success",
            data: items
        });

    } catch (error) {
        response.status(500).json({
            status: "Error",
            message: error.message
        });
    }
}

const getAllItems = async (request, response) => {
    try {
        const { search, limit = 200 } = request.query;

        const where = {};

        // Add search filter if provided
        if (search && search.trim()) {
            const searchTerm = search.trim().toLowerCase();
            where[Op.or] = [
                sequelize.where(
                    sequelize.fn('LOWER', sequelize.col('nombre')),
                    { [Op.like]: `%${searchTerm}%` }
                ),
                sequelize.where(
                    sequelize.fn('LOWER', sequelize.col('codigo')),
                    { [Op.like]: `%${searchTerm}%` }
                )
            ];
        }

        const items = await Articulo.findAll({
            where,
            limit: parseInt(limit),
            order: [['id_articulo', 'ASC']],
            attributes: ['id_articulo', 'codigo', 'nombre', 'descripcion', 'precio', 'costo_unitario', 'cantidad_existencia', 'foto_url', 'estado']
        });

        return response.status(200).json({
            status: "Success",
            data: items,
            count: items.length
        });
    } catch (error) {
        console.error("Error in getAllItems:", error);
        return response.status(500).json({
            status: "Error",
            message: error.message
        })
    }
}

const getAllActiveItems = async (request, response) => {
    try {
        const { search, limit = 200 } = request.query;
        const lim = Math.min(parseInt(limit, 10) || 200, 1000); 

        let where = { estado: 'Disponible' };
        
        if (search && search.trim()) {
            const searchTerm = search.trim(); // No need for toLowerCase() with iLike
            where = {
                [Op.and]: [
                    { estado: 'Disponible' },
                    {
                        [Op.or]: [
                            { nombre: { [Op.iLike]: `%${searchTerm}%` } },
                            { codigo: { [Op.iLike]: `%${searchTerm}%` } }
                        ]
                    }
                ]
            };
        }

        const items = await Articulo.findAll({
            where,
            limit: lim,
            order: [['nombre', 'ASC']],
            attributes: ['id_articulo', 'codigo', 'nombre', 'precio', 'cantidad_existencia', 'foto_url', 'estado'],
            raw: true
        });

        return response.status(200).json({
            status: "Success",
            data: items,
            count: items.length
        });
    } catch (error) {
        console.error("DEBUG: Error details in getAllActiveItems:");
        console.error("- Message:", error.message);
        console.error("- Stack:", error.stack);
        if (error.sql) console.error("- SQL:", error.sql);

        return response.status(500).json({
            status: "Error",
            message: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
            sql: process.env.NODE_ENV === 'development' ? error.sql : undefined
        })
    }
}

const getItemByID = async (request, response) => {
    try {
        const data = request.params.codigo;

        const item = await Articulo.findOne({
            where: { codigo: data }
        });

        if (!item) {
            return response.status(404).json({
                status: "Not Found",
                message: "Requested code does not exist"
            });
        }
        return response.status(200).json({
            status: "Success",
            data: item
        });

    } catch (error) {
        return response.status(500).json({
            status: "Error",
            message: error.message
        })
    }
}

const deleteItem = async (request, response) => {
    const transaction = await sequelize.transaction();

    try {
        const { codigo } = request.params;

        const item = await Articulo.findOne({
            where: { codigo },
            transaction
        });

        if (!item) {
            await transaction.rollback();
            return response.status(404).json({
                status: "Not Found",
                message: "Requested code does not exist"
            });
        }

        await Detalle_Pedido.destroy({
            where: { id_articulo: item.id_articulo },
            transaction
        });


        await item.destroy({ transaction });

        // 3️⃣ confirmar
        await transaction.commit();

        return response.status(200).json({
            status: "Success",
            message: "Item and related details deleted successfully"
        });

    } catch (error) {
        await transaction.rollback();
        return response.status(500).json({
            status: "Error",
            message: error.message
        });
    }
};

const getInventoryStats = async (request, response) => {
    try {
        const result = await Articulo.findAll({
            attributes: [
                [sequelize.fn('SUM', sequelize.literal('cantidad_existencia * costo_unitario')), 'valorTotal'],
                [sequelize.fn('SUM', sequelize.col('cantidad_existencia')), 'unidadesTotales'],
                [sequelize.fn('COUNT', sequelize.col('id_articulo')), 'totalProductos']
            ],
            raw: true
        });

        const stats = result[0] || {};

        return response.status(200).json({
            status: "Success",
            data: {
                valorInventario: parseFloat(stats.valorTotal) || 0,
                unidadesTotales: parseInt(stats.unidadesTotales) || 0,
                totalProductos: parseInt(stats.totalProductos) || 0
            }
        });
    } catch (error) {
        console.error("Error in getInventoryStats:", error);
        return response.status(500).json({
            status: "Error",
            message: error.message
        })
    }
}

module.exports = {
    nuevoArticulo,
    editArticulo,
    lowStockItems,
    getAllItems,
    getItemByID,
    deleteItem,
    getAllActiveItems,
    getInventoryStats,
    uploadImage
}