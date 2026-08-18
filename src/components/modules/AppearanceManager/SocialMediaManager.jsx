import React, { useState, useEffect } from 'react';
import { Form, Button, Alert, Spinner, Row, Col } from 'react-bootstrap';
import api from '../../../services/api';

const SocialMediaManager = () => {
    const [settings, setSettings] = useState({
        LINK_FACEBOOK: '',
        FACEBOOK_ATIVO: false, 
        LINK_INSTAGRAM: '',
        INSTAGRAM_ATIVO: false, 
        LINK_TIKTOK: '',
        TIKTOK_ATIVO: false, 
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
            setSuccess('Redes sociais atualizadas!');
        } catch (err) {
            setError('Não foi possível salvar as configurações.');
        } finally {
            setSaving(false);
        }
    };
    
    if (loading) return <div className="text-center p-5"><Spinner animation="border" variant="secondary" size="sm" /></div>;

    return (
        <div className="social-media-clean p-4 rounded-4 border" style={{ backgroundColor: 'var(--bg-sidebar)', borderColor: 'var(--border-color)' }}>
            {error && <Alert variant="danger" onClose={() => setError('')} className="border-0 shadow-sm rounded-3" dismissible>{error}</Alert>}
            {success && <Alert variant="success" onClose={() => setSuccess('')} className="border-0 shadow-sm rounded-3" dismissible>{success}</Alert>}

            <Row className="g-5">
                {/* Redes Sociais */}
                <Col lg={6}>
                    <div className="pe-lg-4 border-end-lg" style={{ borderColor: 'var(--border-color)' }}>
                        <h6 className="fw-bold mb-4" style={{ color: 'var(--text-primary)' }}>Perfis Sociais</h6>
                        
                        {/* Facebook */}
                        <Form.Group className="mb-4">
                            <div className="d-flex justify-content-between align-items-center mb-2">
                                <Form.Label className="mb-0 fw-semibold" style={{ fontSize: '13px', color: 'var(--text-primary)' }}><i className="bi bi-facebook me-2 fs-5" style={{ color: '#1877F2' }}></i> Facebook</Form.Label>
                                <Form.Check type="switch" name="FACEBOOK_ATIVO" checked={settings.FACEBOOK_ATIVO} onChange={handleChange} />
                            </div>
                            <Form.Control className="form-dark-input shadow-none border" style={{ fontSize: '13px', opacity: settings.FACEBOOK_ATIVO ? 1 : 0.6 }} type="url" name="LINK_FACEBOOK" value={settings.LINK_FACEBOOK || ''} onChange={handleChange} placeholder="https://facebook.com/seuperfil" disabled={!settings.FACEBOOK_ATIVO} />
                        </Form.Group>

                        {/* Instagram */}
                        <Form.Group className="mb-4">
                            <div className="d-flex justify-content-between align-items-center mb-2">
                                <Form.Label className="mb-0 fw-semibold" style={{ fontSize: '13px', color: 'var(--text-primary)' }}><i className="bi bi-instagram me-2 fs-5" style={{ color: '#E1306C' }}></i> Instagram</Form.Label>
                                <Form.Check type="switch" name="INSTAGRAM_ATIVO" checked={settings.INSTAGRAM_ATIVO} onChange={handleChange} />
                            </div>
                            <Form.Control className="form-dark-input shadow-none border" style={{ fontSize: '13px', opacity: settings.INSTAGRAM_ATIVO ? 1 : 0.6 }} type="url" name="LINK_INSTAGRAM" value={settings.LINK_INSTAGRAM || ''} onChange={handleChange} placeholder="https://instagram.com/seuperfil" disabled={!settings.INSTAGRAM_ATIVO} />
                        </Form.Group>

                        {/* TikTok */}
                        <Form.Group className="mb-3">
                            <div className="d-flex justify-content-between align-items-center mb-2">
                                <Form.Label className="mb-0 fw-semibold" style={{ fontSize: '13px', color: 'var(--text-primary)' }}><i className="bi bi-tiktok me-2 fs-5" style={{ color: 'var(--text-primary)' }}></i> TikTok</Form.Label>
                                <Form.Check type="switch" name="TIKTOK_ATIVO" checked={settings.TIKTOK_ATIVO} onChange={handleChange} />
                            </div>
                            <Form.Control className="form-dark-input shadow-none border" style={{ fontSize: '13px', opacity: settings.TIKTOK_ATIVO ? 1 : 0.6 }} type="url" name="LINK_TIKTOK" value={settings.LINK_TIKTOK || ''} onChange={handleChange} placeholder="https://tiktok.com/@seuperfil" disabled={!settings.TIKTOK_ATIVO} />
                        </Form.Group>
                    </div>
                </Col>
                
                {/* WhatsApp */}
                <Col lg={6}>
                    <div className="ps-lg-2">
                        <h6 className="fw-bold mb-4" style={{ color: 'var(--text-primary)' }}>Botão Flutuante (WhatsApp)</h6>
                        
                        <div className="p-4 rounded-4 border mb-4" style={{ backgroundColor: 'var(--bg-main)', borderColor: 'var(--border-color)', opacity: settings.WHATSAPP_ATIVO ? 1 : 0.7 }}>
                            <Form.Group className="mb-4">
                                <div className="d-flex justify-content-between align-items-center">
                                    <Form.Label className="mb-0 fw-semibold" style={{ fontSize: '13px', color: 'var(--text-primary)' }}><i className="bi bi-whatsapp me-2 fs-5 text-success"></i> Exibir botão na loja</Form.Label>
                                    <Form.Check type="switch" name="WHATSAPP_ATIVO" checked={settings.WHATSAPP_ATIVO} onChange={handleChange} />
                                </div>
                            </Form.Group>

                            <Form.Group className="mb-4">
                                <Form.Label className="fw-semibold mb-1" style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Número (Com DDD)</Form.Label>
                                <Form.Control className="form-dark-input shadow-none border" style={{ fontSize: '13px' }} type="text" name="WHATSAPP_NUMERO" value={settings.WHATSAPP_NUMERO || ''} onChange={handleChange} placeholder="Ex: 5511999998888" disabled={!settings.WHATSAPP_ATIVO} />
                            </Form.Group>

                            <Form.Group className="mb-2">
                                <Form.Label className="fw-semibold mb-1" style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Mensagem Inicial Automática</Form.Label>
                                <Form.Control className="form-dark-input shadow-none border" as="textarea" rows={3} style={{ fontSize: '13px', resize: 'none' }} name="WHATSAPP_MENSAGEM" value={settings.WHATSAPP_MENSAGEM || ''} onChange={handleChange} disabled={!settings.WHATSAPP_ATIVO} placeholder="Olá! Gostaria de saber mais..." />
                            </Form.Group>
                        </div>

                        <div className="d-grid mt-4">
                            <Button variant="dark" className="rounded-3 py-3 fw-semibold border-0 shadow-sm" onClick={handleSave} disabled={saving} style={{ backgroundColor: 'var(--text-primary)', color: 'var(--bg-sidebar)' }}>
                                {saving ? <Spinner as="span" animation="border" size="sm" className="me-2" /> : null}
                                Salvar Todas as Redes Sociais
                            </Button>
                        </div>
                    </div>
                </Col>
            </Row>

            <style>{`
                @media (min-width: 992px) {
                    .border-end-lg { border-right: 1px solid var(--border-color); }
                }
            `}</style>
        </div>
    );
};

export default SocialMediaManager;