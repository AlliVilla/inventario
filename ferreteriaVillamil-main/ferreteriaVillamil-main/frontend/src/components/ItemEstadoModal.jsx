import { useEffect, useState } from "react";
import { Modal, Select, Button } from "antd";

const { Option } = Select;

export default function ModalDeshabilitarArticulo({
    open,
    onClose,
    articulo,
    onGuardar,
}) {
    const [estado, setEstado] = useState("Disponible");

    useEffect(() => {
        if (articulo) {
            setEstado(articulo.estado);
        }
    }, [articulo])

    const handleGuardar = () => {
        onGuardar({
            ...articulo,
            estado,
        });
        onClose();
    };

    return (
        <Modal
            open={open}
            title="Cambiar disponibilidad"
            onCancel={onClose}
            footer={[
                <Button key="cancel" onClick={onClose}>
                    Cancelar
                </Button>,
                <Button key="save" type="primary" onClick={handleGuardar}>
                    Guardar
                </Button>,
            ]}
        >
            <p style={{ marginBottom: 12 }}>
                Artículo seleccionado: <strong>{articulo?.nombre}</strong>
            </p>

            <Select
                value={estado}
                onChange={setEstado}
                style={{ width: "100%" }}
            >
                <Option value='Disponible'>Disponible</Option>
                <Option value='No Disponible'>No disponible</Option>
            </Select>
        </Modal>
    );
}
