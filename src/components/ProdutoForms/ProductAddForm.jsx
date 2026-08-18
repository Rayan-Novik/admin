import React, { useState, useEffect, Fragment } from 'react';
import { Button, Spinner, Alert, Row, Col, ButtonGroup, Badge, Container } from 'react-bootstrap';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import { toast } from 'react-toastify';

// --- SEÇÕES ---
import ProductMedia from './sections/ProductMedia';
import ProductPricing from './sections/ProductPricing';
import ProductOrganization from './sections/ProductOrganization';
import ProductAttributes from './sections/ProductAttributes';
import ProductRecipe from './sections/ProductRecipe';
import ProductSettings from './sections/ProductSettings';
import ProductFiscal from './sections/ProductFiscal'; // 🟢 NOVO COMPONENTE IMPORTADO

// --- UI COMPONENTS ---
import UiField from '../ui/UiField';

// --- MODAIS ---
import CategoryBrowser from './CategoryBrowser';
import CategoryManagerModal from '../common/CategoryManagerModal';
import BrandManagerModal from '../common/BrandManagerModal';

const ProductAddForm = () => {
    const navigate = useNavigate();

    // ==============================================================
    // 🟢 LÓGICA DE PERMISSÕES BLINDADA ('PRODUTOS_MANAGE')
    // ==============================================================
    const rawUser = localStorage.getItem('adminInfo') || localStorage.getItem('user') || localStorage.getItem('usuario') || '{}';
    let dadosUser = {};
    try {
        dadosUser = JSON.parse(rawUser);
        if (dadosUser.user) dadosUser = { ...dadosUser, ...dadosUser.user };
    } catch (e) { }

    const roleUpper = String(dadosUser.role || '').toUpperCase();
    const isDono = roleUpper === 'PROPRIETÁRIO' ||
        roleUpper === 'DONO' ||
        roleUpper === 'ADMIN' ||
        dadosUser.isAdmin === true;

    let permissoesUsuario = [];
    if (Array.isArray(dadosUser.permissoes)) {
        permissoesUsuario = dadosUser.permissoes;
    } else if (dadosUser.cargo && Array.isArray(dadosUser.cargo.permissoes)) {
        permissoesUsuario = dadosUser.cargo.permissoes;
    }

    const podeEditar = isDono || permissoesUsuario.includes('PRODUTOS_MANAGE');
    // ==============================================================

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Controle do Wizard
    const [currentStep, setCurrentStep] = useState(0);
    const [creationMode, setCreationMode] = useState('manual');

    // 🟢 ADICIONADO: TODOS OS CAMPOS FISCAIS AQUI
    const [formData, setFormData] = useState({
        id_externo: '', nome: '', preco: '', preco_custo: '', imagem_url: '', estoque: '', descricao: '',
        id_categoria: '', id_subcategoria: '', id_marca: '', id_fornecedor: '',
        peso: 0.3, comprimento: 16, altura: 2, largura: 11,
        ml_category_id: '', tipo_produto: 'FINAL', estoque_minimo: '',
        origem: '0', ncm: '', cest: '', cfop_padrao: '',
        cst_icms: '', cst_pis_cofins: '', cst_ipi: '',
        aliq_icms: '', aliq_pis: '', aliq_cofins: '', aliq_iss: '', aliq_ibs: '', aliq_cbs: ''
    });

    const [subImages, setSubImages] = useState(['']);
    const [composition, setComposition] = useState([]);

    // Listas
    const [categorias, setCategorias] = useState([]);
    const [filteredSubcategories, setFilteredSubcategories] = useState([]);
    const [marcas, setMarcas] = useState([]);
    const [fornecedores, setFornecedores] = useState([]);
    const [allProducts, setAllProducts] = useState([]);

    // Estados Auxiliares
    const [showMlAttributes, setShowMlAttributes] = useState(false);
    const [isMlConfigured, setIsMlConfigured] = useState(false);
    const [isFetchingAttributes, setIsFetchingAttributes] = useState(false);
    const [categoryAttributes, setCategoryAttributes] = useState([]);
    const [dynamicAttrValues, setDynamicAttrValues] = useState({});
    const [gtinNaoSeAplica, setGtinNaoSeAplica] = useState(false);
    const [modals, setModals] = useState({ category: false, browser: false, brand: false });

    useEffect(() => {
        if (!podeEditar) return;

        const fetchData = async () => {
            try {
                try {
                    const catRes = await api.get('/categorias');
                    setCategorias(catRes.data);
                } catch (e) { console.warn("Aviso: Falha ao carregar categorias.", e); }

                try {
                    const brandRes = await api.get('/marcas');
                    setMarcas(brandRes.data);
                } catch (e) { console.warn("Aviso: Falha ao carregar marcas.", e); }

                try {
                    const supplierRes = await api.get('/fornecedores');
                    setFornecedores(supplierRes.data);
                } catch (e) { console.warn("Aviso: Falha ao carregar fornecedores.", e); }

                try {
                    const prodRes = await api.get('/produtos');
                    setAllProducts(prodRes.data);
                } catch (e) { console.warn("Aviso: Falha ao carregar lista de produtos.", e); }

                try {
                    await api.get('/mercadolivre/check-auth');
                    setIsMlConfigured(true);
                } catch {
                    setIsMlConfigured(false);
                }

            } catch (err) {
                setError("Erro geral ao carregar dados do formulário.");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
        // eslint-disable-next-line
    }, [podeEditar]);

    useEffect(() => {
        if (formData.tipo_produto === 'MISTO') setCreationMode('crafting');
        else setCreationMode('manual');
        setCurrentStep(0);
    }, [formData.tipo_produto]);

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleRecipeUpdate = (calculatedCost, potentialStock) => {
        setFormData(prev => ({ ...prev, preco_custo: calculatedCost, estoque: potentialStock }));
    };

    const submitHandler = async () => {
        setLoading(true); setError('');

        if (creationMode === 'crafting' && composition.length === 0) {
            toast.warn('Adicione ingredientes para o produto misto.');
            setLoading(false);
            return;
        }

        try {
            const ml_attributes_array = Object.entries(dynamicAttrValues)
                .filter(([, value]) => value !== '' && value != null)
                .map(([key, value]) => ({ id: key, value_name: String(value) }));

            // 🟢 Formata os números dos impostos corretamente antes de mandar pro backend
            const dataToSend = {
                ...formData,
                preco: Number(formData.preco),
                preco_custo: Number(formData.preco_custo),
                subimagens: subImages.filter(url => url && url.trim() !== ''),
                ml_attributes: showMlAttributes ? ml_attributes_array : [],
                tipo_produto: formData.tipo_produto,
                estoque_minimo: formData.estoque_minimo ? Number(formData.estoque_minimo) : 0,

                // Conversão segura de Alíquotas
                aliq_icms: Number(formData.aliq_icms) || 0,
                aliq_pis: Number(formData.aliq_pis) || 0,
                aliq_cofins: Number(formData.aliq_cofins) || 0,
                aliq_iss: Number(formData.aliq_iss) || 0,
                aliq_ibs: Number(formData.aliq_ibs) || 0,
                aliq_cbs: Number(formData.aliq_cbs) || 0,

                composicao_pai: formData.tipo_produto === 'MISTO' ? composition.map(c => ({
                    id_insumo: c.id_insumo, quantidade_necessaria: c.quantidade_real
                })) : [],
                motivo_rastreio: 'Cadastro Inicial', origem_rastreio: 'Painel Admin'
            };

            await api.post(`/produtos`, dataToSend);
            toast.success('Produto criado com sucesso!');
            navigate('/products');
        } catch (err) {
            setError(err.response?.data?.message || 'Erro ao salvar.');
            setLoading(false);
        }
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
        setModals(prev => ({ ...prev, browser: false }));
    };

    // --- 🟢 WIZARD: ADICIONADA A ETAPA "FISCAL" ---
    const steps = [
        { id: 'essenciais', label: 'Essenciais e Preço' },
        { id: 'config', label: 'Logística' },
        { id: 'fiscal', label: 'Tributação (NF)' }, // NOVA ETAPA AQUI!
    ];

    if (creationMode === 'crafting') {
        steps.push({ id: 'receita', label: 'Ficha Técnica' });
    }

    if (isMlConfigured && showMlAttributes) {
        steps.push({ id: 'atributos_ml', label: 'Atributos ML' });
    }

    const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
    const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 0));

    // 🛑 BLOQUEIO PARA QUEM NÃO PODE VER A TELA
    if (!podeEditar) {
        return (
            <Container className="pt-5 mt-5 text-center">
                <Alert variant="danger" className="d-inline-block p-4 rounded-4 shadow-sm border-0">
                    <i className="bi bi-shield-lock-fill display-4 text-danger mb-3 d-block"></i>
                    <h4 className="fw-bold">Acesso Negado</h4>
                    <p className="text-muted mb-0">Você não tem permissão para cadastrar novos produtos no sistema.</p>
                </Alert>
            </Container>
        );
    }

    const renderStepContent = () => {
        const stepId = steps[currentStep].id;

        switch (stepId) {
            case 'essenciais':
                return (
                    <div className="fade-in">
                        <ProductMedia formData={formData} setFormData={setFormData} subImages={subImages} setSubImages={setSubImages} podeEditar={podeEditar} />

                        <div>
                            <h6 className="text-uppercase fw-bold mb-4 ls-1" style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>1. Detalhes Essenciais</h6>
                            <UiField label="Nome do Produto" name="nome" value={formData.nome} onChange={handleChange} placeholder="Ex: Smartphone XYZ..." />
                            <UiField label="Descrição Completa" type="textarea" rows={5} name="descricao" value={formData.descricao} onChange={handleChange} placeholder="Descreva as características e benefícios..." hint="Uma boa descrição melhora o SEO e as vendas." />
                        </div>

                        <ProductPricing
                            formData={formData}
                            handleChange={handleChange}
                            setFormData={setFormData}
                            estoqueOriginal={0}
                            isCrafting={creationMode === 'crafting'}
                        />
                    </div>
                );
            case 'config':
                return (
                    <div className="fade-in">
                        <ProductSettings formData={formData} handleChange={handleChange} isCrafting={creationMode === 'crafting'} />
                        <ProductOrganization
                            formData={formData} handleChange={handleChange} handleCategoryChange={handleCategoryChange}
                            categorias={categorias} filteredSubcategories={filteredSubcategories} marcas={marcas} fornecedores={fornecedores}
                            setShowCategoryManager={() => setModals(prev => ({ ...prev, category: true }))}
                            setShowBrandManager={() => setModals(prev => ({ ...prev, brand: true }))}
                        />

                        <div className="mb-4">
                            <h6 className="text-uppercase fw-bold mb-3 ls-1" style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                                <i className="bi bi-truck me-2"></i>Logística (Embalagem)
                            </h6>
                            <Row className="g-2">
                                <Col xs={6} md={3}><UiField label="Peso (kg)" type='number' step="0.001" name="peso" placeholder="0.3" value={formData.peso} onChange={handleChange} /></Col>
                                <Col xs={6} md={3}><UiField label="Largura (cm)" type='number' name="largura" placeholder="11" value={formData.largura} onChange={handleChange} /></Col>
                                <Col xs={6} md={3}><UiField label="Altura (cm)" type='number' name="altura" placeholder="2" value={formData.altura} onChange={handleChange} /></Col>
                                <Col xs={6} md={3}><UiField label="Comp (cm)" type='number' name="comprimento" placeholder="16" value={formData.comprimento} onChange={handleChange} /></Col>
                            </Row>
                        </div>

                        {isMlConfigured && (
                            <div className="mb-4" style={{ backgroundColor: showMlAttributes ? 'var(--bg-active-light, #fefce8)' : '' }}>
                                <div className="d-flex justify-content-between align-items-center">
                                    <div>
                                        <h6 className="fw-bold mb-1" style={{ color: 'var(--text-primary)' }}><i className="bi bi-box-seam me-2 text-warning"></i>Mercado Livre</h6>
                                        <small style={{ color: 'var(--text-secondary)' }}>Habilite para classificar e enviar este produto para o Mercado Livre.</small>
                                    </div>
                                    <div className="form-check form-switch fs-4 m-0">
                                        <input className="form-check-input cursor-pointer" type="checkbox" checked={showMlAttributes} onChange={(e) => setShowMlAttributes(e.target.checked)} />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                );
            case 'fiscal':
                return (
                    <div className="fade-in">
                        <ProductFiscal formData={formData} handleChange={handleChange} setFormData={setFormData} />
                    </div>
                );
            case 'receita':
                return <div className="fade-in"><ProductRecipe allProducts={allProducts} composition={composition} setComposition={setComposition} onUpdateCalculations={handleRecipeUpdate} /></div>;
            case 'atributos_ml':
                return (
                    <div className="fade-in">
                        <ProductAttributes
                            showMlAttributes={true} handleToggleMercadoLivre={() => { }}
                            formData={formData} setShowCategoryBrowser={() => setModals(prev => ({ ...prev, browser: true }))}
                            isFetchingAttributes={isFetchingAttributes} categoryAttributes={categoryAttributes}
                            dynamicAttrValues={dynamicAttrValues} handleDynamicAttrChange={(e) => setDynamicAttrValues(p => ({ ...p, [e.target.name]: e.target.value }))}
                            gtinNaoSeAplica={gtinNaoSeAplica} handleGtinNaChange={(e) => setGtinNaoSeAplica(e.target.checked)}
                        />
                    </div>
                );
            default: return null;
        }
    };

    if (loading) return <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}><Spinner animation="grow" variant="primary" /></div>;

    return (
        <Fragment>
            <div style={{ backgroundColor: 'var(--bg-main, #f8fafc)', minHeight: '100vh', transition: 'background-color 0.2s ease', paddingBottom: '2rem' }}>
                <div className="container-fluid pt-4 px-md-4">

                    <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-5 mt-3 gap-3">
                        <div>
                            <div className="d-flex align-items-center gap-2 mb-1">
                                <h4 className="fw-bold m-0" style={{ color: 'var(--text-primary)' }}>Novo Produto</h4>
                                <Badge bg="success" className="bg-opacity-10 text-success border border-success border-opacity-25 fw-normal">Criação</Badge>
                            </div>
                            <div className="d-flex align-items-center mt-2">
                                <ButtonGroup size="sm" className="rounded-pill p-1 border shadow-sm" style={{ backgroundColor: 'var(--bg-sidebar)', borderColor: 'var(--border-color)' }}>
                                    <Button variant={creationMode === 'manual' ? 'primary' : 'link'} className={`rounded-pill px-3 fw-medium border-0 ${creationMode === 'manual' ? 'text-white' : 'text-muted text-decoration-none'}`} style={{ fontSize: '11px' }} onClick={() => { setFormData(p => ({ ...p, tipo_produto: 'FINAL' })); }}>
                                        Manual
                                    </Button>
                                    <Button variant={creationMode === 'crafting' ? 'primary' : 'link'} className={`rounded-pill px-3 fw-medium border-0 ${creationMode === 'crafting' ? 'text-white' : 'text-muted text-decoration-none'}`} style={{ fontSize: '11px' }} onClick={() => { setFormData(p => ({ ...p, tipo_produto: 'MISTO' })); }}>
                                        Ficha Técnica
                                    </Button>
                                </ButtonGroup>
                            </div>
                        </div>

                        <div className="d-flex gap-2">
                            <Button variant="light" size="sm" className="border fw-medium px-3 rounded-3" as={Link} to="/products" style={{ backgroundColor: 'var(--bg-sidebar)', color: 'var(--text-primary)', borderColor: 'var(--border-color)' }}>Cancelar</Button>
                        </div>
                    </div>

                    {error && <Alert variant="danger" className="mb-4 shadow-sm rounded-3 border-0">{error}</Alert>}

                    <Row className="justify-content-center">
                        <Col lg={9}>

                            <div className="stepper-wrapper mb-5 px-3">
                                {steps.map((step, index) => (
                                    <div key={step.id} className={`step-item ${index <= currentStep ? 'active' : ''}`}>
                                        <div className="step-counter">{index + 1}</div>
                                        <div className="step-name">{step.label}</div>
                                    </div>
                                ))}
                            </div>

                            {renderStepContent()}

                            <div className="d-flex justify-content-between mt-4">
                                <Button variant="light" className="border fw-medium px-4" onClick={prevStep} disabled={currentStep === 0}>
                                    <i className="bi bi-arrow-left me-2"></i> Voltar
                                </Button>

                                {currentStep < steps.length - 1 ? (
                                    <Button variant="primary" className="fw-medium px-4 text-white" onClick={nextStep}>
                                        Próximo <i className="bi bi-arrow-right ms-2"></i>
                                    </Button>
                                ) : (
                                    <Button variant="dark" onClick={submitHandler} disabled={loading} className="px-4 fw-medium border-0 shadow-sm" style={{ backgroundColor: 'var(--text-primary)', color: 'var(--bg-sidebar)' }}>
                                        {loading ? <Spinner size="sm" animation="border" /> : <><i className="bi bi-check2-circle me-1"></i> Finalizar Cadastro</>}
                                    </Button>
                                )}
                            </div>

                        </Col>
                    </Row>
                </div>
            </div>

            <CategoryBrowser show={modals.browser} onHide={() => setModals(prev => ({ ...prev, browser: false }))} onCategorySelect={handleCategorySelectedFromBrowser} />
            <CategoryManagerModal show={modals.category} handleClose={() => setModals(prev => ({ ...prev, category: false }))} initialCategories={categorias} onUpdate={refreshCategories} />
            <BrandManagerModal show={modals.brand} handleClose={() => setModals(prev => ({ ...prev, brand: false }))} initialBrands={marcas} onUpdate={refreshBrands} />

            <style>{`
                .clean-card { background: var(--bg-sidebar, #ffffff); border: 1px solid var(--border-color, #e2e8f0); border-radius: 12px; box-shadow: none; overflow: hidden; }
                
                /* WIZARD CSS */
                .stepper-wrapper { display: flex; justify-content: space-between; position: relative; }
                .stepper-wrapper::before { content: ''; position: absolute; top: 15px; left: 10%; width: 80%; height: 2px; background: var(--border-color, #e2e8f0); z-index: 0; }
                .step-item { position: relative; z-index: 1; display: flex; flex-direction: column; align-items: center; flex: 1; opacity: 0.5; transition: opacity 0.3s ease; }
                .step-item.active { opacity: 1; }
                .step-counter { width: 32px; height: 32px; border-radius: 50%; background: var(--bg-sidebar, #fff); border: 2px solid var(--border-color, #e2e8f0); display: flex; align-items: center; justify-content: center; font-weight: bold; color: var(--text-secondary); margin-bottom: 8px; transition: all 0.3s; }
                .step-item.active .step-counter { background: var(--text-primary, #0f172a); border-color: var(--text-primary, #0f172a); color: var(--bg-sidebar, #fff); }
                .step-name { font-size: 12px; font-weight: 600; color: var(--text-secondary); text-align: center; }
                .step-item.active .step-name { color: var(--text-primary, #0f172a); }

                /* ANIMAÇÕES GERAIS */
                .fade-in { animation: fadeIn 0.3s ease-in-out; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
                .cursor-pointer { cursor: pointer; }

                /* INPUTS & DARK MODE FIX */
                .form-dark-input { background-color: var(--bg-main) !important; border-color: var(--border-color) !important; color: var(--text-primary) !important; }
                .form-dark-input:focus { border-color: var(--text-active) !important; box-shadow: none !important; }
                .form-dark-input:disabled, .form-dark-input[readonly] { opacity: 0.6; background-color: var(--bg-sidebar) !important; cursor: not-allowed; }
                .form-dark-input::placeholder { color: var(--text-secondary); opacity: 0.6; }
                body.dark-mode select.form-dark-input { background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3e%3cpath fill='none' stroke='%2394a3b8' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M2 5l6 6 6-6'/%3e%3c/svg%3e"); }
                body.dark-mode .modal-dark-fix { background-color: var(--bg-sidebar); border-color: var(--border-color); }
                body.dark-mode .modal-dark-header { background-color: #0f172a; color: white; border-bottom: none; }
                body.dark-mode .btn-close-white { filter: invert(1); }
                .ls-1 { letter-spacing: 0.5px; }
            `}</style>
        </Fragment>
    );
};

export default ProductAddForm;