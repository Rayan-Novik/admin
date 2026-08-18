import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Table, Spinner, Alert, Badge, ListGroup } from 'react-bootstrap';
import api from '../../services/api';

const QuickReports = () => {
    const [reports, setReports] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchReports = async () => {
            try {
                const [salesRes, viewedRes, feedbackRes] = await Promise.all([
                    api.get('/relatorios/product-sales'),
                    api.get('/relatorios/most-viewed'),
                    api.get('/relatorios/feedback'),
                ]);
                setReports({
                    sales: salesRes.data,
                    viewed: viewedRes.data,
                    feedback: feedbackRes.data,
                });
            } catch (err) {
                setError('Não foi possível carregar os relatórios.');
            } finally {
                setLoading(false);
            }
        };
        fetchReports();
    }, []);

    if (loading) return <div className="text-center"><Spinner animation="border" /></div>;
    if (error) return <Alert variant="danger">{error}</Alert>;
    if (!reports) return null;

    return (
        <Row>
            <Col md={6}>
                <Card className="mb-4 shadow-sm"><Card.Body><Card.Title>Produtos Mais Vendidos</Card.Title><Table striped hover size="sm"><thead><tr><th>Produto</th><th className="text-end">Unidades</th></tr></thead><tbody>{reports.sales.bestSellers.map(item => <tr key={item.id_produto}><td>{item.nome_produto || item.nome}</td><td className="text-end"><Badge bg="success">{item._sum.quantidade}</Badge></td></tr>)}</tbody></Table></Card.Body></Card>
                <Card className="shadow-sm"><Card.Body><Card.Title>Produtos Menos Vendidos</Card.Title><Table striped hover size="sm"><thead><tr><th>Produto</th><th className="text-end">Unidades</th></tr></thead><tbody>{reports.sales.worstSellers.map(item => <tr key={item.id_produto}><td>{item.nome_produto || item.nome}</td><td className="text-end"><Badge bg="warning">{item._sum.quantidade}</Badge></td></tr>)}</tbody></Table></Card.Body></Card>
            </Col>
            <Col md={6}>
                <Card className="mb-4 shadow-sm"><Card.Body><Card.Title>Produtos Mais Visualizados</Card.Title><Table striped hover size="sm"><thead><tr><th>Produto</th><th className="text-end">Vistas</th></tr></thead><tbody>{reports.viewed.map(item => <tr key={item.id_produto}><td>{item.nome}</td><td className="text-end"><Badge bg="info">{item.visualizacoes}</Badge></td></tr>)}</tbody></Table></Card.Body></Card>
                <Card className="shadow-sm"><Card.Body><Card.Title>Feedback Recente</Card.Title><ListGroup variant="flush">{reports.feedback.map(item => (<ListGroup.Item key={item.id_avaliacao}><strong>{item.produtos.nome}</strong> por <em>{item.usuarios.nome_completo}</em><div>{"⭐".repeat(item.nota)}</div><small className="text-muted">{item.comentario}</small></ListGroup.Item>))}</ListGroup></Card.Body></Card>
            </Col>
        </Row>
    );
};

export default QuickReports;
