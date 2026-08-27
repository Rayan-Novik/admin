import React from 'react';
import { Modal, Form } from 'react-bootstrap';

export const AppModal = ({ show, onHide, title, subtitle, children, footer, onSubmit }) => {
    // Conteúdo interno padronizado do Modal
    const modalContent = (
        <div className="bg-white rounded-4 overflow-hidden" style={{ border: '1px solid rgba(100, 116, 139, 0.15)' }}>
            
            {/* Cabeçalho Limpo */}
            <div className="p-4 border-bottom-0 pb-0">
                <div className="d-flex justify-content-between align-items-center mb-1">
                    <h5 className="fw-bold m-0" style={{ color: 'var(--text-primary, #0F172A)' }}>
                        {title}
                    </h5>
                    <button type="button" onClick={onHide} className="btn-close shadow-none"></button>
                </div>
                {subtitle && <p style={{ fontSize: '13px', color: 'var(--text-secondary, #64748B)' }}>{subtitle}</p>}
            </div>

            {/* Corpo */}
            <Modal.Body className="p-4 pt-2">
                {children}
            </Modal.Body>

            {/* Rodapé Dinâmico (Botões) */}
            {footer && (
                <div className="p-4 pt-0 d-flex gap-2">
                    {footer}
                </div>
            )}
        </div>
    );

    return (
        <Modal show={show} onHide={onHide} centered contentClassName="border-0 rounded-4 bg-transparent">
            {/* Se passar "onSubmit", ele envelopa tudo num <Form> pra você! */}
            {onSubmit ? (
                <Form onSubmit={onSubmit}>{modalContent}</Form>
            ) : (
                modalContent
            )}
        </Modal>
    );
};