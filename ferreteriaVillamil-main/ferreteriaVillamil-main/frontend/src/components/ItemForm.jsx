import React, { useState, useEffect, useRef } from "react";
import { Avatar, message } from "antd";
import { PictureOutlined } from "@ant-design/icons";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";

function NuevoArticuloForm() {
  const [form, setForm] = useState({
    codigo: "",
    nombre: "",
    descripcion: "",
    costo_unitario: "",
    precio: "",
    cantidad_existencia: "",
    stock_minimo: "",
    proveedor: "",
    estado: "Disponible",
    foto_url: null,
  });
  const [loading, setLoading] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [originalPhotoUrl, setOriginalPhotoUrl] = useState(null); // Guardar la URL original
  const fileInputRef = useRef(null);
  const navigate = useNavigate();
  const {codigo} = useParams();
  const isEditMode = Boolean(codigo);

  useEffect(() => {
    if (codigo) {
      axios.get(`${import.meta.env.VITE_API_URL}/articulos/code/${codigo}`).then(res => {
        const data = res.data.data;
        setForm(data);
        if (data.foto_url) {
          // Remove leading / if present and construct proper URL
          const photoPath = data.foto_url.startsWith('/') ? data.foto_url.slice(1) : data.foto_url;
          const baseUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3000';
          const fullUrl = `${baseUrl}/${photoPath}`;
          setPreviewImage(fullUrl);
          setOriginalPhotoUrl(fullUrl); // Guardar URL original
        } else {
          setPreviewImage(null);
          setOriginalPhotoUrl(null);
        }
      });
    }
  }, [codigo]);

  const handleChange = (event) => {
    setForm({ ...form, [event.target.name]: event.target.value });
  };

  const handleInteger = (event) => {
    const value = event.target.value.replace(/\D/g, "");
    handleChange({
      target: { name: event.target.name, value },
    });
  };

  const handleImageChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreviewImage(reader.result);
        };
        reader.readAsDataURL(file);
        setForm({ ...form, foto_url: file });
      } else {
        message.error('Por favor selecciona un archivo de imagen válido');
      }
    }
  };

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = async () => {
    setLoading(true);

    try {
      if (isEditMode) {
        const formData = new FormData();
        Object.keys(form).forEach(key => {
          // No enviar campos que no se deben actualizar
          if (key === 'foto_url' && form[key] instanceof File) {
            formData.append('foto_url', form[key]);
          } else if (key === 'foto_url' && form[key] === null && previewImage === null && originalPhotoUrl !== null) {
            // Si se eliminó la foto, enviar vacío para eliminar
            formData.append('foto_url', '');
          } else if (key !== 'foto_url' && key !== 'fecha_actualizacion' && key !== 'fecha_creacion' && key !== 'id_articulo') {
            formData.append(key, form[key]);
          }
        });

        await axios.put(
          `${import.meta.env.VITE_API_URL || "http://localhost:3000/api"}/articulos/edit/${codigo}`,
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          }
        );

        message.success("Artículo actualizado correctamente");
      } else {
        const nombreSinEspacios = form.nombre.replace(/\s/g, '');
        const codigoProvisional = nombreSinEspacios.substring(0, 4).toUpperCase();

        const formData = new FormData();
        Object.keys(form).forEach(key => {
          if (key === 'foto_url' && form[key] instanceof File) {
            formData.append('foto_url', form[key]);
          } else if (key !== 'codigo') {
            formData.append(key, form[key]);
          }
        });
        formData.append('codigo', codigoProvisional);

        console.log(formData);

        const response = await axios.post(
          `${
            import.meta.env.VITE_API_URL || "http://localhost:3000/api"
          }/articulos/new`,
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          }
        );
        console.log(response.data.data)
        const idGenerado = response.data.data.id_articulo;
        const idFormateado = String(idGenerado).padStart(3, "0");
        const codigoFinal = `${codigoProvisional}${idFormateado}`;
        console.log(idGenerado, idFormateado, codigoFinal);

        await axios.put(
          `${
            import.meta.env.VITE_API_URL || "http://localhost:3000/api"
          }/articulos/edit/${response.data.data.codigo}`,
          { codigo: codigoFinal }
        );

        message.success("Artículo creado exitosamente");
      }
      setForm({
          codigo: "",
          nombre: "",
          descripcion: "",
          costo_unitario: "",
          precio: "",
          cantidad_existencia: "",
          stock_minimo: "",
          proveedor: "",
          foto_url: null,
        });
      setPreviewImage(null);
      setLoading(false);
      navigate("/admin/inventario");
    } catch (err) {
      console.log(err)
      message.error("Error al crear artículo. Llene todos los campos");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelar = () => {
    navigate("/admin/inventario");
  };

  return (
    <div className="w-full">
      <div className="max-w-7xl mx-auto">
        {/* Header (page) */}
        <div className="flex items-center justify-between mb-5">
          <h1 
            className="text-3xl font-bold pb-4 border-b-4 flex-1"
            style={{ color: "#163269", borderColor: "#163269" }}
          >
          {isEditMode ? "Editar Artículo" : "Nuevo Artículo"}
          </h1>
        </div>

        {/* Código + Nombre */}
        <div className="flex gap-5 mb-4">
          <div className="flex-1">
            <label
              className="block font-semibold mb-2"
              style={{ color: "#163269" }}
            >
              Nombre:
            </label>
            <input
              name="nombre"
              type="text"
              value={form.nombre}
              onChange={handleChange}
              placeholder="Ingresa el nombre"
              className="w-full px-4 py-3 bg-gray-200 border border-gray-300 rounded-lg focus:outline-none focus:bg-white transition-colors"
              style={{ focusBorderColor: "#163269" }}
              required
              onInvalid={(e) =>
                e.target.setCustomValidity("Por favor ingresa el nombre")
              }
              onInput={(e) => e.target.setCustomValidity("")}
            />
          </div>
        </div>

        {/* Descripción */}
        <div className="mb-4">
          <label
            className="block font-semibold mb-2"
            style={{ color: "#163269" }}
          >
            Descripción:
          </label>
          <textarea
            name="descripcion"
            value={form.descripcion}
            onChange={handleChange}
            placeholder="Ingresa una descripción"
            className="w-full px-4 py-3 bg-gray-200 border border-gray-300 rounded-lg focus:outline-none focus:bg-white transition-colors"
            style={{ focusBorderColor: "#163269" }}
            rows={3}
            onInvalid={(e) =>
              e.target.setCustomValidity("Por favor ingresa el nombre")
            }
            onInput={(e) => e.target.setCustomValidity("")}
          ></textarea>
        </div>

        {/* Costo Compra + Costo Venta */}
        <div className="flex gap-5 mb-4">
          <div className="flex-1">
            <label
              className="block font-semibold mb-2"
              style={{ color: "#163269" }}
            >
              Costo Compra (L.):
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 pointer-events-none">
                L.
              </span>
              <input
                name="costo_unitario"
                type="number"
                value={form.costo_unitario}
                onChange={handleChange}
                placeholder="Precio de venta"
                className="w-full pl-10 pr-4 py-3 bg-gray-200 border border-gray-300 rounded-lg focus:outline-none focus:bg-white transition-colors"
                required
              />
            </div>
          </div>
          <div className="flex-1">
            <label
              className="block font-semibold mb-2"
              style={{ color: "#163269" }}
            >
              Costo Venta:
            </label>

            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 pointer-events-none">
                L.
              </span>
              <input
                name="precio"
                type="number"
                value={form.precio}
                onChange={handleChange}
                placeholder="Ingresa el precio de venta en Lempiras"
                className="w-full pl-10 pr-4 py-3 bg-gray-200 border border-gray-300 rounded-lg focus:outline-none focus:bg-white transition-colors"
                style={{ focusBorderColor: "#163269" }}
                required
                onInvalid={(e) =>
                  e.target.setCustomValidity("Por favor ingresa el nombre")
                }
                onInput={(e) => e.target.setCustomValidity("")}
              />
            </div>
          </div>
        </div>

        {/* Inventarios */}
        <div className="flex gap-5 mb-4">
          <div className="flex-1">
            <label
              className="block font-semibold mb-2"
              style={{ color: "#163269" }}
            >
              Inventario Inicial:
            </label>
            <input
              name="cantidad_existencia"
              type="number"
              value={form.cantidad_existencia}
              onChange={handleInteger}
              placeholder="Ingresa la cantidad de producto en unidades en existencia"
              className="w-full px-4 py-3 bg-gray-200 border border-gray-300 rounded-lg focus:outline-none focus:bg-white transition-colors"
              style={{ focusBorderColor: "#163269" }}
              required
              onInvalid={(e) =>
                e.target.setCustomValidity("Por favor ingresa el nombre")
              }
              onInput={(e) => e.target.setCustomValidity("")}
            />
          </div>
          <div className="flex-1">
            <label
              className="block font-semibold mb-2"
              style={{ color: "#163269" }}
            >
              Inventario mínimo:
            </label>
            <input
              name="stock_minimo"
              type="number"
              value={form.stock_minimo}
              onChange={handleInteger}
              placeholder="Ingresa la cantidad mínima del producto antes de rellenar"
              className="w-full px-4 py-3 bg-gray-200 border border-gray-300 rounded-lg focus:outline-none focus:bg-white transition-colors"
              style={{ focusBorderColor: "#163269" }}
              required
              onInvalid={(e) =>
                e.target.setCustomValidity("Por favor ingresa el nombre")
              }
              onInput={(e) => e.target.setCustomValidity("")}
            />
          </div>
        </div>

        {/* Proveedor + Foto */}
        <div className="flex gap-5 mb-4">
          <div className="flex-1">
            <label
              className="block font-semibold mb-2"
              style={{ color: "#163269" }}
            >
              Proveedor:
            </label>
            <input
              name="proveedor"
              type="text"
              value={form.proveedor}
              onChange={handleChange}
              placeholder="Ingrese el proveedor"
              className="w-full px-4 py-3 bg-gray-200 border border-gray-300 rounded-lg focus:outline-none focus:bg-white transition-colors"
              style={{ focusBorderColor: "#163269" }}
              required
              onInvalid={(e) =>
                e.target.setCustomValidity("Por favor ingresa el nombre")
              }
              onInput={(e) => e.target.setCustomValidity("")}
            />
          </div>
          <div className="flex-1">
            <label
              className="block font-semibold mb-2"
              style={{ color: "#163269" }}
            >
              Foto del Artículo:
            </label>
            <div className="flex items-center gap-4">
              <div 
                onClick={handleImageClick}
                className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-[#163269] transition-colors bg-gray-50"
              >
                {previewImage ? (
                  <img 
                    src={previewImage} 
                    alt="Preview" 
                    className="w-full h-full object-cover rounded-lg"
                  />
                ) : (
                  <div className="text-center">
                    <PictureOutlined className="text-4xl text-gray-400 mb-2" />
                    <div className="text-sm text-gray-500">Click para subir foto</div>
                  </div>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
              {(previewImage || (isEditMode && originalPhotoUrl)) && (
                <button
                  type="button"
                  onClick={() => {
                    setPreviewImage(null);
                    setForm({ ...form, foto_url: null });
                    if (fileInputRef.current) {
                      fileInputRef.current.value = '';
                    }
                  }}
                  className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                >
                  Eliminar Foto
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Costo Utilitario */}
        <div className="mb-4">
          <label
            className="block font-semibold mb-2"
            style={{ color: "#163269" }}
          >
            Costo Utilitario:
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 pointer-events-none">
              L.
            </span>
            <input
              name="costo_utilitario"
              type="number"
              value={form.precio - form.costo_unitario}
              onChange={handleInteger}
              placeholder="Ganancia o perdida de venta"
              className="w-full pl-10 pr-4 py-3 bg-gray-200 border border-gray-300 rounded-lg focus:outline-none focus:bg-white transition-colors"
              style={{ focusBorderColor: "#163269" }}
              disabled
              onInvalid={(e) =>
                e.target.setCustomValidity("Por favor ingresa el nombre")
              }
              onInput={(e) => e.target.setCustomValidity("")}
            />
          </div>
        </div>

        {/* Botones */}
        <div className="flex justify-center gap-4 mt-6">
          <button
            className="font-medium py-3 px-4 bg-gray-200 border border-gray-500 rounded-lg transition-colors disabled:cursor-not-allowed"
            onClick={handleCancelar}
            disabled={loading}
            style={{
              color: "gray-500",
            }}
          >
            Cancelar
          </button>
          <button
            className="font-medium py-3 px-4 rounded-lg transition-colors disabled:cursor-not-allowed"
            onClick={handleSubmit}
            disabled={loading}
            style={{
              backgroundColor: "#163269",
              color: "white",
            }}
          >
            {loading ? "Guardando..." : isEditMode ? "Actualizar" : "Crear"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default NuevoArticuloForm;
