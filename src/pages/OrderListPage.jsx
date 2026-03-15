import React, { useState, useEffect, useMemo } from 'react';
import { Table, Button, Spinner, Alert, Badge, Row, Col, Card, Image, InputGroup, Form, Container, Pagination, Tooltip, OverlayTrigger, Nav } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';

const MERCADO_LIVRE_ICON_URL = 'https://logospng.org/download/mercado-livre/logo-mercado-livre-256.png';

// --- COMPONENTE DE CRONÔMETRO ---
const PreparationTimer = ({ orderDate }) => {
    const [timeLeft, setTimeLeft] = useState(null);
    const [isLate, setIsLate] = useState(false);

    useEffect(() => {
        const calculateTimeLeft = () => {
            if (!orderDate) return;
            const orderTime = new Date(orderDate).getTime();
            const deadline = orderTime + (2 * 60 * 60 * 1000); 
            const now = new Date().getTime();
            const difference = deadline - now;

            if (difference < 0) {
                setIsLate(true);
                const lateDiff = Math.abs(difference);
                const hours = Math.floor(lateDiff / (1000 * 60 * 60));
                const minutes = Math.floor((lateDiff % (1000 * 60 * 60)) / (1000 * 60));
                setTimeLeft(`-${hours}h ${minutes}m`);
            } else {
                setIsLate(false);
                const hours = Math.floor(difference / (1000 * 60 * 60));
                const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
                setTimeLeft(`${hours}h ${minutes}m`);
            }
        };
        calculateTimeLeft();
        const timer = setInterval(calculateTimeLeft, 60000);
        return () => clearInterval(timer);
    }, [orderDate]);

    if (!timeLeft) return null;

    return (
        <motion.div 
            animate={isLate ? { opacity: [1, 0.5, 1] } : {}}
            transition={isLate ? { duration: 1, repeat: Infinity } : {}}
            className={`d-inline-flex align-items-center fw-bold px-2 py-1 rounded-pill small border ${isLate ? 'bg-danger bg-opacity-10 text-danger border-danger' : 'bg-warning bg-opacity-10 text-dark border-warning'}`}
        >
            <i className={`bi ${isLate ? 'bi-exclamation-circle-fill' : 'bi-hourglass-split'} me-1`}></i>
            {isLate ? 'Atrasado: ' : 'Expira: '} {timeLeft}
        </motion.div>
    );
};

