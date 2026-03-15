import React, { useState, useEffect, useMemo } from 'react';
import { Container, Alert, Badge } from 'react-bootstrap';
import { AnimatePresence } from 'framer-motion';
import api from '../services/api';

// --- COMPONENTES DA LISTA ---
import StatsCards from '../components/productlistcomponents/StatsCards';
import ProductFilters from '../components/productlistcomponents/ProductFilters';
import ProductDesktopTable from '../components/productlistcomponents/ProductDesktopTable';
import ProductMobileCards from '../components/productlistcomponents/ProductMobileCards';
import ProductStockHistoryModal from '../components/productlistcomponents/ProductStockHistoryModal';

// --- MODAIS DE MANUFATURA ---
import ProductCompositionModal from '../components/productlistcomponents/ProductCompositionModal';
import ProductCraftModal from '../components/productlistcomponents/ProductCraftModal';

const ProductListPage = () => {
    const [produtos, setProdutos] = useState([]);
    const [categorias, setCategorias] = useState([]);
    const [marcas, setMarcas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    
    // Filtros
    const [searchTerm, setSearchTerm] = useState('');
    const [searchCode, setSearchCode] = useState(''); // ✅ NOVO ESTADO PARA CÓDIGO
    
    const [filterCategory, setFilterCategory] = useState('');
    const [filterSubCategory, setFilterSubCategory] = useState('');
    const [filterBrand, setFilterBrand] = useState('');
    const [filterType, setFilterType] = useState(''); 

    // Configs e Estados Auxiliares
    const [fbConfig, setFbConfig] = useState({});
    const [isMlConfigured, setIsMlConfigured] = useState(false);
    
    // Estados dos Modais
    const [showHistory, setShowHistory] = useState(false);
    const [showComposition, setShowComposition] = useState(false); 
    const [showCraft, setShowCraft] = useState(false);             
    const [selectedProduct, setSelectedProduct] = useState(null);

    const defaultImage = 'https://via.placeholder.com/150?text=No+Img';
    const isFacebookReady = !!(fbConfig.FB_PAGE_TOKEN && fbConfig.FB_PAGE_ID);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [prodRes, catRes, marcaRes, fbRes] = await Promise.all([
                api.get('/produtos'), 
                api.get('/categorias'), 
                api.get('/marcas'), 
                api.get('/apikeys/facebook')
            ]);
            setProdutos(prodRes.data);
            setCategorias(catRes.data);
            setMarcas(marcaRes.data);
            if (fbRes.data) setFbConfig(fbRes.data);

            try {
                await api.get('/mercadolivre/check-auth'); 
                setIsMlConfigured(true);
            } catch { setIsMlConfigured(false); }

        } catch (err) { 
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

    // ✅ LÓGICA DE FILTRAGEM CORRIGIDA
    const filteredProdutos = useMemo(() => {
        return produtos.filter(p => {
            // 1. Busca por Nome (Case Insensitive)
            const matchesSearch = searchTerm === '' || 
                                  p.nome.toLowerCase().includes(searchTerm.toLowerCase());
            
            // 2. Busca por Código/SKU (Permite números e texto)
            // Converte o ID para string para permitir busca parcial "10" acha "101", "102"
            // Verifica ID Interno (id_produto) OU ID Externo (id_externo / SKU)
            const matchesCode = searchCode === '' || 
                                String(p.id_produto).includes(searchCode) || 
                                (p.id_externo && String(p.id_externo).toLowerCase().includes(searchCode.toLowerCase()));

            const matchesCategory = filterCategory ? p.id_categoria === Number(filterCategory) : true;
            const matchesSubCategory = filterSubCategory ? p.id_subcategoria === Number(filterSubCategory) : true;
            const matchesBrand = filterBrand ? p.id_marca === Number(filterBrand) : true;
            const matchesType = filterType ? p.tipo_produto === filterType : true; 
            
            return matchesSearch && matchesCode && matchesCategory && matchesSubCategory && matchesBrand && matchesType;
        });
    }, [produtos, searchTerm, searchCode, filterCategory, filterSubCategory, filterBrand, filterType]);

    const stats = useMemo(() => ({
        total: produtos.length,
        ativos: produtos.filter(p => p.active_ecommerce).length,
        insumos: produtos.filter(p => p.tipo_produto === 'INSUMO').length,
        noML: isMlConfigured ? produtos.filter(p => p.mercado_livre_id).length : 0 
    }), [produtos, isMlConfigured]);

    // --- HANDLERS ---
    const handleCategoryChange = (e) => { 
        setFilterCategory(e.target.value); 
        setFilterSubCategory(''); 
    };

    const handleShowHistory = (product) => { setSelectedProduct(product); setShowHistory(true); };
    const handleShowComposition = (product) => { setSelectedProduct(product); setShowComposition(true); };
    const handleShowCraft = (product) => { setSelectedProduct(product); setShowCraft(true); };

    const toggleEcommerceHandler = async (id, currentStatus) => {
        try {
            await api.put(`/produtos/${id}/ecommerce-status`);
            setProdutos(prev => prev.map(p => p.id_produto === id ? { ...p, active_ecommerce: !currentStatus } : p));
        } catch (err) { alert('Erro ao alterar status.'); }
    };

    const deleteHandler = async (id) => {
        if (window.confirm('Excluir produto permanentemente?')) { 
            try { await api.delete(`/produtos/${id}`); fetchData(); } 
            catch (err) { alert('Erro ao excluir.'); } 
        }
    };

    const handlePostOrganico = async (id) => {
        if (window.confirm("Publicar no Facebook Orgânico?")) {
            try { await api.post(`/marketing/campaigns/postar-organico-produto/${id}`); alert("Publicado!"); } 
            catch { alert("Erro ao publicar."); }
        }
    };
    const handleAnuncioPago = async (id) => {
        const valor = window.prompt("Orçamento diário (R$):", "5.00");
        if (valor) {
            try { await api.post(`/marketing/campaigns/criar-anuncio-pago-produto/${id}`, { orcamento: valor }); alert("Campanha criada!"); } 
            catch { alert("Erro ao criar anúncio."); }
        }
    };
    const publishHandler = async (id) => {
        if (window.confirm('Publicar no Mercado Livre?')) {
            try { 
                const { data } = await api.post(`/produtos/${id}/publish-ml`); 
                alert(`Sucesso! Link: ${data.url}`); fetchData();
            } catch (err) { alert(`Erro: ${err.response?.data?.message}`); }
        }
    };
    const updateStatusHandler = async (id, currentStatus) => {
        const newStatus = currentStatus === 'active' ? 'paused' : 'active';
        if (window.confirm(`Deseja ${newStatus === 'active' ? 'REATIVAR' : 'PAUSAR'} este anúncio?`)) {
            try { await api.put(`/produtos/${id}/ml-status`, { status: newStatus }); fetchData(); } 
            catch { alert(`Erro ao alterar status.`); }
        }
    };
    const syncStatusHandler = async (id) => {
        try { 
            setLoading(true);
            const { data } = await api.get(`/produtos/${id}/ml-sync`); 
            await fetchData(); 
            alert(data.reset ? 'Produto desvinculado (fechado no ML).' : `Sincronizado: ${data.status}`);
        } catch { alert('Erro ao sincronizar.'); } 
        finally { setLoading(false); }
    };

    const renderStatusBadge = (status) => {
        const config = { 
            'active': { bg: 'success', text: 'Ativo' }, 
            'paused': { bg: 'warning', text: 'Pausado' }, 
            'closed': { bg: 'danger', text: 'Fechado' }, 
            'default': { bg: 'secondary', text: '-' } 
        };
        const { bg, text } = config[status] || config['default'];
        return <Badge bg={bg} className="fw-normal px-2">{text}</Badge>;
    };

    return (
        <Container fluid className="px-md-4 py-4">
            <StatsCards stats={stats} showMlStats={isMlConfigured} />
            
            {/* ✅ FILTROS ATUALIZADOS COM BUSCA POR CÓDIGO */}
            <ProductFilters 
                searchTerm={searchTerm} setSearchTerm={setSearchTerm}
                searchCode={searchCode} setSearchCode={setSearchCode} // Passando o estado
                
                filterCategory={filterCategory} categorias={categorias}
                handleCategoryChange={handleCategoryChange}
                filterSubCategory={filterSubCategory} setFilterSubCategory={setFilterSubCategory}
                availableSubcategories={availableSubcategories}
                filterBrand={filterBrand} setFilterBrand={setFilterBrand}
                marcas={marcas} fetchData={fetchData} loading={loading}
                filterType={filterType} setFilterType={setFilterType}
            />

            <AnimatePresence mode='wait'>
                {error ? (
                    <Alert variant="danger" className="text-center">{error}</Alert>
                ) : filteredProdutos.length === 0 ? (
                    <div className="text-center py-5 text-muted">
                        <i className="bi bi-box-seam display-4 mb-3 opacity-25"></i>
                        <p>Nenhum produto encontrado.</p>
                    </div>
                ) : (
                    <>
                        {/* VISÃO DESKTOP */}
                        <div className="d-none d-lg-block">
                            <ProductDesktopTable 
                                products={filteredProdutos} 
                                toggleEcommerce={toggleEcommerceHandler}
                                renderStatusBadge={renderStatusBadge} 
                                syncStatus={syncStatusHandler}
                                publishHandler={publishHandler} 
                                isFacebookReady={isFacebookReady}
                                fbConfig={fbConfig}
                                handlePostOrganico={handlePostOrganico}
                                handleAnuncioPago={handleAnuncioPago} 
                                updateStatusHandler={updateStatusHandler}
                                deleteHandler={deleteHandler} 
                                defaultImage={defaultImage}
                                onShowHistory={handleShowHistory}
                                isMlConfigured={isMlConfigured}
                                onShowComposition={handleShowComposition}
                                onShowCraft={handleShowCraft}
                                categoriesList={categorias} // ✅ Essencial para corrigir o nome da categoria
                            />
                        </div>

                        {/* VISÃO MOBILE */}
                        <div className="d-lg-none">
                            <ProductMobileCards 
                                products={filteredProdutos}
                                toggleEcommerce={toggleEcommerceHandler}
                                renderStatusBadge={renderStatusBadge}
                                syncStatus={syncStatusHandler}
                                publishHandler={publishHandler}
                                updateStatusHandler={updateStatusHandler}
                                deleteHandler={deleteHandler}
                                isFacebookReady={isFacebookReady}
                                handlePostOrganico={handlePostOrganico}
                                defaultImage={defaultImage}
                                onShowHistory={handleShowHistory}
                                isMlConfigured={isMlConfigured}
                                onShowComposition={handleShowComposition}
                                onShowCraft={handleShowCraft}
                                categoriesList={categorias} // ✅ Também para o mobile
                            />
                        </div>
                    </>
                )}
            </AnimatePresence>

            <ProductStockHistoryModal 
                show={showHistory} 
                onHide={() => setShowHistory(false)}
                productId={selectedProduct?.id_produto}
                productName={selectedProduct?.nome}
            />

            <ProductCompositionModal
                show={showComposition}
                onHide={() => setShowComposition(false)}
                product={selectedProduct}
                allProducts={produtos}
            />

            <ProductCraftModal
                show={showCraft}
                onHide={() => setShowCraft(false)}
                product={selectedProduct}
                onSuccess={() => {
                    setShowCraft(false);
                    fetchData();
                }}
            />
        </Container>
    );
};

export default ProductListPage;