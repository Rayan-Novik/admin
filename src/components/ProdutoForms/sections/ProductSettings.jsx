import React from 'react';
import { Card, Form, Row, Col } from 'react-bootstrap';

const ProductSettings = ({ formData, handleChange, isCrafting }) => {
    return (
        <Card className="shadow-sm border-0 rounded-4 mb-4">
            <Card.Body className="p-4">
                <h5 className="fw-bold mb-4 text-secondary">Configurações</h5>
                <Row className="g-3">
                    <Col md={6}>
                        <Form.Group>
                            <Form.Label className="fw-medium">Tipo do Produto</Form.Label>
                            <Form.Select 
                                name="tipo_produto" 
                                value={formData.tipo_produto} 
                                onChange={handleChange}
                                disabled={isCrafting} 
                                className={isCrafting ? "bg-light text-muted" : ""}
                            >
                                <option value="FINAL">Produto Final (Venda)</option>
                                <option value="INSUMO">Insumo (Matéria Prima)</option>
                                <option value="MISTO">Misto (Venda + Insumo)</option>
                                <option value="CONSUMO_INTERNO">Uso Interno</option>
                            </Form.Select>
                        </Form.Group>
                    </Col>
                    <Col md={6}>
                        <Form.Group>
                            <Form.Label className="fw-medium">Estoque Mínimo</Form.Label>
                            <Form.Control 
                                type="number" 
                                name="estoque_minimo" 
                                value={formData.estoque_minimo} 
                                onChange={handleChange} 
                                placeholder="Alertar se < X"
                            />
                        </Form.Group>
                    </Col>
                </Row>
            </Card.Body>
        </Card>
    );
};

export default ProductSettings;