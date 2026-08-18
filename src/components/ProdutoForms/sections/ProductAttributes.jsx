import React from 'react';
import { Card, Form, Row, Col, InputGroup, Button, Image, Spinner } from 'react-bootstrap';

const ProductAttributes = ({ 
    showMlAttributes, 
    handleToggleMercadoLivre, 
    formData, 
    setShowCategoryBrowser, 
    isFetchingAttributes, 
    categoryAttributes, 
    dynamicAttrValues, 
    handleDynamicAttrChange, 
    gtinNaoSeAplica, 
    handleGtinNaChange 
}) => {

    // Helper interno para renderizar o tipo correto de input
    const renderAttributeInput = (attr) => {
        if (attr.value_type === 'boolean') {
            return (
                <Form.Select name={attr.id} value={dynamicAttrValues[attr.id] || ''} onChange={handleDynamicAttrChange}>
                    <option value="">Selecione...</option>
                    <option value="Sim">Sim</option>
                    <option value="Não">Não</option>
                </Form.Select>
            );
        }
        if (attr.values && attr.values.length > 0) {
            return (
                <Form.Select name={attr.id} value={dynamicAttrValues[attr.id] || ''} onChange={handleDynamicAttrChange}>
                    <option value="">Selecione...</option>
                    {attr.values.map(val => <option key={val.id} value={val.name}>{val.name}</option>)}
                </Form.Select>
            );
        }
        return (
            <Form.Control 
                type="text" 
                name={attr.id} 
                value={dynamicAttrValues[attr.id] || ''} 
                onChange={handleDynamicAttrChange} 
                placeholder={attr.tags?.hint || ''} 
                disabled={attr.id === 'GTIN' && gtinNaoSeAplica} 
            />
        );
    };

    return (
        <Card className="shadow-sm border-0 rounded-4">
            <Card.Header className="bg-white p-3 border-bottom-0">
                <h6 className="fw-bold text-dark m-0"><i className="bi bi-plug me-2"></i>Marketplaces</h6>
            </Card.Header>
            <Card.Body className="p-0">
                <div className="p-4">
                    <div className="d-flex align-items-center justify-content-between mb-3">
                        <div className="d-flex align-items-center">
                            <div className="bg-warning bg-opacity-25 p-2 rounded-circle me-3">
                                <Image src="https://logospng.org/download/mercado-livre/logo-mercado-livre-256.png" alt="ML" width="20" style={{ filter: 'grayscale(100%) opacity(0.8)' }} />
                            </div>
                            <span className="fw-bold text-dark">Mercado Livre</span>
                        </div>
                        <Form.Check type="switch" id="ml-publish-switch" checked={showMlAttributes} onChange={handleToggleMercadoLivre} className="fs-5"/>
                    </div>

                    {showMlAttributes && (
                        <div className="bg-light bg-opacity-50 p-3 rounded-3 mt-2">
                            <Form.Group className="mb-3">
                                <Form.Label className="fw-medium small">Categoria ML</Form.Label>
                                <InputGroup>
                                    <Form.Control value={formData.ml_category_id || 'Nenhuma selecionada'} readOnly className="bg-white" />
                                    <Button variant="warning" onClick={() => setShowCategoryBrowser(true)}><i className="bi bi-search me-1"></i> Buscar</Button>
                                </InputGroup>
                            </Form.Group>

                            {isFetchingAttributes && (
                                <div className="text-center py-2">
                                    <Spinner animation="border" variant="warning" size="sm" />
                                    <span className="ms-2 small text-muted">Carregando atributos...</span>
                                </div>
                            )}

                            <Row className="g-3">
                                {categoryAttributes.map(attr => (
                                    ((attr.tags.required || attr.tags.catalog_required) || attr.id === 'GTIN') && !attr.tags.read_only && (
                                        <Col md={6} key={attr.id}>
                                            <Form.Group>
                                                <Form.Label className="small fw-bold text-muted">
                                                    {attr.name} {attr.tags.required && <span className="text-danger">*</span>}
                                                </Form.Label>
                                                {renderAttributeInput(attr)}
                                                {attr.id === 'GTIN' && (
                                                    <Form.Check 
                                                        type="checkbox" 
                                                        label="Não tenho código" 
                                                        className="mt-2 small text-muted" 
                                                        checked={gtinNaoSeAplica} 
                                                        onChange={handleGtinNaChange} 
                                                    />
                                                )}
                                            </Form.Group>
                                        </Col>
                                    )
                                ))}
                            </Row>
                        </div>
                    )}
                </div>
            </Card.Body>
        </Card>
    );
};

export default ProductAttributes;