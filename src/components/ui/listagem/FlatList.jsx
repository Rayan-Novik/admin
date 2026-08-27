import React from 'react';
import { Spinner } from 'react-bootstrap';

// Container principal da lista (cuida do Loading e Empty State)
export const FlatListContainer = ({ children, loading, empty, emptyMessage = "Nenhum registro encontrado.", emptyIcon = "bi-inboxes" }) => {
    return (
        <div className="w-100">
            <style>{`
                .flat-list-item {
                    border: 1px solid rgba(100, 116, 139, 0.15);
                    transition: border-color 0.2s ease, transform 0.2s ease;
                }
                .flat-list-item:hover {
                    border-color: rgba(10, 132, 255, 0.3);
                }
            `}</style>

            {loading ? (
                <div className="text-center py-5">
                    <Spinner animation="border" style={{ color: '#0A84FF' }} />
                </div>
            ) : empty ? (
                <div className="text-center py-5 rounded-4 bg-white" style={{ border: '1px solid rgba(100, 116, 139, 0.15)' }}>
                    <i className={`bi ${emptyIcon} fs-1 d-block mb-3`} style={{ color: 'var(--text-secondary, #64748B)' }}></i>
                    <h5 className="fw-bold" style={{ color: 'var(--text-primary, #0F172A)' }}>Nada por aqui ainda</h5>
                    <p style={{ color: 'var(--text-secondary, #64748B)' }}>{emptyMessage}</p>
                </div>
            ) : (
                <div className="d-flex flex-column gap-2">
                    {children}
                </div>
            )}
        </div>
    );
};

// Cabeçalho da lista (some automaticamente no mobile)
export const FlatListHeader = ({ children }) => (
    <div className="d-none d-md-flex align-items-center px-4 mb-2 fw-bold text-uppercase" style={{ fontSize: '11px', color: 'var(--text-secondary, #64748B)', letterSpacing: '1px' }}>
        {children}
    </div>
);

// Cada linha/cartão da lista
export const FlatListItem = ({ children }) => (
    <div className="flat-list-item bg-white p-3 px-md-4 rounded-4 d-flex flex-column flex-md-row align-items-start align-items-md-center">
        {children}
    </div>
);