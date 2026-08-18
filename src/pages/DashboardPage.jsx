import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { usePermission } from '../hooks/usePermission';

// IMPORTANDO AS DUAS VERSÕES VISUAIS
import DashboardDesktop from './desktop/DashboardDesktop';
import DashboardMobile from './mobile/DashboardMobile';

const DashboardPage = () => {
    // ------------------------------------------------------------------
    // CONTROLE DE LARGURA DA TELA (Verifica se é Mobile ou Desktop)
    // ------------------------------------------------------------------
    const [isMobile, setIsMobile] = useState(window.innerWidth < 992);
    
    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 992);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // ------------------------------------------------------------------
    // ESTADOS GERAIS DO DASHBOARD
    // ------------------------------------------------------------------
    const [dateRange, setDateRange] = useState({
        startDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0]
    });
    
    const [activeFilter, setActiveFilter] = useState('30d');
    const [showFilterModal, setShowFilterModal] = useState(false);
    const [customDates, setCustomDates] = useState({ start: '', end: '' });

    const [storeUrl, setStoreUrl] = useState('');
    const [copySuccess, setCopySuccess] = useState(false);
    const [isMlEnabled, setIsMlEnabled] = useState(false);

    // ESTADOS PARA AS NOTIFICAÇÕES
    const [totalUnreadWhatsapp, setTotalUnreadWhatsapp] = useState(0);
    const [totalNewOrders, setTotalNewOrders] = useState(0);

    const { can } = usePermission();
    const navigate = useNavigate();

    // 🟢 DADOS DO USUÁRIO LOGADO
    const adminInfo = JSON.parse(localStorage.getItem('adminInfo') || '{}');
    const roleUsuario = adminInfo.role || 'USER';
    const meuId = (adminInfo.id_usuario === 'DONO' || roleUsuario === 'ADMIN') ? 0 : Number(adminInfo.id_usuario || -1);
    
    // Extraindo Nome e Imagem
    const userName = adminInfo.nome_completo || 'Usuário';
    const userImage = adminInfo.imagem || '';

    // ------------------------------------------------------------------
    // EFEITOS E REQUISIÇÕES DA API
    // ------------------------------------------------------------------
    useEffect(() => {
        const checkMlStatus = async () => {
            try {
                const { data } = await api.get('/mercadolivre/check-auth');
                setIsMlEnabled(data.isAuthenticated);
            } catch (error) {
                setIsMlEnabled(false);
            }
        };
        checkMlStatus();

        const slug = localStorage.getItem('tenantSlug'); 
        const domain = localStorage.getItem('tenantDomain'); 

        if (domain && domain !== 'null' && domain !== 'undefined') {
            setStoreUrl(`https://${domain}`);
        } else if (slug) {
            setStoreUrl(`https://${slug}.ararinhacloud.shop`);
        } else {
            setStoreUrl('https://ararinhacloud.shop'); 
        }
    }, []);

    useEffect(() => {
        const fetchCounters = async () => {
            try {
                if (can('CONFIG_INTEGRATIONS')) {
                    const { data } = await api.get('/whatsapp/chats');
                    let countZap = 0;
                    data.forEach(chat => {
                        if (chat.naoLidas > 0) {
                            const chatStatus = chat.status || 'atendimento';
                            const temDono = chat.responsavelId !== null && chat.responsavelId !== undefined;
                            const isPendente = chatStatus === 'pendentes' || (!temDono && chatStatus !== 'arquivados');
                            const isMeuAtendimento = chatStatus === 'atendimento' && temDono && Number(chat.responsavelId) === meuId;

                            if (isPendente || isMeuAtendimento) {
                                countZap++;
                            }
                        }
                    });
                    setTotalUnreadWhatsapp(countZap);
                }

                if (can('PEDIDOS_VIEW')) {
                    const { data: pedidosData } = await api.get('/pedidos/novos/count');
                    setTotalNewOrders(pedidosData.count || 0);
                }
            } catch (error) {}
        };

        fetchCounters();
        const interval = setInterval(fetchCounters, 15000); 
        return () => clearInterval(interval);
    }, [can, meuId]);

    // ------------------------------------------------------------------
    // FUNÇÕES DE AÇÃO
    // ------------------------------------------------------------------
    const handleCopyLink = () => {
        navigator.clipboard.writeText(storeUrl);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2500); 
    };

    const handlePresetChange = (period) => {
        const end = new Date();
        const start = new Date();
        
        if (period === 'hoje') start.setDate(end.getDate());
        else if (period === 'mes') start.setDate(1); 
        else if (period === '30d') start.setDate(end.getDate() - 30);
        else if (period === '90d') start.setDate(end.getDate() - 90);
        else if (period === 'all') start.setFullYear(2020); 

        setDateRange({
            startDate: start.toISOString().split('T')[0],
            endDate: end.toISOString().split('T')[0]
        });
        setActiveFilter(period);
    };

    const applyCustomFilter = () => {
        if (customDates.start && customDates.end) {
            setDateRange({ startDate: customDates.start, endDate: customDates.end });
            setActiveFilter('custom');
            setShowFilterModal(false);
        }
    };

    const totalNotifications = totalUnreadWhatsapp + totalNewOrders;

    // ------------------------------------------------------------------
    // OBJETO COM TODAS AS PROPS PARA REPASSAR FÁCIL
    // ------------------------------------------------------------------
    const dashboardProps = {
        dateRange, setDateRange,
        activeFilter, setActiveFilter,
        showFilterModal, setShowFilterModal,
        customDates, setCustomDates,
        storeUrl, setStoreUrl,
        copySuccess, setCopySuccess,
        isMlEnabled, setIsMlEnabled,
        totalUnreadWhatsapp, totalNewOrders, totalNotifications,
        handleCopyLink, handlePresetChange, applyCustomFilter, navigate,
        userName, // 🟢 PASSA O NOME PRO MOBILE
        userImage // 🟢 PASSA A IMAGEM PRO MOBILE
    };

    // ------------------------------------------------------------------
    // RETORNA A TELA CORRETA BASEADO NO TAMANHO
    // ------------------------------------------------------------------
    return (
        <>
            {/* CSS Global mantido no Controlador para servir a ambos, caso precisem */}
            <style>{`
                .clean-card {
                    background: var(--bg-sidebar, #ffffff);
                    border: 1px solid var(--border-color, #e2e8f0);
                    border-radius: 12px;
                    box-shadow: none;
                    overflow: hidden;
                }
                
                .filter-btn {
                    background: var(--bg-sidebar, #ffffff);
                    border: 1px solid var(--border-color, #e2e8f0);
                    color: var(--text-secondary, #475569);
                    font-size: 13px;
                    font-weight: 500;
                    border-radius: 8px;
                    padding: 6px 14px;
                    transition: all 0.2s;
                }
                .filter-btn:hover { background: var(--bg-hover, #f1f5f9); }
                .filter-btn.active {
                    background: var(--bg-active, #86efac) !important;
                    border-color: var(--bg-active, #86efac) !important;
                    color: var(--text-active, #14532d) !important;
                    font-weight: 600;
                }
                
                .copy-link-pill {
                    background: var(--bg-sidebar, #ffffff);
                    border-color: var(--border-color, #e2e8f0) !important;
                }

                .kpi-title {
                    color: var(--text-secondary, #64748b);
                    font-size: 13px;
                    font-weight: 500;
                    margin-bottom: 6px;
                }
                .kpi-value {
                    color: var(--text-primary, #0f172a);
                    font-size: 28px;
                    font-weight: 700;
                    line-height: 1;
                }
                .section-title {
                    font-size: 14px;
                    font-weight: 600;
                    color: var(--text-primary, #0f172a);
                    display: flex;
                    align-items: center;
                }

                /* Ajustes de Modal e Forms para Dark Mode */
                body.dark-mode .modal-dark-fix { background-color: var(--bg-sidebar); border-color: var(--border-color); }
                body.dark-mode .form-dark-fix { background-color: var(--bg-main); border-color: var(--border-color); color: var(--text-primary); }
                body.dark-mode .form-dark-fix:focus { background-color: var(--bg-main); color: var(--text-primary); }
                body.dark-mode .btn-close { filter: invert(1); }
            `}</style>

            {isMobile ? (
                <DashboardMobile {...dashboardProps} />
            ) : (
                <DashboardDesktop {...dashboardProps} />
            )}
        </>
    );
};

export default DashboardPage;