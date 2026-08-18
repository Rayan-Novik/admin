import React from 'react';
import { Spinner, Row, Col, Image } from 'react-bootstrap';
import ImageUploader from '../../common/ImageUploader'; 

const LogoSettings = ({ 
    uploadFileHandler, uploading, currentLogoUrl,
    uploadFaviconHandler, uploadingFavicon, currentFaviconUrl 
}) => {
    return (
        <div className="mb-4">
            <h6 className="fw-bold mb-3">Identidade Visual da Loja</h6>
            
            <Row className="g-3">
                {/* Coluna 1: Logotipo da Loja (Frontend) */}
                <Col xs={12} md={6}>
                    <div className="p-3 border rounded-3 bg-white shadow-sm h-100 d-flex flex-column">
                        <div className="mb-2">
                            <span className="fw-bold d-block" style={{ fontSize: '0.9rem' }}>Logotipo Principal</span>
                            <span className="text-muted" style={{ fontSize: '0.75rem' }}>Aparecerá no topo da vitrine da sua loja (.PNG)</span>
                        </div>
                        
                        <div className="mt-auto">
                            {/* O Uploader já cuida do preview local */}
                            <ImageUploader 
                                onImageUpload={uploadFileHandler} 
                                imageUrl={currentLogoUrl} 
                                label="Alterar logo da loja"
                            />
                            {uploading && (
                                <div className="d-flex align-items-center text-primary mt-2" style={{ fontSize: '0.8rem' }}>
                                    <Spinner animation="border" size="sm" className="me-2"/> Salvando...
                                </div>
                            )}
                        </div>
                    </div>
                </Col>

                {/* Coluna 2: Favicon da Loja (Frontend) */}
                <Col xs={12} md={6}>
                    <div className="p-3 border rounded-3 bg-white shadow-sm h-100 d-flex flex-column">
                        <div className="mb-3">
                            <span className="fw-bold d-block" style={{ fontSize: '0.9rem' }}>Ícone da Aba (Favicon)</span>
                            <span className="text-muted" style={{ fontSize: '0.75rem' }}>Aparece na guia do navegador da sua loja.</span>
                        </div>
                        
                        <div className="d-flex align-items-center gap-3 mt-auto p-2 bg-light border rounded-3">
                            <div className="bg-white border shadow-sm rounded-circle d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: '45px', height: '45px' }}>
                                {currentFaviconUrl ? (
                                    <Image src={currentFaviconUrl} alt="Favicon" style={{ width: '24px', height: '24px', objectFit: 'contain' }} />
                                ) : (
                                    <i className="bi bi-browser-chrome fs-5 text-muted opacity-50"></i>
                                )}
                            </div>

                            <div className="d-flex flex-column flex-grow-1">
                                <div className="d-flex align-items-center gap-2">
                                    <label className="btn btn-outline-primary btn-sm mb-0 px-3 fw-medium w-100 text-center" style={{ fontSize: '0.8rem' }}>
                                        <i className="bi bi-cloud-upload me-1"></i> Atualizar
                                        <input type="file" onChange={uploadFaviconHandler} hidden accept="image/png, image/ico, image/x-icon" disabled={uploadingFavicon} />
                                    </label>
                                    {uploadingFavicon && <Spinner animation="border" size="sm" variant="primary"/>}
                                </div>
                            </div>
                        </div>
                        
                    </div>
                </Col>
            </Row>
        </div>
    );
};

export default LogoSettings;