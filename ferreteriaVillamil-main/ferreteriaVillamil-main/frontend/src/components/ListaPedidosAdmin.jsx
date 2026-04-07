import React, { useState, useEffect } from "react";
import { message, Select, Input } from "antd";
import { SelectOutlined, EditOutlined } from "@ant-design/icons";
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
  const [searchName, setSearchName] = useState("");
  const [searchDate, setSearchDate] = useState("");
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

  const handleCambiarEstado = async (pedido, nuevoEstado) => {
    try {
      const pedidoId = pedido.id_pedido || pedido.id;
      const response = await axios.put(
        `${import.meta.env.VITE_API_URL || '/api'}/pedidos/${pedidoId}/estado`,
        { estado: nuevoEstado }
      );

      if (response.data.status === 'success') {
        message.success('Estado actualizado correctamente');
        fetchPedidos();
      } else {
        message.error('No se pudo actualizar el estado');
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Error al actualizar estado';
      message.error(errorMsg);
    }
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
      const usuarioStorage = localStorage.getItem("usuario");
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
              (pedidos.filter((p) => p.estado === "Pendiente")).length
            }
          </span>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-between mb-4 gap-4">
          <div className="flex gap-2 w-full sm:w-auto">
            <Input
              placeholder="Buscar por cliente"
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              style={{ width: '100%', maxWidth: '200px' }}
            />
            <input
              type="date"
              value={searchDate}
              onChange={(e) => setSearchDate(e.target.value)}
              className="border border-gray-300 rounded px-2"
              style={{
                height: "32px",
                minWidth: "130px",
                borderColor: "#d9d9d9",
                color: searchDate ? "black" : "#bfbfbf"
              }}
            />
          </div>
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
            {pedidos
              .filter((p) => {
                const matchName = searchName
                  ? p.cliente_nombre.toLowerCase().includes(searchName.toLowerCase())
                  : true;
                const matchDate = searchDate
                  ? new Date(p.fecha_creacion).toISOString().split('T')[0] === searchDate
                  : true;
                const matchStatus = filterValue && filterValue !== "Todos"
                  ? p.estado === filterValue
                  : true;
                return matchName && matchDate && matchStatus;
              })
              .map((pedido) => (
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

                  <div className="flex flex-col justify-between sm:items-end gap-3 mt-2 sm:mt-0">
                    <span
                      className="px-4 py-1 rounded-full text-white font-semibold shadow-sm text-xs sm:text-sm self-start sm:self-end"
                      style={{
                        backgroundColor: handleEstadoColor(pedido.estado),
                      }}
                    >
                      {pedido.estado}
                    </span>

                    <div className="flex flex-wrap gap-2 sm:justify-end mt-2">
                      <button
                        onClick={() => handleVerDetalles(pedido)}
                        className="px-3 py-1.5 text-white font-medium text-xs sm:text-sm rounded"
                        title="Ver detalles del pedido"
                        style={{ backgroundColor: "#163269" }}
                      >
                        Ver Detalles
                      </button>

                      {(pedido.estado !== "Entregado" && pedido.estado !== "Cancelado") && (
                        <button
                          onClick={() => navigate(`/admin/pedidos/editar/${pedido.id_pedido}`)}
                          className="px-3 py-1.5 text-white font-medium text-xs sm:text-sm rounded"
                          title="Editar pedido"
                          style={{ backgroundColor: "#1e40af" }}
                        >
                          <EditOutlined /> Editar
                        </button>
                      )}

                      <button
                        onClick={() => handleCancelarPedido(pedido)}
                        className="px-3 py-1.5 text-white font-medium text-xs sm:text-sm rounded"
                        title="Cancelar pedido"
                        style={{ backgroundColor: "#BC7D3B" }}
                      >
                        Cancelar
                      </button>

                      <Select
                        value={pedido.estado}
                        onChange={(newEstado) => handleCambiarEstado(pedido, newEstado)}
                        style={{ width: 140 }}
                        disabled={pedido.estado === "Cancelado" || pedido.estado === "Entregado"}
                      >
                        <Select.Option value="Pendiente">Pendiente</Select.Option>
                        <Select.Option value="En transcurso">En transcurso</Select.Option>
                        <Select.Option value="Entregado">Entregado</Select.Option>
                      </Select>
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
