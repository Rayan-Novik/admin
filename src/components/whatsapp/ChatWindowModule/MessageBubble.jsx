import React from 'react';
import { Dropdown } from 'react-bootstrap';

const MessageBubble = ({ msg, onDelete, openMedia, canSend }) => {
    // Whazing usa 'fromMe', 'body' para o texto, 'mediaUrl' para anexos, e 'createdAt' para a data
    const isDeleted = msg.isDeleted;
    const isMe = msg.fromMe;
    
    // Se a mensagem tiver mídia (imagem/pdf/etc), o Whazing costuma popular o mediaUrl
    const hasMedia = !!msg.mediaUrl;
    
    const renderBubbleContent = () => {
        if (isDeleted) {
            return <div><i className="bi bi-slash-circle me-2"></i>Mensagem apagada</div>;
        }

        if (hasMedia) {
            const isImage = msg.mediaUrl.match(/\.(jpeg|jpg|gif|png)$/i) != null;
            if (isImage) {
                return (
                    <div className="p-1 d-flex flex-column">
                        <img src={msg.mediaUrl} alt="Midia" className="rounded img-fluid" style={{ maxHeight: '300px', cursor: 'pointer' }} onClick={() => openMedia(msg.mediaUrl, 'image')} />
                        {msg.body && <div className="mt-2">{msg.body}</div>}
                    </div>
                );
            }
            return (
                <div className="d-flex align-items-center p-2 bg-opacity-10 bg-secondary rounded" style={{ cursor: 'pointer' }} onClick={() => openMedia(msg.mediaUrl, 'document')}>
                    <i className="bi bi-file-earmark-arrow-down-fill text-danger fs-3 me-2"></i>
                    <span className="text-truncate fw-bold">{msg.body || 'Arquivo Anexo'}</span>
                </div>
            );
        }

        return <div style={{ whiteSpace: 'pre-wrap' }}>{msg.body}</div>;
    };

    return (
        <div className={`d-flex mb-3 ${isMe ? 'justify-content-end' : 'justify-content-start'}`}>
            <div className="d-flex align-items-center gap-2">
                
                {isMe && canSend && !msg.id?.toString().startsWith('temp') && !isDeleted && (
                    <Dropdown drop="start">
                        <Dropdown.Toggle variant="link" className="p-0 text-muted border-0 shadow-none hide-caret" size="sm">
                            <i className="bi bi-three-dots-vertical"></i>
                        </Dropdown.Toggle>
                        <Dropdown.Menu size="sm">
                            <Dropdown.Item className="text-danger" onClick={() => onDelete(msg.id)}>
                                <i className="bi bi-trash me-2"></i>Apagar
                            </Dropdown.Item>
                        </Dropdown.Menu>
                    </Dropdown>
                )}

                <div
                    className={`p-2 px-3 shadow-sm rounded-3 ${isDeleted ? 'bg-light text-muted border' : (isMe ? 'bg-success text-white' : 'bg-white text-dark')}`}
                    style={{
                        maxWidth: '400px',
                        borderTopRightRadius: isMe ? '0px' : '12px',
                        borderTopLeftRadius: !isMe ? '0px' : '12px'
                    }}
                >
                    <div className="d-flex flex-column" style={{ wordBreak: 'break-word', fontSize: '0.9rem' }}>
                        {renderBubbleContent()}
                    </div>

                    {!isDeleted && (
                        <div className={`text-end mt-1 ${isMe ? 'text-light' : 'text-muted'}`} style={{ fontSize: '0.65rem' }}>
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            {isMe && <i className="bi bi-check2-all ms-1"></i>}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MessageBubble;