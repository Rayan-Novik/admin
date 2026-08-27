import React, { useState, useEffect, useMemo } from 'react';
import { Button, Spinner, Alert, Row, Col, InputGroup, Form, Container, Pagination, Nav, Badge } from 'react-bootstrap';
import { AnimatePresence, motion } from 'framer-motion';
import api from '../../services/api';
import { toast } from 'react-toastify';
import { Calendar } from 'lucide-react';
import { CtaButton } from '../../components/ui/buttons/CtaButton'
import { SquareButton } from '../../components/ui/buttons/SquareButton'

// 🟢 Importa os componentes
import { OrderListContent } from '../../components/orders/OrderListContent'; 
import { AdminAgendaSemanal } from '../../components/orders/AdminAgendaSemanal'; 

const OrderListPage = () => {

    // ==============================================================
    // LÓGICA DE PERMISSÕES
    // ==============================================================
    const rawUser = localStorage.getItem('adminInfo') || localStorage.getItem('user') || localStorage.getItem('usuario') || '{}';
    let dadosUser = {};
    try {
        dadosUser = JSON.parse(rawUser);
        if (dadosUser.user) dadosUser = { ...dadosUser, ...dadosUser.user };
    } catch (e) {}

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

    const podeVerPedidos = isDono || permissoesUsuario.includes('PEDIDOS_VIEW') || permissoesUsuario.includes('PEDIDOS_MANAGE');
    const podeGerenciarPedidos = isDono || permissoesUsuario.includes('PEDIDOS_MANAGE');

    // ==============================================================
    // ESTADOS E VARIÁVEIS
    // ==============================================================
    const [showAgenda, setShowAgenda] = useState(false); 

    const [pedidos, setPedidos] = useState([]);
    const [pedidosML, setPedidosML] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    
    const [activeTab, setActiveTab] = useState('all'); 
    const [isMlConfigured, setIsMlConfigured] = useState(false);

    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);

    const [filters, setFilters] = useState({
        PAGO: true,
        PENDENTE: false,
        'NA ENTREGA': true, 
        REJEITADO: false,
        CANCELADO: false,
        ENTREGUE: false,
        'A ENVIAR': false,
        'RETIRADA': false, 
    });

    const getStoreUrl = () => {
        const slug = localStorage.getItem('tenantSlug');
        const domain = localStorage.getItem('tenantDomain');
        let baseDomain = 'ararinhacloud.shop';
        
        if (process.env.REACT_APP_ECOMMERCE_URL) {
            baseDomain = process.env.REACT_APP_ECOMMERCE_URL.replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/$/, '');
        }

        if (domain && domain !== 'null' && domain !== 'undefined') {
            return `https://${domain}`;
        } else if (slug && slug !== 'null' && slug !== 'undefined') {
            return `https://${slug}.${baseDomain}`;
        }
        return `https://${baseDomain}`;
    };

    const storeUrl = getStoreUrl();

    // ==============================================================
    // BUSCA DE DADOS
    // ==============================================================
    const fetchPedidos = async () => {
        if (!podeVerPedidos) return; 
        setLoading(true);
        setError('');
        
        try {
            const internosRes = await api.get('/pedidos');
            setPedidos(internosRes.data);

            try {
                const mlRes = await api.get('/mercadolivre/orders');
                setPedidosML(mlRes.data.results || []);
                setIsMlConfigured(true); 
            } catch (mlErr) {
                if (mlErr.response?.data?.message?.includes('não configurado') || mlErr.response?.status === 400) {
                    setIsMlConfigured(false);
                    setPedidosML([]);
                } else {
                    console.warn("Erro ao buscar ML:", mlErr);
                    setIsMlConfigured(false);
                }
            }
        } catch (err) {
            setError('Não foi possível carregar os pedidos internos.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPedidos();
        const interval = setInterval(fetchPedidos, 60000);
        return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ==============================================================
    // LÓGICA DE FILTRAGEM E ORDENAÇÃO
    // ==============================================================
    const checkActionable = (p) => {
        if (p.origem === 'ifood') return true; 
        if (p.status_pagamento === 'PAGO') return true;
        if (p.metodo_pagamento && p.metodo_pagamento.toUpperCase().includes('OFFLINE')) return true;
        return false;
    };

    const todosOsPedidos = useMemo(() => {
        const internosFormatados = pedidos.map(p => {
            let origemNormalizada = 'ecommerce';
            let nomeCliente = p.nome_completo || p.usuarios?.nome_completo || 'Cliente Não Informado';
            
            if (p.tipo_pedido === 'IFOOD') {
                origemNormalizada = 'ifood';
                nomeCliente = p.nome_cliente || 'Cliente iFood';
            } 
            else if (['pdv', 'balcao', 'caixa'].includes(p.canal_venda?.toLowerCase())) {
                origemNormalizada = 'pdv';
            }

            return {
                ...p,
                nome_completo: nomeCliente,
                origem: origemNormalizada,
                status_pagamento: p.tipo_pedido === 'IFOOD' ? 'PAGO' : p.status_pagamento,
                status_entrega: p.tipo_pedido === 'IFOOD' && p.status === 'PEN' ? 'A ENVIAR' : p.status_entrega,
                link_detalhe: `/admin/order/${p.id_pedido}`
            };
        });
        
        const traduzirStatusML = (status) => {
            switch (status) {
                case 'paid': return 'PAGO';
                case 'payment_required': case 'payment_in_process': return 'PENDENTE';
                case 'cancelled': return 'CANCELADO';
                default: return 'INDEFINIDO';
            }
        };

        const mlFormatados = pedidosML.map(p => ({
            id_pedido: p.id,
            nome_completo: p.buyer?.nickname || 'Comprador ML',
            data_pedido: p.date_created,
            preco_total: p.total_amount,
            status_pagamento: traduzirStatusML(p.status),
            status_entrega: (p.tags.includes('shipped') || p.tags.includes('delivered')) ? 'Enviado' : 'Não Enviado',
            origem: 'mercadolivre',
            link_externo: p.pack_id ? `https://www.mercadolivre.com.br/vendas/${p.pack_id}/detalhe` : null,
            link_detalhe: `/admin/mercadolivre/order/${p.id}`,
            id_endereco_entrega: 1,
            metodo_envio: 'Mercado Livre'
        }));

        return [...internosFormatados, ...mlFormatados];
    }, [pedidos, pedidosML]);

    const filteredPedidos = useMemo(() => {
        let items = todosOsPedidos;

        if (activeTab !== 'all') {
            items = items.filter(p => p.origem === activeTab);
        }

        const activeFilters = Object.keys(filters).filter(key => filters[key]);

        if (activeFilters.length > 0) {
            const paymentFilters = activeFilters.filter(f => ['PAGO', 'PENDENTE', 'NA ENTREGA', 'REJEITADO', 'CANCELADO'].includes(f));
            const logisticFilters = activeFilters.filter(f => ['ENTREGUE', 'A ENVIAR', 'RETIRADA'].includes(f));

            items = items.filter(pedido => {
                const isRetirada = !pedido.id_endereco_entrega || pedido.metodo_envio === 'Retirada na Loja' || pedido.metodo_envio === 'Consumo no Local';
                const isActionable = checkActionable(pedido);
                const isOfflinePending = pedido.metodo_pagamento?.toUpperCase().includes('OFFLINE') && pedido.status_pagamento === 'PENDENTE';

                let passaPagamento = paymentFilters.length === 0; 
                if (paymentFilters.length > 0) {
                    passaPagamento = paymentFilters.some(filter => {
                        if (filter === 'PAGO') return pedido.status_pagamento === 'PAGO';
                        if (filter === 'PENDENTE') return pedido.status_pagamento === 'PENDENTE' && !isOfflinePending;
                        if (filter === 'NA ENTREGA') return isOfflinePending;
                        if (filter === 'REJEITADO') return pedido.status_pagamento === 'REJEITADO';
                        if (filter === 'CANCELADO') return pedido.status_pagamento === 'CANCELADO';
                        return false;
                    });
                }

                let passaLogistica = logisticFilters.length === 0; 
                if (logisticFilters.length > 0) {
                    passaLogistica = logisticFilters.some(filter => {
                        if (filter === 'ENTREGUE') return pedido.status_entrega === 'Entregue' || pedido.status_entrega === 'Enviado';
                        if (filter === 'A ENVIAR') return isActionable && pedido.status_entrega !== 'Enviado' && pedido.status_entrega !== 'Entregue' && !isRetirada;
                        if (filter === 'RETIRADA') return isRetirada;
                        return false;
                    });
                }

                return passaPagamento && passaLogistica;
            });
        }

        if (searchTerm) {
            items = items.filter(p =>
                p.nome_completo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.id_pedido.toString().includes(searchTerm)
            );
        }

        return items.sort((a, b) => {
            const isActionableA = checkActionable(a);
            const isActionableB = checkActionable(b);
            
            const isPendenteA = isActionableA && a.status_entrega !== 'Entregue' && a.status_entrega !== 'Enviado';
            const isPendenteB = isActionableB && b.status_entrega !== 'Entregue' && b.status_entrega !== 'Enviado';
            
            if (isPendenteA && !isPendenteB) return -1;
            if (!isPendenteA && isPendenteB) return 1;
            return new Date(b.data_pedido) - new Date(a.data_pedido);
        });
    }, [todosOsPedidos, filters, searchTerm, activeTab]);

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredPedidos.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredPedidos.length / itemsPerPage);

    const stats = useMemo(() => {
        return {
            total: filteredPedidos.length,
            valorTotal: filteredPedidos.reduce((acc, curr) => acc + parseFloat(curr.preco_total || curr.valor_total || 0), 0),
            pendentes: filteredPedidos.filter(p => p.status_pagamento === 'PENDENTE').length
        };
    }, [filteredPedidos]);

    const handleAction = async (action, id) => {
        if (!podeGerenciarPedidos) return toast.error('Você não tem permissão para alterar o status dos pedidos.');
        if (!window.confirm('Tem certeza?')) return;
        
        try {
            if (action === 'ready') await api.put(`/pedidos/${id}/status`, { status_entrega: 'Pronto para Retirada' });
            if (action === 'pickedup') await api.put(`/pedidos/${id}/status`, { status_entrega: 'Entregue' });
            
            if (action === 'deliver') {
                const response = await api.put(`/pedidos/${id}/deliver`);
                const driverToken = response.data.driver_token || (response.data.link_motorista ? response.data.link_motorista.split('/').pop() : '');
                
                if (driverToken) {
                    const finalLink = `${storeUrl}/driver/delivery/${driverToken}`;
                    navigator.clipboard.writeText(finalLink).catch(() => {});
                    toast.success(`Pedido despachado! Link copiado.`);
                } else {
                    toast.info('Pedido despachado via Correios/Transportadora.');
                }
            }
            
            if (action === 'delete') await api.delete(`/pedidos/${id}`);
            
            fetchPedidos(); 
        } catch (err) { alert('Erro na operação.'); }
    };

    const copyDriverLink = (driverToken) => {
        if (!driverToken) return;
        const link = `${storeUrl}/driver/delivery/${driverToken}`;
        navigator.clipboard.writeText(link)
            .then(() => toast.info('Link do Motoboy copiado!'))
            .catch(() => toast.error('Erro ao copiar link.'));
    };

    const handleFilterChange = (filterName) => {
        setFilters(prev => ({ ...prev, [filterName]: !prev[filterName] }));
        setCurrentPage(1);
    };

    const formatCurrency = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

    const renderOrigemBadge = (p) => {
        if (p.origem === 'ifood') return <Badge bg="danger" className="fw-medium px-2 py-1 bg-opacity-10 text-danger border border-danger border-opacity-25" style={{ fontSize: '10px' }}><i className="bi bi-bicycle me-1"></i> iFood</Badge>;
        if (p.origem === 'mercadolivre') return <Badge bg="warning" className="fw-medium px-2 py-1 bg-opacity-25 border border-warning" style={{ fontSize: '10px', color: '#b45309' }}>Mercado Livre</Badge>;
        if (p.origem === 'pdv') return <Badge bg="primary" className="fw-medium px-2 py-1 bg-opacity-10 text-primary border border-primary border-opacity-25" style={{ fontSize: '10px' }}><i className="bi bi-shop-window me-1"></i> PDV</Badge>;
        return <Badge bg="info" className="fw-medium px-2 py-1 bg-opacity-10 text-info border border-info border-opacity-25" style={{ fontSize: '10px' }}><i className="bi bi-globe me-1"></i> Online</Badge>;
    };

    const renderBadgeLogistica = (p) => {
        if (p.origem === 'ifood') {
            return (
                <Badge bg="danger" className="fw-normal bg-danger text-white px-2 py-1">
                    <i className="bi bi-phone me-1"></i> App iFood
                </Badge>
            );
        }

        const metodoEnvio = p.metodo_envio || '';
        const complemento = p.entrega_complemento || '';

        if (metodoEnvio === 'Consumo no Local' || complemento.toLowerCase().includes('mesa')) {
            return (
                <div className="d-flex flex-column align-items-center justify-content-center">
                    <Badge bg="danger" className="fw-normal bg-opacity-10 text-danger border border-danger border-opacity-25 px-2 py-1 mb-1">
                        <i className="bi bi-cup-hot me-1"></i> Local
                    </Badge>
                    {complemento && (
                        <span className="text-danger fw-bold text-truncate" style={{ fontSize: '10px', maxWidth: '100px' }}>
                            {complemento.replace('Mesa/Nome:', '').trim()}
                        </span>
                    )}
                </div>
            );
        }
        
        if (metodoEnvio === 'Retirada na Loja' || !p.id_endereco_entrega) {
            return (
                <Badge bg="secondary" className="fw-normal bg-opacity-10 text-secondary border border-secondary border-opacity-25 px-2 py-1">
                    <i className="bi bi-shop me-1"></i> Retirada
                </Badge>
            );
        }
        
        return (
            <Badge bg="secondary" className="fw-normal bg-opacity-10 text-secondary border border-secondary border-opacity-25 px-2 py-1">
                <i className="bi bi-truck me-1"></i> Envio
            </Badge>
        );
    };

    // 🛑 BLOQUEIO PARA QUEM NÃO PODE VER A TELA
    if (!podeVerPedidos) {
        return (
            <Container className="pt-5 mt-5 text-center">
                <Alert variant="danger" className="d-inline-block p-4 rounded-4 shadow-sm border-0">
                    <i className="bi bi-shield-lock-fill display-4 text-danger mb-3 d-block"></i>
                    <h4 className="fw-bold">Acesso Negado</h4>
                    <p className="text-muted mb-0">Você não tem permissão ('PEDIDOS_VIEW') para visualizar este setor.</p>
                </Alert>
            </Container>
        );
    }

    if (showAgenda) {
        return <AdminAgendaSemanal onBack={() => setShowAgenda(false)} />;
    }

    return (
        <div className="mobile-page-wrapper">
            <Container fluid="lg" className="px-lg-3 px-0 pt-lg-4 pt-3">
                
                {/* ========================================================= */}
                {/* CABEÇALHO DESKTOP (Invisível no Mobile) */}
                {/* ========================================================= */}
                <div className="d-none d-lg-flex justify-content-between align-items-center mb-4 gap-3">
                    <div>
                        <h4 className="fw-bold m-0 d-flex align-items-center" style={{ fontSize: '1.25rem', color: 'var(--text-primary)' }}>
                            <i className="bi bi-cart-check me-3 opacity-75"></i>
                            Gerenciamento de Pedidos
                        </h4>
                        <small className="mt-1 d-block" style={{ color: 'var(--text-secondary)' }}>Acompanhe todos os seus canais de venda.</small>
                    </div>
                    
                    <div className="d-flex flex-wrap align-items-center gap-3">
                        <div className="text-end me-2">
                            <small className="d-block fw-bold" style={{fontSize: '10px', letterSpacing: '0.5px', color: 'var(--text-secondary)'}}>FATURAMENTO (ABA)</small>
                            <span className="text-success fw-bold fs-5">{formatCurrency(stats.valorTotal)}</span>
                        </div>

                        <CtaButton
                            onClick={() => setShowAgenda(true)}
                        >
                            <Calendar size={18} className="me-2" /> Ver Agenda
                        </CtaButton>

                        <CtaButton onClick={fetchPedidos}>
                            {loading ? <Spinner size="sm" className="me-2"/> : <i className="bi bi-arrow-clockwise me-2"></i>} Atualizar
                        </CtaButton>
                    </div>
                </div>

                {/* ========================================================= */}
                {/* CABEÇALHO MOBILE (Invisível no Desktop) */}
                {/* ========================================================= */}
                <div className="d-block d-lg-none px-3 mb-3">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <h4 className="fw-bold m-0" style={{ fontSize: '1.3rem', color: 'var(--text-primary)' }}>
                            <i className="bi bi-cart-check me-2 opacity-75"></i> Pedidos
                        </h4>
                        <div className="text-end">
                            <span className="text-success fw-bold fs-5">{formatCurrency(stats.valorTotal)}</span>
                        </div>
                    </div>
                    
                    <div className="d-flex gap-2 mb-3">
                        <SquareButton
                            onClick={() => setShowAgenda(true)}
                        >
                            <Calendar size={18}/></SquareButton>
                        <SquareButton onClick={fetchPedidos}>
                            {loading ? <Spinner size="sm" /> : <i className="bi bi-arrow-clockwise fs-5"></i>}
                        </SquareButton>
                    </div>
                </div>

                {/* ========================================================= */}
                {/* BARRA DE BUSCA E FILTROS (Responsivo e Scrollável no Mobile) */}
                {/* ========================================================= */}
                <div className="border-bottom pb-3 mb-0 px-3 px-lg-0" style={{ borderColor: 'var(--border-color)' }}>
                    <Row className="g-3 align-items-center">
                        <Col xs={12} lg={4}>
                            <InputGroup className="rounded-4 overflow-hidden border bg-white shadow-sm" style={{ borderColor: 'var(--border-color)' }}>
                                <InputGroup.Text className="border-0 ps-3 bg-transparent text-secondary"><i className="bi bi-search"></i></InputGroup.Text>
                                <Form.Control 
                                    placeholder="Buscar Pedido ou Cliente..." 
                                    className="border-0 shadow-none bg-transparent" 
                                    style={{ color: 'var(--text-primary)', fontSize: '14px', padding: '12px 10px' }}
                                    value={searchTerm} 
                                    onChange={e => setSearchTerm(e.target.value)} 
                                />
                            </InputGroup>
                        </Col>
                        
                        <Col xs={12} lg={8}>
                            {/* O container de filtros desliza horizontalmente no mobile */}
                            <div className="filters-wrapper d-flex gap-2 justify-content-lg-end">
                                {Object.keys(filters).map((filter) => {
                                    const active = filters[filter];
                                    return (
                                        <button 
                                            key={filter} 
                                            className={`filter-btn ${active ? 'active' : ''}`}
                                            onClick={() => handleFilterChange(filter)}
                                        >
                                            {filter}
                                        </button>
                                    )
                                })}
                            </div>
                        </Col>
                    </Row>
                </div>

                {/* ========================================================= */}
                {/* ABAS (TABS) - SCROLLÁVEIS NO MOBILE */}
                {/* ========================================================= */}
                <div className="p-0 border-bottom" style={{ backgroundColor: 'var(--bg-hover)', borderColor: 'var(--border-color)' }}>
                    <Nav variant="tabs" className="custom-tabs nav-justified border-0 flex-nowrap" activeKey={activeTab} onSelect={(k) => { setActiveTab(k); setCurrentPage(1); }}>
                        <Nav.Item>
                            <Nav.Link eventKey="all" className="fw-semibold"><i className="bi bi-layers me-2"></i>Todos</Nav.Link>
                        </Nav.Item>
                        <Nav.Item>
                            <Nav.Link eventKey="ecommerce" className="fw-semibold"><i className="bi bi-globe me-2"></i>Online</Nav.Link>
                        </Nav.Item>
                        
                        <Nav.Item>
                            <Nav.Link eventKey="ifood" className="fw-semibold text-danger">
                                <i className="bi bi-scooter me-2"></i>iFood
                            </Nav.Link>
                        </Nav.Item>

                        <Nav.Item>
                            <Nav.Link eventKey="pdv" className="fw-semibold"><i className="bi bi-shop-window me-2"></i>PDV</Nav.Link>
                        </Nav.Item>
                        {isMlConfigured && (
                            <Nav.Item>
                                <Nav.Link eventKey="mercadolivre" className="fw-semibold"><i className="bi bi-box-seam me-2"></i>Mercado Livre</Nav.Link>
                            </Nav.Item>
                        )}
                    </Nav>
                </div>

                {/* ========================================================= */}
                {/* CONTEÚDO E PAGINAÇÃO */}
                {/* ========================================================= */}
                <div className="p-0">
                    <AnimatePresence mode='wait'>
                        {loading && filteredPedidos.length === 0 ? (
                            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="text-center py-5">
                                <Spinner animation="border" variant="secondary" />
                                <p className="mt-3" style={{ color: 'var(--text-secondary)' }}>Buscando pedidos...</p>
                            </motion.div>
                        ) : error ? (
                            <Alert variant="danger" className="m-4 text-center border-0 rounded-4 shadow-sm">{error}</Alert>
                        ) : filteredPedidos.length === 0 ? (
                            <div className="text-center py-5" style={{ color: 'var(--text-secondary)' }}>
                                <i className="bi bi-inbox display-4 mb-3 opacity-25"></i>
                                <p>Nenhum pedido encontrado com estes filtros.</p>
                            </div>
                        ) : (
                            <OrderListContent 
                                items={currentItems} 
                                podeGerenciarPedidos={podeGerenciarPedidos}
                                formatCurrency={formatCurrency}
                                renderOrigemBadge={renderOrigemBadge}
                                renderBadgeLogistica={renderBadgeLogistica}
                                checkActionable={checkActionable}
                                handleAction={handleAction}
                                copyDriverLink={copyDriverLink}
                            />
                        )}
                    </AnimatePresence>
                </div>

                {totalPages > 1 && (
                    <div className="d-flex justify-content-center p-3 border-top pb-5 pb-lg-3" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-sidebar)' }}>
                        <Pagination className="mb-0 custom-pagination shadow-sm">
                            <Pagination.Prev onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} />
                            {[...Array(totalPages)].map((_, i) => (
                                <Pagination.Item key={i + 1} active={i + 1 === currentPage} onClick={() => setCurrentPage(i + 1)}>
                                    {i + 1}
                                </Pagination.Item>
                            ))}
                            <Pagination.Next onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} />
                        </Pagination>
                    </div>
                )}
            </Container>

            <style>{`
                /* ====== ESTILOS GERAIS ====== */
                .clean-card {
                    background: var(--bg-sidebar, #ffffff);
                    border: 1px solid var(--border-color, #e2e8f0);
                    border-radius: 12px;
                    box-shadow: none;
                    overflow: hidden;
                }
                
                .filter-btn {
                    background: var(--bg-sidebar, #ffffff);
                    border: 1px solid var(--border-color, #e2e8f0);
                    color: var(--text-secondary, #475569);
                    font-size: 13px;
                    font-weight: 500;
                    border-radius: 8px;
                    padding: 8px 14px;
                    transition: all 0.2s;
                }
                .filter-btn:hover { background: var(--bg-hover, #f1f5f9); }
                .filter-btn.active {
                    background: var(--bg-active, #eff6ff);
                    border-color: var(--bg-active, #eff6ff);
                    color: var(--text-active, #2563eb);
                    font-weight: 600;
                }
                
                .hover-effect:hover td { background-color: var(--bg-hover, #f8fafc) !important; }

                body.dark-mode table { color: var(--text-primary) !important; border-color: var(--border-color) !important; }
                body.dark-mode thead th { background-color: var(--bg-sidebar) !important; color: var(--text-secondary) !important; border-bottom: 1px solid var(--border-color) !important; }
                body.dark-mode tbody td { background-color: var(--bg-sidebar) !important; color: var(--text-primary) !important; border-bottom: 1px solid var(--border-color) !important; }
                body.dark-mode tbody tr:hover td { background-color: var(--bg-hover) !important; }

                .custom-pagination .page-link { color: var(--text-secondary); background-color: var(--bg-sidebar); border-color: var(--border-color); }
                .custom-pagination .page-item.active .page-link { background-color: var(--text-primary); border-color: var(--text-primary); color: var(--bg-sidebar); }
                
                /* TABS NO DESKTOP */
                .custom-tabs .nav-link { border: none; color: var(--text-secondary, #64748b); padding: 1rem 1.5rem; border-bottom: 2px solid transparent; transition: all 0.2s; }
                .custom-tabs .nav-link:hover { color: var(--text-primary, #0f172a); }
                .custom-tabs .nav-link.active { color: var(--text-primary, #0f172a); border-bottom-color: var(--text-primary, #0f172a); background: transparent; }
                .custom-tabs .nav-link.text-danger.active { border-bottom-color: #dc3545 !important; color: #dc3545 !important; }

                /* ====== ESTILOS MOBILE EXCLUSIVOS ====== */
                @media (max-width: 991px) {
                    .mobile-page-wrapper {
                        background-color: var(--bg-main, #f8fafc);
                        min-height: 100vh;
                    }
                    
                    /* Scroll Horizontal nos Filtros */
                    .filters-wrapper {
                        overflow-x: auto;
                        flex-wrap: nowrap !important;
                        -ms-overflow-style: none; /* IE and Edge */
                        scrollbar-width: none; /* Firefox */
                        padding-bottom: 5px;
                        padding-left: 2px;
                        padding-right: 15px; /* espaço extra no fim do scroll */
                    }
                    .filters-wrapper::-webkit-scrollbar { display: none; }
                    .filter-btn {
                        white-space: nowrap;
                        flex-shrink: 0;
                        border-radius: 20px !important;
                    }

                    /* Scroll Horizontal nas Abas (Tabs) */
                    .custom-tabs {
                        overflow-x: auto;
                        overflow-y: hidden;
                        -ms-overflow-style: none;
                        scrollbar-width: none;
                        border-bottom: none !important;
                        justify-content: flex-start !important;
                    }
                    .custom-tabs::-webkit-scrollbar { display: none; }
                    .custom-tabs .nav-link {
                        white-space: nowrap;
                        padding: 14px 18px !important;
                    }
                    .custom-tabs .nav-item {
                        flex: 0 0 auto; /* Impede a nav-justified de forçar a largura em telas pequenas */
                    }
                }
            `}</style>
        </div>
    );
};

export default OrderListPage;