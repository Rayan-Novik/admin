import React, { useState, useEffect } from 'react';
import { Tab, Row, Col, Nav, Card, Container, Button, Badge, Alert, Spinner, Table, Form } from 'react-bootstrap';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';
import api from '../services/api';

// Componentes Existentes (Mantidos)
import SalesChart from '../components/dashboard/DetailedSalesChart';
import InventoryStatus from '../components/dashboard/InventoryStatus';
import ReviewsSummary from '../components/dashboard/ReviewsSummary';
import TopProductsChart from '../components/dashboard/TopProductsChart';

const ReportsPage = () => {
    const [isExporting, setIsExporting] = useState(false);
    const [loadingData, setLoadingData] = useState(false);
    
    // Estados para os Novos Relatórios
    const [costData, setCostData] = useState(null);
    const [forecastData, setForecastData] = useState(null);

    // Filtro de data padrão (Mês atual)
    const [dateRange, setDateRange] = useState({
        startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0]
    });

    // --- CARREGAMENTO DE DADOS ---
    const fetchCosts = async () => {
        setLoadingData(true);
        try {
            // ✅ ROTA CORRIGIDA: /relatorios/custos
            const { data } = await api.get(`/relatorios/custos`, { 
                params: { data_inicio: dateRange.startDate, data_fim: dateRange.endDate } 
            });
            setCostData(data);
        } catch (error) { console.error(error); } 
        finally { setLoadingData(false); }
    };

    const fetchForecast = async () => {
        setLoadingData(true);
        try {
            // ✅ ROTA CORRIGIDA: /relatorios/previsao-estoque
            const { data } = await api.get(`/relatorios/previsao-estoque`);
            setForecastData(data);
        } catch (error) { console.error(error); } 
        finally { setLoadingData(false); }
    };

    // --- EXPORTAÇÃO EXCEL ---
    const exportToExcel = async (type) => {
        setIsExporting(true);
        try {
            let sheetData = [];
            let fileName = `Relatorio_${type}_${dateRange.endDate}.xlsx`;

            if (type === 'costs') {
                // Se não tiver dados carregados, busca agora
                let dataToExport = costData;
                if (!dataToExport) {
                    // ✅ ROTA CORRIGIDA
                    const res = await api.get(`/relatorios/custos`, { params: { data_inicio: dateRange.startDate, data_fim: dateRange.endDate } });
                    dataToExport = res.data;
                }
                sheetData = dataToExport.detalhes.map(d => ({
                    Data: new Date(d.data).toLocaleDateString(),
                    Produto: d.produto,
                    Tipo: d.tipo,
                    Qtd: d.quantidade,
                    Unidade: d.unidade,
                    Custo_Unit: d.custo_unitario,
                    Custo_Total: d.custo_total,
                    Motivo: d.motivo
                }));
            } 
            else if (type === 'forecast') {
                let dataToExport = forecastData;
                if (!dataToExport) {
                    // ✅ ROTA CORRIGIDA
                    const res = await api.get(`/relatorios/previsao-estoque`);
                    dataToExport = res.data;
                }
                sheetData = dataToExport.itens.map(i => ({
                    Produto: i.nome,
                    Tipo: i.tipo,
                    Estoque_Atual: i.estoque_atual,
                    Consumo_Mensal: i.consumo_ultimo_mes,
                    Sugestao_Compra: i.sugestao_compra,
                    Custo_Estimado: i.custo_estimado_reposicao,
                    Status: i.status
                }));
            }
            else if (type === 'inventory') {
                const { data } = await api.get('/dashboard/inventory-status', { params: { all: true } });
                const allStock = [...(data.lowStock || []), ...(data.highStock || [])];
                sheetData = allStock.map(p => ({
                    ID: p.id_produto, Produto: p.nome, Estoque: p.estoque, Custo: p.preco_custo, Venda: p.preco_venda
                }));
            }
            else if (type === 'reviews') {
                const { data } = await api.get('/dashboard/reviews-summary', { params: { ...dateRange, all: true } });
                sheetData = data.recentes.map(r => ({
                    Data: new Date(r.data_avaliacao).toLocaleDateString(), Cliente: r.usuarios?.nome_completo, Produto: r.produtos?.nome, Nota: r.nota, Comentario: r.comentario
                }));
            }
            else if (type === 'products') {
                const { data } = await api.get('/dashboard/top-products', { params: { ...dateRange, all: true } });
                sheetData = data.map(p => ({ Produto: p.nome, Qtd_Vendida: p._sum.quantidade, Faturamento: p.faturamento_total }));
            }

            const ws = XLSX.utils.json_to_sheet(sheetData);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Dados");
            const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
            saveAs(new Blob([excelBuffer]), fileName);

        } catch (error) {
            alert("Erro ao exportar dados.");
        } finally {
            setIsExporting(false);
        }
    };

    // Helpers
    const formatMoney = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
    const getCostChartData = () => {
        if (!costData?.resumo) return [];
        return [
            { name: 'Produção (Insumos)', value: costData.resumo.custo_insumos_fabricacao },
            { name: 'Revenda Direta', value: costData.resumo.custo_produtos_revenda }
        ].filter(i => i.value > 0);
    };
    const COST_COLORS = ['#ffc107', '#198754'];

    const navItems = [
        { key: 'finance', label: 'Vendas & Faturamento', icon: 'bi-graph-up-arrow', color: '#198754' },
        { key: 'costs', label: 'Custos & Produção', icon: 'bi-pie-chart-fill', color: '#dc3545' }, 
        { key: 'forecast', label: 'Previsão de Compra', icon: 'bi-magic', color: '#6610f2' }, 
        { key: 'inventory', label: 'Status de Estoque', icon: 'bi-box-seam', color: '#0d6efd' },
        { key: 'reviews', label: 'Avaliações', icon: 'bi-chat-heart', color: '#f39c12' },
        { key: 'rankings', label: 'Top Produtos', icon: 'bi-trophy', color: '#d63384' },
    ];

    return (
        <Container fluid className="py-4 px-lg-5 bg-light min-vh-100">
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-5">
                <div>
                    <h2 className="fw-bold text-dark mb-1">Central de Relatórios</h2>
                    <p className="text-muted mb-0">Inteligência de negócio, custos e previsões.</p>
                </div>
            </div>

            <Tab.Container id="reports-tabs" defaultActiveKey="finance" onSelect={(k) => {
                if (k === 'costs') fetchCosts();
                if (k === 'forecast') fetchForecast();
            }}>
                <Row>
                    <Col lg={3} className="mb-4">
                        <Nav variant="pills" className="flex-column gap-2 p-3 bg-white rounded-4 shadow-sm border sticky-top" style={{ top: '20px' }}>
                            {navItems.map((item) => (
                                <Nav.Item key={item.key}>
                                    <Nav.Link eventKey={item.key} className="d-flex align-items-center py-3 rounded-3 border-0">
                                        <div className="p-2 rounded-3 me-3 d-flex shadow-sm" style={{ background: `${item.color}15`, color: item.color }}>
                                            <i className={`bi ${item.icon} fs-5`}></i>
                                        </div>
                                        <span className="fw-bold text-dark">{item.label}</span>
                                    </Nav.Link>
                                </Nav.Item>
                            ))}
                        </Nav>
                    </Col>

                    <Col lg={9}>
                        <Tab.Content className="bg-white rounded-4 shadow-sm border p-4 p-md-5 min-vh-100">
                            
                            {/* 1. FATURAMENTO (VENDAS) */}
                            <Tab.Pane eventKey="finance">
                                <div className="d-flex justify-content-between align-items-center mb-4">
                                    <h4 className="fw-bold mb-0">Faturamento</h4>
                                    <Form.Control type="date" value={dateRange.startDate} onChange={e => setDateRange({...dateRange, startDate: e.target.value})} style={{maxWidth: '150px'}} />
                                </div>
                                <SalesChart dateRange={dateRange} />
                            </Tab.Pane>

                            {/* 2. CUSTOS (NOVO) */}
                            <Tab.Pane eventKey="costs">
                                <div className="d-flex justify-content-between align-items-center mb-4">
                                    <h4 className="fw-bold mb-0">Análise de Custos (CMV)</h4>
                                    <Button variant="outline-danger" size="sm" className="rounded-pill px-3" onClick={() => exportToExcel('costs')} disabled={isExporting}>
                                        {isExporting ? <Spinner size="sm"/> : <i className="bi bi-file-earmark-excel me-2"></i>} Exportar
                                    </Button>
                                </div>
                                {loadingData ? <div className="text-center py-5"><Spinner animation="border"/></div> : costData && (
                                    <Row>
                                        <Col md={5}>
                                            <Card className="border-0 shadow-sm mb-4">
                                                <Card.Body>
                                                    <h6 className="fw-bold mb-3">Distribuição</h6>
                                                    <div style={{ width: '100%', height: 250 }}>
                                                        <ResponsiveContainer>
                                                            <PieChart>
                                                                <Pie data={getCostChartData()} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                                                                    {getCostChartData().map((entry, index) => <Cell key={`cell-${index}`} fill={COST_COLORS[index % COST_COLORS.length]} />)}
                                                                </Pie>
                                                                <RechartsTooltip formatter={(value) => formatMoney(value)} />
                                                                <Legend verticalAlign="bottom"/>
                                                            </PieChart>
                                                        </ResponsiveContainer>
                                                    </div>
                                                    <div className="text-center mt-3">
                                                        <small className="text-muted text-uppercase">Custo Total do Período</small>
                                                        <h3 className="fw-bold text-dark">{formatMoney(costData.resumo.custo_total_periodo)}</h3>
                                                    </div>
                                                </Card.Body>
                                            </Card>
                                        </Col>
                                        <Col md={7}>
                                            <div className="table-responsive" style={{maxHeight: '400px'}}>
                                                <Table hover size="sm">
                                                    <thead className="bg-light sticky-top"><tr><th>Item</th><th className="text-end">Custo Total</th></tr></thead>
                                                    <tbody>
                                                        {costData.detalhes.slice(0, 20).map((d, i) => (
                                                            <tr key={i}>
                                                                <td>
                                                                    <div>{d.produto}</div>
                                                                    <small className="text-muted">{d.motivo}</small>
                                                                </td>
                                                                <td className="text-end fw-bold">{formatMoney(d.custo_total)}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </Table>
                                            </div>
                                        </Col>
                                    </Row>
                                )}
                            </Tab.Pane>

                            {/* 3. PREVISÃO (NOVO) */}
                            <Tab.Pane eventKey="forecast">
                                <div className="d-flex justify-content-between align-items-center mb-4">
                                    <h4 className="fw-bold mb-0">Previsão de Compra (I.A.)</h4>
                                    <Button variant="outline-primary" size="sm" className="rounded-pill px-3" onClick={() => exportToExcel('forecast')} disabled={isExporting}>
                                        {isExporting ? <Spinner size="sm"/> : <i className="bi bi-file-earmark-excel me-2"></i>} Baixar Lista
                                    </Button>
                                </div>
                                {loadingData ? <div className="text-center py-5"><Spinner animation="border"/></div> : forecastData && (
                                    <>
                                        <Alert variant="info" className="d-flex align-items-center border-0 shadow-sm mb-4">
                                            <i className="bi bi-lightbulb-fill fs-4 me-3"></i>
                                            <div>
                                                <strong>Sugestão de Compra:</strong> Baseado no consumo dos últimos {forecastData.analise_dias} dias.
                                                Valor total estimado: <strong>{formatMoney(forecastData.custo_total_previsao)}</strong>.
                                            </div>
                                        </Alert>
                                        <Table responsive hover className="align-middle">
                                            <thead className="bg-light">
                                                <tr>
                                                    <th>Produto</th>
                                                    <th className="text-center">Estoque Atual</th>
                                                    <th className="text-center">Consumo (30d)</th>
                                                    <th className="text-center text-primary">Sugestão</th>
                                                    <th className="text-end">Custo Est.</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {forecastData.itens.map((item, idx) => (
                                                    <tr key={idx} className={item.status === 'COMPRAR' ? 'bg-danger bg-opacity-10' : ''}>
                                                        <td className="fw-medium">{item.nome} <Badge bg="secondary" style={{fontSize:'0.6em'}}>{item.tipo}</Badge></td>
                                                        <td className="text-center text-muted">{item.estoque_atual}</td>
                                                        <td className="text-center">{item.consumo_ultimo_mes}</td>
                                                        <td className="text-center"><Badge bg="primary" className="shadow-sm">+{item.sugestao_compra} {item.unidade}</Badge></td>
                                                        <td className="text-end fw-bold">{formatMoney(item.custo_estimado_reposicao)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </Table>
                                    </>
                                )}
                            </Tab.Pane>

                            {/* 4. ESTOQUE (ANTIGO) */}
                            <Tab.Pane eventKey="inventory">
                                <div className="d-flex justify-content-between align-items-center mb-4">
                                    <h4 className="fw-bold mb-0">Status de Estoque</h4>
                                    <Button variant="outline-primary" size="sm" className="rounded-pill px-3" onClick={() => exportToExcel('inventory')} disabled={isExporting}>
                                        <i className="bi bi-file-earmark-excel me-2"></i>Exportar
                                    </Button>
                                </div>
                                <InventoryStatus dateRange={dateRange} />
                            </Tab.Pane>

                            {/* 5. REVIEWS (ANTIGO) */}
                            <Tab.Pane eventKey="reviews">
                                <div className="d-flex justify-content-between align-items-center mb-4">
                                    <h4 className="fw-bold mb-0">Avaliações</h4>
                                    <Button variant="outline-warning" size="sm" className="rounded-pill px-3 text-dark" onClick={() => exportToExcel('reviews')} disabled={isExporting}>
                                        <i className="bi bi-download me-2"></i>Baixar Histórico
                                    </Button>
                                </div>
                                <ReviewsSummary dateRange={dateRange} />
                            </Tab.Pane>

                            {/* 6. RANKINGS (ANTIGO) */}
                            <Tab.Pane eventKey="rankings">
                                <div className="d-flex justify-content-between align-items-center mb-4">
                                    <h4 className="fw-bold mb-0">Top Produtos</h4>
                                    <Button variant="outline-danger" size="sm" className="rounded-pill px-3" onClick={() => exportToExcel('products')} disabled={isExporting}>
                                        <i className="bi bi-file-earmark-spreadsheet me-2"></i>Exportar Ranking
                                    </Button>
                                </div>
                                <TopProductsChart dateRange={dateRange} />
                            </Tab.Pane>

                        </Tab.Content>
                    </Col>
                </Row>
            </Tab.Container>

            <style>{`
                .nav-link.active { background-color: #0d6efd !important; color: white !important; }
                .nav-link.active i { color: white !important; }
                .nav-link:hover:not(.active) { background-color: #f8f9fa; transform: translateX(5px); transition: 0.2s; }
            `}</style>
        </Container>
    );
};

export default ReportsPage;