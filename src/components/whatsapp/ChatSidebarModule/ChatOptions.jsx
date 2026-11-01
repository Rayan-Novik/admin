import React from 'react';
import { Dropdown } from 'react-bootstrap';

const ChatOptions = ({ chat }) => {
    return (
        <Dropdown onClick={(e) => e.stopPropagation()}>
            <Dropdown.Toggle 
                variant="link" 
                className="p-0 text-muted border-0 shadow-none hide-caret" 
                style={{ fontSize: '1.2rem' }}
            >
                <i className="bi bi-three-dots-vertical"></i>
            </Dropdown.Toggle>

            <Dropdown.Menu align="end" className="shadow border-0" style={{ backgroundColor: 'var(--bg-sidebar)', border: '1px solid var(--border-color)' }}>
                <Dropdown.Item 
                    className="fw-bold text-success dropdown-item-custom py-2"
                >
                    <i className="bi bi-chat-dots-fill me-2 fs-5 align-middle"></i> Abrir Conversa
                </Dropdown.Item>
            </Dropdown.Menu>

            <style>{`
                .dropdown-item-custom:hover {
                    background-color: var(--bg-hover, #f8f9fa) !important;
                }
                .hide-caret::after { 
                    display: none !important; 
                }
            `}</style>
        </Dropdown>
    );
};

export default ChatOptions;