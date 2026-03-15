import React, { useState, useEffect } from 'react';
import { Form, Button, Spinner, Alert, Card, Row, Col, Image } from 'react-bootstrap';
import api from '../../services/api';
import ImageUploader from '../../components/common/ImageUploader';

const HeroBannerManager = () => {
    const [settings, setSettings] = useState({
        HERO_BANNER_URL: '',
        HERO_BANNER_LINK: '',
        HERO_BANNER_TITLE: '',
        HERO_BANNER_SUBTITLE: '',
        HERO_BANNER_ACTIVE: false,
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const { data } = await api.get('/hero-banner/settings');
                data.HERO_BANNER_ACTIVE = data.HERO_BANNER_ACTIVE === 'true';
                setSettings(prev => ({...prev, ...data}));
            } catch (err) {
                setError('Não foi possível carregar as configurações do banner.');
            } finally {
                setLoading(false);
            }
        };
        fetchSettings();
    }, []);

    const handleChange = (e) => {
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
            await api.put('/hero-banner/settings', settings);
            setSuccess('Configurações guardadas com sucesso!');
        } catch (err) {
            setError('Não foi possível guardar as configurações.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="text-center"><Spinner /></div>;

    return (
        <Card className="shadow-sm">
            <Card.Header as="h4">Gerir Banner Principal</Card.Header>
            <Card.Body>
                {error && <Alert variant="danger">{error}</Alert>}
                {success && <Alert variant="success">{success}</Alert>}

                <Row>
                    <Col md={7}>
                        <ImageUploader 
                            label="Imagem do Banner (1920x1080)"
                            imageUrl={settings.HERO_BANNER_URL}
                            onImageUpload={(newUrl) => setSettings(prev => ({ ...prev, HERO_BANNER_URL: newUrl }))}
                        />
                        <Form.Group className="mb-3">
                            <Form.Label>Título do Banner</Form.Label>
                            <Form.Control type="text" name="HERO_BANNER_TITLE" value={settings.HERO_BANNER_TITLE || ''} onChange={handleChange} placeholder="Ex: Promoção de Verão" />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Subtítulo do Banner</Form.Label>
                            <Form.Control type="text" name="HERO_BANNER_SUBTITLE" value={settings.HERO_BANNER_SUBTITLE || ''} onChange={handleChange} placeholder="Ex: Até 50% de desconto!" />
                        </Form.Group>
                         <Form.Group className="mb-3">
                            <Form.Label>Link do Botão (para onde o cliente vai ao clicar)</Form.Label>
                            <Form.Control type="text" name="HERO_BANNER_LINK" value={settings.HERO_BANNER_LINK || ''} onChange={handleChange} placeholder="/categoria/promocoes" />
                        </Form.Group>
                        <Form.Check 
                            type="switch"
                            id="banner-switch"
                            label="Ativar banner na loja"
                            name="HERO_BANNER_ACTIVE"
                            checked={settings.HERO_BANNER_ACTIVE}
                            onChange={handleChange}
                            className="mb-3"
                        />
                    </Col>
                    <Col md={5}>
                        <h5>Pré-visualização</h5>
                        <div style={previewStyles.container(settings.HERO_BANNER_URL)}>
                            <div style={previewStyles.overlay}>
                                <h1 style={previewStyles.title}>{settings.HERO_BANNER_TITLE || 'Título de Exemplo'}</h1>
                                <p style={previewStyles.subtitle}>{settings.HERO_BANNER_SUBTITLE || 'Subtítulo de exemplo com uma chamada à ação.'}</p>
                                <Button variant="light" size="lg">Ver Agora</Button>
                            </div>
                        </div>
                    </Col>
                </Row>
                <hr />
                <div className="text-end">
                    <Button variant="primary" onClick={handleSave} disabled={saving}>
                        {saving ? <><Spinner as="span" size="sm" /> A guardar...</> : 'Guardar Banner'}
                    </Button>
                </div>
            </Card.Body>
        </Card>
    );
};

// Estilos para a pré-visualização
const previewStyles = {
    container: (bgImage) => ({
        position: 'relative',
        width: '100%',
        aspectRatio: '16 / 9',
        backgroundColor: '#ccc',
        backgroundImage: `url(${bgImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        borderRadius: '0.5rem',
        overflow: 'hidden'
    }),
    overlay: {
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        color: 'white',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        textAlign: 'center',
        padding: '1rem',
    },
    title: { fontWeight: 'bold' },
    subtitle: { fontSize: '1.2rem', maxWidth: '80%' }
};

export default HeroBannerManager;