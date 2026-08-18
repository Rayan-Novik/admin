import React, { useState, useEffect } from 'react';
import { Button, Spinner, Card, Row, Col, Form } from 'react-bootstrap';
import { Trash2, Images } from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../../../services/api';
import ImageUploader from '../../common/ImageUploader';

const GaleriaManager = () => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    
    // 🟢 O estado agora guarda as cores dos textos também
    const [config, setConfig] = useState({
        bgColor: 'transparent',
        titleColor: '#111827',
        subtitleColor: '#6B7280',
        imagens: []
    });

    useEffect(() => {
        const loadData = async () => {
            try {
                const res = await api.get('/configuracoes/GALERIA_AGENDAMENTO').catch(() => ({ data: null }));
                if (res.data && res.data.valor) {
                    const parsed = JSON.parse(res.data.valor);
                    if (Array.isArray(parsed)) {
                        setConfig({ bgColor: 'transparent', titleColor: '#111827', subtitleColor: '#6B7280', imagens: parsed });
                    } else {
                        // Mescla os dados salvos com os padrões caso falte alguma cor
                        setConfig({
                            bgColor: parsed.bgColor || 'transparent',
                            titleColor: parsed.titleColor || '#111827',
                            subtitleColor: parsed.subtitleColor || '#6B7280',
                            imagens: parsed.imagens || []
                        });
                    }
                }
            } catch (error) {
                toast.error("Erro ao carregar a galeria.");
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    const handleChange = (field, value) => {
        setConfig({ ...config, [field]: value });
    };

    const addImagem = (url) => {
        if (!url) return;
        const newImage = { id: Date.now().toString(), url };
        setConfig({ ...config, imagens: [...config.imagens, newImage] });
    };

    const removeImagem = (id) => {
        setConfig({ ...config, imagens: config.imagens.filter(img => img.id !== id) });
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await api.post('/configuracoes', {
                chave: 'GALERIA_AGENDAMENTO',
                valor: JSON.stringify(config)
            });
            toast.success('Galeria salva com sucesso!');
        } catch (error) {
            toast.error('Erro ao salvar a galeria.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="text-center p-5"><Spinner animation="border" /></div>;

    return (
        <Card className="border-0 shadow-none bg-transparent">
            <Card.Body className="p-0">
                <div className="d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom">
                    <div>
                        <h5 className="fw-bold text-dark mb-1"><Images className="me-2 text-primary"/> Galeria de Trabalhos</h5>
                        <p className="text-muted small mb-0">Adicione fotos do seu portfólio e edite as cores da seção.</p>
                    </div>
                    <Button variant="success" className="fw-bold px-4 rounded-pill shadow-sm" onClick={handleSave} disabled={saving}>
                        {saving ? <Spinner size="sm" /> : 'Salvar Galeria'}
                    </Button>
                </div>

                <Row className="g-4">
                    {/* 🟢 COLUNA ESQUERDA: CORES E UPLOADER */}
                    <Col lg={4}>
                        <Card className="border-1 border-light shadow-sm rounded-4 mb-4">
                            <Card.Body>
                                <h6 className="fw-bold text-primary mb-3">Estilos da Seção</h6>
                                
                                <Form.Group className="mb-3">
                                    <Form.Label className="small fw-bold text-muted d-block">Cor de Fundo da Galeria</Form.Label>
                                    <div className="d-flex gap-2 align-items-center">
                                        <Form.Control 
                                            type="color" 
                                            value={config.bgColor === 'transparent' ? '#ffffff' : config.bgColor} 
                                            onChange={(e) => handleChange('bgColor', e.target.value)} 
                                            className="p-1 rounded shadow-sm" 
                                            style={{ height: '38px', width: '60px' }} 
                                        />
                                        <Button 
                                            variant="outline-secondary" 
                                            size="sm" 
                                            onClick={() => handleChange('bgColor', 'transparent')}
                                        >
                                            Transparente
                                        </Button>
                                    </div>
                                </Form.Group>

                                <Row className="g-2 mb-4">
                                    <Col xs={6}>
                                        <Form.Group>
                                            <Form.Label className="small fw-bold text-muted d-block">Cor do Título (H2)</Form.Label>
                                            <Form.Control 
                                                type="color" 
                                                value={config.titleColor} 
                                                onChange={(e) => handleChange('titleColor', e.target.value)} 
                                                className="w-100 p-1 rounded shadow-sm" 
                                                style={{ height: '38px' }} 
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col xs={6}>
                                        <Form.Group>
                                            <Form.Label className="small fw-bold text-muted d-block">Cor Subtítulo (P)</Form.Label>
                                            <Form.Control 
                                                type="color" 
                                                value={config.subtitleColor} 
                                                onChange={(e) => handleChange('subtitleColor', e.target.value)} 
                                                className="w-100 p-1 rounded shadow-sm" 
                                                style={{ height: '38px' }} 
                                            />
                                        </Form.Group>
                                    </Col>
                                </Row>
                                
                                <h6 className="fw-bold text-primary mb-3 pt-3 border-top">Adicionar Nova Foto</h6>
                                <ImageUploader 
                                    imageUrl="" 
                                    onImageUpload={(url) => addImagem(url)} 
                                    label="Faça o upload de uma imagem 1:1 (Quadrada)"
                                />
                            </Card.Body>
                        </Card>
                    </Col>

                    {/* COLUNA DIREITA: LISTA DE FOTOS */}
                    <Col lg={8}>
                        {config.imagens.length === 0 ? (
                            <div className="text-center p-5 bg-white rounded-4 border border-dashed">
                                <p className="text-muted mb-0">Nenhuma imagem na galeria. Faça o upload ao lado.</p>
                            </div>
                        ) : (
                            <Row className="g-3">
                                {config.imagens.map((img) => (
                                    <Col xs={6} sm={4} md={3} key={img.id}>
                                        <div className="position-relative rounded-3 overflow-hidden border shadow-sm group">
                                            <img src={img.url} alt="Galeria" className="w-100 object-fit-cover" style={{ aspectRatio: '1/1' }} />
                                            <Button 
                                                variant="danger" 
                                                size="sm" 
                                                className="position-absolute top-0 end-0 m-2 rounded-circle shadow-sm"
                                                onClick={() => removeImagem(img.id)}
                                            >
                                                <Trash2 size={14} />
                                            </Button>
                                        </div>
                                    </Col>
                                ))}
                            </Row>
                        )}
                    </Col>
                </Row>
            </Card.Body>
        </Card>
    );
};

export default GaleriaManager;