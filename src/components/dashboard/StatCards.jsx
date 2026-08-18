import React, { useState, useEffect, useCallback } from 'react';
import { Row, Col, Spinner, Modal, Table } from 'react-bootstrap';
import { Calculator } from 'lucide-react';
import api from '../../services/api';
import io from 'socket.io-client';
import { toast } from 'react-toastify';

const SOCKET_URL = process.env.REACT_APP_API_URL;

const formatDateParam = (date) => {
    if (!date) return '';
    if (typeof date === 'string' && date.match(/^\d{4}-\d{2}-\d{2}$/)) return date;
    const d = new Date(date);
    return d.toISOString().split('T')[0];
};

const formatCurrency = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);

const formatDateHora = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString('pt-BR');
};

const MinimalCard = ({ title, value, customClass = "", onClick }) => (
    <div 
        className={`clean-card p-4 h-100 d-flex flex-column justify-content-center ${customClass} ${onClick ? 'shadow-hover' : ''}`}
        onClick={onClick}
        style={onClick ? { cursor: 'pointer', transition: 'all 0.2s ease' } : {}}
    >
        <div className="kpi-title text-muted text-uppercase small fw-bold mb-2">{title}</div>
        <div className="kpi-value fw-bold fs-3 text-dark">{value}</div>
        {onClick && (
            <div className="mt-2 text-primary" style={{ fontSize: '11px', fontWeight: '500' }}>
                <i className="bi bi-hand-index-thumb me-1"></i> Clique para ver o extrato
            </div>
        )}
    </div>
);

