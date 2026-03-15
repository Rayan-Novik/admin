import React from 'react';
import { Modal, Button, Form, Spinner } from 'react-bootstrap';

const StockAuditModal = ({ show, onHide, onSubmit, estoqueOriginal, novoEstoque, motivo, setMotivo, origem, setOrigem, loading }) => {
    return (
        <Modal show={show} onHide={onHide} centered backdrop="static">
            <Modal.Header closeButton><Modal.Title>Auditoria de Estoque</Modal.Title></Modal.Header>
            <Modal.Body>
                <p>Alteração detectada: <strong>{estoqueOriginal}</strong> → <strong>{novoEstoque}</strong>.</p>
                <Form.Group className="mb-3">
                    <Form.Label className="fw-bold">Motivo:</Form.Label>
                    <Form.Select value={motivo} onChange={(e) => setMotivo(e.target.value)}>
                        <option value="Ajuste Manual via Edição">Ajuste Manual</option>
                        <option value="Compra de Fornecedor">Compra / Reposição</option>
                        <option value="Avaria / Produto Quebrado">Avaria</option>
                        <option value="Devolução de Cliente">Devolução</option>
                        <option value="Perda / Roubo">Perda / Roubo</option>
                    </Form.Select>
                </Form.Group>
                <Form.Group>
                    <Form.Label className="fw-bold">Obs:</Form.Label>
                    <Form.Control type="text" placeholder="Ex: NF 450" value={origem} onChange={(e) => setOrigem(e.target.value)} />
                </Form.Group>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={onHide}>Cancelar</Button>
                <Button variant="primary" onClick={onSubmit} disabled={loading}>
                    {loading ? <Spinner size="sm" animation="border" /> : 'Confirmar'}
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default StockAuditModal;