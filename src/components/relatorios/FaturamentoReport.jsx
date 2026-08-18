import React, { useState, useEffect } from 'react';
import { Card, Table, Spinner, Row, Col, Form, Button, ButtonGroup, Badge, Alert } from 'react-bootstrap';
import api from '../../services/api';

const formatarPreco = (valor) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor || 0);

// 🟢 Função adicionada aqui no topo do arquivo!
const getLocalDateString = (date) => {
    const d = new Date(date);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().split('T')[0];
};

export const FaturamentoReport = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState('');

    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = String(today.getMonth() + 1).padStart(2, '0');
    
    const [filterType, setFilterType] = useState('all');
    const [startDate, setStartDate] = useState(`${currentYear}-${currentMonth}-01`);
    const [endDate, setEndDate] = useState(getLocalDateString(today));
    
    const [monthStr, setMonthStr] = useState(`${currentYear}-${currentMonth}`);
    const [yearStr, setYearStr] = useState(String(currentYear));

    const [metodoFiltro, setMetodoFiltro] = useState('Todos');

    const fetchFaturamento = async () => {
        try {
            setLoading(true);
            setErrorMsg('');
            let queryParams = '';

            if (filterType === 'month') {
                const [ano, mes] = monthStr.split('-');
                const fStart = `${ano}-${mes}-01`;
                const ultimoDia = new Date(ano, mes, 0);
                const fEnd = getLocalDateString(ultimoDia);
                queryParams = `?startDate=${fStart}&endDate=${fEnd}`;
            } else if (filterType === 'year') {
                queryParams = `?startDate=${yearStr}-01-01&endDate=${yearStr}-12-31`;
            } else if (filterType === 'custom') {
                queryParams = `?startDate=${startDate}&endDate=${endDate}`;
            }

            const response = await api.get(`/relatorios/faturamento${queryParams}`);
            setData(response.data);
        } catch (err) { 
            if (err.response?.status === 403) {
                setErrorMsg('🔒 Acesso Negado: A sua conta não tem a permissão "RELATORIOS_VIEW".');
            } else {
                setErrorMsg(`❌ Erro no Backend (${err.response?.status}): Verifique o console.`);
                console.error("Erro Faturamento:", err.response?.data);
            }
            setData({ detalhes: [] });
        } finally { 
            setLoading(false); 
        }
    };

    useEffect(() => { 
        fetchFaturamento(); 
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filterType]);

    const handleFiltrar = (e) => {
        e.preventDefault();
        fetchFaturamento();
    };

    const vendasFiltradas = data?.detalhes?.filter(venda => {
        if (metodoFiltro === 'Todos') return true;
        return venda.metodo?.toUpperCase().includes(metodoFiltro.toUpperCase());
    }) || [];

    const totalFiltrado = vendasFiltradas.reduce((acc, curr) => acc + curr.valor, 0);

    const exportarExcel = () => {
        let csv = "ID Pedido;Data;Cliente;Metodo;Valor\n";
        vendasFiltradas.forEach(p => {
            csv += `${p.id_pedido};${new Date(p.data).toLocaleDateString('pt-BR')};${p.cliente};${p.metodo};${p.valor.toFixed(2).replace('.', ',')}\n`;
        });
        csv += `\nTOTAL;;;;${totalFiltrado.toFixed(2).replace('.', ',')}\n`;
        
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `extrato_vendas_${new Date().getTime()}.csv`;
        link.click();
    };

    return (
        <div className="fade-in">
            <Card className="border-0 shadow-sm rounded-4 mb-4 bg-white">
                <Card.Body className="p-4">
                    <Form onSubmit={handleFiltrar}>
                        <Row className="align-items-end g-3">
                            <Col md={12} className="mb-2">
                                <Form.Label className="small fw-bold text-muted text-uppercase mb-2">Período de Análise</Form.Label>
                                <div>
                                    <ButtonGroup className="shadow-sm">
                                        <Button variant={filterType === 'all' ? 'success' : 'outline-secondary'} onClick={() => setFilterType('all')} className="fw-bold px-3">Todo o Período</Button>
                                        <Button variant={filterType === 'month' ? 'success' : 'outline-secondary'} onClick={() => setFilterType('month')} className="fw-bold px-3">Por Mês</Button>
                                        <Button variant={filterType === 'year' ? 'success' : 'outline-secondary'} onClick={() => setFilterType('year')} className="fw-bold px-3">Por Ano</Button>
                                        <Button variant={filterType === 'custom' ? 'success' : 'outline-secondary'} onClick={() => setFilterType('custom')} className="fw-bold px-3">Personalizado</Button>
                                    </ButtonGroup>
                                </div>
                            </Col>

                            {filterType === 'month' && (
                                <Col md={6}>
                                    <Form.Group>
                                        <Form.Label className="small fw-bold text-muted mb-1">Mês / Ano</Form.Label>
                                        <Form.Control type="month" value={monthStr} onChange={(e) => setMonthStr(e.target.value)} className="rounded-3 shadow-none border-secondary-subtle" />
                                    </Form.Group>
                                </Col>
                            )}

                            {filterType === 'year' && (
                                <Col md={6}>
                                    <Form.Group>
                                        <Form.Label className="small fw-bold text-muted mb-1">Ano</Form.Label>
                                        <Form.Select value={yearStr} onChange={(e) => setYearStr(e.target.value)} className="rounded-3 shadow-none border-secondary-subtle">
                                            <option value="2024">2024</option>
                                            <option value="2025">2025</option>
                                            <option value="2026">2026</option>
                                            <option value="2027">2027</option>
                                        </Form.Select>
                                    </Form.Group>
                                </Col>
                            )}

                            {filterType === 'custom' && (
                                <>
                                    <Col md={3}>
                                        <Form.Group>
                                            <Form.Label className="small fw-bold text-muted mb-1">Início</Form.Label>
                                            <Form.Control type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="rounded-3 shadow-none border-secondary-subtle" />
                                        </Form.Group>
                                    </Col>
                                    <Col md={3}>
                                        <Form.Group>
                                            <Form.Label className="small fw-bold text-muted mb-1">Fim</Form.Label>
                                            <Form.Control type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="rounded-3 shadow-none border-secondary-subtle" />
                                        </Form.Group>
                                    </Col>
                                </>
                            )}

                            <Col md={filterType === 'custom' ? 6 : filterType === 'all' ? 12 : 6}>
                                <Row className="g-2">
                                    <Col sm={filterType === 'all' ? 4 : 8}>
                                        <Form.Group>
                                            <Form.Label className="small fw-bold text-muted mb-1">Método de Pagamento</Form.Label>
                                            <Form.Select value={metodoFiltro} onChange={(e) => setMetodoFiltro(e.target.value)} className="rounded-3 shadow-none border-secondary-subtle">
                                                <option value="Todos">Todos os Métodos</option>
                                                <option value="PIX">PIX</option>
                                                <option value="CREDIT">Cartão de Crédito</option>
                                                <option value="TICKET">Boleto</option>
                                                <option value="OFFLINE">Pagamento na Loja</option>
                                            </Form.Select>
                                        </Form.Group>
                                    </Col>
                                    <Col sm={filterType === 'all' ? 8 : 4} className="d-flex align-items-end">
                                        {filterType !== 'all' && (
                                            <Button type="submit" variant="dark" className="w-100 rounded-3 fw-bold shadow-sm gap-2">
                                                <i className="bi bi-funnel"></i> Buscar
                                            </Button>
                                        )}
                                    </Col>
                                </Row>
                            </Col>
                        </Row>
                    </Form>
                </Card.Body>
            </Card>

            {errorMsg && <Alert variant="danger" className="text-center rounded-4 fw-bold">{errorMsg}</Alert>}

            {loading && <div className="text-center py-5"><Spinner animation="border" variant="success" /></div>}

            {!loading && data && !errorMsg && (
                <>
                    <div className="bg-white p-4 rounded-4 border border-gray-100 shadow-sm mb-4 d-flex flex-column align-items-center justify-content-center">
                        <span className="text-muted small fw-bold text-uppercase mb-2">Faturamento Bruto {metodoFiltro !== 'Todos' ? `(${metodoFiltro})` : ''}</span>
                        <h2 className="display-5 fw-black text-success m-0">{formatarPreco(totalFiltrado)}</h2>
                        <span className="badge bg-light text-dark border mt-3 px-3 py-2 rounded-pill">
                            <i className="bi bi-receipt me-1"></i> {vendasFiltradas.length} pedidos encontrados
                        </span>
                    </div>

                    <Card className="border-0 shadow-sm rounded-4 overflow-hidden bg-white">
                        <Card.Header className="bg-white py-3 d-flex justify-content-between align-items-center border-bottom">
                            <h6 className="m-0 fw-bold"><i className="bi bi-list-check text-primary me-2"></i>Extrato de Vendas</h6>
                            <Button variant="outline-success" size="sm" className="fw-bold px-3 rounded-pill" onClick={exportarExcel} disabled={vendasFiltradas.length === 0}>
                                <i className="bi bi-file-earmark-excel me-1"></i> Exportar CSV
                            </Button>
                        </Card.Header>
                        <Card.Body className="p-0">
                            {vendasFiltradas.length > 0 ? (
                                <Table bordered hover striped size="sm" className="mb-0 text-nowrap align-middle" style={{ borderColor: '#dee2e6' }}>
                                    <thead className="bg-light text-dark text-uppercase" style={{ fontSize: '11px' }}>
                                        <tr>
                                            <th className="py-2 px-3 text-center" style={{ width: '80px', backgroundColor: '#f8f9fa' }}>Pedido</th>
                                            <th className="py-2 px-3" style={{ width: '150px', backgroundColor: '#f8f9fa' }}>Data e Hora</th>
                                            <th className="py-2 px-3" style={{ backgroundColor: '#f8f9fa' }}>Cliente</th>
                                            <th className="py-2 px-3 text-center" style={{ width: '180px', backgroundColor: '#f8f9fa' }}>Método</th>
                                            <th className="py-2 px-3 text-end" style={{ width: '150px', backgroundColor: '#f8f9fa' }}>Valor Bruto</th>
                                        </tr>
                                    </thead>
                                    <tbody style={{ fontSize: '13px' }}>
                                        {vendasFiltradas.map((p, i) => (
                                            <tr key={i}>
                                                <td className="px-3 py-2 fw-bold text-primary text-center">#{p.id_pedido}</td>
                                                <td className="px-3 py-2 text-muted fw-medium">{new Date(p.data).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}</td>
                                                <td className="px-3 py-2 fw-bold text-dark">{p.cliente}</td>
                                                <td className="px-3 py-2 text-center">
                                                    <Badge bg="secondary" className="bg-opacity-10 text-dark border fw-medium px-2 py-1">{p.metodo || 'Padrão'}</Badge>
                                                </td>
                                                <td className="px-3 py-2 text-end fw-black text-success">{formatarPreco(p.valor)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot className="bg-dark text-white fw-bold" style={{ fontSize: '13px' }}>
                                        <tr>
                                            <td colSpan="4" className="text-end py-2 px-3">SOMATÓRIO TOTAL:</td>
                                            <td className="text-end py-2 px-3 text-success" style={{ color: '#4ade80' }}>{formatarPreco(totalFiltrado)}</td>
                                        </tr>
                                    </tfoot>
                                </Table>
                            ) : (
                                <div className="p-5 text-center text-muted">
                                    <i className="bi bi-inbox fs-1 d-block mb-3 opacity-50"></i>
                                    Nenhuma venda finalizada (PAGO) encontrada neste período.
                                </div>
                            )}
                        </Card.Body>
                    </Card>
                </>
            )}
        </div>
    );
};