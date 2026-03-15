import React from 'react';
import { Row, Col, Card, Button } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';

const StatsCards = ({ stats }) => (
    <Row className="align-items-center mb-4 g-3">
        <Col md={12} lg={5}>
            <h2 className="fw-bold mb-0 text-dark">Gerenciar Produtos</h2>
            <p className="text-muted mb-0 small">Catálogo completo e integrações.</p>
        </Col>
        <Col md={12} lg={7}>
            <Row className="g-2">
                {[
                    { label: 'TOTAL', value: stats.total, color: 'text-dark' },
                    { label: 'ATIVOS', value: stats.ativos, color: 'text-success' },
                    { label: 'ML', value: stats.noML, color: 'text-warning' },
                ].map((stat, idx) => (
                    <Col key={idx} xs={6} sm={3}>
                        <Card className="border-0 shadow-sm h-100 bg-white">
                            <Card.Body className="p-2 text-center">
                                <small className="text-muted fw-bold d-block" style={{ fontSize: '0.65rem' }}>{stat.label}</small>
                                <span className={`fw-bold ${stat.color}`}>{stat.value}</span>
                            </Card.Body>
                        </Card>
                    </Col>
                ))}
                <Col xs={6} sm={3}>
                    <LinkContainer to="/admin/product/create">
                        <Button variant="dark" className="w-100 h-100 rounded-3 shadow-sm d-flex flex-column align-items-center justify-content-center p-0">
                            <i className="bi bi-plus-lg fs-5"></i>
                            <span style={{ fontSize: '0.7rem' }}>NOVO</span>
                        </Button>
                    </LinkContainer>
                </Col>
            </Row>
        </Col>
    </Row>
);

export default StatsCards;