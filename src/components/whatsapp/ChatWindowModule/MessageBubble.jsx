import React, { useState, useEffect, useRef } from 'react';
import { Dropdown, Spinner } from 'react-bootstrap';

// =========================================================
// 🟢 EXTRAÇÃO BLINDADA DA LEGENDA
// =========================================================
const extractCaption = (conteudo) => {
    if (!conteudo) return '';
    let cleanText = conteudo.replace(/\\n/g, '\n').replace(/\[.*?\]/g, '');
    const match = cleanText.match(/(?:\/uploads\/|https?:\/\/)[^\s\n\r]+/);
    if (match) {
        cleanText = cleanText.replace(match[0], '');
    }
    return cleanText.trim();
};

// =========================================================
// 🟢 SUBCOMPONENTES
// =========================================================

const TextMessage = ({ msg }) => (
    <div style={{ whiteSpace: 'pre-wrap' }}>{msg.conteudo}</div>
);

const ViewOnceMessage = () => (
    <div className="d-flex align-items-center p-2 rounded shadow-sm border border-warning" style={{ backgroundColor: 'rgba(255, 193, 7, 0.15)' }}>
        <i className="bi bi-eye-slash-fill text-warning fs-3 me-3"></i>
        <div className="d-flex flex-column">
            <span className="fw-bold small" style={{ color: 'var(--text-primary)' }}>Visualização Única</span>
            <span className="text-muted" style={{ fontSize: '0.75rem' }}>Abra o WhatsApp no celular para ver esta mídia.</span>
        </div>
    </div>
);

const ImageMessage = ({ msg, getPureUrl, openMedia }) => {
    const imageUrl = getPureUrl(msg.conteudo);
    const legenda = extractCaption(msg.conteudo);

    return (
        <div className="p-1 d-flex flex-column">
            <img
                src={imageUrl}
                alt="Preview de Imagem"
                className="rounded img-fluid shadow-sm"
                style={{ maxHeight: '300px', minWidth: '150px', cursor: 'zoom-in', objectFit: 'cover', display: 'block' }}
                onClick={() => openMedia(msg.conteudo, 'image')}
                onError={(e) => {
                    e.target.style.display = 'none';
                    if (!e.target.nextSibling?.classList.contains('erro-midia')) {
                        e.target.insertAdjacentHTML('afterend', '<div class="text-muted small erro-midia p-2 border rounded bg-light text-center"><i class="bi bi-image me-2"></i>Imagem não carregou</div>');
                    }
                }}
            />
            {legenda && (
                <div style={{ fontSize: '0.9rem', color: 'inherit', marginTop: '8px', whiteSpace: 'pre-wrap' }}>
                    {legenda}
                </div>
            )}
        </div>
    );
};

const VideoMessage = ({ msg, openMedia }) => {
    const legenda = extractCaption(msg.conteudo);
    return (
        <div className="d-flex flex-column p-1">
            <div onClick={() => openMedia(msg.conteudo, 'video')} style={{ cursor: 'pointer' }} className="d-flex align-items-center p-2 bg-dark rounded text-white shadow-sm mb-1">
                <i className="bi bi-play-circle-fill me-2 fs-4 text-danger"></i>
                <div className="d-flex flex-column">
                    <span className="fw-bold small">Visualizar Vídeo</span>
                    <span style={{ fontSize: '0.7rem', opacity: 0.7 }}>Clique para abrir</span>
                </div>
            </div>
            {legenda && <div style={{ fontSize: '0.9rem', whiteSpace: 'pre-wrap', marginTop: '4px' }}>{legenda}</div>}
        </div>
    );
};

