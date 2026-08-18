import React, { useState } from 'react';
import { Card, Form, Button, Spinner, Row, Col } from 'react-bootstrap';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import api from '../../services/api';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const SalesPerformanceReport = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [dates, setDates] = useState({ startDate: '', endDate: '' });

    const fetchData = async () => {
        setLoading(true);
        try {
            const { data: responseData } = await api.get('/relatorios/sales-performance', { params: dates });
            const labels = Object.keys(responseData).sort();
            const chartData = {
                labels,
                datasets: [
                    { 
                        label: 'Faturamento Bruto (R$)', 
                        data: labels.map(l => responseData[l].faturamento), 
                        borderColor: 'rgb(54, 162, 235)',
                        backgroundColor: 'rgba(54, 162, 235, 0.5)',
                    },
                    { 
                        label: 'Lucro Bruto (R$)', 
                        data: labels.map(l => responseData[l].lucro), 
                        borderColor: 'rgb(75, 192, 192)',
                        backgroundColor: 'rgba(75, 192, 192, 0.5)',
                    },
                ]
            };
            setData(chartData);
        } catch (error) { console.error("Erro ao gerar relatório de desempenho:", error); }
        finally { setLoading(false); }
    };

    return (
        <Card className="shadow-sm">
            <Card.Body>
                <Card.Title>Desempenho de Vendas por Período</Card.Title>
                <Form.Group as={Row} className="mb-3 align-items-end">
                    <Col sm={4}><Form.Label>Data de Início</Form.Label><Form.Control type="date" value={dates.startDate} onChange={e => setDates({...dates, startDate: e.target.value})} /></Col>
                    <Col sm={4}><Form.Label>Data de Fim</Form.Label><Form.Control type="date" value={dates.endDate} onChange={e => setDates({...dates, endDate: e.target.value})} /></Col>
                    <Col sm={4}><Button className="w-100" onClick={fetchData} disabled={loading}>{loading ? <Spinner size="sm" /> : "Gerar Relatório"}</Button></Col>
                </Form.Group>
                {data && <Line data={data} />}
            </Card.Body>
        </Card>
    );
};

export default SalesPerformanceReport;
