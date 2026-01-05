import React, { useState, useEffect } from "react";
import { message } from "antd";
import { SelectOutlined } from "@ant-design/icons";
import axios from "axios";
import AsignarRepartidorModal from "./AsignarRepartidorModal";
import DetallePedidoModal from "./DetallePedidoModal";
import { useNavigate } from "react-router-dom";

function ListaPedidosAdmin() {
  const navigate = useNavigate();
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterValue, setFilterValue] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [repartidores, setRepartidores] = useState([]);
  const [selectedPedido, setSelectedPedido] = useState(null);
  const [showDetalleModal, setShowDetalleModal] = useState(false);

  const handleOpenModal = (pedido) => {
    setSelectedPedido(pedido);
    setIsModalVisible(true);
  };

  const handleCloseModal = () => {
    setIsModalVisible(false);
    setSelectedPedido(null);
  };

  const handleVerDetalles = (pedido) => {
    setSelectedPedido(pedido);
    setShowDetalleModal(true);
  };

  const handleCancelarPedido = async (pedido) => {
    try {
      const pedidoId = pedido.id_pedido || pedido.id;
      const response = await axios.put(
        `${import.meta.env.VITE_API_URL || '/api'}/pedidos/${pedidoId}/estado`,
        { estado: 'Cancelado' }
      );

      if (response.data.status === 'success') {
        message.success('Pedido cancelado correctamente');
        fetchPedidos();
      } else {
        message.error('No se pudo cancelar el pedido');
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Error al cancelar el pedido';
      message.error(errorMsg);
    }
  };

  const handleCloseDetalleModal = () => {
    setShowDetalleModal(false);
    setSelectedPedido(null);
  };

  const handleAssignRepartidor = async (repartidorId) => {
    try {
      message.success('Repartidor asignado exitosamente');
      await fetchPedidos();
    } catch (error) {
      message.error('Error al asignar repartidor');
    }
  };

  useEffect(() => {
    fetchPedidos();
    fetchRepartidores();
    onChange("Pendiente");
  }, []);

  const fetchPedidos = async () => {
    setLoading(true);
    try {
      // Obtener usuario logueado
      const usuarioStorage = sessionStorage.getItem("usuario");
      if (!usuarioStorage) {
        throw new Error("No hay sesión activa");
      }
      const usuario = JSON.parse(usuarioStorage);
      const repartidorId = usuario.id_usuario;

      const response = await axios.get(
        `${import.meta.env.VITE_API_URL || '/api'}/pedidos/getAllPedidos`
      );

      const pedidosData = response.data.data || response.data;
      setPedidos(pedidosData);
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Error al cargar pedidos";
      setError(errorMsg);
      message.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  //usuarios filtrados por repartidores
  const fetchRepartidores = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL || '/api'}/usuarios/usuarios`
      );
      
      const repartidoresActivos = response.data.filter(
        (usuario) => usuario.rol === "Repartidor" && usuario.estado === "Activo"
      );
      
      setRepartidores(repartidoresActivos);
    } catch (err) {
      console.error("Error al cargar repartidores:", err);
      message.error("Error al cargar repartidores");
    }
  };

  const handleEstadoColor = (estado) => {
    if (estado === "Entregado") return "#5E9C08";
    if (estado === "Cancelado") return "#BC7D3B";
    if (estado === "En Transcurso") return "#2C4D8E";
    if (estado === "Pendiente") return "#ECB01F";
    return "#163269";
  };

  const onChange = (value) => {
    setFilterValue("Pendiente");
  };

  return (
    <div className="w-full">
      <div className="max-w-7xl mx-auto">
        {/* Header (page) */}
        <div
          className="flex flex-col sm:flex-row sm:items-center justify-between mb-5 border-b-4 gap-4"
          style={{ borderColor: "#163269" }}
        >
          <h1
            className="text-2xl sm:text-3xl font-bold pb-4"
            style={{ color: "#163269" }}
          >
            Lista de Pedidos
          </h1>

          <span className="text-lg sm:text-xl font-bold pb-4" style={{ color: "#163269" }}>
            Total de pedidos pendientes por asignar:{" "}
            {
              (filterValue
                ? pedidos.filter((p) => p.estado === filterValue)
                : pedidos
              ).length
            }
          </span>
        </div>
        <div className="flex items-center justify-end mb-4 gap-1">
          <button
            onClick={() => navigate("/admin/pedidos/crear-pedido")}
            className="px-6 py-2 sm:px-8 sm:py-3 rounded-lg text-white font-semibold text-sm sm:text-lg transition-colors hover:opacity-90"
            style={{ backgroundColor: "#163269" }}
          >
            Nuevo Pedido
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-10">
            <p className="text-lg" style={{ color: "#163269" }}>
              Cargando pedidos...
            </p>
          </div>
        ) : pedidos.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-lg" style={{ color: "#163269" }}>
              No hay pedidos existentes
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {(filterValue
              ? pedidos.filter((p) => p.estado === filterValue)
              : pedidos
            ).map((pedido) => (
              <div
                key={pedido.id_pedido}
                className="bg-white rounded-2xl shadow-lg overflow-hidden"
              >
                <div className="p-4 sm:p-6 flex flex-col sm:flex-row sm:justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    <p className="text-sm sm:text-base" style={{ color: "#163269" }}>
                      Cliente: {pedido.cliente_nombre}
                    </p>
                    <p className="text-sm sm:text-base" style={{ color: "#163269" }}>
                      {pedido.direccion_entrega}
                    </p>
                    <p className="text-sm sm:text-base" style={{ color: "#163269" }}>
                      Costo total: L.{pedido.total}
                    </p>
                    <p className="text-sm sm:text-base" style={{ color: "#163269" }}>
                      Fecha de creación:{" "}
                      {new Date(pedido.fecha_creacion).toLocaleDateString(
                        "es-HN"
                      )}
                    </p>
                  </div>

                  <div className="flex flex-col justify-between items-end gap-2">
                    <span
                      className="px-4 sm:px-6 py-1 rounded-full text-white font-medium shadow-lg text-sm sm:text-base"
                      style={{
                        backgroundColor: handleEstadoColor(pedido.estado),
                      }}
                    >
                      {pedido.estado}
                    </span>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleVerDetalles(pedido)}
                        className="px-3 py-1 text-white font-medium text-xs sm:text-sm rounded"
                        title="Ver detalles del pedido"
                        style={{ backgroundColor: "#163269" }}
                      >
                        Ver Detalles
                      </button>

                      <button
                        onClick={() => handleCancelarPedido(pedido)}
                        className="px-3 py-1 text-white font-medium text-xs sm:text-sm rounded"
                        title="Cancelar pedido"
                        style={{ backgroundColor: "#BC7D3B" }}
                      >
                        Cancelar
                      </button>
                      
                      <button
                        onClick={() => handleOpenModal(pedido)}
                        className="px-3 py-1 text-white font-medium"
                        title="Asignar repartidor"
                      >
                        <SelectOutlined
                          className="text-lg sm:text-2xl"
                          style={{ color: "#163269" }}
                        />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <AsignarRepartidorModal
        isOpen={isModalVisible}
        onClose={handleCloseModal}
        onAssign={handleAssignRepartidor}
        repartidores={repartidores}
        pedidoId={selectedPedido?.id_pedido}
      />

      {showDetalleModal && selectedPedido && (
        <DetallePedidoModal 
          pedidoId={selectedPedido.id_pedido || selectedPedido.id}
          onClose={handleCloseDetalleModal}
        />
      )}
    </div>
  );
}

export default ListaPedidosAdmin;
