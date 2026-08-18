import React from 'react';
import { Form, Spinner, Row, Col, Image } from 'react-bootstrap';

const GeneralSettings = ({ settings, handleChange, uploadFaviconHandler, uploadingFavicon, apiBaseUrl }) => {

    let faviconPreview = null;
    if (settings.FAVICON_URL) {
        const cleanPath = settings.FAVICON_URL.startsWith('/') ? settings.FAVICON_URL : `/${settings.FAVICON_URL}`;
        faviconPreview = settings.FAVICON_URL.startsWith('http')
            ? settings.FAVICON_URL
            : `${apiBaseUrl}${cleanPath}`;
    }

    const handleLayoutSelect = (layoutName) => {
        // 1. Atualiza o state do formulário (prepara para salvar)
        handleChange({ target: { name: 'STORE_LAYOUT_STYLE', value: layoutName } });

        // 2. Dispara o evento para atualizar o Contexto na hora
        window.postMessage({
            type: 'UPDATE_APPEARANCE',
            data: { STORE_LAYOUT_STYLE: layoutName }
        }, '*');

        // IMPORTANTE: Se o seu preview da loja roda dentro de um iframe na tela do painel,
        // descomente o código abaixo e coloque o ID correto do iframe:
        /*
        const iframePreview = document.getElementById('id-do-seu-iframe');
        if (iframePreview && iframePreview.contentWindow) {
            iframePreview.contentWindow.postMessage({
                type: 'UPDATE_APPEARANCE',
                data: { STORE_LAYOUT_STYLE: layoutName }
            }, '*');
        }
        */
    };

    return (
        <div className="mb-5">
            <h6 className="fw-bold mb-4">Configurações Gerais do Site</h6>

            {/* Nome do Site */}
            <div className="mb-4">
                <Form.Label className="fw-medium">Nome do Site (Título da Aba)</Form.Label>
                <Form.Control
                    type="text"
                    name="SITE_TITLE"
                    value={settings.SITE_TITLE || ''}
                    onChange={handleChange}
                    placeholder="Ex: Minha Loja - O Melhor E-commerce"
                />
                <Form.Text className="text-muted">Este é o texto que aparece na aba do navegador.</Form.Text>
            </div>

            {/* Template do Site */}
            <div className="mb-5">
                <Form.Label className="fw-medium mb-3">Modelo do Site (Template)</Form.Label>
                <Row className="g-3">
                    <Col xs={12} md={4}>
                        <div
                            onClick={() => handleLayoutSelect('ECOMMERCE')}
                            className={`p-3 rounded-4 border text-center transition-all ${settings.STORE_LAYOUT_STYLE === 'ECOMMERCE' ? 'border-primary bg-primary bg-opacity-10 text-primary shadow-sm' : 'border-secondary border-opacity-25 bg-transparent'}`}
                            style={{ cursor: 'pointer' }}
                        >
                            <i className="bi bi-shop fs-3 mb-2 d-block"></i>
                            <h6 className="fw-bold mb-1 small">E-commerce</h6>
                            <span className="text-muted d-block" style={{ fontSize: '11px' }}>Banners e categorias</span>
                        </div>
                    </Col>
                    <Col xs={12} md={4}>
                        <div
                            onClick={() => handleLayoutSelect('CARDAPIO')}
                            className={`p-3 rounded-4 border text-center transition-all ${settings.STORE_LAYOUT_STYLE === 'CARDAPIO' ? 'border-danger bg-danger bg-opacity-10 text-danger shadow-sm' : 'border-secondary border-opacity-25 bg-transparent'}`}
                            style={{ cursor: 'pointer' }}
                        >
                            <i className="bi bi-menu-button-wide-fill fs-3 mb-2 d-block"></i>
                            <h6 className="fw-bold mb-1 small">Cardápio Digital</h6>
                            <span className="text-muted d-block" style={{ fontSize: '11px' }}>Lista rápida p/ restaurantes</span>
                        </div>
                    </Col>
                    <Col xs={12} md={4}>
                        <div
                            onClick={() => handleLayoutSelect('MERCADINHO')}
                            className={`p-3 rounded-4 border text-center transition-all ${settings.STORE_LAYOUT_STYLE === 'MERCADINHO' ? 'border-success bg-success bg-opacity-10 text-success shadow-sm' : 'border-secondary border-opacity-25 bg-transparent'}`}
                            style={{ cursor: 'pointer' }}
                        >
                            <i className="bi bi-basket-fill fs-3 mb-2 d-block"></i>
                            <h6 className="fw-bold mb-1 small">Mercadinho</h6>
                            <span className="text-muted d-block" style={{ fontSize: '11px' }}>Menus laterais e prateleiras</span>
                        </div>
                    </Col>
                    
                    {/* 🟢 AGENDAMENTO DESBLOQUEADO */}
                    <Col xs={12} md={4}>
                        <div
                            onClick={() => handleLayoutSelect('AGENDAMENTO')}
                            className={`p-3 rounded-4 border text-center transition-all ${settings.STORE_LAYOUT_STYLE === 'AGENDAMENTO' ? 'border-info bg-info bg-opacity-10 text-info shadow-sm' : 'border-secondary border-opacity-25 bg-transparent'}`}
                            style={{ cursor: 'pointer' }}
                        >
                            <i className="bi bi-calendar-check-fill fs-3 mb-2 d-block"></i>
                            <h6 className="fw-bold mb-1 small">Agendamento</h6>
                            <span className="text-muted d-block" style={{ fontSize: '11px' }}>
                                Barbearia, salão, clínica e serviços
                            </span>
                        </div>
                    </Col>
                </Row>
            </div>

            {/* Favicon */}
            <div className="d-flex justify-content-between align-items-center py-3 border-top">
                <div>
                    <Form.Label className="fw-medium mb-1">Ícone da Aba (Favicon)</Form.Label>
                    <small className="text-muted d-block mb-2">Aparece na guia do navegador. Formatos: PNG, ICO.</small>
                    <div className="d-flex align-items-center gap-2">
                        <label className="btn btn-sm btn-outline-secondary mb-0">
                            <i className="bi bi-cloud-upload me-1"></i> Alterar Ícone
                            <input type="file" onChange={uploadFaviconHandler} hidden accept="image/png, image/ico, image/x-icon" disabled={uploadingFavicon} />
                        </label>
                        {uploadingFavicon && <Spinner animation="border" size="sm" variant="primary" />}
                    </div>
                </div>
                <div className="ms-3 border rounded-3 p-2 d-flex align-items-center justify-content-center" style={{ width: '48px', height: '48px', backgroundColor: '#f8f9fa' }}>
                    {faviconPreview ? (
                        <Image src={faviconPreview} alt="Favicon" style={{ width: '24px', height: '24px', objectFit: 'contain' }} />
                    ) : (
                        <i className="bi bi-browser-chrome text-muted opacity-50"></i>
                    )}
                </div>
            </div>

            <style>{`
                .transition-all { transition: all 0.2s ease-in-out; }
            `}</style>
        </div>
    );
};

export default GeneralSettings;