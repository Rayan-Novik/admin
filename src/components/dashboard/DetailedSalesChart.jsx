import React, { useState, useEffect, useRef } from 'react';
import { Card, Spinner } from 'react-bootstrap';
import { Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';
import api from '../../services/api';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

// --- Hook para detectar Mobile ---
const useIsMobile = (breakpoint = 768) => {
    const [isMobile, setIsMobile] = useState(window.innerWidth < breakpoint);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < breakpoint);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [breakpoint]);

    return isMobile;
};

// ✅ Componente Atualizado: Recebe dateRange e isMlEnabled
const DetailedSalesChart = ({ dateRange, isMlEnabled }) => {
    const [chartData, setChartData] = useState(null);
    const [loading, setLoading] = useState(true);
    const isMobile = useIsMobile();
    const chartRef = useRef(null);

    // Função para criar gradiente
    const createGradient = (ctx, colorStart, colorEnd) => {
        const gradient = ctx.createLinearGradient(0, 0, 0, 400);
        gradient.addColorStop(0, colorStart);
        gradient.addColorStop(1, colorEnd);
        return gradient;
    };

    useEffect(() => {
        const fetchChartData = async () => {
            // Se as datas não estiverem definidas, não busca (evita erro inicial)
            if (!dateRange || !dateRange.startDate || !dateRange.endDate) return;

            setLoading(true);
            try {
                // Passa as datas via Query Params para o Backend
                const { data } = await api.get(`/dashboard/detailed-sales-chart?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`);

                // Configurações visuais baseadas no dispositivo
                const pointRadius = isMobile ? 0 : 4; 
                const pointHoverRadius = 6;
                const tension = 0.4; 

                // ✅ 1. Cria o dataset base (Site Próprio)
                const datasets = [
                    {
                        label: 'Site Próprio',
                        data: data.ecommerceData,
                        borderColor: '#0d6efd',
                        backgroundColor: (context) => {
                            const ctx = context.chart.ctx;
                            return createGradient(ctx, 'rgba(13, 110, 253, 0.25)', 'rgba(13, 110, 253, 0.0)');
                        },
                        fill: true,
                        tension,
                        borderWidth: 2,
                        pointRadius,
                        pointHoverRadius,
                        pointBackgroundColor: '#fff',
                        pointBorderColor: '#0d6efd',
                        pointBorderWidth: 2,
                    }
                ];

                // ✅ 2. Adiciona Mercado Livre APENAS se a API estiver ativa
                if (isMlEnabled) {
                    datasets.push({
                        label: 'Mercado Livre',
                        data: data.mlData,
                        borderColor: '#ffc107', // Amarelo ML
                        backgroundColor: (context) => {
                            const ctx = context.chart.ctx;
                            return createGradient(ctx, 'rgba(255, 193, 7, 0.25)', 'rgba(255, 193, 7, 0.0)');
                        },
                        fill: true,
                        tension,
                        borderWidth: 2,
                        pointRadius,
                        pointHoverRadius,
                        pointBackgroundColor: '#fff',
                        pointBorderColor: '#ffc107',
                        pointBorderWidth: 2,
                    });
                }
                
                setChartData({
                    labels: data.labels,
                    datasets: datasets
                });
            } catch (err) {
                console.error('Erro ao carregar gráfico:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchChartData();
    }, [isMobile, dateRange, isMlEnabled]); // ✅ Adicionado isMlEnabled nas dependências

    // --- Configurações do Gráfico ---
    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: isMobile ? 'bottom' : 'top',
                align: isMobile ? 'center' : 'end',
                labels: {
                    usePointStyle: true,
                    boxWidth: 8,
                    padding: 20,
                    font: { family: "'Inter', sans-serif", size: 12 }
                }
            },
            title: {
                display: true,
                text: 'Faturamento Diário',
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
                borderWidth: 1,
                padding: 10,
                boxPadding: 4,
                callbacks: {
                    label: function(context) {
                        let label = context.dataset.label || '';
                        if (label) {
                            label += ': ';
                        }
                        if (context.parsed.y !== null) {
                            label += new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(context.parsed.y);
                        }
                        return label;
                    }
                }
            }
        },
        scales: {
            x: {
                grid: { display: false },
                ticks: {
                    display: !isMobile, 
                    font: { size: 11 },
                    color: '#adb5bd'
                }
            },
            y: {
                beginAtZero: true,
                border: { display: false }, 
                grid: { color: '#f8f9fa' }, 
                ticks: {
                    font: { size: 11 },
                    color: '#adb5bd',
                    callback: function(value) {
                        if (value >= 1000) return 'R$ ' + (value / 1000) + 'k';
                        return 'R$ ' + value;
                    }
                }
            }
        },
        interaction: {
            mode: 'nearest',
            axis: 'x',
            intersect: false
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
                    <div style={{ height: isMobile ? '250px' : '350px', width: '100%' }}>
                        {chartData && <Line ref={chartRef} options={options} data={chartData} />}
                    </div>
                )}
            </Card.Body>
        </Card>
    );
};

export default DetailedSalesChart;