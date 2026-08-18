import React from 'react';
import { Card, Image, Button } from 'react-bootstrap';

const LivePreview = ({ settings, previewLogoUrl, previewFaviconUrl }) => {
    
    const displayLogo = previewLogoUrl || settings.LOGO_URL;
    const displayFavicon = previewFaviconUrl || settings.FAVICON_URL;

    // Estilos dinâmicos baseados nos novos inputs de ColorSettings
    const siteContentStyle = {
        backgroundColor: settings.BODY_BG_COLOR || '#f8f9fa',
        color: settings.SITE_TEXT_COLOR || '#212529',
        transition: 'all 0.3s ease'
    };

    const dynamicButtonStyle = {
        backgroundColor: settings.BTN_PRIMARY_BG || '#0d6efd',
        color: settings.BTN_PRIMARY_TEXT || '#ffffff',
        border: 'none',
        fontSize: '0.7rem',
        padding: '5px 15px',
        borderRadius: '50px',
        transition: 'all 0.3s ease'
    };

    return (
        <div className="sticky-top" style={{top: '20px'}}>
            <Card className="shadow-sm border-0 rounded-4">
                 <Card.Body className="p-4">
                    <h6 className="fw-bold mb-3 text-secondary text-center">Pré-visualização em Tempo Real</h6>
                    
                    <div className="border rounded-3 overflow-hidden shadow-sm d-flex flex-column" style={{height: '500px'}}>
                        
                        {/* 1. Aba do Navegador Simulada */}
                        <div className="bg-light border-bottom px-3 py-2 d-flex align-items-center gap-2" style={{height: '40px', backgroundColor: '#eef1f5'}}>
                            <div className="d-flex align-items-center bg-white px-3 py-1 rounded-top-2 border border-bottom-0 small shadow-sm" style={{marginTop: '6px', height: '34px', minWidth: '160px', maxWidth: '200px'}}>
                                {displayFavicon ? (
                                     <Image src={displayFavicon} style={{width: '16px', height: '16px', objectFit: 'contain'}} className="me-2" />
                                ) : (
                                     <div className="bg-secondary rounded-circle me-2 opacity-25" style={{width:12, height:12}}></div>
                                )}
                                <span className="fw-bold text-dark text-truncate" style={{fontSize: '0.75rem', maxWidth: '120px'}}>
                                    {settings.SITE_TITLE || 'Minha Loja'}
                                </span>
                            </div>
                        </div>

                        {/* 2. Barra de Endereço */}
                        <div className="bg-white border-bottom p-2 d-flex align-items-center">
                            <div className="flex-grow-1 bg-light rounded-pill px-3 py-1 text-muted small text-truncate border mx-2" style={{fontSize: '0.65rem'}}>
                                <i className="bi bi-lock-fill me-2 opacity-50"></i>
                                https://{settings.SITE_TITLE ? settings.SITE_TITLE.toLowerCase().replace(/\s+/g, '') : 'loja'}.com.br
                            </div>
                        </div>

                        {/* 3. Header Preview */}
                        <div style={{ backgroundColor: settings.HEADER_PRIMARY_COLOR, padding: '12px', textAlign: 'center', transition: 'background 0.3s', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50px' }}>
                            {displayLogo ? (
                                <Image src={displayLogo} style={{ maxHeight: '30px', maxWidth: '120px', objectFit: 'contain' }} />
                            ) : (
                                <span className="text-white fw-bold opacity-50 small">LOGO</span>
                            )}
                        </div>
                        
                        {/* 4. Navbar Preview */}
                        <div style={{ backgroundColor: settings.HEADER_SECONDARY_COLOR, padding: '6px', color: '#fff', textAlign: 'center', fontSize: '0.6rem', fontWeight: 'bold', letterSpacing: '1px', transition: 'background 0.3s' }}>
                            HOME &nbsp; • &nbsp; PRODUTOS &nbsp; • &nbsp; CONTATO
                        </div>
                        
                        {/* 5. Conteúdo do Site (Fundo e Texto Dinâmicos) */}
                        <div className="flex-grow-1 p-3 d-flex flex-column gap-3 overflow-hidden" style={siteContentStyle}>
                            <div className="text-center">
                                <h6 className="fw-bold mb-1" style={{fontSize: '0.85rem'}}>Destaques da Semana</h6>
                                <p style={{fontSize: '0.65rem', opacity: 0.8}}>Confira nossas ofertas exclusivas.</p>
                            </div>
                            
                            {/* Grid de "Produtos" Simulados */}
                            <div className="d-flex gap-2">
                                {[1, 2].map(i => (
                                    <div key={i} className="bg-white border rounded p-2 flex-grow-1 shadow-xs text-center">
                                        <div className="bg-light rounded mb-2" style={{height: '50px'}}></div>
                                        <div className="fw-bold mb-1" style={{fontSize: '0.6rem'}}>Produto {i}</div>
                                        <div className="text-success fw-bold mb-2" style={{fontSize: '0.7rem'}}>R$ 99,90</div>
                                        {/* ✅ Botão Dinâmico no Preview */}
                                        <button style={dynamicButtonStyle}>Comprar</button>
                                    </div>
                                ))}
                            </div>
                        </div>
                        
                        {/* 6. Footer Preview */}
                        <div style={{ backgroundColor: settings.FOOTER_COLOR, padding: '12px', color: '#fff', textAlign: 'center', fontSize: '0.65rem', transition: 'background 0.3s' }}>
                            <p className="mb-0 opacity-75">© 2026 {settings.SITE_TITLE || 'Minha Loja'}</p>
                        </div>
                    </div>
                    
                    <div className="text-center mt-3">
                        <small className="text-muted fst-italic" style={{fontSize: '0.75rem'}}>Simulação do layout final</small>
                    </div>
                </Card.Body>
            </Card>
        </div>
    );
};

export default LivePreview;