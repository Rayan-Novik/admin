import React, { useEffect } from 'react';
import io from 'socket.io-client';
import { toast } from 'react-toastify'; 
import { Button } from 'react-bootstrap'; // Importar para usar no Toast
import notificationSound from '../assets/sounds/notification.mp3';

const socket = io(process.env.REACT_APP_API_URL || 'https://admin.ecommercerpool.shop/');

// Componente visual personalizado para o Toast
const CustomToast = ({ pedido }) => (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
        <div style={{ fontSize: '24px' }}>🛍️</div>
        <div>
            <h6 style={{ margin: 0, fontWeight: 'bold' }}>Novo Pedido #{pedido.id}</h6>
            <p style={{ margin: '5px 0', fontSize: '14px', color: '#555' }}>
                <strong>Cliente:</strong> {pedido.cliente || 'Consumidor'}<br />
                <strong>Total:</strong> <span className="text-success fw-bold">R$ {parseFloat(pedido.total).toFixed(2)}</span>
            </p>
            <div style={{ marginTop: '8px' }}>
                <small className="badge bg-warning text-dark me-2">
                    {pedido.tipo || 'Entrega'}
                </small>
                <small className="badge bg-info text-white">
                    {pedido.status || 'Pendente'}
                </small>
            </div>
            <div className="mt-2">
                <Button 
                    variant="outline-primary" 
                    size="sm" 
                    style={{ fontSize: '12px', padding: '2px 8px' }}
                    onClick={() => window.location.href = `/admin/order/${pedido.id}`}
                >
                    Ver Detalhes
                </Button>
            </div>
        </div>
    </div>
);

const NotificationListener = () => {
    
    useEffect(() => {
        if (Notification.permission !== 'granted') {
            Notification.requestPermission();
        }

        socket.on('novo_pedido', (pedido) => {
            console.log("🔔 Pedido recebido:", pedido);
            
            playAlertSound();
            showSystemNotification(pedido);
            
            // ✅ Alerta Visual Melhorado
            toast(<CustomToast pedido={pedido} />, {
                position: "top-right",
                autoClose: 15000, // Fica 15s na tela
                hideProgressBar: false,
                closeOnClick: false, // False para permitir clicar no botão dentro
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
                style: { 
                    borderLeft: '5px solid #28a745', // Borda verde para indicar sucesso/dinheiro
                    padding: '15px'
                }
            });
        });

        return () => {
            socket.off('novo_pedido');
        };
    }, []);

    const playAlertSound = () => {
        try {
            const audio = new Audio(notificationSound);
            audio.volume = 0.8; // Ajuste de volume
            // Tenta tocar. Se o browser bloquear, loga o erro mas não quebra o app
            const playPromise = audio.play();
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    console.log("Autoplay bloqueado. O usuário precisa interagir com a página primeiro.");
                });
            }
        } catch (e) {
            console.error("Erro ao tocar som", e);
        }
    };

    const showSystemNotification = (pedido) => {
        // Verifica se a aba está oculta para não duplicar o som/atenção se o usuário já estiver olhando
        if (document.hidden && Notification.permission === 'granted') {
            const notif = new Notification(`💰 Novo Pedido: R$ ${parseFloat(pedido.total).toFixed(2)}`, {
                body: `Cliente: ${pedido.cliente}\nClique para ver os detalhes.`,
                icon: '/logo192.png', // Certifique-se que essa imagem existe em public/
                tag: 'novo_pedido', // Evita spam visual empilhando muitas msgs
                renotify: true, // Vibra/toca som novamente mesmo se já tiver notificação
                vibrate: [200, 100, 200],
                requireInteraction: true // A notificação fica na tela até o usuário fechar
            });

            // ✅ Clique na notificação nativa abre a janela do pedido
            notif.onclick = function(event) {
                event.preventDefault(); // Previne foco padrão
                window.open(`/admin/order/${pedido.id}`, '_blank');
                notif.close();
            };
        }
    };

    return null;
};

export default NotificationListener;