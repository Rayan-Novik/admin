import React, { useState, useEffect, useRef } from 'react';
import { getStatusCaixa, buscarProdutos } from '../../components/modules/pdvManager/pdvService';
import ProductSearch from '../../components/modules/pdvManager/ProductSearch';
import Cart from '../../components/modules/pdvManager/Cart';
import CaixaModal from '../../components/modules/pdvManager/CaixaModal';
import PaymentModal from '../../components/modules/pdvManager/PaymentModal';
import MovimentacaoModal from '../../components/modules/pdvManager/MovimentacaoModal';
import ClienteModal from '../../components/modules/pdvManager/ClienteModal';
import SalesHistory from '../../components/modules/pdvManager/SalesHistory';
import DailyReportModal from '../../components/modules/pdvManager/DailyReportModal';
import BarcodeScannerModal from '../../components/modules/pdvManager/BarcodeScannerModal';
import CaixaComandas from '../../components/comanda/CaixaComandas';
import AgendamentosCaixa from '../../components/modules/pdvManager/AgendamentosCaixa'; // 🟢 NOVO IMPORT

// Importando componentes de Comanda
import ComandaList from '../../components/comanda/ComandaList';
import ComandaDetalhe from '../../components/comanda/ComandaDetalhe';

import { LogOut, User, Tag, XCircle, Clock, ArrowUpCircle, ArrowDownCircle, Printer, ShoppingCart, Menu, ScanLine, Receipt, LayoutGrid, ArrowLeft, CalendarClock } from 'lucide-react'; // 🟢 ADD CalendarClock
import { Offcanvas, Button, Badge } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { usePermission } from '../../hooks/usePermission';
import api from '../../services/api';

