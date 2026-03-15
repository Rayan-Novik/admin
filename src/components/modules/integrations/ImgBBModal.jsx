import React, { useState } from 'react';
import { Modal, Button, Form, Alert, Spinner, InputGroup } from 'react-bootstrap';
import api from '../../../services/api';

const ImgBBModal = ({ show, onHide, onUpdateSuccess, isConfigured }) => {
    const [apiKey, setApiKey] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showKey, setShowKey] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // Usa o endpoint genérico de update de chaves (ou crie um específico se preferir)
            await api.put('/apikeys/imgbb', { IMGBB_API_KEY: apiKey });
            onUpdateSuccess('Chave do ImgBB salva com sucesso!');
            setApiKey(''); // Limpa o campo por segurança
            onHide();
        } catch (err) {
            setError('Erro ao salvar a chave. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal show={show} onHide={onHide} centered>
            <Modal.Header closeButton>
                <Modal.Title>Configurar ImgBB</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <div className="text-center mb-4">
                    <img src="https://imgbb.com/static/img/logo.png" alt="ImgBB Logo" style={{ height: '40px' }} />
                    <p className="text-muted mt-2 small">
                        Hospedagem de imagens gratuita para sua loja.
                    </p>
                </div>

                {isConfigured && (
                    <Alert variant="success" className="py-2 small text-center mb-3">
                        <i className="fas fa-check-circle me-1"></i> Integração ativa!
                    </Alert>
                )}

                {error && <Alert variant="danger">{error}</Alert>}

                <Form onSubmit={handleSubmit}>
                    <Form.Group className="mb-3">
                        <Form.Label>API Key</Form.Label>
                        <InputGroup>
                            <Form.Control
                                type={showKey ? "text" : "password"}
                                placeholder="Cole sua chave aqui..."
                                value={apiKey}
                                onChange={(e) => setApiKey(e.target.value)}
                                required
                            />
                            <Button variant="outline-secondary" onClick={() => setShowKey(!showKey)}>
                                <i className={`fas ${showKey ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                            </Button>
                        </InputGroup>
                        <Form.Text className="text-muted">
                            Obtenha sua chave em <a href="https://api.imgbb.com/" target="_blank" rel="noopener noreferrer">api.imgbb.com</a>
                        </Form.Text>
                    </Form.Group>

                    <div className="d-flex justify-content-end gap-2 mt-4">
                        <Button variant="light" onClick={onHide}>Cancelar</Button>
                        <Button variant="primary" type="submit" disabled={loading}>
                            {loading ? <Spinner size="sm" /> : 'Salvar Chave'}
                        </Button>
                    </div>
                </Form>
            </Modal.Body>
        </Modal>
    );
};

export default ImgBBModal;