import React from 'react';
import { Badge } from 'react-bootstrap';

const ChatHeader = ({ selectedChat, isPendente, onBack, onInfoClick }) => {
    if (!selectedChat) return null;

    return (
        <div 
            className="p-3 border-bottom d-flex align-items-center justify-content-between" 
            style={{ backgroundColor: 'var(--bg-sidebar)', borderColor: 'var(--border-color)' }}
        >
            <div className="d-flex align-items-center">
                
                {/* 🟢 BOTÃO DE VOLTAR APENAS PARA MOBILE */}
                <button 
                    className="btn btn-link p-0 me-3 d-md-none shadow-none text-decoration-none" 
                    onClick={onBack}
                    style={{ color: 'var(--text-primary)' }}
                >
                    <i className="bi bi-arrow-left fs-3"></i>
                </button>

                {/* 🟢 ÁREA CLICÁVEL (FOTO E NOME) */}
                <div 
                    className="d-flex align-items-center" 
                    onClick={onInfoClick}
                    style={{ cursor: 'pointer', transition: 'opacity 0.2s' }}
                    onMouseEnter={(e) => e.currentTarget.style.opacity = '0.7'}
                    onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                    title="Ver dados do contato"
                >
                    {selectedChat.foto ? (
                        <img 
                            src={selectedChat.foto} 
                            alt="Perfil" 
                            className="rounded-circle me-3 border"
                            style={{ width: 45, height: 45, objectFit: 'cover', borderColor: 'var(--border-color)' }}
                            onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'flex';
                            }}
                        />
                    ) : null}

                    <div 
                        className="bg-secondary rounded-circle align-items-center justify-content-center text-white me-3" 
                        style={{ width: 45, height: 45, display: selectedChat.foto ? 'none' : 'flex' }}
                    >
                        <i className="bi bi-person-fill fs-4"></i>
                    </div>

                    <h6 className="mb-0 fw-bold" style={{ color: 'var(--text-primary)' }}>
                        {selectedChat.nome || selectedChat.jid.split('@')[0]}
                    </h6>
                </div>
            </div>
            
            {isPendente && (
                <Badge bg="warning" text="dark" className="px-3 py-2 shadow-sm rounded-pill">
                    <i className="bi bi-hourglass-split me-1"></i> Aguardando Atendimento
                </Badge>
            )}
        </div>
    );
};

export default ChatHeader;