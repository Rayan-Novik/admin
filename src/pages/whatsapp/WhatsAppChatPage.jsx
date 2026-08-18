import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Spinner } from 'react-bootstrap';
import api from '../../services/api';
import ChatSidebar from '../../components/whatsapp/ChatSidebar';
import ChatWindow from '../../components/whatsapp/ChatWindow';

const WhatsAppChatPage = () => {
    const [chats, setChats] = useState([]);
    const [selectedChat, setSelectedChat] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchChats = async () => {
        try {
            const { data } = await api.get('/whatsapp/chats');
            setChats(data);
        } catch (error) {
            console.error("Erro ao buscar lista de chats:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchChats();
        const interval = setInterval(fetchChats, 8000); 
        return () => clearInterval(interval);
    }, []);

    return (
        /* 
            🟢 SOLUÇÃO DEFINITIVA:
            Removemos o estilo fixo daqui e passamos para a classe CSS 'chat-page-container'
            que criamos ali embaixo no <style>.
        */
        <Container fluid className="p-0 d-flex flex-column chat-page-container">

            {loading ? (
                <div className="flex-grow-1 d-flex justify-content-center align-items-center">
                    <Spinner animation="border" variant="success" />
                </div>
            ) : (
                <Row className="m-0 h-100 overflow-hidden flex-nowrap">
                    
                    {/* COLUNA ESQUERDA */}
                    <Col 
                        xs={12} md={4} lg={3} 
                        className={`p-0 h-100 border-end ${selectedChat ? 'd-none d-md-block' : 'd-block'}`}
                        style={{ backgroundColor: 'var(--bg-sidebar)' }}
                    >
                        <ChatSidebar 
                            chats={chats} 
                            selectedJid={selectedChat?.jid} 
                            onSelectChat={setSelectedChat} 
                        />
                    </Col>

                    {/* COLUNA DIREITA */}
                    <Col 
                        xs={12} md={8} lg={9} 
                        className={`p-0 h-100 ${selectedChat ? 'd-block' : 'd-none d-md-block'}`}
                        style={{ display: 'flex', flexDirection: 'column' }}
                    >
                        <ChatWindow 
                            selectedChat={selectedChat} 
                            onBack={() => setSelectedChat(null)} 
                        />
                    </Col>
                </Row>
            )}

            <style>{`
                /* 1. Reset de segurança */
                body, html {
                    overflow: hidden !important;
                    margin: 0;
                    padding: 0;
                }

                /* 2. Lógica responsiva de altura */
                
                /* DESKTOP (md para cima) */
                @media (min-width: 768px) {
                    .chat-page-container {
                        height: 100vh !important; /* No desktop ocupa tudo */
                        min-height: 100vh !important;
                    }
                }

                /* MOBILE (abaixo de 768px) */
                @media (max-width: 767.98px) {
                    .chat-page-container {
                        /* No mobile desconta os 65px do seu menu inferior azul */
                        height: calc(100dvh - 65px) !important;
                        min-height: calc(100dvh - 65px) !important;
                    }
                }

                .main-content-mobile-fix {
                    padding: 0 !important;
                    overflow: hidden;
                }
            `}</style>
        </Container>
    );
};

export default WhatsAppChatPage;