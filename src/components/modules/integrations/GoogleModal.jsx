import React from 'react';
import { Modal } from 'react-bootstrap';
// Importa o seu componente existente
import GoogleSettings from '../Settings/GoogleSettings'; 

const GoogleModal = ({ show, onHide, onUpdateSuccess }) => {
    return (
        <Modal show={show} onHide={onHide} centered size="lg">
            <Modal.Header closeButton className="border-0 pb-0">
                <Modal.Title className="fw-bold text-dark">
                    Configuração Google Login
                </Modal.Title>
            </Modal.Header>
            <Modal.Body className="pt-2 pb-4">
                {/* Renderiza o componente que você já tem */}
                <GoogleSettings />
            </Modal.Body>
        </Modal>
    );
};

export default GoogleModal;