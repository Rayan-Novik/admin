import React, { useState, useEffect } from 'react';
import { Spinner, OverlayTrigger, Tooltip as BsTooltip } from 'react-bootstrap';
import { Bar } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Tooltip,
    Legend
} from 'chart.js';
import api from '../../services/api';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const InfoTooltip = ({ text }) => (
    <OverlayTrigger placement="top" overlay={<BsTooltip>{text}</BsTooltip>}>
        <i className="bi bi-info-circle text-muted opacity-50" style={{ cursor: 'help', fontSize: '14px' }}></i>
    </OverlayTrigger>
);

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
                            backgroundColor: '#22c55e', 
                            borderRadius: 4,
                            barPercentage: 0.6,
                        },
                        {
                            label: 'Edições/Atualizações',
                            data: data.dataEdicao,
                            backgroundColor: '#eab308', 
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
                labels: { usePointStyle: true, boxWidth: 8, font: { size: 11, family: "'Inter', sans-serif" }, color: '#64748b' }
            },
            tooltip: {
                mode: 'index',
                intersect: false,
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                titleColor: '#0f172a',
                bodyColor: '#475569',
                borderColor: '#e2e8f0',
                borderWidth: 1
            }
        },
        scales: {
            x: { 
                stacked: true, 
                grid: { display: false },
                ticks: { font: { size: 11 }, color: '#94a3b8' }
            },
            y: { 
                stacked: true, 
                beginAtZero: true, 
                border: { display: false, dash: [4, 4] },
                grid: { color: '#f1f5f9', tickLength: 0 },
                ticks: { font: { size: 11 }, color: '#94a3b8', stepSize: 1, padding: 10 } 
            }
        }
    };

    return (
        <div className="clean-card product-audit-card h-100 p-4 d-flex flex-column mb-4">
            <div className="section-title mb-4 d-flex justify-content-between align-items-center">
                <div className="product-audit-title">
                    <i className="bi bi-box-seam me-2 text-muted title-icon"></i>
                    Atividade no catálogo
                </div>
                <InfoTooltip text="Monitoramento de adições e edições de produtos no período." />
            </div>

            <div className="flex-grow-1 position-relative">
                {loading ? (
                    <div className="d-flex justify-content-center align-items-center h-100" style={{ minHeight: '200px' }}>
                        <Spinner animation="border" variant="secondary" size="sm" />
                    </div>
                ) : (
                    <div style={{ height: '300px', width: '100%' }}>
                        {chartData && <Bar options={options} data={chartData} />}
                    </div>
                )}
            </div>

            <style>{`
                /* ====== PADRONIZAÇÃO EXCLUSIVA PARA O MOBILE ====== */
                .mobile-dashboard-wrapper .product-audit-card {
                    padding: 25px 20px !important;
                }
                .mobile-dashboard-wrapper .product-audit-title {
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

export default ProductAuditChart;