// Adicionado o parâmetro isMobile e children
const StatCards = ({ dateRange, isMobile = false, children }) => {
    const [kpis, setKpis] = useState(null);
    const [loading, setLoading] = useState(true);

    const [showSalesModal, setShowSalesModal] = useState(false);
    const [salesDetails, setSalesDetails] = useState([]);
    const [loadingSales, setLoadingSales] = useState(false);

    const fetchData = useCallback(async (isAutoUpdate = false) => {
        if (!dateRange?.startDate || !dateRange?.endDate) {
            setLoading(false);
            return;
        }
        
        if (!isAutoUpdate) setLoading(true);

        const params = { 
            startDate: formatDateParam(dateRange.startDate), 
            endDate: `${formatDateParam(dateRange.endDate)}T23:59:59` 
        };

        try {
            const kpiResponse = await api.get(`/dashboard/kpis`, { params });
            setKpis(kpiResponse.data);
        } catch (err) {
            console.error("❌ Erro ao buscar KPIs no dashboard:", err);
        } finally {
            if (!isAutoUpdate) setLoading(false);
        }
    }, [dateRange]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    useEffect(() => {
        const socket = io(SOCKET_URL);
        socket.on('novo_pedido', (data) => {
            if (data.status === 'PAGO' || data.status === 'approved') fetchData(true);
        });
        socket.on('venda_pdv_realizada', () => fetchData(true));
        socket.on('pagamento_confirmado', () => fetchData(true));
        return () => socket.disconnect();
    }, [fetchData]);

    const handleOpenSalesDetails = async () => {
        setShowSalesModal(true);
        setLoadingSales(true);
        try {
            const params = { 
                startDate: formatDateParam(dateRange.startDate), 
                endDate: `${formatDateParam(dateRange.endDate)}T23:59:59` 
            };
            const res = await api.get('/dashboard/sales-details', { params });
            setSalesDetails(res.data);
        } catch (err) {
            toast.error("Erro ao carregar o extrato de vendas.");
        } finally {
            setLoadingSales(false);
        }
    };

    if (loading) {
        return <div className="text-center my-4"><Spinner animation="border" variant="secondary" size="sm" /></div>;
    }

    const faturamentoBruto = Number(kpis?.faturamentoTotal || 0);
    const totalPedidos = Number(kpis?.pedidosTotais || 0);
    const ticketMedio = totalPedidos > 0 ? (faturamentoBruto / totalPedidos) : 0;
    const liquidoReal = faturamentoBruto - Number(kpis?.taxasTotais || 0);
    const somaExtrato = salesDetails.reduce((acc, item) => acc + item.total, 0);

    /* ====== RENDERIZAÇÃO EXCLUSIVA PARA O MOBILE ====== */
    if (isMobile) {
        return (
            <>
                <style>{`
                    .gray-mobile-card {
                        background-color: #e6e6e6;
                        border-radius: 20px;
                        padding: 20px 15px;
                        display: flex;
                        flex-direction: column;
                        justify-content: center;
                        align-items: center;
                    }
                    .kpi-title-mobile { font-size: 10px; font-weight: 800; color: #000; margin-bottom: 10px; }
                    .kpi-value-mobile { font-size: 22px; font-weight: 800; color: #000; line-height: 1; }
                `}</style>

                {/* Faturamento solto no fundo azul */}
                <div className="text-center text-white mb-4 pt-2 pb-5" onClick={handleOpenSalesDetails} style={{ cursor: 'pointer' }}>
                    <div style={{ fontSize: '11px', fontWeight: '700' }}>Faturamento Bruto</div>
                    <div style={{ fontSize: '38px', fontWeight: '800', letterSpacing: '-1px' }}>
                        {formatCurrency(faturamentoBruto)}
                    </div>
                </div>

                {/* Bloco branco contendo o resto dos gráficos */}
                <div style={{ backgroundColor: '#ffffff', borderRadius: '40px 40px 0 0', padding: '30px 20px', minHeight: '80vh' }}>
                    
                    <Row className="g-3 mb-3">
                        <Col xs={6}>
                            <div className="gray-mobile-card h-100">
                                <div className="kpi-title-mobile">Total de transações</div>
                                <div className="kpi-value-mobile">{totalPedidos}</div>
                            </div>
                        </Col>
                        <Col xs={6}>
                            <div className="gray-mobile-card h-100">
                                <div className="kpi-title-mobile">Tickets Médios</div>
                                <div className="kpi-value-mobile" style={{ fontSize: '19px' }}>{formatCurrency(ticketMedio)}</div>
                            </div>
                        </Col>
                    </Row>

                    <Row className="g-3 mb-4">
                        <Col xs={12}>
                            <div className="gray-mobile-card" style={{ padding: '25px 15px' }}>
                                <div className="kpi-title-mobile">Líquido (Caixa)</div>
                                <div className="kpi-value-mobile">{formatCurrency(liquidoReal)}</div>
                            </div>
                        </Col>
                    </Row>

                    {/* Renderiza o restante dos gráficos repassados pelo DashboardMobile */}
                    {children}
                </div>

                {/* Modal renderizado oculto */}
                <Modal show={showSalesModal} onHide={() => setShowSalesModal(false)} size="lg" centered>
                    <Modal.Header closeButton className="bg-light border-bottom">
                        <Modal.Title className="h5 fw-bold d-flex align-items-center">
                            <Calculator className="me-2 text-primary" /> Conferência de Faturamento
                        </Modal.Title>
                    </Modal.Header>
                    <Modal.Body className="p-0">
                        {loadingSales ? (
                            <div className="text-center py-5"><Spinner animation="border" variant="primary" /></div>
                        ) : salesDetails.length === 0 ? (
                            <div className="text-center py-5 text-muted">Nenhum produto vendido neste período.</div>
                        ) : (
                            <div className="table-responsive" style={{ maxHeight: '500px', overflowY: 'auto' }}>
                                <Table hover striped className="mb-0 align-middle">
                                    <thead className="bg-white sticky-top shadow-sm" style={{ zIndex: 1 }}>
                                        <tr>
                                            <th className="text-muted small ps-3">Data / Hora</th>
                                            <th className="text-muted small">Pedido</th>
                                            <th className="text-muted small">Produto</th>
                                            <th className="text-center text-muted small">Qtd</th>
                                            <th className="text-end text-muted small pe-3">Valor Total</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {salesDetails.map((item, index) => (
                                            <tr key={index}>
                                                <td className="small text-muted ps-3">{formatDateHora(item.data)}</td>
                                                <td className="small fw-bold text-secondary">#{item.id_pedido}</td>
                                                <td className="fw-medium text-dark">{item.produto}</td>
                                                <td className="text-center">{item.quantidade}x</td>
                                                <td className="text-end fw-bold text-success pe-3">{formatCurrency(item.total)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                            </div>
                        )}
                    </Modal.Body>
                    <Modal.Footer className="bg-light d-flex justify-content-between">
                        <div className="text-muted small">Total de {salesDetails.length} itens vendidos</div>
                        <div>
                            <span className="text-muted text-uppercase small fw-bold me-2">Soma Exata:</span>
                            <span className="fs-4 fw-bold text-primary">{formatCurrency(somaExtrato)}</span>
                        </div>
                    </Modal.Footer>
                </Modal>
            </>
        );
    }

    /* ====== RENDERIZAÇÃO ORIGINAL E INTACTA PARA O PC (DESKTOP) ====== */
    return (
        <div className="mb-4">
            <Row className="g-4 mb-4">
                <Col lg={4} md={4} xs={12}>
                    <MinimalCard 
                        title="Faturamento Bruto" 
                        value={formatCurrency(faturamentoBruto)} 
                        customClass="border-start border-4 border-primary bg-white"
                        onClick={handleOpenSalesDetails} 
                    />
                </Col>
                <Col lg={4} md={4} xs={6}>
                    <MinimalCard title="Total de transações" value={totalPedidos} customClass="bg-white" />
                </Col>
                <Col lg={4} md={4} xs={6}>
                    <MinimalCard title="Ticket Médio" value={formatCurrency(ticketMedio)} customClass="bg-white" />
                </Col>
            </Row>

            <Row className="g-4">
                <Col lg={4} md={4} xs={12}>
                    <MinimalCard title="Líquido (Em Caixa)" value={formatCurrency(liquidoReal)} customClass="bg-white" />
                </Col>
                <Col lg={4} md={4} xs={6}>
                    <MinimalCard title="Estoque Crítico (Repor)" value={kpis?.estoqueBaixo || 0} customClass="bg-white" />
                </Col>
                <Col lg={4} md={4} xs={6}>
                    <MinimalCard title="Estoque Saudável" value={kpis?.estoqueNormal || 0} customClass="bg-white" />
                </Col>
            </Row>

            {/* MODAL DE CONFERÊNCIA DE VENDAS */}
            <Modal show={showSalesModal} onHide={() => setShowSalesModal(false)} size="lg" centered>
                <Modal.Header closeButton className="bg-light border-bottom">
                    <Modal.Title className="h5 fw-bold d-flex align-items-center">
                        <Calculator className="me-2 text-primary" /> Conferência de Faturamento
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body className="p-0">
                    {loadingSales ? (
                        <div className="text-center py-5"><Spinner animation="border" variant="primary" /></div>
                    ) : salesDetails.length === 0 ? (
                        <div className="text-center py-5 text-muted">Nenhum produto vendido neste período.</div>
                    ) : (
                        <div className="table-responsive" style={{ maxHeight: '500px', overflowY: 'auto' }}>
                            <Table hover striped className="mb-0 align-middle">
                                <thead className="bg-white sticky-top shadow-sm" style={{ zIndex: 1 }}>
                                    <tr>
                                        <th className="text-muted small ps-3">Data / Hora</th>
                                        <th className="text-muted small">Pedido</th>
                                        <th className="text-muted small">Produto</th>
                                        <th className="text-center text-muted small">Qtd</th>
                                        <th className="text-end text-muted small pe-3">Valor Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {salesDetails.map((item, index) => (
                                        <tr key={index}>
                                            <td className="small text-muted ps-3">{formatDateHora(item.data)}</td>
                                            <td className="small fw-bold text-secondary">#{item.id_pedido}</td>
                                            <td className="fw-medium text-dark">{item.produto}</td>
                                            <td className="text-center">{item.quantidade}x</td>
                                            <td className="text-end fw-bold text-success pe-3">{formatCurrency(item.total)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        </div>
                    )}
                </Modal.Body>
                <Modal.Footer className="bg-light d-flex justify-content-between">
                    <div className="text-muted small">Total de {salesDetails.length} itens vendidos</div>
                    <div>
                        <span className="text-muted text-uppercase small fw-bold me-2">Soma Exata:</span>
                        <span className="fs-4 fw-bold text-primary">{formatCurrency(somaExtrato)}</span>
                    </div>
                </Modal.Footer>
            </Modal>

            <style>{`
                .shadow-hover:hover {
                    box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15) !important;
                    transform: translateY(-2px);
                }
            `}</style>
        </div>
    );
};

export default StatCards;