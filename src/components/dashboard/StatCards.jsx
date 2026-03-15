import React, { useState, useEffect, useCallback } from 'react';
import { Card, Row, Col, Spinner, Alert, Image, OverlayTrigger, Tooltip, Modal, Button, Table, Badge, Image as BsImage } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import io from 'socket.io-client';

const mercadoLivreIconUrl = 'https://logospng.org/download/mercado-livre/logo-mercado-livre-256.png';
const SOCKET_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// --- HELPER: Formata Data ---
const formatDateParam = (date) => {
    if (!date) return '';
    if (typeof date === 'string' && date.match(/^\d{4}-\d{2}-\d{2}$/)) return date;
    const d = new Date(date);
    return d.toISOString().split('T')[0];
};

// --- COMPONENTE DO CARD ---
const KPICard = ({ title, value, prefix = '', icon, color, footerIcon, description, origin, isCritical, onClick }) => {
    const renderTooltip = (props) => (
        <Tooltip id={`tooltip-${title}`} {...props}>{description}</Tooltip>
    );

    return (
        <Card 
            className={`shadow-sm h-100 border-0 transition-hover ${isCritical ? 'border-critical' : ''}`} 
            style={{ borderRadius: '1rem', backgroundColor: '#fff', position: 'relative', overflow: 'hidden', cursor: 'pointer' }}
            onClick={onClick}
        >
            {isCritical && <div className="critical-indicator"></div>}
            <Card.Body className="d-flex flex-column justify-content-between p-3">
                <div className="d-flex align-items-start justify-content-between mb-2">
                    <div className={`d-flex align-items-center justify-content-center shadow-sm ${isCritical ? 'pulse-icon' : ''}`} 
                        style={{ backgroundColor: `${color}15`, color: color, borderRadius: '0.75rem', width: '45px', height: '45px' }}>
                        {footerIcon === 'ml' ? <Image src={mercadoLivreIconUrl} style={{ width: '22px' }} /> : <i className={`fas ${icon} fs-5`}></i>}
                    </div>
                    <OverlayTrigger placement="top" delay={{ show: 250, hide: 400 }} overlay={renderTooltip}>
                        <i className="fas fa-info-circle text-muted opacity-25" style={{ cursor: 'help', fontSize: '0.9rem' }}></i>
                    </OverlayTrigger>
                </div>
                <div>
                    <span className={`small fw-bold text-uppercase ls-1 ${isCritical ? 'text-danger' : 'text-muted'}`} style={{ fontSize: '0.65rem', letterSpacing: '0.5px' }}>
                        {title}
                    </span>
                    <h4 className="mb-0 fw-bold text-dark mt-1" style={{ fontSize: '1.25rem' }}>
                        <span className="text-muted fs-6 align-top me-1" style={{ opacity: 0.7 }}>{prefix}</span>
                        {value}
                    </h4>
                    <div className="mt-2 pt-2 border-top border-light d-flex justify-content-between align-items-center">
                        <small className="text-muted fw-medium" style={{ fontSize: '0.7rem' }}>
                            <i className="fas fa-chart-pie me-1" style={{ fontSize: '0.6rem' }}></i> {origin}
                        </small>
                        <i className="bi bi-chevron-right text-muted opacity-50" style={{ fontSize: '0.7rem' }}></i>
                    </div>
                </div>
            </Card.Body>
        </Card>
    );
};

