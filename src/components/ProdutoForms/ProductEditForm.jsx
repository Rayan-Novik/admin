import React, { useState, useEffect, Fragment } from 'react';
import { Button, Spinner, Alert, Row, Col, ButtonGroup, Badge, Container } from 'react-bootstrap';
import { useNavigate, useParams, Link } from 'react-router-dom';
import api from '../../services/api';
import { toast } from 'react-toastify';

import ProductMedia from './sections/ProductMedia';
import ProductPricing from './sections/ProductPricing';
import ProductOrganization from './sections/ProductOrganization';
import ProductAttributes from './sections/ProductAttributes';
import ProductRecipe from './sections/ProductRecipe';
import ProductSettings from './sections/ProductSettings';
import ProductFiscal from './sections/ProductFiscal'; 
import ProductComplements from './sections/ProductComplements'; // 🟢 NOVO COMPONENTE IMPORTADO

import UiField from '../ui/UiField';

import StockAuditModal from './sections/StockAuditModal';
import CategoryBrowser from './CategoryBrowser';
import CategoryManagerModal from '../common/CategoryManagerModal';
import BrandManagerModal from '../common/BrandManagerModal';

const ProductEditForm = () => {
    const { id: productId } = useParams();
    const navigate = useNavigate();

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
    const podeVer = podeEditar || permissoesUsuario.includes('PRODUTOS_VIEW');

    const [loading, setLoading] = useState(true);
    const [loadingUpdate, setLoadingUpdate] = useState(false);
    const [error, setError] = useState('');

    const [currentStep, setCurrentStep] = useState(0);
    const [creationMode, setCreationMode] = useState('manual');

    const [formData, setFormData] = useState({
        id_externo: '', nome: '', preco: '', preco_custo: '', imagem_url: '', estoque: '', descricao: '',
        id_categoria: '', id_subcategoria: '', id_marca: '', id_fornecedor: '',
        peso: 0.3, comprimento: 16, altura: 2, largura: 11,
        ml_category_id: '', tipo_produto: 'FINAL', estoque_minimo: '', duracao_minutos: 60,
        variacoes: [],
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

    const parseSafeNumber = (val) => {
        if (val === null || val === undefined || val === '') return '';
        const num = parseFloat(String(val).replace(',', '.'));
        return isNaN(num) ? '' : num;
    };

    useEffect(() => {
        if (!podeVer) {
            setLoading(false);
            return;
        }

        const loadData = async () => {
            try {
                const prodRes = await api.get(`/produtos/${productId}`);
                const data = prodRes.data;
                const { ml_attributes, produto_subimagens, composicao_pai, produto_variacoes, tempo_duracao, grupos_complemento, ...basicData } = data;

                if (basicData.tipo_produto === 'MISTO') setCreationMode('crafting');
                else setCreationMode('manual');

                setFormData({
                    ...basicData,
                    id_externo: basicData.id_externo || '',
                    preco: parseSafeNumber(basicData.preco),
                    preco_custo: parseSafeNumber(basicData.preco_custo),
                    estoque: parseSafeNumber(basicData.estoque),
                    estoque_minimo: parseSafeNumber(basicData.estoque_minimo) || 0,
                    id_fornecedor: basicData.id_fornecedor || '',
                    duracao_minutos: tempo_duracao || 60,
                    variacoes: produto_variacoes || [],

                    origem: basicData.origem || '0',
                    ncm: basicData.ncm || '',
                    cest: basicData.cest || '',
                    cfop_padrao: basicData.cfop_padrao || '',
                    cst_icms: basicData.cst_icms || '',
                    cst_pis_cofins: basicData.cst_pis_cofins || '',
                    cst_ipi: basicData.cst_ipi || '',
                    aliq_icms: parseSafeNumber(basicData.aliq_icms) || '',
                    aliq_pis: parseSafeNumber(basicData.aliq_pis) || '',
                    aliq_cofins: parseSafeNumber(basicData.aliq_cofins) || '',
                    aliq_iss: parseSafeNumber(basicData.aliq_iss) || '',
                    aliq_ibs: parseSafeNumber(basicData.aliq_ibs) || '',
                    aliq_cbs: parseSafeNumber(basicData.aliq_cbs) || ''
                });

                setEstoqueOriginal(parseSafeNumber(basicData.estoque) || 0);

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

                // 🟢 CARREGANDO OS ADICIONAIS/COMPLEMENTOS DA API
                if (grupos_complemento?.length > 0) {
                    setGruposComplemento(grupos_complemento.map(gc => ({
                        nome: gc.nome,
                        minimo: gc.minimo,
                        maximo: gc.maximo,
                        tipo_grupo: gc.tipo_grupo || 'CHOICE',
                        complementos: gc.complementos.map(c => ({
                            id_produto_add: c.id_produto_add,
                            preco_adicional: Number(c.preco_adicional),
                            minimo: c.minimo !== undefined ? Number(c.minimo) : 0,
                            maximo: c.maximo !== undefined ? Number(c.maximo) : 1
                        }))
                    })));
                }

                if (produto_subimagens?.length) setSubImages(produto_subimagens.map(img => img.url));

                try {
                    const catsRes = await api.get('/categorias');
                    setCategorias(catsRes.data);
                    if (basicData.id_categoria) {
                        const currentCat = catsRes.data.find(c => c.id_categoria === basicData.id_categoria);
                        if (currentCat?.subcategorias) setFilteredSubcategories(currentCat.subcategorias);
                    }
                } catch (e) { console.warn("Aviso: Falha ao buscar categorias", e); }

                try { const brandsRes = await api.get('/marcas'); setMarcas(brandsRes.data); }
                catch (e) { console.warn("Aviso: Falha ao buscar marcas", e); }

                try { const suppsRes = await api.get('/fornecedores'); setFornecedores(suppsRes.data); }
                catch (e) { console.warn("Aviso: Falha ao buscar fornecedores.", e); }

                try { const allProdsRes = await api.get('/produtos'); setAllProducts(allProdsRes.data); }
                catch (e) { console.warn("Aviso: Falha ao buscar lista geral de produtos", e); }

                if (data.mercado_livre_id) {
                    setShowMlAttributes(true);
                    fetchAttributes(data.ml_category_id);
                }

                const initialDynamicValues = {};
                if (Array.isArray(ml_attributes)) ml_attributes.forEach(attr => { initialDynamicValues[attr.id] = attr.value_name; });
                setDynamicAttrValues(initialDynamicValues);

                try { await api.get('/mercadolivre/check-auth'); setIsMlConfigured(true); }
                catch { setIsMlConfigured(false); }

            } catch (err) {
                console.error("🚨 ERRO FATAL AO CARREGAR O PRODUTO:", err);
                setError(`Erro do sistema: ${err.response?.data?.message || err.message}`);
            }
            finally { setLoading(false); }
        };

        loadData();
        // eslint-disable-next-line
    }, [productId, podeVer]);

    useEffect(() => {
        if (formData.tipo_produto === 'MISTO') setCreationMode('crafting');
        else setCreationMode('manual');
        setCurrentStep(0);
    }, [formData.tipo_produto]);

    const handleChange = (e) => {
        if (!podeEditar) return;
        setFormData({ ...formData, [e.target.name]: e.target.value });
    }

    const handleRecipeUpdate = (calculatedCost, potentialStock) => {
        if (!podeEditar) return;
        setFormData(prev => {
            if (prev.tipo_produto !== 'MISTO') return prev;
            const safeCost = parseSafeNumber(calculatedCost) || 0;
            const safeStock = parseSafeNumber(potentialStock) || 0;

            if (safeCost !== parseSafeNumber(prev.preco_custo) || safeStock !== parseSafeNumber(prev.estoque)) {
                return { ...prev, preco_custo: safeCost, estoque: safeStock };
            }
            return prev;
        });
    };

    const submitHandler = async () => {
        if (!podeEditar) {
            toast.error('Você não tem permissão para salvar alterações.');
            return;
        }

        const temVariacoes = formData.variacoes && formData.variacoes.length > 0;

        if (creationMode === 'manual' && parseSafeNumber(formData.estoque) !== estoqueOriginal && !showStockModal && !temVariacoes) {
            setShowStockModal(true); return;
        }
        if (creationMode === 'crafting' && composition.length === 0) {
            toast.warn('Produto Misto deve ter ingredientes.');
            return;
        }

        setLoadingUpdate(true);
        try {
            const ml_attributes_array = Object.entries(dynamicAttrValues)
                .filter(([, value]) => value !== '' && value != null)
                .map(([key, value]) => ({ id: key, value_name: String(value) }));

            const payload = {
                ...formData,
                preco: parseSafeNumber(formData.preco) || 0,
                preco_custo: parseSafeNumber(formData.preco_custo) || 0,
                estoque: parseSafeNumber(formData.estoque) || 0,
                estoque_minimo: parseSafeNumber(formData.estoque_minimo) || 0,
                tempo_duracao: formData.tipo_produto === 'SERVICO' ? (parseSafeNumber(formData.duracao_minutos) || 60) : null,

                aliq_icms: parseSafeNumber(formData.aliq_icms) || 0,
                aliq_pis: parseSafeNumber(formData.aliq_pis) || 0,
                aliq_cofins: parseSafeNumber(formData.aliq_cofins) || 0,
                aliq_iss: parseSafeNumber(formData.aliq_iss) || 0,
                aliq_ibs: parseSafeNumber(formData.aliq_ibs) || 0,
                aliq_cbs: parseSafeNumber(formData.aliq_cbs) || 0,

                subimagens: subImages.filter(url => url && url.trim() !== ''),
                ml_attributes: showMlAttributes ? ml_attributes_array : [],
                tipo_produto: formData.tipo_produto,
                variacoes: formData.variacoes || [],
                
                // 🟢 MANDA OS ADICIONAIS / PERSONALIZAÇÃO PRO BACKEND AQUI
                grupos_complemento: gruposComplemento, 

                composicao_pai: formData.tipo_produto === 'MISTO' ? composition.map(c => ({
                    id_insumo: c.id_insumo, quantidade_necessaria: c.quantidade_real
                })) : [],
                motivo_rastreio: auditData.motivo, origem_rastreio: auditData.origem
            };

            await api.put(`/produtos/${productId}`, payload);
            toast.success('Produto atualizado com sucesso!');
            navigate('/products');
        } catch (err) { setError(err.response?.data?.message || 'Erro ao salvar.'); }
        finally { setLoadingUpdate(false); setShowStockModal(false); }
    };

    const handleCategoryChange = (e) => {
        if (!podeEditar) return;
        const catId = Number(e.target.value);
        setFormData(prev => ({ ...prev, id_categoria: catId, id_subcategoria: '' }));
        const selected = categorias.find(c => c.id_categoria === catId);
        setFilteredSubcategories(selected ? selected.subcategorias : []);
    };

    const refreshCategories = async () => { const { data } = await api.get('/categorias'); setCategorias(data); };
    const refreshBrands = async () => { const { data } = await api.get('/marcas'); setMarcas(data); };

    const handleCategorySelectedFromBrowser = (category) => {
        if (!podeEditar) return;
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

    const steps = [
        { id: 'essenciais', label: 'Essenciais e Preço' },
        { id: 'config', label: 'Configuração e Logística' },
        { id: 'fiscal', label: 'Tributação (NF)' }, 
    ];

    if (creationMode === 'crafting') {
        steps.push({ id: 'receita', label: 'Ficha Técnica' });
    }

    if (isMlConfigured && showMlAttributes) {
        steps.push({ id: 'atributos_ml', label: 'Atributos ML' });
    }

    const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
    const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 0));

    if (!podeVer && !loading) {
        return (
            <Container className="pt-5 mt-5 text-center">
                <Alert variant="danger" className="d-inline-block p-4 rounded-4 shadow-sm border-0">
                    <i className="bi bi-shield-lock-fill display-4 text-danger mb-3 d-block"></i>
                    <h4 className="fw-bold">Acesso Restrito</h4>
                    <p className="text-muted mb-0">Você não tem permissão para visualizar detalhes de produtos. Fale com o administrador da loja se precisar de acesso.</p>
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

                        <div className=" mb-4 mt-4">
                            <h6 className="text-uppercase fw-bold mb-4 ls-1" style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>1. Detalhes Essenciais</h6>
                            <UiField label="Nome do Produto" name="nome" value={formData.nome} onChange={handleChange} placeholder="Ex: Smartphone XYZ..." disabled={!podeEditar} />
                            <UiField label="Descrição Completa" type="textarea" rows={5} name="descricao" value={formData.descricao} onChange={handleChange} placeholder="Descreva as características e benefícios..." hint="Uma boa descrição melhora o SEO e as vendas." disabled={!podeEditar} />
                        </div>

                        <ProductPricing
                            formData={formData}
                            handleChange={handleChange}
                            setFormData={setFormData}
                            estoqueOriginal={estoqueOriginal}
                            isCrafting={creationMode === 'crafting'}
                        />

                        {/* 🟢 O SEU NOVO COMPONENTE DE PERSONALIZAÇÃO NÍVEL IFOOD! */}
                        {podeEditar && (
                            <ProductComplements 
                                allProducts={allProducts} 
                                groups={gruposComplemento} 
                                setGroups={setGruposComplemento} 
                            />
                        )}
                    </div>
                );
            case 'config':
                return (
                    <div className="fade-in">
                        <ProductSettings formData={formData} handleChange={handleChange} isCrafting={creationMode === 'crafting'} />
                        <ProductOrganization
                            formData={formData} handleChange={handleChange} handleCategoryChange={handleCategoryChange}
                            categorias={categorias} filteredSubcategories={filteredSubcategories} marcas={marcas} fornecedores={fornecedores}
                            setShowCategoryManager={() => podeEditar && setModals(prev => ({ ...prev, category: true }))}
                            setShowBrandManager={() => podeEditar && setModals(prev => ({ ...prev, brand: true }))}
                        />

                        <div className="mb-4">
                            <h6 className="text-uppercase fw-bold mb-3 ls-1" style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                                <i className="bi bi-truck me-2"></i>Logística (Embalagem)
                            </h6>
                            <Row className="g-2">
                                <Col xs={6} md={3}><UiField label="Peso (kg)" type='number' step="0.001" name="peso" placeholder="0.3" value={formData.peso} onChange={handleChange} disabled={!podeEditar} /></Col>
                                <Col xs={6} md={3}><UiField label="Largura (cm)" type='number' name="largura" placeholder="11" value={formData.largura} onChange={handleChange} disabled={!podeEditar} /></Col>
                                <Col xs={6} md={3}><UiField label="Altura (cm)" type='number' name="altura" placeholder="2" value={formData.altura} onChange={handleChange} disabled={!podeEditar} /></Col>
                                <Col xs={6} md={3}><UiField label="Comp (cm)" type='number' name="comprimento" placeholder="16" value={formData.comprimento} onChange={handleChange} disabled={!podeEditar} /></Col>
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
                                        <input className="form-check-input cursor-pointer" type="checkbox" checked={showMlAttributes} onChange={(e) => podeEditar && setShowMlAttributes(e.target.checked)} disabled={!podeEditar} />
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
                            formData={formData} setShowCategoryBrowser={() => podeEditar && setModals(prev => ({ ...prev, browser: true }))}
                            isFetchingAttributes={isFetchingAttributes} categoryAttributes={categoryAttributes}
                            dynamicAttrValues={dynamicAttrValues} handleDynamicAttrChange={(e) => podeEditar && setDynamicAttrValues(p => ({ ...p, [e.target.name]: e.target.value }))}
                            gtinNaoSeAplica={gtinNaoSeAplica} handleGtinNaChange={(e) => podeEditar && setGtinNaoSeAplica(e.target.checked)}
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

                    {!podeEditar && (
                        <Alert variant="warning" className="mb-4 rounded-3 border-0 shadow-sm d-flex align-items-center">
                            <i className="bi bi-info-circle-fill me-3 fs-4"></i>
                            <div>
                                <h6 className="fw-bold mb-1">Modo de Leitura</h6>
                                <p className="mb-0 small">Você tem permissão apenas para visualizar os dados deste produto. Suas alterações não poderão ser salvas.</p>
                            </div>
                        </Alert>
                    )}

                    <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-5 mt-3 gap-3">
                        <div>
                            <div className="d-flex align-items-center gap-2 mb-1">
                                <h4 className="fw-bold m-0" style={{ color: 'var(--text-primary)' }}>{podeEditar ? 'Editar Produto' : 'Visualizar Produto'}</h4>
                                <Badge bg="secondary" className="bg-opacity-10 text-secondary border fw-normal" style={{ borderColor: 'var(--border-color)' }}>ID #{productId}</Badge>
                            </div>
                            <div className="d-flex align-items-center mt-2">
                                <ButtonGroup size="sm" className="rounded-pill p-1 border shadow-sm" style={{ backgroundColor: 'var(--bg-sidebar)', borderColor: 'var(--border-color)' }}>
                                    <Button variant={creationMode === 'manual' ? 'primary' : 'link'} className={`rounded-pill px-3 fw-medium border-0 ${creationMode === 'manual' ? 'text-white' : 'text-muted text-decoration-none'}`} style={{ fontSize: '11px' }} onClick={() => { podeEditar && setFormData(p => ({ ...p, tipo_produto: 'FINAL' })); }}>
                                        Manual
                                    </Button>
                                    <Button variant={creationMode === 'crafting' ? 'primary' : 'link'} className={`rounded-pill px-3 fw-medium border-0 ${creationMode === 'crafting' ? 'text-white' : 'text-muted text-decoration-none'}`} style={{ fontSize: '11px' }} onClick={() => { podeEditar && setFormData(p => ({ ...p, tipo_produto: 'MISTO' })); }}>
                                        Ficha Técnica
                                    </Button>
                                </ButtonGroup>
                            </div>
                        </div>

                        <div className="d-flex gap-2">
                            <Button variant="light" size="sm" className="border fw-medium px-3 rounded-3" as={Link} to="/products" style={{ backgroundColor: 'var(--bg-sidebar)', color: 'var(--text-primary)', borderColor: 'var(--border-color)' }}>
                                {podeEditar ? 'Cancelar' : 'Voltar para Lista'}
                            </Button>
                        </div>
                    </div>

                    {error && <Alert variant="danger" className="mb-4 shadow-sm rounded-3 border-0">{error}</Alert>}

                    <Row className="justify-content-center">
                        <Col lg={9}>
                            <div className="p-4 p-md-5 mb-5 rounded-4 shadow-sm" style={{ backgroundColor: 'var(--bg-sidebar)', border: '1px solid var(--border-color)' }}>

                                <div className="stepper-wrapper mb-5 px-3">
                                    {steps.map((step, index) => (
                                        <div key={step.id} className={`step-item ${index <= currentStep ? 'active' : ''}`}>
                                            <div className="step-counter">{index + 1}</div>
                                            <div className="step-name">{step.label}</div>
                                        </div>
                                    ))}
                                </div>

                                <div className="form-content-wrapper">
                                    {renderStepContent()}
                                </div>

                                <div className="d-flex justify-content-between mt-5 pt-4" style={{ borderTop: '1px solid var(--border-color)' }}>
                                    <Button variant="light" className="border fw-medium px-4 rounded-pill" onClick={prevStep} disabled={currentStep === 0}>
                                        <i className="bi bi-arrow-left me-2"></i> Voltar
                                    </Button>

                                    {currentStep < steps.length - 1 ? (
                                        <Button variant="primary" className="fw-medium px-4 text-white rounded-pill" onClick={nextStep}>
                                            Próximo <i className="bi bi-arrow-right ms-2"></i>
                                        </Button>
                                    ) : (
                                        podeEditar && (
                                            <Button variant="dark" onClick={submitHandler} disabled={loadingUpdate} className="px-4 fw-medium border-0 shadow-sm rounded-pill" style={{ backgroundColor: 'var(--text-primary)', color: 'var(--bg-sidebar)' }}>
                                                {loadingUpdate ? <Spinner size="sm" animation="border" /> : <><i className="bi bi-check2 me-1"></i> Finalizar Edição</>}
                                            </Button>
                                        )
                                    )}
                                </div>
                            </div>
                        </Col>
                    </Row>
                </div>
            </div>

            <StockAuditModal show={showStockModal} onHide={() => setShowStockModal(false)} onSubmit={submitHandler} estoqueOriginal={estoqueOriginal} novoEstoque={formData.estoque} motivo={auditData.motivo} setMotivo={(v) => setAuditData(prev => ({ ...prev, motivo: v }))} origem={auditData.origem} setOrigem={(v) => setAuditData(prev => ({ ...prev, origem: v }))} loading={loadingUpdate} />
            <CategoryBrowser show={modals.browser} onHide={() => setModals(prev => ({ ...prev, browser: false }))} onCategorySelect={handleCategorySelectedFromBrowser} />
            <CategoryManagerModal show={modals.category} handleClose={() => setModals(prev => ({ ...prev, category: false }))} initialCategories={categorias} onUpdate={refreshCategories} />
            <BrandManagerModal show={modals.brand} handleClose={() => setModals(prev => ({ ...prev, brand: false }))} initialBrands={marcas} onUpdate={refreshBrands} />

            <style>{`
                .clean-card { background: var(--bg-sidebar, #ffffff); border: 1px solid var(--border-color, #e2e8f0); border-radius: 12px; box-shadow: none; overflow: hidden; }
                
                .stepper-wrapper { display: flex; justify-content: space-between; position: relative; }
                .stepper-wrapper::before { content: ''; position: absolute; top: 15px; left: 10%; width: 80%; height: 2px; background: var(--border-color, #e2e8f0); z-index: 0; }
                .step-item { position: relative; z-index: 1; display: flex; flex-direction: column; align-items: center; flex: 1; opacity: 0.5; transition: opacity 0.3s ease; }
                .step-item.active { opacity: 1; }
                .step-counter { width: 32px; height: 32px; border-radius: 50%; background: var(--bg-sidebar, #fff); border: 2px solid var(--border-color, #e2e8f0); display: flex; align-items: center; justify-content: center; font-weight: bold; color: var(--text-secondary); margin-bottom: 8px; transition: all 0.3s; }
                .step-item.active .step-counter { background: var(--text-primary, #0f172a); border-color: var(--text-primary, #0f172a); color: var(--bg-sidebar, #fff); }
                .step-name { font-size: 12px; font-weight: 600; color: var(--text-secondary); text-align: center; }
                .step-item.active .step-name { color: var(--text-primary, #0f172a); }

                .fade-in { animation: fadeIn 0.3s ease-in-out; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
                .cursor-pointer { cursor: pointer; }

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

export default ProductEditForm;