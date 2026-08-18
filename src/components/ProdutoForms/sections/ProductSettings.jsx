import React from 'react';
import { Row, Col } from 'react-bootstrap';
import UiField from '../../ui/UiField';

const ProductSettings = ({ formData, handleChange, isCrafting }) => {
    // 🟢 VERIFICADOR DE TIPO
    const isServico = formData.tipo_produto === 'SERVICO';

    return (
        <div className="p-4">
            <h6 className="text-uppercase fw-bold mb-4 ls-1" style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                Configurações do Sistema
            </h6>
            
            <Row className="g-3">
                {isServico ? (
                    <Col md={12}>
                        <div className="p-3 bg-light rounded text-muted small text-center border">
                            <i className="bi bi-info-circle me-2"></i>
                            Serviços não possuem controle de estoque mínimo.
                        </div>
                    </Col>
                ) : (
                    <Col md={12}>
                        <UiField 
                            label="Alerta de Estoque Mínimo" 
                            type="number" 
                            name="estoque_minimo" 
                            value={formData.estoque_minimo} 
                            onChange={handleChange} 
                            placeholder="Alertar se o estoque cair abaixo de X"
                            hint="Você receberá um aviso no Dashboard quando o produto estiver acabando."
                        />
                    </Col>
                )}
            </Row>
        </div>
    );
};

export default ProductSettings;