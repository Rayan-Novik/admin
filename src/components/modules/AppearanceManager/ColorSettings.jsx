import React from 'react';
import { Form } from 'react-bootstrap';

const ColorSettings = ({ settings, handleChange }) => {
    return (
        <div className="mb-5">
            <h6 className="fw-bold mb-4">Esquema de Cores</h6>
            
            {/* --- SEÇÃO: GERAL --- */}
            <p className="text-uppercase small fw-bold text-muted mb-2">Geral e Fundo</p>
            
            <div className="d-flex justify-content-between align-items-center py-3 border-bottom">
                <div>
                    <label className="fw-medium mb-0">Fundo do Site</label>
                    <small className="text-muted d-block">Cor de fundo de todas as páginas.</small>
                </div>
                <div className="d-flex align-items-center">
                    <span className="small text-muted font-monospace me-3">{settings.BODY_BG_COLOR}</span>
                    <Form.Control 
                        type="color" 
                        name="BODY_BG_COLOR" 
                        value={settings.BODY_BG_COLOR || '#f8f9fa'} 
                        onChange={handleChange} 
                        className="p-0 border-0 rounded-circle overflow-hidden shadow-sm"
                        style={{ width: '32px', height: '32px', cursor: 'pointer' }} 
                    />
                </div>
            </div>

            <div className="d-flex justify-content-between align-items-center py-3 border-bottom">
                <div>
                    <label className="fw-medium mb-0">Cor do Texto</label>
                    <small className="text-muted d-block">Cor padrão das letras do site.</small>
                </div>
                <div className="d-flex align-items-center">
                    <span className="small text-muted font-monospace me-3">{settings.SITE_TEXT_COLOR}</span>
                    <Form.Control 
                        type="color" 
                        name="SITE_TEXT_COLOR" 
                        value={settings.SITE_TEXT_COLOR || '#212529'} 
                        onChange={handleChange} 
                        className="p-0 border-0 rounded-circle overflow-hidden shadow-sm"
                        style={{ width: '32px', height: '32px', cursor: 'pointer' }} 
                    />
                </div>
            </div>

            {/* --- SEÇÃO: NAVEGAÇÃO --- */}
            <p className="text-uppercase small fw-bold text-muted mb-2 mt-4">Navegação e Rodapé</p>

            <div className="d-flex justify-content-between align-items-center py-3 border-bottom">
                <div>
                    <label className="fw-medium mb-0">Cabeçalho (Topo)</label>
                    <small className="text-muted d-block">Cor principal do topo da página.</small>
                </div>
                <div className="d-flex align-items-center">
                    <span className="small text-muted font-monospace me-3">{settings.HEADER_PRIMARY_COLOR}</span>
                    <Form.Control 
                        type="color" 
                        name="HEADER_PRIMARY_COLOR" 
                        value={settings.HEADER_PRIMARY_COLOR} 
                        onChange={handleChange} 
                        className="p-0 border-0 rounded-circle overflow-hidden shadow-sm"
                        style={{ width: '32px', height: '32px', cursor: 'pointer' }} 
                    />
                </div>
            </div>

            <div className="d-flex justify-content-between align-items-center py-3 border-bottom">
                <div>
                    <label className="fw-medium mb-0">Faixa de Categorias</label>
                    <small className="text-muted d-block">Faixa de navegação abaixo do topo.</small>
                </div>
                <div className="d-flex align-items-center">
                    <span className="small text-muted font-monospace me-3">{settings.HEADER_SECONDARY_COLOR}</span>
                    <Form.Control 
                        type="color" 
                        name="HEADER_SECONDARY_COLOR" 
                        value={settings.HEADER_SECONDARY_COLOR} 
                        onChange={handleChange} 
                        className="p-0 border-0 rounded-circle overflow-hidden shadow-sm"
                        style={{ width: '32px', height: '32px', cursor: 'pointer' }} 
                    />
                </div>
            </div>

            <div className="d-flex justify-content-between align-items-center py-3 border-bottom">
                <div>
                    <label className="fw-medium mb-0">Fundo do Rodapé</label>
                    <small className="text-muted d-block">Fundo da área inferior do site.</small>
                </div>
                <div className="d-flex align-items-center">
                    <span className="small text-muted font-monospace me-3">{settings.FOOTER_COLOR}</span>
                    <Form.Control 
                        type="color" 
                        name="FOOTER_COLOR" 
                        value={settings.FOOTER_COLOR} 
                        onChange={handleChange} 
                        className="p-0 border-0 rounded-circle overflow-hidden shadow-sm"
                        style={{ width: '32px', height: '32px', cursor: 'pointer' }} 
                    />
                </div>
            </div>

            {/* --- SEÇÃO: BOTÕES --- */}
            <p className="text-uppercase small fw-bold text-muted mb-2 mt-4">Botões Principais</p>

            <div className="d-flex justify-content-between align-items-center py-3 border-bottom">
                <div>
                    <label className="fw-medium mb-0">Cor do Botão</label>
                    <small className="text-muted d-block">Fundo dos botões de ação.</small>
                </div>
                <div className="d-flex align-items-center">
                    <span className="small text-muted font-monospace me-3">{settings.BTN_PRIMARY_BG}</span>
                    <Form.Control 
                        type="color" 
                        name="BTN_PRIMARY_BG" 
                        value={settings.BTN_PRIMARY_BG || '#0d6efd'} 
                        onChange={handleChange} 
                        className="p-0 border-0 rounded-circle overflow-hidden shadow-sm"
                        style={{ width: '32px', height: '32px', cursor: 'pointer' }} 
                    />
                </div>
            </div>

            <div className="d-flex justify-content-between align-items-center py-3 border-bottom">
                <div>
                    <label className="fw-medium mb-0">Texto do Botão</label>
                    <small className="text-muted d-block">Cor da letra dentro do botão.</small>
                </div>
                <div className="d-flex align-items-center">
                    <span className="small text-muted font-monospace me-3">{settings.BTN_PRIMARY_TEXT}</span>
                    <Form.Control 
                        type="color" 
                        name="BTN_PRIMARY_TEXT" 
                        value={settings.BTN_PRIMARY_TEXT || '#ffffff'} 
                        onChange={handleChange} 
                        className="p-0 border-0 rounded-circle overflow-hidden shadow-sm"
                        style={{ width: '32px', height: '32px', cursor: 'pointer' }} 
                    />
                </div>
            </div>
            
            <style>{`
                input[type="color"]::-webkit-color-swatch-wrapper { padding: 0; }
                input[type="color"]::-webkit-color-swatch { border: none; }
            `}</style>
        </div>
    );
};

export default ColorSettings;