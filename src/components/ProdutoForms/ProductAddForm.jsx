import React, { useState, useEffect } from 'react';
import { Spinner, Alert, Row, Col, Badge, Form } from 'react-bootstrap';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import { toast } from 'react-toastify';

// 🟢 HOOK DE PERMISSÃO
import { usePermission } from '../../hooks/usePermission'; 

// --- SEÇÕES DO WIZARD ---
import ProductMedia from './sections/ProductMedia';
import ProductPricing from './sections/ProductPricing';
import ProductOrganization from './sections/ProductOrganization';
import ProductAttributes from './sections/ProductAttributes';
import ProductRecipe from './sections/ProductRecipe';
import ProductSettings from './sections/ProductSettings';
import ProductFiscal from './sections/ProductFiscal'; 
import ProductComplements from './sections/ProductComplements'; // 🟢 NOVO COMPONENTE IMPORTADO

// --- UI COMPONENTS UNIVERSAIS ---
import { CustomInput } from '../ui/SearchInput/SearchInput';
import { CtaButton, LightButton } from '../ui/buttons/CtaButton';

// --- MODAIS DE APOIO ---
import CategoryBrowser from './CategoryBrowser';
import CategoryManagerModal from '../common/CategoryManagerModal';
import BrandManagerModal from '../common/BrandManagerModal';

