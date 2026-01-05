import { Modal, Input, Button } from "antd";

function ModalEliminarArticulo({
  open,
  onClose,
  articulo,
  onConfirm,
}) {
    const handleConfirm = () => {
        if (!articulo) return;
        onConfirm(articulo);
        onClose();
    }

    return (
        <Modal
        open={open}
        title="AVISO"
        onCancel={onClose}
        footer={[
            <Button key="cancel" onClick={onClose}>
            Cancelar
            </Button>,
            <Button
            key="confirm"
            type="primary"
            danger
            onClick={handleConfirm}
            >
            Confirmar y borrar
            </Button>,
        ]}
        >
        <p>Se borrará el siguiente artículo:</p>
        
        <Input
            value={articulo ? `${articulo.codigo} : ${articulo.nombre}` : ""}
            readOnly
            style={{ marginBottom: 12 }}
        />

        <p style={{ fontSize: "0.875rem", color: "#555" }}>
            Esta acción no se puede deshacer.<br />
            Si desea deshabilitar el artículo temporalmente, cancele la operación y use la opción 'Cambiar Disponibilidad'.
        </p>
        </Modal>
    );
}

export default ModalEliminarArticulo