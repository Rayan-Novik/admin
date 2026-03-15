import React, { useState, useEffect, Fragment } from 'react';
import { Button, Spinner, Alert, Row, Col, Card, Form, ButtonGroup, Tab, Nav, Badge } from 'react-bootstrap';
import { useNavigate, useParams, Link } from 'react-router-dom';
import api from '../../services/api';
import { toast } from 'react-toastify';

// --- SEÇÕES ---
import ProductMedia from './sections/ProductMedia';
import ProductPricing from './sections/ProductPricing';
import ProductOrganization from './sections/ProductOrganization';
import ProductAttributes from './sections/ProductAttributes';
import ProductRecipe from './sections/ProductRecipe';
import ProductSettings from './sections/ProductSettings';

// --- MODAIS ---
import StockAuditModal from './sections/StockAuditModal';
import CategoryBrowser from './CategoryBrowser';
import CategoryManagerModal from '../common/CategoryManagerModal';
import BrandManagerModal from '../common/BrandManagerModal';

// Estilo CSS-in-JS rápido para as abas modernas (você pode mover para seu CSS)
const modernTabStyle = {
    '.nav-link': {
        color: '#6c757d',
        border: 'none',
        borderBottom: '2px solid transparent',
        padding: '1rem 1.5rem',
        fontWeight: '500',
        transition: 'all 0.2s ease-in-out'
    },
    '.nav-link.active': {
        color: '#0d6efd', // Cor primária do seu tema
        backgroundColor: 'transparent',
        borderBottomColor: '#0d6efd'
    },
    '.nav-link:hover:not(.active)': {
        borderBottomColor: '#e9ecef',
        color: '#495057'
    }
};


