import { useEffect, useState } from "react";
import { Modal, InputNumber, Button } from "antd";

function ModalEditarCantidad({
    open,
    onClose,
    articulo,
    onGuardar,
}) {
    const [cantidad, setCantidad] = useState(0);

    /*useEffect(() => {
        if (articulo?.cantidad_existencia !== undefined) {
            setCantidad(articulo.cantidad_existencia);
        }
    }, [articulo]);*/

    const handleGuardar = () => {
        if (!articulo) return;

        onGuardar({
            codigo: articulo.codigo,
            cantidad_existencia: Number(articulo?.cantidad_existencia) + Number(cantidad),
        });

        onClose();
    };

    return (
        <Modal
        open={open}
        title="Editar cantidad de inventario"
        onCancel={onClose}
        footer={[
            <Button key="cancel" onClick={onClose}>
            Cancelar
            </Button>,
            <Button
            key="save"
            type="primary"
            onClick={handleGuardar}
            disabled={!articulo}
            >
            Guardar
            </Button>,
        ]}
        >
        <p>
            Artículo: <strong>{articulo?.nombre || "-"}</strong>
        </p>
        <InputNumber
            min={0}
            step={0.01}
            precision={2}
            value={cantidad}
            onChange={setCantidad}
            style={{ width: "100%" }}
        />
        </Modal>
    );
}

export default ModalEditarCantidad;
