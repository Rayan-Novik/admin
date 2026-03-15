import React, { useState, useRef } from 'react';
import { Row, Col, Button, ButtonGroup, Spinner, Badge, Accordion } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import PageLayoutManager from '../components/modules/AppearanceManager/PageLayoutManager';
import AppearanceManager from '../components/modules/AppearanceManager/AppearanceManager';

// 🚀 NOVAS IMPORTAÇÕES PARA OS MENUS
import FooterManager from '../components/modules/AppearanceManager/FooterManager'; 
import SocialMediaManager from '../components/modules/AppearanceManager/SocialMediaManager'; 
import DomainManager from '../components/modules/AppearanceManager/DomainManager'; 

import { toast } from 'react-toastify';

const CustomizerPage = () => {
    const [viewMode, setViewMode] = useState('desktop');
    const [isSaving, setIsSaving] = useState(false);
    const iframeRef = useRef(null);
    const navigate = useNavigate();

    const previewUrl = window.location.origin + "/admin/preview-stub";

    // Envia mensagens para o Iframe (Sandbox)
    const sendMessageToSandbox = (type, data) => {
        if (iframeRef.current && iframeRef.current.contentWindow) {
            iframeRef.current.contentWindow.postMessage({ type, data }, "*");
        }
    };

    const handleSaveAll = async () => {
        setIsSaving(true);
        try {
            // Tenta achar o botão oculto primeiro (que é usado no modo isLive)
            const saveLayout = document.getElementById('btn-save-layout-hidden') || document.getElementById('btn-save-layout');
            
            // Verifica se o AppearanceManager usa a mesma lógica
            const saveAppearance = document.getElementById('btn-save-appearance-hidden') || document.getElementById('btn-save-appearance');

            if (saveLayout) {
                console.log("Botão de Layout encontrado, clicando..."); 
                saveLayout.click();
            } else {
                console.warn("Botão de salvar layout não encontrado!");
            }

            if (saveAppearance) {
                saveAppearance.click();
            }

            // Damos um pequeno delay para a toast aparecer depois da ação iniciar
            setTimeout(() => {
                toast.success("✨ Alterações publicadas com sucesso!");
            }, 500);

        } catch (err) {
            console.error(err);
            toast.error("Erro ao publicar alterações.");
        } finally {
            setTimeout(() => setIsSaving(false), 1000);
        }
    };

    return (
        <div className="customizer-wrapper bg-dark">
            {/* BARRA SUPERIOR FIXA */}
            <header className="customizer-header bg-white border-bottom shadow-sm d-flex align-items-center justify-content-between px-3">
                <div className="d-flex align-items-center">
                    <Button variant="link" className="text-dark p-0 me-3" onClick={() => navigate(-1)}>
                        <i className="bi bi-arrow-left fs-4"></i>
                    </Button>
                    <div>
                        <h6 className="fw-bold mb-0">Customizador Visual</h6>
                        <Badge bg="primary" className="qty-badge text-uppercase">Beta Editor</Badge>
                    </div>
                </div>

                {/* Alternador de Dispositivo */}
                <ButtonGroup size="sm" className="bg-light p-1 rounded-pill border">
                    <Button 
                        variant={viewMode === 'desktop' ? 'white' : 'light'} 
                        className={`rounded-pill px-3 border-0 ${viewMode === 'desktop' ? 'shadow-sm fw-bold' : ''}`}
                        onClick={() => setViewMode('desktop')}
                    >
                        <i className="bi bi-display me-2"></i>Desktop
                    </Button>
                    <Button 
                        variant={viewMode === 'mobile' ? 'white' : 'light'} 
                        className={`rounded-pill px-3 border-0 ${viewMode === 'mobile' ? 'shadow-sm fw-bold' : ''}`}
                        onClick={() => setViewMode('mobile')}
                    >
                        <i className="bi bi-phone me-2"></i>Mobile
                    </Button>
                </ButtonGroup>

                <Button 
                    variant="primary" 
                    className="rounded-pill px-4 fw-bold shadow-sm"
                    onClick={handleSaveAll}
                    disabled={isSaving}
                >
                    {isSaving ? <Spinner size="sm" className="me-2" /> : <i className="bi bi-cloud-arrow-up-fill me-2"></i>}
                    Publicar Agora
                </Button>
            </header>

            <Row className="g-0 content-body">
                {/* BARRA LATERAL COM ACCORDION */}
                <Col lg={3} className="bg-white border-end shadow-sm overflow-auto h-100 p-0 custom-scrollbar">
                    <Accordion defaultActiveKey="0" flush className="customizer-accordion">
                        
                        {/* SEÇÃO 1: ORGANIZAÇÃO */}
                        <Accordion.Item eventKey="0">
                            <Accordion.Header>
                                <i className="bi bi-layers-fill me-2 text-primary"></i>
                                <span className="fw-bold small text-uppercase">Estrutura da Home</span>
                            </Accordion.Header>
                            <Accordion.Body className="p-2">
                                <PageLayoutManager 
                                    onUpdate={(newLayout) => sendMessageToSandbox('UPDATE_LAYOUT', newLayout)} 
                                    isLive={true} 
                                />
                            </Accordion.Body>
                        </Accordion.Item>

                        {/* SEÇÃO 2: IDENTIDADE VISUAL */}
                        <Accordion.Item eventKey="1">
                            <Accordion.Header>
                                <i className="bi bi-palette-fill me-2 text-primary"></i>
                                <span className="fw-bold small text-uppercase">Cores e Identidade</span>
                            </Accordion.Header>
                            <Accordion.Body className="p-3">
                                <AppearanceManager 
                                    hideTabs={true} 
                                    onUpdate={(settings) => sendMessageToSandbox('UPDATE_APPEARANCE', settings)} 
                                /> 
                            </Accordion.Body>
                        </Accordion.Item>

                        {/* 🚀 NOVA SEÇÃO 3: RODAPÉ */}
                        <Accordion.Item eventKey="2">
                            <Accordion.Header>
                                <i className="bi bi-card-text me-2 text-primary"></i>
                                <span className="fw-bold small text-uppercase">Rodapé</span>
                            </Accordion.Header>
                            <Accordion.Body className="p-3 bg-light">
                                <FooterManager />
                            </Accordion.Body>
                        </Accordion.Item>

                        {/* 🚀 NOVA SEÇÃO 4: REDES SOCIAIS */}
                        <Accordion.Item eventKey="3">
                            <Accordion.Header>
                                <i className="bi bi-share-fill me-2 text-primary"></i>
                                <span className="fw-bold small text-uppercase">Redes Sociais</span>
                            </Accordion.Header>
                            <Accordion.Body className="p-3 bg-light">
                                <SocialMediaManager />
                            </Accordion.Body>
                        </Accordion.Item>

                        {/* 🚀 NOVA SEÇÃO 5: DOMÍNIO */}
                        <Accordion.Item eventKey="4">
                            <Accordion.Header>
                                <i className="bi bi-globe2 me-2 text-primary"></i>
                                <span className="fw-bold small text-uppercase">Domínio Próprio</span>
                            </Accordion.Header>
                            <Accordion.Body className="p-3 bg-light">
                                <DomainManager />
                            </Accordion.Body>
                        </Accordion.Item>

                    </Accordion>
                </Col>

                {/* ÁREA DE PREVIEW (SANDBOX) */}
                <Col lg={9} className="bg-secondary bg-opacity-10 d-flex flex-column h-100 position-relative">
                    <div className="flex-grow-1 d-flex align-items-center justify-content-center p-4 overflow-hidden">
                        <div className={`preview-container shadow-2xl transition-all ${viewMode}`}>
                            <iframe 
                                ref={iframeRef}
                                id="site-preview"
                                title="Sandbox Preview"
                                src={previewUrl} 
                                className="w-100 h-100 border-0 bg-white"
                                style={{ borderRadius: viewMode === 'mobile' ? '30px' : '0px' }}
                            />
                        </div>
                    </div>
                </Col>
            </Row>

            <style>{`
                .customizer-wrapper { 
                    height: 100vh; 
                    width: 100vw; 
                    position: fixed; 
                    top: 0; left: 0; z-index: 9999; 
                    display: flex; flex-direction: column;
                }
                .customizer-header { height: 70px; flex-shrink: 0; }
                .content-body { flex-grow: 1; overflow: hidden; }
                .transition-all { transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1); }
                
                /* Ajustes do Preview */
                .preview-container.desktop { width: 100%; height: 100%; }
                .preview-container.mobile { 
                    width: 375px; height: 750px; 
                    border: 12px solid #1a1a1a; border-radius: 45px; 
                    position: relative; 
                }
                .preview-container.mobile::after {
                    content: ''; position: absolute; top: 0; left: 50%;
                    transform: translateX(-50%); width: 150px; height: 25px;
                    background: #1a1a1a; border-bottom-left-radius: 15px; border-bottom-right-radius: 15px;
                }

                .customizer-accordion .accordion-button { font-size: 13px; background-color: #f8f9fa; }
                .customizer-accordion .accordion-button:not(.collapsed) { background-color: #e7f1ff; color: #0d6efd; }
                
                /* Esconde títulos repetidos dentro dos componentes */
                .compact-appearance-editor h5,
                .accordion-body h5.fw-bold.mb-2,
                .accordion-body h5.fw-bold.mb-3 { display: none !important; }
                
                .compact-appearance-editor .card { border: none !important; background: transparent !important; padding: 0 !important; }
                .compact-appearance-editor .row { margin: 0 !important; }
                .compact-appearance-editor .col-lg-7, .compact-appearance-editor .col-lg-5 { width: 100% !important; padding: 0 !important; }
                
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #dee2e6; border-radius: 10px; }
            `}</style>
        </div>
    );
};

export default CustomizerPage;