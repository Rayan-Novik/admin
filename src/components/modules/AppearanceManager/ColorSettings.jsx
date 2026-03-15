import React from 'react';
import { Card, Form } from 'react-bootstrap';

const ColorSettings = ({ settings, handleChange }) => {
    return (
        <Card className="shadow-sm border-0 rounded-4 mb-4">
            <Card.Body className="p-4">
                <h6 className="fw-bold mb-4 text-primary">Esquema de Cores</h6>
                
                {/* --- SEÇÃO: GERAL --- */}
                <p className="fw-bold small text-uppercase text-muted border-bottom pb-2 mb-3">Geral e Fundo</p>

                {/* Fundo do Site */}
                <div className="mb-3 d-flex align-items-center justify-content-between bg-light p-3 rounded-3 border-0">
                    <div>
                        <Form.Label className="mb-0 fw-medium">Fundo do Site</Form.Label>
                        <small className="text-muted d-block" style={{fontSize: '0.75rem'}}>Cor de fundo de todas as páginas.</small>
                    </div>
                    <div className="d-flex align-items-center bg-white p-1 rounded border">
                        <Form.Control 
                            type="color" 
                            name="BODY_BG_COLOR" 
                            value={settings.BODY_BG_COLOR || '#f8f9fa'} 
                            onChange={handleChange} 
                            className="border-0 p-0"
                            style={{width: '40px', height: '30px'}} 
                        />
                        <span className="small ms-2 font-monospace text-muted">{settings.BODY_BG_COLOR}</span>
                    </div>
                </div>

                {/* Texto do Site */}
                <div className="mb-3 d-flex align-items-center justify-content-between bg-light p-3 rounded-3 border-0">
                    <div>
                        <Form.Label className="mb-0 fw-medium">Cor do Texto</Form.Label>
                        <small className="text-muted d-block" style={{fontSize: '0.75rem'}}>Cor padrão das letras do site.</small>
                    </div>
                    <div className="d-flex align-items-center bg-white p-1 rounded border">
                        <Form.Control 
                            type="color" 
                            name="SITE_TEXT_COLOR" 
                            value={settings.SITE_TEXT_COLOR || '#212529'} 
                            onChange={handleChange} 
                            className="border-0 p-0"
                            style={{width: '40px', height: '30px'}} 
                        />
                        <span className="small ms-2 font-monospace text-muted">{settings.SITE_TEXT_COLOR}</span>
                    </div>
                </div>

                {/* --- SEÇÃO: NAVEGAÇÃO --- */}
                <p className="fw-bold small text-uppercase text-muted border-bottom pb-2 mb-3 mt-4">Navegação</p>

                <div className="mb-3 d-flex align-items-center justify-content-between bg-light p-3 rounded-3 border-0">
                    <div>
                        <Form.Label className="mb-0 fw-medium">Cabeçalho (Fundo)</Form.Label>
                        <small className="text-muted d-block" style={{fontSize: '0.75rem'}}>Cor principal do topo da página.</small>
                    </div>
                    <div className="d-flex align-items-center bg-white p-1 rounded border">
                        <Form.Control 
                            type="color" 
                            name="HEADER_PRIMARY_COLOR" 
                            value={settings.HEADER_PRIMARY_COLOR} 
                            onChange={handleChange} 
                            className="border-0 p-0"
                            style={{width: '40px', height: '30px'}} 
                        />
                        <span className="small ms-2 font-monospace text-muted">{settings.HEADER_PRIMARY_COLOR}</span>
                    </div>
                </div>

                <div className="mb-3 d-flex align-items-center justify-content-between bg-light p-3 rounded-3 border-0">
                    <div>
                        <Form.Label className="mb-0 fw-medium">Faixa de Categorias</Form.Label>
                        <small className="text-muted d-block" style={{fontSize: '0.75rem'}}>Faixa de navegação abaixo do topo.</small>
                    </div>
                    <div className="d-flex align-items-center bg-white p-1 rounded border">
                        <Form.Control 
                            type="color" 
                            name="HEADER_SECONDARY_COLOR" 
                            value={settings.HEADER_SECONDARY_COLOR} 
                            onChange={handleChange} 
                            className="border-0 p-0"
                            style={{width: '40px', height: '30px'}} 
                        />
                        <span className="small ms-2 font-monospace text-muted">{settings.HEADER_SECONDARY_COLOR}</span>
                    </div>
                </div>

                <div className="mb-3 d-flex align-items-center justify-content-between bg-light p-3 rounded-3 border-0">
                    <div>
                        <Form.Label className="mb-0 fw-medium">Rodapé</Form.Label>
                        <small className="text-muted d-block" style={{fontSize: '0.75rem'}}>Fundo da área inferior do site.</small>
                    </div>
                    <div className="d-flex align-items-center bg-white p-1 rounded border">
                        <Form.Control 
                            type="color" 
                            name="FOOTER_COLOR" 
                            value={settings.FOOTER_COLOR} 
                            onChange={handleChange} 
                            className="border-0 p-0"
                            style={{width: '40px', height: '30px'}} 
                        />
                        <span className="small ms-2 font-monospace text-muted">{settings.FOOTER_COLOR}</span>
                    </div>
                </div>

                {/* --- SEÇÃO: BOTÕES --- */}
                <p className="fw-bold small text-uppercase text-muted border-bottom pb-2 mb-3 mt-4">Botões Principais</p>

                <div className="mb-3 d-flex align-items-center justify-content-between bg-light p-3 rounded-3 border-0">
                    <div>
                        <Form.Label className="mb-0 fw-medium">Cor do Botão</Form.Label>
                        <small className="text-muted d-block" style={{fontSize: '0.75rem'}}>Fundo dos botões de ação.</small>
                    </div>
                    <div className="d-flex align-items-center bg-white p-1 rounded border">
                        <Form.Control 
                            type="color" 
                            name="BTN_PRIMARY_BG" 
                            value={settings.BTN_PRIMARY_BG || '#0d6efd'} 
                            onChange={handleChange} 
                            className="border-0 p-0"
                            style={{width: '40px', height: '30px'}} 
                        />
                        <span className="small ms-2 font-monospace text-muted">{settings.BTN_PRIMARY_BG}</span>
                    </div>
                </div>

                <div className="mb-3 d-flex align-items-center justify-content-between bg-light p-3 rounded-3 border-0">
                    <div>
                        <Form.Label className="mb-0 fw-medium">Texto do Botão</Form.Label>
                        <small className="text-muted d-block" style={{fontSize: '0.75rem'}}>Cor da letra dentro do botão.</small>
                    </div>
                    <div className="d-flex align-items-center bg-white p-1 rounded border">
                        <Form.Control 
                            type="color" 
                            name="BTN_PRIMARY_TEXT" 
                            value={settings.BTN_PRIMARY_TEXT || '#ffffff'} 
                            onChange={handleChange} 
                            className="border-0 p-0"
                            style={{width: '40px', height: '30px'}} 
                        />
                        <span className="small ms-2 font-monospace text-muted">{settings.BTN_PRIMARY_TEXT}</span>
                    </div>
                </div>
            </Card.Body>
        </Card>
    );
};

export default ColorSettings;