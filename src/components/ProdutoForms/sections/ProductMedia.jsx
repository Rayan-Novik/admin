import React, { useState } from 'react';
import { Card, Form, Row, Col, Button } from 'react-bootstrap';
import ImageUploader from '../../common/ImageUploader';
import MediaGalleryModal from '../../common/MediaGalleryModal';

const ProductMedia = ({ formData, setFormData, subImages, setSubImages }) => {
    const [showGallery, setShowGallery] = useState(false);
    const [galleryTarget, setGalleryTarget] = useState(null);

    const handleSubImageUpload = (index, newUrl) => {
        const newSub = [...subImages]; newSub[index] = newUrl; setSubImages(newSub);
    };

    const addField = () => subImages.length < 11 && setSubImages([...subImages, '']);
    const removeField = (index) => subImages.length > 1 && setSubImages(subImages.filter((_, i) => i !== index));

    const openGallery = (target) => { setGalleryTarget(target); setShowGallery(true); };
    
    const handleSelect = (url) => {
        if (galleryTarget.type === 'main') setFormData(prev => ({ ...prev, imagem_url: url }));
        else handleSubImageUpload(galleryTarget.index, url);
    };

    return (
        <>
            <Card className="shadow-sm border-0 rounded-4 mb-4">
                <Card.Body className="p-4">
                    <h5 className="fw-bold mb-4 text-secondary"><i className="bi bi-images me-2"></i>Mídia</h5>
                    
                    {/* Imagem Principal */}
                    <div className="mb-4">
                        <Form.Label className="fw-medium">Imagem Principal</Form.Label>
                        <div className="p-3 border rounded-3 bg-light d-flex flex-column align-items-center">
                            <ImageUploader label="Principal" imageUrl={formData.imagem_url} onImageUpload={(url) => setFormData(prev => ({ ...prev, imagem_url: url }))} />
                            <Button variant="link" size="sm" onClick={() => openGallery({ type: 'main' })} className="mt-2 text-decoration-none"><i className="bi bi-collection"></i> Biblioteca</Button>
                        </div>
                    </div>

                    {/* Galeria */}
                    <label className="fw-medium mb-3">Galeria Adicional</label>
                    <Row className="g-3">
                        {subImages.map((url, index) => (
                            <Col key={index} xs={6} sm={4} md={3}>
                                <div className="p-2 border rounded-3 text-center bg-light h-100 d-flex flex-column justify-content-between">
                                    <ImageUploader imageUrl={url} onImageUpload={(u) => handleSubImageUpload(index, u)} isSubImage />
                                    <Button variant="link" size="sm" onClick={() => openGallery({ type: 'sub', index })} className="p-0 my-1" style={{fontSize: '0.8rem'}}>Biblioteca</Button>
                                    {subImages.length > 1 && <Button variant="link" size="sm" className="text-danger p-0" onClick={() => removeField(index)}><small>Remover</small></Button>}
                                </div>
                            </Col>
                        ))}
                        {subImages.length < 11 && (
                            <Col xs={6} sm={4} md={3}>
                                <Button variant="outline-secondary" onClick={addField} className="w-100 h-100 d-flex flex-column justify-content-center align-items-center border-dashed rounded-3" style={{minHeight: '120px', borderStyle: 'dashed'}}><i className="bi bi-plus-circle fs-3"></i></Button>
                            </Col>
                        )}
                    </Row>
                </Card.Body>
            </Card>
            <MediaGalleryModal show={showGallery} onHide={() => setShowGallery(false)} onSelect={handleSelect} />
        </>
    );
};

export default ProductMedia;