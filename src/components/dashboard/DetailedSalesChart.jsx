import React, { useState, useEffect, useRef } from 'react';
import { Spinner, OverlayTrigger, Tooltip as BsTooltip } from 'react-bootstrap';
import { Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';
import api from '../../services/api';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler);

const useIsMobile = (breakpoint = 768) => {
    const [isMobile, setIsMobile] = useState(window.innerWidth < breakpoint);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < breakpoint);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [breakpoint]);

    return isMobile;
};

const InfoTooltip = ({ text }) => (
    <OverlayTrigger placement="top" overlay={<BsTooltip>{text}</BsTooltip>}>
        <i className="bi bi-info-circle text-muted opacity-50" style={{ cursor: 'help', fontSize: '14px' }}></i>
    </OverlayTrigger>
);

const DetailedSalesChart = ({ dateRange, isMlEnabled }) => {
    const [chartData, setChartData] = useState(null);
    const [loading, setLoading] = useState(true);
    const isMobile = useIsMobile();
    const chartRef = useRef(null);

    const createGradient = (ctx, colorStart, colorEnd) => {
        const gradient = ctx.createLinearGradient(0, 0, 0, 400);
        gradient.addColorStop(0, colorStart);
        gradient.addColorStop(1, colorEnd);
        return gradient;
    };

    useEffect(() => {
        const fetchChartData = async () => {
            if (!dateRange || !dateRange.startDate || !dateRange.endDate) return;

            setLoading(true);
            try {
                const { data } = await api.get(`/dashboard/detailed-sales-chart?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`);

                const pointRadius = isMobile ? 0 : 4; 
                const pointHoverRadius = 6;
                const tension = 0.4; 

                const datasets = [
                    {
                        label: 'Site Próprio',
                        data: data.ecommerceData,
                        borderColor: '#0d6efd',
                        backgroundColor: (context) => {
                            const ctx = context.chart.ctx;
                            return createGradient(ctx, 'rgba(13, 110, 253, 0.15)', 'rgba(13, 110, 253, 0.0)');
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

                if (isMlEnabled) {
                    datasets.push({
                        label: 'Mercado Livre',
                        data: data.mlData,
                        borderColor: '#ffc107',
                        backgroundColor: (context) => {
                            const ctx = context.chart.ctx;
                            return createGradient(ctx, 'rgba(255, 193, 7, 0.15)', 'rgba(255, 193, 7, 0.0)');
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
            } finally {
                setLoading(false);
            }
        };

        fetchChartData();
    }, [isMobile, dateRange, isMlEnabled]);

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
                    font: { family: "'Inter', sans-serif", size: 12 },
                    color: '#64748b'
                }
            },
            title: {
                display: false 
            },
            tooltip: {
                mode: 'index',
                intersect: false,
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                titleColor: '#0f172a',
                bodyColor: '#475569',
                borderColor: '#e2e8f0',
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
                    color: '#94a3b8'
                }
            },
            y: {
                beginAtZero: true,
                border: { display: false, dash: [4, 4] }, 
                grid: { color: '#f1f5f9', tickLength: 0 }, 
                ticks: {
                    font: { size: 11 },
                    color: '#94a3b8',
                    padding: 10,
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
        <div className="clean-card detailed-sales-card h-100 p-4 d-flex flex-column mb-4">
            <div className="section-title mb-4 d-flex justify-content-between align-items-center">
                <div className="detailed-sales-title">
                    <i className="bi bi-speedometer2 me-2 text-muted title-icon"></i> 
                    Desempenho de vendas
                </div>
                <InfoTooltip text="Acompanhamento diário do faturamento da sua loja." />
            </div>

            <div className="flex-grow-1 position-relative">
                {loading ? (
                    <div className="d-flex justify-content-center align-items-center h-100" style={{ minHeight: '250px' }}>
                        <Spinner animation="border" variant="secondary" size="sm" />
                    </div>
                ) : (
                    <div style={{ height: isMobile ? '250px' : '300px', width: '100%' }}>
                        {chartData && <Line ref={chartRef} options={options} data={chartData} />}
                    </div>
                )}
            </div>
            
            <style>{`
                /* ====== PADRONIZAÇÃO EXCLUSIVA PARA O MOBILE ====== */
                .mobile-dashboard-wrapper .detailed-sales-card {
                    padding: 25px 20px !important;
                }
                .mobile-dashboard-wrapper .detailed-sales-title {
                    font-size: 12px !important;
                    font-weight: 800 !important;
                    color: #000 !important;
                }
                .mobile-dashboard-wrapper .title-icon {
                    display: none !important; 
                }
            `}</style>
        </div>
    );
};

export default DetailedSalesChart;