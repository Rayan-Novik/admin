import React, { useState, useEffect } from 'react';
import { Form, Button, Card, Alert, Row, Col } from 'react-bootstrap';

// Mini componente de preview estilizado
const PreviewCard = ({ title, icon, color, size = 12 }) => (
    <Col xs={size} className="mb-2">
        <Card className={`shadow-sm border-0 border-start border-4 border-${color} h-100`}>
            <Card.Body className="p-2 d-flex align-items-center">
                <div className={`bg-${color} bg-opacity-10 p-2 rounded-circle me-3 text-${color}`}>
                    <i className={`fas ${icon}`}></i>
                </div>
                <small className="fw-bold text-dark text-truncate">{title}</small>
            </Card.Body>
        </Card>
    </Col>
);

const DashboardSettingsPage = () => {
    // Estado inicial mapeado com os componentes reais do DashboardPage
    const [settings, setSettings] = useState({
        showKPIs: true,             // StatCards
        showFinancial: true,        // DetailedSalesChart + PaymentMethodsChart
        showRecentOrders: true,     // RecentOrders
        showAudit: true,            // ProductAuditChart (Novo)
        showStock: true,            // InventoryStatus
        showRankings: true,         // TopProducts + MostViewed
        showReviews: true           // ReviewsSummary
    });

    const [saved, setSaved] = useState(false);

    useEffect(() => {
        const savedSettings = localStorage.getItem('dashboardSettings');
        if (savedSettings) {
            setSettings(prev => ({ ...prev, ...JSON.parse(savedSettings) }));
        }
    }, []);

    const handleToggle = (key) => {
        setSettings(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handleSave = () => {
        localStorage.setItem('dashboardSettings', JSON.stringify(settings));
        // Dispara um evento customizado para o DashboardPage saber que mudou (opcional, se quiser hot-reload)
        window.dispatchEvent(new Event('dashboardSettingsChanged'));
        
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    return (
        <div className="py-4 container-fluid">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h1 className="h3 fw-bold mb-0 text-dark">Personalizar Dashboard</h1>
                    <small className="text-muted">Escolha quais painéis você quer ver na tela inicial.</small>
                </div>
                <Button variant="primary" onClick={handleSave} className="shadow-sm rounded-pill px-4 fw-bold">
                    <i className="fas fa-save me-2"></i> Salvar Alterações
                </Button>
            </div>

            {saved && (
                <Alert variant="success" onClose={() => setSaved(false)} dismissible className="shadow-sm border-0">
                    <i className="fas fa-check-circle me-2"></i> Definições salvas com sucesso!
                </Alert>
            )}

            <Row className="g-4">
                {/* --- Coluna de Configurações --- */}
                <Col lg={7}>
                    <Card className="shadow-sm border-0 rounded-4">
                        <Card.Body className="p-4">
                            
                            {/* GRUPO 1: Visão Geral */}
                            <h6 className="fw-bold text-uppercase text-muted mb-3 small ls-1">Visão Geral & Financeiro</h6>
                            <div className="mb-4 ps-2 border-start border-3 border-light">
                                <Form.Check 
                                    type="switch" id="kpis-switch" label="Cartões de KPIs (Resumo do Topo)" 
                                    checked={settings.showKPIs} onChange={() => handleToggle('showKPIs')} 
                                    className="mb-3 fw-medium fs-5"
                                />
                                <Form.Check 
                                    type="switch" id="financial-switch" label="Gráficos Financeiros (Faturamento & Pagamentos)" 
                                    checked={settings.showFinancial} onChange={() => handleToggle('showFinancial')} 
                                    className="mb-0 fw-medium fs-5"
                                />
                            </div>

                            {/* GRUPO 2: Operacional */}
                            <h6 className="fw-bold text-uppercase text-muted mb-3 small ls-1 mt-4">Operacional</h6>
                            <div className="mb-4 ps-2 border-start border-3 border-light">
                                <Form.Check 
                                    type="switch" id="orders-switch" label="Pedidos Recentes (Tabela)" 
                                    checked={settings.showRecentOrders} onChange={() => handleToggle('showRecentOrders')} 
                                    className="mb-3 fw-medium fs-5"
                                />
                                <Form.Check 
                                    type="switch" id="audit-switch" label="Auditoria de Catálogo (Produtividade)" 
                                    checked={settings.showAudit} onChange={() => handleToggle('showAudit')} 
                                    className="mb-0 fw-medium fs-5"
                                />
                            </div>

                            {/* GRUPO 3: Produtos e Estoque */}
                            <h6 className="fw-bold text-uppercase text-muted mb-3 small ls-1 mt-4">Produtos & Estoque</h6>
                            <div className="ps-2 border-start border-3 border-light">
                                <Form.Check 
                                    type="switch" id="stock-switch" label="Status de Estoque (Baixo/Crítico)" 
                                    checked={settings.showStock} onChange={() => handleToggle('showStock')} 
                                    className="mb-3 fw-medium fs-5"
                                />
                                <Form.Check 
                                    type="switch" id="rankings-switch" label="Rankings (Mais Vendidos & Mais Vistos)" 
                                    checked={settings.showRankings} onChange={() => handleToggle('showRankings')} 
                                    className="mb-3 fw-medium fs-5"
                                />
                                <Form.Check 
                                    type="switch" id="reviews-switch" label="Últimas Avaliações" 
                                    checked={settings.showReviews} onChange={() => handleToggle('showReviews')} 
                                    className="mb-0 fw-medium fs-5"
                                />
                            </div>

                        </Card.Body>
                    </Card>
                </Col>

                {/* --- Coluna de Preview (Simulação Visual) --- */}
                <Col lg={5}>
                    <Card className="shadow-sm border-0 rounded-4 h-100 bg-light">
                        <Card.Body className="p-4">
                            <h5 className="fw-bold mb-1 text-secondary text-center">Pré-visualização</h5>
                            <p className="text-muted text-center small mb-4">Como seu painel ficará organizado</p>
                            
                            <div className="p-3 border rounded-4 bg-white shadow-sm" style={{minHeight: '400px'}}>
                                <Row className="g-2">
                                    {/* 1. KPIs */}
                                    {settings.showKPIs && (
                                        <PreviewCard title="KPIs Gerais" icon="fa-chart-pie" color="primary" size={12} />
                                    )}

                                    {/* 2. Financeiro */}
                                    {settings.showFinancial && (
                                        <>
                                            <PreviewCard title="Gráfico Faturamento" icon="fa-chart-area" color="success" size={8} />
                                            <PreviewCard title="Pagamentos" icon="fa-wallet" color="info" size={4} />
                                        </>
                                    )}

                                    {/* 3. Operacional */}
                                    {(settings.showRecentOrders || settings.showAudit) && (
                                        <>
                                            {settings.showRecentOrders && <PreviewCard title="Pedidos Recentes" icon="fa-shopping-cart" color="secondary" size={8} />}
                                            {settings.showAudit && <PreviewCard title="Auditoria" icon="fa-clipboard-check" color="teal" size={4} />}
                                        </>
                                    )}

                                    {/* 4. Estoque */}
                                    {settings.showStock && (
                                        <PreviewCard title="Gestão de Estoque" icon="fa-boxes" color="danger" size={12} />
                                    )}

                                    {/* 5. Rankings */}
                                    {settings.showRankings && (
                                        <>
                                            <PreviewCard title="Top Produtos" icon="fa-trophy" color="warning" size={6} />
                                            <PreviewCard title="Mais Vistos" icon="fa-eye" color="warning" size={6} />
                                        </>
                                    )}

                                    {/* 6. Reviews */}
                                    {settings.showReviews && (
                                        <PreviewCard title="Avaliações" icon="fa-star" color="dark" size={12} />
                                    )}

                                    {/* Estado Vazio */}
                                    {Object.values(settings).every(v => !v) && (
                                        <div className="text-center text-muted mt-5 pt-5">
                                            <i className="fas fa-eye-slash fs-1 mb-3 opacity-25"></i>
                                            <p className="fw-bold">Painel Vazio</p>
                                            <small>Selecione itens ao lado.</small>
                                        </div>
                                    )}
                                </Row>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default DashboardSettingsPage;