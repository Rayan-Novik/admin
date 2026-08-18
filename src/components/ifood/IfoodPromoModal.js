import React, { useState, useEffect } from 'react';
import { Modal, Form, Button } from 'react-bootstrap';

const IfoodPromoModal = ({ show, onHide, produto, onSave, onRemove }) => {
    const [precoPromocional, setPrecoPromocional] = useState('');

    useEffect(() => {
        if (show && produto) {
            if (produto.preco_ifood && Number(produto.preco_ifood) < Number(produto.preco)) {
                setPrecoPromocional(produto.preco_ifood);
            } else {
                setPrecoPromocional('');
            }
        }
    }, [show, produto]);

    return (
        <Modal show={show} onHide={onHide} centered contentClassName="modal-dark-fix">
            <Modal.Header closeButton className="border-bottom border-light-subtle">
                <Modal.Title className="ifood-text-primary">Gerenciar Oferta</Modal.Title>
            </Modal.Header>
            <Modal.Body style={{ backgroundColor: 'var(--bg-main)' }}>
                {produto && (
                    <Form.Group>
                        <Form.Label className="fw-bold text-success">Novo Preço Promocional</Form.Label>
                        <Form.Control 
                            type="number" 
                            step="0.01" 
                            value={precoPromocional} 
                            onChange={(e) => setPrecoPromocional(e.target.value)} 
                            className="form-dark-fix rounded-3"
                        />
                    </Form.Group>
                )}
            </Modal.Body>
            <Modal.Footer className="border-top border-light-subtle" style={{ backgroundColor: 'var(--bg-main)', borderBottomLeftRadius: 'var(--bs-modal-border-radius)', borderBottomRightRadius: 'var(--bs-modal-border-radius)' }}>
                {produto?.ifood_id && (
                    <Button variant="outline-danger" className="rounded-3" onClick={() => onRemove(produto.id_produto, 'remover')}>
                        Remover Oferta
                    </Button>
                )}
                <Button variant="success" className="rounded-3 px-4" onClick={() => onSave(produto.id_produto, precoPromocional)}>
                    Salvar Oferta
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default IfoodPromoModal;