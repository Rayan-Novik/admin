import React, { useState, useEffect } from 'react';
import { Card, Table, Spinner, Alert, Row, Col, Badge } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import api from '../../services/api';
// ✅ 1. Importa o novo componente de botões de exportação
import ExportButtons from '../common/ExportButtons';

// Componente reutilizável para cada tabela de relatório
const ReportTable = ({ title, data, valueKey, valueLabel, variant, columns }) => (
    <Card className="shadow-sm h-100">
        <Card.Body>
            <div className="d-flex justify-content-between align-items-center mb-3">
                <Card.Title className="mb-0">{title}</Card.Title>
                {/* ✅ 2. Adiciona os botões de exportação, passando os dados e as colunas */}
                <ExportButtons data={data} columns={columns} title={title} />
            </div>
            <Table striped hover responsive size="sm">
                <thead>
                    <tr>
                        <th>Produto</th>
                        <th className="text-end">{valueLabel}</th>
                    </tr>
                </thead>
                <tbody>
                    {data.map((item, index) => (
                        <tr key={item.id_produto || index}>
                            <td>
                                <Link to={`/admin/product/${item.id_produto}/edit`}>
                                    {item.nome}
                                </Link>
                            </td>
                            <td className="text-end">
                                <Badge bg={variant}>{item[valueKey]}</Badge>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </Table>
        </Card.Body>
    </Card>
);


const ProductPerformanceReport = () => {
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchReport = async () => {
            try {
                const { data } = await api.get('/relatorios/product-performance');
                setReportData(data);
            } catch (err) {
                setError('Não foi possível carregar o relatório de desempenho.');
            } finally {
                setLoading(false);
            }
        };
        fetchReport();
    }, []);

    if (loading) return <div className="text-center p-5"><Spinner animation="border" /></div>;
    if (error) return <Alert variant="danger">{error}</Alert>;
    if (!reportData) return null;

    // ✅ 3. Define a estrutura das colunas para cada tipo de relatório
    const soldColumns = [{ Header: 'Produto', accessor: 'nome' }, { Header: 'Unidades Vendidas', accessor: '_sum.quantidade' }];
    const viewedColumns = [{ Header: 'Produto', accessor: 'nome' }, { Header: 'Visualizações', accessor: 'visualizacoes' }];

    return (
        <Row className="gy-4">
            <Col lg={6}>
                <ReportTable title="Produtos Mais Vendidos" data={reportData.mostSold} valueKey="_sum.quantidade" valueLabel="Unidades" variant="success" columns={soldColumns} />
            </Col>
            <Col lg={6}>
                <ReportTable title="Produtos Mais Procurados" data={reportData.mostViewed} valueKey="visualizacoes" valueLabel="Visualizações" variant="info" columns={viewedColumns} />
            </Col>
            <Col lg={6}>
                <ReportTable title="Produtos Menos Vendidos" data={reportData.leastSold} valueKey="_sum.quantidade" valueLabel="Unidades" variant="warning" columns={soldColumns} />
            </Col>
             <Col lg={6}>
                <ReportTable title="Produtos Menos Procurados" data={reportData.leastViewed} valueKey="visualizacoes" valueLabel="Visualizações" variant="secondary" columns={viewedColumns} />
            </Col>
        </Row>
    );
};

export default ProductPerformanceReport;
