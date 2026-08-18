import React, { useState } from 'react';
import { Card, Form, Button, Spinner, Row, Col, Table } from 'react-bootstrap';
import api from '../../services/api';

const TopSellingReport = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [dates, setDates] = useState({ startDate: '', endDate: '' });

    const fetchData = async () => {
        setLoading(true);
        try {
            const { data: responseData } = await api.get('/relatorios/top-selling', { params: dates });
            setData(responseData);
        } catch (error) { console.error("Erro ao gerar relatório de mais vendidos:", error); }
        finally { setLoading(false); }
    };

    return (
        <Card className="mt-4 shadow-sm">
            <Card.Body>
                <Card.Title>Produtos Mais Vendidos por Período</Card.Title>
                 <Form.Group as={Row} className="mb-3 align-items-end">
                    <Col sm={4}><Form.Label>Data de Início</Form.Label><Form.Control type="date" value={dates.startDate} onChange={e => setDates({...dates, startDate: e.target.value})} /></Col>
                    <Col sm={4}><Form.Label>Data de Fim</Form.Label><Form.Control type="date" value={dates.endDate} onChange={e => setDates({...dates, endDate: e.target.value})} /></Col>
                    <Col sm={4}><Button className="w-100" onClick={fetchData} disabled={loading}>{loading ? <Spinner size="sm" /> : "Gerar Relatório"}</Button></Col>
                </Form.Group>
                {data && (
                    <Row>
                        <Col md={6}>
                            <h5 className="text-center">Top 10 por Quantidade</h5>
                            <Table striped bordered hover size="sm">
                                <thead><tr><th>#</th><th>Produto</th><th>Qtd.</th></tr></thead>
                                <tbody>
                                    {data.byQuantity.map((item, index) => <tr key={index}><td>{index + 1}</td><td>{item.nome}</td><td>{item.quantidade}</td></tr>)}
                                </tbody>
                            </Table>
                        </Col>
                        <Col md={6}>
                            <h5 className="text-center">Top 10 por Faturamento</h5>
                             <Table striped bordered hover size="sm">
                                <thead><tr><th>#</th><th>Produto</th><th>Valor</th></tr></thead>
                                <tbody>
                                    {data.byRevenue.map((item, index) => <tr key={index}><td>{index + 1}</td><td>{item.nome}</td><td>R$ {item.faturamento.toFixed(2)}</td></tr>)}
                                </tbody>
                            </Table>
                        </Col>
                    </Row>
                )}
            </Card.Body>
        </Card>
    );
};

export default TopSellingReport;