export default function PDV() {
    const { can } = usePermission();
    const podeMovimentarCaixa = can('FINANCEIRO_MANAGE');
    const podeVerRelatorio = can('FINANCEIRO_VIEW');

    const [abaAtiva, setAbaAtiva] = useState('PDV');
    const [statusCaixa, setStatusCaixa] = useState('FECHADO');
    const [resumo, setResumo] = useState(null);
    const [loadingInit, setLoadingInit] = useState(true);
    const [cart, setCart] = useState([]);
    const [clienteSelecionado, setClienteSelecionado] = useState(null);

    // Controle da mesa que está sendo visualizada/editada no caixa
    const [mesaSelecionada, setMesaSelecionada] = useState(null);

    const [modalCaixaOpen, setModalCaixaOpen] = useState(false);
    const [modalPaymentOpen, setModalPaymentOpen] = useState(false);
    const [modalMovimentacao, setModalMovimentacao] = useState({ open: false, tipo: 'ENTRADA' });
    const [modalClienteOpen, setModalClienteOpen] = useState(false);
    const [modalRelatorioOpen, setModalRelatorioOpen] = useState(false);
    const [showMobileCart, setShowMobileCart] = useState(false);
    const [showMobileMenu, setShowMobileMenu] = useState(false);

    const [modalScannerOpen, setModalScannerOpen] = useState(false);
    const barcodeBuffer = useRef('');
    const barcodeTimeout = useRef(null);
    const isProcessingRef = useRef(false);

    useEffect(() => { loadStatus(); }, []);

    // Interceptador de saída da mesa (Igual ao do Garçom)
    const handleVoltarDasMesas = async () => {
        if (mesaSelecionada) {
            try {
                const { data } = await api.get('/comandas');
                const comandaAtual = data.find(c => c.id_pedido === mesaSelecionada.id_pedido);

                if (comandaAtual && (!comandaAtual.pedido_items || comandaAtual.pedido_items.length === 0)) {
                    const confirmar = window.confirm("A mesa está vazia.\nDeseja cancelar o atendimento e liberá-la?");
                    if (confirmar) {
                        await api.delete(`/comandas/${mesaSelecionada.id_pedido}`);
                        toast.success("Atendimento cancelado e mesa liberada!");
                    }
                }
            } catch (error) {
                console.error("Erro ao verificar status da comanda", error);
            }
            setMesaSelecionada(null);
        }
    };

    // Modificando a troca de abas para garantir que ele verifica a mesa ao sair
    const mudarAba = (novaAba) => {
        if (abaAtiva === 'MESAS' && mesaSelecionada) {
            handleVoltarDasMesas();
        }
        setAbaAtiva(novaAba);
        setShowMobileMenu(false);
    };

    const processarCodigoBarras = async (codigoBruto) => {
        const codigo = codigoBruto?.trim();
        if (!codigo) return;

        if (isProcessingRef.current) return;
        isProcessingRef.current = true;

        try {
            const data = await buscarProdutos(codigo, 'geral');
            if (data && data.length === 1) {
                handleAddProduct(data[0]);
                toast.success(`✅ ${data[0].nome} adicionado!`);
                setModalScannerOpen(false);
            } else if (data && data.length > 1) {
                toast.warning(`Atenção: Mais de um produto compartilha o código: ${codigo}. Use a barra de pesquisa.`);
            } else {
                toast.warning(`Nenhum produto encontrado com o código: ${codigo}`);
            }
        } catch (error) {
            toast.error('Erro ao buscar o produto pelo código.');
        } finally {
            setTimeout(() => { isProcessingRef.current = false; }, 600);
        }
    };

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'F2' && cart.length > 0 && statusCaixa === 'ABERTO') setModalPaymentOpen(true);
            if (e.key === 'F5') { e.preventDefault(); loadStatus(); }

            if (statusCaixa === 'ABERTO' && abaAtiva === 'PDV') {
                if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
                    if (e.key === 'Enter' && barcodeBuffer.current.length > 2) {
                        processarCodigoBarras(barcodeBuffer.current);
                        barcodeBuffer.current = '';
                        clearTimeout(barcodeTimeout.current);
                        return;
                    }

                    if (e.key.length === 1) {
                        barcodeBuffer.current += e.key;
                        clearTimeout(barcodeTimeout.current);
                        barcodeTimeout.current = setTimeout(() => {
                            barcodeBuffer.current = '';
                        }, 100);
                    }
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [cart, statusCaixa, abaAtiva]);

    const loadStatus = async () => {
        setLoadingInit(true);
        try {
            const data = await getStatusCaixa();
            setStatusCaixa(data.status);
            if (data.status === 'ABERTO') { setResumo(data.dados); }
            else { setModalCaixaOpen(true); setResumo(null); }
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
        setShowMobileCart(false);
        loadStatus();
        toast.success(`Venda Realizada! Cupom #${result.pedido.id_pedido}`);
    };

    const cartTotal = cart.reduce((acc, item) => acc + (Number(item.preco) * item.quantidade), 0);

    if (loadingInit) return (
        <div className="d-flex vh-100 flex-column align-items-center justify-content-center" style={{ backgroundColor: 'var(--bg-main)' }}>
            <div className="spinner-border text-primary mb-3" role="status"></div>
            <strong className="text-uppercase small" style={{ color: 'var(--text-secondary)' }}>Sincronizando PDV...</strong>
        </div>
    );

    return (
        <div className="d-flex flex-column flex-md-row vh-100 overflow-hidden position-relative" style={{ backgroundColor: 'var(--bg-main)' }}>

            <div className="d-md-none p-3 d-flex justify-content-between align-items-center border-bottom shadow-sm z-3" style={{ backgroundColor: 'var(--bg-sidebar)', borderColor: 'var(--border-color)' }}>
                <Button variant="light" className="p-2 border-0 bg-transparent" onClick={() => setShowMobileMenu(true)} style={{ color: 'var(--text-primary)' }}>
                    <Menu size={24} />
                </Button>
                <div className="fw-bold" style={{ color: 'var(--text-primary)', fontSize: '1.2rem', letterSpacing: '-0.5px' }}>PDV</div>
                <div className="d-flex align-items-center gap-2">
                    <Button variant="light" className="p-1 border-0 bg-transparent text-primary" onClick={() => setModalScannerOpen(true)} title="Câmera">
                        <ScanLine size={24} />
                    </Button>
                    <span className={`badge rounded-pill ${statusCaixa === 'ABERTO' ? 'bg-success' : 'bg-danger'}`} style={{ fontSize: '10px' }}>
                        {statusCaixa === 'ABERTO' ? 'CAIXA ABERTO' : 'FECHADO'}
                    </span>
                </div>
            </div>

            <Offcanvas show={showMobileMenu} onHide={() => setShowMobileMenu(false)} responsive="md" className="border-end shadow-sm" style={{ width: '90px', backgroundColor: 'var(--bg-sidebar)', borderColor: 'var(--border-color)' }}>
                <div className="d-flex flex-column align-items-center py-4 h-100">
                    <div className="d-flex flex-column gap-3 w-100 px-3">
                        <button onClick={() => mudarAba('PDV')} className={`btn border-0 rounded-4 py-3 d-flex flex-column align-items-center transition-all ${abaAtiva === 'PDV' ? 'bg-primary text-white shadow-sm' : 'bg-transparent text-secondary hover-bg'}`}>
                            <ShoppingCart size={22} className="mb-1" />
                            <small style={{ fontSize: '10px', fontWeight: '600' }}>CAIXA</small>
                        </button>

                        <button onClick={() => mudarAba('MESAS')} className={`btn border-0 rounded-4 py-3 d-flex flex-column align-items-center transition-all ${abaAtiva === 'MESAS' ? 'bg-primary text-white shadow-sm' : 'bg-transparent text-secondary hover-bg'}`}>
                            <LayoutGrid size={22} className="mb-1" />
                            <small style={{ fontSize: '10px', fontWeight: '600' }}>MESAS</small>
                        </button>

                        <button onClick={() => mudarAba('COMANDAS')} className={`btn border-0 rounded-4 py-3 d-flex flex-column align-items-center transition-all ${abaAtiva === 'COMANDAS' ? 'bg-primary text-white shadow-sm' : 'bg-transparent text-secondary hover-bg'}`}>
                            <Receipt size={22} className="mb-1" />
                            <small style={{ fontSize: '10px', fontWeight: '600' }}>SALÃO</small>
                        </button>

                        {/* 🟢 NOVA ABA AGENDAMENTOS MOBILE */}
                        <button onClick={() => mudarAba('AGENDAMENTOS')} className={`btn border-0 rounded-4 py-3 d-flex flex-column align-items-center transition-all ${abaAtiva === 'AGENDAMENTOS' ? 'bg-primary text-white shadow-sm' : 'bg-transparent text-secondary hover-bg'}`}>
                            <CalendarClock size={22} className="mb-1" />
                            <small style={{ fontSize: '10px', fontWeight: '600' }}>AGENDA</small>
                        </button>

                        <button onClick={() => mudarAba('VENDAS')} className={`btn border-0 rounded-4 py-3 d-flex flex-column align-items-center transition-all ${abaAtiva === 'VENDAS' ? 'bg-primary text-white shadow-sm' : 'bg-transparent text-secondary hover-bg'}`}>
                            <Tag size={22} className="mb-1" />
                            <small style={{ fontSize: '10px', fontWeight: '600' }}>VENDAS</small>
                        </button>
                        <button onClick={() => { setModalClienteOpen(true); setShowMobileMenu(false); }} className={`btn border-0 rounded-4 py-3 d-flex flex-column align-items-center transition-all ${clienteSelecionado ? 'bg-success text-white shadow-sm' : 'bg-transparent text-secondary hover-bg'}`}>
                            <User size={22} className="mb-1" />
                            <small style={{ fontSize: '10px', fontWeight: '600' }}>{clienteSelecionado ? 'CLI OK' : 'CLIENTE'}</small>
                        </button>
                    </div>

                    <div className="mt-auto w-100 px-3 d-flex flex-column gap-3 mb-2">
                        <div className="border-top pt-3 mb-2" style={{ borderColor: 'var(--border-color)' }}>
                            {podeMovimentarCaixa && (
                                <>
                                    <button className="btn bg-transparent text-success border-0 rounded-4 py-2 w-100 mb-2 hover-bg" onClick={() => { setModalMovimentacao({ open: true, tipo: 'ENTRADA' }); setShowMobileMenu(false); }} title="Suprimento"><ArrowUpCircle size={24} /></button>
                                    <button className="btn bg-transparent text-danger border-0 rounded-4 py-2 w-100 mb-2 hover-bg" onClick={() => { setModalMovimentacao({ open: true, tipo: 'SAIDA' }); setShowMobileMenu(false); }} title="Sangria"><ArrowDownCircle size={24} /></button>
                                </>
                            )}
                            {podeVerRelatorio && (
                                <button className="btn bg-transparent text-secondary border-0 rounded-4 py-2 w-100 hover-bg" onClick={() => { setModalRelatorioOpen(true); setShowMobileMenu(false); }} title="Relatório"><Printer size={24} /></button>
                            )}
                        </div>
                        <button className="btn btn-dark border-0 rounded-4 py-3 w-100 shadow-sm" onClick={() => { setModalCaixaOpen(true); setShowMobileMenu(false); }} title={statusCaixa === 'ABERTO' ? "Fechar Caixa" : "Abrir Caixa"}><LogOut size={20} /></button>
                    </div>
                </div>
            </Offcanvas>

            <div className="flex-grow-1 d-flex flex-column overflow-hidden position-relative">
                <header className="d-none d-md-flex p-3 border-bottom justify-content-between align-items-center shadow-sm" style={{ backgroundColor: 'var(--bg-sidebar)', borderColor: 'var(--border-color)' }}>
                    <div className="fw-bold text-uppercase d-flex align-items-center gap-3" style={{ color: 'var(--text-primary)' }}>
                        <span className="fs-5">CAIXA 01</span>
                        {resumo && <Badge bg="secondary" className="bg-opacity-10 text-secondary border rounded-pill fw-medium px-3 py-2">SALDO: R$ {Number(resumo.saldo_sistema).toFixed(2)}</Badge>}
                    </div>
                    <div className="d-flex align-items-center gap-3">

                        <Button
                            variant={abaAtiva === 'MESAS' ? "primary" : "outline-secondary"}
                            className="rounded-pill px-3 py-2 fw-bold d-flex align-items-center gap-2 border-0"
                            style={{ backgroundColor: abaAtiva === 'MESAS' ? '' : 'var(--bg-main)' }}
                            onClick={() => mudarAba('MESAS')}
                        >
                            <LayoutGrid size={18} /> Ver Mesas
                        </Button>

                        <Button
                            variant={abaAtiva === 'COMANDAS' ? "primary" : "outline-secondary"}
                            className="rounded-pill px-3 py-2 fw-bold d-flex align-items-center gap-2 border-0"
                            style={{ backgroundColor: abaAtiva === 'COMANDAS' ? '' : 'var(--bg-main)' }}
                            onClick={() => mudarAba('COMANDAS')}
                        >
                            <Receipt size={18} /> Caixa Salão
                        </Button>

                        {/* 🟢 NOVA ABA AGENDAMENTOS DESKTOP */}
                        <Button
                            variant={abaAtiva === 'AGENDAMENTOS' ? "primary" : "outline-secondary"}
                            className="rounded-pill px-3 py-2 fw-bold d-flex align-items-center gap-2 border-0"
                            style={{ backgroundColor: abaAtiva === 'AGENDAMENTOS' ? '' : 'var(--bg-main)' }}
                            onClick={() => mudarAba('AGENDAMENTOS')}
                        >
                            <CalendarClock size={18} /> Agendamentos
                        </Button>

                        {statusCaixa === 'ABERTO' && abaAtiva === 'PDV' && (
                            <Button variant="outline-primary" className="rounded-circle p-2 border-0 d-flex align-items-center justify-content-center" onClick={() => setModalScannerOpen(true)} title="Ler com a Câmera"><ScanLine size={20} /></Button>
                        )}
                        <Badge bg={statusCaixa === 'ABERTO' ? 'success' : 'danger'} className="rounded-pill px-3 py-2 bg-opacity-10 border" style={{ color: statusCaixa === 'ABERTO' ? '#16a34a' : '#dc2626', borderColor: statusCaixa === 'ABERTO' ? '#16a34a' : '#dc2626' }}>
                            {statusCaixa === 'ABERTO' ? '● CAIXA ABERTO' : '● CAIXA FECHADO'}
                        </Badge>
                    </div>
                </header>

                <main className="flex-grow-1 p-0 overflow-auto">
                    {abaAtiva === 'PDV' && (
                        statusCaixa === 'ABERTO' ? (
                            <div className="h-100 d-flex flex-column p-2 p-md-3">
                                <div className="flex-grow-1 rounded-4 overflow-hidden border shadow-sm d-flex flex-column" style={{ backgroundColor: 'var(--bg-sidebar)', borderColor: 'var(--border-color)' }}>
                                    <ProductSearch onAddProduct={handleAddProduct} />
                                </div>
                                <div className="d-md-none" style={{ height: '90px' }}></div>
                            </div>
                        ) : (
                            <div className="h-100 d-flex align-items-center justify-content-center text-center p-4">
                                <div className="border border-opacity-10 shadow-lg rounded-4 p-5 w-100" style={{ maxWidth: '400px', backgroundColor: 'var(--bg-sidebar)', borderColor: 'var(--border-color)' }}>
                                    <Clock size={64} className="text-secondary mb-4 mx-auto opacity-50" />
                                    <h2 className="fw-bold h4 mb-2" style={{ color: 'var(--text-primary)' }}>Caixa Fechado</h2>
                                    <p className="mb-4 small" style={{ color: 'var(--text-secondary)' }}>Inicie o turno financeiro para começar a vender.</p>
                                    <button onClick={() => setModalCaixaOpen(true)} className="btn btn-primary btn-lg w-100 py-3 rounded-4 shadow-sm fw-bold">ABRIR CAIXA</button>
                                </div>
                            </div>
                        )
                    )}

                    {abaAtiva === 'MESAS' && (
                        <div className="h-100 d-flex flex-column">
                            {mesaSelecionada ? (
                                <>
                                    <div className="p-3 border-bottom d-flex align-items-center bg-white shadow-sm" style={{ borderColor: 'var(--border-color)' }}>
                                        <Button variant="light" className="d-flex align-items-center gap-2 fw-bold text-secondary border" onClick={handleVoltarDasMesas}>
                                            <ArrowLeft size={18} /> Voltar para o Mapa
                                        </Button>
                                        <h5 className="mb-0 ms-4 fw-bold text-primary">Editando Mesa {mesaSelecionada.codigo_comanda}</h5>
                                    </div>
                                    <div className="flex-grow-1 overflow-auto p-3">
                                        <ComandaDetalhe
                                            comandaOriginal={mesaSelecionada}
                                            aoFechamentoCompleto={() => setMesaSelecionada(null)}
                                        />
                                    </div>
                                </>
                            ) : (
                                <div className="p-3 h-100 overflow-auto">
                                    <ComandaList
                                        aoClicarMesaLivre={() => toast.info("Mesa livre. Os atendimentos devem ser iniciados pelo Salão ou QR Code.")}
                                        aoClicarMesaOcupada={(mesa, comanda) => setMesaSelecionada(comanda)}
                                    />
                                </div>
                            )}
                        </div>
                    )}

                    {abaAtiva === 'COMANDAS' && (
                        <div className="p-3 h-100 overflow-hidden">
                            <CaixaComandas onVendaSuccess={loadStatus} />
                        </div>
                    )}

                    {/* 🟢 RENDERIZAÇÃO DA TELA DE AGENDAMENTOS */}
                    {abaAtiva === 'AGENDAMENTOS' && (
                        <div className="p-3 h-100 overflow-hidden">
                            <AgendamentosCaixa onVendaSuccess={loadStatus} />
                        </div>
                    )}

                    {abaAtiva === 'VENDAS' && <div className="p-3 h-100 overflow-hidden"><SalesHistory /></div>}
                </main>
            </div>

            {abaAtiva === 'PDV' && (
                <div className="d-none d-md-flex col-md-4 col-lg-3 flex-column shadow-lg border-start z-1" style={{ backgroundColor: 'var(--bg-sidebar)', borderColor: 'var(--border-color)' }}>
                    {clienteSelecionado && (
                        <div className="p-3 bg-primary bg-opacity-10 border-bottom d-flex justify-content-between align-items-center" style={{ borderColor: 'var(--border-color)' }}>
                            <div className="d-flex align-items-center gap-2 text-primary fw-semibold" style={{ fontSize: '13px' }}><User size={16} /><span className="text-truncate">{clienteSelecionado.nome || clienteSelecionado.nome_completo}</span></div>
                            <button className="btn btn-sm btn-link text-danger p-0 m-0 border-0" onClick={() => setClienteSelecionado(null)}><XCircle size={18} /></button>
                        </div>
                    )}
                    <Cart cart={cart} onUpdateQuantity={handleUpdateQuantity} onRemove={handleRemoveProduct} onCheckout={() => setModalPaymentOpen(true)} />
                </div>
            )}

            {abaAtiva === 'PDV' && cart.length > 0 && (
                <div className="d-md-none position-fixed bottom-0 start-0 w-100 border-top shadow-lg p-3 d-flex align-items-center justify-content-between z-3" style={{ height: '90px', backgroundColor: 'var(--bg-sidebar)', borderColor: 'var(--border-color)' }}>
                    <div onClick={() => setShowMobileCart(true)} className="d-flex align-items-center gap-3 flex-grow-1 cursor-pointer px-2">
                        <div className="position-relative">
                            <ShoppingCart size={32} className="text-primary" />
                            <span className="position-absolute top-0 start-100 translate-middle badge rounded-circle bg-danger border border-white" style={{ padding: '5px 7px', fontSize: '10px' }}>{cart.length}</span>
                        </div>
                        <div className="ms-1">
                            <small className="d-block fw-bold text-uppercase" style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>Total Estimado</small>
                            <span className="fw-bolder fs-4" style={{ color: 'var(--text-primary)', lineHeight: '1' }}>R$ {cartTotal.toFixed(2)}</span>
                        </div>
                    </div>
                    <Button variant="success" className="rounded-4 px-4 py-3 fw-bold shadow-sm d-flex align-items-center gap-2 border-0" onClick={() => setModalPaymentOpen(true)} style={{ fontSize: '14px' }}>
                        PAGAR <i className="bi bi-arrow-right"></i>
                    </Button>
                </div>
            )}

            <Offcanvas show={showMobileCart} onHide={() => setShowMobileCart(false)} placement="bottom" className="d-md-none rounded-top-4" style={{ height: '85vh', backgroundColor: 'var(--bg-sidebar)' }}>
                <Offcanvas.Header closeButton className="border-bottom py-3" style={{ borderColor: 'var(--border-color)' }}>
                    <Offcanvas.Title className="fs-6 fw-bold d-flex align-items-center" style={{ color: 'var(--text-primary)' }}><ShoppingCart size={20} className="me-2 text-primary" /> Cesta de Compras</Offcanvas.Title>
                </Offcanvas.Header>
                <Offcanvas.Body className="p-0 d-flex flex-column">
                    {clienteSelecionado && (
                        <div className="p-3 bg-primary bg-opacity-10 border-bottom d-flex justify-content-between align-items-center" style={{ borderColor: 'var(--border-color)' }}>
                            <div className="d-flex align-items-center gap-2 text-primary fw-semibold" style={{ fontSize: '13px' }}><User size={16} /><span className="text-truncate">{clienteSelecionado.nome || clienteSelecionado.nome_completo}</span></div>
                            <button className="btn btn-sm btn-link text-danger p-0 m-0 border-0" onClick={() => setClienteSelecionado(null)}><XCircle size={18} /></button>
                        </div>
                    )}
                    <Cart cart={cart} onUpdateQuantity={handleUpdateQuantity} onRemove={handleRemoveProduct} onCheckout={() => { setShowMobileCart(false); setModalPaymentOpen(true); }} isMobile={true} />
                </Offcanvas.Body>
            </Offcanvas>

            <CaixaModal isOpen={modalCaixaOpen} mode={statusCaixa === 'ABERTO' ? 'fechar' : 'abrir'} onClose={() => statusCaixa === 'ABERTO' && setModalCaixaOpen(false)} onSuccess={() => { setModalCaixaOpen(false); loadStatus(); }} />
            <PaymentModal isOpen={modalPaymentOpen} cart={cart} total={cartTotal} clienteId={clienteSelecionado?.id_usuario} onClose={() => setModalPaymentOpen(false)} onFinishSuccess={handleVendaSuccess} />
            <MovimentacaoModal isOpen={modalMovimentacao.open} tipoInicial={modalMovimentacao.tipo} onClose={() => setModalMovimentacao({ ...modalMovimentacao, open: false })} onSuccess={() => loadStatus()} />
            <ClienteModal isOpen={modalClienteOpen} onClose={() => setModalClienteOpen(false)} onSelectCliente={(c) => { setClienteSelecionado(c); setModalClienteOpen(false); }} />
            <DailyReportModal isOpen={modalRelatorioOpen} onClose={() => setModalRelatorioOpen(false)} />

            <BarcodeScannerModal isOpen={modalScannerOpen} onClose={() => setModalScannerOpen(false)} onScan={processarCodigoBarras} />

            <style>{`.hover-bg:hover { background-color: var(--bg-hover) !important; } .cursor-pointer { cursor: pointer; } body.dark-mode .btn-close { filter: invert(1); }
            .pulse-animation { animation: pulse 1.5s infinite; }
            @keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.5; } 100% { opacity: 1; } }
            `}</style>
        </div>
    );
}