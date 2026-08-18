import React, { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Card, Table, Form, Badge, Spinner, Button, Modal, Alert, Tabs, Tab } from 'react-bootstrap';
import { 
    FaSync, FaReceipt, FaPrint, FaCashRegister, FaFileInvoiceDollar, FaFilePdf, FaFileExcel
} from 'react-icons/fa';
import { Calculator } from 'lucide-react';
import api from '../../services/api';
import { toast } from 'react-toastify';
import io from 'socket.io-client';

const SOCKET_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const formatCurrency = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);

const formatDateHora = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString('pt-BR');
};

const getLocalDateString = (date) => {
    const d = new Date(date);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().split('T')[0];
};

// 🟢 Card Minimalista Idêntico ao do Dashboard
const MinimalCard = ({ title, value, onClick }) => (
    <div 
        className={`clean-card p-4 h-100 d-flex flex-column justify-content-center ${onClick ? 'shadow-hover' : ''}`}
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

const FinancialAuditPage = () => {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState({ history: [] });
    const [kpis, setKpis] = useState(null);
    const [errorMsg, setErrorMsg] = useState(''); 
    
    // 🟢 Controle de Abas
    const [activeTab, setActiveTab] = useState('payables'); 
    
    // 🟢 Estados dos Modais
    const [showModal, setShowModal] = useState(false);
    const [selectedTx, setSelectedTx] = useState(null);
    
    const [showSalesModal, setShowSalesModal] = useState(false);
    const [salesDetails, setSalesDetails] = useState([]);
    const [loadingSales, setLoadingSales] = useState(false);

    // 🟢 DRE States
    const [dreData, setDreData] = useState(null);
    const [loadingDre, setLoadingDre] = useState(false);

    const [showFilterModal, setShowFilterModal] = useState(false);
    const [activeFilter, setActiveFilter] = useState('30d');
    const [customDates, setCustomDates] = useState({ start: '', end: '' });

    const [filters, setFilters] = useState({
        startDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        gateway: 'ALL'
    });

    const handlePresetChange = (period) => {
        const end = new Date();
        const start = new Date();
        
        if (period === 'hoje') start.setDate(end.getDate());
        else if (period === 'mes') start.setDate(1); 
        else if (period === '30d') start.setDate(end.getDate() - 30);
        else if (period === '90d') start.setDate(end.getDate() - 90);
        else if (period === 'all') start.setFullYear(2020); 

        setFilters(prev => ({
            ...prev,
            startDate: start.toISOString().split('T')[0],
            endDate: end.toISOString().split('T')[0]
        }));
        setActiveFilter(period);
    };

    const applyCustomFilter = () => {
        if (customDates.start && customDates.end) {
            setFilters(prev => ({ ...prev, startDate: customDates.start, endDate: customDates.end }));
            setActiveFilter('custom');
            setShowFilterModal(false);
        }
    };

    const fetchKpis = useCallback(async () => {
        try {
            const params = { startDate: filters.startDate, endDate: `${filters.endDate}T23:59:59` };
            const kpiResponse = await api.get(`/dashboard/kpis`, { params });
            setKpis(kpiResponse.data);
        } catch (err) {
            console.error("Erro KPIs:", err);
        }
    }, [filters.startDate, filters.endDate]);

    const fetchDre = useCallback(async () => {
        setLoadingDre(true);
        try {
            const res = await api.get('/admin/financial/dre', { 
                params: { startDate: filters.startDate, endDate: `${filters.endDate}T23:59:59` } 
            });
            setDreData(res.data);
        } catch (err) {
            console.error("Erro DRE", err);
        } finally {
            setLoadingDre(false);
        }
    }, [filters.startDate, filters.endDate]);

    const fetchData = useCallback(async (isAutoUpdate = false) => {
        if (!isAutoUpdate) setLoading(true);
        setErrorMsg('');
        
        try {
            const queryParams = new URLSearchParams({
                ...filters,
                endDate: `${filters.endDate}T23:59:59`
            }).toString();

            const response = await api.get(`/admin/financial/transactions?${queryParams}`); 
            const history = Array.isArray(response.data.history) ? response.data.history : (Array.isArray(response.data) ? response.data : []);
            setData({ history });
            
            await fetchKpis();
            if (activeTab === 'dre') await fetchDre();

            if (isAutoUpdate) toast.info("💰 Dados atualizados!");
        } catch (error) {
            if (error.response?.status === 403) setErrorMsg('🔒 Acesso Negado: Permissão "FINANCEIRO_VIEW" necessária.');
            else setErrorMsg(`❌ Erro no Backend: Não foi possível carregar a auditoria.`);
            setData({ history: [] });
        } finally {
            if (!isAutoUpdate) setLoading(false);
        }
    }, [filters, activeTab, fetchKpis, fetchDre]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    useEffect(() => {
        const socket = io(SOCKET_URL);
        socket.on('novo_pedido', (data) => { if (data.status === 'PAGO' || data.status === 'approved') fetchData(true); });
        socket.on('venda_pdv_realizada', () => fetchData(true));
        socket.on('pagamento_confirmado', () => fetchData(true));
        return () => socket.disconnect();
    }, [fetchData]);

    const handleOpenSalesDetails = async () => {
        setShowSalesModal(true);
        setLoadingSales(true);
        try {
            const params = { startDate: filters.startDate, endDate: `${filters.endDate}T23:59:59` };
            const res = await api.get('/dashboard/sales-details', { params });
            setSalesDetails(res.data);
        } catch (err) {
            toast.error("Erro ao carregar o extrato.");
        } finally {
            setLoadingSales(false);
        }
    };

    const handleShowDetails = (tx) => {
        setSelectedTx(tx);
        setShowModal(true);
    };

    // 🟢 FUNÇÃO DE EXPORTAR PARA EXCEL (CSV)
    const handleExportExcel = () => {
        if (!data.history || data.history.length === 0) {
            return toast.warning("Não há dados para exportar neste período.");
        }

        let csvContent = "Data,Hora,Origem,Gateway ID,Pedido,Cliente,Bruto (R$),Taxa (R$),Liquido (R$)\n";
        
        data.history.forEach(tx => {
            const date = new Date(tx.data_criacao).toLocaleDateString('pt-BR');
            const time = new Date(tx.data_criacao).toLocaleTimeString('pt-BR');
            const cliente = tx.usuarios?.nome_completo ? `"${tx.usuarios.nome_completo}"` : "N/A";
            
            csvContent += `${date},${time},${tx.gateway_provider},${tx.gateway_id || '-'},#${tx.id_pedido},${cliente},${tx.valor_bruto},${tx.valor_taxa},${tx.valor_liquido}\n`;
        });

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `extrato_financeiro_${filters.startDate}_a_${filters.endDate}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // 🟢 FUNÇÃO DE EXPORTAR PARA PDF (A4)
    const handlePrintGeneralReport = () => {
        if (!data.history || data.history.length === 0) {
            return toast.warning("Não há dados para imprimir neste período.");
        }

        const windowUrl = 'about:blank';
        const printWindow = window.open(windowUrl, 'RelatorioGeral', 'left=50,top=50,width=1000,height=800');

        const htmlContent = `
            <html>
            <head>
                <title>Relatório de Auditoria - ${new Date().toLocaleDateString()}</title>
                <style>
                    body { font-family: Arial, sans-serif; font-size: 12px; color: #333; padding: 20px; }
                    .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #333; padding-bottom: 10px; }
                    .section { margin-bottom: 25px; }
                    .section-title { font-size: 14px; font-weight: bold; background-color: #f0f0f0; padding: 5px; border-left: 4px solid #333; margin-bottom: 10px; }
                    table { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
                    th, td { border: 1px solid #ddd; padding: 6px; text-align: left; }
                    th { background-color: #f9f9f9; font-weight: bold; }
                    .text-end { text-align: right; }
                    .text-danger { color: #dc3545; }
                    .text-success { color: #198754; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1 style="margin: 0; font-size: 20px;">RELATÓRIO DE AUDITORIA FINANCEIRA</h1>
                    <p style="margin: 5px 0;">Período: ${new Date(filters.startDate).toLocaleDateString()} até ${new Date(filters.endDate).toLocaleDateString()}</p>
                    <p style="margin: 0; font-size: 10px;">Gerado em: ${new Date().toLocaleString()}</p>
                </div>

                <div class="section">
                    <div class="section-title">DETALHAMENTO DE TRANSAÇÕES</div>
                    <table>
                        <thead>
                            <tr>
                                <th>Data/Hora</th>
                                <th>Origem</th>
                                <th>Pedido</th>
                                <th>Cliente</th>
                                <th class="text-end">Bruto</th>
                                <th class="text-end">Taxa</th>
                                <th class="text-end">Líquido</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${data.history.map(tx => `
                                <tr>
                                    <td>${new Date(tx.data_criacao).toLocaleString()}</td>
                                    <td>${tx.gateway_provider}</td>
                                    <td>#${tx.id_pedido}</td>
                                    <td>${tx.usuarios?.nome_completo || 'N/A'}</td>
                                    <td class="text-end">${formatCurrency(tx.valor_bruto)}</td>
                                    <td class="text-end text-danger">-${formatCurrency(tx.valor_taxa)}</td>
                                    <td class="text-end text-success font-weight-bold">${formatCurrency(tx.valor_liquido)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
                <script>
                    window.onload = function() { window.print(); window.close(); }
                </script>
            </body>
            </html>
        `;

        printWindow.document.write(htmlContent);
        printWindow.document.close();
    };

    const handlePrintReceipt = () => {
        if (!selectedTx) return;

        let itensHtml = '';
        if (selectedTx.pedidos?.pedido_items && selectedTx.pedidos.pedido_items.length > 0) {
            itensHtml = `
                <div class="divider"></div>
                <div style="text-align: left; font-size: 12px; font-weight: bold; margin-bottom: 5px;">ITENS DO PEDIDO:</div>
                ${selectedTx.pedidos.pedido_items.map(item => `
                    <div class="row-item">
                        <span>${item.quantidade}x ${item.nome.substring(0, 15)}...</span>
                        <span>${formatCurrency(item.preco * item.quantidade)}</span>
                    </div>
                `).join('')}
            `;
        }

        const windowUrl = 'about:blank';
        const uniqueName = new Date().getTime();
        const printWindow = window.open(windowUrl, uniqueName, 'left=50,top=50,width=800,height=600');

        printWindow.document.write(`
            <html>
                <head>
                    <title>Comprovante - ${selectedTx.id_transacao}</title>
                    <style>
                        body { font-family: 'Courier New', Courier, monospace; padding: 20px; text-align: center; background-color: #fff; color: #000; }
                        .receipt-container { max-width: 350px; margin: 0 auto; border: 1px dashed #000; padding: 20px; }
                        h2, h5 { margin: 5px 0; }
                        .divider { border-bottom: 1px dashed #000; margin: 15px 0; }
                        .row-item { display: flex; justify-content: space-between; margin-bottom: 5px; font-size: 12px; }
                        .total-row { display: flex; justify-content: space-between; margin-top: 10px; font-weight: bold; font-size: 14px; }
                        .tax-row { display: flex; justify-content: space-between; margin-bottom: 5px; font-size: 12px; color: #555; }
                        .footer { font-size: 10px; margin-top: 20px; color: #555; }
                    </style>
                </head>
                <body>
                    <div class="receipt-container">
                        <h5>RECIBO / COMPROVANTE</h5>
                        <p style="font-size: 12px;">Ararinha E-commerce</p>
                        <div class="divider"></div>
                        <div class="row-item"><span>DATA:</span><span>${new Date(selectedTx.data_criacao).toLocaleString()}</span></div>
                        <div class="row-item"><span>ID TRANS:</span><span>#${selectedTx.id_transacao}</span></div>
                        <div class="row-item"><span>GATEWAY:</span><span>${selectedTx.gateway_provider}</span></div>
                        ${itensHtml}
                        <div class="divider"></div>
                        <div class="row-item"><span>VALOR BRUTO:</span><span>${formatCurrency(selectedTx.valor_bruto)}</span></div>
                        <div class="row-item"><span>TAXAS:</span><span>- ${formatCurrency(selectedTx.valor_taxa)}</span></div>
                        <div class="divider"></div>
                        <div class="total-row"><span>LÍQUIDO (REAL):</span><span>${formatCurrency(selectedTx.valor_liquido)}</span></div>
                        <div class="footer">Documento gerado eletronicamente.<br/>Status: ${selectedTx.gateway_provider === 'PDV' ? 'VENDA PRESENCIAL' : 'PAGAMENTO ONLINE'}</div>
                    </div>
                    <script>window.onload = function() { window.print(); window.close(); }</script>
                </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.focus();
    };

    const faturamentoBruto = Number(kpis?.faturamentoTotal || 0);
    const totalPedidos = Number(kpis?.pedidosTotais || 0);
    const ticketMedio = totalPedidos > 0 ? (faturamentoBruto / totalPedidos) : 0;
    const liquidoReal = faturamentoBruto - Number(kpis?.taxasTotais || 0);
    const somaExtrato = salesDetails.reduce((acc, item) => acc + item.total, 0);

    return (
        <div style={{ backgroundColor: 'var(--bg-main, #f8fafc)', minHeight: '100vh', paddingBottom: '2rem', transition: 'background-color 0.2s ease' }}>
            <Container fluid="lg" className="pt-4">
                
                {/* --- CABEÇALHO E BOTÕES DE EXPORTAÇÃO --- */}
                <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-3">
                    <h4 className="fw-bold m-0 d-flex align-items-center" style={{ fontSize: '1.25rem', color: 'var(--text-primary)' }}>
                        <FaFileInvoiceDollar className="me-2 opacity-75" size={24} />
                        Gestão Financeira e DRE
                        <Badge bg="success" className="ms-3 small" style={{fontSize: '0.5em', verticalAlign: 'middle'}}>
                            <FaSync className="me-1 fa-spin" /> TEMPO REAL
                        </Badge>
                    </h4>

                    {/* 🟢 BOTÕES DE EXPORTAÇÃO */}
                    <div className="d-flex gap-2">
                        <Button 
                            variant="outline-success" 
                            size="sm" 
                            onClick={handleExportExcel} 
                            disabled={loading || data.history.length === 0} 
                            className="d-flex align-items-center fw-medium rounded-pill px-3 shadow-sm bg-white"
                        >
                            <FaFileExcel className="me-2" /> Exportar Excel
                        </Button>
                        <Button 
                            variant="dark" 
                            size="sm" 
                            onClick={handlePrintGeneralReport} 
                            disabled={loading || data.history.length === 0} 
                            className="d-flex align-items-center fw-medium rounded-pill px-3 shadow-sm"
                        >
                            <FaFilePdf className="me-2" /> Imprimir A4
                        </Button>
                    </div>
                </div>

                {/* --- BOTÕES DE FILTRO ESTILO PILL --- */}
                <div className="d-flex flex-wrap gap-2 mb-4 align-items-center">
                    <button className={`filter-btn ${activeFilter === 'hoje' ? 'active' : ''}`} onClick={() => handlePresetChange('hoje')}>Hoje</button>
                    <button className={`filter-btn ${activeFilter === 'mes' ? 'active' : ''}`} onClick={() => handlePresetChange('mes')}>Esse mês</button>
                    <button className={`filter-btn ${activeFilter === '30d' ? 'active' : ''}`} onClick={() => handlePresetChange('30d')}>Últimos 30 dias</button>
                    <button className={`filter-btn ${activeFilter === '90d' ? 'active' : ''}`} onClick={() => handlePresetChange('90d')}>Últimos 90 dias</button>
                    <button className={`filter-btn ${activeFilter === 'all' ? 'active' : ''}`} onClick={() => handlePresetChange('all')}>Todo o período</button>
                    <button className={`filter-btn ${activeFilter === 'custom' ? 'active' : ''}`} onClick={() => setShowFilterModal(true)}>Personalizado</button>
                    
                    <Form.Select 
                        size="sm" 
                        className="d-inline-block ms-auto shadow-none" 
                        style={{ width: 'auto', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-sidebar)', color: 'var(--text-secondary)' }}
                        value={filters.gateway} 
                        onChange={(e) => setFilters({...filters, gateway: e.target.value})}
                    >
                        <option value="ALL">Todos os Canais</option>
                        <option value="PDV">🏪 Caixa Físico (PDV)</option>
                        <option value="MERCADOPAGO">Mercado Pago</option>
                        <option value="STRIPE">Stripe</option>
                        <option value="ASAAS">Asaas</option>
                        <option value="ABACATEPAY">AbacatePay</option>
                    </Form.Select>
                </div>

                {errorMsg && <Alert variant="danger" className="text-center rounded-4 fw-bold shadow-sm mb-4">{errorMsg}</Alert>}

                {loading ? (
                    <div className="text-center py-5"><Spinner animation="border" variant="primary" /></div>
                ) : !errorMsg && (
                    <>
                        {/* --- CARDS DE KPI MINIMALISTAS --- */}
                        <Row className="g-4 mb-4">
                            <Col lg={4} md={4} xs={12}>
                                <MinimalCard title="Faturamento Bruto" value={formatCurrency(faturamentoBruto)} onClick={handleOpenSalesDetails} />
                            </Col>
                            <Col lg={4} md={4} xs={6}>
                                <MinimalCard title="Total de transações" value={totalPedidos} />
                            </Col>
                            <Col lg={4} md={4} xs={6}>
                                <MinimalCard title="Ticket Médio" value={formatCurrency(ticketMedio)} />
                            </Col>
                        </Row>

                        <Row className="g-4 mb-4">
                            <Col lg={4} md={4} xs={12}>
                                <MinimalCard title="Líquido (Em Caixa)" value={formatCurrency(liquidoReal)} />
                            </Col>
                            <Col lg={4} md={4} xs={6}>
                                <MinimalCard title="Taxas Pagas" value={formatCurrency(Number(kpis?.taxasTotais || 0))} />
                            </Col>
                        </Row>

                        {/* --- ABAS: TRANSAÇÕES / DRE --- */}
                        <Card className="clean-card mb-4">
                            <Card.Header className="bg-transparent pt-3 pb-0 border-bottom-0">
                                <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k)} className="border-bottom-0 custom-tabs">
                                    <Tab eventKey="payables" title={<span className={activeTab === 'payables' ? 'text-primary fw-bold' : 'text-muted'}><FaFileInvoiceDollar className="me-1"/> Auditoria de Vendas</span>} />
                                    <Tab eventKey="dre" title={<span className={activeTab === 'dre' ? 'text-primary fw-bold' : 'text-muted'}>📊 Relatório DRE</span>} />
                                </Tabs>
                            </Card.Header>

                            {activeTab === 'dre' ? (
                                loadingDre ? (
                                    <div className="text-center py-5"><Spinner animation="border" variant="primary" /></div>
                                ) : dreData ? (
                                    <div className="table-responsive p-3">
                                        <Table hover className="align-middle mb-0 border rounded-3 overflow-hidden">
                                            <thead className="bg-light">
                                                <tr>
                                                    <th className="ps-4 text-muted small text-uppercase">Categoria Financeira</th>
                                                    <th className="text-end text-success small text-uppercase">Receitas (+)</th>
                                                    <th className="text-end text-danger small text-uppercase">Despesas (-)</th>
                                                    <th className="text-end pe-4 text-muted small text-uppercase">Saldo Consolidado</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {dreData.detalhamento.length === 0 ? (
                                                    <tr><td colSpan="4" className="text-center py-5 text-muted">Nenhum movimento financeiro baixado/pago neste período.</td></tr>
                                                ) : (
                                                    dreData.detalhamento.map((item) => (
                                                        <tr key={item.id_categoria}>
                                                            <td className="ps-4 fw-medium text-dark">{item.categoria}</td>
                                                            <td className="text-end text-success">{formatCurrency(item.receitas)}</td>
                                                            <td className="text-end text-danger">{formatCurrency(item.despesas)}</td>
                                                            <td className={`text-end pe-4 fw-bold ${item.saldo >= 0 ? 'text-primary' : 'text-warning'}`}>
                                                                {formatCurrency(item.saldo)}
                                                            </td>
                                                        </tr>
                                                    ))
                                                )}
                                                
                                                <tr className="bg-light border-top border-2">
                                                    <td className="ps-4 fw-bold text-uppercase h6 pt-4 pb-4 mb-0 text-dark">Resultado Líquido do Período</td>
                                                    <td className="text-end fw-bold text-success pt-4 pb-4">{formatCurrency(dreData.resumo.receitaBruta)}</td>
                                                    <td className="text-end fw-bold text-danger pt-4 pb-4">{formatCurrency(dreData.resumo.totalDespesas)}</td>
                                                    <td className={`text-end pe-4 fw-bold h5 pt-4 pb-4 mb-0 ${dreData.resumo.lucroLiquido >= 0 ? 'text-success' : 'text-danger'}`}>
                                                        {formatCurrency(dreData.resumo.lucroLiquido)}
                                                        <div className="small fw-normal text-muted mt-1" style={{fontSize: '12px'}}>
                                                            Margem de Lucro: {dreData.resumo.margemLucro}
                                                        </div>
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </Table>
                                    </div>
                                ) : null
                            ) : (
                                <div className="table-responsive p-3">
                                    <Table hover className="align-middle mb-0">
                                        <thead className="bg-light border-bottom">
                                            <tr>
                                                <th className="text-muted small text-uppercase ps-3">Data</th>
                                                <th className="text-muted small text-uppercase">Origem</th>
                                                <th className="text-muted small text-uppercase">Cliente</th>
                                                <th className="text-muted small text-uppercase">Itens do Pedido</th>
                                                <th className="text-end text-muted small text-uppercase">Líquido</th>
                                                <th className="text-center text-muted small text-uppercase pe-3">Ações</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {data.history.length > 0 ? (
                                                data.history.map((tx) => (
                                                    <tr key={tx.id_transacao}>
                                                        <td className="small text-muted ps-3">
                                                            <span className="fw-bold text-dark">{new Date(tx.data_criacao).toLocaleDateString()}</span><br/>
                                                            {new Date(tx.data_criacao).toLocaleTimeString()}<br/>
                                                            <small>ID: #{tx.id_pedido}</small>
                                                        </td>
                                                        <td>
                                                            {tx.gateway_provider === 'PDV' ? (
                                                                <Badge bg="warning" text="dark" className="border shadow-sm"><FaCashRegister className="me-1"/> PDV</Badge>
                                                            ) : (
                                                                <Badge bg="light" text="dark" className="border shadow-sm">{tx.gateway_provider}</Badge>
                                                            )}
                                                        </td>
                                                        <td>
                                                            <span className="fw-medium text-dark small">{tx.usuarios?.nome_completo || 'Não informado'}</span>
                                                        </td>
                                                        <td>
                                                            {tx.pedidos?.pedido_items && tx.pedidos.pedido_items.length > 0 ? (
                                                                <ul className="list-unstyled mb-0 small">
                                                                    {tx.pedidos.pedido_items.map((item, idx) => (
                                                                        <li key={idx} className="text-muted">
                                                                            <span className="fw-bold text-dark">{item.quantidade}x</span> {item.nome}
                                                                        </li>
                                                                    ))}
                                                                </ul>
                                                            ) : (
                                                                <span className="text-muted small fst-italic">Sem itens</span>
                                                            )}
                                                        </td>
                                                        <td className="text-end">
                                                            <div className="fw-bold text-success">{formatCurrency(tx.valor_liquido)}</div>
                                                            <div className="small text-muted text-decoration-line-through">Bruto: {formatCurrency(tx.valor_bruto)}</div>
                                                        </td>
                                                        <td className="text-center pe-3">
                                                            <Button variant="light" size="sm" className="rounded-circle border" onClick={() => handleShowDetails(tx)} title="Ver Detalhes/Imprimir">
                                                                <FaPrint className="text-secondary" />
                                                            </Button>
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr><td colSpan="6" className="text-center py-5 text-muted">Nenhuma transação atende a estes filtros.</td></tr>
                                            )}
                                        </tbody>
                                    </Table>
                                </div>
                            )}
                        </Card>
                    </>
                )}

                {/* MODAL DE SELEÇÃO DE DATA */}
                <Modal show={showFilterModal} onHide={() => setShowFilterModal(false)} centered size="sm" contentClassName="modal-dark-fix border-0 rounded-4 shadow">
                    <Modal.Header closeButton className="border-0 pb-0">
                        <Modal.Title className="fs-6 fw-bold text-dark">Período Customizado</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <Form>
                            <Form.Group className="mb-3">
                                <Form.Label className="small text-muted fw-bold">Início</Form.Label>
                                <Form.Control type="date" value={customDates.start} onChange={(e) => setCustomDates({...customDates, start: e.target.value})} className="shadow-none form-dark-fix bg-light" />
                            </Form.Group>
                            <Form.Group>
                                <Form.Label className="small text-muted fw-bold">Fim</Form.Label>
                                <Form.Control type="date" value={customDates.end} onChange={(e) => setCustomDates({...customDates, end: e.target.value})} className="shadow-none form-dark-fix bg-light" />
                            </Form.Group>
                        </Form>
                    </Modal.Body>
                    <Modal.Footer className="border-0 pt-0">
                        <Button variant="light" onClick={() => setShowFilterModal(false)} className="rounded-pill btn-sm text-secondary border fw-medium">Cancelar</Button>
                        <Button variant="primary" onClick={applyCustomFilter} className="rounded-pill px-4 btn-sm fw-medium">Aplicar</Button>
                    </Modal.Footer>
                </Modal>

                {/* MODAL DE CONFERÊNCIA DE VENDAS */}
                <Modal show={showSalesModal} onHide={() => setShowSalesModal(false)} size="lg" centered contentClassName="border-0 rounded-4 shadow">
                    <Modal.Header closeButton className="bg-light border-bottom rounded-top-4">
                        <Modal.Title className="h6 fw-bold d-flex align-items-center text-dark">
                            <Calculator className="me-2 text-primary" size={20} /> Conferência de Faturamento
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
                    <Modal.Footer className="bg-light d-flex justify-content-between rounded-bottom-4">
                        <div className="text-muted small">
                            Total de {salesDetails.length} itens vendidos
                        </div>
                        <div>
                            <span className="text-muted text-uppercase small fw-bold me-2">Soma Exata:</span>
                            <span className="fs-5 fw-bold text-primary">{formatCurrency(somaExtrato)}</span>
                        </div>
                    </Modal.Footer>
                </Modal>

                {/* MODAL DO RECIBO (COMPROVANTE) */}
                <Modal show={showModal} onHide={() => setShowModal(false)} centered size="md" contentClassName="border-0 rounded-4 shadow">
                    <Modal.Header closeButton className="bg-light rounded-top-4 border-bottom-0">
                        <Modal.Title className="h6 fw-bold text-dark"><FaReceipt className="me-2 text-primary" /> Visualizar Recibo</Modal.Title>
                    </Modal.Header>
                    <Modal.Body className="text-center py-5">
                        <h5 className="text-dark fw-bold">Deseja imprimir o comprovante desta venda?</h5>
                        <p className="text-muted mb-4">Pedido #{selectedTx?.id_pedido} no valor de {formatCurrency(selectedTx?.valor_liquido)}</p>
                        <Button variant="dark" size="lg" className="w-100 rounded-pill shadow-sm" onClick={handlePrintReceipt}>
                            <FaPrint className="me-2" /> Imprimir Comprovante
                        </Button>
                    </Modal.Body>
                </Modal>

                {/* --- ESTILOS GLOBAIS --- */}
                <style>{`
                    .clean-card {
                        background: var(--bg-sidebar, #ffffff);
                        border: 1px solid var(--border-color, #e2e8f0);
                        border-radius: 12px;
                        box-shadow: none;
                        overflow: hidden;
                    }
                    .kpi-title {
                        color: var(--text-secondary, #64748b);
                        font-size: 13px;
                        font-weight: 500;
                        margin-bottom: 6px;
                    }
                    .kpi-value {
                        color: var(--text-primary, #0f172a);
                        font-size: 28px;
                        font-weight: 700;
                        line-height: 1;
                    }
                    .shadow-hover:hover {
                        box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.08) !important;
                        transform: translateY(-2px);
                    }
                    .filter-btn {
                        background: var(--bg-sidebar, #ffffff);
                        border: 1px solid var(--border-color, #e2e8f0);
                        color: var(--text-secondary, #475569);
                        font-size: 13px;
                        font-weight: 500;
                        border-radius: 8px;
                        padding: 6px 14px;
                        transition: all 0.2s;
                    }
                    .filter-btn:hover {
                        background: var(--bg-hover, #f1f5f9);
                    }
                    .filter-btn.active {
                        background: var(--bg-active, #86efac) !important;
                        border-color: var(--bg-active, #86efac) !important;
                        color: var(--text-active, #14532d) !important;
                        font-weight: 600;
                    }
                    .custom-tabs .nav-link {
                        color: var(--text-secondary);
                        border: none;
                        border-bottom: 2px solid transparent;
                        font-weight: 500;
                        padding: 10px 20px;
                    }
                    .custom-tabs .nav-link.active {
                        background-color: transparent;
                        border-bottom: 2px solid var(--text-primary);
                        color: var(--text-primary);
                    }
                `}</style>
            </Container>
        </div>
    );
};

export default FinancialAuditPage;