import React, { useState, useEffect, useCallback } from 'react';
import { Card, Table, Spinner, Alert, Form, Button, Row, Col } from 'react-bootstrap';
import api from '../../services/api';

const formatarPreco = (valor) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor || 0);

// 🟢 Função adicionada aqui no topo do arquivo também!
const getLocalDateString = (date) => {
    const d = new Date(date);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().split('T')[0];
};

export const LucratividadeReport = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = String(today.getMonth() + 1).padStart(2, '0');
    
    const [startDate, setStartDate] = useState(`${currentYear}-${currentMonth}-01`);
    const [endDate, setEndDate] = useState(getLocalDateString(today));

    const fetchRelatorio = useCallback(async () => {
        try {
            setLoading(true);
            setErrorMsg('');
            // Usamos a data até as 23:59 para garantir o dia inteiro
            const response = await api.get(`/relatorios/lucratividade?startDate=${startDate}&endDate=${endDate}T23:59:59&_t=${new Date().getTime()}`);
            setData(response.data);
        } catch (err) {
            if (err.response?.status === 403) {
                setErrorMsg('🔒 Acesso Negado: A sua conta não tem a permissão "CONTAS_MANAGE".');
            } else {
                setErrorMsg(`❌ Erro no Backend (${err.response?.status}): Falha na query SQL.`);
                console.error("Erro DRE:", err.response?.data);
            }
            setData({
                produtos: [],
                totais: { quantidade: 0, faturamento_bruto: 0, taxas_gateway: 0, faturamento_liquido: 0, reposicao: 0, v_margem: 0, margem_perc: 0 }
            });
        } finally {
            setLoading(false);
        }
    }, [startDate, endDate]);

    useEffect(() => {
        fetchRelatorio();
    }, [fetchRelatorio]);

    const exportarCSV = () => {
        if (!data || data.produtos.length === 0) return;
        let csvContent = "data:text/csv;charset=utf-8,";
        csvContent += "Produto;Qtd;Faturamento Bruto;Taxas Gateway;Faturamento Liquido;Reposicao;V. Margem (Lucro);Margem (%)\n";

        data.produtos.forEach(p => {
            csvContent += `${p.nome};${p.quantidade};${p.faturamento_bruto.toFixed(2)};${p.taxas_gateway.toFixed(2)};${p.faturamento_liquido.toFixed(2)};${p.reposicao.toFixed(2)};${p.v_margem.toFixed(2)};${p.margem_perc}%\n`.replace(/\./g, ',');
        });

        csvContent += `TOTAIS GERAIS;${data.totais.quantidade};${data.totais.faturamento_bruto.toFixed(2)};${data.totais.taxas_gateway.toFixed(2)};${data.totais.faturamento_liquido.toFixed(2)};${data.totais.reposicao.toFixed(2)};${data.totais.v_margem.toFixed(2)};${data.totais.margem_perc.toFixed(2)}%\n`.replace(/\./g, ',');

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `relatorio_lucratividade_${new Date().getTime()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="fade-in">
            {/* FILTROS */}
            <Card className="border-0 shadow-sm rounded-4 mb-4 bg-white">
                <Card.Body className="p-4">
                    <Form onSubmit={(e) => { e.preventDefault(); fetchRelatorio(); }}>
                        <Row className="align-items-end g-3">
                            <Col md={9} className="mb-2">
                                <Form.Label className="small fw-bold text-muted text-uppercase tracking-wider mb-0">
                                    Período de Análise (DRE e Taxas)
                                </Form.Label>
                            </Col>
                            <Col md={3} className="text-end mb-2">
                                <Button variant="link" size="sm" onClick={fetchRelatorio} className="text-decoration-none p-0">
                                    <i className={`bi bi-arrow-clockwise ${loading ? 'spin' : ''}`}></i> Atualizar Agora
                                </Button>
                            </Col>
                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label className="small fw-bold text-muted mb-1">Data Inicial</Form.Label>
                                    <Form.Control type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="rounded-3 shadow-none border-secondary-subtle" />
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label className="small fw-bold text-muted mb-1">Data Final</Form.Label>
                                    <Form.Control type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="rounded-3 shadow-none border-secondary-subtle" />
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Button type="submit" variant="danger" className="w-100 rounded-3 fw-bold shadow-sm d-flex align-items-center justify-content-center gap-2" disabled={loading}>
                                    {loading ? <Spinner size="sm" animation="border" /> : <i className="bi bi-search"></i>} Gerar DRE
                                </Button>
                            </Col>
                        </Row>
                    </Form>
                </Card.Body>
            </Card>

            {errorMsg && <Alert variant="danger" className="text-center rounded-4 fw-bold">{errorMsg}</Alert>}

            {!loading && data && !errorMsg && (
                <Card className="border shadow-sm rounded-4 overflow-hidden bg-white">
                    <Card.Header className="bg-white border-bottom py-3 d-flex justify-content-between align-items-center">
                        <h5 className="m-0 fw-bold text-dark d-flex align-items-center gap-2">
                            <i className="bi bi-graph-down-arrow text-danger"></i> 
                            DRE de Produtos Analítico
                        </h5>
                        <Button variant="outline-success" size="sm" className="fw-bold px-3 rounded-pill" onClick={exportarCSV} disabled={data.produtos.length === 0}>
                            <i className="bi bi-file-earmark-excel me-2"></i> Exportar CSV
                        </Button>
                    </Card.Header>
                    
                    <Card.Body className="p-0">
                        {data.produtos.length === 0 ? (
                            <div className="p-5 text-center text-muted">
                                <i className="bi bi-inbox fs-1 d-block mb-3 opacity-50"></i>
                                Nenhuma venda com status <b>PAGO</b> encontrada neste período.
                            </div>
                        ) : (
                            <div className="table-responsive m-0">
                                <Table bordered hover striped size="sm" className="mb-0 align-middle" style={{ borderColor: '#dee2e6' }}>
                                    <thead className="bg-light text-dark text-uppercase text-center" style={{ fontSize: '11px' }}>
                                        <tr>
                                            <th className="py-2 px-3 text-start">Produto</th>
                                            <th className="py-2 px-3">Qtd</th>
                                            <th className="py-2 px-3">Fat. Bruto</th>
                                            <th className="py-2 px-3 text-warning">Taxas Gateway</th>
                                            <th className="py-2 px-3">Fat. Líquido</th>
                                            <th className="py-2 px-3 text-danger">Reposição</th>
                                            <th className="py-2 px-3 text-success">Lucro R$</th>
                                            <th className="py-2 px-3 text-success">Margem %</th>
                                        </tr>
                                    </thead>
                                    <tbody style={{ fontSize: '13px' }}>
                                        {data.produtos.map((item, idx) => (
                                            <tr key={idx} className="text-center">
                                                <td className="py-2 px-3 text-start fw-medium text-dark">{item.nome}</td>
                                                <td className="py-2 px-3">{item.quantidade}</td>
                                                <td className="py-2 px-3 text-muted">{formatarPreco(item.faturamento_bruto)}</td>
                                                <td className="py-2 px-3 text-warning fw-medium">{formatarPreco(item.taxas_gateway)}</td>
                                                <td className="py-2 px-3 fw-medium">{formatarPreco(item.faturamento_liquido)}</td>
                                                <td className="py-2 px-3 text-danger fw-bold">{formatarPreco(item.reposicao)}</td>
                                                <td className="py-2 px-3 fw-black text-success">{formatarPreco(item.v_margem)}</td>
                                                <td className="py-2 px-3 fw-bold text-success bg-success bg-opacity-10">{item.margem_perc}%</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot className="bg-dark text-white fw-bold text-center" style={{ fontSize: '13px' }}>
                                        <tr>
                                            <td className="text-end py-3 px-3">TOTAIS:</td>
                                            <td className="py-3 px-3">{data.totais.quantidade}</td>
                                            <td className="py-3 px-3">{formatarPreco(data.totais.faturamento_bruto)}</td>
                                            <td className="py-3 px-3 text-warning">{formatarPreco(data.totais.taxas_gateway)}</td>
                                            <td className="py-3 px-3">{formatarPreco(data.totais.faturamento_liquido)}</td>
                                            <td className="py-3 px-3 text-danger">{formatarPreco(data.totais.reposicao)}</td>
                                            <td className="py-3 px-3" style={{ color: '#4ade80' }}>{formatarPreco(data.totais.v_margem)}</td>
                                            <td className="py-3 px-3 bg-success">{data.totais.margem_perc.toFixed(2)}%</td>
                                        </tr>
                                    </tfoot>
                                </Table>
                            </div>
                        )}
                    </Card.Body>
                </Card>
            )}
        </div>
    );
};