// --- COMPONENTE PRINCIPAL ---
const OrderListPage = () => {
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
        'NA ENTREGA': false, 
        REJEITADO: false,
        CANCELADO: false,
        ENTREGUE: false,
        'A ENVIAR': false,
        'RETIRADA': false, 
    });

    const ecommerceUrl = process.env.REACT_APP_ECOMMERCE_URL || 'http://localhost:3000';

    const fetchPedidos = async () => {
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
    }, []);

    const checkActionable = (p) => {
        if (p.status_pagamento === 'PAGO') return true;
        if (p.metodo_pagamento && p.metodo_pagamento.toUpperCase().includes('OFFLINE')) return true;
        return false;
    };

    const todosOsPedidos = useMemo(() => {
        const internosFormatados = pedidos.map(p => {
            let origemNormalizada = 'ecommerce';
            
            if (['pdv', 'balcao', 'caixa'].includes(p.canal_venda?.toLowerCase())) origemNormalizada = 'pdv';
            else origemNormalizada = 'ecommerce';

            return {
                ...p,
                nome_completo: p.nome_completo || p.usuarios?.nome_completo || 'Cliente Não Informado',
                origem: origemNormalizada,
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
            id_endereco_entrega: 1 
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
            items = items.filter(pedido => activeFilters.some(filter => {
                const isRetirada = !pedido.id_endereco_entrega;
                const isActionable = checkActionable(pedido);
                
                // ✅ IMPORTANTE: Só considera "Na Entrega" se o status de pagamento AINDA for PENDENTE.
                // Se o motoboy já finalizou e o back mudou pra PAGO, ele passa a ser um pedido "PAGO" normal!
                const isOfflinePending = pedido.metodo_pagamento?.toUpperCase().includes('OFFLINE') && pedido.status_pagamento === 'PENDENTE';

                switch (filter) {
                    case 'PAGO': return pedido.status_pagamento === 'PAGO';
                    case 'PENDENTE': return pedido.status_pagamento === 'PENDENTE' && !isOfflinePending;
                    case 'NA ENTREGA': return isOfflinePending; 
                    case 'REJEITADO': return pedido.status_pagamento === 'REJEITADO';
                    case 'CANCELADO': return pedido.status_pagamento === 'CANCELADO';
                    case 'ENTREGUE': return pedido.status_entrega === 'Entregue' || pedido.status_entrega === 'Enviado';
                    case 'A ENVIAR': return isActionable && pedido.status_entrega !== 'Enviado' && pedido.status_entrega !== 'Entregue' && !isRetirada;
                    case 'RETIRADA': return isRetirada;
                    default: return false;
                }
            }));
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
            valorTotal: filteredPedidos.reduce((acc, curr) => acc + parseFloat(curr.preco_total), 0),
            pendentes: filteredPedidos.filter(p => p.status_pagamento === 'PENDENTE').length
        };
    }, [filteredPedidos]);

    const handleAction = async (action, id) => {
        if (!window.confirm('Tem certeza?')) return;
        try {
            if (action === 'ready') await api.put(`/pedidos/${id}/status`, { status_entrega: 'Pronto para Retirada' });
            if (action === 'pickedup') await api.put(`/pedidos/${id}/status`, { status_entrega: 'Entregue' });
            
            if (action === 'deliver') {
                const response = await api.put(`/pedidos/${id}/deliver`);
                const driverToken = response.data.driver_token || (response.data.link_motorista ? response.data.link_motorista.split('/').pop() : '');
                
                if (driverToken) {
                    const finalLink = `${ecommerceUrl}/driver/delivery/${driverToken}`;
                    navigator.clipboard.writeText(finalLink).catch(() => {});
                    alert(`O pedido foi despachado! \n\nPIN do Cliente: ${response.data.pin_cliente || '0000'} \n\nLink do Motorista copiado para área de transferência.`);
                } else {
                    alert('Pedido despachado via Correios/Transportadora.');
                }
            }
            
            if (action === 'delete') await api.delete(`/pedidos/${id}`);
            fetchPedidos(); 
        } catch (err) { alert('Erro na operação.'); }
    };

    const handleFilterChange = (filterName) => {
        setFilters(prev => ({ ...prev, [filterName]: !prev[filterName] }));
        setCurrentPage(1);
    };

    const getRowColor = (p) => {
        if (p.origem === 'pdv') return 'border-start border-4 border-primary bg-primary bg-opacity-10';
        if (p.status_entrega === 'Pronto para Retirada') return 'border-start border-4 border-info bg-info bg-opacity-10';
        // ✅ Se estiver PAGO, ele sempre vai ficar verde, ignorando se foi Offline ou não.
        if (p.status_pagamento === 'PAGO') return 'border-start border-4 border-success bg-success bg-opacity-10';
        if (p.metodo_pagamento?.toUpperCase().includes('OFFLINE') && p.status_pagamento === 'PENDENTE') return 'border-start border-4 border-info bg-info bg-opacity-10';
        if (p.status_pagamento === 'PENDENTE') return 'border-start border-4 border-warning bg-warning bg-opacity-10';
        return '';
    };

    const renderOrigemBadge = (p) => {
        if (p.origem === 'mercadolivre') return <Badge bg="warning" text="dark">ML</Badge>;
        if (p.origem === 'pdv') return <Badge bg="primary"><i className="bi bi-shop-window me-1"></i> PDV</Badge>;
        return <Badge bg="info" text="dark"><i className="bi bi-globe me-1"></i> Site</Badge>;
    };

    return (
        <Container fluid className="px-md-4 py-4">
            
            <Row className="mb-4 align-items-center g-3">
                <Col md={6}>
                    <h2 className="fw-bold mb-0 text-dark">Gerenciamento de Pedidos</h2>
                    <p className="text-muted mb-0 small">Acompanhe todos os seus canais de venda.</p>
                </Col>
                <Col md={6}>
                    <div className="d-flex gap-3 justify-content-md-end">
                        <Card className="border-0 shadow-sm flex-grow-1 flex-md-grow-0" style={{minWidth: '160px'}}>
                            <Card.Body className="p-2 text-center">
                                <small className="text-muted d-block fw-bold" style={{fontSize: '0.7rem'}}>FATURAMENTO (ABA)</small>
                                <span className="text-success fw-bold">R$ {stats.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                            </Card.Body>
                        </Card>
                        <Button variant="dark" onClick={fetchPedidos} disabled={loading} className="rounded-3 shadow-sm d-flex align-items-center px-4">
                            {loading ? <Spinner size="sm" /> : <i className="bi bi-arrow-clockwise me-2"></i>} Atualizar
                        </Button>
                    </div>
                </Col>
            </Row>

            <Card className="shadow-sm border-0 mb-4 rounded-4 overflow-hidden">
                <Card.Header className="bg-white border-bottom-0 p-0">
                    <Nav variant="tabs" className="nav-justified custom-tabs" activeKey={activeTab} onSelect={(k) => { setActiveTab(k); setCurrentPage(1); }}>
                        <Nav.Item>
                            <Nav.Link eventKey="all" className="py-3 border-0 rounded-0 text-dark fw-bold">
                                <i className="bi bi-layers me-2"></i>Todos
                            </Nav.Link>
                        </Nav.Item>
                        <Nav.Item>
                            <Nav.Link eventKey="ecommerce" className="py-3 border-0 rounded-0 text-info fw-bold">
                                <i className="bi bi-globe me-2"></i>E-commerce
                            </Nav.Link>
                        </Nav.Item>
                        <Nav.Item>
                            <Nav.Link eventKey="pdv" className="py-3 border-0 rounded-0 text-primary fw-bold">
                                <i className="bi bi-shop-window me-2"></i>PDV / Balcão
                            </Nav.Link>
                        </Nav.Item>
                        
                        {isMlConfigured && (
                            <Nav.Item>
                                <Nav.Link eventKey="mercadolivre" className="py-3 border-0 rounded-0 text-warning fw-bold text-dark">
                                    <span className="me-2">🤝</span>ML
                                </Nav.Link>
                            </Nav.Item>
                        )}
                    </Nav>
                </Card.Header>

                <Card.Body className="p-4 bg-light bg-opacity-25">
                    <Row className="g-3">
                        <Col lg={4}>
                            <InputGroup className="shadow-sm rounded-pill overflow-hidden border">
                                <InputGroup.Text className="bg-white border-0 ps-3"><i className="bi bi-search text-muted"></i></InputGroup.Text>
                                <Form.Control 
                                    placeholder="Buscar ID, Cliente..." 
                                    className="border-0 shadow-none" 
                                    value={searchTerm} 
                                    onChange={e => setSearchTerm(e.target.value)} 
                                />
                            </InputGroup>
                        </Col>
                        <Col lg={8}>
                            <div className="d-flex flex-wrap gap-2 justify-content-lg-end">
                                {Object.keys(filters).map((filter) => {
                                    const active = filters[filter];
                                    let variant = active ? 'dark' : 'light';
                                    
                                    if(active) {
                                        if(filter === 'PAGO') variant = 'success';
                                        if(filter === 'PENDENTE') variant = 'warning';
                                        if(filter === 'CANCELADO' || filter === 'REJEITADO') variant = 'danger';
                                        if(filter === 'NA ENTREGA') variant = 'info text-dark';
                                    }

                                    return (
                                        <Button 
                                            key={filter} 
                                            variant={variant} 
                                            size="sm" 
                                            onClick={() => handleFilterChange(filter)}
                                            className={`rounded-pill px-3 fw-bold border transition-all ${!active ? 'text-muted border-light' : 'shadow-sm text-white'}`}
                                        >
                                            {filter}
                                        </Button>
                                    )
                                })}
                            </div>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

            <AnimatePresence mode='wait'>
                {loading && filteredPedidos.length === 0 ? (
                    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="text-center py-5">
                        <Spinner animation="border" variant="primary" />
                        <p className="mt-2 text-muted">Sincronizando dados...</p>
                    </motion.div>
                ) : error ? (
                    <Alert variant="danger" className="rounded-3 shadow-sm text-center">{error}</Alert>
                ) : filteredPedidos.length === 0 ? (
                    <div className="text-center py-5 text-muted border rounded-4 bg-light">
                        <i className="bi bi-inbox fs-1 d-block mb-3 opacity-25"></i>
                        <h4>Nenhum pedido encontrado.</h4>
                        <p>Tente mudar os filtros ou a aba selecionada.</p>
                    </div>
                ) : (
                    <>
                        <div className="d-none d-lg-block bg-white rounded-4 shadow-sm overflow-hidden mb-3">
                            <Table hover responsive className="mb-0 align-middle">
                                <thead className="bg-light text-secondary small text-uppercase">
                                    <tr>
                                        <th className="py-3 ps-4 border-0">Pedido</th>
                                        <th className="py-3 border-0 text-center">Origem</th>
                                        <th className="py-3 border-0">Cliente</th>
                                        <th className="py-3 border-0 text-center">Tipo</th>
                                        <th className="py-3 border-0">Total</th>
                                        <th className="py-3 border-0 text-center">Pagamento</th>
                                        <th className="py-3 border-0 text-center">Logística (Entrega)</th>
                                        <th className="py-3 pe-4 border-0 text-end">Ações</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {currentItems.map((p) => {
                                        const isRetirada = !p.id_endereco_entrega;
                                        const isReady = p.status_entrega === 'Pronto para Retirada';
                                        const isOutForDelivery = String(p.status_entrega || '').toLowerCase().includes('rota') || Boolean(p.delivery_pin);
                                        const isDelivered = String(p.status_entrega || '').toLowerCase() === 'entregue';
                                        const isActionable = checkActionable(p);

                                        return (
                                            <motion.tr 
                                                key={`${p.origem}-${p.id_pedido}`}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className={getRowColor(p)}
                                            >
                                                <td className="ps-4 fw-bold text-dark">
                                                    #{p.id_pedido}
                                                </td>
                                                <td className="text-center">
                                                    {p.origem === 'mercadolivre' ? <Image src={MERCADO_LIVRE_ICON_URL} width={24} /> : 
                                                     p.origem === 'pdv' ? <i className="bi bi-shop-window text-primary fs-5"></i> :
                                                     <i className="bi bi-globe text-info fs-5"></i>
                                                    }
                                                </td>
                                                <td>
                                                    <span className="d-block fw-bold text-truncate" style={{maxWidth: '180px'}}>{p.nome_completo}</span>
                                                    <small className="text-muted">{new Date(p.data_pedido).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</small>
                                                </td>
                                                <td className="text-center">
                                                    {isRetirada ? 
                                                        <Badge bg="warning" text="dark" className="fw-normal"><i className="bi bi-shop me-1"></i> Retirada</Badge> : 
                                                        <Badge bg="light" text="secondary" className="fw-normal border"><i className="bi bi-truck me-1"></i> Envio</Badge>
                                                    }
                                                </td>
                                                <td className="fw-bold text-success">R$ {parseFloat(p.preco_total).toFixed(2)}</td>
                                                
                                                <td className="text-center">
                                                    {/* ✅ STATUS DE PAGAMENTO (Se já estiver PAGO, mostra PAGO verde, independente de ser Offline ou não) */}
                                                    {p.status_pagamento === 'PAGO' ? (
                                                        <Badge bg="success" className="px-3 py-2 fw-normal">PAGO</Badge>
                                                    ) : p.metodo_pagamento?.toUpperCase().includes('OFFLINE') ? (
                                                        <Badge bg="info" className="px-3 py-2 fw-bold text-dark">Na Entrega</Badge>
                                                    ) : (
                                                        <Badge bg={p.status_pagamento === 'PENDENTE' ? 'warning' : 'secondary'} className="px-3 py-2 fw-normal">
                                                            {p.status_pagamento}
                                                        </Badge>
                                                    )}
                                                </td>
                                                
                                                <td className="text-center">
                                                    <div className="d-flex flex-column align-items-center gap-1">
                                                        
                                                        {isOutForDelivery && !isDelivered ? (
                                                            <div className="d-flex flex-column align-items-center">
                                                                <Badge bg="primary" className="fw-normal py-1 mb-1"><i className="fas fa-motorcycle me-1"></i> Em Rota</Badge>
                                                                {p.delivery_pin && (
                                                                    <Badge bg="dark" className="px-2 py-1 mb-1" style={{fontSize: '0.8rem'}}>
                                                                        PIN: <span className="text-warning">{p.delivery_pin}</span>
                                                                    </Badge>
                                                                )}
                                                                {p.driver_token && (
                                                                    <OverlayTrigger placement="top" overlay={<Tooltip>Acompanhar a Entrega</Tooltip>}>
                                                                        <Button 
                                                                            variant="link" 
                                                                            size="sm" 
                                                                            className="p-0 text-decoration-none text-info fw-bold"
                                                                            style={{fontSize: '0.75rem'}}
                                                                            onClick={() => window.open(`${ecommerceUrl}/driver/delivery/${p.driver_token}`, '_blank')}
                                                                        >
                                                                            <i className="fas fa-map-marker-alt me-1"></i>Acompanhar
                                                                        </Button>
                                                                    </OverlayTrigger>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <span className={`badge ${isReady ? 'bg-info text-dark' : isDelivered ? 'bg-success' : 'bg-light text-muted border'}`}>
                                                                {p.status_entrega || 'Pendente'}
                                                            </span>
                                                        )}
                                                        
                                                        {(p.origem === 'ecommerce' || p.origem === 'pdv') && isActionable && !isReady && !isDelivered && !isOutForDelivery && (
                                                            <PreparationTimer orderDate={p.data_pedido} />
                                                        )}
                                                    </div>
                                                </td>
                                                
                                                <td className="pe-4 text-end">
                                                    <div className="d-flex justify-content-end gap-1">
                                                        <OverlayTrigger overlay={<Tooltip>Ver Detalhes</Tooltip>}>
                                                            <LinkContainer to={p.link_detalhe || `/admin/order/${p.id_pedido}`}>
                                                                <Button variant="light" size="sm" className="border shadow-sm"><i className="bi bi-eye-fill"></i></Button>
                                                            </LinkContainer>
                                                        </OverlayTrigger>

                                                        {p.origem !== 'mercadolivre' && isActionable && !isDelivered && !isOutForDelivery && (
                                                            isRetirada ? (
                                                                isReady ? 
                                                                    <OverlayTrigger overlay={<Tooltip>Confirmar Retirada</Tooltip>}>
                                                                        <Button variant="success" size="sm" onClick={() => handleAction('pickedup', p.id_pedido)}><i className="bi bi-check-lg"></i></Button>
                                                                    </OverlayTrigger> : 
                                                                    <OverlayTrigger overlay={<Tooltip>Separar Pedido</Tooltip>}>
                                                                        <Button variant="primary" size="sm" onClick={() => handleAction('ready', p.id_pedido)}><i className="bi bi-box-seam"></i></Button>
                                                                    </OverlayTrigger>
                                                            ) : (
                                                                <OverlayTrigger overlay={<Tooltip>Despachar com Motoboy</Tooltip>}>
                                                                    <Button variant="info" size="sm" onClick={() => handleAction('deliver', p.id_pedido)}>
                                                                        <i className="fas fa-motorcycle text-white"></i> 
                                                                    </Button>
                                                                </OverlayTrigger>
                                                            )
                                                        )}
                                                        
                                                        {p.origem === 'mercadolivre' && (
                                                            <OverlayTrigger overlay={<Tooltip>Ver no Mercado Livre</Tooltip>}>
                                                                <Button variant="warning" size="sm" href={p.link_externo} target="_blank"><i className="bi bi-box-arrow-up-right"></i></Button>
                                                            </OverlayTrigger>
                                                        )}
                                                        
                                                        {p.origem !== 'mercadolivre' && (
                                                            <OverlayTrigger overlay={<Tooltip>Excluir Pedido</Tooltip>}>
                                                                <Button variant="outline-danger" size="sm" onClick={() => handleAction('delete', p.id_pedido)}><i className="bi bi-trash"></i></Button>
                                                            </OverlayTrigger>
                                                        )}
                                                    </div>
                                                </td>
                                            </motion.tr>
                                        );
                                    })}
                                </tbody>
                            </Table>
                        </div>

                        {/* ============================== */}
                        {/* LISTA MOBILE                   */}
                        {/* ============================== */}
                        <div className="d-lg-none">
                            {currentItems.map((p) => {
                                const isRetirada = !p.id_endereco_entrega;
                                const isReady = p.status_entrega === 'Pronto para Retirada';
                                const isOutForDelivery = String(p.status_entrega || '').toLowerCase().includes('rota') || Boolean(p.delivery_pin);
                                const isDelivered = String(p.status_entrega || '').toLowerCase() === 'entregue';
                                const isActionable = checkActionable(p);
                                
                                return (
                                    <motion.div 
                                        key={`${p.origem}-${p.id_pedido}`}
                                        initial={{ opacity: 0, y: 20 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true }}
                                    >
                                        <Card className={`mb-3 shadow-sm border-0 rounded-4 overflow-hidden ${getRowColor(p)}`}>
                                            <Card.Body className="p-3">
                                                <div className="d-flex justify-content-between align-items-start mb-2">
                                                    <div>
                                                        <h6 className="fw-bold text-dark mb-0">{p.nome_completo}</h6>
                                                        <small className="text-muted">#{p.id_pedido} • {new Date(p.data_pedido).toLocaleDateString('pt-BR')}</small>
                                                    </div>
                                                    {renderOrigemBadge(p)}
                                                </div>

                                                <div className="d-flex gap-2 mb-3">
                                                    {isRetirada ? 
                                                        <Badge bg="warning" text="dark" className="fw-normal"><i className="bi bi-shop me-1"></i> Retirada</Badge> : 
                                                        <Badge bg="light" text="secondary" className="fw-normal border"><i className="bi bi-truck me-1"></i> Envio</Badge>
                                                    }
                                                    {(p.origem === 'ecommerce' || p.origem === 'pdv') && isActionable && !isReady && !isDelivered && !isOutForDelivery && <PreparationTimer orderDate={p.data_pedido} />}
                                                </div>

                                                <div className="bg-light p-3 rounded-3 mb-3 d-flex justify-content-between align-items-center">
                                                    <div>
                                                        <small className="d-block text-muted" style={{fontSize:'0.7rem'}}>STATUS / LOGÍSTICA</small>
                                                        
                                                        {/* ✅ STATUS DE PAGAMENTO (Se já estiver PAGO, mostra PAGO verde) */}
                                                        {p.status_pagamento === 'PAGO' ? (
                                                            <Badge bg="success" className="me-1">PAGO</Badge>
                                                        ) : p.metodo_pagamento?.toUpperCase().includes('OFFLINE') ? (
                                                            <Badge bg="info" text="dark" className="me-1">Na Entrega</Badge>
                                                        ) : (
                                                            <Badge bg={p.status_pagamento === 'PENDENTE' ? 'warning' : 'secondary'} className="me-1">{p.status_pagamento}</Badge>
                                                        )}
                                                        
                                                        {isOutForDelivery && !isDelivered ? (
                                                            <Badge bg="primary"><i className="fas fa-motorcycle"></i> Rota</Badge>
                                                        ) : (
                                                            <Badge bg={isDelivered ? 'success' : 'light'} text={isDelivered ? 'white' : 'dark'} className="border">{p.status_entrega || 'Pendente'}</Badge>
                                                        )}

                                                        {isOutForDelivery && !isDelivered && p.delivery_pin && (
                                                            <div className="mt-1">
                                                                <Badge bg="dark" style={{fontSize:'0.7rem'}}>PIN: <span className="text-warning">{p.delivery_pin}</span></Badge>
                                                            </div>
                                                        )}

                                                    </div>
                                                    <div className="text-end">
                                                        <small className="d-block text-muted" style={{fontSize:'0.7rem'}}>TOTAL</small>
                                                        <span className="fw-bold text-success">R$ {parseFloat(p.preco_total).toFixed(2)}</span>
                                                    </div>
                                                </div>

                                                <div className="d-grid gap-2 d-flex">
                                                    <LinkContainer to={p.link_detalhe || `/admin/order/${p.id_pedido}`} className="flex-grow-1">
                                                        <Button variant="outline-dark" size="sm">Detalhes</Button>
                                                    </LinkContainer>
                                                    
                                                    {isOutForDelivery && !isDelivered && p.driver_token && (
                                                        <Button variant="outline-info" size="sm" onClick={() => {
                                                            window.open(`${ecommerceUrl}/driver/delivery/${p.driver_token}`, '_blank');
                                                        }}>
                                                            <i className="fas fa-map-marker-alt"></i> Acompanhar
                                                        </Button>
                                                    )}

                                                    {p.origem !== 'mercadolivre' && isActionable && !isReady && !isDelivered && !isOutForDelivery && isRetirada && (
                                                        <Button variant="primary" size="sm" onClick={() => handleAction('ready', p.id_pedido)}>
                                                            <i className="bi bi-box-seam"></i>
                                                        </Button>
                                                    )}
                                                    
                                                    {p.origem !== 'mercadolivre' && isActionable && !isDelivered && !isOutForDelivery && !isRetirada && (
                                                        <Button variant="info" size="sm" onClick={() => handleAction('deliver', p.id_pedido)}>
                                                            <i className="fas fa-motorcycle text-white"></i> 
                                                        </Button>
                                                    )}
                                                </div>
                                            </Card.Body>
                                        </Card>
                                    </motion.div>
                                );
                            })}
                        </div>

                        {totalPages > 1 && (
                            <div className="d-flex justify-content-center mt-4">
                                <Pagination>
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
                    </>
                )}
            </AnimatePresence>
        </Container>
    );
};

export default OrderListPage;