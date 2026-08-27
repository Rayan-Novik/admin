import React from 'react';
import { Row, Col, Form } from 'react-bootstrap';
import { CustomInput } from '../../ui/SearchInput/SearchInput';

const ProductSettings = ({ formData, handleChange, isCrafting }) => {
    const isServico = formData.tipo_produto === 'SERVICO';

    return (
        <div className="mb-4">
            <h6 className="text-uppercase fw-bold mb-3 ls-1 mt-4" style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                <i className="bi bi-gear me-2"></i>Configurações do Sistema
            </h6>
            
            <Row className="g-3">
                {isServico ? (
                    <Col md={12}>
                        <div className="p-3 rounded-4 text-muted small text-center" style={{ backgroundColor: 'var(--bg-sidebar, #F4F6FA)', border: '1px solid rgba(100, 116, 139, 0.2)' }}>
                            <i className="bi bi-info-circle me-2"></i>
                            Serviços não possuem controle de estoque mínimo.
                        </div>
                    </Col>
                ) : (
                    <Col md={12}>
                        <Form.Group>
                            <Form.Label className="fw-semibold small text-dark mb-1">Alerta de Estoque Mínimo</Form.Label>
                            <CustomInput 
                                icon="bi-bell"
                                type="number" 
                                name="estoque_minimo" 
                                value={formData.estoque_minimo || ''} 
                                onChange={handleChange} 
                                placeholder="Alertar se o estoque cair abaixo de..."
                            />
                            <Form.Text className="text-muted d-block mt-1" style={{ fontSize: '11px' }}>
                                Você receberá um aviso no Dashboard quando o produto estiver acabando.
                            </Form.Text>
                        </Form.Group>
                    </Col>
                )}
            </Row>
        </div>
    );
};

export default ProductSettings;