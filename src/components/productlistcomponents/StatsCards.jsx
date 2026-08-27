import React from 'react';
import { Row, Col } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { GreenButton } from '../ui/buttons/CtaButton';

const StatsCards = ({ stats }) => {
    const navigate = useNavigate();

    return (
        <Row className="align-items-center mb-4 g-3">
            <Col md={12} lg={5} className="d-none d-lg-block">
                {/* CABEÇALHO DESKTOP */}
                <div className="d-none d-lg-flex justify-content-between align-items-center gap-3 px-3 px-lg-0">
                    <div>
                        <h4 className="fw-bold m-0 d-flex align-items-center" style={{ fontSize: '1.25rem', color: 'var(--text-primary, #0F172A)' }}>
                            <i className="bi bi-box-seam me-3 opacity-75"></i>
                            Gestão de Produtos
                        </h4>
                        <small className="mt-1 d-block" style={{ color: 'var(--text-secondary, #64748B)' }}>Catálogo completo e integrações.</small>
                    </div>
                </div>
            </Col>

            {/* CABEÇALHO MOBILE */}
            <Col md={12} className="d-block d-lg-none px-3">
                <div className="d-flex justify-content-between align-items-center">
                    <h4 className="fw-bold m-0 d-flex align-items-center" style={{ fontSize: '1.3rem', color: 'var(--text-primary, #0F172A)' }}>
                        <i className="bi bi-box-seam me-2 opacity-75"></i> Produtos
                    </h4>
                </div>
            </Col>
            
            <Col md={12} lg={7}>
                {/* 👇 AQUI ESTÁ A MÁGICA: d-flex com gap-2 para grudar os itens 👇 */}
                <div className="d-flex flex-wrap flex-sm-nowrap justify-content-lg-end gap-2 px-3 px-lg-0">
                    {[
                        { label: 'TOTAL', value: stats.total, color: 'var(--text-primary, #0F172A)' },
                        { label: 'ATIVOS', value: stats.ativos, color: '#10B981' },
                        { label: 'ML', value: stats.noML, color: '#F59E0B' },
                    ].map((stat, idx) => (
                        <div 
                            key={idx}
                            className="d-flex flex-column justify-content-center align-items-center flex-grow-1 flex-sm-grow-0"
                            style={{ 
                                height: '50px',
                                minWidth: '85px', // Garante que não fiquem esmagados
                                borderRadius: '14px',
                                transition: 'all 0.2s ease'
                            }}
                        >
                            <span className="fw-bolder" style={{ fontSize: '16px', lineHeight: '1', color: stat.color }}>
                                {stat.value}
                            </span>
                            <span className="fw-bold text-uppercase" style={{ fontSize: '9px', letterSpacing: '0.5px', color: 'var(--text-secondary, #64748B)', marginTop: '2px' }}>
                                {stat.label}
                            </span>
                        </div>
                    ))}
                    
                    {/* Botão Novo Produto */}
                    <div className="flex-grow-1 flex-sm-grow-0 mt-2 mt-sm-0" style={{ minWidth: '120px' }}>
                        <GreenButton 
                            onClick={() => navigate('/admin/product/create')}
                            fullWidth={true}
                        >
                            <i className="bi bi-plus-lg"></i>
                            <span className="fw-bold ms-2" style={{ fontSize: '13px' }}>
                                NOVO
                            </span>
                        </GreenButton>
                    </div>
                </div>
            </Col>
        </Row>
    );
};

export default StatsCards;