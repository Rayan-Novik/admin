import React, { useState, useRef } from 'react';
import { Spinner, Image, Button } from 'react-bootstrap';
import api from '../../services/api';
import { toast } from 'react-toastify';
import MediaGalleryModal from './MediaGalleryModal'; 

const ImageUploader = ({ label, imageUrl, onImageUpload, isSubImage = false, maxSizeMB = 5, podeEditar = true }) => {
    const [uploading, setUploading] = useState(false);
    const [showGallery, setShowGallery] = useState(false);
    const [isDragging, setIsDragging] = useState(false); 
    const fileInputRef = useRef(null);

    const processFile = async (file) => {
        if (!podeEditar) return; 
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            toast.error('Por favor, selecione apenas arquivos de imagem válidos (JPG, PNG, WebP).');
            return;
        }

        const fileSizeMB = file.size / (1024 * 1024);
        if (fileSizeMB > maxSizeMB) {
            toast.error(`A imagem é muito pesada! O tamanho máximo permitido é de ${maxSizeMB}MB.`);
            return;
        }

        const formData = new FormData();
        formData.append('image', file);
        setUploading(true);

        try {
            const config = { headers: { 'Content-Type': 'multipart/form-data' } };
            const { data } = await api.post('/uploadimages', formData, config);
            
            onImageUpload(data.imagePath);
            toast.success('Upload concluído!');
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.message || 'Falha no upload da imagem.');
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const uploadFileHandler = (e) => {
        processFile(e.target.files[0]);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!podeEditar) return; 
        if (!uploading) setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!podeEditar) return; 
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!podeEditar) return; 
        setIsDragging(false);
        if (!uploading && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            processFile(e.dataTransfer.files[0]);
        }
    };

    return (
        <div className="uploader-wrapper w-100 d-flex flex-column align-items-center">
            {label && (
                <label className="fw-bold text-muted small text-uppercase mb-2 d-block w-100 text-start">
                    {label}
                </label>
            )}

            {/* ÁREA DE DRAG & DROP E CLIQUE (SEM BORDAS) */}
            <div 
                className={`uploader-box rounded-4 d-flex justify-content-center align-items-center overflow-hidden w-100 position-relative ${isDragging ? 'dragging' : ''} ${imageUrl ? 'has-image' : ''} ${!podeEditar ? 'read-only' : ''}`}
                style={{ 
                    height: isSubImage ? '100%' : '320px', 
                    maxHeight: isSubImage ? 'none' : '320px',
                    aspectRatio: isSubImage ? '1 / 1' : 'auto', 
                    cursor: !podeEditar ? 'default' : (uploading ? 'wait' : 'pointer')
                }}
                onClick={() => podeEditar && !uploading && fileInputRef.current.click()}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
            >
                {/* 1. Loading State */}
                {uploading && (
                    <div className="text-center text-primary z-2 position-absolute d-flex flex-column align-items-center">
                        <Spinner animation="grow" variant="primary" role="status" className="mb-2" />
                        <div className="small fw-bold animate-pulse">Enviando...</div>
                    </div>
                )}

                {/* 2. Imagem Carregada */}
                {!uploading && imageUrl && (
                    <>
                        {/* Imagem preenche suavemente o espaço sem bordas */}
                        <Image src={imageUrl} alt="Preview" className="w-100 h-100" style={{ objectFit: 'contain' }} />
                        
                        <div className="overlay-change position-absolute w-100 h-100 d-flex justify-content-center align-items-center">
                            <span className="badge bg-dark bg-opacity-75 rounded-pill px-3 py-2 fw-medium fs-6 shadow border-0 backdrop-blur">
                                <i className="bi bi-pencil-square me-2"></i>Alterar
                            </span>
                        </div>
                    </>
                )}

                {/* 3. Estado Vazio Minimalista */}
                {!uploading && !imageUrl && (
                    <div className="text-center p-3 placeholder-text d-flex flex-column align-items-center justify-content-center h-100">
                        <div className="icon-wrapper mb-3 text-primary opacity-50 transition-all">
                            <i className={`bi bi-image ${isSubImage ? 'fs-3' : 'display-4'}`}></i>
                        </div>
                        <span className={`fw-medium d-block text-secondary ${isSubImage ? 'small' : ''}`}>
                            {isDragging ? 'Solte para enviar' : (isSubImage ? 'Adicionar' : 'Arraste ou clique para enviar')}
                        </span>
                    </div>
                )}
            </div>

            {/* BOTÃO DA BIBLIOTECA - DISCRETO */}
            {podeEditar && (
                <Button 
                    variant="link" 
                    size="sm" 
                    className={`text-decoration-none mt-3 fw-medium text-muted hover-text-primary ${isSubImage ? 'p-0 mb-1 mt-2' : ''}`}
                    style={{fontSize: isSubImage ? '0.8rem' : '0.9rem'}}
                    onClick={(e) => {
                        e.stopPropagation(); 
                        setShowGallery(true);
                    }}
                >
                    <i className="bi bi-collection me-1"></i> Explorar Biblioteca
                </Button>
            )}

            <input
                type="file"
                ref={fileInputRef}
                onChange={uploadFileHandler}
                style={{ display: 'none' }}
                accept="image/png, image/jpeg, image/webp"
                disabled={!podeEditar}
            />

            <MediaGalleryModal 
                show={showGallery} 
                onHide={() => setShowGallery(false)} 
                onSelect={(url) => {
                    onImageUpload(url);
                    setShowGallery(false); 
                }} 
            />

            {/* CSS SCOPED MINIMALISTA */}
            <style>{`
                .uploader-box {
                    /* Fundo super suave, sem bordas! */
                    background-color: var(--bg-main, rgba(0,0,0,0.02));
                    border: none;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                }

                .uploader-box:not(.read-only):not(.has-image):hover {
                    background-color: var(--border-color, rgba(0,0,0,0.05));
                    transform: translateY(-2px);
                }

                .uploader-box:not(.read-only):hover .icon-wrapper {
                    transform: scale(1.1);
                    opacity: 0.8 !important;
                }

                .uploader-box.has-image {
                    background-color: transparent;
                }

                .uploader-box.dragging {
                    background-color: rgba(13, 110, 253, 0.05) !important;
                    transform: scale(1.02);
                    box-shadow: 0 0 0 4px rgba(13, 110, 253, 0.15); /* Brilho em vez de borda tracejada */
                }

                .placeholder-text {
                    pointer-events: none;
                }

                .backdrop-blur {
                    backdrop-filter: blur(4px);
                }

                .overlay-change {
                    background-color: rgba(0, 0, 0, 0.15);
                    opacity: 0;
                    transition: all 0.3s ease-in-out;
                    backdrop-filter: blur(2px);
                }

                .uploader-box:not(.read-only):hover .overlay-change {
                    opacity: 1;
                }

                .hover-text-primary:hover {
                    color: #0d6efd !important;
                }

                /* Ajustes para Modo Escuro */
                body.dark-mode .uploader-box:not(.has-image) {
                    background-color: rgba(255, 255, 255, 0.03);
                }
                body.dark-mode .uploader-box:hover:not(.dragging):not(.read-only):not(.has-image) {
                    background-color: rgba(255, 255, 255, 0.06);
                }
            `}</style>
        </div>
    );
};

export default ImageUploader;