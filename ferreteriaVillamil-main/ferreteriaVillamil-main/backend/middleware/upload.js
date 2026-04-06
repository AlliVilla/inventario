const multer = require('multer');
const path = require('path');
const supabase = require('../utils/supabase');

// Usar memoria en lugar de disco para que Render no borre los archivos
const storage = multer.memoryStorage();

// Filtro de archivos solo para imágenes
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Solo se permiten archivos de imagen'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // Limite de 5MB
  }
});

/**
 * Middleware para subir imágenes a Supabase Storage
 */
const uploadImage = (fieldName) => {
  return (req, res, next) => {
    const singleUpload = upload.single(fieldName);
    
    singleUpload(req, res, async (err) => {
      if (err) {
        if (err instanceof multer.MulterError) {
          if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
              status: 'error',
              message: 'El archivo es demasiado grande. Máximo 5MB'
            });
          }
        } else {
          return res.status(400).json({
            status: 'error',
            message: err.message
          });
        }
      }
      
      // Si no se subió ningún archivo, continuar sin error
      if (!req.file) {
        return next();
      }

      try {
        // Generar un nombre único para el archivo
        const fileExt = path.extname(req.file.originalname);
        const fileName = `${Date.now()}-${Math.floor(Math.random() * 1000)}${fileExt}`;
        const filePath = `${fileName}`;

        // Subir a Supabase Storage (Bucket: articulos)
        const { data, error } = await supabase.storage
          .from('articulos')
          .upload(filePath, req.file.buffer, {
            contentType: req.file.mimetype,
            upsert: false
          });

        if (error) {
          throw error;
        }

        // Obtener la URL pública del archivo
        const { data: publicUrlData } = supabase.storage
          .from('articulos')
          .getPublicUrl(filePath);

        // Guardamos la URL pública en el body para que el controlador la guarde en la BD
        req.body[fieldName] = publicUrlData.publicUrl;
        
        next();
      } catch (error) {
        console.error('Error subiendo a Supabase:', error);
        return res.status(500).json({
          status: 'error',
          message: 'Error al subir la imagen a la nube',
          details: error.message
        });
      }
    });
  };
};

module.exports = {
  uploadImage
};
