import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Table, Tab, Nav, Spinner, Badge, Alert } from 'react-bootstrap';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Calendar, DollarSign, ShoppingCart, TrendingUp, AlertTriangle, FileText, Filter } from 'lucide-react';
import api from '../../../services/api'; // Ajuste o caminho da sua api

const COLORS = ['#0d6efd', '#198754', '#ffc107', '#dc3545'];

const ReportsDashboard = () => {
    const [activeTab, setActiveTab] = useState('custos');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // --- ESTADOS RELATÓRIO DE CUSTOS ---
    const [costData, setCostData] = useState(null);
    const [filters, setFilters] = useState({
        data_inicio: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0], // 1º dia do mês
        data_fim: new Date().toISOString().split('T')[0] // Hoje
    });

    // --- ESTADOS PREVISÃO DE COMPRA ---
    const [forecastData, setForecastData] = useState(null);

    // --- CARREGAMENTO ---
    useEffect(() => {
        if (activeTab === 'custos') fetchCosts();
        if (activeTab === 'previsao') fetchForecast();
    }, [activeTab]);

    const fetchCosts = async () => {
        setLoading(true); setError('');
        try {
            const { data } = await api.get(`/reports/custos`, { params: filters });
            setCostData(data);
        } catch (err) {
            setError('Erro ao carregar relatório financeiro.');
            console.error(err);
        } finally { setLoading(false); }
    };

    const fetchForecast = async () => {
        setLoading(true); setError('');
        try {
            const { data } = await api.get(`/reports/previsao-estoque`);
            setForecastData(data);
        } catch (err) {
            setError('Erro ao gerar previsão de compras.');
            console.error(err);
        } finally { setLoading(false); }
    };

    // --- HELPERS ---
    const formatMoney = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

    // Prepara dados para o gráfico de Pizza (Custos)
    const getChartData = () => {
        if (!costData?.resumo) return [];
        return [
            { name: 'Insumos (Produção)', value: costData.resumo.custo_insumos_fabricacao },
            { name: 'Produtos (Revenda)', value: costData.resumo.custo_produtos_revenda }
        ].filter(i => i.value > 0);
    };

    return (
        <Container fluid className="p-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h2 className="fw-bold text-dark mb-1">Relatórios Gerenciais</h2>
                    <p className="text-muted mb-0">Análise de custos e inteligência de estoque.</p>
                </div>
            </div>

            {error && <Alert variant="danger">{error}</Alert>}

            <Card className="shadow-sm border-0 rounded-4 overflow-hidden">
                <Card.Header className="bg-white border-bottom pt-3 px-4">
                    <Nav variant="tabs" activeKey={activeTab} onSelect={(k) => setActiveTab(k)} className="border-0">
                        <Nav.Item>
                            <Nav.Link eventKey="custos" className={`fw-medium px-4 ${activeTab === 'custos' ? 'text-primary border-bottom border-primary border-3' : 'text-muted'}`}>
                                <DollarSign size={18} className="me-2"/> Financeiro & Custos
                            </Nav.Link>
                        </Nav.Item>
                        <Nav.Item>
                            <Nav.Link eventKey="previsao" className={`fw-medium px-4 ${activeTab === 'previsao' ? 'text-primary border-bottom border-primary border-3' : 'text-muted'}`}>
                                <TrendingUp size={18} className="me-2"/> Previsão de Compra
                            </Nav.Link>
                        </Nav.Item>
                    </Nav>
                </Card.Header>

                <Card.Body className="p-4 bg-light">
                    {/* ================= ABA: CUSTOS ================= */}
                    {activeTab === 'custos' && (
                        <div className="animate__animated animate__fadeIn">
                            {/* Filtros */}
                            <div className="bg-white p-3 rounded-3 shadow-sm mb-4 d-flex flex-wrap gap-3 align-items-end">
                                <div className="flex-grow-1">
                                    <label className="small text-muted fw-bold mb-1">Data Início</label>
                                    <Form.Control type="date" value={filters.data_inicio} onChange={e => setFilters({...filters, data_inicio: e.target.value})} />
                                </div>
                                <div className="flex-grow-1">
                                    <label className="small text-muted fw-bold mb-1">Data Fim</label>
                                    <Form.Control type="date" value={filters.data_fim} onChange={e => setFilters({...filters, data_fim: e.target.value})} />
                                </div>
                                <Button variant="primary" onClick={fetchCosts} disabled={loading} className="px-4">
                                    {loading ? <Spinner size="sm"/> : <><Filter size={18} className="me-2"/> Filtrar</>}
                                </Button>
                            </div>

                            {costData && (
                                <>
                                    {/* Cards de Resumo */}
                                    <Row className="g-3 mb-4">
                                        <Col md={4}>
                                            <Card className="border-0 shadow-sm border-start border-4 border-primary h-100">
                                                <Card.Body>
                                                    <small className="text-muted text-uppercase fw-bold">Custo Total</small>
                                                    <h3 className="fw-bold text-dark mt-1">{formatMoney(costData.resumo.custo_total_periodo)}</h3>
                                                    <small className="text-muted">Gasto total no período</small>
                                                </Card.Body>
                                            </Card>
                                        </Col>
                                        <Col md={4}>
                                            <Card className="border-0 shadow-sm border-start border-4 border-warning h-100">
                                                <Card.Body>
                                                    <small className="text-muted text-uppercase fw-bold">Produção (Insumos)</small>
                                                    <h3 className="fw-bold text-dark mt-1">{formatMoney(costData.resumo.custo_insumos_fabricacao)}</h3>
                                                    <small className="text-warning">Consumido em receitas</small>
                                                </Card.Body>
                                            </Card>
                                        </Col>
                                        <Col md={4}>
                                            <Card className="border-0 shadow-sm border-start border-4 border-success h-100">
                                                <Card.Body>
                                                    <small className="text-muted text-uppercase fw-bold">Revenda</small>
                                                    <h3 className="fw-bold text-dark mt-1">{formatMoney(costData.resumo.custo_produtos_revenda)}</h3>
                                                    <small className="text-success">CMV de produtos finais</small>
                                                </Card.Body>
                                            </Card>
                                        </Col>
                                    </Row>

                                    <Row>
                                        <Col lg={5} className="mb-4">
                                            <Card className="border-0 shadow-sm h-100">
                                                <Card.Body>
                                                    <h6 className="fw-bold mb-4">Distribuição de Custos</h6>
                                                    <div style={{ width: '100%', height: 300 }}>
                                                        <ResponsiveContainer>
                                                            <PieChart>
                                                                <Pie data={getChartData()} cx="50%" cy="50%" innerRadius={60} outerRadius={80} fill="#8884d8" paddingAngle={5} dataKey="value">
                                                                    {getChartData().map((entry, index) => (
                                                                        <Cell key={`cell-${index}`} fill={index === 0 ? '#ffc107' : '#198754'} />
                                                                    ))}
                                                                </Pie>
                                                                <Tooltip formatter={(value) => formatMoney(value)} />
                                                                <Legend verticalAlign="bottom" height={36}/>
                                                            </PieChart>
                                                        </ResponsiveContainer>
                                                    </div>
                                                </Card.Body>
                                            </Card>
                                        </Col>
                                        <Col lg={7} className="mb-4">
                                            <Card className="border-0 shadow-sm h-100">
                                                <Card.Body>
                                                    <h6 className="fw-bold mb-3">Detalhamento de Saídas</h6>
                                                    <div className="table-responsive" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                                                        <Table hover size="sm" className="align-middle">
                                                            <thead className="bg-light sticky-top">
                                                                <tr>
                                                                    <th>Produto/Insumo</th>
                                                                    <th className="text-center">Qtd</th>
                                                                    <th className="text-end">Custo Unit.</th>
                                                                    <th className="text-end">Total</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {costData.detalhes.map((item, idx) => (
                                                                    <tr key={idx}>
                                                                        <td>
                                                                            <div className="fw-medium">{item.produto}</div>
                                                                            <small className="text-muted" style={{fontSize:'0.7rem'}}>{item.tipo} | {new Date(item.data).toLocaleDateString()}</small>
                                                                        </td>
                                                                        <td className="text-center">{Number(item.quantidade).toFixed(3)} {item.unidade}</td>
                                                                        <td className="text-end text-muted">{formatMoney(item.custo_unitario)}</td>
                                                                        <td className="text-end fw-bold">{formatMoney(item.custo_total)}</td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </Table>
                                                    </div>
                                                </Card.Body>
                                            </Card>
                                        </Col>
                                    </Row>
                                </>
                            )}
                        </div>
                    )}

                    {/* ================= ABA: PREVISÃO ================= */}
                    {activeTab === 'previsao' && (
                        <div className="animate__animated animate__fadeIn">
                            {loading && <div className="text-center py-5"><Spinner animation="border" variant="primary"/></div>}
                            
                            {!loading && forecastData && (
                                <>
                                    <Alert variant="info" className="d-flex align-items-center shadow-sm border-0 mb-4">
                                        <AlertTriangle size={24} className="me-3" />
                                        <div>
                                            <strong>Análise Inteligente de Estoque ({forecastData.analise_dias} dias)</strong>
                                            <br/>
                                            O sistema analisou o consumo médio e sugere a compra dos itens abaixo para manter o estoque saudável por mais um mês.
                                        </div>
                                    </Alert>

                                    <Row className="mb-4">
                                        <Col md={12}>
                                            <Card className="border-0 shadow-sm bg-primary text-white">
                                                <Card.Body className="d-flex justify-content-between align-items-center">
                                                    <div>
                                                        <h5 className="mb-0 fw-normal opacity-75">Investimento Estimado para Reposição</h5>
                                                        <h1 className="fw-bold mt-1">{formatMoney(forecastData.custo_total_previsao)}</h1>
                                                    </div>
                                                    <ShoppingCart size={48} className="opacity-50" />
                                                </Card.Body>
                                            </Card>
                                        </Col>
                                    </Row>

                                    <Card className="border-0 shadow-sm">
                                        <Card.Body className="p-0">
                                            <Table responsive hover className="mb-0 align-middle">
                                                <thead className="bg-light text-secondary">
                                                    <tr>
                                                        <th className="ps-4 py-3">Produto / Insumo</th>
                                                        <th className="text-center">Estoque Atual</th>
                                                        <th className="text-center">Consumo (30d)</th>
                                                        <th className="text-center text-primary fw-bold">Sugestão Compra</th>
                                                        <th className="text-end pe-4">Custo Estimado</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {forecastData.itens.length === 0 ? (
                                                        <tr>
                                                            <td colSpan="5" className="text-center py-5 text-muted">Estoque saudável! Nenhuma compra necessária.</td>
                                                        </tr>
                                                    ) : (
                                                        forecastData.itens.map((item) => (
                                                            <tr key={item.id} className={item.status === 'COMPRAR' ? 'bg-danger bg-opacity-10' : ''}>
                                                                <td className="ps-4">
                                                                    <div className="fw-bold text-dark">{item.nome}</div>
                                                                    <Badge bg="secondary" className="fw-normal" style={{fontSize: '0.65rem'}}>{item.tipo}</Badge>
                                                                </td>
                                                                <td className="text-center text-muted">
                                                                    {Number(item.estoque_atual).toFixed(2)} {item.unidade}
                                                                </td>
                                                                <td className="text-center text-muted">
                                                                    {Number(item.consumo_ultimo_mes).toFixed(2)} {item.unidade}
                                                                </td>
                                                                <td className="text-center">
                                                                    <h5 className="mb-0">
                                                                        <Badge bg="danger" className="shadow-sm">
                                                                            +{item.sugestao_compra} {item.unidade}
                                                                        </Badge>
                                                                    </h5>
                                                                </td>
                                                                <td className="text-end pe-4 fw-bold text-dark">
                                                                    {formatMoney(item.custo_estimado_reposicao)}
                                                                </td>
                                                            </tr>
                                                        ))
                                                    )}
                                                </tbody>
                                            </Table>
                                        </Card.Body>
                                    </Card>
                                </>
                            )}
                        </div>
                    )}
                </Card.Body>
            </Card>
        </Container>
    );
};

export default ReportsDashboard;