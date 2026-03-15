import React, { useState, useEffect } from 'react';
import { Card, Spinner } from 'react-bootstrap';
import { Bar } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
} from 'chart.js';
import api from '../../services/api';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const ProductAuditChart = ({ dateRange }) => {
    const [chartData, setChartData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            if (!dateRange?.startDate || !dateRange?.endDate) return;
            setLoading(true);
            try {
                const { data } = await api.get(`/dashboard/audit-chart?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`);
                
                setChartData({
                    labels: data.labels,
                    datasets: [
                        {
                            label: 'Novos Produtos',
                            data: data.dataCriacao,
                            backgroundColor: '#20c997', // Verde Teal
                            borderRadius: 4,
                            barPercentage: 0.6,
                        },
                        {
                            label: 'Edições/Atualizações',
                            data: data.dataEdicao,
                            backgroundColor: '#ffc107', // Amarelo
                            borderRadius: 4,
                            barPercentage: 0.6,
                        }
                    ]
                });
            } catch (err) {
                console.error("Erro gráfico auditoria:", err);
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
                position: 'top',
                align: 'end',
                labels: { usePointStyle: true, boxWidth: 8, font: { size: 11, family: "'Inter', sans-serif" } }
            },
            title: {
                display: true,
                text: 'Atividade no Catálogo',
                align: 'start',
                font: { size: 16, weight: 'bold', family: "'Inter', sans-serif" },
                padding: { bottom: 20 },
                color: '#212529'
            },
            tooltip: {
                mode: 'index',
                intersect: false,
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                titleColor: '#212529',
                bodyColor: '#6c757d',
                borderColor: '#e9ecef',
                borderWidth: 1
            }
        },
        scales: {
            x: { 
                stacked: true, // Empilha as barras
                grid: { display: false },
                ticks: { font: { size: 11 }, color: '#adb5bd' }
            },
            y: { 
                stacked: true, // Empilha as barras
                beginAtZero: true, 
                border: { display: false },
                grid: { color: '#f8f9fa' },
                ticks: { font: { size: 11 }, color: '#adb5bd', stepSize: 1 } 
            }
        }
    };

    return (
        <Card className="border-0 shadow-sm h-100" style={{ borderRadius: '1rem' }}>
            <Card.Body className="p-4">
                {loading ? (
                    <div className="d-flex justify-content-center align-items-center" style={{ height: '300px' }}>
                        <Spinner animation="border" variant="primary" />
                    </div>
                ) : (
                    <div style={{ height: '300px', width: '100%' }}>
                        {chartData && <Bar options={options} data={chartData} />}
                    </div>
                )}
            </Card.Body>
        </Card>
    );
};

export default ProductAuditChart;