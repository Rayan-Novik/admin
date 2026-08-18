import React from 'react';
import { Modal, Button } from 'react-bootstrap';

const MediaModal = ({ show, onHide, mediaUrl, mediaType }) => {
    // 🟢 Função de segurança para abrir o link original
    const handleOpenOriginal = () => {
        if (!mediaUrl || mediaUrl.includes('undefined')) {
            return alert("URL do arquivo inválida.");
        }
        window.open(mediaUrl, '_blank', 'noopener,noreferrer');
    };

    return (
        <Modal 
            show={show} 
            onHide={onHide} 
            size="lg" 
            centered 
            contentClassName="bg-dark text-white border-0 shadow-lg"
        >
            <Modal.Header closeButton closeVariant="white" className="border-0">
                <Modal.Title className="fs-6 text-truncate">
                    {mediaType === 'image' && <i className="bi bi-image me-2"></i>}
                    {mediaType === 'video' && <i className="bi bi-play-btn me-2"></i>}
                    {mediaType === 'document' && <i className="bi bi-file-earmark-pdf me-2"></i>}
                    Visualizar Anexo
                </Modal.Title>
            </Modal.Header>

            <Modal.Body 
                className="d-flex justify-content-center align-items-center p-0 overflow-hidden bg-black" 
                style={{ minHeight: '300px', borderRadius: '0 0 8px 8px' }}
            >
                {/* 🟢 IMAGEM */}
                {mediaType === 'image' && mediaUrl && (
                    <img 
                        src={mediaUrl} 
                        alt="Preview" 
                        className="img-fluid" 
                        style={{ maxHeight: '80vh', objectFit: 'contain' }} 
                    />
                )}

                {/* 🟢 VÍDEO */}
                {mediaType === 'video' && mediaUrl && (
                    <video 
                        src={mediaUrl} 
                        controls 
                        autoPlay 
                        className="w-100" 
                        style={{ maxHeight: '80vh', backgroundColor: '#000' }} 
                    />
                )}

                {/* 🟢 DOCUMENTO (PDF) */}
                {mediaType === 'document' && mediaUrl && (
                    <div className="w-100 h-100">
                        <embed
                            src={`${mediaUrl}#toolbar=0&navpanes=0`} // 🟢 Oculta barras extras do PDF para um look cleaner
                            type="application/pdf"
                            width="100%"
                            height="600px"
                            style={{ border: 'none' }}
                        />
                        {/* Fallback simples para mobile, onde o embed as vezes falha */}
                        <div className="d-md-none p-3 text-center">
                            <p className="small">O visualizador de PDF pode não ser compatível com seu navegador móvel.</p>
                        </div>
                    </div>
                )}
            </Modal.Body>

            <Modal.Footer className="border-0 bg-dark">
                <Button 
                    variant="outline-light" 
                    className="border-0 shadow-none"
                    onClick={handleOpenOriginal}
                >
                    <i className="bi bi-box-arrow-up-right me-2"></i>
                    Abrir Original
                </Button>
                <Button variant="secondary" onClick={onHide} className="px-4 rounded-pill">
                    Fechar
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default MediaModal;