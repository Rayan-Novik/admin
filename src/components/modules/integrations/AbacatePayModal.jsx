import React, { useState } from 'react';
import { Modal, Button, Form, Spinner, Alert } from 'react-bootstrap';
import api from '../../../services/api';
import { toast } from 'react-toastify';

const AbacatePayModal = ({ show, onHide, isConfigured, onUpdateSuccess }) => {
    const [apiKey, setApiKey] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await api.post('/configuracoes', {
                chave: 'ABACATEPAY_API_KEY',
                valor: apiKey
            });
            toast.success('AbacatePay configurado com sucesso!');
            if (onUpdateSuccess) onUpdateSuccess();
            onHide();
        } catch (err) {
            setError('Erro ao salvar configuração.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal show={show} onHide={onHide} centered>
            <Modal.Header closeButton className="border-0 pb-0">
                <div className="d-flex align-items-center">
                    <div className="bg-success bg-opacity-10 p-2 rounded-circle me-3">
                        <span style={{ fontSize: '1.5rem' }}>🥑</span>
                    </div>
                    <Modal.Title className="fw-bold h5">Configurar AbacatePay</Modal.Title>
                </div>
            </Modal.Header>
            <Modal.Body className="pt-4">
                <p className="text-muted small mb-4">
                    Insira sua chave de API do AbacatePay para processar pagamentos via PIX e Cartão com taxas competitivas.
                </p>

                {error && <Alert variant="danger" className="py-2 small">{error}</Alert>}

                <Form onSubmit={handleSubmit}>
                    <Form.Group className="mb-3">
                        <Form.Label className="fw-bold small text-muted text-uppercase">API Key (Token)</Form.Label>
                        <Form.Control
                            type="text"
                            placeholder="ex: abc123def456..."
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            className="bg-light border-0 py-2"
                            autoFocus
                        />
                    </Form.Group>

                    <div className="d-flex justify-content-end gap-2 mt-4">
                        <Button variant="light" onClick={onHide} className="rounded-pill fw-bold border-0">
                            Cancelar
                        </Button>
                        <Button 
                            type="submit" 
                            variant="success" 
                            className="rounded-pill fw-bold px-4"
                            disabled={loading || !apiKey}
                        >
                            {loading ? <Spinner size="sm" animation="border" /> : 'Salvar Conexão'}
                        </Button>
                    </div>
                </Form>
            </Modal.Body>
        </Modal>
    );
};

export default AbacatePayModal;