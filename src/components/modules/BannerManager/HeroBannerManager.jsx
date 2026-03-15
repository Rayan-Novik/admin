import React, { useState, useEffect } from 'react';
import { Card, Button, Spinner, Alert, Form, Row, Col, InputGroup } from 'react-bootstrap';
import api from '../../../services/api';
import ImageUploader from '../../common/ImageUploader';

const HeroBannerManager = () => {
    // Estado inicial unificado para configurações
    const [settings, setSettings] = useState({ 
        HERO_BANNER_URL: '', 
        HERO_BANNER_LINK: '', 
        HERO_BANNER_TITLE: '', 
        HERO_BANNER_SUBTITLE: '', 
        HERO_BANNER_ACTIVE: false,
        // Adicionando cores personalizáveis para flexibilidade (opcional)
        HERO_BANNER_TEXT_COLOR: '#ffffff',
        HERO_BANNER_BTN_TEXT: 'Ver Agora'
    });
    
    // Estados auxiliares para construção do link
    const [targetType, setTargetType] = useState('url');
    const [targetValue, setTargetValue] = useState('');

    // Dados carregados
    const [categorias, setCategorias] = useState([]);
    const [marcas, setMarcas] = useState([]);
    const [produtos, setProdutos] = useState([]); // Cuidado com performance aqui se forem muitos produtos

    // Estados de UI
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState(null);

    // Carregamento inicial
    useEffect(() => {
        const loadAll = async () => {
            try {
                setLoading(true);
                const [sets, catRes, marcaRes, prodRes] = await Promise.all([
                    api.get('/hero-banner/settings'),
                    api.get('/categorias'),
                    api.get('/marcas').catch(() => ({ data: [] })),
                    api.get('/produtos?limit=50&sort=newest').catch(() => ({ data: [] })) // Limitando para performance
                ]);

                // Normaliza dados vindos da API
                const settingsData = sets.data;
                settingsData.HERO_BANNER_ACTIVE = String(settingsData.HERO_BANNER_ACTIVE) === 'true'; // Garante booleano
                
                setSettings(prev => ({ ...prev, ...settingsData }));
                setCategorias(catRes.data || []);
                setMarcas(marcaRes.data || []);
                setProdutos(prodRes.data.products || prodRes.data || []);

            } catch (e) {
                console.error("Erro ao carregar dados:", e);
                setMessage({ type: 'danger', text: 'Falha ao carregar configurações.' });
            } finally {
                setLoading(false);
            }
        };
        loadAll();
    }, []);

    // Atualiza configurações genéricas
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setSettings(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    // Lógica inteligente para gerar links internos
    useEffect(() => {
        let link = settings.HERO_BANNER_LINK; // Mantém o atual por padrão

        if (targetType === 'url') {
            // Se for manual, não sobrescreve automaticamente a menos que o usuário digite
            return; 
        } else if (targetValue) {
            switch (targetType) {
                case 'categoria': link = `/search?category=${targetValue}`; break;
                case 'subcategoria': link = `/search?subcategoria=${targetValue}`; break;
                case 'marca': link = `/search?brand=${targetValue}`; break;
                case 'produto': link = `/produto/${targetValue}`; break;
                default: break;
            }
            setSettings(prev => ({ ...prev, HERO_BANNER_LINK: link }));
        }
    }, [targetType, targetValue]);

    const handleSave = async () => {
        if (!settings.HERO_BANNER_URL) {
            setMessage({ type: 'warning', text: 'Você precisa enviar uma imagem para o banner.' });
            return;
        }

        setSaving(true);
        setMessage(null);
        try {
            await api.put('/hero-banner/settings', settings);
            setMessage({ type: 'success', text: 'Banner atualizado e publicado com sucesso!' });
        } catch (e) {
            setMessage({ type: 'danger', text: 'Erro ao salvar as configurações.' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="text-center p-5"><Spinner animation="border" variant="primary" /></div>;

    // Estilo do Preview (melhorado)
    const previewStyle = {
        container: {
            position: 'relative', 
            width: '100%', 
            aspectRatio: '16/9', // Padrão mais comum
            backgroundImage: `url(${settings.HERO_BANNER_URL})`, 
            backgroundSize: 'cover', 
            backgroundPosition: 'center',
            borderRadius: '12px', 
            overflow: 'hidden', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'flex-start', // Alinhamento padrão à esquerda
            padding: '40px',
            boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
        },
        overlay: {
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
            background: 'linear-gradient(90deg, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0) 100%)', 
            zIndex: 1
        },
        content: { 
            position: 'relative', 
            zIndex: 2, 
            color: settings.HERO_BANNER_TEXT_COLOR, 
            maxWidth: '60%',
            textAlign: 'left'
        }
    };

    return (
        <Card className="shadow-sm border-0 rounded-4 mb-4">
            <Card.Header className="bg-white border-0 pt-4 px-4 pb-0">
                <div className="d-flex justify-content-between align-items-center">
                    <h5 className="fw-bold text-dark mb-0">Gerenciar Banner Principal</h5>
                    <Form.Check 
                        type="switch" 
                        id="hero-active" 
                        label={settings.HERO_BANNER_ACTIVE ? "Ativo" : "Inativo"} 
                        name="HERO_BANNER_ACTIVE" 
                        checked={settings.HERO_BANNER_ACTIVE} 
                        onChange={handleChange} 
                        className="fw-bold text-primary" 
                    />
                </div>
            </Card.Header>
            <Card.Body className="p-4">
                {message && <Alert variant={message.type} onClose={() => setMessage(null)} dismissible>{message.text}</Alert>}
                
                <Row className="g-5">
                    {/* COLUNA ESQUERDA: Formulário */}
                    <Col lg={5}>
                        <div className="mb-4">
                            <label className="form-label fw-bold small text-muted text-uppercase">Imagem do Banner</label>
                            <ImageUploader 
                                label="Clique para carregar (Recomendado: 1920x600px)" 
                                imageUrl={settings.HERO_BANNER_URL} 
                                onImageUpload={url => setSettings({...settings, HERO_BANNER_URL: url})} 
                            />
                        </div>

                        <div className="mb-4">
                            <label className="form-label fw-bold small text-muted text-uppercase">Conteúdo</label>
                            <Form.Group className="mb-3">
                                <Form.Control 
                                    name="HERO_BANNER_TITLE" 
                                    value={settings.HERO_BANNER_TITLE} 
                                    onChange={handleChange} 
                                    placeholder="Título Principal (ex: Ofertas de Verão)"
                                    className="form-control-lg fw-bold"
                                />
                            </Form.Group>
                            <Form.Group className="mb-3">
                                <Form.Control 
                                    as="textarea" 
                                    rows={2}
                                    name="HERO_BANNER_SUBTITLE" 
                                    value={settings.HERO_BANNER_SUBTITLE} 
                                    onChange={handleChange} 
                                    placeholder="Subtítulo ou descrição curta..."
                                />
                            </Form.Group>
                            <Row>
                                <Col xs={6}>
                                    <Form.Group>
                                        <Form.Label className="small">Texto do Botão</Form.Label>
                                        <Form.Control 
                                            name="HERO_BANNER_BTN_TEXT" 
                                            value={settings.HERO_BANNER_BTN_TEXT || 'Ver Agora'} 
                                            onChange={handleChange} 
                                        />
                                    </Form.Group>
                                </Col>
                                <Col xs={6}>
                                    <Form.Group>
                                        <Form.Label className="small">Cor do Texto</Form.Label>
                                        <Form.Control 
                                            type="color"
                                            name="HERO_BANNER_TEXT_COLOR" 
                                            value={settings.HERO_BANNER_TEXT_COLOR || '#ffffff'} 
                                            onChange={handleChange} 
                                            className="w-100"
                                        />
                                    </Form.Group>
                                </Col>
                            </Row>
                        </div>

                        <div className="mb-4">
                            <label className="form-label fw-bold small text-muted text-uppercase">Destino do Clique</label>
                            <InputGroup className="mb-2">
                                <Form.Select 
                                    value={targetType} 
                                    onChange={(e) => { setTargetType(e.target.value); setTargetValue(''); }}
                                    style={{ maxWidth: '140px' }}
                                    className="bg-light border-end-0"
                                >
                                    <option value="url">Link Externo</option>
                                    <option value="categoria">Categoria</option>
                                    <option value="subcategoria">Subcategoria</option>
                                    <option value="marca">Marca</option>
                                    <option value="produto">Produto</option>
                                </Form.Select>

                                {targetType === 'url' ? (
                                    <Form.Control 
                                        name="HERO_BANNER_LINK" 
                                        value={settings.HERO_BANNER_LINK} 
                                        onChange={handleChange} 
                                        placeholder="https://..." 
                                    />
                                ) : (
                                    <Form.Select value={targetValue} onChange={(e) => setTargetValue(e.target.value)}>
                                        <option value="">Selecione...</option>
                                        {targetType === 'categoria' && categorias.map(c => <option key={c.id_categoria} value={c.nome}>{c.nome}</option>)}
                                        {targetType === 'subcategoria' && categorias.map(c => <optgroup key={c.id_categoria} label={c.nome}>{c.subcategorias?.map(s => <option key={s.id_subcategoria} value={s.nome}>{s.nome}</option>)}</optgroup>)}
                                        {targetType === 'marca' && marcas.map(m => <option key={m.id_marca} value={m.nome}>{m.nome}</option>)}
                                        {targetType === 'produto' && produtos.map(p => <option key={p.id_produto} value={p.id_produto}>{p.nome.substring(0, 30)}...</option>)}
                                    </Form.Select>
                                )}
                            </InputGroup>
                            {targetType !== 'url' && settings.HERO_BANNER_LINK && (
                                <div className="text-muted small ps-2">
                                    <i className="bi bi-link-45deg me-1"></i> 
                                    Link final: <code className="text-primary">{settings.HERO_BANNER_LINK}</code>
                                </div>
                            )}
                        </div>
                    </Col>

                    {/* COLUNA DIREITA: Preview */}
                    <Col lg={7}>
                        <div className="sticky-top" style={{ top: '20px' }}>
                            <div className="d-flex justify-content-between align-items-center mb-3">
                                <h6 className="fw-bold text-secondary mb-0">Pré-visualização em Tempo Real</h6>
                                <span className="badge bg-light text-dark border">Desktop Mode</span>
                            </div>
                            
                            <div className="border rounded-4 p-2 bg-light mb-4">
                                {settings.HERO_BANNER_URL ? (
                                    <div style={previewStyle.container}>
                                        <div style={previewStyle.overlay}></div>
                                        <div style={previewStyle.content}>
                                            <h2 className="fw-bold display-6 mb-2" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
                                                {settings.HERO_BANNER_TITLE || 'Título do Banner'}
                                            </h2>
                                            <p className="lead mb-4" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.3)', opacity: 0.9 }}>
                                                {settings.HERO_BANNER_SUBTITLE || 'Escreva um subtítulo atrativo para seus clientes.'}
                                            </p>
                                            <Button variant="primary" size="lg" className="rounded-pill px-4 fw-bold shadow-sm">
                                                {settings.HERO_BANNER_BTN_TEXT || 'Ver Agora'}
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center py-5 rounded-4 bg-white border border-dashed" style={{ aspectRatio: '16/9', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                                        <i className="bi bi-card-image display-1 text-muted opacity-25 mb-3"></i>
                                        <p className="text-muted">Faça upload de uma imagem para ver o resultado.</p>
                                    </div>
                                )}
                            </div>

                            <div className="d-grid">
                                <Button variant="success" size="lg" onClick={handleSave} disabled={saving} className="fw-bold shadow">
                                    {saving ? <Spinner size="sm" className="me-2" /> : <i className="bi bi-check-lg me-2"></i>}
                                    Salvar e Publicar Banner
                                </Button>
                            </div>
                        </div>
                    </Col>
                </Row>
            </Card.Body>
        </Card>
    );
};

export default HeroBannerManager;