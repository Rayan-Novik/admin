import React, { useState, useRef } from 'react';
import { Spinner, Image } from 'react-bootstrap';
import api from '../../services/api';
import { toast } from 'react-toastify';

/**
 * Componente visual de Upload.
 * Removemos o input de texto feio e deixamos apenas a área visual.
 */
const ImageUploader = ({ label, imageUrl, onImageUpload, isSubImage = false }) => {
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef(null);

    const uploadFileHandler = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validação simples de tipo
        if (!file.type.startsWith('image/')) {
            toast.error('Por favor, selecione apenas arquivos de imagem.');
            return;
        }

        const formData = new FormData();
        formData.append('image', file);
        setUploading(true);

        try {
            const config = {
                headers: { 'Content-Type': 'multipart/form-data' },
            };
            
            const { data } = await api.post('/uploadimages', formData, config);
            
            // Retorna a URL para o componente pai
            onImageUpload(data.imagePath);
            toast.success('Upload concluído!');
            
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.message || 'Falha no upload.');
        } finally {
            setUploading(false);
            // Limpa o input para permitir selecionar a mesma imagem novamente se falhar
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    // Estilos dinâmicos baseados no estado
    const containerStyle = {
        height: isSubImage ? '100%' : '280px', // Altura fixa para principal, 100% para grid
        minHeight: isSubImage ? '120px' : '280px',
        cursor: uploading ? 'wait' : 'pointer',
        borderStyle: 'dashed',
        borderWidth: '2px',
        borderColor: imageUrl ? '#dee2e6' : '#6c757d',
        backgroundColor: imageUrl ? '#fff' : '#f8f9fa',
        transition: 'all 0.2s ease-in-out',
        position: 'relative'
    };

    return (
        <div className="w-100 h-100">
            {/* Label Opcional */}
            {label && (
                <label className="fw-bold text-muted small text-uppercase mb-2 d-block">
                    {label}
                </label>
            )}

            {/* Área Clicável */}
            <div 
                className="rounded-4 d-flex justify-content-center align-items-center overflow-hidden hover-shadow"
                style={containerStyle}
                onClick={() => !uploading && fileInputRef.current.click()}
                onMouseEnter={(e) => {
                    if(!uploading) {
                        e.currentTarget.style.backgroundColor = '#e9ecef';
                        e.currentTarget.style.borderColor = '#0d6efd';
                    }
                }}
                onMouseLeave={(e) => {
                    if(!uploading) {
                        e.currentTarget.style.backgroundColor = imageUrl ? '#fff' : '#f8f9fa';
                        e.currentTarget.style.borderColor = imageUrl ? '#dee2e6' : '#6c757d';
                    }
                }}
            >
                {/* 1. Estado de Carregamento */}
                {uploading && (
                    <div className="text-center text-primary z-2">
                        <Spinner animation="border" role="status" className="mb-2" />
                        <div className="small fw-bold animate-pulse">Enviando...</div>
                    </div>
                )}

                {/* 2. Estado com Imagem (Preview) */}
                {!uploading && imageUrl && (
                    <>
                        <Image 
                            src={imageUrl} 
                            alt="Preview" 
                            className="w-100 h-100"
                            style={{ objectFit: 'contain', padding: '4px' }} 
                        />
                        {/* Overlay "Trocar Imagem" ao passar o mouse */}
                        <div className="position-absolute w-100 h-100 d-flex justify-content-center align-items-center opacity-0 hover-opacity-100" 
                             style={{ backgroundColor: 'rgba(0,0,0,0.5)', transition: 'opacity 0.2s' }}>
                            <span className="text-white fw-bold border border-white rounded-pill px-3 py-1">
                                <i className="bi bi-pencil-square me-2"></i>Alterar
                            </span>
                        </div>
                    </>
                )}

                {/* 3. Estado Vazio (Placeholder) */}
                {!uploading && !imageUrl && (
                    <div className="text-center text-muted p-3">
                        <i className={`bi bi-cloud-arrow-up-fill ${isSubImage ? 'fs-2' : 'fs-1'} mb-2 d-block text-primary opacity-50`}></i>
                        <span className={isSubImage ? 'small' : 'fw-medium'}>
                            {isSubImage ? 'Adicionar' : 'Clique para fazer upload'}
                        </span>
                        {!isSubImage && <div className="small opacity-75 mt-1">JPG, PNG ou WebP</div>}
                    </div>
                )}
            </div>

            {/* Input Invisível */}
            <input
                type="file"
                ref={fileInputRef}
                onChange={uploadFileHandler}
                style={{ display: 'none' }}
                accept="image/png, image/jpeg, image/webp"
            />
        </div>
    );
};

export default ImageUploader;