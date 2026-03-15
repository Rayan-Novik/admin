import React, { useState, useEffect } from 'react';
import { getStatusCaixa, getHistoricoVendas } from '../components/modules/pdvManager/pdvService';
import ProductSearch from '../components/modules/pdvManager/ProductSearch';
import Cart from '../components/modules/pdvManager/Cart';
import CaixaModal from '../components/modules/pdvManager/CaixaModal';
import PaymentModal from '../components/modules/pdvManager/PaymentModal';
import MovimentacaoModal from '../components/modules/pdvManager/MovimentacaoModal'; 
import ClienteModal from '../components/modules/pdvManager/ClienteModal'; 
import SalesHistory from '../components/modules/pdvManager/SalesHistory'; 
import DailyReportModal from '../components/modules/pdvManager/DailyReportModal';
import { LogOut, User, Tag, XCircle, Clock, ArrowUpCircle, ArrowDownCircle, RefreshCw, Printer, ShoppingCart, Menu, X } from 'lucide-react';
import { Offcanvas, Button, Badge } from 'react-bootstrap'; // Using Bootstrap Offcanvas for mobile cart

export default function PDV() {
    // 1. ESTADOS DE NAVEGAÇÃO E DADOS
    const [abaAtiva, setAbaAtiva] = useState('PDV'); // 'PDV', 'VENDAS', 'CLIENTES'
    const [statusCaixa, setStatusCaixa] = useState('FECHADO');
    const [resumo, setResumo] = useState(null); 
    const [loadingInit, setLoadingInit] = useState(true);
    const [cart, setCart] = useState([]);
    const [clienteSelecionado, setClienteSelecionado] = useState(null);
    
    // 2. ESTADOS DOS MODAIS E UI
    const [modalCaixaOpen, setModalCaixaOpen] = useState(false);
    const [modalPaymentOpen, setModalPaymentOpen] = useState(false);
    const [modalMovimentacao, setModalMovimentacao] = useState({ open: false, tipo: 'ENTRADA' });
    const [modalClienteOpen, setModalClienteOpen] = useState(false);
    const [modalRelatorioOpen, setModalRelatorioOpen] = useState(false);
    const [showMobileCart, setShowMobileCart] = useState(false); // New state for mobile cart
    const [showMobileMenu, setShowMobileMenu] = useState(false); // New state for mobile menu

    // Dados para o Relatório
    const [dadosRelatorio, setDadosRelatorio] = useState({ vendas: [], fechamento: null });

    // Carregar status do banco de dados ao iniciar
    useEffect(() => { loadStatus(); }, []);

    // Atalhos de teclado globais
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'F2' && cart.length > 0 && statusCaixa === 'ABERTO') setModalPaymentOpen(true);
            if (e.key === 'F5') { e.preventDefault(); loadStatus(); }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [cart, statusCaixa]);

    const loadStatus = async () => {
        setLoadingInit(true);
        try {
            const data = await getStatusCaixa();
            setStatusCaixa(data.status);
            if (data.status === 'ABERTO') {
                setResumo(data.dados); 
            } else {
                setModalCaixaOpen(true);
                setResumo(null);
            }
        } catch (error) {
            console.error('Erro ao verificar caixa:', error);
        } finally {
            setLoadingInit(false);
        }
    };

    const handleAddProduct = (produto) => {
        setCart((prev) => {
            const exists = prev.find(p => p.id_produto === produto.id_produto);
            if (exists) {
                return prev.map(p => p.id_produto === produto.id_produto ? { ...p, quantidade: p.quantidade + 1 } : p);
            }
            return [...prev, { ...produto, quantidade: 1 }];
        });
        // Optional: Open cart automatically on add on mobile? Maybe just a toast.
    };

    const handleUpdateQuantity = (id, newQtd) => {
        if (newQtd <= 0) return handleRemoveProduct(id);
        setCart(prev => prev.map(p => p.id_produto === id ? { ...p, quantidade: newQtd } : p));
    };

    const handleRemoveProduct = (id) => setCart(prev => prev.filter(p => p.id_produto !== id));

    const handleVendaSuccess = (result) => {
        setModalPaymentOpen(false);
        setCart([]);
        setClienteSelecionado(null);
        setShowMobileCart(false); // Close mobile cart
        loadStatus(); 
        alert(`Venda Realizada! Cupom #${result.pedido.id_pedido}`);
    };

    const cartTotal = cart.reduce((acc, item) => acc + (Number(item.preco) * item.quantidade), 0);

    if (loadingInit) return (
        <div className="d-flex vh-100 flex-column align-items-center justify-content-center bg-light">
            <div className="spinner-border text-primary mb-3" role="status"></div>
            <strong className="text-uppercase small">Sincronizando PDV...</strong>
        </div>
    );

    return (
        <div className="d-flex flex-column flex-md-row vh-100 bg-light overflow-hidden position-relative">
            
            {/* 1. MOBILE HEADER & MENU TOGGLE */}
            <div className="d-md-none bg-dark text-white p-2 d-flex justify-content-between align-items-center shadow-sm">
                <Button variant="link" className="text-white p-0" onClick={() => setShowMobileMenu(true)}>
                    <Menu size={24} />
                </Button>
                <img src="/logologin.png" alt="Logo" style={{ maxHeight: '30px' }} />
                <div className="d-flex align-items-center gap-2">
                     <span className={`badge rounded-pill ${statusCaixa === 'ABERTO' ? 'bg-success' : 'bg-danger'}`} style={{fontSize: '0.6rem'}}>
                        {statusCaixa === 'ABERTO' ? 'ABERTO' : 'FECHADO'}
                    </span>
                </div>
            </div>

            {/* 2. SIDEBAR NAVIGATION (Desktop: Fixed Left, Mobile: Offcanvas) */}
            <Offcanvas show={showMobileMenu} onHide={() => setShowMobileMenu(false)} responsive="md" className="bg-dark text-white" style={{ width: '100px' }}>
                <div className="d-flex flex-column align-items-center py-3 h-100">
                    <div className="mb-4 text-center px-2 d-none d-md-block">
                        <img 
                            src="/logologin.png" 
                            alt="Logo" 
                            className="img-fluid"
                            style={{ maxWidth: '80px', height: 'auto', objectFit: 'contain' }} 
                        />
                    </div>

                    <div className="d-flex flex-column gap-3 w-100 px-2">
                        <button onClick={() => { setAbaAtiva('VENDAS'); setShowMobileMenu(false); }} className={`btn border-0 rounded-3 py-3 d-flex flex-column align-items-center ${abaAtiva === 'VENDAS' ? 'btn-light text-dark shadow' : 'text-white opacity-75'}`}>
                            <Tag size={20} className="mb-1" />
                            <small style={{ fontSize: '10px' }}>VENDAS</small>
                        </button>
                        <button onClick={() => { setAbaAtiva('PDV'); setShowMobileMenu(false); }} className={`btn border-0 rounded-3 py-3 d-flex flex-column align-items-center ${abaAtiva === 'PDV' ? 'btn-warning text-dark fw-bold shadow' : 'text-white opacity-75'}`}>
                            <Clock size={20} className="mb-1" />
                            <small style={{ fontSize: '10px' }}>CAIXA</small>
                        </button>
                        <button onClick={() => { setModalClienteOpen(true); setShowMobileMenu(false); }} className={`btn border-0 rounded-3 py-3 d-flex flex-column align-items-center ${clienteSelecionado ? 'btn-success text-white' : 'text-white opacity-75'}`}>
                            <User size={20} className="mb-1" />
                            <small style={{ fontSize: '10px' }}>{clienteSelecionado ? 'CLI OK' : 'CLIENTE'}</small>
                        </button>
                    </div>

                    <div className="mt-auto w-100 px-2 d-flex flex-column gap-3 mb-3">
                        <button className="btn btn-secondary border-0 rounded-3 py-2 w-100 shadow-sm" onClick={() => { setModalRelatorioOpen(true); setShowMobileMenu(false); }}>
                            <Printer size={20} />
                        </button>
                        <button className="btn btn-danger border-0 rounded-3 py-2 w-100 shadow-sm" onClick={() => { loadStatus(); setShowMobileMenu(false); }}>
                            <RefreshCw size={20} />
                        </button>
                    </div>
                </div>
            </Offcanvas>

            {/* 3. MAIN CONTENT AREA */}
            <div className="flex-grow-1 d-flex flex-column overflow-hidden position-relative">
                {/* Desktop Header */}
                <header className="d-none d-md-flex p-3 border-bottom justify-content-between align-items-center bg-white shadow-sm" style={{ backgroundColor: '#f8f9fa' }}>
                    <div className="fw-bold text-uppercase d-flex align-items-center gap-3">
                        <span>CAIXA 01</span>
                        {resumo && <Badge bg="dark" className="rounded-pill fw-normal">SALDO: R$ {Number(resumo.saldo_sistema).toFixed(2)}</Badge>}
                    </div>
                    <Badge bg={statusCaixa === 'ABERTO' ? 'success' : 'danger'} className="rounded-pill px-3 py-2">
                        {statusCaixa === 'ABERTO' ? '● CAIXA ABERTO' : '● CAIXA FECHADO'}
                    </Badge>
                </header>

                <main className="flex-grow-1 p-2 p-md-3 overflow-auto bg-light">
                    {abaAtiva === 'PDV' && (
                        statusCaixa === 'ABERTO' ? (
                            <div className="h-100 d-flex flex-column">
                                {/* Action Buttons Grid - Scrollable horizontally on small screens if needed, but grid wrap is better */}
                                <div className="row g-2 mb-3">
                                    <div className="col-4 col-md-3">
                                        <button onClick={() => setModalCaixaOpen(true)} className="btn btn-white w-100 py-2 py-md-3 rounded-4 shadow-sm border-danger text-danger fw-bold small d-flex flex-column flex-md-row align-items-center justify-content-center gap-1">
                                            <LogOut size={18}/> <span>Fechar</span>
                                        </button>
                                    </div>
                                    <div className="col-4 col-md-3">
                                        <button onClick={() => setModalMovimentacao({ open: true, tipo: 'SAIDA' })} className="btn btn-white w-100 py-2 py-md-3 rounded-4 shadow-sm border-secondary fw-bold small d-flex flex-column flex-md-row align-items-center justify-content-center gap-1">
                                            <ArrowDownCircle size={18} className="text-danger"/> <span>Sangria</span>
                                        </button>
                                    </div>
                                    <div className="col-4 col-md-3">
                                        <button onClick={() => setModalMovimentacao({ open: true, tipo: 'ENTRADA' })} className="btn btn-white w-100 py-2 py-md-3 rounded-4 shadow-sm border-secondary fw-bold small d-flex flex-column flex-md-row align-items-center justify-content-center gap-1">
                                            <ArrowUpCircle size={18} className="text-success"/> <span>Suprimento</span>
                                        </button>
                                    </div>
                                </div>
                                
                                {/* Product Search Area */}
                                <div className="flex-grow-1 rounded-4 overflow-hidden border bg-white shadow-sm d-flex flex-column">
                                    <ProductSearch onAddProduct={handleAddProduct} />
                                </div>
                                
                                {/* Spacer for Mobile Bottom Bar */}
                                <div className="d-md-none" style={{ height: '80px' }}></div>
                            </div>
                        ) : (
                            <div className="h-100 d-flex align-items-center justify-content-center text-center p-4">
                                <div className="card border-0 shadow-lg rounded-4 p-4 p-md-5 bg-white w-100" style={{ maxWidth: '400px' }}>
                                    <XCircle size={64} className="text-danger mb-4 mx-auto" />
                                    <h2 className="fw-bold h4">Caixa Fechado</h2>
                                    <p className="text-muted mb-4 small">Inicie o turno para vender.</p>
                                    <button onClick={() => setModalCaixaOpen(true)} className="btn btn-primary btn-lg w-100 py-3 rounded-3 shadow fw-bold">ABRIR CAIXA</button>
                                </div>
                            </div>
                        )
                    )}

                    {abaAtiva === 'VENDAS' && <div className="p-3 bg-white rounded-4 shadow-sm h-100 overflow-hidden"><SalesHistory /></div>}
                    {abaAtiva === 'CLIENTES' && <div className="p-3 bg-white rounded-4 shadow-sm h-100"><h4>Gestão de Clientes</h4></div>}
                </main>
            </div>

            {/* 4. CART SECTION (Responsive: Side panel on desktop, Bottom bar/Sheet on mobile) */}
            
            {/* Desktop Cart (Visible on md+) */}
            {abaAtiva === 'PDV' && (
                <div className="d-none d-md-flex col-md-4 col-lg-3 bg-white flex-column shadow-lg border-start z-1">
                    {clienteSelecionado && (
                        <div className="p-2 bg-success bg-opacity-10 text-success small fw-bold d-flex justify-content-between align-items-center">
                            <span className="text-truncate">CLI: {clienteSelecionado.nome || clienteSelecionado.nome_completo}</span>
                            <button className="btn btn-sm btn-link text-danger p-0" onClick={() => setClienteSelecionado(null)}><XCircle size={18} /></button>
                        </div>
                    )}
                    <Cart 
                        cart={cart}
                        onUpdateQuantity={handleUpdateQuantity}
                        onRemove={handleRemoveProduct}
                        onCheckout={() => setModalPaymentOpen(true)}
                    />
                </div>
            )}

            {/* Mobile Bottom Summary Bar (Visible only on xs/sm when items in cart) */}
            {abaAtiva === 'PDV' && cart.length > 0 && (
                <div className="d-md-none position-fixed bottom-0 start-0 w-100 bg-white border-top shadow-lg p-3 d-flex align-items-center justify-content-between z-3" style={{ height: '80px' }}>
                    <div onClick={() => setShowMobileCart(true)} className="d-flex align-items-center gap-3 flex-grow-1 cursor-pointer">
                        <div className="position-relative">
                            <ShoppingCart size={28} className="text-primary" />
                            <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">{cart.length}</span>
                        </div>
                        <div>
                            <small className="text-muted d-block" style={{ fontSize: '0.7rem' }}>TOTAL ESTIMADO</small>
                            <span className="fw-bold text-dark fs-5">R$ {cartTotal.toFixed(2)}</span>
                        </div>
                    </div>
                    <Button variant="success" className="rounded-pill px-4 fw-bold shadow" onClick={() => setModalPaymentOpen(true)}>
                        PAGAR
                    </Button>
                </div>
            )}

            {/* Mobile Cart Offcanvas (Slide up/side) */}
            <Offcanvas show={showMobileCart} onHide={() => setShowMobileCart(false)} placement="end" className="d-md-none w-75">
                <Offcanvas.Header closeButton className="bg-dark text-white">
                    <Offcanvas.Title className="fs-6 fw-bold"><ShoppingCart size={18} className="me-2"/> CESTA DE COMPRAS</Offcanvas.Title>
                </Offcanvas.Header>
                <Offcanvas.Body className="p-0 d-flex flex-column">
                     {clienteSelecionado && (
                        <div className="p-2 bg-success bg-opacity-10 text-success small fw-bold d-flex justify-content-between align-items-center border-bottom">
                            <span className="text-truncate">CLI: {clienteSelecionado.nome || clienteSelecionado.nome_completo}</span>
                            <button className="btn btn-sm btn-link text-danger p-0" onClick={() => setClienteSelecionado(null)}><XCircle size={18} /></button>
                        </div>
                    )}
                    <Cart 
                        cart={cart}
                        onUpdateQuantity={handleUpdateQuantity}
                        onRemove={handleRemoveProduct}
                        onCheckout={() => { setShowMobileCart(false); setModalPaymentOpen(true); }}
                        isMobile={true} // Pass prop to hide default checkout button inside cart if needed, but we can keep it
                    />
                </Offcanvas.Body>
            </Offcanvas>

            {/* MODALS */}
            <CaixaModal isOpen={modalCaixaOpen} mode={statusCaixa === 'ABERTO' ? 'fechar' : 'abrir'} onClose={() => statusCaixa === 'ABERTO' && setModalCaixaOpen(false)} onSuccess={() => { setModalCaixaOpen(false); loadStatus(); }} />
            <PaymentModal isOpen={modalPaymentOpen} cart={cart} total={cartTotal} clienteId={clienteSelecionado?.id_usuario} onClose={() => setModalPaymentOpen(false)} onFinishSuccess={handleVendaSuccess} />
            <MovimentacaoModal isOpen={modalMovimentacao.open} tipoInicial={modalMovimentacao.tipo} onClose={() => setModalMovimentacao({ ...modalMovimentacao, open: false })} onSuccess={() => loadStatus()} />
            <ClienteModal isOpen={modalClienteOpen} onClose={() => setModalClienteOpen(false)} onSelectCliente={(c) => { setClienteSelecionado(c); setModalClienteOpen(false); }} />
            <DailyReportModal isOpen={modalRelatorioOpen} onClose={() => setModalRelatorioOpen(false)} />
        </div>
    );
}