const AudioMessage = ({ msg, getPureUrl, onTranscribeAudio }) => {
    const audioUrl = getPureUrl(msg.conteudo);
    const [isPlaying, setIsPlaying] = useState(false);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const audioRef = useRef(null);

    const savedTranscription = msg.conteudo.includes('[IA]:') 
        ? msg.conteudo.split('[IA]:')[1].trim() 
        : null;

    const [transcription, setTranscription] = useState(savedTranscription);
    const [isTranscribing, setIsTranscribing] = useState(false);

    useEffect(() => {
        const audio = new Audio(audioUrl);
        audioRef.current = audio;

        const setAudioData = () => setDuration(audio.duration);
        const setAudioTime = () => setCurrentTime(audio.currentTime);
        const onEnd = () => {
            setIsPlaying(false);
            setCurrentTime(0);
        };

        audio.addEventListener('loadedmetadata', setAudioData);
        audio.addEventListener('timeupdate', setAudioTime);
        audio.addEventListener('ended', onEnd);

        return () => {
            audio.removeEventListener('loadedmetadata', setAudioData);
            audio.removeEventListener('timeupdate', setAudioTime);
            audio.removeEventListener('ended', onEnd);
            audio.pause();
            audio.src = '';
        };
    }, [audioUrl]);

    useEffect(() => {
        let isMounted = true;
        
        const autoTranscribe = async () => {
            if (onTranscribeAudio && !transcription && !isTranscribing) {
                setIsTranscribing(true);
                try {
                    const result = await onTranscribeAudio(msg.whatsappId);
                    if (isMounted) setTranscription(result);
                } catch (error) {
                    if (isMounted) setTranscription('❌ Falha ao transcrever o áudio.');
                } finally {
                    if (isMounted) setIsTranscribing(false);
                }
            }
        };

        autoTranscribe();

        return () => { isMounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); 

    const togglePlay = () => {
        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play();
        }
        setIsPlaying(!isPlaying);
    };

    const handleSeek = (e) => {
        const time = Number(e.target.value);
        audioRef.current.currentTime = time;
        setCurrentTime(time);
    };

    const formatTime = (time) => {
        if (isNaN(time) || !isFinite(time)) return "0:00";
        const m = Math.floor(time / 60);
        const s = Math.floor(time % 60);
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    const isMe = msg.fromMe;
    const color = isMe ? '#ffffff' : '#54656f';
    const progressColor = isMe ? '#89c3bc' : '#00a884';

    return (
        <div className="d-flex flex-column p-1" style={{ minWidth: '280px' }}>
            <div className="d-flex align-items-center gap-2">
                <button onClick={togglePlay} className="btn p-0 border-0 shadow-none">
                    <i className={`bi ${isPlaying ? 'bi-pause-fill' : 'bi-play-fill'} fs-1`} style={{ color: color, lineHeight: 1 }}></i>
                </button>

                <div className="d-flex flex-column flex-grow-1 pt-1">
                    <input
                        type="range"
                        min="0"
                        max={duration || 100}
                        value={currentTime}
                        onChange={handleSeek}
                        style={{ height: '5px', cursor: 'pointer', accentColor: progressColor }}
                        className="w-100 m-0 p-0"
                    />
                    
                    <div className="d-flex justify-content-between align-items-center mt-1">
                        <span style={{ fontSize: '0.7rem', color: color, opacity: 0.8 }}>
                            {currentTime > 0 ? formatTime(currentTime) : formatTime(duration)}
                        </span>
                        
                        {isTranscribing && (
                            <div className="d-flex align-items-center" style={{ fontSize: '0.65rem', color: color, opacity: 0.8 }}>
                                <Spinner size="sm" animation="border" className="me-1" style={{ width: '10px', height: '10px' }} />
                                Transcrevendo...
                            </div>
                        )}
                    </div>
                </div>

                <div className="rounded-circle bg-opacity-25 bg-secondary d-flex align-items-center justify-content-center ms-2" style={{ width: '45px', height: '45px', flexShrink: 0 }}>
                    <i className="bi bi-mic-fill fs-4" style={{ color: msg.lida && isMe ? '#53bdeb' : color }}></i>
                </div>
            </div>

            {transcription && (
                <div className="mt-2 p-2 rounded" style={{ backgroundColor: 'rgba(0,0,0,0.05)', fontSize: '0.85rem', fontStyle: 'italic', borderLeft: `3px solid ${progressColor}` }}>
                    <strong>IA:</strong> {transcription}
                </div>
            )}
        </div>
    );
};

const DocumentMessage = ({ msg, getPureUrl, openMedia }) => {
    const docUrl = getPureUrl(msg.conteudo);
    const fileName = docUrl.split('/').pop() || 'Arquivo Anexado';
    const legenda = extractCaption(msg.conteudo);

    return (
        <div className="d-flex flex-column p-1">
            <div onClick={() => openMedia(msg.conteudo, 'document')} style={{ cursor: 'pointer' }} className="d-flex align-items-center p-2 bg-opacity-10 bg-secondary rounded border shadow-sm">
                <i className="bi bi-file-earmark-arrow-down-fill text-danger fs-3 me-2"></i>
                <div className="d-flex flex-column overflow-hidden">
                    <span className="text-truncate small fw-bold" style={{ maxWidth: '150px', color: 'var(--text-primary)' }}>{fileName}</span>
                    <span className="text-muted" style={{ fontSize: '0.7rem' }}>Abrir anexo</span>
                </div>
            </div>
            {legenda && <div style={{ fontSize: '0.9rem', whiteSpace: 'pre-wrap', marginTop: '8px' }}>{legenda}</div>}
        </div>
    );
};

// =========================================================
// 🟢 BALÃO PRINCIPAL
// =========================================================

const MessageBubble = ({ msg, onEdit, onDelete, getPureUrl, openMedia, onTranscribeAudio, canSend }) => {
    const isDeleted = msg.tipo === 'deleted';
    const isEdited = msg.tipo === 'edited';

    const renderBubbleContent = () => {
        if (isDeleted) {
            return (
                <div className="d-flex align-items-center">
                    <i className="bi bi-slash-circle me-2"></i>{msg.conteudo}
                </div>
            );
        }

        switch (msg.tipo) {
            case 'view_once': return <ViewOnceMessage />;
            case 'image': return <ImageMessage msg={msg} getPureUrl={getPureUrl} openMedia={openMedia} />;
            case 'video': return <VideoMessage msg={msg} openMedia={openMedia} />;
            case 'audio': return <AudioMessage msg={msg} getPureUrl={getPureUrl} onTranscribeAudio={onTranscribeAudio} />;
            case 'document': return <DocumentMessage msg={msg} getPureUrl={getPureUrl} openMedia={openMedia} />;
            case 'text':
            case 'edited':
            default:
                return <TextMessage msg={msg} />;
        }
    };

    return (
        <div className={`d-flex mb-3 ${msg.fromMe ? 'justify-content-end' : 'justify-content-start'}`}>
            <div className="d-flex align-items-center gap-2">

                {/* 🟢 MENU DE OPÇÕES CONDICIONADO A TER PERMISSÃO DE ENVIO */}
                {msg.fromMe && canSend && !msg.whatsappId.startsWith('temp') && !isDeleted && (
                    <Dropdown drop={msg.fromMe ? "start" : "end"}>
                        <Dropdown.Toggle variant="link" className="p-0 text-muted border-0 shadow-none hide-caret" size="sm">
                            <i className="bi bi-three-dots-vertical"></i>
                        </Dropdown.Toggle>
                        <Dropdown.Menu size="sm">
                            {(msg.tipo === 'text' || msg.tipo === 'edited') && (
                                <Dropdown.Item onClick={() => onEdit(msg)}>
                                    <i className="bi bi-pencil me-2"></i>Editar
                                </Dropdown.Item>
                            )}

                            <Dropdown.Item className="text-danger" onClick={() => onDelete(msg.whatsappId)}>
                                <i className="bi bi-trash me-2"></i>Apagar
                            </Dropdown.Item>
                        </Dropdown.Menu>
                    </Dropdown>
                )}

                {/* ESTRUTURA DO BALÃO */}
                <div
                    className={`p-2 px-3 shadow-sm rounded-3 ${isDeleted
                            ? 'bg-light text-muted border'
                            : (msg.fromMe ? 'bg-success text-white' : 'bg-white text-dark')
                        }`}
                    style={{
                        maxWidth: '400px',
                        borderTopRightRadius: msg.fromMe ? '0px' : '12px',
                        borderTopLeftRadius: !msg.fromMe ? '0px' : '12px',
                        fontStyle: isDeleted ? 'italic' : 'normal'
                    }}
                >
                    <div className="d-flex flex-column" style={{ wordBreak: 'break-word', whiteSpace: 'pre-wrap', fontSize: '0.9rem' }}>
                        {renderBubbleContent()}
                    </div>

                    {!isDeleted && (
                        <div className={`text-end mt-1 d-flex align-items-center justify-content-end ${msg.fromMe ? 'text-light' : 'text-muted'}`} style={{ fontSize: '0.65rem' }}>
                            {isEdited && <span className="me-1" style={{ fontStyle: 'italic', opacity: 0.8 }}>Editada</span>}
                            {new Date(msg.data_envio).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            {msg.fromMe && <i className="bi bi-check2-all ms-1"></i>}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MessageBubble;