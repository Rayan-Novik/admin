import React, { useState, useEffect } from 'react';
import { Card, Spinner } from 'react-bootstrap';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import api from '../../services/api';

ChartJS.register(ArcElement, Tooltip, Legend);

const PaymentMethodsChart = ({ dateRange }) => {
    const [chartData, setChartData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            if (!dateRange?.startDate || !dateRange?.endDate) return;
            setLoading(true);
            try {
                // Usa a rota geral para pegar os dados de pagamento
                const { data } = await api.get(`/dashboard/charts?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`);
                
                const labels = data.paymentChartData.map(d => d.name);
                const values = data.paymentChartData.map(d => d.value);

                setChartData({
                    labels: labels,
                    datasets: [
                        {
                            data: values,
                            backgroundColor: [
                                '#0d6efd', // Azul
                                '#198754', // Verde
                                '#ffc107', // Amarelo
                                '#dc3545', // Vermelho
                                '#6f42c1', // Roxo
                                '#0dcaf0'  // Ciano
                            ],
                            borderColor: '#ffffff',
                            borderWidth: 2,
                            hoverOffset: 4
                        },
                    ],
                });
            } catch (err) {
                console.error("Erro Pagamentos:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [dateRange]);

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'right',
                labels: { 
                    usePointStyle: true, 
                    boxWidth: 8,
                    font: { family: "'Inter', sans-serif", size: 11 },
                    color: '#6c757d'
                }
            },
            title: {
                display: true,
                text: 'Métodos de Pagamento',
                align: 'start',
                font: { size: 16, weight: 'bold', family: "'Inter', sans-serif" },
                padding: { bottom: 20 },
                color: '#212529'
            },
            tooltip: {
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                titleColor: '#212529',
                bodyColor: '#6c757d',
                borderColor: '#e9ecef',
                borderWidth: 1,
                callbacks: {
                    label: function(context) {
                        const value = context.raw;
                        const total = context.chart._metasets[context.datasetIndex].total;
                        const percentage = ((value / total) * 100).toFixed(1) + '%';
                        
                        let label = context.label || '';
                        if (label) label += ': ';
                        label += new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
                        return `${label} (${percentage})`;
                    }
                }
            }
        },
        cutout: '65%', // Faz virar uma Rosca (Doughnut) mais elegante
    };

    return (
        <Card className="border-0 shadow-sm h-100" style={{ borderRadius: '1rem' }}>
            <Card.Body className="p-4">
                {loading ? (
                    <div className="d-flex justify-content-center align-items-center" style={{ height: '300px' }}>
                        <Spinner animation="border" variant="primary" />
                    </div>
                ) : (
                    <div style={{ height: '300px', width: '100%', display: 'flex', alignItems: 'center' }}>
                        {chartData && (
                            chartData.datasets[0].data.length > 0 
                            ? <Doughnut data={chartData} options={options} />
                            : <div className="text-muted w-100 text-center small">Sem dados de pagamento no período.</div>
                        )}
                    </div>
                )}
            </Card.Body>
        </Card>
    );
};

export default PaymentMethodsChart;