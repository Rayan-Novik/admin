import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Spinner } from 'react-bootstrap';
import api from '../../services/api';
import ChatSidebar from '../../components/whatsapp/ChatSidebar';
import ChatWindow from '../../components/whatsapp/ChatWindow';

const WhatsAppChatPage = () => {
    const [chats, setChats] = useState([]);
    const [selectedChat, setSelectedChat] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchChats = async (query = '') => {
        try {
            // 🟢 ATUALIZADO: Busca os contatos no banco do Whazing
            const { data } = await api.get('/kanban/whazing/contacts/search', {
                params: { query: query } // O backend aceita a query para filtrar
            });
            // O retorno é geralmente { contacts: [...] } ou um array direto
            setChats(data.contacts || data || []);
        } catch (error) {
            console.error("Erro ao buscar lista de contatos Whazing:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchChats();
        // Atualiza a lista a cada 15 segundos
        const interval = setInterval(() => fetchChats(), 15000); 
        return () => clearInterval(interval);
    }, []);

    return (
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
                            selectedJid={selectedChat?.number} // Whazing usa number em vez de JID
                            onSelectChat={setSelectedChat} 
                            onSearch={fetchChats} // Permite a barra lateral pesquisar
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
                body, html { overflow: hidden !important; margin: 0; padding: 0; }
                @media (min-width: 768px) {
                    .chat-page-container { height: 100vh !important; min-height: 100vh !important; }
                }
                @media (max-width: 767.98px) {
                    .chat-page-container { height: calc(100dvh - 65px) !important; min-height: calc(100dvh - 65px) !important; }
                }
            `}</style>
        </Container>
    );
};

export default WhatsAppChatPage;