import React, { useState, useEffect } from 'react';
import { Form, Button, Card, Alert, Spinner, Row, Col, InputGroup } from 'react-bootstrap';
import api from '../../../services/api';

const SocialMediaManager = () => {
    const [settings, setSettings] = useState({
        LINK_FACEBOOK: '',
        FACEBOOK_ATIVO: false, // Novo
        LINK_INSTAGRAM: '',
        INSTAGRAM_ATIVO: false, // Novo
        LINK_TIKTOK: '',
        TIKTOK_ATIVO: false, // Novo
        WHATSAPP_NUMERO: '',
        WHATSAPP_MENSAGEM: 'Olá! Tenho interesse nos seus produtos.',
        WHATSAPP_ATIVO: false,
    });
    
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const { data } = await api.get('/social-media');
                if (data) {
                    // Garante que os booleanos venham corretos do backend
                    const parsedData = { ...data };
                    ['WHATSAPP_ATIVO', 'FACEBOOK_ATIVO', 'INSTAGRAM_ATIVO', 'TIKTOK_ATIVO'].forEach(key => {
                        parsedData[key] = data[key] === true || data[key] === 'true';
                    });
                    setSettings(prev => ({...prev, ...parsedData}));
                }
            } catch (err) {
                setError('Não foi possível carregar as configurações.');
            } finally {
                setLoading(false);
            }
        };
        fetchSettings();
    }, []);

    const handleChange = (e) => {
        setSuccess('');
        const { name, value, type, checked } = e.target;
        setSettings(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSave = async () => {
        setSaving(true);
        setError('');
        setSuccess('');
        try {
            await api.put('/social-media', settings);
            setSuccess('Configurações salvas com sucesso!');
        } catch (err) {
            setError('Não foi possível salvar as configurações.');
        } finally {
            setSaving(false);
        }
    };
    
    if (loading) return <div className="text-center p-5"><Spinner animation="border" variant="primary" /></div>;

    return (
        <Card className="shadow-sm border-0 rounded-4">
            <Card.Body className="p-4">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <h5 className="mb-0 fw-bold text-dark">Redes Sociais e Contato</h5>
                    <div className="text-muted small">Gerencie onde seus clientes podem te encontrar.</div>
                </div>

                {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}
                {success && <Alert variant="success" onClose={() => setSuccess('')} dismissible>{success}</Alert>}

                <Row className="g-5">
                    {/* Coluna da Esquerda: Redes Sociais */}
                    <Col lg={6}>
                        <h6 className="mb-3 text-secondary text-uppercase small fw-bold ls-1">Perfis Sociais</h6>
                        
                        {/* FACEBOOK */}
                        <div className={`p-3 rounded-3 border mb-3 ${settings.FACEBOOK_ATIVO ? 'bg-white' : 'bg-light opacity-75'}`}>
                            <div className="d-flex justify-content-between align-items-center mb-2">
                                <Form.Label className="small fw-bold mb-0 text-primary"><i className="bi bi-facebook me-1"></i> Facebook</Form.Label>
                                <Form.Check 
                                    type="switch"
                                    id="facebook-switch"
                                    name="FACEBOOK_ATIVO"
                                    checked={settings.FACEBOOK_ATIVO}
                                    onChange={handleChange}
                                />
                            </div>
                            <InputGroup>
                                <Form.Control 
                                    type="url" 
                                    name="LINK_FACEBOOK" 
                                    value={settings.LINK_FACEBOOK || ''} 
                                    onChange={handleChange} 
                                    placeholder="https://facebook.com/seuperfil" 
                                    disabled={!settings.FACEBOOK_ATIVO}
                                />
                            </InputGroup>
                        </div>

                        {/* INSTAGRAM */}
                        <div className={`p-3 rounded-3 border mb-3 ${settings.INSTAGRAM_ATIVO ? 'bg-white' : 'bg-light opacity-75'}`}>
                            <div className="d-flex justify-content-between align-items-center mb-2">
                                <Form.Label className="small fw-bold mb-0 text-danger"><i className="bi bi-instagram me-1"></i> Instagram</Form.Label>
                                <Form.Check 
                                    type="switch"
                                    id="instagram-switch"
                                    name="INSTAGRAM_ATIVO"
                                    checked={settings.INSTAGRAM_ATIVO}
                                    onChange={handleChange}
                                />
                            </div>
                            <InputGroup>
                                <Form.Control 
                                    type="url" 
                                    name="LINK_INSTAGRAM" 
                                    value={settings.LINK_INSTAGRAM || ''} 
                                    onChange={handleChange} 
                                    placeholder="https://instagram.com/seuperfil" 
                                    disabled={!settings.INSTAGRAM_ATIVO}
                                />
                            </InputGroup>
                        </div>

                        {/* TIKTOK */}
                        <div className={`p-3 rounded-3 border mb-3 ${settings.TIKTOK_ATIVO ? 'bg-white' : 'bg-light opacity-75'}`}>
                            <div className="d-flex justify-content-between align-items-center mb-2">
                                <Form.Label className="small fw-bold mb-0 text-dark"><i className="bi bi-tiktok me-1"></i> TikTok</Form.Label>
                                <Form.Check 
                                    type="switch"
                                    id="tiktok-switch"
                                    name="TIKTOK_ATIVO"
                                    checked={settings.TIKTOK_ATIVO}
                                    onChange={handleChange}
                                />
                            </div>
                            <InputGroup>
                                <Form.Control 
                                    type="url" 
                                    name="LINK_TIKTOK" 
                                    value={settings.LINK_TIKTOK || ''} 
                                    onChange={handleChange} 
                                    placeholder="https://tiktok.com/@seuperfil" 
                                    disabled={!settings.TIKTOK_ATIVO}
                                />
                            </InputGroup>
                        </div>
                    </Col>
                    
                    {/* Coluna da Direita: WhatsApp */}
                    <Col lg={6}>
                        <h6 className="mb-3 text-secondary text-uppercase small fw-bold ls-1">Botão Flutuante</h6>

                        <div className={`p-3 rounded-3 border ${settings.WHATSAPP_ATIVO ? 'bg-white' : 'bg-light opacity-75'}`}>
                            <div className="d-flex justify-content-between align-items-center mb-3">
                                <Form.Label className="small fw-bold mb-0 text-success"><i className="bi bi-whatsapp me-1"></i> WhatsApp</Form.Label>
                                <Form.Check 
                                    type="switch" 
                                    id="whatsapp-switch"
                                    label={settings.WHATSAPP_ATIVO ? "Ativo" : "Inativo"}
                                    name="WHATSAPP_ATIVO"
                                    checked={settings.WHATSAPP_ATIVO}
                                    onChange={handleChange}
                                    className={settings.WHATSAPP_ATIVO ? "text-success fw-bold" : "text-muted"}
                                />
                            </div>

                            <Form.Group className="mb-3">
                                <Form.Label className="small text-muted">Número (Com DDD)</Form.Label>
                                <Form.Control 
                                    type="text" 
                                    name="WHATSAPP_NUMERO" 
                                    value={settings.WHATSAPP_NUMERO || ''} 
                                    onChange={handleChange} 
                                    placeholder="5511999998888" 
                                    disabled={!settings.WHATSAPP_ATIVO} 
                                />
                                <Form.Text className="text-muted small">Ex: 55 + DDD + Número (apenas números)</Form.Text>
                            </Form.Group>

                            <Form.Group>
                                <Form.Label className="small text-muted">Mensagem Inicial (Opcional)</Form.Label>
                                <Form.Control 
                                    as="textarea" 
                                    rows={3} 
                                    name="WHATSAPP_MENSAGEM" 
                                    value={settings.WHATSAPP_MENSAGEM || ''} 
                                    onChange={handleChange} 
                                    disabled={!settings.WHATSAPP_ATIVO}
                                    placeholder="Olá! Gostaria de saber mais sobre..."
                                />
                            </Form.Group>
                        </div>
                    </Col>
                </Row>
                
                <hr className="my-4 opacity-10" />

                <div className="text-end">
                    <Button variant="primary" onClick={handleSave} disabled={saving} className="px-4 shadow-sm">
                        {saving ? <Spinner as="span" animation="border" size="sm" /> : 'Salvar Configurações'}
                    </Button>
                </div>
            </Card.Body>
        </Card>
    );
};

export default SocialMediaManager;