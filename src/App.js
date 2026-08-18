import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, useLocation } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import io from 'socket.io-client';

// 🚀 AQUI ESTÁ A MÁGICA: Importando as rotas do novo arquivo
import AppRoutes from './routes'; 

import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

const SOCKET_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const MobileFixStyles = () => (
    <style type="text/css">{`
        @media (max-width: 991px) {
            .main-content-mobile-fix {
                padding-bottom: 90px !important;
            }
        }
    `}</style>
);

const StoreUrlManager = () => {
    const location = useLocation();

    useEffect(() => {
        const searchParams = new URLSearchParams(location.search);
        const storeFromUrl = searchParams.get('store');

        if (storeFromUrl) {
            localStorage.setItem('tenantSlug', storeFromUrl);
        }
    }, [location]);

    return null;
};

function App() {
    const [adminInfo, setAdminInfo] = useState(null);
    const [loading, setLoading] = useState(true);

    const [notifications, setNotifications] = useState(() => {
        const savedNotifs = localStorage.getItem('notifications');
        return savedNotifs ? JSON.parse(savedNotifs) : [];
    });

    useEffect(() => {
        const storedAdminInfo = localStorage.getItem('adminInfo');
        if (storedAdminInfo) {
            setAdminInfo(JSON.parse(storedAdminInfo));
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        localStorage.setItem('notifications', JSON.stringify(notifications));
    }, [notifications]);

    useEffect(() => {
        if (!adminInfo) return;

        const socket = io(SOCKET_URL);
        socket.on('connect', () => console.log('🟢 Socket conectado:', socket.id));

        socket.on('novo_pedido', (pedido) => {
            setNotifications(prev => [pedido, ...prev]);
            const audio = new Audio('/sounds/notification.mp3');
            audio.play().catch(e => console.log("Som bloqueado"));

            toast.success(
                <div>
                    <strong>💰 Novo Pedido #{pedido.id}!</strong><br />
                    Cliente: {pedido.cliente}<br />
                    Total: R$ {parseFloat(pedido.total).toFixed(2)}
                </div>,
                { position: "top-right", autoClose: 8000 }
            );
        });

        return () => socket.disconnect();
    }, [adminInfo]);

    const handleLogin = (info) => {
        localStorage.setItem('adminInfo', JSON.stringify(info));
        setAdminInfo(info);
    };

    const handleLogout = () => {
        localStorage.removeItem('adminInfo');
        localStorage.removeItem('tenantId');
        localStorage.removeItem('tenantSlug');
        
        setAdminInfo(null);
        window.location.href = '/login';
    };

    if (loading) return <div className="d-flex justify-content-center align-items-center vh-100">Carregando...</div>;

    return (
        <Router>
            <StoreUrlManager />
            <MobileFixStyles />
            <ToastContainer />
            
            {/* 🟢 Rotas totalmente liberadas, sem o PermissionProvider */}
            <AppRoutes 
                adminInfo={adminInfo}
                handleLogin={handleLogin}
                handleLogout={handleLogout}
                notifications={notifications}
                onClearNotifications={() => setNotifications([])}
            />
            
        </Router>
    );
}

export default App;