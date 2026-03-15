import React, { useState, useEffect } from 'react';
import { Row, Col, Container, Button, Modal, Form } from 'react-bootstrap';
import api from '../services/api'; //

// --- COMPONENTES ---

// 1. Indicadores Principais
import StatCards from '../components/dashboard/StatCards';

// 2. Gráficos Financeiros (Chart.js)
import DetailedSalesChart from '../components/dashboard/DetailedSalesChart'; 
import PaymentMethodsChart from '../components/dashboard/PaymentMethodsChart'; 

// 3. Operacional e Auditoria
import RecentOrders from '../components/dashboard/RecentOrders';
import ProductAuditChart from '../components/dashboard/ProductAuditChart'; 

// 4. Estoque e Produtos
import InventoryStatus from '../components/dashboard/InventoryStatus';
import TopProductsChart from '../components/dashboard/TopProductsChart';
import MostViewedProductsChart from '../components/dashboard/MostViewedProductsChart';
import ReviewsSummary from '../components/dashboard/ReviewsSummary';

const DashboardPage = () => {
    // --- ESTADO DE DATAS ---
    const [dateRange, setDateRange] = useState({
        startDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0]
    });
    
    const [activeFilter, setActiveFilter] = useState('30d');
    const [showFilterModal, setShowFilterModal] = useState(false);
    const [customDates, setCustomDates] = useState({ start: '', end: '' });

    // ✅ ESTADO DE CONTROLE DO MERCADO LIVRE
    // Verifica se a API está ativa para evitar erros de 404/Token no console
    const [isMlEnabled, setIsMlEnabled] = useState(false);

    // --- EFEITOS ---
    useEffect(() => {
        const checkMlStatus = async () => {
            try {
                // Chama a rota que criamos para validar o token silenciosamente
                const { data } = await api.get('/mercadolivre/check-auth');
                setIsMlEnabled(data.isAuthenticated);
            } catch (error) {
                // Se der erro ou 404, assume que não tem ML configurado
                setIsMlEnabled(false);
            }
        };
        checkMlStatus();
    }, []);

    // --- MANIPULADORES ---
    const handlePresetChange = (period) => {
        const end = new Date();
        const start = new Date();
        
        if (period === '7d') start.setDate(end.getDate() - 7);
        else if (period === '30d') start.setDate(end.getDate() - 30);
        // 'today' mantém start e end iguais (hoje)

        setDateRange({
            startDate: start.toISOString().split('T')[0],
            endDate: end.toISOString().split('T')[0]
        });
        setActiveFilter(period);
    };

    const applyCustomFilter = () => {
        if (customDates.start && customDates.end) {
            setDateRange({ startDate: customDates.start, endDate: customDates.end });
            setActiveFilter('custom');
            setShowFilterModal(false);
        }
    };

    return (
        <Container fluid="md" className="py-4">
            {/* --- CABEÇALHO E FILTROS --- */}
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-3">
                <div>
                    <h4 className="fw-bold text-dark mb-0">Dashboard</h4>
                    <small className="text-muted">Visão geral do desempenho da loja</small>
                </div>

                <div className="bg-white p-1 rounded-pill shadow-sm d-inline-flex align-items-center border">
                    <Button variant={activeFilter === 'today' ? 'dark' : 'light'} className="rounded-pill px-3 py-1 border-0 small fw-bold" onClick={() => handlePresetChange('today')}>Hoje</Button>
                    <Button variant={activeFilter === '7d' ? 'dark' : 'light'} className="rounded-pill px-3 py-1 border-0 small fw-bold" onClick={() => handlePresetChange('7d')}>7 dias</Button>
                    <Button variant={activeFilter === '30d' ? 'dark' : 'light'} className="rounded-pill px-3 py-1 border-0 small fw-bold" onClick={() => handlePresetChange('30d')}>30 dias</Button>
                    <div className="vr mx-2 text-muted opacity-25"></div>
                    <Button variant={activeFilter === 'custom' ? 'primary' : 'light'} className="rounded-circle p-0 d-flex align-items-center justify-content-center border-0" style={{ width: '32px', height: '32px' }} onClick={() => setShowFilterModal(true)}>
                        <i className="bi bi-calendar-event small"></i>
                    </Button>
                </div>
            </div>

            {/* 1. KPIs (Cards do Topo) */}
            <div className="mb-4">
                {/* Repassa o status do ML para não tentar buscar dados se não tiver token */}
                <StatCards dateRange={dateRange} isMlEnabled={isMlEnabled} />
            </div>

            {/* 2. GRÁFICOS FINANCEIROS (Linha e Pizza) */}
            <Row className="g-4 mb-4">
                <Col lg={8}>
                    {/* Gráfico de Linha: Comparativo ML vs Site */}
                    <DetailedSalesChart dateRange={dateRange} isMlEnabled={isMlEnabled} />
                </Col>
                <Col lg={4}>
                    {/* Gráfico de Pizza: Métodos de Pagamento */}
                    <PaymentMethodsChart dateRange={dateRange} />
                </Col>
            </Row>

            {/* 3. OPERACIONAL (Pedidos e Auditoria) */}
            <Row className="g-4 mb-4">
                <Col lg={8}>
                    <div className="h-100 shadow-sm rounded-4 overflow-hidden bg-white">
                        <RecentOrders dateRange={dateRange} isMlEnabled={isMlEnabled} />
                    </div>
                </Col>
                <Col lg={4}>
                    {/* Gráfico de Barras: Produtividade/Auditoria */}
                    <ProductAuditChart dateRange={dateRange} />
                </Col>
            </Row>

            {/* 4. GESTÃO DE ESTOQUE (Resumo Visual) */}
            <Row className="g-4 mb-4">
                <Col xs={12}>
                    <InventoryStatus dateRange={dateRange} />
                </Col>
            </Row>

            {/* 5. RANKINGS DE PRODUTOS */}
            <Row className="g-4 mb-4">
                <Col lg={6}>
                    <div className="h-100 shadow-sm rounded-4 overflow-hidden bg-white border-0">
                        <TopProductsChart dateRange={dateRange} />
                    </div>
                </Col>
                <Col lg={6}>
                    <div className="h-100 shadow-sm rounded-4 overflow-hidden bg-white border-0">
                        <MostViewedProductsChart dateRange={dateRange} />
                    </div>
                </Col>
            </Row>

            {/* 6. AVALIAÇÕES E FEEDBACK */}
            <Row className="g-4">
                <Col xs={12}>
                    <div className="h-100 shadow-sm rounded-4 overflow-hidden bg-white border-0">
                        <ReviewsSummary dateRange={dateRange} />
                    </div>
                </Col>
            </Row>

            {/* MODAL DE SELEÇÃO DE DATA */}
            <Modal show={showFilterModal} onHide={() => setShowFilterModal(false)} centered size="sm" contentClassName="rounded-4 border-0 shadow">
                <Modal.Header closeButton className="border-0 pb-0">
                    <Modal.Title className="fs-5 fw-bold">Filtrar Período</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <Form.Group className="mb-3">
                            <Form.Label className="small fw-bold text-muted">Início</Form.Label>
                            <Form.Control type="date" value={customDates.start} onChange={(e) => setCustomDates({...customDates, start: e.target.value})} className="bg-light border-0 shadow-none" />
                        </Form.Group>
                        <Form.Group>
                            <Form.Label className="small fw-bold text-muted">Fim</Form.Label>
                            <Form.Control type="date" value={customDates.end} onChange={(e) => setCustomDates({...customDates, end: e.target.value})} className="bg-light border-0 shadow-none" />
                        </Form.Group>
                    </Form>
                </Modal.Body>
                <Modal.Footer className="border-0 pt-0">
                    <Button variant="light" onClick={() => setShowFilterModal(false)} className="rounded-pill">Cancelar</Button>
                    <Button variant="primary" onClick={applyCustomFilter} className="rounded-pill px-4 fw-bold">Aplicar</Button>
                </Modal.Footer>
            </Modal>
        </Container>
    );
};

export default DashboardPage;