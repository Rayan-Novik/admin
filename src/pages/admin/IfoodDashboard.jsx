import React, { useState, useEffect } from 'react';
import { Container, Spinner, Form, InputGroup, Button, Row, Col, Badge, Tabs, Tab } from 'react-bootstrap';
import api from '../../services/api';
import { toast } from 'react-toastify';

import IfoodProductActions from '../../components/ifood/IfoodProductActions';
import IfoodPromoModal from '../../components/ifood/IfoodPromoModal';        
import IfoodComboModal from '../../components/ifood/IfoodComboModal';        
import IfoodEditModal from '../../components/ifood/IfoodEditModal';
import IfoodOrdersManager from '../../components/ifood/IfoodOrdersManager'; // 🟢 IMPORT DO COMPONENTE SEPARADO

const IfoodDashboard = () => {
    const [activeTab, setActiveTab] = useState('catalogo');
    
    // --- ESTADOS DO CATÁLOGO ---
    const [produtos, setProdutos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [syncingId, setSyncingId] = useState(null); 
    const [isSyncingAll, setIsSyncingAll] = useState(false); 
    const [isImporting, setIsImporting] = useState(false); 
    const [statusIfood, setStatusIfood] = useState({ connected: false });
    const [searchTerm, setSearchTerm] = useState('');
    
    // Controles dos Modais
    const [showPromoModal, setShowPromoModal] = useState(false);
    const [showComboModal, setShowComboModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false); 
    const [produtoSelecionado, setProdutoSelecionado] = useState(null);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [statusRes, prodRes] = await Promise.all([
                api.get('/ifood/status'),
                api.get('/produtos') 
            ]);
            setStatusIfood(statusRes.data);
            setProdutos(prodRes.data);
        } catch (error) {
            toast.error('Erro ao carregar dados do iFood');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const handleImportIfood = async () => {
        if (!window.confirm("Deseja importar todo o cardápio do iFood para o sistema? Isso trará categorias e produtos automaticamente.")) return;
        setIsImporting(true);
        toast.info('Importando catálogo do iFood. Isso pode levar alguns segundos...', { autoClose: 4000 });
        try {
            const res = await api.post('/ifood/importar-ifood');
            toast.success(`🎉 ${res.data.message} ${res.data.detalhes.categorias_novas} categorias e ${res.data.detalhes.produtos_novos} novos produtos salvos.`);
            fetchData(); 
        } catch (error) {
            toast.error(error.response?.data?.message || 'Erro ao importar catálogo do iFood.');
        } finally {
            setIsImporting(false);
        }
    };

    const handleSyncAll = async () => {
        const presidential = produtos.filter(p => p.ifood_id); 
        if (presidential.length === 0) {
            toast.info('Nenhum produto publicado no iFood para sincronizar.');
            return;
        }
        if (!window.confirm(`Deseja sincronizar ${presidential.length} produtos com o iFood? Isso atualizará o estoque e todas as informações.`)) return;

        setIsSyncingAll(true);
        toast.info('Iniciando sincronização em massa. Aguarde...', { autoClose: 3000 });

        let successCount = 0;
        let errorCount = 0;
        for (const p of presidential) {
            try {
                await api.post(`/ifood/produtos/${p.id_produto}/sync`);
                successCount++;
            } catch (error) { errorCount++; }
        }

        if (errorCount === 0) {
            toast.success(`🎉 Todos os ${successCount} produtos foram sincronizados com sucesso!`);
        } else {
            toast.warning(`Sincronização concluída: ${successCount} sucessos, ${errorCount} falhas.`);
        }
        setIsSyncingAll(false);
        fetchData(); 
    };

    const handleSync = async (idProduto, acaoPromo = null) => {
        setSyncingId(idProduto);
        setShowPromoModal(false); 
        try {
            let urlSync = `/ifood/produtos/${idProduto}/sync`;
            if (acaoPromo === 'remover') urlSync += '?removerPromo=true';
            else if (acaoPromo) urlSync += `?promocao=${acaoPromo}`;

            await api.post(urlSync);
            toast.info('Sincronizando com iFood...');

            const produtoAtual = produtos.find(p => p.id_produto === idProduto);
            if (!produtoAtual?.ifood_id) {
                try { await api.post(`/ifood/produtos/${idProduto}/foto`); } catch (e) {}
            }
            toast.success('Produto updated no iFood!');
            fetchData(); 
        } catch (error) {
            toast.error('Erro ao sincronizar produto');
        } finally {
            setSyncingId(null);
        }
    };

    const handleSaveDetalhesIfood = async (idProduto, dados) => {
        setShowEditModal(false);
        setSyncingId(idProduto);
        try {
            await api.put(`/produtos/${idProduto}`, dados);
            await api.post(`/ifood/produtos/${idProduto}/sync`);
            toast.success('Detalhes atualizados e sincronizados no iFood!');
            fetchData();
        } catch (error) { toast.error('Erro ao salvar os detalhes.'); } 
        finally { setSyncingId(null); }
    };

    const handleToggleStatus = async (idProduto, statusAtual) => {
        const novoStatus = statusAtual === 'AVAILABLE' ? 'UNAVAILABLE' : 'AVAILABLE';
        setSyncingId(idProduto);
        try {
            await api.patch(`/ifood/produtos/${idProduto}/status`, { status: novoStatus });
            toast.success(`Status alterado com sucesso!`);
            fetchData();
        } catch (error) { toast.error('Erro ao pausar/retomar'); } 
        finally { setSyncingId(null); }
    };

    const handleSyncFoto = async (idProduto) => {
        setSyncingId(idProduto);
        try {
            await api.post(`/ifood/produtos/${idProduto}/foto`);
            toast.success('Foto atualizada no iFood!');
        } catch (error) { toast.error('Falha ao atualizar foto'); } 
        finally { setSyncingId(null); }
    };

    const filteredProdutos = produtos.filter(p => p.nome.toLowerCase().includes(searchTerm.toLowerCase()));
    const produtosAgrupados = filteredProdutos.reduce((acc, p) => {
        const catName = p.categorias?.nome || 'Geral';
        if (!acc[catName]) acc[catName] = [];
        acc[catName].push(p);
        return acc;
    }, {});

    if (loading) return <div className="text-center mt-5"><Spinner animation="border" variant="danger" /></div>;

    if (!statusIfood.connected) {
        return (
            <Container className="mt-4 text-center">
                <div className="p-5 shadow-sm border-0 rounded-4 ifood-product-card">
                    <i className="bi bi-shop text-danger mb-3" style={{ fontSize: '3rem' }}></i>
                    <h3 className="fw-bold ifood-text-primary">Seu iFood está Desconectado</h3>
                    <p className="ifood-text-secondary">Conecte sua loja para gerenciar o catálogo e pedidos por aqui.</p>
                </div>
            </Container>
        );
    }

    return (
        <div style={{ backgroundColor: 'var(--bg-main, #f8fafc)', minHeight: '100vh', paddingBottom: '2rem', transition: 'background-color 0.2s ease' }}>
            <Container fluid className="p-4">
                
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <h4 className="fw-bold mb-0 ifood-text-primary d-flex align-items-center">
                        <i className="bi bi-shop me-2 text-danger"></i>
                        Integração iFood
                    </h4>
                </div>

                <Tabs
                    id="ifood-tabs"
                    activeKey={activeTab}
                    onSelect={(k) => setActiveTab(k)}
                    className="mb-4 custom-ifood-tabs"
                >
                    <Tab eventKey="catalogo" title={<span><i className="bi bi-grid me-2"></i>Catálogo</span>}>
                        <Row className="mb-4 align-items-center mt-3">
                            <Col md={3}>
                                <InputGroup>
                                    <InputGroup.Text className="border-0 rounded-start-4 ps-3 ifood-input-bg">
                                        <i className="bi bi-search ifood-text-secondary"></i>
                                    </InputGroup.Text>
                                    <Form.Control 
                                        type="text" 
                                        placeholder="Buscar um item" 
                                        className="border-0 rounded-end-4 py-2 ifood-input-bg"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </InputGroup>
                            </Col>
                            <Col md={2}>
                                <Form.Select className="border-light-subtle rounded-3 py-2 fw-medium ifood-input-bg">
                                    <option value="">Filtrar categoria</option>
                                    {Object.keys(produtosAgrupados).map((cat, idx) => (
                                        <option key={idx} value={cat}>{cat}</option>
                                    ))}
                                </Form.Select>
                            </Col>
                            
                            <Col md={7} className="d-flex justify-content-end gap-2">
                                <Button 
                                    variant="outline-danger" 
                                    className="rounded-3 fw-bold d-flex align-items-center gap-2"
                                    onClick={handleImportIfood}
                                    disabled={isImporting || isSyncingAll}
                                >
                                    {isImporting ? <Spinner size="sm" /> : <i className="bi bi-cloud-arrow-down-fill"></i>}
                                    {isImporting ? 'Importando...' : 'Importar do iFood'}
                                </Button>

                                <Button 
                                    variant="primary" 
                                    className="rounded-3 fw-bold shadow-sm d-flex align-items-center gap-2 bg-danger border-danger"
                                    onClick={handleSyncAll}
                                    disabled={isSyncingAll || isImporting}
                                >
                                    {isSyncingAll ? <Spinner size="sm" /> : <i className="bi bi-arrow-repeat"></i>}
                                    {isSyncingAll ? 'Sincronizando...' : 'Sincronizar Tudo'}
                                </Button>
                            </Col>
                        </Row>

                        {Object.entries(produtosAgrupados).map(([categoriaNome, items]) => (
                            <div key={categoriaNome} className="mb-4 rounded-4 ifood-category-container">
                                <div className="d-flex justify-content-between align-items-center mb-3 px-2">
                                    <div className="d-flex align-items-center gap-2">
                                        <i className="bi bi-pencil-fill fs-6 cursor-pointer ifood-text-primary"></i>
                                        <h5 className="fw-bold mb-0 text-decoration-underline ifood-text-primary" style={{ textUnderlineOffset: '4px' }}>
                                            {categoriaNome}
                                        </h5>
                                        <span className="small ifood-text-secondary">({items.length} {items.length === 1 ? 'item' : 'itens'})</span>
                                    </div>
                                    <div className="d-flex gap-2">
                                        <Button size="sm" className="rounded-3 fw-medium px-3 ifood-btn-white" onClick={() => toast.info('Escolha um item abaixo e use os 3 pontinhos para criar combos.')}>Criar combo</Button>
                                        <Button size="sm" className="rounded-3 fw-medium px-3 ifood-btn-white" onClick={() => toast.info('Escolha um item abaixo e use os 3 pontinhos para ofertas.')}>Criar oferta</Button>
                                    </div>
                                </div>

                                <div className="d-flex flex-column gap-2">
                                    {items.map(p => {
                                        const isPromo = p.preco_ifood && Number(p.preco_ifood) < Number(p.preco);
                                        return (
                                            <div key={p.id_produto} className="rounded-4 p-3 shadow-sm d-flex justify-content-between align-items-center ifood-product-card">
                                                <div className="d-flex align-items-center gap-3">
                                                    <div className="ifood-img-placeholder" style={{ width: '60px', height: '60px', borderRadius: '12px', overflow: 'hidden' }}>
                                                        <img 
                                                            src={p.imagem_url || 'https://placehold.co/60x60?text=S/Foto'} 
                                                            alt={p.nome} 
                                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                        />
                                                    </div>
                                                    <div>
                                                        <div className="fw-bold fs-6 ifood-text-primary">{p.nome}</div>
                                                        <div className="d-flex align-items-center gap-2 mt-1">
                                                            {isPromo && <Badge className="fw-normal rounded-pill px-2 ifood-badge-light text-danger border-danger">Oferta Ativa</Badge>}
                                                            <span className="small ifood-text-secondary">{p.descricao ? p.descricao.substring(0, 40) + '...' : p.nome}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <IfoodProductActions 
                                                    produto={p}
                                                    syncingId={syncingId}
                                                    onSync={handleSync}
                                                    onToggleStatus={handleToggleStatus}
                                                    onSyncFoto={handleSyncFoto}
                                                    onOpenPromo={(prod) => { setProdutoSelecionado(prod); setShowPromoModal(true); }}
                                                    onOpenCombo={(prod) => { setProdutoSelecionado(prod); setShowComboModal(true); }}
                                                    onOpenEdit={(prod) => { setProdutoSelecionado(prod); setShowEditModal(true); }}
                                                />
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </Tab>

                    {/* 🟢 ABA DE PEDIDOS RENDERIZA O NOVO COMPONENTE ISOLADO */}
                    <Tab eventKey="pedidos" title={<span><i className="bi bi-receipt me-2"></i>Pedidos & Chat</span>}>
                        <div className="mt-3">
                            <IfoodOrdersManager statusConnected={statusIfood.connected} />
                        </div>
                    </Tab>
                </Tabs>

                {/* Modais Isolados */}
                <IfoodPromoModal 
                    show={showPromoModal} 
                    onHide={() => setShowPromoModal(false)}
                    produto={produtoSelecionado}
                    onSave={handleSync}
                    onRemove={handleSync}
                />

                <IfoodComboModal 
                    show={showComboModal}
                    onHide={() => setShowComboModal(false)}
                    produto={produtoSelecionado}
                    todosProdutos={produtos}
                    onSuccess={fetchData}
                />

                <IfoodEditModal 
                    show={showEditModal}
                    onHide={() => setShowEditModal(false)}
                    produto={produtoSelecionado}
                    onSave={handleSaveDetalhesIfood}
                />

                <style>{`
                    .ifood-category-container {
                        background-color: var(--bg-sidebar, #f7f7f7);
                        border: 1px solid var(--border-color, transparent);
                        padding: 16px;
                    }
                    
                    .ifood-product-card {
                        background-color: var(--bg-main, #ffffff);
                        border: 1px solid var(--border-color, #dee2e6) !important;
                    }

                    .ifood-text-primary { color: var(--text-primary, #212529) !important; }
                    .ifood-text-secondary { color: var(--text-secondary, #6c757d) !important; }

                    .ifood-input-bg {
                        background-color: var(--bg-main, #f8f9fa) !important;
                        border-color: var(--border-color, #dee2e6) !important;
                        color: var(--text-primary, #212529) !important;
                    }
                    .ifood-input-bg::placeholder { color: var(--text-secondary, #6c757d) !important; }

                    .ifood-btn-white {
                        background-color: var(--bg-main, #ffffff) !important;
                        border-color: var(--border-color, #dee2e6) !important;
                        color: var(--text-primary, #212529) !important;
                        transition: all 0.2s;
                    }
                    .ifood-btn-white:hover { background-color: var(--bg-hover, #f8f9fa) !important; }

                    .ifood-badge-light {
                        background-color: var(--bg-hover, #f8f9fa);
                        color: var(--text-primary, #212529) !important;
                        border: 1px solid var(--border-color, #dee2e6);
                    }

                    .ifood-img-placeholder { background-color: var(--bg-hover, #f5f5f5); }
                    
                    .hover-bg-light:hover { background-color: var(--bg-hover, #f8f9fa); }

                    .custom-ifood-tabs .nav-link {
                        color: var(--text-secondary, #6c757d);
                        border: none;
                        border-bottom: 3px solid transparent;
                        font-weight: 600;
                        padding: 10px 20px;
                        transition: all 0.2s;
                    }
                    .custom-ifood-tabs .nav-link:hover {
                        color: var(--text-primary, #dc3545);
                    }
                    .custom-ifood-tabs .nav-link.active {
                        color: #dc3545;
                        background: transparent;
                        border-bottom: 3px solid #dc3545;
                    }

                    body.dark-mode .modal-dark-fix { background-color: var(--bg-sidebar); border-color: var(--border-color); }
                    body.dark-mode .form-dark-fix { background-color: var(--bg-main); border-color: var(--border-color); color: var(--text-primary); }
                    body.dark-mode .form-dark-fix:focus { background-color: var(--bg-main); color: var(--text-primary); }
                    body.dark-mode .btn-close { filter: invert(1); }
                `}</style>

            </Container>
        </div>
    );
};

export default IfoodDashboard;