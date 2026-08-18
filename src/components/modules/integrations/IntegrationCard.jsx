import React from 'react';
import { Col, Card, Badge } from 'react-bootstrap';

const IntegrationCard = ({ title, status, icon, color, onClick, textColor = 'white', active }) => {
    return (
        <Col md={3}>
            <Card 
                className="shadow-sm h-100 border-0 integration-card overflow-hidden" 
                onClick={onClick} 
                style={{ cursor: 'pointer', backgroundColor: color, color: textColor }}
            >
                <Card.Body className="d-flex flex-column align-items-center justify-content-center text-center p-4">
                    <div className="mb-3 p-2 bg-white rounded-circle shadow-sm" style={{width: '80px', height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                        <img src={icon} alt={title} style={{ width: '50px', height: '50px', objectFit: 'contain' }} />
                    </div>
                    <h5 className="fw-bold mb-1">{title}</h5>
                    <div className="mt-3">
                        {status ? (
                            <Badge bg="success" className="px-3 py-2 fw-normal border border-white">
                                <i className="bi bi-check-circle-fill me-1"></i> {active === false ? 'Pausado' : 'Conectado'}
                            </Badge>
                        ) : (
                            <Badge bg="light" text="dark" className="px-3 py-2 fw-normal opacity-75">
                                Não Configurado
                            </Badge>
                        )}
                    </div>
                </Card.Body>
            </Card>
        </Col>
    );
};

export default IntegrationCard;