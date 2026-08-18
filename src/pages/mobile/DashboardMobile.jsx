import React, { useState } from 'react';
import { Dropdown, Modal, Form, Button } from 'react-bootstrap';
import StatCards from '../../components/dashboard/StatCards';
import DetailedSalesChart from '../../components/dashboard/DetailedSalesChart'; 
import PaymentMethodsChart from '../../components/dashboard/PaymentMethodsChart'; 
import RecentOrders from '../../components/dashboard/RecentOrders';
import ProductAuditChart from '../../components/dashboard/ProductAuditChart'; 
import InventoryStatus from '../../components/dashboard/InventoryStatus';
import TopProductsChart from '../../components/dashboard/TopProductsChart';
import MostViewedProductsChart from '../../components/dashboard/MostViewedProductsChart';
import ReviewsSummary from '../../components/dashboard/ReviewsSummary';

const DashboardMobile = ({
    dateRange, activeFilter, handlePresetChange, storeUrl,
    copySuccess, handleCopyLink, isMlEnabled,
    totalNotifications, totalNewOrders, totalUnreadWhatsapp, navigate,
    showFilterModal, setShowFilterModal, customDates, setCustomDates, applyCustomFilter,
    // 🟢 NOVAS PROPRIEDADES RECEBIDAS: NOME E IMAGEM DO USUÁRIO
    userName = "Usuário", 
    userImage = "" 
}) => {
    const [showFilterMenu, setShowFilterMenu] = useState(false);

    const selectFilter = (filterType) => {
        if (filterType === 'custom') {
            setShowFilterMenu(false);
            setShowFilterModal(true);
        } else {
            handlePresetChange(filterType);
            setShowFilterMenu(false);
        }
    };

    // 🟢 Cria a URL do avatar de fallback baseada na primeira letra do nome, caso ele não tenha foto enviada
    const fallbackAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=0D8ABC&color=fff&rounded=true&size=128`;
    const imageToDisplay = userImage ? userImage : fallbackAvatar;
    
    return (
        <div className="mobile-dashboard-wrapper">
            <style>{`
                .mobile-dashboard-wrapper {
                    background-color: #218cf4; /* Fundo azul estilo imagem */
                    min-height: 100vh;
                    font-family: 'Inter', sans-serif;
                }
                
                .mobile-topbar {
                    padding: 30px 25px 20px 25px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .profile-img-container {
                    width: 50px;
                    height: 50px;
                    background-color: #ffffff;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin-right: 12px;
                    box-shadow: 0 4px 10px rgba(0,0,0,0.1);
                    overflow: hidden;
                }

                .filter-menu-btn {
                    background: none;
                    border: none;
                    color: #ffffff;
                    padding: 8px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                /* MAGIA AQUI: Transforma os cards brancos padrão em cards cinzas arredondados SOMENTE NO MOBILE */
                .mobile-dashboard-wrapper .clean-card {
                    background-color: #e6e6e6 !important;
                    border: none !important;
                    border-radius: 20px !important;
                    box-shadow: none !important;
                }
                
                .mobile-dashboard-wrapper .chart-card-mobile {
                    background: transparent;
                    border: none;
                    box-shadow: none;
                }
                
                /* AJUSTES DARK MODE PARA MODAL E FORMULÁRIO */
                body.dark-mode .modal-dark-fix { background-color: var(--bg-sidebar); border-color: var(--border-color); }
                body.dark-mode .form-dark-fix { background-color: var(--bg-main); border-color: var(--border-color); color: var(--text-primary); }
                body.dark-mode .form-dark-fix:focus { background-color: var(--bg-main); color: var(--text-primary); }
                body.dark-mode .btn-close { filter: invert(1); }
            `}</style>

            {/* HEADER FIXO TOPO - DADOS DINÂMICOS */}
            <div className="mobile-topbar">
                <div className="d-flex align-items-center">
                    <div className="profile-img-container">
                        <img 
                            src={imageToDisplay} 
                            alt={`Perfil de ${userName}`}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                        />
                    </div>
                    <div className="text-white lh-1">
                        <div style={{ fontSize: '10px', opacity: 0.9, fontWeight: '500' }}>
                            {/* Mostramos o primeiro nome do usuário */}
                            Olá, {userName.split(' ')[0]}!
                        </div>
                        <div style={{ fontSize: '14px', fontWeight: '800', marginTop: '2px' }}>Bem Vindo!</div>
                    </div>
                </div>

                <button 
                    className="filter-menu-btn" 
                    onClick={() => setShowFilterMenu(true)}
                >
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M4 6H20M7 12H20M10 18H20" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                </button>
            </div>

            {/* CONTEÚDO DOS GRÁFICOS: O StatCards envolve os outros gráficos no Mobile para criar a área branca */}
            <StatCards dateRange={dateRange} isMobile={true}>
                
                <div className="d-flex flex-column gap-3 pb-5 mt-2">
                    {/* Gráfico de Métodos de Pagamento */}
                    <PaymentMethodsChart dateRange={dateRange} />

                    <h6 className="fw-bold px-1 mt-3" style={{ fontSize: '14px', color: '#000' }}>Informações</h6>
                    
                    <DetailedSalesChart dateRange={dateRange} isMlEnabled={isMlEnabled} />
                    <RecentOrders dateRange={dateRange} isMlEnabled={isMlEnabled} />
                    <ProductAuditChart dateRange={dateRange} />
                    <InventoryStatus dateRange={dateRange} />
                    <TopProductsChart dateRange={dateRange} />
                    <MostViewedProductsChart dateRange={dateRange} />
                    <ReviewsSummary dateRange={dateRange} />
                </div>

            </StatCards>

            {/* MODAL DE SELEÇÃO DE FILTROS RÁPIDOS */}
            <Modal show={showFilterMenu} onHide={() => setShowFilterMenu(false)} centered size="sm" contentClassName="modal-dark-fix border-0 rounded-4">
                <Modal.Header closeButton className="border-0 pb-2">
                    <Modal.Title className="fs-6 fw-bold" style={{ color: 'var(--text-primary)' }}>Selecionar Período</Modal.Title>
                </Modal.Header>
                <Modal.Body className="d-flex flex-column gap-2 pt-0">
                    <Button variant={activeFilter === 'hoje' ? 'primary' : 'light'} className="rounded-pill text-start px-4 fw-medium" onClick={() => selectFilter('hoje')}>Hoje</Button>
                    <Button variant={activeFilter === 'mes' ? 'primary' : 'light'} className="rounded-pill text-start px-4 fw-medium" onClick={() => selectFilter('mes')}>Esse mês</Button>
                    <Button variant={activeFilter === '30d' ? 'primary' : 'light'} className="rounded-pill text-start px-4 fw-medium" onClick={() => selectFilter('30d')}>Últimos 30 dias</Button>
                    <Button variant={activeFilter === '90d' ? 'primary' : 'light'} className="rounded-pill text-start px-4 fw-medium" onClick={() => selectFilter('90d')}>Últimos 90 dias</Button>
                    <Button variant={activeFilter === 'all' ? 'primary' : 'light'} className="rounded-pill text-start px-4 fw-medium" onClick={() => selectFilter('all')}>Todo o período</Button>
                    <hr className="my-1 border-secondary opacity-10" />
                    <Button variant={activeFilter === 'custom' ? 'primary' : 'light'} className="rounded-pill text-start px-4 fw-bold" onClick={() => selectFilter('custom')}>
                        <i className="bi bi-calendar-range me-2"></i>Personalizado
                    </Button>
                </Modal.Body>
            </Modal>

            {/* MODAL DE SELEÇÃO DE DATA PERSONALIZADA */}
            <Modal show={showFilterModal} onHide={() => setShowFilterModal(false)} centered size="sm" contentClassName="modal-dark-fix border-0 rounded-4">
                <Modal.Header closeButton className="border-0 pb-0">
                    <Modal.Title className="fs-6 fw-bold" style={{ color: 'var(--text-primary)' }}>Período Customizado</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <Form.Group className="mb-3">
                            <Form.Label className="small fw-medium" style={{ color: 'var(--text-secondary)' }}>Data Inicial</Form.Label>
                            <Form.Control type="date" value={customDates.start} onChange={(e) => setCustomDates({...customDates, start: e.target.value})} className="shadow-none form-dark-fix rounded-3" />
                        </Form.Group>
                        <Form.Group>
                            <Form.Label className="small fw-medium" style={{ color: 'var(--text-secondary)' }}>Data Final</Form.Label>
                            <Form.Control type="date" value={customDates.end} onChange={(e) => setCustomDates({...customDates, end: e.target.value})} className="shadow-none form-dark-fix rounded-3" />
                        </Form.Group>
                    </Form>
                </Modal.Body>
                <Modal.Footer className="border-0 pt-0">
                    <Button variant="secondary" onClick={() => setShowFilterModal(false)} className="rounded-pill btn-sm bg-secondary bg-opacity-10 border-0 text-secondary fw-bold px-3">Cancelar</Button>
                    <Button variant="primary" onClick={() => { applyCustomFilter(); setShowFilterModal(false); }} className="rounded-pill px-4 btn-sm fw-bold shadow-sm">Aplicar</Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default DashboardMobile;