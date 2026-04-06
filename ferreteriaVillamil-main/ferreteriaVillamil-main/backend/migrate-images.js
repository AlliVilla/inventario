const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const { Sequelize, DataTypes } = require('sequelize');
require('dotenv').config();

// 1. Configurar Conexiones
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
const sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    dialectOptions: { ssl: { require: true, rejectUnauthorized: false } }
});

// 2. Definir Modelo Mínimo
const Articulo = sequelize.define('Articulo', {
    id_articulo: { type: DataTypes.INTEGER, primaryKey: true },
    foto_url: DataTypes.STRING
}, { tableName: 'Articulo', timestamps: false });

const BUCKET_NAME = 'articulos';
const UPLOADS_DIR = path.resolve(__dirname, 'uploads');

async function migrateImages() {
    try {
        console.log('🚀 Iniciando migración de imágenes...');
        console.log('📂 Carpeta local de fotos:', UPLOADS_DIR);
        
        const articulos = await Articulo.findAll();
        console.log(`📦 Total artículos en BD: ${articulos.length}`);

        let successCount = 0;
        let skippedCount = 0;
        let errorCount = 0;

        for (const articulo of articulos) {
            let currentUrl = articulo.foto_url;
            if (!currentUrl) {
                skippedCount++;
                continue;
            }

            // Normalizar barras para Windows/Linux
            const normalizedUrl = currentUrl.replace(/\\/g, '/');

            if (normalizedUrl.startsWith('/uploads/')) {
                const fileName = normalizedUrl.replace('/uploads/', '');
                const filePath = path.join(UPLOADS_DIR, fileName);

                if (fs.existsSync(filePath)) {
                    // console.log(`📤 Subiendo: ${fileName}...`);
                    
                    const fileBuffer = fs.readFileSync(filePath);
                    const fileExt = path.extname(fileName).toLowerCase().replace('.', '');
                    let mimeType = 'image/jpeg';
                    if (fileExt === 'png') mimeType = 'image/png';
                    if (fileExt === 'gif') mimeType = 'image/gif';
                    if (fileExt === 'webp') mimeType = 'image/webp';

                    const { error } = await supabase.storage
                        .from(BUCKET_NAME)
                        .upload(fileName, fileBuffer, {
                            contentType: mimeType,
                            upsert: true
                        });

                    if (error) {
                        console.error(`❌ Error en ID ${articulo.id_articulo} (${fileName}):`, error.message);
                        errorCount++;
                        continue;
                    }

                    const { data: publicUrlData } = supabase.storage
                        .from(BUCKET_NAME)
                        .getPublicUrl(fileName);

                    await articulo.update({ foto_url: publicUrlData.publicUrl });
                    successCount++;
                    
                    if (successCount % 50 === 0) {
                        console.log(`✅ Progress: ${successCount} subidas...`);
                    }
                } else {
                    if (errorCount < 10) {
                        console.warn(`⚠️ Archivo no encontrado: ${fileName} (Buscado en: ${filePath})`);
                    }
                    errorCount++;
                }
            } else {
                skippedCount++;
            }
        }

        console.log('\n--- 🏁 Resumen Final ---');
        console.log(`✅ Exitosos (Nuevos/Actualizados): ${successCount}`);
        console.log(`⚠️ Ya en la nube o sin foto: ${skippedCount}`);
        console.log(`❌ Archivos no encontrados o error: ${errorCount}`);
        console.log('-------------------------------');

    } catch (err) {
        console.error('💥 Error crítico:', err);
    } finally {
        await sequelize.close();
    }
}

migrateImages();