const ProductEditForm = () => {
    const { id: productId } = useParams();
    const navigate = useNavigate();
    
    // --- ESTADOS ---
    const [loading, setLoading] = useState(true);
    const [loadingUpdate, setLoadingUpdate] = useState(false);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('geral');
    
    // Modo de edição
    const [creationMode, setCreationMode] = useState('manual'); 

    const [formData, setFormData] = useState({
        nome: '', preco: '', preco_custo: '', imagem_url: '', estoque: '', descricao: '',
        id_categoria: '', id_subcategoria: '', id_marca: '', id_fornecedor: '', 
        peso: 0.3, comprimento: 16, altura: 2, largura: 11,
        ml_category_id: '', tipo_produto: 'FINAL', estoque_minimo: '' 
    });

    const [subImages, setSubImages] = useState(['']);
    const [composition, setComposition] = useState([]); 

    // Listas
    const [categorias, setCategorias] = useState([]);
    const [filteredSubcategories, setFilteredSubcategories] = useState([]);
    const [marcas, setMarcas] = useState([]);
    const [fornecedores, setFornecedores] = useState([]);
    const [allProducts, setAllProducts] = useState([]);

    // --- ESTADOS ESPECÍFICOS ---
    const [estoqueOriginal, setEstoqueOriginal] = useState(0); 
    const [showStockModal, setShowStockModal] = useState(false);
    const [auditData, setAuditData] = useState({ motivo: 'Ajuste Manual via Edição', origem: 'Painel Admin' });

    const [showMlAttributes, setShowMlAttributes] = useState(false);
    const [isMlConfigured, setIsMlConfigured] = useState(false); 
    const [isFetchingAttributes, setIsFetchingAttributes] = useState(false);
    const [categoryAttributes, setCategoryAttributes] = useState([]);
    const [dynamicAttrValues, setDynamicAttrValues] = useState({});
    const [gtinNaoSeAplica, setGtinNaoSeAplica] = useState(false);
    const [modals, setModals] = useState({ category: false, browser: false, brand: false });

    // --- CARREGAMENTO INICIAL ---
    useEffect(() => {
        const loadData = async () => {
            try {
                const [prodRes, catsRes, brandsRes, suppsRes, allProdsRes] = await Promise.all([
                    api.get(`/produtos/${productId}`),
                    api.get('/categorias'),
                    api.get('/marcas'),
                    api.get('/fornecedores'),
                    api.get('/produtos')
                ]);
                
                const data = prodRes.data;
                const { ml_attributes, produto_subimagens, composicao_pai, ...basicData } = data;

                if (basicData.tipo_produto === 'MISTO') setCreationMode('crafting');
                else setCreationMode('manual');

                setFormData({ 
                    ...basicData, 
                    preco: Number(basicData.preco),
                    preco_custo: Number(basicData.preco_custo) || 0,
                    estoque: Number(basicData.estoque),
                    estoque_minimo: Number(basicData.estoque_minimo) || 0,
                    id_fornecedor: basicData.id_fornecedor || '' 
                });
                
                setEstoqueOriginal(Number(basicData.estoque));
                setCategorias(catsRes.data);
                setMarcas(brandsRes.data);
                setFornecedores(suppsRes.data);
                setAllProducts(allProdsRes.data);
                
                if (composicao_pai?.length > 0) {
                    setComposition(composicao_pai.map(item => ({
                        id_insumo: item.insumo.id_produto,
                        nome: item.insumo.nome,
                        unidade_estoque: item.insumo.unidade,
                        unidade_usada: item.insumo.unidade,
                        quantidade_usada: Number(item.quantidade_necessaria),
                        quantidade_real: Number(item.quantidade_necessaria), 
                        custo_unitario: Number(item.insumo.preco_custo || 0)
                    })));
                }

                if (basicData.id_categoria) {
                    const currentCat = catsRes.data.find(c => c.id_categoria === basicData.id_categoria);
                    if (currentCat?.subcategorias) setFilteredSubcategories(currentCat.subcategorias);
                }

                if (produto_subimagens?.length) setSubImages(produto_subimagens.map(img => img.url));

                if (data.mercado_livre_id) {
                    setShowMlAttributes(true);
                    fetchAttributes(data.ml_category_id);
                }
                
                const initialDynamicValues = {};
                if (Array.isArray(ml_attributes)) ml_attributes.forEach(attr => { initialDynamicValues[attr.id] = attr.value_name; });
                setDynamicAttrValues(initialDynamicValues);

                try { await api.get('/mercadolivre/check-auth'); setIsMlConfigured(true); } 
                catch { setIsMlConfigured(false); }

            } catch (err) { setError('Erro ao carregar dados.'); console.error(err); } 
            finally { setLoading(false); }
        };
        loadData();
    // eslint-disable-next-line
    }, [productId]);

    useEffect(() => {
        if (formData.tipo_produto === 'MISTO') setCreationMode('crafting');
        else setCreationMode('manual');
    }, [formData.tipo_produto]);

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleRecipeUpdate = (calculatedCost, potentialStock) => {
        if (Number(calculatedCost) !== Number(formData.preco_custo) || Number(potentialStock) !== Number(formData.estoque)) {
            setFormData(prev => ({ ...prev, preco_custo: calculatedCost, estoque: potentialStock }));
        }
    };

    const submitHandler = async () => {
        if (creationMode === 'manual' && Number(formData.estoque) !== Number(estoqueOriginal) && !showStockModal) {
            setShowStockModal(true); return;
        }
        if (creationMode === 'crafting' && composition.length === 0) {
            toast.warn('Produto Misto deve ter ingredientes.'); 
        }

        setLoadingUpdate(true);
        try {
            const ml_attributes_array = Object.entries(dynamicAttrValues)
                .filter(([, value]) => value !== '' && value != null)
                .map(([key, value]) => ({ id: key, value_name: String(value) }));

            const payload = {
                ...formData,
                preco: Number(formData.preco),
                preco_custo: Number(formData.preco_custo),
                subimagens: subImages.filter(url => url && url.trim() !== ''),
                ml_attributes: ml_attributes_array,
                tipo_produto: formData.tipo_produto,
                estoque_minimo: Number(formData.estoque_minimo),
                composicao_pai: formData.tipo_produto === 'MISTO' ? composition.map(c => ({
                    id_insumo: c.id_insumo, quantidade_necessaria: c.quantidade_real 
                })) : [], 
                motivo_rastreio: auditData.motivo, origem_rastreio: auditData.origem
            };

            await api.put(`/produtos/${productId}`, payload);
            toast.success('Produto salvo com sucesso!');
            navigate('/products');
        } catch (err) { setError(err.response?.data?.message || 'Erro ao salvar.'); } 
        finally { setLoadingUpdate(false); setShowStockModal(false); }
    };

    const handleCategoryChange = (e) => {
        const catId = Number(e.target.value);
        setFormData(prev => ({ ...prev, id_categoria: catId, id_subcategoria: '' }));
        const selected = categorias.find(c => c.id_categoria === catId);
        setFilteredSubcategories(selected ? selected.subcategorias : []);
    };
    const refreshCategories = async () => { const { data } = await api.get('/categorias'); setCategorias(data); };
    const refreshBrands = async () => { const { data } = await api.get('/marcas'); setMarcas(data); };
    
    const handleCategorySelectedFromBrowser = (category) => {
        setDynamicAttrValues({}); setCategoryAttributes([]);
        setFormData(prev => ({ ...prev, ml_category_id: category.id }));
        fetchAttributes(category.id);
        setModals(prev => ({ ...prev, browser: false }));
    };
    const fetchAttributes = async (categoryId) => {
        if (!categoryId) return; setIsFetchingAttributes(true);
        try { const { data } = await api.get(`/mercadolivre/attributes/${categoryId}`); setCategoryAttributes(data); } 
        catch { setCategoryAttributes([]); } finally { setIsFetchingAttributes(false); }
    };

    if (loading) return <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}><Spinner animation="grow" variant="primary" /></div>;

    return (
        <Fragment>
            {/* Inject styles for modern tabs */}
            <style>{Object.entries(modernTabStyle).map(([selector, rules]) => `${selector} { ${Object.entries(rules).map(([prop, value]) => `${prop.replace(/([A-Z])/g, '-$1').toLowerCase()}: ${value}`).join('; ')} }`).join(' ')}</style>

            {/* --- HEADER MODERNO E LIMPO --- */}
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-5 mt-3 gap-3">
                <div>
                    <div className="d-flex align-items-center gap-3 mb-1">
                        <h2 className="h3 fw-bold text-dark mb-0">Editar Produto</h2>
                        <Badge bg="light" text="dark" className="border fw-normal">ID #{productId}</Badge>
                    </div>
                    <div className="d-flex align-items-center text-muted">
                        {/* Seletor de Modo no Header */}
                        <ButtonGroup size="sm" className="bg-light rounded-pill p-0 me-3 border shadow-sm">
                            <Button 
                                variant={creationMode === 'manual' ? 'white' : 'light'} 
                                className={`rounded-pill px-3 fw-medium border-0 ${creationMode === 'manual' ? 'shadow-sm text-primary bg-white' : 'text-muted'}`}
                                onClick={() => { setCreationMode('manual'); setFormData(p => ({...p, tipo_produto: 'FINAL'})); }}
                            >
                                Manual
                            </Button>
                            <Button 
                                variant={creationMode === 'crafting' ? 'white' : 'light'} 
                                className={`rounded-pill px-3 fw-medium border-0 ${creationMode === 'crafting' ? 'shadow-sm text-primary bg-white' : 'text-muted'}`}
                                onClick={() => { setFormData(p => ({...p, tipo_produto: 'MISTO'})); }}
                            >
                                Ficha Técnica
                            </Button>
                        </ButtonGroup>
                        <span className="small">Tipo atual: <strong>{formData.tipo_produto}</strong></span>
                    </div>
                </div>

                <div className="d-flex gap-2">
                    <Button variant="outline-secondary" className="border-0 bg-light text-dark" as={Link} to="/admin/products">Cancelar</Button>
                    <Button variant="primary" onClick={() => submitHandler()} disabled={loadingUpdate} className="px-4 fw-semibold shadow-sm">
                        {loadingUpdate ? <Spinner size="sm" animation="border" /> : <><i className="bi bi-check2-circle me-2"></i>Salvar Alterações</>}
                    </Button>
                </div>
            </div>

            {error && <Alert variant="danger" className="mb-4 shadow-sm rounded-3 border-0">{error}</Alert>}

            <Row className="g-5">
                {/* --- COLUNA PRINCIPAL (TABS) --- */}
                <Col lg={8}>
                    <Tab.Container activeKey={activeTab} onSelect={(k) => setActiveTab(k)}>
                        {/* Navegação de Abas Limpa */}
                        <Nav variant="tabs" className="border-bottom mb-4">
                            <Nav.Item><Nav.Link eventKey="geral">Visão Geral</Nav.Link></Nav.Item>
                            <Nav.Item><Nav.Link eventKey="midia">Imagens & Mídia</Nav.Link></Nav.Item>
                            {creationMode === 'crafting' && (
                                <Nav.Item><Nav.Link eventKey="receita" className={activeTab === 'receita' ? 'text-primary' : ''}><i className="bi bi-receipt-cutout me-2 opacity-75"></i>Ficha Técnica</Nav.Link></Nav.Item>
                            )}
                            {isMlConfigured && (
                                <Nav.Item><Nav.Link eventKey="atributos" className={activeTab === 'atributos' ? 'text-meli' : ''}>Mercado Livre</Nav.Link></Nav.Item>
                            )}
                        </Nav>

                        <Tab.Content>
                            {/* ABA GERAL */}
                            <Tab.Pane eventKey="geral">
                                <Card className="shadow border-0 rounded-4 mb-5 p-4">
                                    <Card.Body>
                                        <h6 className="text-uppercase small text-muted fw-bold mb-4 ls-1">Informações Essenciais</h6>
                                        <Form.Group className="mb-4">
                                            <Form.Label className="fw-medium">Nome do Produto</Form.Label>
                                            <Form.Control size="lg" name="nome" value={formData.nome} onChange={handleChange} placeholder="Ex: Smartphone XYZ..." className="bg-light border-0" style={{fontSize: '1.1rem', fontWeight: '500'}} />
                                        </Form.Group>
                                        <Form.Group>
                                            <Form.Label className="fw-medium">Descrição Completa</Form.Label>
                                            <Form.Control as="textarea" rows={6} name="descricao" value={formData.descricao} onChange={handleChange} className="bg-light border-0" placeholder="Descreva as características, benefícios..." />
                                            <Form.Text className="text-muted small">Uma boa descrição melhora o SEO e as vendas.</Form.Text>
                                        </Form.Group>
                                    </Card.Body>
                                </Card>
                                <div className="mb-5">
                                    <ProductSettings 
                                        formData={formData} handleChange={handleChange} isCrafting={creationMode === 'crafting'} 
                                    />
                                </div>
                            </Tab.Pane>

                            {/* ABA MÍDIA */}
                            <Tab.Pane eventKey="midia">
                                <div className="mb-5">
                                    <ProductMedia formData={formData} setFormData={setFormData} subImages={subImages} setSubImages={setSubImages} />
                                </div>
                            </Tab.Pane>

                            {/* ABA RECEITA */}
                            <Tab.Pane eventKey="receita">
                                <div className="mb-5">
                                    <ProductRecipe 
                                        allProducts={allProducts} composition={composition} setComposition={setComposition} onUpdateCalculations={handleRecipeUpdate} 
                                    />
                                </div>
                            </Tab.Pane>

                            {/* ABA ATRIBUTOS */}
                            <Tab.Pane eventKey="atributos">
                                <div className="mb-5">
                                    <ProductAttributes 
                                        showMlAttributes={showMlAttributes} handleToggleMercadoLivre={(e) => setShowMlAttributes(e.target.checked)}
                                        formData={formData} setShowCategoryBrowser={() => setModals(prev => ({ ...prev, browser: true }))}
                                        isFetchingAttributes={isFetchingAttributes} categoryAttributes={categoryAttributes}
                                        dynamicAttrValues={dynamicAttrValues} handleDynamicAttrChange={(e) => setDynamicAttrValues(p => ({...p, [e.target.name]: e.target.value}))}
                                        gtinNaoSeAplica={gtinNaoSeAplica} handleGtinNaChange={(e) => setGtinNaoSeAplica(e.target.checked)}
                                    />
                                </div>
                            </Tab.Pane>
                        </Tab.Content>
                    </Tab.Container>
                </Col>

                {/* --- COLUNA LATERAL FIXA --- */}
                <Col lg={4}>
                    <div className="sticky-top" style={{ top: '40px', zIndex: 100 }}>
                        
                        {/* Card de Preço e Estoque (Sempre visível) */}
                        <div className="mb-4">
                             <ProductPricing 
                                formData={formData} handleChange={handleChange} estoqueOriginal={estoqueOriginal} isCrafting={creationMode === 'crafting'} 
                            />
                        </div>

                        {/* Card de Organização */}
                        <div className="mb-4">
                            <ProductOrganization 
                                formData={formData} handleChange={handleChange} handleCategoryChange={handleCategoryChange}
                                categorias={categorias} filteredSubcategories={filteredSubcategories} marcas={marcas} fornecedores={fornecedores}
                                setShowCategoryManager={() => setModals(prev => ({ ...prev, category: true }))}
                                setShowBrandManager={() => setModals(prev => ({ ...prev, brand: true }))}
                            />
                        </div>

                        {/* Card de Frete Compacto */}
                        <Card className="shadow border-0 rounded-4">
                            <Card.Body className="p-4">
                                <h6 className="text-uppercase small text-muted fw-bold mb-3 ls-1"><i className="bi bi-box-seam me-2"></i>Logística</h6>
                                <Row className="g-2">
                                    <Col xs={6}><Form.FloatingLabel label="Peso (kg)"><Form.Control size="sm" type='number' step="0.001" name="peso" placeholder="Peso" value={formData.peso} onChange={handleChange} className="bg-light border-0"/></Form.FloatingLabel></Col>
                                    <Col xs={6}><Form.FloatingLabel label="Largura (cm)"><Form.Control size="sm" type='number' name="largura" placeholder="Larg" value={formData.largura} onChange={handleChange} className="bg-light border-0"/></Form.FloatingLabel></Col>
                                    <Col xs={6}><Form.FloatingLabel label="Altura (cm)"><Form.Control size="sm" type='number' name="altura" placeholder="Alt" value={formData.altura} onChange={handleChange} className="bg-light border-0"/></Form.FloatingLabel></Col>
                                    <Col xs={6}><Form.FloatingLabel label="Comp. (cm)"><Form.Control size="sm" type='number' name="comprimento" placeholder="Comp" value={formData.comprimento} onChange={handleChange} className="bg-light border-0"/></Form.FloatingLabel></Col>
                                </Row>
                            </Card.Body>
                        </Card>
                    </div>
                </Col>
            </Row>

            {/* Modais Auxiliares */}
            <StockAuditModal show={showStockModal} onHide={() => setShowStockModal(false)} onSubmit={submitHandler} estoqueOriginal={estoqueOriginal} novoEstoque={formData.estoque} motivo={auditData.motivo} setMotivo={(v) => setAuditData(prev => ({...prev, motivo: v}))} origem={auditData.origem} setOrigem={(v) => setAuditData(prev => ({...prev, origem: v}))} loading={loadingUpdate} />
            <CategoryBrowser show={modals.browser} onHide={() => setModals(prev => ({ ...prev, browser: false }))} onCategorySelect={handleCategorySelectedFromBrowser} />
            <CategoryManagerModal show={modals.category} handleClose={() => setModals(prev => ({ ...prev, category: false }))} initialCategories={categorias} onUpdate={refreshCategories} />
            <BrandManagerModal show={modals.brand} handleClose={() => setModals(prev => ({ ...prev, brand: false }))} initialBrands={marcas} onUpdate={refreshBrands} />
        </Fragment>
    );
};

export default ProductEditForm;