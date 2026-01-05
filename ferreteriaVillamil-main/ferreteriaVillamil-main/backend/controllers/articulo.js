const {Articulo, Detalle_Pedido, sequelize} = require('../models');
const { Op, Sequelize } = require("sequelize");
const { uploadImage } = require('../middleware/upload');

function checkForNull(data, res){
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
        
        // Handle file upload
        if (request.file) {
            data.foto_url = `/uploads/${request.file.filename}`;
        }
        
        if (!checkForNull(data, response)) return;

        const check = await Articulo.findOne({
            where: { codigo: data.codigo }
        });
        if(!check){
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
        return response.status(500).json({
                status: "Error",
                message: error.message
            });
    }
}

const editArticulo = async (request, response) => {
    try{
        const data = request.body;
        
        console.log('=== BACKEND: Datos recibidos ===');
        console.log('request.body:', data);
        console.log('request.file:', request.file);
        
        // Handle file upload
        if (request.file) {
            data.foto_url = `/uploads/${request.file.filename}`;
            console.log('=== BACKEND: Archivo detectado, foto_url actualizado a:', data.foto_url);
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
            where : { codigo: request.params.codigo }
        });

        if (articulo){
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

    } catch(error) {
        console.log('=== BACKEND: Error en editArticulo ===');
        console.log('Error:', error);
        response.status(500).json({
                status: "Error",
                message: error.message
            });
    }
}

const lowStockItems = async (request, response) => {
    try{
        const items = await Articulo.findAll({
            where: { cantidad_existencia: { 
                [Op.lte]: Sequelize.col('stock_minimo') 
            } }
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
        const items = await Articulo.findAll({
        order: [
            ['id_articulo', 'ASC'] 
        ]});

        return response.status(200).json({
            status: "Success",
            data: items
        });
    } catch (error) {
        return response.status(500).json({
            status:"Error",
            message: error.message
        })
    }
}

const getAllActiveItems = async (request, response) => {
    try {
        const items = await Articulo.findAll({
            where: {estado: "Disponible"}
        });

        return response.status(200).json({
            status: "Success",
            data: items
        });
    } catch (error) {
        return response.status(500).json({
            status:"Error",
            message: error.message
        })
    }
}

const getItemByID = async (request, response) => {
    try {
        const data = request.params.codigo;

        const item = await Articulo.findOne({
            where: { codigo: data}
        });
        
        if(!item){
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
            status:"Error",
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


module.exports = {
    nuevoArticulo,
    editArticulo,
    lowStockItems,
    getAllItems,
    getItemByID,
    deleteItem,
    getAllActiveItems,
    uploadImage
}