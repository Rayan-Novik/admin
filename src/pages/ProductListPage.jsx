import React, { useState, useEffect, useMemo } from 'react';
import { Container, Alert, Spinner } from 'react-bootstrap';
import { AnimatePresence } from 'framer-motion';
import api from '../services/api';
import { toast } from 'react-toastify';

// 🟢 HOOK DE PERMISSÃO
import { usePermission } from '../hooks/usePermission'; 

import StatsCards from '../components/productlistcomponents/StatsCards';
import ProductFilters from '../components/productlistcomponents/ProductFilters';
// 👇 AQUI ESTAVA O ERRO: Removido as chaves {} 
import ProductDesktopTable from '../components/productlistcomponents/ProductDesktopTable'; 
import ProductStockHistoryModal from '../components/productlistcomponents/ProductStockHistoryModal';
import ProductCompositionModal from '../components/productlistcomponents/ProductCompositionModal';
import ProductCraftModal from '../components/productlistcomponents/ProductCraftModal';

const ProductListPage = () => {
    // 🟢 INICIANDO O HOOK E VERIFICANDO PERMISSÕES
    const { can } = usePermission();
    const podeGerenciarProdutos = can('PRODUTOS_MANAGE');

    const [produtos, setProdutos] = useState([]);
    const [categorias, setCategorias] = useState([]);
    const [marcas, setMarcas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [searchCode, setSearchCode] = useState(''); 
    const [filterCategory, setFilterCategory] = useState('');
    const [filterSubCategory, setFilterSubCategory] = useState('');
    const [filterBrand, setFilterBrand] = useState('');
    const [filterType, setFilterType] = useState(''); 
    const [fbConfig, setFbConfig] = useState({});
    const [isMlConfigured, setIsMlConfigured] = useState(false);
    
    // Modais
    const [showHistory, setShowHistory] = useState(false);
    const [showComposition, setShowComposition] = useState(false);             
    const [showCraft, setShowCraft] = useState(false);             
    const [selectedProduct, setSelectedProduct] = useState(null);

    const defaultImage = 'https://placehold.co/150x150?text=Sem+Foto';
    const isFacebookReady = !!(fbConfig.FB_PAGE_TOKEN && fbConfig.FB_PAGE_ID);

    const fetchData = async () => {
        try {
            setLoading(true);
            
            // 1. Busca APENAS os dados vitais primeiro
            const [prodRes, catRes, marcaRes] = await Promise.all([
                api.get('/produtos'), 
                api.get('/categorias'), 
                api.get('/marcas')
            ]);
            
            setProdutos(prodRes.data); 
            setCategorias(catRes.data); 
            setMarcas(marcaRes.data);

            // 2. Tenta buscar a API do Facebook separadamente
            try {
                const fbRes = await api.get('/apikeys/facebook');
                if (fbRes.data) setFbConfig(fbRes.data);
            } catch (e) {
                console.log("Sem permissão para Facebook. Ignorando...");
            }

            // 3. Tenta buscar o Mercado Livre separadamente
            try { 
                await api.get('/mercadolivre/check-auth'); 
                setIsMlConfigured(true); 
            } catch (e) { 
                setIsMlConfigured(false); 
            }

        } catch (err) { 
            console.error(err);
            setError('Não foi possível carregar os dados.'); 
        } finally { 
            setLoading(false); 
        }
    };

    useEffect(() => { fetchData(); }, []);

    const availableSubcategories = useMemo(() => {
        if (!filterCategory) return [];
        const cat = categorias.find(c => c.id_categoria === Number(filterCategory));
        return cat ? cat.subcategorias : [];
    }, [filterCategory, categorias]);

    const filteredProdutos = useMemo(() => {
        return produtos.filter(p => {
            const matchesSearch = searchTerm === '' || p.nome.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesCode = searchCode === '' || String(p.id_produto).includes(searchCode) || (p.id_externo && String(p.id_externo).toLowerCase().includes(searchCode.toLowerCase()));
            const matchesCategory = filterCategory ? p.id_categoria === Number(filterCategory) : true;
            const matchesSubCategory = filterSubCategory ? p.id_subcategoria === Number(filterSubCategory) : true;
            const matchesBrand = filterBrand ? p.id_marca === Number(filterBrand) : true;
            const matchesType = filterType ? p.tipo_produto === filterType : true; 
            return matchesSearch && matchesCode && matchesCategory && matchesSubCategory && matchesBrand && matchesType;
        });
    }, [produtos, searchTerm, searchCode, filterCategory, filterSubCategory, filterBrand, filterType]);

    const stats = useMemo(() => ({
        total: produtos.length, ativos: produtos.filter(p => p.active_ecommerce).length,
        insumos: produtos.filter(p => p.tipo_produto === 'INSUMO').length,
        noML: isMlConfigured ? produtos.filter(p => p.mercado_livre_id).length : 0 
    }), [produtos, isMlConfigured]);

    const handleCategoryChange = (e) => { setFilterCategory(e.target.value); setFilterSubCategory(''); };
    const handleShowHistory = (product) => { setSelectedProduct(product); setShowHistory(true); };
    const handleShowComposition = (product) => { setSelectedProduct(product); setShowComposition(true); };
    const handleShowCraft = (product) => { setSelectedProduct(product); setShowCraft(true); };

    // ==========================================================
    // 🟢 PROTEGENDO AS FUNÇÕES CRÍTICAS
    // ==========================================================

    const toggleEcommerceHandler = async (id, currentStatus) => {
        if (!podeGerenciarProdutos) return toast.error('Sem permissão para alterar status.');
        try {
            await api.put(`/produtos/${id}/ecommerce-status`);
            setProdutos(prev => prev.map(p => p.id_produto === id ? { ...p, active_ecommerce: !currentStatus } : p));
        } catch (err) { toast.error('Erro ao alterar status.'); }
    };

    const deleteHandler = async (id) => {
        if (!podeGerenciarProdutos) return toast.error('Sem permissão para excluir produtos.');
        if (window.confirm('Excluir produto permanentemente?')) { 
            try { await api.delete(`/produtos/${id}`); fetchData(); } 
            catch (err) { toast.error('Erro ao excluir.'); } 
        }
    };

    const handlePostOrganico = async (id) => {
        if (!podeGerenciarProdutos) return toast.error('Sem permissão.');
        if (window.confirm("Publicar no Facebook Orgânico?")) {
            try { await api.post(`/marketing/campaigns/postar-organico-produto/${id}`); toast.success("Publicado!"); } 
            catch { toast.error("Erro ao publicar."); }
        }
    };

    const handleAnuncioPago = async (id) => {
        if (!podeGerenciarProdutos) return toast.error('Sem permissão.');
        const valor = window.prompt("Orçamento diário (R$):", "5.00");
        if (valor) {
            try { await api.post(`/marketing/campaigns/criar-anuncio-pago-produto/${id}`, { orcamento: valor }); toast.success("Campanha criada!"); } 
            catch { toast.error("Erro ao criar anúncio."); }
        }
    };

    const publishHandler = async (id) => {
        if (!podeGerenciarProdutos) return toast.error('Sem permissão.');
        if (window.confirm('Publicar no Mercado Livre?')) {
            try { 
                const { data } = await api.post(`/produtos/${id}/publish-ml`); 
                toast.success(`Sucesso! Link: ${data.url}`); fetchData();
            } catch (err) { toast.error(`Erro: ${err.response?.data?.message}`); }
        }
    };

    const updateStatusHandler = async (id, currentStatus) => {
        if (!podeGerenciarProdutos) return toast.error('Sem permissão.');
        const newStatus = currentStatus === 'active' ? 'paused' : 'active';
        if (window.confirm(`Deseja ${newStatus === 'active' ? 'REATIVAR' : 'PAUSAR'} este anúncio?`)) {
            try { await api.put(`/produtos/${id}/ml-status`, { status: newStatus }); fetchData(); } 
            catch { toast.error(`Erro ao alterar status.`); }
        }
    };

    const syncStatusHandler = async (id) => {
        if (!podeGerenciarProdutos) return toast.error('Sem permissão.');
        try { 
            setLoading(true);
            const { data } = await api.get(`/produtos/${id}/ml-sync`); 
            await fetchData(); 
            toast.info(data.reset ? 'Produto desvinculado (fechado no ML).' : `Sincronizado: ${data.status}`);
        } catch { toast.error('Erro ao sincronizar.'); } 
        finally { setLoading(false); }
    };

    const renderStatusBadge = (status) => {
        const config = { 'active': { bg: 'success', text: 'Ativo' }, 'paused': { bg: 'warning', text: 'Pausado' }, 'closed': { bg: 'danger', text: 'Fechado' }, 'default': { bg: 'secondary', text: '-' } };
        const { bg, text } = config[status] || config['default'];
        return <span className={`badge bg-${bg} bg-opacity-10 text-${bg} border border-${bg} border-opacity-25 fw-medium px-2 py-1`}>{text}</span>;
    };

    return (
        <div style={{ backgroundColor: 'var(--bg-main, #f8fafc)', minHeight: '100vh' }}>
            <Container fluid="lg" className="px-lg-3 px-0 pt-lg-4 pt-3">
                <div className="px-3 px-lg-0">
                    <StatsCards stats={stats} showMlStats={isMlConfigured} />
                    
                    <ProductFilters 
                        searchTerm={searchTerm} setSearchTerm={setSearchTerm} searchCode={searchCode} setSearchCode={setSearchCode}
                        filterCategory={filterCategory} categorias={categorias} handleCategoryChange={handleCategoryChange}
                        filterSubCategory={filterSubCategory} setFilterSubCategory={setFilterSubCategory} availableSubcategories={availableSubcategories}
                        filterBrand={filterBrand} setFilterBrand={setFilterBrand} marcas={marcas} fetchData={fetchData} loading={loading}
                        filterType={filterType} setFilterType={setFilterType}
                        podeGerenciarProdutos={podeGerenciarProdutos} 
                    />

                    <div className="p-0 mt-3">
                        <AnimatePresence mode='wait'>
                            {loading ? (
                                <div className="d-flex justify-content-center align-items-center py-5" style={{ minHeight: '300px' }}>
                                    <Spinner animation="border" style={{ color: '#0A84FF' }} />
                                </div>
                            ) : error ? (
                                <Alert variant="danger" className="text-center border-0 rounded-4 shadow-sm">{error}</Alert>
                            ) : (
                                /* 👇 AQUI ENTRA A NOSSA LISTA UNIVERSAL 👇 */
                                <ProductDesktopTable
                                    products={filteredProdutos} toggleEcommerce={toggleEcommerceHandler} renderStatusBadge={renderStatusBadge} 
                                    syncStatus={syncStatusHandler} publishHandler={publishHandler} isFacebookReady={isFacebookReady}
                                    fbConfig={fbConfig} handlePostOrganico={handlePostOrganico} handleAnuncioPago={handleAnuncioPago} 
                                    updateStatusHandler={updateStatusHandler} deleteHandler={deleteHandler} defaultImage={defaultImage}
                                    onShowHistory={handleShowHistory} isMlConfigured={isMlConfigured} onShowComposition={handleShowComposition}
                                    onShowCraft={handleShowCraft} categoriesList={categorias}
                                    podeGerenciarProdutos={podeGerenciarProdutos}
                                />
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                <ProductStockHistoryModal show={showHistory} onHide={() => setShowHistory(false)} productId={selectedProduct?.id_produto} productName={selectedProduct?.nome} />
                <ProductCompositionModal show={showComposition} onHide={() => setShowComposition(false)} product={selectedProduct} allProducts={produtos} />
                <ProductCraftModal show={showCraft} onHide={() => setShowCraft(false)} product={selectedProduct} onSuccess={() => { setShowCraft(false); fetchData(); }} />
            </Container>
        </div>
    );
};

export default ProductListPage;