import React from 'react';
import { Modal, Button, Spinner } from 'react-bootstrap';
import UiField from '../../ui/UiField';

const StockAuditModal = ({ show, onHide, onSubmit, estoqueOriginal, novoEstoque, motivo, setMotivo, origem, setOrigem, loading }) => {
    return (
        <Modal show={show} onHide={onHide} centered backdrop="static" contentClassName="modal-dark-fix border-0 rounded-4 shadow-lg overflow-hidden">
            <div className="p-4 position-relative modal-dark-header">
                <h5 className="fw-bold mb-0">Auditoria de Estoque</h5>
                <small className="opacity-75">Justifique a alteração manual</small>
            </div>
            <Modal.Body className="p-4" style={{ backgroundColor: 'var(--bg-sidebar)' }}>
                <div className="p-3 rounded-3 mb-4 d-flex align-items-center justify-content-between" style={{ backgroundColor: 'var(--bg-main)', border: '1px solid var(--border-color)' }}>
                    <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Alteração de Saldo:</span>
                    <span className="fw-bold fs-5" style={{ color: 'var(--text-primary)' }}>{estoqueOriginal} <i className="bi bi-arrow-right mx-1 text-muted fs-6"></i> {novoEstoque}</span>
                </div>
                
                <UiField 
                    label="Motivo da Alteração" 
                    type="select" 
                    value={motivo} 
                    onChange={(e) => setMotivo(e.target.value)}
                    options={[
                        {value: 'Ajuste Manual via Edição', label: 'Ajuste Manual'},
                        {value: 'Compra de Fornecedor', label: 'Compra / Reposição'},
                        {value: 'Avaria / Produto Quebrado', label: 'Avaria / Quebra'},
                        {value: 'Devolução de Cliente', label: 'Devolução'},
                        {value: 'Perda / Roubo', label: 'Perda / Roubo'}
                    ]}
                />
                <UiField 
                    label="Observação (Opcional)" 
                    value={origem} 
                    onChange={(e) => setOrigem(e.target.value)} 
                    placeholder="Ex: Nota Fiscal 450" 
                />
            </Modal.Body>
            <Modal.Footer className="border-0 pt-0 px-4 pb-4" style={{ backgroundColor: 'var(--bg-sidebar)' }}>
                <Button variant="link" onClick={onHide} className="text-decoration-none me-auto fw-medium small" style={{ color: 'var(--text-secondary)' }}>Cancelar</Button>
                <Button variant="primary" onClick={onSubmit} disabled={loading} className="rounded-pill px-4 fw-bold border-0">
                    {loading ? <Spinner size="sm" /> : 'Confirmar Ajuste'}
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default StockAuditModal;