import React, { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Card, Table, Form, Badge, Spinner, Button, Modal, ListGroup } from 'react-bootstrap';
import { 
    FaMoneyBillWave, FaHandHoldingUsd, FaPiggyBank, FaFilter, FaFileInvoiceDollar, 
    FaSync, FaEye, FaReceipt, FaExchangeAlt, FaPrint, 
    FaArrowLeft, FaCashRegister, FaBoxOpen, FaClipboardList, 
    FaWallet, FaQrcode, FaCreditCard, FaFilePdf
} from 'react-icons/fa';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import api from '../../services/api';
import { toast } from 'react-toastify';
import io from 'socket.io-client';

const SOCKET_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const FinancialAuditPage = () => {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState({ summary: {}, history: [] });
    
    // Estados do Modal
    const [showModal, setShowModal] = useState(false);
    const [selectedTx, setSelectedTx] = useState(null);
    const [isReceiptMode, setIsReceiptMode] = useState(false);

    const [filters, setFilters] = useState({
        startDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0], 
        endDate: new Date().toISOString().split('T')[0],
        gateway: 'ALL'
    });

    const fetchData = useCallback(async (isAutoUpdate = false) => {
        if (!isAutoUpdate) setLoading(true);
        try {
            const params = new URLSearchParams(filters).toString();
            // endpoint correto que retorna histórico financeiro completo
            const response = await api.get(`/admin/financial/transactions?${params}`); 
            
            // Tratamento caso o backend retorne array direto ou objeto { history, summary }
            const history = Array.isArray(response.data) ? response.data : (response.data.history || []);
            
            // Recalcula sumário no front se o back não mandar
            const summary = response.data.summary || {
                bruto: history.reduce((acc, tx) => acc + Number(tx.valor_bruto || 0), 0),
                taxas: history.reduce((acc, tx) => acc + Number(tx.valor_taxa || 0), 0),
                liquido: history.reduce((acc, tx) => acc + Number(tx.valor_liquido || 0), 0)
            };

            setData({ history, summary });

            if (isAutoUpdate) toast.info("💰 Dados financeiros atualizados em tempo real!");
        } catch (error) {
            console.error(error);
            toast.error("Erro ao carregar auditoria.");
        } finally {
            if (!isAutoUpdate) setLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    useEffect(() => {
        const socket = io(SOCKET_URL);
        socket.on('novo_pedido', (data) => {
            if (data.status === 'PAGO') fetchData(true);
        });
        socket.on('venda_pdv_realizada', () => fetchData(true));
        socket.on('pagamento_confirmado', () => fetchData(true));
        return () => socket.disconnect();
    }, [fetchData]);

    const formatBRL = (value) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
    };

    const handleFilterChange = (e) => {
        setFilters({ ...filters, [e.target.name]: e.target.value });
    };

    const handleShowDetails = (tx) => {
        setSelectedTx(tx);
        setIsReceiptMode(false);
        setShowModal(true);
    };

    // Função para extrair JSON da observação (Log do Fechamento ou Webhook)
    const getClosingDetails = (obs) => {
        if (!obs) return null;
        try {
            // Tenta achar JSON de fechamento de caixa
            const match = obs.match(/Detalhes: ({.*?})/);
            if (match && match[1]) {
                return JSON.parse(match[1]);
            }
        } catch (e) {
            return null;
        }
        return null;
    };

    // --- IMPRESSÃO DO RECIBO ---
    const handlePrintReceipt = () => {
        const printContent = document.getElementById('printable-receipt');
        if (!printContent) return;

        const windowUrl = 'about:blank';
        const uniqueName = new Date().getTime();
        const windowName = 'Print' + uniqueName;
        const printWindow = window.open(windowUrl, windowName, 'left=50,top=50,width=800,height=600');

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
                        <div class="row-item"><span>ID GATEWAY:</span><span>${selectedTx.gateway_id ? selectedTx.gateway_id.substring(0, 15) : '-'}...</span></div>
                        
                        <div class="divider"></div>
                        
                        <div class="row-item"><span>VALOR BRUTO:</span><span>${formatBRL(selectedTx.valor_bruto)}</span></div>
                        <div class="row-item"><span>TAXAS:</span><span>- ${formatBRL(selectedTx.valor_taxa)}</span></div>
                        
                        <div class="divider"></div>
                        
                        <div class="total-row"><span>LÍQUIDO (REAL):</span><span>${formatBRL(selectedTx.valor_liquido)}</span></div>
                        
                        <div class="footer">
                            Documento gerado eletronicamente.<br/>
                            Status: ${selectedTx.gateway_provider === 'PDV' ? 'VENDA PRESENCIAL' : 'PAGAMENTO ONLINE'}
                        </div>
                    </div>
                    <script>
                        window.onload = function() { window.print(); window.close(); }
                    </script>
                </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.focus();
    };

    // Função de Impressão do Relatório Geral (A4)
    const handlePrintGeneralReport = () => {
        const totaisMetodo = { DINHEIRO: 0, PIX: 0, CARTAO: 0, OUTROS: 0 };
        data.history.forEach(tx => {
            const provider = tx.gateway_provider || 'OUTROS';
            if (provider === 'PDV') {
                // Tenta inferir método do PDV se disponível, senão joga em dinheiro
                totaisMetodo.DINHEIRO += Number(tx.valor_liquido); 
            } else {
                if (provider === 'MERCADOPAGO' || provider === 'STRIPE' || provider === 'CIELO') totaisMetodo.CARTAO += Number(tx.valor_liquido);
                else if (provider === 'ASAAS' || provider === 'ABACATEPAY') totaisMetodo.PIX += Number(tx.valor_liquido);
                else totaisMetodo.OUTROS += Number(tx.valor_liquido);
            }
        });

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
                    .text-center { text-align: center; }
                    .total-box { display: flex; justify-content: space-between; margin-bottom: 20px; }
                    .card { border: 1px solid #ddd; padding: 10px; width: 30%; text-align: center; border-radius: 4px; }
                    .card h3 { margin: 5px 0; font-size: 18px; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1 style="margin: 0; font-size: 20px;">RELATÓRIO DE AUDITORIA FINANCEIRA</h1>
                    <p style="margin: 5px 0;">Período: ${new Date(filters.startDate).toLocaleDateString()} até ${new Date(filters.endDate).toLocaleDateString()}</p>
                    <p style="margin: 0; font-size: 10px;">Gerado em: ${new Date().toLocaleString()}</p>
                </div>

                <div class="section">
                    <div class="section-title">RESUMO CONSOLIDADO</div>
                    <div class="total-box">
                        <div class="card"><span>Faturamento Bruto</span><h3>${formatBRL(data.summary.bruto)}</h3></div>
                        <div class="card"><span>Taxas Totais</span><h3 style="color: #dc3545;">- ${formatBRL(data.summary.taxas)}</h3></div>
                        <div class="card" style="border-color: #198754; background-color: #f0fff4;"><span>Líquido em Caixa</span><h3 style="color: #198754;">${formatBRL(data.summary.liquido)}</h3></div>
                    </div>
                </div>

                <div class="section">
                    <div class="section-title">DETALHAMENTO DE TRANSAÇÕES</div>
                    <table>
                        <thead>
                            <tr>
                                <th>Data/Hora</th>
                                <th>ID</th>
                                <th>Origem</th>
                                <th class="text-end">Bruto</th>
                                <th class="text-end">Taxa</th>
                                <th class="text-end">Líquido</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${data.history.map(tx => `
                                <tr>
                                    <td>${new Date(tx.data_criacao).toLocaleString()}</td>
                                    <td>${tx.gateway_id || tx.id_transacao}</td>
                                    <td>${tx.gateway_provider}</td>
                                    <td class="text-end">${formatBRL(tx.valor_bruto)}</td>
                                    <td class="text-end text-danger">${formatBRL(tx.valor_taxa)}</td>
                                    <td class="text-end fw-bold">${formatBRL(tx.valor_liquido)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </body>
            </html>
        `;

        printWindow.document.write(htmlContent);
        printWindow.document.close();
    };

    return (
        <Container fluid className="py-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h3 className="fw-bold text-dark mb-0 d-flex align-items-center">
                        <FaFileInvoiceDollar className="me-2"/> Auditoria Financeira
                        <Badge bg="success" className="ms-3 small" style={{fontSize: '0.6em', verticalAlign: 'middle'}}>
                            <FaSync className="me-1 fa-spin" /> TEMPO REAL
                        </Badge>
                    </h3>
                    <p className="text-muted small mb-0">Rastreamento unificado (E-commerce e PDV).</p>
                </div>
                <div className="d-flex gap-2">
                    <Button variant="dark" size="sm" onClick={handlePrintGeneralReport} disabled={loading}>
                        <FaFilePdf className="me-2" /> Relatório Completo (A4)
                    </Button>
                    <Button variant="primary" size="sm" onClick={() => fetchData(false)} disabled={loading}>
                        <FaFilter className="me-2" /> Atualizar
                    </Button>
                </div>
            </div>

            {/* --- FILTROS --- */}
            <Card className="border-0 shadow-sm mb-4">
                <Card.Body className="py-3">
                    <Row className="g-3 align-items-end">
                        <Col md={3}>
                            <Form.Label className="small fw-bold">Data Início</Form.Label>
                            <Form.Control type="date" name="startDate" value={filters.startDate} onChange={handleFilterChange} />
                        </Col>
                        <Col md={3}>
                            <Form.Label className="small fw-bold">Data Fim</Form.Label>
                            <Form.Control type="date" name="endDate" value={filters.endDate} onChange={handleFilterChange} />
                        </Col>
                        <Col md={3}>
                            <Form.Label className="small fw-bold">Origem / Gateway</Form.Label>
                            <Form.Select name="gateway" value={filters.gateway} onChange={handleFilterChange}>
                                <option value="ALL">Todos os Canais</option>
                                <option value="PDV">🏪 Caixa Físico (PDV)</option>
                                <option value="MERCADOPAGO">Mercado Pago</option>
                                <option value="STRIPE">Stripe</option>
                                <option value="ASAAS">Asaas</option>
                                <option value="ABACATEPAY">AbacatePay</option>
                            </Form.Select>
                        </Col>
                        <Col md={3}>
                            <div className="text-end text-muted small mt-2">Dados do E-commerce e Loja Física</div>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

            {loading ? (
                <div className="text-center py-5"><Spinner animation="border" variant="primary" /></div>
            ) : (
                <>
                    {/* --- CARDS DE KPI --- */}
                    <Row className="g-4 mb-4">
                        <Col md={4}><Card className="border-0 shadow-sm h-100 border-start border-4 border-primary"><Card.Body><div className="d-flex justify-content-between align-items-center"><div><p className="text-muted text-uppercase small fw-bold mb-1">Faturamento Bruto</p><h3 className="fw-bold text-dark mb-0">{formatBRL(data.summary.bruto)}</h3><small className="text-muted">Online + Balcão</small></div><div className="p-3 bg-primary bg-opacity-10 rounded-circle text-primary"><FaMoneyBillWave size={24} /></div></div></Card.Body></Card></Col>
                        <Col md={4}><Card className="border-0 shadow-sm h-100 border-start border-4 border-danger"><Card.Body><div className="d-flex justify-content-between align-items-center"><div><p className="text-muted text-uppercase small fw-bold mb-1">Taxas (Gateway/Maquininha)</p><h3 className="fw-bold text-danger mb-0">{formatBRL(data.summary.taxas)}</h3><small className="text-danger">Custos operacionais</small></div><div className="p-3 bg-danger bg-opacity-10 rounded-circle text-danger"><FaHandHoldingUsd size={24} /></div></div></Card.Body></Card></Col>
                        <Col md={4}><Card className="border-0 shadow-sm h-100 border-start border-4 border-success"><Card.Body><div className="d-flex justify-content-between align-items-center"><div><p className="text-muted text-uppercase small fw-bold mb-1">Lucro Líquido Real</p><h3 className="fw-bold text-success mb-0">{formatBRL(data.summary.liquido)}</h3><small className="text-success">Disponível em caixa</small></div><div className="p-3 bg-success bg-opacity-10 rounded-circle text-success"><FaPiggyBank size={24} /></div></div></Card.Body></Card></Col>
                    </Row>

                    {/* --- GRÁFICO --- */}
                    <Row className="mb-4">
                        <Col xs={12}>
                            <Card className="border-0 shadow-sm">
                                <Card.Body>
                                    <h6 className="fw-bold mb-4">Fluxo de Caixa Unificado</h6>
                                    <div style={{ width: '100%', height: 300 }}>
                                        <ResponsiveContainer>
                                            <BarChart data={data.history.slice(0, 20).reverse()}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                                <XAxis dataKey="data_criacao" tickFormatter={(t) => new Date(t).toLocaleDateString()} hide />
                                                <YAxis />
                                                <Tooltip formatter={(value) => formatBRL(value)} labelFormatter={(label) => new Date(label).toLocaleString()} />
                                                <Legend />
                                                <Bar dataKey="valor_liquido" name="Líquido" stackId="a" fill="#198754" />
                                                <Bar dataKey="valor_taxa" name="Taxas" stackId="a" fill="#dc3545" />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>

                    {/* --- TABELA DETALHADA --- */}
                    <Card className="border-0 shadow-sm">
                        <Card.Header className="bg-white py-3"><h6 className="fw-bold mb-0">Livro Razão (Últimas Transações)</h6></Card.Header>
                        <Table responsive hover className="align-middle mb-0">
                            <thead className="bg-light">
                                <tr>
                                    <th className="text-muted small text-uppercase ps-3">Data</th>
                                    <th className="text-muted small text-uppercase">ID Transação</th>
                                    <th className="text-muted small text-uppercase">Origem</th>
                                    <th className="text-muted small text-uppercase">Referência</th>
                                    <th className="text-end text-muted small text-uppercase">Bruto</th>
                                    <th className="text-end text-muted small text-uppercase">Taxa</th>
                                    <th className="text-end text-muted small text-uppercase">Líquido</th>
                                    <th className="text-center text-muted small text-uppercase pe-3">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.history.length > 0 ? (
                                    data.history.map((tx) => (
                                        <tr key={tx.id_transacao}>
                                            <td className="small text-muted ps-3">{new Date(tx.data_criacao).toLocaleDateString()}<br/>{new Date(tx.data_criacao).toLocaleTimeString()}</td>
                                            <td>
                                                <span className="font-monospace small bg-light px-2 py-1 rounded border text-primary" style={{cursor: 'pointer'}} onClick={() => handleShowDetails(tx)}>
                                                    {tx.gateway_id ? tx.gateway_id.substring(0, 15) : `INT-${tx.id_transacao}`}...
                                                </span>
                                            </td>
                                            <td>
                                                {tx.gateway_provider === 'PDV' ? (
                                                    <Badge bg="warning" text="dark" className="border shadow-sm"><FaCashRegister className="me-1"/> PDV</Badge>
                                                ) : (
                                                    <Badge bg="light" text="dark" className="border">{tx.gateway_provider}</Badge>
                                                )}
                                            </td>
                                            <td>
                                                <div className="d-flex flex-column">
                                                    <span className="fw-bold text-dark small">Pedido #{tx.id_pedido}</span>
                                                    <span className="text-muted small" style={{fontSize: '0.75rem'}}>{tx.usuario?.nome_completo || 'Cliente'}</span>
                                                </div>
                                            </td>
                                            <td className="text-end fw-bold text-secondary">{formatBRL(tx.valor_bruto)}</td>
                                            <td className="text-end text-danger small">- {formatBRL(tx.valor_taxa)}</td>
                                            <td className="text-end fw-bold text-success">{formatBRL(tx.valor_liquido)}</td>
                                            <td className="text-center pe-3">
                                                <Button variant="outline-secondary" size="sm" className="rounded-circle" onClick={() => handleShowDetails(tx)} title="Ver Detalhes">
                                                    <FaEye />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr><td colSpan="8" className="text-center py-5 text-muted">Nenhuma transação financeira registrada no período.</td></tr>
                                )}
                            </tbody>
                        </Table>
                    </Card>
                </>
            )}

            {/* --- MODAL DE DETALHES --- */}
            <Modal show={showModal} onHide={() => setShowModal(false)} centered size="md">
                <Modal.Header closeButton className="bg-white border-bottom-0">
                    <Modal.Title className="h6 fw-bold d-flex align-items-center">
                        {isReceiptMode ? <><FaReceipt className="me-2 text-primary" /> Comprovante</> : <><FaExchangeAlt className="me-2 text-primary" /> Detalhes da Transação</>}
                    </Modal.Title>
                </Modal.Header>
                
                <Modal.Body className="p-0">
                    {selectedTx && (
                        <>
                            {isReceiptMode ? (
                                <div className="p-4" style={{ backgroundColor: '#fffdf0' }}> 
                                    <div id="printable-receipt" className="receipt-container text-center">
                                        <div className="mb-3">
                                            <h5 className="fw-bold text-uppercase mb-0">RECIBO</h5>
                                            <small className="text-muted">Ararinha E-commerce</small>
                                        </div>
                                        <div className="text-start border-top border-bottom border-dark border-opacity-25 py-3 my-3 font-monospace small">
                                            <div className="d-flex justify-content-between mb-1"><span>DATA:</span><span>{new Date(selectedTx.data_criacao).toLocaleString()}</span></div>
                                            <div className="d-flex justify-content-between mb-1"><span>ID:</span><span>#{selectedTx.id_transacao}</span></div>
                                            <div className="d-flex justify-content-between mb-1"><span>GATEWAY:</span><span>{selectedTx.gateway_provider}</span></div>
                                            <div className="d-flex justify-content-between mb-1"><span>ID GATEWAY:</span><span>{selectedTx.gateway_id ? selectedTx.gateway_id.substring(0, 15) : '-'}...</span></div>
                                        </div>
                                        
                                        {/* DETALHAMENTO DE VALORES NO RECIBO VISUAL */}
                                        <div className="text-start font-monospace mb-4">
                                            <div className="d-flex justify-content-between mb-1">
                                                <span>VALOR BRUTO:</span>
                                                <span>{formatBRL(selectedTx.valor_bruto)}</span>
                                            </div>
                                            <div className="d-flex justify-content-between mb-2 text-danger">
                                                <span>TAXAS:</span>
                                                <span>- {formatBRL(selectedTx.valor_taxa)}</span>
                                            </div>
                                            <div className="d-flex justify-content-between border-top border-dark border-opacity-25 pt-2">
                                                <span className="fw-bold">LÍQUIDO (REAL):</span>
                                                <span className="fw-bold">{formatBRL(selectedTx.valor_liquido)}</span>
                                            </div>
                                        </div>
                                        
                                        <div className="mt-4 pt-3 border-top border-dark border-dashed small text-muted">
                                            Venda via {selectedTx.gateway_provider === 'PDV' ? 'PDV (Presencial)' : 'E-commerce'}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    <div className="p-4 bg-light border-bottom text-center">
                                        <h2 className="text-success fw-bold mb-0">{formatBRL(selectedTx.valor_liquido)}</h2>
                                        <small className="text-muted">Valor Líquido Recebido</small>
                                    </div>
                                    <div className="p-4">
                                        <ListGroup variant="flush">
                                            <ListGroup.Item className="d-flex justify-content-between px-0">
                                                <span className="text-muted">Canal</span><Badge bg="dark">{selectedTx.gateway_provider}</Badge>
                                            </ListGroup.Item>
                                            <ListGroup.Item className="d-flex justify-content-between px-0">
                                                <span className="text-muted">Valor Bruto</span><span className="fw-bold">{formatBRL(selectedTx.valor_bruto)}</span>
                                            </ListGroup.Item>
                                            <ListGroup.Item className="d-flex justify-content-between px-0">
                                                <span className="text-muted">Taxas Gateway</span><span className="text-danger">- {formatBRL(selectedTx.valor_taxa)}</span>
                                            </ListGroup.Item>
                                            <ListGroup.Item className="px-0 pt-3">
                                                <small className="text-muted d-block mb-1">ID Gateway</small>
                                                <code className="bg-light p-1 rounded d-block text-break">{selectedTx.gateway_id}</code>
                                            </ListGroup.Item>
                                        </ListGroup>

                                        {(() => {
                                            const details = getClosingDetails(selectedTx.observacoes);
                                            if (details) {
                                                return (
                                                    <div className="mt-4 pt-3 border-top">
                                                        <h6 className="fw-bold mb-3 text-uppercase small text-muted"><FaClipboardList className="me-2"/> Detalhes do Fechamento</h6>
                                                        <div className="row g-2">
                                                            <div className="col-6"><div className="p-2 border rounded bg-white shadow-sm"><div className="d-flex align-items-center mb-1 text-success"><FaWallet className="me-2"/> Dinheiro</div><div className="fw-bold">{formatBRL(details.DINHEIRO)}</div></div></div>
                                                            <div className="col-6"><div className="p-2 border rounded bg-white shadow-sm"><div className="d-flex align-items-center mb-1 text-info"><FaQrcode className="me-2"/> Pix</div><div className="fw-bold">{formatBRL(details.PIX)}</div></div></div>
                                                        </div>
                                                    </div>
                                                );
                                            }
                                            return null;
                                        })()}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </Modal.Body>
                
                <Modal.Footer className="bg-light justify-content-between">
                    <Button variant="link" className="text-decoration-none text-muted p-0" onClick={() => setIsReceiptMode(!isReceiptMode)}>
                        {isReceiptMode ? <><FaArrowLeft className="me-1"/> Voltar</> : <><FaReceipt className="me-1"/> Ver Recibo</>}
                    </Button>
                    <div className="d-flex gap-2">
                        <Button variant="secondary" onClick={() => setShowModal(false)}>Fechar</Button>
                        {isReceiptMode && <Button variant="dark" onClick={handlePrintReceipt}><FaPrint className="me-2" /> Imprimir</Button>}
                    </div>
                </Modal.Footer>
            </Modal>
        </Container>
    );
};

export default FinancialAuditPage;