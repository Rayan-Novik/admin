import React from 'react';
import { Card, Spinner } from 'react-bootstrap';
// 🚀 Ajustado o nome do componente para bater com o seu arquivo original
import ImageUploader from '../../common/ImageUploader'; 

const LogoSettings = ({ uploadFileHandler, uploading, currentLogoUrl }) => {
    return (
        <Card className="shadow-sm border-0 rounded-4">
            <Card.Body className="p-4">
                <h6 className="fw-bold mb-3 text-primary">Logotipo da Loja</h6>
                <div className="p-4 border rounded-3 bg-light text-center">
                    
                    {/* 🚀 CORREÇÃO AQUI: Trocamos o nome das props para bater com o ImageUploader */}
                    <ImageUploader 
                        onImageUpload={uploadFileHandler} 
                        imageUrl={currentLogoUrl} 
                        label="Escolha a imagem da Logo"
                    />

                    {uploading && (
                        <div className="text-center mt-3">
                            <Spinner animation="border" size="sm" variant="primary"/> 
                            <small className="ms-2">Salvando configuração...</small>
                        </div>
                    )}
                    {!uploading && <p className="text-muted small mb-0 mt-3">Formatos aceitos: PNG, JPG (Transparente recomendado)</p>}
                </div>
            </Card.Body>
        </Card>
    );
};

export default LogoSettings;