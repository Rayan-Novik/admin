import React, { useState, useEffect } from 'react';
import { Button, Spinner, Form, Card, Row, Col, Alert } from 'react-bootstrap';
import { toast } from 'react-toastify';
import api from '../../../services/api';
import ImageUploader from '../../common/ImageUploader';

const AgendaBannerManager = () => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    
    // Listas para os Selects Inteligentes
    const [categorias, setCategorias] = useState([]);
    const [marcas, setMarcas] = useState([]);
    const [produtos, setProdutos] = useState([]);

    const [formData, setFormData] = useState({
        imagem_url: '',
        ativo: false,
        tipo_filtro: 'none', // none, url, categoria, subcategoria, marca, produto
        valor_filtro: '',
        link_url: ''
    });

    useEffect(() => {
        const loadData = async () => {
            try {
                // 1. Busca a configuração salva do banco
                const resConfig = await api.get('/configuracoes/BANNER_AGENDAMENTO').catch(() => ({ data: null }));
                if (resConfig.data && resConfig.data.valor) {
                    setFormData(JSON.parse(resConfig.data.valor));
                }

                // 2. Busca os dados para preencher os selects
                const [catRes, marcaRes, prodRes] = await Promise.all([
                    api.get('/categorias').catch(() => ({ data: [] })),
                    api.get('/marcas').catch(() => ({ data: [] })),
                    api.get('/produtos?limit=100').catch(() => ({ data: [] }))
                ]);
                
                setCategorias(catRes.data || []);
                setMarcas(marcaRes.data || []);
                setProdutos(prodRes.data.products || prodRes.data || []);

            } catch (error) {
                console.error("Erro ao carregar dados:", error);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, []);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    // Monta a URL automaticamente de acordo com o item selecionado
    const handleValueSelectChange = (e) => {
        const selectedValue = e.target.value;
        let update = { valor_filtro: selectedValue };
        
        if (formData.tipo_filtro === 'categoria') update.link_url = `/search?category=${selectedValue}`;
        else if (formData.tipo_filtro === 'marca') update.link_url = `/search?brand=${selectedValue}`;
        else if (formData.tipo_filtro === 'produto') update.link_url = `/agendar/${selectedValue}`; // 🟢 Redireciona pro Agendamento do serviço!
        else if (formData.tipo_filtro === 'subcategoria') update.link_url = `/search?subcategoria=${selectedValue}`;
        
        setFormData(prev => ({ ...prev, ...update }));
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await api.post('/configuracoes', {
                chave: 'BANNER_AGENDAMENTO',
                valor: JSON.stringify(formData)
            });
            toast.success('Banner de Agendamento salvo com sucesso!');
        } catch (error) {
            toast.error('Erro ao salvar o banner.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="text-center p-5"><Spinner animation="border" variant="primary" /></div>;

    return (
        <Card className="border-0 shadow-sm rounded-4">
            <Card.Body className="p-4">
                <div className="mb-4 pb-3 border-bottom">
                    <h5 className="fw-bold text-dark mb-1">Banner Principal de Serviços</h5>
                    <p className="text-muted small mb-0">Esta imagem aparecerá no topo da tela pública de agendamentos.</p>
                </div>

                <Form onSubmit={handleSave}>
                    <Row className="g-4">
                        <Col md={12}>
                            <ImageUploader
                                label="Imagem do Banner (Recomendado: 1920x600px para Desktop / 1080x1920px para focar no Mobile)"
                                imageUrl={formData.imagem_url}
                                onImageUpload={(newUrl) => setFormData(prev => ({ ...prev, imagem_url: newUrl }))}
                            />
                        </Col>

                        <Col md={12}><hr className="my-2 text-muted opacity-25" /></Col>

                        <Col md={6}>
                            <Form.Group>
                                <Form.Label className="fw-bold small text-muted text-uppercase">O banner é clicável?</Form.Label>
                                <Form.Select 
                                    name="tipo_filtro" 
                                    value={formData.tipo_filtro} 
                                    onChange={(e) => { handleChange(e); setFormData(prev => ({...prev, valor_filtro: '', link_url: ''})); }}
                                >
                                    <option value="none">Não, será apenas uma imagem fixa</option>
                                    <option value="url">Sim, Link Personalizado (URL externa)</option>
                                    <option value="produto">Sim, abrir a página de um Serviço Específico</option>
                                    <option value="categoria">Sim, abrir Categoria</option>
                                    <option value="marca">Sim, abrir Marca</option>
                                </Form.Select>
                            </Form.Group>
                        </Col>
                        
                        <Col md={6}>
                            {formData.tipo_filtro !== 'none' && (
                                <Form.Group>
                                    <Form.Label className="fw-bold small text-muted text-uppercase">Selecione o Destino</Form.Label>
                                    
                                    {formData.tipo_filtro === 'categoria' && (
                                        <Form.Select name="valor_filtro" value={formData.valor_filtro} onChange={handleValueSelectChange} required>
                                            <option value="">-- Selecione uma Categoria --</option>
                                            {categorias.map(cat => <option key={cat.id_categoria} value={cat.slug || cat.nome}>{cat.nome}</option>)}
                                        </Form.Select>
                                    )}
                                    {formData.tipo_filtro === 'marca' && (
                                        <Form.Select name="valor_filtro" value={formData.valor_filtro} onChange={handleValueSelectChange} required>
                                            <option value="">-- Selecione uma Marca --</option>
                                            {marcas.map(m => <option key={m.id_marca} value={m.slug || m.nome}>{m.nome}</option>)}
                                        </Form.Select>
                                    )}
                                    {formData.tipo_filtro === 'produto' && (
                                        <Form.Select name="valor_filtro" value={formData.valor_filtro} onChange={handleValueSelectChange} required>
                                            <option value="">-- Selecione o Serviço --</option>
                                            {produtos.filter(p => p.tipo_produto === 'SERVICO').map(p => <option key={p.id_produto} value={p.id_produto}>{p.nome}</option>)}
                                        </Form.Select>
                                    )}
                                    {formData.tipo_filtro === 'url' && (
                                        <Form.Control type="text" name="link_url" value={formData.link_url} onChange={handleChange} placeholder="Ex: https://instagram.com/sualoja" required />
                                    )}
                                </Form.Group>
                            )}
                        </Col>

                        <Col md={12}>
                            <Form.Check 
                                type="switch" 
                                id="ativo-switch-banner-agendamento"
                                label="Exibir este banner no site" 
                                name="ativo" 
                                checked={formData.ativo} 
                                onChange={handleChange} 
                                className="fw-bold text-primary mt-2 fs-5"
                            />
                        </Col>
                    </Row>

                    <div className="d-flex justify-content-end mt-4 pt-4 border-top">
                        <Button variant="primary" type="submit" className="px-5 fw-bold shadow-sm" disabled={saving || !formData.imagem_url}>
                            {saving ? <Spinner size="sm" /> : 'Salvar Banner'}
                        </Button>
                    </div>
                </Form>
            </Card.Body>
        </Card>
    );
};

export default AgendaBannerManager;