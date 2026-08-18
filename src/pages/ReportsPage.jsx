import React, { useState } from 'react';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';

import { FaturamentoReport } from '../components/relatorios/FaturamentoReport';
import { LucratividadeReport } from '../components/relatorios/LucratividadeReport';

const reportTypes = [
    {
        id: 'faturamento',
        title: 'Faturamento Bruto',
        description: 'Extrato detalhado de todos os pedidos aprovados.',
        icon: 'bi-cash-coin',
        theme: 'success'
    },
    {
        id: 'produtos-vendidos',
        title: 'Produtos Mais Vendidos',
        description: 'Ranking de volume e receita com filtro de datas.',
        icon: 'bi-box-seam',
        theme: 'primary'
    },
    {
        id: 'custos',
        title: 'DRE de Produtos',
        description: 'Custo de mercadorias vendidas e margem de lucro.',
        icon: 'bi-graph-down-arrow',
        theme: 'danger'
    }
];

const ReportsPage = () => {
    const [activeReport, setActiveReport] = useState(null);

    const renderActiveReport = () => {
        switch (activeReport) {
            case 'faturamento': return <FaturamentoReport />;
            case 'custos': return <LucratividadeReport />;
            case 'produtos-vendidos':
                return (
                    <div className="p-5 text-center rounded-4 border shadow-sm" style={{ backgroundColor: 'var(--bg-sidebar)', borderColor: 'var(--border-color)' }}>
                        <i className="bi bi-tools fs-1 mb-3 d-block opacity-50" style={{ color: 'var(--text-secondary)' }}></i>
                        <span style={{ color: 'var(--text-secondary)' }}>Relatório de Produtos em desenvolvimento...</span>
                    </div>
                );
            default: return null;
        }
    };

    return (
        <div style={{ backgroundColor: 'var(--bg-main, #f8fafc)', minHeight: '100vh', paddingBottom: '3rem', transition: 'background-color 0.2s ease' }}>
            <Container fluid="lg" className="pt-4">
                
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <h4 className="fw-bold m-0 fs-3 d-flex align-items-center gap-3" style={{ color: 'var(--text-primary)' }}>
                            {activeReport ? (
                                <Button 
                                    variant="light" 
                                    className="border shadow-sm rounded-circle p-0 d-flex align-items-center justify-content-center btn-voltar" 
                                    style={{ width: '45px', height: '45px', backgroundColor: 'var(--bg-sidebar)', borderColor: 'var(--border-color)' }}
                                    onClick={() => setActiveReport(null)}
                                >
                                    <i className="bi bi-arrow-left fs-5" style={{ color: 'var(--text-primary)' }}></i>
                                </Button>
                            ) : (
                                <div className="border shadow-sm rounded-circle d-flex align-items-center justify-content-center" style={{ width: '45px', height: '45px', backgroundColor: 'var(--bg-sidebar)', borderColor: 'var(--border-color)' }}>
                                    <i className="bi bi-bar-chart-line text-primary fs-5"></i>
                                </div>
                            )}
                            Central de Relatórios
                        </h4>
                        <p className="mt-2 mb-0 small" style={{ marginLeft: '60px', color: 'var(--text-secondary)' }}>
                            {activeReport ? 'Visualizando relatório detalhado.' : 'Selecione o relatório que deseja analisar para sua loja.'}
                        </p>
                    </div>
                </div>

                {!activeReport ? (
                    <Row className="g-4 fade-in">
                        {reportTypes.map((report) => (
                            <Col md={6} lg={4} key={report.id}>
                                <Card 
                                    className="h-100 border-0 shadow-sm rounded-4 report-card cursor-pointer"
                                    onClick={() => setActiveReport(report.id)}
                                    style={{ backgroundColor: 'var(--bg-sidebar)', border: '1px solid var(--border-color)' }}
                                >
                                    <Card.Body className="p-4 d-flex flex-column">
                                        <div className={`bg-${report.theme} bg-opacity-10 text-${report.theme} rounded-4 d-flex align-items-center justify-content-center mb-4`} style={{ width: '60px', height: '60px' }}>
                                            <i className={`bi ${report.icon} fs-3`}></i>
                                        </div>
                                        <h5 className="fw-bold mb-2" style={{ color: 'var(--text-primary)' }}>{report.title}</h5>
                                        <p className="small mb-4" style={{ color: 'var(--text-secondary)' }}>{report.description}</p>
                                        
                                        <div className="mt-auto pt-3 border-top" style={{ borderColor: 'var(--border-color)' }}>
                                            <span className="small fw-bold text-primary d-flex align-items-center gap-2">
                                                Gerar Relatório <i className="bi bi-arrow-right"></i>
                                            </span>
                                        </div>
                                    </Card.Body>
                                </Card>
                            </Col>
                        ))}
                    </Row>
                ) : (
                    <div className="mt-4 fade-in">
                        {renderActiveReport()}
                    </div>
                )}
            </Container>

            <style>{`
                .cursor-pointer { cursor: pointer; } 
                .report-card { transition: all 0.3s ease; border: 1px solid transparent !important; } 
                .report-card:hover { transform: translateY(-5px); box-shadow: 0 10px 25px rgba(0,0,0,0.05) !important; border-color: var(--border-color) !important; } 
                
                .btn-voltar { transition: all 0.2s; }
                .btn-voltar:hover { transform: scale(1.05); } 
                
                .fade-in { animation: fadeIn 0.4s ease-in-out; } 
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

                /* Ajustes Dark Mode */
                body.dark-mode .report-card { box-shadow: 0 4px 6px rgba(0,0,0,0.3) !important; border: 1px solid var(--border-color) !important; }
                body.dark-mode .report-card:hover { box-shadow: 0 10px 25px rgba(0,0,0,0.5) !important; background-color: var(--bg-hover) !important; }
                
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                .spin { animation: spin 1s linear infinite; display: inline-block; }
            `}</style>
        </div>
    );
};

export default ReportsPage;