import React, { useState, useEffect, useRef } from 'react';
import { Card, Button, Spinner, Alert, Form, Row, Col, InputGroup, Accordion } from 'react-bootstrap';
import api from '../../../services/api';
import ImageUploader from '../../common/ImageUploader';

const HeroBannerManager = () => {
    const [settings, setSettings] = useState({
        HERO_BANNER_URL: '',
        HERO_BANNER_LINK: '',
        HERO_BANNER_TITLE: '',
        HERO_BANNER_SUBTITLE: '',
        HERO_BANNER_ACTIVE: false,
        HERO_BANNER_BTN_TEXT: 'Ver Agora',
        HERO_BANNER_TITLE_COLOR: '#ffffff',
        HERO_BANNER_SUB_COLOR: '#ffffff',
        HERO_BANNER_BTN_BG: '#2563EB',
        HERO_BANNER_BTN_TEXT_COLOR: '#ffffff',
        HERO_BANNER_BTN_RADIUS: 50,
        HERO_BANNER_TITLE_SIZE: 48,
        HERO_BANNER_TITLE_ROTATION: 0,
        HERO_BANNER_SUB_SIZE: 20,
        HERO_BANNER_SUB_ROTATION: 0,
        // Posições Individuais
        HERO_BANNER_TITLE_POS_X: 50, HERO_BANNER_TITLE_POS_Y: 30,
        HERO_BANNER_SUB_POS_X: 50, HERO_BANNER_SUB_POS_Y: 50,
        HERO_BANNER_BTN_POS_X: 50, HERO_BANNER_BTN_POS_Y: 70,
        // Novas Propriedades de Estilo do Texto
        HERO_BANNER_TITLE_BOLD: false,
        HERO_BANNER_TITLE_BG: '#00000000',
        HERO_BANNER_TITLE_PADDING: 0,
        HERO_BANNER_TITLE_RADIUS: 0,
        HERO_BANNER_SUB_BOLD: false,
        HERO_BANNER_SUB_BG: '#00000000',
        HERO_BANNER_SUB_PADDING: 0,
        HERO_BANNER_SUB_RADIUS: 0,
        HERO_BANNER_HEIGHT: 500
    });

    const [targetType, setTargetType] = useState('url');
    const [targetValue, setTargetValue] = useState('');

    const [categorias, setCategorias] = useState([]);
    const [marcas, setMarcas] = useState([]);
    const [produtos, setProdutos] = useState([]);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState(null);

    // 🟢 Lógica de Arrastar Independente (Drag & Drop)
    const previewRef = useRef(null);
    const [draggingElement, setDraggingElement] = useState(null);

    const handleMouseDown = (e, element) => {
        e.preventDefault();
        e.stopPropagation();
        setDraggingElement(element);
    };

    const handleMouseUp = () => {
        setDraggingElement(null);
    };

    const handleMouseMove = (e) => {
        if (!draggingElement || !previewRef.current) return;
        const rect = previewRef.current.getBoundingClientRect();
        let x = ((e.clientX - rect.left) / rect.width) * 100;
        let y = ((e.clientY - rect.top) / rect.height) * 100;
        x = Math.max(0, Math.min(100, x));
        y = Math.max(0, Math.min(100, y));

        if (draggingElement === 'title') {
            setSettings(prev => ({ ...prev, HERO_BANNER_TITLE_POS_X: x, HERO_BANNER_TITLE_POS_Y: y }));
        } else if (draggingElement === 'subtitle') {
            setSettings(prev => ({ ...prev, HERO_BANNER_SUB_POS_X: x, HERO_BANNER_SUB_POS_Y: y }));
        } else if (draggingElement === 'button') {
            setSettings(prev => ({ ...prev, HERO_BANNER_BTN_POS_X: x, HERO_BANNER_BTN_POS_Y: y }));
        }
    };

    useEffect(() => {
        if (draggingElement) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        } else {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [draggingElement, settings]);


    useEffect(() => {
        const loadAll = async () => {
            try {
                setLoading(true);
                const [sets, catRes, marcaRes, prodRes] = await Promise.all([
                    api.get('/hero-banner/settings').catch((e) => {
                        if (e.response?.status === 403) throw new Error("403_READ");
                        return { data: {} };
                    }),
                    api.get('/categorias').catch(() => ({ data: [] })),
                    api.get('/marcas').catch(() => ({ data: [] })),
                    api.get('/produtos?limit=50&sort=newest').catch(() => ({ data: [] }))
                ]);

                const settingsData = sets.data || {};

                // Força leitura de booleanos
                ['HERO_BANNER_ACTIVE', 'HERO_BANNER_TITLE_BOLD', 'HERO_BANNER_SUB_BOLD'].forEach(key => {
                    if (settingsData.hasOwnProperty(key)) {
                        settingsData[key] = String(settingsData[key]) === 'true';
                    }
                });

                // Força leitura de números
                [
                    'HERO_BANNER_TITLE_POS_X', 'HERO_BANNER_TITLE_POS_Y',
                    'HERO_BANNER_SUB_POS_X', 'HERO_BANNER_SUB_POS_Y',
                    'HERO_BANNER_BTN_POS_X', 'HERO_BANNER_BTN_POS_Y',
                    'HERO_BANNER_BTN_RADIUS', 'HERO_BANNER_TITLE_SIZE', 'HERO_BANNER_TITLE_ROTATION',
                    'HERO_BANNER_TITLE_PADDING', 'HERO_BANNER_TITLE_RADIUS',
                    'HERO_BANNER_SUB_SIZE', 'HERO_BANNER_SUB_ROTATION',
                    'HERO_BANNER_SUB_PADDING', 'HERO_BANNER_SUB_RADIUS'
                ].forEach(key => {
                    if (settingsData[key] !== undefined) {
                        settingsData[key] = parseFloat(settingsData[key]);
                    }
                });

                setSettings(prev => ({ ...prev, ...settingsData }));
                setCategorias(catRes.data || []);
                setMarcas(marcaRes.data || []);
                setProdutos(prodRes.data?.products || prodRes.data || []);

            } catch (e) {
                console.error("Erro ao carregar dados:", e);
                setMessage({ type: 'danger', text: 'Falha ao carregar configurações.' });
            } finally {
                setLoading(false);
            }
        };
        loadAll();
    }, []);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setSettings(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleSliderChange = (e) => {
        const { name, value } = e.target;
        setSettings(prev => ({ ...prev, [name]: parseFloat(value) }));
    };

    useEffect(() => {
        let link = settings.HERO_BANNER_LINK;
        if (targetType === 'url') { return; }
        else if (targetValue) {
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
            setMessage({ type: 'danger', text: 'Falha ao salvar as configurações.' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="text-center p-5"><Spinner animation="border" variant="primary" /></div>;

    const previewStyle = {
        container: {
            position: 'relative',
            width: '100%',
            // 🟢 Altura dinâmica baseada no Slider (padrão 500px se estiver vazio)
            height: `${settings.HERO_BANNER_HEIGHT || 500}px`,
            backgroundImage: `url(${settings.HERO_BANNER_URL})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            borderRadius: '12px',
            overflow: 'hidden',
            boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
        },
        draggable: (typeKey, posX, posY) => ({
            position: 'absolute',
            left: `${posX}%`,
            top: `${posY}%`,
            transform: 'translate(-50%, -50%)',
            cursor: draggingElement === typeKey ? 'grabbing' : 'grab',
            zIndex: draggingElement === typeKey ? 10 : 2,
            textAlign: 'center',
            padding: '5px',
            border: draggingElement === typeKey ? '2px dashed #000' : '1px dashed #999',
            backgroundColor: draggingElement === typeKey ? 'rgba(255,255,255,0.3)' : 'transparent',
            borderRadius: '8px',
            transition: draggingElement === typeKey ? 'none' : 'border 0.2s ease, background-color 0.2s ease',
            whiteSpace: 'nowrap',
            pointerEvents: 'auto'
        })
    };

    return (
        <Card className="shadow-sm border-0 rounded-4 mb-4">
            <style>{`
                .drag-element:hover {
                    background-color: rgba(255, 255, 255, 0.15) !important;
                    border: 1px dashed #333 !important;
                }
            `}</style>

            <Card.Header className="bg-white border-0 pt-4 px-4 pb-0">
                <div className="d-flex justify-content-between align-items-center">
                    <h5 className="fw-bold text-dark mb-0">Gerenciar Banner Principal</h5>
                    <Form.Check type="switch" id="hero-active" label={settings.HERO_BANNER_ACTIVE ? "Ativo" : "Inativo"} name="HERO_BANNER_ACTIVE" checked={settings.HERO_BANNER_ACTIVE} onChange={handleChange} className="fw-bold text-primary" />
                </div>
            </Card.Header>
            <Card.Body className="p-4">
                {message && <Alert variant={message.type} onClose={() => setMessage(null)} dismissible>{message.text}</Alert>}

                <Row className="g-5">
                    <Col lg={5}>
                        <div className="mb-4">
                            <label className="form-label fw-bold small text-muted text-uppercase">1. Imagem de Fundo</label>
                            <ImageUploader label="Clique para carregar (1920x1080px ideal)" imageUrl={settings.HERO_BANNER_URL} onImageUpload={url => setSettings({ ...settings, HERO_BANNER_URL: url })} />

                            {/* 🟢 SLIDER DE ALTURA ADICIONADO AQUI */}
                            <div className="mt-3 bg-white p-3 rounded border">
                                <Form.Label className="small fw-bold mb-0 text-dark">Altura do Banner: {settings.HERO_BANNER_HEIGHT}px</Form.Label>
                                <Form.Range name="HERO_BANNER_HEIGHT" value={settings.HERO_BANNER_HEIGHT} onChange={handleSliderChange} min={200} max={1000} />
                            </div>
                        </div>

                        <div className="mb-4">
                            <label className="form-label fw-bold small text-muted text-uppercase mb-2">2. Personalização Livre</label>

                            <Accordion defaultActiveKey="0" className="shadow-sm">
                                {/* TÍTULO */}
                                <Accordion.Item eventKey="0">
                                    <Accordion.Header className="fw-bold">H1 - Título Principal</Accordion.Header>
                                    <Accordion.Body className="bg-light">
                                        <Row className="mb-3 g-2">
                                            <Col xs={7}><Form.Control name="HERO_BANNER_TITLE" value={settings.HERO_BANNER_TITLE} onChange={handleChange} placeholder="Texto do título..." /></Col>
                                            <Col xs={2}><Form.Control type="color" name="HERO_BANNER_TITLE_COLOR" value={settings.HERO_BANNER_TITLE_COLOR} onChange={handleChange} className="w-100 p-1 h-100" title="Cor Texto" /></Col>
                                            <Col xs={3}><Form.Control type="color" name="HERO_BANNER_TITLE_BG" value={settings.HERO_BANNER_TITLE_BG || '#ffffff00'} onChange={handleChange} className="w-100 p-1 h-100" title="Cor Fundo" /></Col>
                                        </Row>
                                        <div className="mb-3">
                                            <Form.Check type="checkbox" label="Negrito (Bold)" name="HERO_BANNER_TITLE_BOLD" checked={!!settings.HERO_BANNER_TITLE_BOLD} onChange={handleChange} className="fw-bold" />
                                        </div>
                                        <Row className="g-3">
                                            <Col xs={6}><Form.Label className="small fw-bold mb-0 text-muted">Tamanho: {settings.HERO_BANNER_TITLE_SIZE}px</Form.Label><Form.Range name="HERO_BANNER_TITLE_SIZE" value={settings.HERO_BANNER_TITLE_SIZE} onChange={handleSliderChange} min={10} max={120} /></Col>
                                            <Col xs={6}><Form.Label className="small fw-bold mb-0 text-muted">Girar: {settings.HERO_BANNER_TITLE_ROTATION}º</Form.Label><Form.Range name="HERO_BANNER_TITLE_ROTATION" value={settings.HERO_BANNER_TITLE_ROTATION} onChange={handleSliderChange} min={-180} max={180} /></Col>
                                            <Col xs={6}><Form.Label className="small fw-bold mb-0 text-muted">Padding: {settings.HERO_BANNER_TITLE_PADDING}px</Form.Label><Form.Range name="HERO_BANNER_TITLE_PADDING" value={settings.HERO_BANNER_TITLE_PADDING} onChange={handleSliderChange} min={0} max={50} /></Col>
                                            <Col xs={6}><Form.Label className="small fw-bold mb-0 text-muted">Borda: {settings.HERO_BANNER_TITLE_RADIUS}px</Form.Label><Form.Range name="HERO_BANNER_TITLE_RADIUS" value={settings.HERO_BANNER_TITLE_RADIUS} onChange={handleSliderChange} min={0} max={50} /></Col>
                                        </Row>
                                    </Accordion.Body>
                                </Accordion.Item>

                                {/* SUBTÍTULO */}
                                <Accordion.Item eventKey="1">
                                    <Accordion.Header className="fw-bold">H2 - Subtítulo</Accordion.Header>
                                    <Accordion.Body className="bg-light">
                                        <Row className="mb-3 g-2">
                                            <Col xs={7}><Form.Control as="textarea" rows={2} name="HERO_BANNER_SUBTITLE" value={settings.HERO_BANNER_SUBTITLE} onChange={handleChange} placeholder="Subtítulo..." /></Col>
                                            <Col xs={2}><Form.Control type="color" name="HERO_BANNER_SUB_COLOR" value={settings.HERO_BANNER_SUB_COLOR} onChange={handleChange} className="w-100 p-1 h-100" title="Cor Texto" /></Col>
                                            <Col xs={3}><Form.Control type="color" name="HERO_BANNER_SUB_BG" value={settings.HERO_BANNER_SUB_BG || '#ffffff00'} onChange={handleChange} className="w-100 p-1 h-100" title="Cor Fundo" /></Col>
                                        </Row>
                                        <div className="mb-3">
                                            <Form.Check type="checkbox" label="Negrito (Bold)" name="HERO_BANNER_SUB_BOLD" checked={!!settings.HERO_BANNER_SUB_BOLD} onChange={handleChange} className="fw-bold" />
                                        </div>
                                        <Row className="g-3">
                                            <Col xs={6}><Form.Label className="small fw-bold mb-0 text-muted">Tamanho: {settings.HERO_BANNER_SUB_SIZE}px</Form.Label><Form.Range name="HERO_BANNER_SUB_SIZE" value={settings.HERO_BANNER_SUB_SIZE} onChange={handleSliderChange} min={10} max={80} /></Col>
                                            <Col xs={6}><Form.Label className="small fw-bold mb-0 text-muted">Girar: {settings.HERO_BANNER_SUB_ROTATION}º</Form.Label><Form.Range name="HERO_BANNER_SUB_ROTATION" value={settings.HERO_BANNER_SUB_ROTATION} onChange={handleSliderChange} min={-180} max={180} /></Col>
                                            <Col xs={6}><Form.Label className="small fw-bold mb-0 text-muted">Padding: {settings.HERO_BANNER_SUB_PADDING}px</Form.Label><Form.Range name="HERO_BANNER_SUB_PADDING" value={settings.HERO_BANNER_SUB_PADDING} onChange={handleSliderChange} min={0} max={50} /></Col>
                                            <Col xs={6}><Form.Label className="small fw-bold mb-0 text-muted">Borda: {settings.HERO_BANNER_SUB_RADIUS}px</Form.Label><Form.Range name="HERO_BANNER_SUB_RADIUS" value={settings.HERO_BANNER_SUB_RADIUS} onChange={handleSliderChange} min={0} max={50} /></Col>
                                        </Row>
                                    </Accordion.Body>
                                </Accordion.Item>

                                {/* BOTÃO */}
                                <Accordion.Item eventKey="2">
                                    <Accordion.Header className="fw-bold">Botão de Ação</Accordion.Header>
                                    <Accordion.Body className="bg-light">
                                        <Row className="mb-3 g-2">
                                            <Col xs={6}><Form.Control name="HERO_BANNER_BTN_TEXT" value={settings.HERO_BANNER_BTN_TEXT} onChange={handleChange} placeholder="Texto..." /></Col>
                                            <Col xs={3}>
                                                <Form.Label className="small fw-bold mb-0">Fundo</Form.Label>
                                                <Form.Control type="color" name="HERO_BANNER_BTN_BG" value={settings.HERO_BANNER_BTN_BG} onChange={handleChange} className="w-100 p-0 shadow-sm" style={{ height: '30px' }} />
                                            </Col>
                                            <Col xs={3}>
                                                <Form.Label className="small fw-bold mb-0">Texto</Form.Label>
                                                <Form.Control type="color" name="HERO_BANNER_BTN_TEXT_COLOR" value={settings.HERO_BANNER_BTN_TEXT_COLOR} onChange={handleChange} className="w-100 p-0 shadow-sm" style={{ height: '30px' }} />
                                            </Col>
                                        </Row>
                                        <div className="px-2">
                                            <Form.Label className="small fw-bold mb-0 text-muted">
                                                Formato: {settings.HERO_BANNER_BTN_RADIUS === 0 ? 'Quadrado' : settings.HERO_BANNER_BTN_RADIUS >= 50 ? 'Redondo' : 'Bordas Suaves'} ({settings.HERO_BANNER_BTN_RADIUS}px)
                                            </Form.Label>
                                            <Form.Range name="HERO_BANNER_BTN_RADIUS" value={settings.HERO_BANNER_BTN_RADIUS} onChange={handleSliderChange} min={0} max={50} />
                                        </div>
                                    </Accordion.Body>
                                </Accordion.Item>
                            </Accordion>
                        </div>

                        {/* Seção 3: Link */}
                        <div className="mb-4">
                            <label className="form-label fw-bold small text-muted text-uppercase">3. Destino do Clique</label>
                            <InputGroup className="mb-2 shadow-sm">
                                <Form.Select value={targetType} onChange={(e) => { setTargetType(e.target.value); setTargetValue(''); }} style={{ maxWidth: '140px' }} className="bg-light border-end-0 fw-bold text-secondary">
                                    <option value="url">Link Externo</option>
                                    <option value="categoria">Categoria</option>
                                    <option value="subcategoria">Subcategoria</option>
                                    <option value="marca">Marca</option>
                                    <option value="produto">Produto</option>
                                </Form.Select>
                                {targetType === 'url' ? (
                                    <Form.Control name="HERO_BANNER_LINK" value={settings.HERO_BANNER_LINK} onChange={handleChange} placeholder="Ex: https://..." />
                                ) : (
                                    <Form.Select value={targetValue} onChange={(e) => setTargetValue(e.target.value)}>
                                        <option value="">Selecione...</option>
                                        {targetType === 'categoria' && categorias.map(c => <option key={c.id_categoria} value={c.nome}>{c.nome}</option>)}
                                        {targetType === 'produto' && produtos.map(p => <option key={p.id_produto} value={p.id_produto}>{p.nome.substring(0, 30)}...</option>)}
                                    </Form.Select>
                                )}
                            </InputGroup>
                        </div>
                    </Col>

                    {/* COLUNA DIREITA: Preview */}
                    <Col lg={7}>
                        <div className="sticky-lg-top" style={{ top: '20px', zIndex: 10 }}>
                            <div className="d-flex justify-content-between align-items-center mb-3">
                                <h6 className="fw-bold text-secondary mb-0"><i className="bi bi-eye me-2"></i>Pré-visualização</h6>
                                <span className="badge bg-primary text-white shadow-sm border">Arraste Título, Subtítulo ou Botão</span>
                            </div>

                            <div className="border rounded-4 p-2 bg-light mb-4 shadow-sm" ref={previewRef}>
                                {settings.HERO_BANNER_URL ? (
                                    <div style={previewStyle.container}>

                                        {/* TÍTULO - Arrastável Individual */}
                                        {settings.HERO_BANNER_TITLE && (
                                            <div
                                                onMouseDown={(e) => handleMouseDown(e, 'title')}
                                                className="drag-element"
                                                style={previewStyle.draggable('title', settings.HERO_BANNER_TITLE_POS_X, settings.HERO_BANNER_TITLE_POS_Y)}
                                            >
                                                <h2 className="m-0" style={{
                                                    color: settings.HERO_BANNER_TITLE_COLOR,
                                                    fontSize: `${settings.HERO_BANNER_TITLE_SIZE}px`,
                                                    fontWeight: settings.HERO_BANNER_TITLE_BOLD ? '800' : '400',
                                                    transform: `rotate(${settings.HERO_BANNER_TITLE_ROTATION}deg)`,
                                                    backgroundColor: settings.HERO_BANNER_TITLE_BG,
                                                    padding: `${settings.HERO_BANNER_TITLE_PADDING}px`,
                                                    borderRadius: `${settings.HERO_BANNER_TITLE_RADIUS}px`,
                                                    display: 'inline-block',
                                                    pointerEvents: 'none'
                                                }}>
                                                    {settings.HERO_BANNER_TITLE}
                                                </h2>
                                            </div>
                                        )}

                                        {/* SUBTÍTULO - Arrastável Individual */}
                                        {settings.HERO_BANNER_SUBTITLE && (
                                            <div
                                                onMouseDown={(e) => handleMouseDown(e, 'subtitle')}
                                                className="drag-element"
                                                style={previewStyle.draggable('subtitle', settings.HERO_BANNER_SUB_POS_X, settings.HERO_BANNER_SUB_POS_Y)}
                                            >
                                                <p className="m-0" style={{
                                                    color: settings.HERO_BANNER_SUB_COLOR,
                                                    fontSize: `${settings.HERO_BANNER_SUB_SIZE}px`,
                                                    fontWeight: settings.HERO_BANNER_SUB_BOLD ? '700' : '400',
                                                    transform: `rotate(${settings.HERO_BANNER_SUB_ROTATION}deg)`,
                                                    backgroundColor: settings.HERO_BANNER_SUB_BG,
                                                    padding: `${settings.HERO_BANNER_SUB_PADDING}px`,
                                                    borderRadius: `${settings.HERO_BANNER_SUB_RADIUS}px`,
                                                    display: 'inline-block',
                                                    pointerEvents: 'none'
                                                }}>
                                                    {settings.HERO_BANNER_SUBTITLE}
                                                </p>
                                            </div>
                                        )}

                                        {/* BOTÃO - Arrastável Individual */}
                                        {settings.HERO_BANNER_BTN_TEXT && (
                                            <div
                                                onMouseDown={(e) => handleMouseDown(e, 'button')}
                                                className="drag-element"
                                                style={previewStyle.draggable('button', settings.HERO_BANNER_BTN_POS_X, settings.HERO_BANNER_BTN_POS_Y)}
                                            >
                                                <span className="d-inline-block px-4 py-2 fw-bold shadow-sm" style={{
                                                    backgroundColor: settings.HERO_BANNER_BTN_BG,
                                                    color: settings.HERO_BANNER_BTN_TEXT_COLOR,
                                                    borderRadius: `${settings.HERO_BANNER_BTN_RADIUS}px`,
                                                    fontSize: '1.1rem',
                                                    pointerEvents: 'none'
                                                }}>
                                                    {settings.HERO_BANNER_BTN_TEXT}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="text-center py-5 rounded-4 bg-white border border-dashed" style={{ aspectRatio: '16/9', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                                        <i className="bi bi-card-image display-1 text-muted opacity-25 mb-3"></i>
                                    </div>
                                )}
                            </div>

                            <div className="d-grid mt-4">
                                <Button variant="success" size="lg" onClick={handleSave} disabled={saving} className="fw-bold shadow rounded-pill">
                                    {saving ? <Spinner size="sm" className="me-2" /> : <i className="bi bi-check-lg me-2"></i>} Salvar Banner
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