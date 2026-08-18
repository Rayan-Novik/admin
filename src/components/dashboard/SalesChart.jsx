import React, { useState, useEffect } from 'react';
import { Card, Spinner, Alert, ButtonGroup, Button } from 'react-bootstrap';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import api from '../../services/api';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const SalesChart = () => {
    const [chartData, setChartData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [periodo, setPeriodo] = useState('month'); // Estado para o filtro: 'day', 'month', 'year'

    useEffect(() => {
        const fetchChartData = async () => {
            try {
                setLoading(true);
                // Envia o período selecionado para o backend
                const { data } = await api.get(`/dashboard/sales-data?periodo=${periodo}`);
                setChartData(data);
            } catch (err) {
                setError('Não foi possível carregar os dados do gráfico.');
            } finally {
                setLoading(false);
            }
        };
        fetchChartData();
    }, [periodo]); // O gráfico é atualizado sempre que o 'periodo' muda

    const lineChartData = {
        labels: chartData?.labels || [],
        datasets: [
            {
                label: 'Vendas Confirmadas (R$)',
                data: chartData?.datasets?.paid || [],
                borderColor: 'rgb(25, 135, 84)',
                backgroundColor: 'rgba(25, 135, 84, 0.2)',
                fill: true,
                tension: 0.4,
            },
            {
                label: 'Vendas Pendentes (R$)',
                data: chartData?.datasets?.pending || [],
                borderColor: 'rgb(255, 193, 7)',
                backgroundColor: 'rgba(255, 193, 7, 0.2)',
                fill: true,
                tension: 0.4,
            },
        ],
    };
    
    const chartOptions = {
        responsive: true,
        plugins: {
            legend: { position: 'top' },
            title: { display: true, text: `Desempenho de Vendas (${periodo === 'day' ? 'Diário' : periodo === 'month' ? 'Mensal' : 'Anual'})` },
        },
    };

    return (
        <Card className="mb-3 shadow-sm">
            <Card.Body>
                {/* ✅ BOTÕES DE FILTRO */}
                <div className="d-flex justify-content-end mb-2">
                    <ButtonGroup size="sm">
                        <Button variant={periodo === 'day' ? 'primary' : 'outline-secondary'} onClick={() => setPeriodo('day')}>Dia</Button>
                        <Button variant={periodo === 'month' ? 'primary' : 'outline-secondary'} onClick={() => setPeriodo('month')}>Mês</Button>
                        <Button variant={periodo === 'year' ? 'primary' : 'outline-secondary'} onClick={() => setPeriodo('year')}>Ano</Button>
                    </ButtonGroup>
                </div>

                {loading ? <div className="text-center"><Spinner animation="border" /></div> : 
                 error ? <Alert variant="danger">{error}</Alert> :
                 <Line options={chartOptions} data={lineChartData} />
                }
            </Card.Body>
        </Card>
    );
};

export default SalesChart;
