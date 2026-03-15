import React from 'react';
import { Card, Form, Spinner, Row, Col, Image } from 'react-bootstrap';

const GeneralSettings = ({ settings, handleChange, uploadFaviconHandler, uploadingFavicon, apiBaseUrl }) => {
    
    // Monta a URL do favicon para preview (igual fizemos com o Logo)
    let faviconPreview = null;
    if (settings.FAVICON_URL) {
        const cleanPath = settings.FAVICON_URL.startsWith('/') ? settings.FAVICON_URL : `/${settings.FAVICON_URL}`;
        faviconPreview = settings.FAVICON_URL.startsWith('http') 
            ? settings.FAVICON_URL 
            : `${apiBaseUrl}${cleanPath}`;
    }

    return (
        <Card className="shadow-sm border-0 rounded-4 mb-4">
            <Card.Body className="p-4">
                <h6 className="fw-bold mb-4 text-primary">Configurações Gerais do Site</h6>

                {/* Nome do Site (Título da Aba) */}
                <Form.Group className="mb-4">
                    <Form.Label className="fw-medium">Nome do Site (Título da Aba)</Form.Label>
                    <Form.Control 
                        type="text" 
                        name="SITE_TITLE" 
                        value={settings.SITE_TITLE || ''} 
                        onChange={handleChange} 
                        placeholder="Ex: Minha Loja - O Melhor E-commerce"
                    />
                    <Form.Text className="text-muted">
                        Este é o texto que aparece na aba do navegador.
                    </Form.Text>
                </Form.Group>

                <hr className="my-4 opacity-10"/>

                {/* Favicon (Ícone da Aba) */}
                <Row className="align-items-center">
                    <Col md={8}>
                        <Form.Label className="fw-medium">Ícone da Aba (Favicon)</Form.Label>
                        <div className="d-flex align-items-center gap-3">
                            <Form.Label className="btn btn-outline-secondary mb-0 shadow-sm">
                                <i className="bi bi-cloud-upload me-2"></i> Escolher Ícone
                                <Form.Control 
                                    type="file" 
                                    onChange={uploadFaviconHandler} 
                                    hidden 
                                    accept="image/png, image/ico, image/x-icon"
                                    disabled={uploadingFavicon}
                                />
                            </Form.Label>
                            {uploadingFavicon && <Spinner animation="border" size="sm" variant="primary"/>}
                        </div>
                        <Form.Text className="text-muted d-block mt-2">
                            Recomendado: Arquivo .PNG ou .ICO, quadrado (ex: 32x32px ou 64x64px).
                        </Form.Text>
                    </Col>
                    
                    <Col md={4} className="text-center">
                        <div className="p-2 border rounded bg-light d-inline-block">
                            {faviconPreview ? (
                                <Image src={faviconPreview} alt="Favicon" style={{ width: '32px', height: '32px', objectFit: 'contain' }} />
                            ) : (
                                <span className="text-muted small">Sem ícone</span>
                            )}
                        </div>
                        <div className="small text-muted mt-1">Preview</div>
                    </Col>
                </Row>
            </Card.Body>
        </Card>
    );
};

export default GeneralSettings;