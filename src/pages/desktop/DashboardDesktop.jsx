import React from 'react';
import { Container, Row, Col, Dropdown, Badge, Button, Modal, Form } from 'react-bootstrap';
import StatCards from '../../components/dashboard/StatCards';
import DetailedSalesChart from '../../components/dashboard/DetailedSalesChart'; 
import PaymentMethodsChart from '../../components/dashboard/PaymentMethodsChart'; 
import RecentOrders from '../../components/dashboard/RecentOrders';
import ProductAuditChart from '../../components/dashboard/ProductAuditChart'; 
import InventoryStatus from '../../components/dashboard/InventoryStatus';
import TopProductsChart from '../../components/dashboard/TopProductsChart';
import MostViewedProductsChart from '../../components/dashboard/MostViewedProductsChart';
import ReviewsSummary from '../../components/dashboard/ReviewsSummary';

const DashboardDesktop = ({
    dateRange, activeFilter, showFilterModal, setShowFilterModal, customDates, setCustomDates,
    storeUrl, copySuccess, handleCopyLink, handlePresetChange, applyCustomFilter,
    totalNotifications, totalNewOrders, totalUnreadWhatsapp, isMlEnabled, navigate
}) => {
    return (
        <div style={{ backgroundColor: 'var(--bg-main, #f8fafc)', minHeight: '100vh', paddingBottom: '2rem', transition: 'background-color 0.2s ease' }}>
            <Container fluid="lg" className="pt-4">
                
                {/* --- CABEÇALHO DESKTOP --- */}
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <h4 className="fw-bold m-0 d-flex align-items-center" style={{ fontSize: '1.25rem', color: 'var(--text-primary)' }}>
                        <svg className="w-6 h-6 me-2 opacity-75" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ width: '24px' }}>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        Dashboard
                    </h4>
                    
                    <div className="d-flex gap-3 align-items-center" style={{ color: 'var(--text-secondary)' }}>
                        <i className="bi bi-question-circle" style={{ cursor: 'pointer', fontSize: '1.1rem' }} title="Ajuda"></i>
                        
                        <Dropdown align="end">
                            <Dropdown.Toggle as="div" bsPrefix="p-0" style={{ cursor: 'pointer', position: 'relative' }}>
                                <i className="bi bi-bell" style={{ fontSize: '1.1rem' }}></i>
                                {totalNotifications > 0 && (
                                    <Badge bg="danger" pill className="position-absolute translate-middle" style={{ top: '2px', left: '10px', fontSize: '0.55rem', padding: '0.25em 0.4em' }}>
                                        {totalNotifications > 99 ? '99+' : totalNotifications}
                                    </Badge>
                                )}
                            </Dropdown.Toggle>

                            <Dropdown.Menu className="shadow-lg border-0 mt-2 p-0" style={{ width: '280px', backgroundColor: 'var(--bg-sidebar)', overflow: 'hidden' }}>
                                <div className="p-3 border-bottom d-flex justify-content-between align-items-center" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-hover)' }}>
                                    <span className="fw-bold" style={{ color: 'var(--text-primary)', fontSize: '0.9rem' }}>Notificações</span>
                                    <Badge bg="secondary" className="bg-opacity-25 text-secondary">{totalNotifications}</Badge>
                                </div>
                                
                                <div className="py-2">
                                    {totalNotifications === 0 ? (
                                        <div className="text-center p-4 text-muted small opacity-75">
                                            <i className="bi bi-bell-slash fs-4 d-block mb-2"></i>
                                            Você não possui novas notificações no momento.
                                        </div>
                                    ) : (
                                        <>
                                            {totalNewOrders > 0 && (
                                                <Dropdown.Item className="py-2 border-bottom border-light" onClick={() => navigate('/orders')}>
                                                    <div className="d-flex align-items-center">
                                                        <div className="bg-warning bg-opacity-10 text-warning rounded-circle p-2 me-3 d-flex align-items-center justify-content-center" style={{ width: '35px', height: '35px' }}>
                                                            <i className="bi bi-cart-plus-fill"></i>
                                                        </div>
                                                        <div>
                                                            <div className="fw-bold small" style={{ color: 'var(--text-primary)' }}>Novos Pedidos</div>
                                                            <div className="text-muted" style={{ fontSize: '0.75rem' }}>Você tem {totalNewOrders} pedido(s) aguardando.</div>
                                                        </div>
                                                    </div>
                                                </Dropdown.Item>
                                            )}

                                            {totalUnreadWhatsapp > 0 && (
                                                <Dropdown.Item className="py-2" onClick={() => navigate('/admin/chat')}>
                                                    <div className="d-flex align-items-center">
                                                        <div className="bg-success bg-opacity-10 text-success rounded-circle p-2 me-3 d-flex align-items-center justify-content-center" style={{ width: '35px', height: '35px' }}>
                                                            <i className="bi bi-whatsapp"></i>
                                                        </div>
                                                        <div>
                                                            <div className="fw-bold small" style={{ color: 'var(--text-primary)' }}>Mensagens no WhatsApp</div>
                                                            <div className="text-muted" style={{ fontSize: '0.75rem' }}>{totalUnreadWhatsapp} cliente(s) aguardando resposta.</div>
                                                        </div>
                                                    </div>
                                                </Dropdown.Item>
                                            )}
                                        </>
                                    )}
                                </div>
                            </Dropdown.Menu>
                        </Dropdown>
                    </div>
                </div>

                {/* --- BOTÕES DE FILTRO --- */}
                <div className="d-flex flex-wrap gap-2 mb-4">
                    <button className={`filter-btn ${activeFilter === 'hoje' ? 'active' : ''}`} onClick={() => handlePresetChange('hoje')}>Hoje</button>
                    <button className={`filter-btn ${activeFilter === 'mes' ? 'active' : ''}`} onClick={() => handlePresetChange('mes')}>Esse mês</button>
                    <button className={`filter-btn ${activeFilter === '30d' ? 'active' : ''}`} onClick={() => handlePresetChange('30d')}>Últimos 30 dias</button>
                    <button className={`filter-btn ${activeFilter === '90d' ? 'active' : ''}`} onClick={() => handlePresetChange('90d')}>Últimos 90 dias</button>
                    <button className={`filter-btn ${activeFilter === 'all' ? 'active' : ''}`} onClick={() => handlePresetChange('all')}>Todo o período</button>
                    <button className={`filter-btn ${activeFilter === 'custom' ? 'active' : ''}`} onClick={() => setShowFilterModal(true)}>Personalizado</button>
                </div>

                {/* LINK DA LOJA */}
                <div className="mb-4">
                    <div className="d-inline-flex align-items-center px-3 py-1 rounded-pill copy-link-pill" style={{ cursor: 'pointer', fontSize: '12px' }} onClick={handleCopyLink}>
                        <i className={`bi ${copySuccess ? 'bi-check text-success' : 'bi-link-45deg'} me-2`} style={{ color: copySuccess ? '' : 'var(--text-secondary)' }}></i>
                        <span className={copySuccess ? 'text-success fw-bold' : ''} style={{ color: copySuccess ? '' : 'var(--text-secondary)' }}>
                            {copySuccess ? 'Link copiado!' : storeUrl}
                        </span>
                    </div>
                </div>

                {/* GRÁFICOS */}
                <StatCards dateRange={dateRange} isMlEnabled={isMlEnabled} />
                <PaymentMethodsChart dateRange={dateRange} />

                <Row className="g-4 mb-4">
                    <Col lg={6}><DetailedSalesChart dateRange={dateRange} isMlEnabled={isMlEnabled} /></Col>
                    <Col lg={6}><div className="clean-card h-100"><RecentOrders dateRange={dateRange} isMlEnabled={isMlEnabled} /></div></Col>
                </Row>

                <Row className="g-4 mb-4">
                    <Col lg={4}><ProductAuditChart dateRange={dateRange} /></Col>
                    <Col lg={8}><InventoryStatus dateRange={dateRange} /></Col>
                </Row>

                <Row className="g-4 mb-4">
                    <Col lg={6}><div className="clean-card h-100"><TopProductsChart dateRange={dateRange} /></div></Col>
                    <Col lg={6}><div className="clean-card h-100"><MostViewedProductsChart dateRange={dateRange} /></div></Col>
                </Row>

                <Row className="g-4">
                    <Col xs={12}><div className="clean-card h-100"><ReviewsSummary dateRange={dateRange} /></div></Col>
                </Row>

                {/* MODAL DE SELEÇÃO DE DATA */}
                <Modal show={showFilterModal} onHide={() => setShowFilterModal(false)} centered size="sm" contentClassName="modal-dark-fix">
                    <Modal.Header closeButton className="border-0 pb-0">
                        <Modal.Title className="fs-6 fw-bold" style={{ color: 'var(--text-primary)' }}>Período Customizado</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <Form>
                            <Form.Group className="mb-3">
                                <Form.Label className="small" style={{ color: 'var(--text-secondary)' }}>Início</Form.Label>
                                <Form.Control type="date" value={customDates.start} onChange={(e) => setCustomDates({...customDates, start: e.target.value})} className="shadow-none form-dark-fix" />
                            </Form.Group>
                            <Form.Group>
                                <Form.Label className="small" style={{ color: 'var(--text-secondary)' }}>Fim</Form.Label>
                                <Form.Control type="date" value={customDates.end} onChange={(e) => setCustomDates({...customDates, end: e.target.value})} className="shadow-none form-dark-fix" />
                            </Form.Group>
                        </Form>
                    </Modal.Body>
                    <Modal.Footer className="border-0 pt-0">
                        <Button variant="secondary" onClick={() => setShowFilterModal(false)} className="rounded-pill btn-sm bg-opacity-10 border-0 text-secondary">Cancelar</Button>
                        <Button variant="primary" onClick={applyCustomFilter} className="rounded-pill px-4 btn-sm">Aplicar</Button>
                    </Modal.Footer>
                </Modal>
            </Container>
        </div>
    );
};

export default DashboardDesktop;