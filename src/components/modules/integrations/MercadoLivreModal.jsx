import React, { useState, useEffect } from 'react';
import { Modal, Form, Button, Row, Col, Alert, Spinner, InputGroup } from 'react-bootstrap';
import api from '../../../services/api';

const MercadoLivreModal = ({ show, onHide, isConfigured, onUpdateSuccess }) => {
    const [keys, setKeys] = useState({ 
        MERCADO_LIVRE_APP_ID: '', 
        MERCADO_LIVRE_SECRET_KEY: '', 
        MERCADO_LIVRE_ACCESS_TOKEN: '', 
        MERCADO_LIVRE_REFRESH_TOKEN: '' 
    });
    const [webhookUrl, setWebhookUrl] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [copied, setCopied] = useState(false);

    // ✅ Captura a URL do Webhook automaticamente
    useEffect(() => {
        if (show) {
            const baseUrl = api.defaults.baseURL || window.location.origin;
            // Endpoint padrão para notificações do Mercado Livre
            const fullUrl = `${baseUrl.replace(/\/$/, "")}/webhooks/mercadolivre`;
            setWebhookUrl(fullUrl);
        }
    }, [show]);

    const handleChange = (e) => setKeys(prev => ({ ...prev, [e.target.name]: e.target.value }));

    const handleCopy = () => {
        navigator.clipboard.writeText(webhookUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleSubmit = async (e) => {
        e.preventDefault(); 
        setSaving(true); 
        setError('');
        try {
            await api.put('/apikeys/mercadolivre', keys);
            onUpdateSuccess('Chaves do Mercado Livre atualizadas!');
            onHide();
        } catch (err) {
            setError('Erro ao guardar as chaves do Mercado Livre.');
        } finally { setSaving(false); }
    };

    return (
        <Modal show={show} onHide={onHide} centered size="lg">
            <Modal.Header closeButton className="border-0 pb-0">
                <Modal.Title className="fw-bold">Configuração Mercado Livre</Modal.Title>
            </Modal.Header>
            <Modal.Body className="p-4">
                <Alert variant="info" className="small">
                    <div className="d-flex align-items-center mb-2">
                        <i className="bi bi-info-circle-fill fs-5 me-2"></i>
                        <div>Obtenha suas credenciais no <a href="https://developers.mercadolibre.com.br/devcenter" target="_blank" rel="noopener noreferrer" className="fw-bold text-decoration-none">DevCenter do ML</a>.</div>
                    </div>
                </Alert>

                {/* ✅ SEÇÃO DA URL DE NOTIFICAÇÕES (WEBHOOK) */}
                <div className="mb-4 p-3 border rounded-3 bg-light">
                    <Form.Label className="fw-bold small text-uppercase text-muted">URL de Notificações (Webhooks)</Form.Label>
                    <p className="text-muted small mb-2">Configure esta URL no seu App no DevCenter para sincronizar vendas e estoque automaticamente.</p>
                    <InputGroup>
                        <Form.Control 
                            readOnly 
                            value={webhookUrl} 
                            className="bg-white border-end-0 font-monospace small"
                        />
                        <Button variant="outline-secondary" onClick={handleCopy}>
                            {copied ? <i className="bi bi-check-lg text-success"></i> : <i className="bi bi-clipboard"></i>}
                        </Button>
                    </InputGroup>
                </div>

                <hr className="my-4 opacity-25" />

                {error && <Alert variant="danger">{error}</Alert>}
                
                <Form onSubmit={handleSubmit}>
                    <Row className="g-3">
                        <Col md={6}>
                            <Form.Group>
                                <Form.Label className="fw-medium">App ID (Client ID)</Form.Label>
                                <Form.Control 
                                    name="MERCADO_LIVRE_APP_ID" 
                                    value={keys.MERCADO_LIVRE_APP_ID} 
                                    onChange={handleChange} 
                                    placeholder={isConfigured ? 'Configurado' : 'Ex: 87654321'} 
                                />
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group>
                                <Form.Label className="fw-medium">Secret Key (Client Secret)</Form.Label>
                                <Form.Control 
                                    type="password" 
                                    name="MERCADO_LIVRE_SECRET_KEY" 
                                    value={keys.MERCADO_LIVRE_SECRET_KEY} 
                                    onChange={handleChange} 
                                    placeholder="••••••••••••" 
                                />
                            </Form.Group>
                        </Col>
                        <Col md={12}>
                            <Form.Group>
                                <Form.Label className="fw-medium">Access Token</Form.Label>
                                <Form.Control 
                                    as="textarea" 
                                    rows={2} 
                                    name="MERCADO_LIVRE_ACCESS_TOKEN" 
                                    value={keys.MERCADO_LIVRE_ACCESS_TOKEN} 
                                    onChange={handleChange} 
                                    placeholder="APP_USR-..." 
                                />
                            </Form.Group>
                        </Col>
                        <Col md={12}>
                            <Form.Group>
                                <Form.Label className="fw-medium">Refresh Token</Form.Label>
                                <Form.Control 
                                    as="textarea" 
                                    rows={2} 
                                    name="MERCADO_LIVRE_REFRESH_TOKEN" 
                                    value={keys.MERCADO_LIVRE_REFRESH_TOKEN} 
                                    onChange={handleChange} 
                                    placeholder="TG-..." 
                                />
                            </Form.Group>
                        </Col>
                    </Row>
                    <div className="d-grid mt-4">
                        <Button variant="primary" type="submit" disabled={saving}>
                            {saving ? <Spinner size="sm" /> : 'Salvar Configuração'}
                        </Button>
                    </div>
                </Form>
            </Modal.Body>
        </Modal>
    );
};

export default MercadoLivreModal;