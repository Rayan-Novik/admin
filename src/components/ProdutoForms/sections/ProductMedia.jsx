import React from 'react';
import { Form, Row, Col } from 'react-bootstrap';
import ImageUploader from '../../common/ImageUploader';

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
        <div className="mt-4">
            <hr className="opacity-25 my-4" style={{ borderColor: 'var(--border-color)' }} />
            
            {/* 🟢 CABEÇALHO DA SESSÃO PADRONIZADO */}
            <h6 className="text-uppercase fw-bold mb-3 ls-1" style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                <i className="bi bi-images me-2"></i>Mídia e Galeria
            </h6>
            
            {/* 🟢 IMAGEM PRINCIPAL */}
            <Form.Group className="mb-4">
                <Form.Label className="fw-semibold small text-dark mb-1">Imagem Principal</Form.Label>
                <div 
                    className="p-3 d-flex flex-column align-items-center rounded-4 flat-border" 
                    style={{ backgroundColor: 'var(--bg-sidebar, #F4F6FA)' }}
                >
                    <ImageUploader 
                        label="Principal" 
                        imageUrl={formData.imagem_url} 
                        onImageUpload={(url) => podeEditar && setFormData(prev => ({ ...prev, imagem_url: url }))} 
                        podeEditar={podeEditar} 
                    />
                </div>
            </Form.Group>

            {/* 🟢 GALERIA ADICIONAL */}
            <Form.Group className="mb-3">
                <Form.Label className="fw-semibold small text-dark mb-1">Galeria Adicional</Form.Label>
                <Row className="g-3">
                    {subImages.map((url, index) => (
                        <Col key={index} xs={6} sm={4} md={3}>
                            <div 
                                className="p-2 rounded-4 text-center h-100 d-flex flex-column justify-content-between flat-border" 
                                style={{ backgroundColor: 'var(--bg-sidebar, #F4F6FA)' }}
                            >
                                <ImageUploader 
                                    imageUrl={url} 
                                    onImageUpload={(u) => podeEditar && handleSubImageUpload(index, u)} 
                                    isSubImage 
                                    podeEditar={podeEditar} 
                                />
                                
                                {/* Botão Remover Limpo */}
                                {podeEditar && subImages.length > 1 && (
                                    <button 
                                        type="button"
                                        className="btn btn-link text-danger p-0 mt-2 text-decoration-none fw-bold hover-opacity" 
                                        onClick={() => removeField(index)}
                                        style={{ fontSize: '12px' }}
                                    >
                                        <i className="bi bi-trash3-fill me-1"></i>Remover
                                    </button>
                                )}
                            </div>
                        </Col>
                    ))}
                    
                    {/* Botão Adicionar Tracejado Flat */}
                    {podeEditar && subImages.length < 11 && (
                        <Col xs={6} sm={4} md={3}>
                            <button 
                                type="button"
                                onClick={addField} 
                                className="w-100 h-100 d-flex flex-column justify-content-center align-items-center rounded-4 add-gallery-btn" 
                            >
                                <i className="bi bi-plus-circle fs-3 mb-1"></i>
                                <small className="fw-bold">Adicionar</small>
                            </button>
                        </Col>
                    )}
                </Row>
            </Form.Group>

            {/* ====== ESTILOS FLAT ====== */}
            <style>{`
                /* Borda universal suave */
                .flat-border {
                    border: 1px solid rgba(100, 116, 139, 0.2);
                }

                /* Botão de adicionar imagem (Tracejado limpo) */
                .add-gallery-btn {
                    min-height: 120px;
                    background-color: transparent;
                    border: 2px dashed rgba(100, 116, 139, 0.3);
                    color: var(--text-secondary, #64748B);
                    transition: all 0.2s ease;
                }
                .add-gallery-btn:hover {
                    border-color: rgba(10, 132, 255, 0.5);
                    color: #0A84FF;
                    background-color: rgba(10, 132, 255, 0.05);
                }

                /* Efeito suave no botão de remover */
                .hover-opacity {
                    opacity: 0.8;
                    transition: opacity 0.2s;
                }
                .hover-opacity:hover {
                    opacity: 1;
                }
            `}</style>
        </div>
    );
};

export default ProductMedia;