const ProductAddForm = () => {
    const navigate = useNavigate();

    // 🟢 PERMISSÕES
    const { can } = usePermission();
    const podeEditar = can('PRODUTOS_MANAGE');

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [currentStep, setCurrentStep] = useState(0);
    const [creationMode, setCreationMode] = useState('manual');

    // 🟢 DADOS DO FORMULÁRIO
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
    const [gruposComplemento, setGruposComplemento] = useState([]); // 🟢 NOVO ESTADO: Adicionais Nível iFood

    const [categorias, setCategorias] = useState([]);
    const [filteredSubcategories, setFilteredSubcategories] = useState([]);
    const [marcas, setMarcas] = useState([]);
    const [fornecedores, setFornecedores] = useState([]);
    const [allProducts, setAllProducts] = useState([]);

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
                const [catRes, brandRes, suppRes, prodRes] = await Promise.allSettled([
                    api.get('/categorias'), api.get('/marcas'), api.get('/fornecedores'), api.get('/produtos')
                ]);
                if (catRes.status === 'fulfilled') setCategorias(catRes.value.data);
                if (brandRes.status === 'fulfilled') setMarcas(brandRes.value.data);
                if (suppRes.status === 'fulfilled') setFornecedores(suppRes.value.data);
                if (prodRes.status === 'fulfilled') setAllProducts(prodRes.value.data);

                try {
                    await api.get('/mercadolivre/check-auth');
                    setIsMlConfigured(true);
                } catch { setIsMlConfigured(false); }

            } catch (err) { setError("Erro geral ao carregar dados."); } 
            finally { setLoading(false); }
        };
        fetchData();
    }, [podeEditar]);

    useEffect(() => {
        setCreationMode(formData.tipo_produto === 'MISTO' ? 'crafting' : 'manual');
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
            setLoading(false); return;
        }

        try {
            const ml_attributes_array = Object.entries(dynamicAttrValues)
                .filter(([, value]) => value !== '' && value != null)
                .map(([key, value]) => ({ id: key, value_name: String(value) }));

            const dataToSend = {
                ...formData,
                preco: Number(formData.preco),
                preco_custo: Number(formData.preco_custo),
                subimagens: subImages.filter(url => url && url.trim() !== ''),
                ml_attributes: showMlAttributes ? ml_attributes_array : [],
                estoque_minimo: formData.estoque_minimo ? Number(formData.estoque_minimo) : 0,
                aliq_icms: Number(formData.aliq_icms) || 0,
                aliq_pis: Number(formData.aliq_pis) || 0,
                aliq_cofins: Number(formData.aliq_cofins) || 0,
                aliq_iss: Number(formData.aliq_iss) || 0,
                aliq_ibs: Number(formData.aliq_ibs) || 0,
                aliq_cbs: Number(formData.aliq_cbs) || 0,
                
                // 🟢 ENVIANDO OS COMPLEMENTOS PARA O BACKEND
                grupos_complemento: gruposComplemento,

                composicao_pai: formData.tipo_produto === 'MISTO' ? composition.map(c => ({ id_insumo: c.id_insumo, quantidade_necessaria: c.quantidade_real })) : [],
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

    const steps = [
        { id: 'essenciais', label: 'Essenciais e Preço' },
        { id: 'config', label: 'Logística' },
        { id: 'fiscal', label: 'Tributação (NF)' },
    ];
    if (creationMode === 'crafting') steps.push({ id: 'receita', label: 'Ficha Técnica' });
    if (isMlConfigured && showMlAttributes) steps.push({ id: 'atributos_ml', label: 'Atributos ML' });

    const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
    const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 0));

    if (!podeEditar) {
        return (
            <div className="d-flex justify-content-center pt-5 mt-5">
                <Alert variant="danger" className="p-4 rounded-4 shadow-sm border-0 text-center">
                    <i className="bi bi-shield-lock-fill display-4 mb-3 d-block"></i>
                    <h4 className="fw-bold">Acesso Negado</h4>
                    <p className="mb-0">Você não tem permissão para cadastrar novos produtos.</p>
                </Alert>
            </div>
        );
    }

    if (loading) return <div className="d-flex justify-content-center py-5 mt-5"><Spinner animation="border" style={{ color: '#0A84FF' }} /></div>;

    const renderStepContent = () => {
        switch (steps[currentStep].id) {
            case 'essenciais':
                return (
                    <div className="fade-in">
                        <ProductMedia formData={formData} setFormData={setFormData} subImages={subImages} setSubImages={setSubImages} podeEditar={podeEditar} />

                        <div className="mt-4 mb-4">
                            <h6 className="text-uppercase fw-bold mb-3 ls-1" style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>1. Detalhes Essenciais</h6>
                            <Row className="g-3">
                                <Col md={12}>
                                    <Form.Label className="small fw-semibold text-secondary mb-1">Nome do Produto</Form.Label>
                                    <CustomInput name="nome" value={formData.nome} onChange={handleChange} placeholder="Ex: Smartphone XYZ..." />
                                </Col>
                                <Col md={12}>
                                    <Form.Label className="small fw-semibold text-secondary mb-1">Descrição Completa</Form.Label>
                                    <Form.Control as="textarea" rows={4} name="descricao" value={formData.descricao} onChange={handleChange} placeholder="Descreva as características e benefícios..." className="flat-textarea shadow-none p-3" />
                                </Col>
                            </Row>
                        </div>

                        <ProductPricing formData={formData} handleChange={handleChange} setFormData={setFormData} estoqueOriginal={0} isCrafting={creationMode === 'crafting'} />

                        {/* 🟢 O SEU NOVO COMPONENTE DE PERSONALIZAÇÃO NÍVEL IFOOD! */}
                        <ProductComplements 
                            allProducts={allProducts} 
                            groups={gruposComplemento} 
                            setGroups={setGruposComplemento} 
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
                                <Col xs={6} md={3}><Form.Label className="small fw-semibold text-secondary mb-1">Peso (kg)</Form.Label><CustomInput type='number' step="0.001" name="peso" placeholder="0.3" value={formData.peso} onChange={handleChange} /></Col>
                                <Col xs={6} md={3}><Form.Label className="small fw-semibold text-secondary mb-1">Largura (cm)</Form.Label><CustomInput type='number' name="largura" placeholder="11" value={formData.largura} onChange={handleChange} /></Col>
                                <Col xs={6} md={3}><Form.Label className="small fw-semibold text-secondary mb-1">Altura (cm)</Form.Label><CustomInput type='number' name="altura" placeholder="2" value={formData.altura} onChange={handleChange} /></Col>
                                <Col xs={6} md={3}><Form.Label className="small fw-semibold text-secondary mb-1">Comp. (cm)</Form.Label><CustomInput type='number' name="comprimento" placeholder="16" value={formData.comprimento} onChange={handleChange} /></Col>
                            </Row>
                        </div>

                        {isMlConfigured && (
                            <div className="p-3 rounded-4 mb-4" style={{ backgroundColor: showMlAttributes ? 'rgba(10, 132, 255, 0.05)' : 'var(--bg-sidebar)', border: '1px solid rgba(100, 116, 139, 0.15)' }}>
                                <div className="d-flex justify-content-between align-items-center">
                                    <div>
                                        <h6 className="fw-bold mb-1"><i className="bi bi-box-seam me-2 text-warning"></i>Mercado Livre</h6>
                                        <small style={{ color: 'var(--text-secondary)' }}>Habilite para classificar e enviar este produto para o ML.</small>
                                    </div>
                                    <Form.Check type="switch" checked={showMlAttributes} onChange={(e) => setShowMlAttributes(e.target.checked)} className="fs-4 m-0 custom-switch" />
                                </div>
                            </div>
                        )}
                    </div>
                );
            case 'fiscal': return <div className="fade-in"><ProductFiscal formData={formData} handleChange={handleChange} setFormData={setFormData} /></div>;
            case 'receita': return <div className="fade-in"><ProductRecipe allProducts={allProducts} composition={composition} setComposition={setComposition} onUpdateCalculations={handleRecipeUpdate} /></div>;
            case 'atributos_ml':
                return (
                    <div className="fade-in">
                        <ProductAttributes
                            showMlAttributes={true} handleToggleMercadoLivre={() => { }} formData={formData} setShowCategoryBrowser={() => setModals(prev => ({ ...prev, browser: true }))}
                            isFetchingAttributes={isFetchingAttributes} categoryAttributes={categoryAttributes} dynamicAttrValues={dynamicAttrValues} handleDynamicAttrChange={(e) => setDynamicAttrValues(p => ({ ...p, [e.target.name]: e.target.value }))}
                            gtinNaoSeAplica={gtinNaoSeAplica} handleGtinNaChange={(e) => setGtinNaoSeAplica(e.target.checked)}
                        />
                    </div>
                );
            default: return null;
        }
    };

    return (
        <div style={{ backgroundColor: 'var(--bg-main, #f8fafc)', minHeight: '100vh', paddingBottom: '2rem' }}>
            <div className="container-fluid pt-4 px-md-4">
                
                {/* 🟢 CABEÇALHO */}
                <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 mt-2 gap-3">
                    <div>
                        <div className="d-flex align-items-center gap-2 mb-1">
                            <h4 className="fw-bold m-0" style={{ color: 'var(--text-primary)' }}>Novo Produto</h4>
                            <Badge bg="success" className="bg-opacity-10 text-success border border-success border-opacity-25 fw-normal rounded-pill">Criação</Badge>
                        </div>
                        <small style={{ color: 'var(--text-secondary)' }}>Defina como este produto funciona no sistema.</small>
                    </div>

                    <div className="d-flex gap-2">
                        {/* Botão Tipo de Produto (Fica no Header para economia de espaço) */}
                        <div className="bg-white p-1 rounded-pill d-flex border" style={{ borderColor: 'var(--border-color)' }}>
                            <button className={`btn btn-sm rounded-pill border-0 px-3 fw-bold ${creationMode === 'manual' ? 'btn-primary' : 'bg-transparent text-secondary'}`} onClick={() => setFormData(p => ({ ...p, tipo_produto: 'FINAL' }))}>Manual</button>
                            <button className={`btn btn-sm rounded-pill border-0 px-3 fw-bold ${creationMode === 'crafting' ? 'btn-primary' : 'bg-transparent text-secondary'}`} onClick={() => setFormData(p => ({ ...p, tipo_produto: 'MISTO' }))}>Ficha Técnica</button>
                        </div>
                        <LightButton as={Link} to="/products" className="px-3" >Cancelar</LightButton>
                    </div>
                </div>

                {error && <Alert variant="danger" className="mb-4 shadow-sm rounded-4 border-0">{error}</Alert>}

                <Row className="justify-content-center">
                    <Col lg={9}>
                        {/* 🟢 STEPPER */}
                        <div className="stepper-wrapper mb-5 mt-2 px-2">
                            {steps.map((step, index) => (
                                <div key={step.id} className={`step-item ${index <= currentStep ? 'active' : ''}`}>
                                    <div className="step-counter">{index + 1}</div>
                                    <div className="step-name">{step.label}</div>
                                </div>
                            ))}
                        </div>

                        {/* 🟢 CONTEÚDO DO WIZARD */}
                        {renderStepContent()}

                        {/* 🟢 CONTROLES DE NAVEGAÇÃO */}
                        <div className="d-flex justify-content-between mt-5 gap-2 pt-3 border-top" style={{ borderColor: 'rgba(100,116,139,0.1)' }}>
                            <LightButton onClick={prevStep} disabled={currentStep === 0} className="px-4">
                                <i className="bi bi-arrow-left me-2"></i> Voltar
                            </LightButton>

                            {currentStep < steps.length - 1 ? (
                                <CtaButton onClick={nextStep} className="px-5">
                                    Próximo <i className="bi bi-arrow-right ms-2"></i>
                                </CtaButton>
                            ) : (
                                <CtaButton onClick={submitHandler} disabled={loading}>
                                    {loading ? <Spinner size="sm" /> : <><i className="bi bi-check2-circle me-2"></i> Finalizar Cadastro</>}
                                </CtaButton>
                            )}
                        </div>
                    </Col>
                </Row>
            </div>

            <CategoryBrowser show={modals.browser} onHide={() => setModals(prev => ({ ...prev, browser: false }))} onCategorySelect={handleCategorySelectedFromBrowser} />
            <CategoryManagerModal show={modals.category} handleClose={() => setModals(prev => ({ ...prev, category: false }))} initialCategories={categorias} onUpdate={refreshCategories} />
            <BrandManagerModal show={modals.brand} handleClose={() => setModals(prev => ({ ...prev, brand: false }))} initialBrands={marcas} onUpdate={refreshBrands} />

            <style>{`
                /* WIZARD CSS MANTIDO E OTIMIZADO */
                .stepper-wrapper { display: flex; justify-content: space-between; position: relative; }
                .stepper-wrapper::before { content: ''; position: absolute; top: 15px; left: 10%; width: 80%; height: 2px; background: rgba(100, 116, 139, 0.15); z-index: 0; }
                .step-item { position: relative; z-index: 1; display: flex; flex-direction: column; align-items: center; flex: 1; opacity: 0.4; transition: opacity 0.3s ease; }
                .step-item.active { opacity: 1; }
                .step-counter { width: 32px; height: 32px; border-radius: 50%; background: var(--bg-sidebar, #fff); border: 2px solid rgba(100, 116, 139, 0.2); display: flex; align-items: center; justify-content: center; font-weight: bold; color: var(--text-secondary); margin-bottom: 8px; transition: all 0.3s; }
                .step-item.active .step-counter { background: #0A84FF; border-color: #0A84FF; color: #fff; }
                .step-name { font-size: 11px; font-weight: 700; color: var(--text-secondary); text-align: center; text-transform: uppercase; letter-spacing: 0.5px;}
                .step-item.active .step-name { color: var(--text-primary, #0f172a); }

                /* ANIMAÇÕES GERAIS */
                .fade-in { animation: fadeIn 0.3s ease-in-out; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }

                /* TEXTAREA PLANA */
                .flat-textarea {
                    border: 1px solid rgba(100, 116, 139, 0.2);
                    border-radius: 14px;
                    background-color: var(--bg-sidebar, #F4F6FA);
                    color: var(--text-primary, #0F172A);
                    transition: all 0.2s ease;
                }
                .flat-textarea:focus {
                    border-color: rgba(100, 116, 139, 0.4);
                    background-color: var(--bg-main, #FFFFFF);
                }

                .ls-1 { letter-spacing: 0.5px; }
            `}</style>
        </div>
    );
};

export default ProductAddForm;