import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Spinner, Alert } from 'react-bootstrap';
import api from '../../../services/api'; // Certifique-se que o caminho do api está correto
import { toast } from 'react-toastify';

const CieloModal = ({ show, onHide, isConfigured, onUpdateSuccess }) => {
    const [merchantId, setMerchantId] = useState('');
    const [merchantKey, setMerchantKey] = useState('');
    const [sandbox, setSandbox] = useState(false);
    
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (show) {
            fetchKeys();
        }
    }, [show]);

    const fetchKeys = async () => {
        setLoading(true);
        try {
            // ✅ ATUALIZADO: Usa a rota específica criada no controller de ApiKeys
            const { data } = await api.get('/apikeys/cielo');
            
            setMerchantId(data.CIELO_MERCHANT_ID || '');
            setMerchantKey(data.CIELO_MERCHANT_KEY || '');
            setSandbox(data.CIELO_SANDBOX === 'true');
        } catch (error) {
            console.error(error);
            toast.error('Erro ao buscar chaves da Cielo.');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            // ✅ ATUALIZADO: Envia para a rota específica da Cielo
            await api.put('/apikeys/cielo', {
                CIELO_MERCHANT_ID: merchantId,
                CIELO_MERCHANT_KEY: merchantKey,
                CIELO_SANDBOX: sandbox.toString() // Backend espera string 'true' ou 'false'
            });

            toast.success('Configurações da Cielo salvas!');
            if (onUpdateSuccess) onUpdateSuccess(); 
            onHide();
        } catch (error) {
            console.error(error);
            toast.error('Erro ao salvar chaves.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal show={show} onHide={onHide} centered>
            <Modal.Header closeButton className="border-0 pb-0">
                <Modal.Title className="fw-bold text-primary">
                    <img src="/images/unnamed.png" alt="Mercado Pago" height="22" />
                    Configurar Cielo 3.0
                </Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {loading ? (
                    <div className="text-center py-4"><Spinner animation="border" size="sm" /></div>
                ) : (
                    <Form>
                        <Alert variant="info" className="small">
                            <i className="bi bi-info-circle-fill me-2"></i>
                            Para obter essas chaves, acesse o painel de desenvolvedores da Cielo.
                        </Alert>

                        <Form.Group className="mb-3">
                            <Form.Label className="fw-bold small">Merchant ID</Form.Label>
                            <Form.Control 
                                type="text" 
                                placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                                value={merchantId}
                                onChange={(e) => setMerchantId(e.target.value)}
                            />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label className="fw-bold small">Merchant Key</Form.Label>
                            <Form.Control 
                                type="password" 
                                placeholder="Chave secreta de produção ou sandbox"
                                value={merchantKey}
                                onChange={(e) => setMerchantKey(e.target.value)}
                            />
                        </Form.Group>

                        <Form.Group className="mb-3 bg-light p-3 rounded">
                            <Form.Check 
                                type="switch"
                                id="sandbox-switch"
                                label={
                                    <span>
                                        Modo Sandbox (Testes) 
                                        {sandbox && <span className="badge bg-warning text-dark ms-2">ATIVO</span>}
                                    </span>
                                }
                                checked={sandbox}
                                onChange={(e) => setSandbox(e.target.checked)}
                            />
                            <Form.Text className="text-muted small">
                                Ative para testar sem cobrar cartões reais.
                            </Form.Text>
                        </Form.Group>
                    </Form>
                )}
            </Modal.Body>
            <Modal.Footer className="border-0 pt-0">
                <Button variant="light" onClick={onHide}>Cancelar</Button>
                <Button variant="primary" onClick={handleSave} disabled={saving || loading}>
                    {saving ? 'Salvando...' : 'Salvar Configuração'}
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default CieloModal;