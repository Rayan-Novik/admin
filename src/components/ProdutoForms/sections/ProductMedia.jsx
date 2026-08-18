import React from 'react';
import { Card, Form, Row, Col, Button } from 'react-bootstrap';
import ImageUploader from '../../common/ImageUploader';

// 🟢 Adicionamos a prop `podeEditar` que vem do form principal
const ProductMedia = ({ formData, setFormData, subImages, setSubImages, podeEditar = true }) => {

    const handleSubImageUpload = (index, newUrl) => {
        if (!podeEditar) return; // Trava de segurança
        const newSub = [...subImages]; 
        newSub[index] = newUrl; 
        setSubImages(newSub);
    };

    const addField = () => {
        if (!podeEditar) return; // Trava de segurança
        if (subImages.length < 11) setSubImages([...subImages, '']);
    };

    const removeField = (index) => {
        if (!podeEditar) return; // Trava de segurança
        if (subImages.length > 1) setSubImages(subImages.filter((_, i) => i !== index));
    };

    return (
            <Card.Body className="p-4">
                <h5 className="fw-bold mb-4" style={{ color: 'var(--text-primary)' }}>
                    <i className="bi bi-images me-2 text-primary"></i>Mídia
                </h5>
                
                {/* Imagem Principal */}
                <div className="mb-4">
                    <Form.Label className="fw-medium" style={{ color: 'var(--text-secondary)' }}>Imagem Principal</Form.Label>
                    <div className="p-3 d-flex flex-column align-items-center" style={{ backgroundColor: 'var(--bg-main)', borderColor: 'var(--border-color)' }}>
                        <ImageUploader 
                            label="Principal" 
                            imageUrl={formData.imagem_url} 
                            onImageUpload={(url) => podeEditar && setFormData(prev => ({ ...prev, imagem_url: url }))} 
                            podeEditar={podeEditar} // 🟢 Passamos para o componente interno
                        />
                    </div>
                </div>

                {/* Galeria */}
                <label className="fw-medium mb-3" style={{ color: 'var(--text-secondary)' }}>Galeria Adicional</label>
                <Row className="g-3">
                    {subImages.map((url, index) => (
                        <Col key={index} xs={6} sm={4} md={3}>
                            <div className="p-2 border rounded-3 text-center h-100 d-flex flex-column justify-content-between" style={{ backgroundColor: 'var(--bg-main)', borderColor: 'var(--border-color)' }}>
                                <ImageUploader 
                                    imageUrl={url} 
                                    onImageUpload={(u) => podeEditar && handleSubImageUpload(index, u)} 
                                    isSubImage 
                                    podeEditar={podeEditar} // 🟢 Passamos para o componente interno
                                />
                                {/* 🟢 SÓ MOSTRA O BOTÃO REMOVER SE PUDER EDITAR */}
                                {podeEditar && subImages.length > 1 && (
                                    <Button variant="link" size="sm" className="text-danger p-0 mt-2 text-decoration-none fw-bold" onClick={() => removeField(index)}>
                                        <small><i className="bi bi-trash3-fill me-1"></i>Remover</small>
                                    </Button>
                                )}
                            </div>
                        </Col>
                    ))}
                    
                    {/* 🟢 SÓ MOSTRA O BOTAO DE ADICIONAR SE PUDER EDITAR */}
                    {podeEditar && subImages.length < 11 && (
                        <Col xs={6} sm={4} md={3}>
                            <Button 
                                variant="outline-secondary" 
                                onClick={addField} 
                                className="w-100 h-100 d-flex flex-column justify-content-center align-items-center border-dashed rounded-3" 
                                style={{ minHeight: '120px', borderStyle: 'dashed', borderColor: 'var(--text-secondary)', opacity: 0.7 }}
                            >
                                <i className="bi bi-plus-circle fs-3 mb-1"></i>
                                <small className="fw-medium">Adicionar</small>
                            </Button>
                        </Col>
                    )}
                </Row>
            </Card.Body>
    );
};

export default ProductMedia;