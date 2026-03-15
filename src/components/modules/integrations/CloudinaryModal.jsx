import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Alert, Spinner, InputGroup } from 'react-bootstrap';
import api from '../../../services/api'; // Ajuste o caminho se necessário
import { toast } from 'react-toastify';

const CloudinaryModal = ({ show, onHide, onUpdateSuccess }) => {
    const [cloudName, setCloudName] = useState('');
    const [apiKey, setApiKey] = useState('');
    const [apiSecret, setApiSecret] = useState('');
    
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [showSecret, setShowSecret] = useState(false);

    // Carrega as configurações atuais quando o modal abre
    useEffect(() => {
        if (show) {
            fetchSettings();
        }
    }, [show]);

    const fetchSettings = async () => {
        setLoading(true);
        try {
            // Busca as chaves atuais (supondo que você tenha criado essa rota GET ou use a genérica)
            // Se não tiver rota específica, o backend retornará vazio e você preenche.
            const response = await api.get('/apikeys/cloudinary'); 
            
            if (response.data) {
                setCloudName(response.data.CLOUDINARY_CLOUD_NAME || '');
                setApiKey(response.data.CLOUDINARY_API_KEY || '');
                setApiSecret(response.data.CLOUDINARY_API_SECRET || '');
            }
        } catch (error) {
            console.error("Erro ao carregar Cloudinary:", error);
            // Não exibimos erro crítico aqui, pois pode ser apenas a primeira configuração
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!cloudName || !apiKey || !apiSecret) {
            toast.warning("Preencha todos os campos do Cloudinary.");
            return;
        }

        setSaving(true);
        try {
            // Salva as 3 chaves individualmente na tabela de configurações
            await Promise.all([
                api.post('/configuracoes', { chave: 'CLOUDINARY_CLOUD_NAME', valor: cloudName.trim() }),
                api.post('/configuracoes', { chave: 'CLOUDINARY_API_KEY', valor: apiKey.trim() }),
                api.post('/configuracoes', { chave: 'CLOUDINARY_API_SECRET', valor: apiSecret.trim() })
            ]);

            toast.success("Configurações do Cloudinary salvas!");
            if (onUpdateSuccess) onUpdateSuccess("Cloudinary atualizado");
            onHide();
        } catch (error) {
            console.error(error);
            toast.error("Erro ao salvar configurações.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal show={show} onHide={onHide} centered>
            <Modal.Header closeButton>
                <div className="d-flex align-items-center">
                    <img 
                        src="https://cloudinary-res.cloudinary.com/image/upload/cloudinary_logo_for_white_bg.svg" 
                        alt="Cloudinary" 
                        style={{ height: '25px', marginRight: '10px' }} 
                    />
                    <Modal.Title className="h5 fw-bold">Configurar Cloudinary</Modal.Title>
                </div>
            </Modal.Header>
            <Modal.Body>
                {loading ? (
                    <div className="text-center py-4">
                        <Spinner animation="border" variant="primary" />
                        <p className="mt-2 small text-muted">Carregando dados...</p>
                    </div>
                ) : (
                    <>
                        <Alert variant="info" className="small">
                            <i className="bi bi-info-circle me-2"></i>
                            Você pode encontrar essas chaves no <strong>Dashboard</strong> da sua conta Cloudinary.
                            <br />
                            <a href="https://console.cloudinary.com/console" target="_blank" rel="noreferrer" className="fw-bold">
                                Ir para o Console Cloudinary <i className="bi bi-box-arrow-up-right"></i>
                            </a>
                        </Alert>

                        <Form>
                            <Form.Group className="mb-3">
                                <Form.Label className="fw-bold small">Cloud Name</Form.Label>
                                <Form.Control 
                                    type="text" 
                                    placeholder="Ex: dxyz123abc" 
                                    value={cloudName} 
                                    onChange={(e) => setCloudName(e.target.value)} 
                                />
                            </Form.Group>

                            <Form.Group className="mb-3">
                                <Form.Label className="fw-bold small">API Key</Form.Label>
                                <Form.Control 
                                    type="text" 
                                    placeholder="Ex: 987654321098765" 
                                    value={apiKey} 
                                    onChange={(e) => setApiKey(e.target.value)} 
                                />
                            </Form.Group>

                            <Form.Group className="mb-3">
                                <Form.Label className="fw-bold small">API Secret</Form.Label>
                                <InputGroup>
                                    <Form.Control 
                                        type={showSecret ? "text" : "password"} 
                                        placeholder="Ex: abc123_SECRET_KEY_xyz" 
                                        value={apiSecret} 
                                        onChange={(e) => setApiSecret(e.target.value)} 
                                    />
                                    <Button 
                                        variant="outline-secondary" 
                                        onClick={() => setShowSecret(!showSecret)}
                                    >
                                        <i className={`bi ${showSecret ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                                    </Button>
                                </InputGroup>
                                <Form.Text className="text-muted small">
                                    Essa chave é mantida em segurança e não é exibida publicamente.
                                </Form.Text>
                            </Form.Group>
                        </Form>
                    </>
                )}
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={onHide} disabled={saving}>
                    Cancelar
                </Button>
                <Button variant="primary" onClick={handleSave} disabled={saving || loading}>
                    {saving ? <><Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2"/>Salvando...</> : 'Salvar Chaves'}
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default CloudinaryModal;