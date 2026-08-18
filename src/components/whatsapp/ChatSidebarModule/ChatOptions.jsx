import React from 'react';
import { Dropdown } from 'react-bootstrap';

// 🟢 1. Adicionado o isBotEnabled nas props
const ChatOptions = ({ chat, onAction, isBotEnabled }) => {
    const isArquivado = chat.status === 'arquivados';
    const isPendente = chat.status === 'pendentes'; 
    const isBot = chat.status === 'bot'; // Verifica se a IA está atendendo

    return (
        <Dropdown onClick={(e) => e.stopPropagation()}>
            <Dropdown.Toggle 
                variant="link" 
                className="p-0 text-muted border-0 shadow-none hide-caret" 
                style={{ fontSize: '1.2rem' }}
            >
                <i className="bi bi-chevron-down"></i>
            </Dropdown.Toggle>

            <Dropdown.Menu align="end" className="shadow border-0" style={{ backgroundColor: 'var(--bg-sidebar)', border: '1px solid var(--border-color)' }}>
                
                {/* 🟢 2. OPÇÃO DA IA (Regra de Exibição Atualizada) */}
                {!isBot ? (
                    // Se não for o Bot, só mostra o botão de enviar pra IA SE a IA estiver ativada no sistema
                    isBotEnabled && (
                        <Dropdown.Item 
                            onClick={() => onAction('enviar_bot', chat)}
                            className="fw-bold text-info dropdown-item-custom py-2"
                        >
                            <i className="bi bi-robot me-2 fs-5 align-middle"></i> Enviar para IA Automática
                        </Dropdown.Item>
                    )
                ) : (
                    // Se o Bot já estiver atendendo, sempre permite que o humano assuma (segurança)
                    <Dropdown.Item 
                        onClick={() => onAction('atender', chat)}
                        className="fw-bold text-success dropdown-item-custom py-2"
                    >
                        <i className="bi bi-person-fill me-2 fs-5 align-middle"></i> Assumir Atendimento (Sair da IA)
                    </Dropdown.Item>
                )}

                {/* 🟢 Oculta o divisor se não tiver nenhuma opção de IA renderizada acima */}
                {(isBot || isBotEnabled) && (
                    <Dropdown.Divider style={{ borderColor: 'var(--border-color)' }} />
                )}

                {/* 🟢 SE ESTIVER NOS PENDENTES E NÃO FOR BOT */}
                {isPendente && !isBot ? (
                    <Dropdown.Item 
                        onClick={() => onAction('atender', chat)}
                        className="fw-bold text-success dropdown-item-custom py-2"
                    >
                        <i className="bi bi-play-circle-fill me-2 fs-5 align-middle"></i> Iniciar Atendimento
                    </Dropdown.Item>
                ) : (
                    /* 🟢 SE ESTIVER EM ATENDIMENTO HUMANO: Mostra o menu completo */
                    !isBot && (
                        <>
                            <Dropdown.Item 
                                onClick={() => onAction('fixar', chat)}
                                style={{ color: 'var(--text-primary)' }}
                                className="dropdown-item-custom"
                            >
                                <i className="bi bi-pin-angle me-2"></i> Fixar conversa
                            </Dropdown.Item>
                            
                            {isArquivado ? (
                                <Dropdown.Item 
                                    onClick={() => onAction('atender', chat)}
                                    style={{ color: 'var(--text-primary)' }}
                                    className="dropdown-item-custom"
                                >
                                    <i className="bi bi-box-arrow-up me-2"></i> Desarquivar / Atender
                                </Dropdown.Item>
                            ) : (
                                <Dropdown.Item 
                                    onClick={() => onAction('arquivar', chat)}
                                    style={{ color: 'var(--text-primary)' }}
                                    className="dropdown-item-custom"
                                >
                                    <i className="bi bi-archive me-2"></i> Arquivar
                                </Dropdown.Item>
                            )}

                            <Dropdown.Item 
                                onClick={() => onAction('abrir_transferencia', chat)}
                                style={{ color: 'var(--text-primary)' }}
                                className="dropdown-item-custom"
                            >
                                <i className="bi bi-person-gear me-2"></i> Transferir
                            </Dropdown.Item>

                            <Dropdown.Divider style={{ borderColor: 'var(--border-color)' }} />

                            <Dropdown.Item 
                                className="text-danger dropdown-item-custom" 
                                onClick={() => onAction('finalizar', chat)}
                            >
                                <i className="bi bi-check2-all me-2"></i> Finalizar atendimento
                            </Dropdown.Item>
                        </>
                    )
                )}
            </Dropdown.Menu>

            <style>{`
                .dropdown-item-custom:hover {
                    background-color: var(--bg-hover, #f8f9fa) !important;
                }
            `}</style>
        </Dropdown>
    );
};

export default ChatOptions;