import React from 'react';
import { Offcanvas } from 'react-bootstrap';

const ContactInfoPanel = ({ show, onHide, contact }) => {
    if (!contact) return null;

    // Função simples para pegar só os números antes do @s.whatsapp.net
    const formatJidToNumber = (jid) => {
        if (!jid) return '';
        return jid.split('@')[0];
    };

    return (
        <Offcanvas 
            show={show} 
            onHide={onHide} 
            placement="end" 
            style={{ backgroundColor: 'var(--bg-sidebar, #ffffff)', color: 'var(--text-primary)' }}
        >
            <Offcanvas.Header closeButton className="border-bottom" style={{ borderColor: 'var(--border-color)' }}>
                <Offcanvas.Title className="fw-bold fs-5">Dados do Contato</Offcanvas.Title>
            </Offcanvas.Header>
            
            <Offcanvas.Body className="d-flex flex-column align-items-center text-center pt-4">
                
                {/* 🟢 FOTO DO PERFIL GRANDE */}
                {contact.foto ? (
                    <img 
                        src={contact.foto} 
                        alt={contact.nome} 
                        className="rounded-circle mb-3 shadow-sm"
                        style={{ width: 160, height: 160, objectFit: 'cover', border: '4px solid var(--border-color, #e2e8f0)' }}
                        onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                        }}
                    />
                ) : null}

                <div 
                    className="bg-secondary rounded-circle align-items-center justify-content-center text-white mb-3 shadow-sm" 
                    style={{ width: 160, height: 160, display: contact.foto ? 'none' : 'flex' }}
                >
                    <i className="bi bi-person-fill" style={{ fontSize: '6rem' }}></i>
                </div>

                {/* 🟢 NOME DO CONTATO */}
                <h4 className="fw-bold mb-1">{contact.nome || formatJidToNumber(contact.jid)}</h4>

                {/* 🟢 LID / NÚMERO DE TELEFONE */}
                <p className="text-muted mb-4 d-flex align-items-center justify-content-center gap-2">
                    <i className="bi bi-telephone-fill"></i> +{formatJidToNumber(contact.jid)}
                </p>

                <hr className="w-100" style={{ borderColor: 'var(--border-color)' }} />

                {/* 🟢 BIO / RECADO */}
                <div className="w-100 text-start px-2">
                    <h6 className="text-muted small fw-bold text-uppercase mb-2">Recado / Bio</h6>
                    <p className="fs-6 mb-0" style={{ color: 'var(--text-primary)' }}>
                        {contact.bio || "Olá! Eu estou usando o WhatsApp."}
                    </p>
                </div>

                <hr className="w-100" style={{ borderColor: 'var(--border-color)' }} />

                {/* 🟢 ESPAÇO PARA O CRM (Pedidos, Anotações, etc) */}
                <div className="w-100 text-start px-2 mt-2">
                    <h6 className="text-muted small fw-bold text-uppercase mb-3">Anotações do CRM</h6>
                    
                    <div className="p-3 rounded text-center text-muted" style={{ backgroundColor: 'var(--bg-main, #f8fafc)', border: '1px dashed var(--border-color)' }}>
                        <i className="bi bi-journal-text fs-4 mb-2 d-block"></i>
                        <span className="small">Você pode adicionar histórico de pedidos e notas aqui no futuro.</span>
                    </div>
                </div>

            </Offcanvas.Body>
        </Offcanvas>
    );
};

export default ContactInfoPanel;