// --- COMPONENTE PRINCIPAL ---
const StatCards = ({ dateRange, isMlEnabled }) => {
    // Dados Consolidados (Vindos do Backend /dashboard/kpis)
    const [kpis, setKpis] = useState(null);
    const [loading, setLoading] = useState(true);
    
    // Estados do Modal
    const [showModal, setShowModal] = useState(false);
    const [modalContent, setModalContent] = useState(null);
    const [modalLoading, setModalLoading] = useState(false);

    const formatCurrency = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);

    // 1. BUSCA OTIMIZADA (KPIs Gerais)
    const fetchData = useCallback(async (isAutoUpdate = false) => {
        if (!dateRange?.startDate || !dateRange?.endDate) return;
        if (!isAutoUpdate) setLoading(true);

        const params = { 
            startDate: formatDateParam(dateRange.startDate), 
            endDate: formatDateParam(dateRange.endDate) 
        };

        try {
            const { data } = await api.get(`/dashboard/kpis`, { params });
            setKpis(data);
        } catch (err) {
            console.error("Erro dashboard:", err);
        } finally {
            if (!isAutoUpdate) setLoading(false);
        }
    }, [dateRange]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Socket.io Updates
    useEffect(() => {
        const socket = io(SOCKET_URL);
        socket.on('novo_pedido', (data) => {
            if (data.status === 'PAGO' || data.status === 'approved') fetchData(true);
        });
        socket.on('pagamento_confirmado', () => fetchData(true));
        return () => socket.disconnect();
    }, [fetchData]);

    // 2. BUSCA DE TRANSAÇÕES (Apenas para o Modal)
    const fetchTransactionsPreview = async () => {
        try {
            const params = { 
                startDate: formatDateParam(dateRange.startDate), 
                endDate: formatDateParam(dateRange.endDate) 
            };
            const { data } = await api.get('/admin/financial/transactions', { params });
            return Array.isArray(data) ? data : (data.history || []);
        } catch (error) {
            console.error("Erro ao buscar preview financeiro:", error);
            return [];
        }
    };

    // --- RENDERIZA LISTA DE PRODUTOS (Para estoque) ---
    const renderProductList = (products) => (
        <div className="table-responsive rounded-3 border" style={{ maxHeight: '400px', overflowY: 'auto' }}>
            <Table hover className="mb-0 align-middle small">
                <thead className="bg-light text-muted text-uppercase sticky-top">
                    <tr>
                        <th className="ps-4 border-0 py-2">Produto</th>
                        <th className="text-center border-0 py-2">Situação</th>
                        <th className="text-end pe-4 border-0 py-2">Preço</th>
                        <th className="text-end border-0 py-2 pe-3">Ação</th>
                    </tr>
                </thead>
                <tbody>
                    {products.map((p) => {
                        const isOutOfStock = p.estoque === 0;
                        const isCritical = p.estoque > 0 && p.estoque <= 5;
                        return (
                            <tr key={p.id_produto} className={isOutOfStock ? 'bg-light bg-opacity-50' : ''}>
                                <td className="ps-4">
                                    <div className="d-flex align-items-center">
                                        <BsImage src={p.imagem_url || 'https://placehold.co/50x50'} rounded style={{ width: '40px', height: '40px', objectFit: 'cover', filter: isOutOfStock ? 'grayscale(100%)' : 'none', opacity: isOutOfStock ? 0.6 : 1 }} className="me-3 bg-white border" />
                                        <div>
                                            <span className={`d-block fw-bold ${isOutOfStock ? 'text-muted' : 'text-dark'} text-truncate`} style={{maxWidth: '220px'}}>{p.nome}</span>
                                        </div>
                                    </div>
                                </td>
                                <td className="text-center">
                                    <Badge bg={isOutOfStock ? 'dark' : (isCritical ? 'danger' : 'warning')} className="fw-bold px-2 py-1">
                                        {isOutOfStock ? 'ESGOTADO' : (isCritical ? `CRÍTICO (${p.estoque})` : `${p.estoque} un.`)}
                                    </Badge>
                                </td>
                                <td className="text-end pe-4 text-muted fw-medium">{formatCurrency(p.preco)}</td>
                                <td className="text-end pe-3">
                                    <Button as={Link} to={`/admin/product/${p.id_produto}/edit`} variant={isOutOfStock ? "dark" : "outline-primary"} size="sm" className="rounded-circle btn-icon shadow-sm"><i className="bi bi-pencil-square"></i></Button>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </Table>
        </div>
    );

    // --- RENDERIZA DETALHAMENTO FINANCEIRO COM TABELA ---
    const renderFinancialDetails = (transactions) => (
        <>
            <Row className="g-2 mb-3">
                <Col xs={4}>
                    <div className="p-3 border rounded-3 bg-white text-center shadow-sm">
                        <small className="text-muted text-uppercase fw-bold" style={{fontSize: '0.65rem'}}>Bruto Total</small>
                        <h5 className="mb-0 text-dark fw-bold">{formatCurrency(kpis?.faturamentoTotal)}</h5>
                    </div>
                </Col>
                <Col xs={4}>
                    <div className="p-3 border rounded-3 bg-white text-center shadow-sm position-relative overflow-hidden">
                        <div className="position-absolute top-0 start-0 w-1 h-100 bg-danger"></div>
                        <small className="text-danger text-uppercase fw-bold" style={{fontSize: '0.65rem'}}>Taxas</small>
                        <h5 className="mb-0 text-danger fw-bold">- {formatCurrency(kpis?.taxasTotais)}</h5>
                    </div>
                </Col>
                <Col xs={4}>
                    <div className="p-3 border rounded-3 bg-white text-center shadow-sm position-relative overflow-hidden">
                        <div className="position-absolute top-0 start-0 w-1 h-100 bg-success"></div>
                        <small className="text-success text-uppercase fw-bold" style={{fontSize: '0.65rem'}}>Líquido Real</small>
                        <h5 className="mb-0 text-success fw-bold">{formatCurrency(kpis?.liquidoTotal)}</h5>
                    </div>
                </Col>
            </Row>
            
            <h6 className="fw-bold mt-4 mb-2 text-muted small text-uppercase d-flex align-items-center">
                <i className="bi bi-clock-history me-2"></i> Últimas Movimentações Financeiras
            </h6>
            
            <div className="table-responsive rounded-3 border bg-white mb-3" style={{ maxHeight: '300px' }}>
                <Table hover className="mb-0 align-middle small table-striped">
                    <thead className="bg-light sticky-top text-muted text-uppercase">
                        <tr>
                            <th className="ps-3 border-0 py-2">Data / ID</th>
                            <th className="border-0 py-2">Gateway</th>
                            <th className="text-end border-0 py-2">Bruto</th>
                            <th className="text-end border-0 py-2 text-danger">Taxa</th>
                            <th className="text-end pe-3 border-0 py-2 text-success">Líquido</th>
                        </tr>
                    </thead>
                    <tbody>
                        {transactions && transactions.length > 0 ? (
                            transactions.map(tx => (
                                <tr key={tx.id_transacao}>
                                    <td className="ps-3">
                                        <div className="fw-bold text-dark">
                                            #{tx.id_pedido ? tx.id_pedido : 'AVULSO'}
                                        </div>
                                        <div className="text-muted" style={{fontSize: '0.7rem'}}>
                                            {new Date(tx.data_criacao).toLocaleDateString()}
                                        </div>
                                    </td>
                                    <td>
                                        <Badge bg="light" text="dark" className="border fw-normal text-uppercase" style={{fontSize: '0.7rem'}}>
                                            {tx.gateway_provider || 'SISTEMA'}
                                        </Badge>
                                    </td>
                                    <td className="text-end fw-medium">
                                        {formatCurrency(tx.valor_bruto)}
                                    </td>
                                    <td className="text-end text-danger small">
                                        - {formatCurrency(tx.valor_taxa)}
                                    </td>
                                    <td className="text-end pe-3 fw-bold text-success">
                                        {formatCurrency(tx.valor_liquido)}
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="5" className="text-center py-4 text-muted">
                                    Nenhuma transação encontrada neste período.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </Table>
            </div>

            <div className="d-grid">
                <Button as={Link} to="/admin/financeiro" variant="outline-primary" size="sm">
                    <i className="bi bi-box-arrow-up-right me-2"></i> Ver Relatório Completo
                </Button>
            </div>
        </>
    );

    // --- HANDLER DE CLIQUE NOS CARDS ---
    const handleCardClick = async (type) => {
        setModalContent(null);
        setModalLoading(true);
        setShowModal(true);

        try {
            let content = {};
            switch (type) {
                case 'sales':
                    const transactions = await fetchTransactionsPreview();
                    
                    content = {
                        title: 'Fluxo de Caixa Real',
                        color: 'success',
                        gradient: 'linear-gradient(135deg, #198754 0%, #20c997 100%)',
                        headerInfo: 'Valores efetivamente processados (Entradas)',
                        body: renderFinancialDetails(transactions)
                    };
                    break;
                
                case 'orders':
                    content = {
                        title: 'Volume de Pedidos',
                        color: 'primary',
                        gradient: 'linear-gradient(135deg, #0d6efd 0%, #0dcaf0 100%)',
                        body: (
                            <div className="p-3 text-center">
                                <h3 className="text-primary display-4 fw-bold">{kpis?.pedidosTotais}</h3>
                                <p className="text-muted">Pedidos pagos e processados no período.</p>
                                <hr/>
                                <div className="d-flex justify-content-center gap-4">
                                    <div><small>E-commerce</small><div className="fw-bold">{kpis?.pedidosEcommerce}</div></div>
                                    <div><small>Mercado Livre</small><div className="fw-bold">{kpis?.pedidosML}</div></div>
                                </div>
                            </div>
                        )
                    };
                    break;

                case 'stock_low':
                    const { data: lowStock } = await api.get('/dashboard/stock-details?type=low');
                    content = {
                        title: 'Estoque Crítico',
                        color: 'danger',
                        gradient: 'linear-gradient(135deg, #dc3545 0%, #000000 100%)',
                        body: (
                            <>
                                <Alert variant="danger" className="border-0 shadow-sm mb-3 small">
                                    Produtos esgotados ou com menos de 5 unidades.
                                </Alert>
                                {renderProductList(lowStock)}
                            </>
                        )
                    };
                    break;

                case 'stock_normal':
                    const { data: normalStock } = await api.get('/dashboard/stock-details?type=normal');
                    content = {
                        title: 'Estoque Saudável',
                        color: 'success',
                        gradient: 'linear-gradient(135deg, #20c997 0%, #198754 100%)',
                        body: renderProductList(normalStock)
                    };
                    break;

                default:
                    content = { title: 'Detalhes', body: <p>...</p> };
            }
            setModalContent(content);
        } catch (error) {
            console.error(error);
            setModalContent({ title: 'Erro', color: 'danger', body: <p>Erro ao carregar dados.</p> });
        } finally {
            setModalLoading(false);
        }
    };

    return (
        <>
            {loading ? (
                <div className="text-center my-5 py-5"><Spinner animation="border" variant="primary" /></div>
            ) : (
                <Row className="g-3">
                    <Col lg={3} md={6} xs={12}>
                        <KPICard 
                            title="Faturamento (Entrada Real)" 
                            value={formatCurrency(kpis?.faturamentoTotal)} 
                            prefix="" 
                            icon="fa-dollar-sign" 
                            color="#198754" 
                            origin="Confirmado" 
                            description="Soma do valor bruto das transações no período selecionado." 
                            onClick={() => handleCardClick('sales')} 
                        />
                    </Col>

                    <Col lg={3} md={6} xs={6}>
                        <KPICard title="Pedidos Gerados" value={kpis?.pedidosTotais || 0} icon="fa-box-open" color="#0d6efd" origin="Lojas" description="Total de pedidos pagos." onClick={() => handleCardClick('orders')} />
                    </Col>
                    
                    <Col lg={3} md={6} xs={6}>
                        <KPICard title="Ticket Médio" value={formatCurrency(kpis?.ticketMedioTotal)} icon="fa-receipt" color="#6610f2" origin="Média" description="Média por pedido (Faturamento / Pedidos)." onClick={() => handleCardClick('sales')} />
                    </Col>
                    
                    <Col lg={3} md={6} xs={12}>
                        <KPICard 
                            title="Líquido (Em Caixa)" 
                            value={formatCurrency(kpis?.liquidoTotal)} 
                            prefix="" 
                            icon="fa-wallet" 
                            color="#fd7e14" 
                            origin="Real" 
                            description="Valor final disponível após desconto das taxas." 
                            onClick={() => handleCardClick('sales')} 
                        />
                    </Col>

                    <Col lg={6} md={6} xs={12}>
                        <KPICard title="Estoque Crítico (Repor)" value={kpis?.estoqueBaixo || 0} icon="fa-exclamation-triangle" color="#dc3545" origin="< 5 un." isCritical={true} onClick={() => handleCardClick('stock_low')} />
                    </Col>
                    <Col lg={6} md={6} xs={12}>
                        <KPICard title="Estoque Saudável" value={kpis?.estoqueNormal || 0} icon="fa-check-circle" color="#20c997" origin="> 5 un." onClick={() => handleCardClick('stock_normal')} />
                    </Col>
                </Row>
            )}

            <Modal show={showModal} onHide={() => setShowModal(false)} centered size="lg" contentClassName="border-0 rounded-4 shadow-lg overflow-hidden">
                {modalLoading ? (
                    <div className="text-center p-5"><Spinner animation="border" variant="primary" /></div>
                ) : modalContent && (
                    <>
                        <div className="p-4 text-white position-relative" style={{ background: modalContent.gradient || '#0d6efd' }}>
                            <button onClick={() => setShowModal(false)} className="position-absolute top-0 end-0 m-3 btn btn-light rounded-circle d-flex align-items-center justify-content-center shadow-sm" style={{ width: '32px', height: '32px', border: 'none', zIndex: 10 }}>
                                <i className="bi bi-x-lg text-dark" style={{ fontSize: '14px' }}></i>
                            </button>
                            <h4 className="fw-bold mb-1">{modalContent.title}</h4>
                            {modalContent.headerInfo && <p className="mb-0 opacity-75">{modalContent.headerInfo}</p>}
                        </div>
                        <Modal.Body className="p-4 bg-light">
                            {modalContent.body}
                        </Modal.Body>
                    </>
                )}
            </Modal>

            <style>{`
                .transition-hover { transition: transform 0.2s ease, box-shadow 0.2s ease; }
                .transition-hover:hover { transform: translateY(-5px); box-shadow: 0 10px 25px rgba(0,0,0,0.1) !important; }
                .border-critical { border: 1px solid #dc3545 !important; }
                .critical-indicator { position: absolute; top: 0; right: 0; width: 0; height: 0; border-left: 15px solid transparent; border-bottom: 15px solid transparent; border-top: 15px solid #dc3545; border-right: 15px solid #dc3545; }
                .table-responsive::-webkit-scrollbar { width: 6px; }
                .table-responsive::-webkit-scrollbar-track { background: #f8f9fa; }
                .table-responsive::-webkit-scrollbar-thumb { background: #dee2e6; border-radius: 10px; }
            `}</style>
        </>
    );
};

export default StatCards;