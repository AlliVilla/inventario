import React, { useState, useEffect } from "react";
import { message, Modal, Input, Button, Card, Tag, Tooltip } from "antd";
import {
  ShopOutlined,
  PlusOutlined,
  CheckCircleOutlined,
  UserOutlined,
  InfoCircleOutlined,
  ReloadOutlined
} from "@ant-design/icons";
import { FaStore, FaBuilding, FaUsers, FaBoxes } from "react-icons/fa";
import axios from "axios";

export default function Sucursales() {
  const [sucursales, setSucursales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [nuevoNombre, setNuevoNombre] = useState("");
  const [creating, setCreating] = useState(false);

  const usuarioSesion = (() => {
    try {
      return JSON.parse(localStorage.getItem("usuario")) || {};
    } catch {
      return {};
    }
  })();

  const fetchSucursales = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL || "http://localhost:3000/api"}/sucursales`
      );
      if (response.data?.data) {
        setSucursales(response.data.data);
      }
    } catch (err) {
      console.error("Error al cargar sucursales:", err);
      message.error(err.response?.data?.message || "Error al cargar sucursales");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSucursales();
  }, []);

  const handleCrearSucursal = async (e) => {
    e.preventDefault();
    if (!nuevoNombre.trim()) {
      message.warning("Ingresa el nombre de la sucursal");
      return;
    }

    setCreating(true);
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL || "http://localhost:3000/api"}/sucursales`,
        { nombre: nuevoNombre.trim() }
      );
      message.success(response.data?.message || "Sucursal creada con éxito");
      setNuevoNombre("");
      setModalVisible(false);
      fetchSucursales();
    } catch (err) {
      console.error("Error creando sucursal:", err);
      message.error(err.response?.data?.message || "Error al crear sucursal");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-gray-200">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#163269] flex items-center gap-3">
            <FaStore className="text-[#BC7D3B]" /> Gestión de Sucursales
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Administra las distintas sedes de Ferretería Villamil y revisa la sucursal activa de tu sesión.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            icon={<ReloadOutlined />}
            onClick={fetchSucursales}
            loading={loading}
            className="flex items-center"
          >
            Actualizar
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setModalVisible(true)}
            className="bg-[#163269] hover:bg-[#122854] flex items-center shadow-md font-semibold h-10 px-5"
          >
            Nueva Sucursal
          </Button>
        </div>
      </div>

      {/* Tarjetas de Resumen */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-[#163269] rounded-lg text-2xl">
            <FaBuilding />
          </div>
          <div>
            <p className="text-gray-500 text-xs uppercase font-semibold">Total de Sedes</p>
            <p className="text-2xl font-bold text-[#163269]">{sucursales.length}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-[#BC7D3B] rounded-lg text-2xl">
            <FaStore />
          </div>
          <div>
            <p className="text-gray-500 text-xs uppercase font-semibold">Tu Sede Actual</p>
            <p className="text-xl font-bold text-[#BC7D3B]">
              {usuarioSesion?.sucursal || "Principal"}
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg text-2xl">
            <FaUsers />
          </div>
          <div>
            <p className="text-gray-500 text-xs uppercase font-semibold">Usuarios en tu Sede</p>
            <p className="text-2xl font-bold text-gray-800">
              {sucursales.find((s) => s.esActual)?.totalUsuarios || 0}
            </p>
          </div>
        </div>
      </div>

      {/* Banner explicativo del catálogo compartido */}
      <div className="bg-blue-50 border-l-4 border-[#163269] p-4 rounded-r-lg flex items-start gap-3">
        <InfoCircleOutlined className="text-[#163269] text-xl mt-0.5 flex-shrink-0" />
        <div className="text-sm text-gray-700 space-y-1">
          <p className="font-semibold text-[#163269]">
            ¿Cómo funciona el sistema multi-sucursal?
          </p>
          <p>
            Todas las sucursales comparten el <strong>mismo catálogo central de artículos</strong> (código, nombre, precio y fotos). Sin embargo, cada sucursal gestiona de forma <strong>independiente sus existencias (stock)</strong>, pedidos, cotizaciones y ventas.
          </p>
        </div>
      </div>

      {/* Listado de Sucursales */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-800">Sedes Registradas</h2>
          <span className="text-xs text-gray-400">
            {sucursales.length} {sucursales.length === 1 ? "sede" : "sedes"} en total
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-gray-500">Cargando sucursales...</div>
        ) : sucursales.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            No se encontraron sucursales registradas.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
            {sucursales.map((sucursal) => (
              <div
                key={sucursal.id_sucursal}
                className={`relative rounded-xl p-5 border transition-all duration-200 ${
                  sucursal.esActual
                    ? "border-[#163269] bg-blue-50/40 shadow-md ring-2 ring-[#163269]/20"
                    : "border-gray-200 bg-white hover:shadow-md hover:border-gray-300"
                }`}
              >
                {/* Header de la tarjeta */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg ${
                        sucursal.esActual
                          ? "bg-[#163269] text-white"
                          : "bg-gray-100 text-[#163269]"
                      }`}
                    >
                      <ShopOutlined />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 text-base leading-tight">
                        {sucursal.nombre}
                      </h3>
                      <span className="text-xs text-gray-400">
                        ID Sede: #{sucursal.id_sucursal}
                      </span>
                    </div>
                  </div>

                  {sucursal.esActual && (
                    <Tag
                      color="blue"
                      className="m-0 font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1 border-blue-200 text-[#163269]"
                    >
                      <CheckCircleOutlined /> Sesión Activa
                    </Tag>
                  )}
                </div>

                {/* Métricas de la sucursal */}
                <div className="pt-3 mt-3 border-t border-gray-100 flex items-center justify-between text-sm text-gray-600">
                  <span className="flex items-center gap-1.5">
                    <UserOutlined className="text-gray-400" />
                    <strong>{sucursal.totalUsuarios}</strong>{" "}
                    {sucursal.totalUsuarios === 1 ? "usuario" : "usuarios"}
                  </span>
                  <span className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-md font-medium">
                    {sucursal.esActual ? "Operando aquí" : "Inventario propio"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal para Crear Nueva Sucursal */}
      <Modal
        title={
          <div className="flex items-center gap-2 text-lg text-[#163269] font-bold">
            <FaStore className="text-[#BC7D3B]" /> Registrar Nueva Sucursal
          </div>
        }
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        destroyOnClose
      >
        <form onSubmit={handleCrearSucursal} className="space-y-4 pt-3">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Nombre de la Sucursal:
            </label>
            <Input
              size="large"
              placeholder="Ejemplo: Sucursal Centro, Sucursal El Progreso"
              value={nuevoNombre}
              onChange={(e) => setNuevoNombre(e.target.value)}
              autoFocus
              prefix={<ShopOutlined className="text-gray-400" />}
            />
            <p className="text-xs text-gray-500 mt-2">
              Al crear una nueva sucursal, se habilitará para registrar administradores y empleados con su propio control de inventario y pedidos.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t">
            <Button onClick={() => setModalVisible(false)}>Cancelar</Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={creating}
              className="bg-[#163269] hover:bg-[#122854]"
            >
              Crear Sucursal
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
