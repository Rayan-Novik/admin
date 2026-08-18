import React from 'react';
import { Row, Col, Card, Button } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';

const StatsCards = ({ stats }) => (
    <Row className="align-items-center mb-4 g-3">
        <Col md={12} lg={5} className="d-none d-lg-block">
            <h2 className="fw-bold mb-0 text-dark">Resumo do Catálogo</h2>
            <p className="text-muted mb-0 small">Acompanhamento rápido de estoque.</p>
        </Col>
        <Col md={12} lg={7}>
            <Row className="g-2">
                {[
                    { label: 'TOTAL', value: stats.total, color: 'text-dark' },
                    { label: 'ATIVOS', value: stats.ativos, color: 'text-success' },
                    { label: 'ML', value: stats.noML, color: 'text-warning' },
                ].map((stat, idx) => (
                    <Col key={idx} xs={4} sm={3}>
                        <Card className="border-0 shadow-sm h-100 bg-white clean-card-mobile">
                            <Card.Body className="p-3 text-center d-flex flex-column justify-content-center">
                                <small className="text-muted fw-bold d-block mb-1" style={{ fontSize: '10px' }}>{stat.label}</small>
                                <span className={`fw-bolder fs-5 ${stat.color}`}>{stat.value}</span>
                            </Card.Body>
                        </Card>
                    </Col>
                ))}
                
                {/* Botão Novo Produto */}
                <Col xs={12} sm={3} className="d-flex d-lg-block mt-3 mt-sm-0">
                    <LinkContainer to="/admin/product/create">
                        <Button variant="dark" className="w-100 h-100 rounded-3 shadow-sm d-flex flex-column align-items-center justify-content-center p-3 clean-btn-mobile" style={{ minHeight: '60px' }}>
                            <i className="bi bi-plus-lg fs-5 mb-1 d-none d-sm-block"></i>
                            <span className="fw-bold" style={{ fontSize: '0.8rem' }}><i className="bi bi-plus-lg d-sm-none me-1"></i> NOVO PRODUTO</span>
                        </Button>
                    </LinkContainer>
                </Col>
            </Row>
        </Col>
        
        <style>{`
            @media (max-width: 991px) {
                .clean-btn-mobile {
                    border-radius: 20px !important;
                    background-color: #218cf4 !important; /* Azul destaque no mobile */
                    border: none !important;
                    color: white !important;
                }
            }
        `}</style>
    </Row>
);

export default StatsCards;