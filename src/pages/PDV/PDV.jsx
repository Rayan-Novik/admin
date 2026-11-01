import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    getStatusCaixa,
    buscarProdutos,
    getPdvConfig,
    savePdvConfig,
    playPdvBeep
} from '../../components/modules/pdvManager/pdvService';
import ProductSearch from '../../components/modules/pdvManager/ProductSearch';
import Cart from '../../components/modules/pdvManager/Cart';
import CaixaModal from '../../components/modules/pdvManager/CaixaModal';
import PaymentModal from '../../components/modules/pdvManager/PaymentModal';
import MovimentacaoModal from '../../components/modules/pdvManager/MovimentacaoModal';
import ClienteModal from '../../components/modules/pdvManager/ClienteModal';
import SalesHistory from '../../components/modules/pdvManager/SalesHistory';
import DailyReportModal from '../../components/modules/pdvManager/DailyReportModal';
import BarcodeScannerModal from '../../components/modules/pdvManager/BarcodeScannerModal';
import PdvConfigModal from '../../components/modules/pdvManager/PdvConfigModal';
import PdvHelpModal from '../../components/modules/pdvManager/PdvHelpModal';
import CaixaComandas from '../../components/comanda/CaixaComandas';
import AgendamentosCaixa from '../../components/modules/pdvManager/AgendamentosCaixa';

import ComandaList from '../../components/comanda/ComandaList';
import ComandaDetalhe from '../../components/comanda/ComandaDetalhe';

import {
    LogOut,
    User,
    Tag,
    Clock,
    ArrowUpCircle,
    ArrowDownCircle,
    Printer,
    ShoppingCart,
    Menu,
    ScanLine,
    Receipt,
    LayoutGrid,
    ArrowLeft,
    CalendarClock,
    Settings,
    ShieldCheck,
    FileText,
    Keyboard,
    Home,
    Monitor
} from 'lucide-react';
import { Offcanvas, Button, Badge } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { usePermission } from '../../hooks/usePermission';
import api from '../../services/api';

export default function PDV() {
    const navigate = useNavigate();
    const { can, user } = usePermission();
    const podeMovimentarCaixa = can('FINANCEIRO_MANAGE');
    const podeVerRelatorio = can('FINANCEIRO_VIEW');
    const podeAlternarModoFiscal = Boolean(
        user?.is_dono ||
        user?.isAdmin ||
        user?.role === 'ADMIN' ||
        can('FISCAL_MANAGE') ||
        can('PDV_ALTERAR_MODO_FISCAL')
    );

    const [abaAtiva, setAbaAtiva] = useState('PDV');
    const [statusCaixa, setStatusCaixa] = useState('FECHADO');
    const [resumo, setResumo] = useState(null);
    const [loadingInit, setLoadingInit] = useState(true);
    const [cart, setCart] = useState([]);
    const [clienteSelecionado, setClienteSelecionado] = useState(null);
    const [cpfCnpjNota, setCpfCnpjNota] = useState('');

    // Configurações persistentes do PDV (Fiscal / Não Fiscal, Série, Cenário, Impressão, Atalhos)
    const [pdvConfig, setPdvConfig] = useState(() => getPdvConfig());
    const [modalConfigOpen, setModalConfigOpen] = useState(false);
    const [modalConfigTab, setModalConfigTab] = useState('fiscal');
    const [modalHelpOpen, setModalHelpOpen] = useState(false);

    // Controle da mesa visualizada no caixa
    const [mesaSelecionada, setMesaSelecionada] = useState(null);

    const [modalCaixaOpen, setModalCaixaOpen] = useState(false);
    const [modalPaymentOpen, setModalPaymentOpen] = useState(false);
    const [modalMovimentacao, setModalMovimentacao] = useState({ open: false, tipo: 'ENTRADA' });
    const [modalClienteOpen, setModalClienteOpen] = useState(false);
    const [modalRelatorioOpen, setModalRelatorioOpen] = useState(false);
    const [showMobileCart, setShowMobileCart] = useState(false);
    const [showMobileMenu, setShowMobileMenu] = useState(false);

    const [modalScannerOpen, setModalScannerOpen] = useState(false);
    const searchInputRef = useRef(null);
    const barcodeBuffer = useRef('');
    const barcodeTimeout = useRef(null);
    const isProcessingRef = useRef(false);

    useEffect(() => {
        loadStatus();
    }, []);

    // Alterna rapidamente entre Modo Fiscal (NFC-e) e Não Fiscal (Recibo)
    const handleToggleFiscalMode = useCallback(() => {
        if (!podeAlternarModoFiscal) {
            toast.error('Acesso restrito: Operadores de caixa não têm permissão para alterar o modo fiscal. Solicite a um gerente/administrador.');
            return;
        }
        setPdvConfig(prev => {
            const novoModo = prev.modo_fiscal === 'NAO_FISCAL' ? 'NFCE' : 'NAO_FISCAL';
            const updated = savePdvConfig({ ...prev, modo_fiscal: novoModo });
            if (novoModo === 'NFCE') {
                toast.success('🟢 PDV alterado para MODO FISCAL (NFC-e SEFAZ)');
            } else {
                toast.info('⚪ PDV alterado para MODO NÃO FISCAL (Recibo Interno)');
            }
            return updated;
        });
    }, [podeAlternarModoFiscal]);

    const abrirConfigPdv = (tab = 'caixas') => {
        setModalConfigTab(tab);
        setModalConfigOpen(true);
        setShowMobileMenu(false);
    };

    // Interceptador de saída da mesa
    const handleVoltarDasMesas = async () => {
        if (mesaSelecionada) {
            try {
                const { data } = await api.get('/comandas');
                const comandaAtual = data.find(c => c.id_pedido === mesaSelecionada.id_pedido);

                if (comandaAtual && (!comandaAtual.pedido_items || comandaAtual.pedido_items.length === 0)) {
                    const confirmar = window.confirm('A mesa está vazia.\nDeseja cancelar o atendimento e liberá-la?');
                    if (confirmar) {
                        await api.delete(`/comandas/${mesaSelecionada.id_pedido}`);
                        toast.success('Atendimento cancelado e mesa liberada!');
                    }
                }
            } catch (error) {
                console.error('Erro ao verificar status da comanda', error);
            }
            setMesaSelecionada(null);
        }
    };

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
                playPdvBeep('beep');
                handleAddProduct(data[0]);
                toast.success(`✅ ${data[0].nome} adicionado!`);
                setModalScannerOpen(false);
            } else if (data && data.length > 1) {
                toast.warning(`Mais de um produto compartilha o código ${codigo}. Use a barra de pesquisa.`);
            } else {
                playPdvBeep('error');
                toast.warning(`Nenhum produto encontrado com o código: ${codigo}`);
            }
        } catch (error) {
            toast.error('Erro ao buscar o produto pelo código.');
        } finally {
            setTimeout(() => { isProcessingRef.current = false; }, 500);
        }
    };

    // Atalhos Globais de Teclado (F1 a F10)
    useEffect(() => {
        const handleKeyDown = (e) => {
            // Se o modal de pagamento estiver aberto, ele gerencia seus próprios atalhos
            if (modalPaymentOpen) return;

            if (e.key === 'F1') {
                e.preventDefault();
                setModalHelpOpen(true);
                return;
            }
            if (e.key === 'F2') {
                e.preventDefault();
                if (cart.length > 0 && statusCaixa === 'ABERTO') {
                    setModalPaymentOpen(true);
                } else if (cart.length === 0) {
                    toast.info('Adicione pelo menos 1 produto na cesta para finalizar a venda (F2).');
                }
                return;
            }
            if (e.key === 'F3') {
                e.preventDefault();
                setModalClienteOpen(prev => !prev);
                return;
            }
            if (e.key === 'F4') {
                e.preventDefault();
                if (abaAtiva !== 'PDV') mudarAba('PDV');
                setTimeout(() => {
                    searchInputRef.current?.focus();
                    searchInputRef.current?.select?.();
                }, 50);
                return;
            }
            if (e.key === 'F5') {
                e.preventDefault();
                loadStatus();
                return;
            }
            if (e.key === 'F6') {
                e.preventDefault();
                mudarAba(abaAtiva === 'VENDAS' ? 'PDV' : 'VENDAS');
                return;
            }
            if (e.key === 'F7' && podeMovimentarCaixa) {
                e.preventDefault();
                setModalMovimentacao({ open: true, tipo: 'ENTRADA' });
                return;
            }
            if (e.key === 'F8' && podeMovimentarCaixa) {
                e.preventDefault();
                setModalMovimentacao({ open: true, tipo: 'SAIDA' });
                return;
            }
            if (e.key === 'F9') {
                e.preventDefault();
                handleToggleFiscalMode();
                return;
            }
            if (e.key === 'F10') {
                e.preventDefault();
                abrirConfigPdv('caixas');
                return;
            }

            // Leitor de código de barras quando foco não está em input
            if (statusCaixa === 'ABERTO' && abaAtiva === 'PDV') {
                if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA' && e.target.tagName !== 'SELECT') {
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
    }, [cart, statusCaixa, abaAtiva, modalPaymentOpen, podeMovimentarCaixa, handleToggleFiscalMode]);

    const loadStatus = async () => {
        setLoadingInit(true);
        try {
            const data = await getStatusCaixa();
            setStatusCaixa(data.status);
            if (data.status === 'ABERTO') {
                setResumo(data.dados);
                setModalCaixaOpen(false);
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
                return prev.map(p => p.id_produto === produto.id_produto ? { ...p, quantidade: Number(p.quantidade) + 1 } : p);
            }
            return [...prev, { ...produto, quantidade: 1 }];
        });
    };

    const handleUpdateQuantity = (id, newQtd) => {
        if (newQtd <= 0 && newQtd !== '') return handleRemoveProduct(id);
        setCart(prev => prev.map(p => p.id_produto === id ? { ...p, quantidade: newQtd } : p));
    };

    const handleRemoveProduct = (id) => setCart(prev => prev.filter(p => p.id_produto !== id));

    const handleClearCart = () => {
        if (cart.length === 0) return;
        setCart([]);
        toast.info('Cesta limpa.');
    };

    const handleVendaSuccess = () => {
        setModalPaymentOpen(false);
        setCart([]);
        setClienteSelecionado(null);
        setCpfCnpjNota('');
        setShowMobileCart(false);
        loadStatus();
        setTimeout(() => searchInputRef.current?.focus(), 100);
    };

    const cartTotal = cart.reduce((acc, item) => acc + (Number(item.preco) * (Number(item.quantidade) || 0)), 0);
    const isFiscal = pdvConfig?.modo_fiscal && pdvConfig.modo_fiscal !== 'NAO_FISCAL';

    if (loadingInit) {
        return (
            <div className="d-flex vh-100 flex-column align-items-center justify-content-center" style={{ backgroundColor: 'var(--bg-main)' }}>
                <div className="spinner-border text-primary mb-3" role="status"></div>
                <strong className="text-uppercase small" style={{ color: 'var(--text-secondary)' }}>Sincronizando PDV Fiscal...</strong>
            </div>
        );
    }

    return (
        <div className="d-flex flex-column flex-md-row vh-100 overflow-hidden position-relative" style={{ backgroundColor: 'var(--bg-main)' }}>
            {/* Topbar Mobile */}
            <div className="d-md-none p-3 d-flex justify-content-between align-items-center border-bottom shadow-sm z-3" style={{ backgroundColor: 'var(--bg-sidebar)', borderColor: 'var(--border-color)' }}>
                <Button variant="light" className="p-2 border-0 bg-transparent" onClick={() => setShowMobileMenu(true)} style={{ color: 'var(--text-primary)' }}>
                    <Menu size={24} />
                </Button>
                <div className="d-flex align-items-center gap-2">
                    <span className="fw-bold" style={{ color: 'var(--text-primary)', fontSize: '1.1rem' }}>PDV</span>
                    <Badge
                        bg={isFiscal ? 'success' : 'secondary'}
                        className="rounded-pill cursor-pointer"
                        onClick={handleToggleFiscalMode}
                        style={{ fontSize: '10px' }}
                    >
                        {isFiscal ? `FISCAL (${pdvConfig.modo_fiscal})` : 'NÃO FISCAL'}
                    </Badge>
                </div>
                <div className="d-flex align-items-center gap-1">
                    <Button variant="light" className="p-1 border-0 bg-transparent text-secondary" onClick={() => abrirConfigPdv('FISCAL')} title="Configurações PDV">
                        <Settings size={20} />
                    </Button>
                    <Button variant="light" className="p-1 border-0 bg-transparent text-primary" onClick={() => setModalScannerOpen(true)} title="Câmera">
                        <ScanLine size={22} />
                    </Button>
                </div>
            </div>

            {/* Menu Lateral estilo Admin */}
            <Offcanvas
                show={showMobileMenu}
                onHide={() => setShowMobileMenu(false)}
                responsive="md"
                className="border-end shadow-sm"
                style={{ width: '94px', backgroundColor: 'var(--bg-sidebar)', borderColor: 'var(--border-color)' }}
            >
                <div className="d-flex flex-column align-items-center py-3 h-100">
                    {/* Botão Voltar ao Painel Admin */}
                    <div className="w-100 px-2 mb-2 pb-2 border-bottom text-center" style={{ borderColor: 'var(--border-color)' }}>
                        <button
                            type="button"
                            onClick={() => navigate('/')}
                            className="btn btn-sm border rounded-3 py-2 w-100 d-flex flex-column align-items-center justify-content-center hover-bg"
                            style={{ color: 'var(--text-secondary)', borderColor: 'var(--border-color)' }}
                            title="Voltar ao Painel Administrativo"
                        >
                            <Home size={18} className="mb-1 text-primary" />
                            <small style={{ fontSize: '9px', fontWeight: '700' }}>PAINEL</small>
                        </button>
                    </div>

                    {/* Navegação Principal do PDV */}
                    <div className="d-flex flex-column gap-2 w-100 px-2">
                        <button
                            type="button"
                            onClick={() => mudarAba('PDV')}
                            className={`btn border-0 rounded-4 py-2 d-flex flex-column align-items-center transition-all ${
                                abaAtiva === 'PDV' ? 'bg-primary text-white shadow-sm' : 'bg-transparent text-secondary hover-bg'
                            }`}
                        >
                            <ShoppingCart size={20} className="mb-1" />
                            <small style={{ fontSize: '9.5px', fontWeight: '700' }}>CAIXA</small>
                        </button>

                        <button
                            type="button"
                            onClick={() => mudarAba('MESAS')}
                            className={`btn border-0 rounded-4 py-2 d-flex flex-column align-items-center transition-all ${
                                abaAtiva === 'MESAS' ? 'bg-primary text-white shadow-sm' : 'bg-transparent text-secondary hover-bg'
                            }`}
                        >
                            <LayoutGrid size={20} className="mb-1" />
                            <small style={{ fontSize: '9.5px', fontWeight: '700' }}>MESAS</small>
                        </button>

                        <button
                            type="button"
                            onClick={() => mudarAba('COMANDAS')}
                            className={`btn border-0 rounded-4 py-2 d-flex flex-column align-items-center transition-all ${
                                abaAtiva === 'COMANDAS' ? 'bg-primary text-white shadow-sm' : 'bg-transparent text-secondary hover-bg'
                            }`}
                        >
                            <Receipt size={20} className="mb-1" />
                            <small style={{ fontSize: '9.5px', fontWeight: '700' }}>SALÃO</small>
                        </button>

                        <button
                            type="button"
                            onClick={() => mudarAba('AGENDAMENTOS')}
                            className={`btn border-0 rounded-4 py-2 d-flex flex-column align-items-center transition-all ${
                                abaAtiva === 'AGENDAMENTOS' ? 'bg-primary text-white shadow-sm' : 'bg-transparent text-secondary hover-bg'
                            }`}
                        >
                            <CalendarClock size={20} className="mb-1" />
                            <small style={{ fontSize: '9.5px', fontWeight: '700' }}>AGENDA</small>
                        </button>

                        <button
                            type="button"
                            onClick={() => mudarAba('VENDAS')}
                            className={`btn border-0 rounded-4 py-2 d-flex flex-column align-items-center transition-all ${
                                abaAtiva === 'VENDAS' ? 'bg-primary text-white shadow-sm' : 'bg-transparent text-secondary hover-bg'
                            }`}
                            title="Histórico de Vendas e Emissão Fiscal (F6)"
                        >
                            <Tag size={20} className="mb-1" />
                            <small style={{ fontSize: '9.5px', fontWeight: '700' }}>VENDAS</small>
                        </button>

                        <button
                            type="button"
                            onClick={() => { setModalClienteOpen(true); setShowMobileMenu(false); }}
                            className={`btn border-0 rounded-4 py-2 d-flex flex-column align-items-center transition-all ${
                                clienteSelecionado ? 'bg-success text-white shadow-sm' : 'bg-transparent text-secondary hover-bg'
                            }`}
                            title="Identificar Cliente (F3)"
                        >
                            <User size={20} className="mb-1" />
                            <small style={{ fontSize: '9.5px', fontWeight: '700' }}>{clienteSelecionado ? 'CLI OK' : 'CLIENTE'}</small>
                        </button>

                        <button
                            type="button"
                            onClick={() => abrirConfigPdv('FISCAL')}
                            className="btn border-0 rounded-4 py-2 d-flex flex-column align-items-center transition-all bg-transparent text-secondary hover-bg"
                            title="Configurações do PDV e Fiscal (F10)"
                        >
                            <Settings size={20} className="mb-1" />
                            <small style={{ fontSize: '9.5px', fontWeight: '700' }}>CONFIG</small>
                        </button>
                    </div>

                    {/* Ações Financeiras do Caixa */}
                    <div className="mt-auto w-100 px-2 d-flex flex-column gap-1">
                        <div className="border-top pt-2 mb-1" style={{ borderColor: 'var(--border-color)' }}>
                            {podeMovimentarCaixa && (
                                <>
                                    <button
                                        type="button"
                                        className="btn bg-transparent text-success border-0 rounded-3 py-1 w-100 mb-1 hover-bg"
                                        onClick={() => { setModalMovimentacao({ open: true, tipo: 'ENTRADA' }); setShowMobileMenu(false); }}
                                        title="Suprimento / Entrada no Caixa (F7)"
                                    >
                                        <ArrowUpCircle size={20} />
                                    </button>
                                    <button
                                        type="button"
                                        className="btn bg-transparent text-danger border-0 rounded-3 py-1 w-100 mb-1 hover-bg"
                                        onClick={() => { setModalMovimentacao({ open: true, tipo: 'SAIDA' }); setShowMobileMenu(false); }}
                                        title="Sangria / Retirada do Caixa (F8)"
                                    >
                                        <ArrowDownCircle size={20} />
                                    </button>
                                </>
                            )}
                            {podeVerRelatorio && (
                                <button
                                    type="button"
                                    className="btn bg-transparent text-secondary border-0 rounded-3 py-1 w-100 hover-bg"
                                    onClick={() => { setModalRelatorioOpen(true); setShowMobileMenu(false); }}
                                    title="Relatório de Fechamento Diário"
                                >
                                    <Printer size={20} />
                                </button>
                            )}
                        </div>
                        <button
                            type="button"
                            className="btn btn-dark border-0 rounded-4 py-2 w-100 shadow-sm"
                            onClick={() => { setModalCaixaOpen(true); setShowMobileMenu(false); }}
                            title={statusCaixa === 'ABERTO' ? 'Fechar Turno do Caixa' : 'Abrir Turno do Caixa'}
                        >
                            <LogOut size={18} />
                        </button>
                    </div>
                </div>
            </Offcanvas>

            {/* Coluna Central (Header + Conteúdo + Barra de Atalhos) */}
            <div className="flex-grow-1 d-flex flex-column overflow-hidden position-relative">
                {/* Header Desktop estilo Admin */}
                <header
                    className="d-none d-md-flex py-2 px-3 border-bottom justify-content-between align-items-center shadow-sm"
                    style={{ backgroundColor: 'var(--bg-sidebar)', borderColor: 'var(--border-color)' }}
                >
                    <div className="d-flex align-items-center gap-3">
                        <div className="fw-bold d-flex align-items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                            <span className="fs-6 text-uppercase">Frente de Caixa</span>
                            <Badge
                                bg={statusCaixa === 'ABERTO' ? 'success' : 'danger'}
                                className="rounded-pill px-2 py-1 bg-opacity-10 border"
                                style={{
                                    fontSize: '10.5px',
                                    color: statusCaixa === 'ABERTO' ? '#16a34a' : '#dc2626',
                                    borderColor: statusCaixa === 'ABERTO' ? '#16a34a' : '#dc2626'
                                }}
                            >
                                {statusCaixa === 'ABERTO' ? '● CAIXA ABERTO' : '● CAIXA FECHADO'}
                            </Badge>
                        </div>

                        {resumo && (
                            <Badge
                                bg="secondary"
                                className="bg-opacity-10 text-secondary border rounded-pill fw-semibold px-3 py-1"
                                style={{ borderColor: 'var(--border-color)', fontSize: '11.5px' }}
                            >
                                Saldo: R$ {Number(resumo.saldo_sistema).toFixed(2).replace('.', ',')}
                            </Badge>
                        )}

                        {/* Chave Seletora Fiscal vs Não Fiscal no Topo */}
                        <button
                            type="button"
                            onClick={handleToggleFiscalMode}
                            className={`btn btn-sm rounded-pill px-3 py-1 fw-bold d-flex align-items-center gap-2 border shadow-sm transition-all ${
                                isFiscal
                                    ? 'btn-success text-white border-success'
                                    : 'btn-light text-secondary'
                            }`}
                            style={{
                                fontSize: '11.5px',
                                borderColor: isFiscal ? '' : 'var(--border-color)'
                            }}
                            title="Clique ou pressione F9 para alternar entre Modo Fiscal (NFC-e) e Não Fiscal (Recibo)"
                        >
                            {isFiscal ? <ShieldCheck size={15} /> : <FileText size={15} />}
                            <span>
                                {isFiscal
                                    ? `MODO FISCAL (${pdvConfig.modo_fiscal})`
                                    : 'MODO NÃO FISCAL'}
                            </span>
                            <span className="badge bg-dark bg-opacity-25 rounded-pill" style={{ fontSize: '9px' }}>F9</span>
                        </button>
                    </div>

                    {/* Botões Rápidos de Configuração e Atalhos */}
                    <div className="d-flex align-items-center gap-2">
                        <Button
                            variant="primary"
                            size="sm"
                            className="rounded-pill px-3 py-1 fw-bold d-flex align-items-center gap-1 shadow-sm"
                            style={{ fontSize: '12px' }}
                            onClick={() => abrirConfigPdv('caixas')}
                            title="Gerenciar e Cadastrar Caixas & Séries NFC-e"
                        >
                            <Monitor size={15} /> Caixas & Séries
                        </Button>

                        <Button
                            variant="outline-secondary"
                            size="sm"
                            className="rounded-pill px-3 py-1 fw-bold d-flex align-items-center gap-1 border shadow-xs"
                            style={{ backgroundColor: 'var(--bg-main)', borderColor: 'var(--border-color)', color: 'var(--text-primary)', fontSize: '12px' }}
                            onClick={() => setModalHelpOpen(true)}
                            title="Ajuda e Mapa de Teclas de Atalho (F1)"
                        >
                            <Keyboard size={15} className="text-primary" /> Atalhos (F1)
                        </Button>

                        <Button
                            variant="outline-secondary"
                            size="sm"
                            className="rounded-pill px-3 py-1 fw-bold d-flex align-items-center gap-1 border shadow-xs"
                            style={{ backgroundColor: 'var(--bg-main)', borderColor: 'var(--border-color)', color: 'var(--text-primary)', fontSize: '12px' }}
                            onClick={() => abrirConfigPdv('caixas')}
                            title="Configurações do PDV, Caixas e Séries NFC-e (F10)"
                        >
                            <Settings size={15} className="text-primary" /> Config (F10)
                        </Button>
                    </div>
                </header>

                {/* Área Principal */}
                <main className="flex-grow-1 p-0 overflow-auto">
                    {abaAtiva === 'PDV' && (
                        statusCaixa === 'ABERTO' ? (
                            <div className="h-100 d-flex flex-column p-2">
                                <div
                                    className="flex-grow-1 rounded-4 overflow-hidden border shadow-sm d-flex flex-column"
                                    style={{ backgroundColor: 'var(--bg-sidebar)', borderColor: 'var(--border-color)' }}
                                >
                                    <ProductSearch
                                        onAddProduct={handleAddProduct}
                                        searchInputRef={searchInputRef}
                                    />
                                </div>
                                <div className="d-md-none" style={{ height: '90px' }}></div>
                            </div>
                        ) : (
                            <div className="h-100 d-flex align-items-center justify-content-center text-center p-4">
                                <div
                                    className="border shadow-lg rounded-4 p-5 w-100"
                                    style={{ maxWidth: '420px', backgroundColor: 'var(--bg-sidebar)', borderColor: 'var(--border-color)' }}
                                >
                                    <Clock size={60} className="text-primary mb-3 mx-auto opacity-75" />
                                    <h2 className="fw-bold h4 mb-2" style={{ color: 'var(--text-primary)' }}>Caixa Fechado</h2>
                                    <p className="mb-4 small" style={{ color: 'var(--text-secondary)' }}>
                                        Abra o turno financeiro para iniciar as vendas no PDV Fiscal / Não Fiscal.
                                    </p>
                                    <button
                                        type="button"
                                        onClick={() => setModalCaixaOpen(true)}
                                        className="btn btn-primary btn-lg w-100 py-3 rounded-4 shadow-sm fw-bold"
                                    >
                                        ABRIR CAIXA AGORA
                                    </button>
                                </div>
                            </div>
                        )
                    )}

                    {abaAtiva === 'MESAS' && (
                        <div className="h-100 d-flex flex-column">
                            {mesaSelecionada ? (
                                <>
                                    <div className="p-3 border-bottom d-flex align-items-center shadow-sm" style={{ backgroundColor: 'var(--bg-sidebar)', borderColor: 'var(--border-color)' }}>
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
                                        aoClicarMesaLivre={() => toast.info('Mesa livre. Os atendimentos devem ser iniciados pelo Salão ou QR Code.')}
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

                    {abaAtiva === 'AGENDAMENTOS' && (
                        <div className="p-3 h-100 overflow-hidden">
                            <AgendamentosCaixa onVendaSuccess={loadStatus} />
                        </div>
                    )}

                    {abaAtiva === 'VENDAS' && (
                        <div className="p-3 h-100 overflow-hidden">
                            <SalesHistory />
                        </div>
                    )}
                </main>

                {/* Barra Inferior de Atalhos Rápidos (Desktop) */}
                {pdvConfig?.mostrar_atalhos !== false && (
                    <div
                        className="d-none d-md-flex px-3 py-1 border-top align-items-center justify-content-between gap-2 overflow-auto no-scrollbar"
                        style={{ backgroundColor: 'var(--bg-sidebar)', borderColor: 'var(--border-color)', fontSize: '11px' }}
                    >
                        <div className="d-flex align-items-center gap-3 flex-wrap">
                            <span
                                className="cursor-pointer text-secondary hover-text-primary d-inline-flex align-items-center gap-1"
                                onClick={() => abrirConfigPdv('ATALHOS')}
                            >
                                <kbd className="px-1 py-0 bg-dark text-white rounded" style={{ fontSize: '10px' }}>F1</kbd> Ajuda
                            </span>
                            <span
                                className="cursor-pointer text-secondary hover-text-primary d-inline-flex align-items-center gap-1"
                                onClick={() => cart.length > 0 && statusCaixa === 'ABERTO' && setModalPaymentOpen(true)}
                            >
                                <kbd className="px-1 py-0 bg-success text-white rounded" style={{ fontSize: '10px' }}>F2</kbd> Pagar
                            </span>
                            <span
                                className="cursor-pointer text-secondary hover-text-primary d-inline-flex align-items-center gap-1"
                                onClick={() => setModalClienteOpen(true)}
                            >
                                <kbd className="px-1 py-0 bg-dark text-white rounded" style={{ fontSize: '10px' }}>F3</kbd> Cliente
                            </span>
                            <span
                                className="cursor-pointer text-secondary hover-text-primary d-inline-flex align-items-center gap-1"
                                onClick={() => {
                                    if (abaAtiva !== 'PDV') mudarAba('PDV');
                                    setTimeout(() => searchInputRef.current?.focus(), 50);
                                }}
                            >
                                <kbd className="px-1 py-0 bg-dark text-white rounded" style={{ fontSize: '10px' }}>F4</kbd> Buscar Item
                            </span>
                            <span
                                className="cursor-pointer text-secondary hover-text-primary d-inline-flex align-items-center gap-1"
                                onClick={() => mudarAba(abaAtiva === 'VENDAS' ? 'PDV' : 'VENDAS')}
                            >
                                <kbd className="px-1 py-0 bg-dark text-white rounded" style={{ fontSize: '10px' }}>F6</kbd> Histórico/NFC-e
                            </span>
                            {podeMovimentarCaixa && (
                                <>
                                    <span
                                        className="cursor-pointer text-secondary hover-text-primary d-inline-flex align-items-center gap-1"
                                        onClick={() => setModalMovimentacao({ open: true, tipo: 'ENTRADA' })}
                                    >
                                        <kbd className="px-1 py-0 bg-dark text-white rounded" style={{ fontSize: '10px' }}>F7</kbd> Suprimento
                                    </span>
                                    <span
                                        className="cursor-pointer text-secondary hover-text-primary d-inline-flex align-items-center gap-1"
                                        onClick={() => setModalMovimentacao({ open: true, tipo: 'SAIDA' })}
                                    >
                                        <kbd className="px-1 py-0 bg-dark text-white rounded" style={{ fontSize: '10px' }}>F8</kbd> Sangria
                                    </span>
                                </>
                            )}
                            <span
                                className="cursor-pointer text-secondary hover-text-primary d-inline-flex align-items-center gap-1"
                                onClick={handleToggleFiscalMode}
                            >
                                <kbd className="px-1 py-0 bg-primary text-white rounded" style={{ fontSize: '10px' }}>F9</kbd> Fiscal / Não Fiscal
                            </span>
                            <span
                                className="cursor-pointer text-secondary hover-text-primary d-inline-flex align-items-center gap-1"
                                onClick={() => abrirConfigPdv('FISCAL')}
                            >
                                <kbd className="px-1 py-0 bg-dark text-white rounded" style={{ fontSize: '10px' }}>F10</kbd> Configurar PDV
                            </span>
                        </div>
                        <div className="text-muted d-none d-xl-block" style={{ fontSize: '10.5px' }}>
                            Ambiente SEFAZ: <strong>{pdvConfig?.ambiente_fiscal === 'PRODUCAO' ? 'Produção' : 'Homologação'}</strong>
                        </div>
                    </div>
                )}
            </div>

            {/* Coluna Direita: Cesta / Cupom (Desktop) */}
            {abaAtiva === 'PDV' && (
                <div
                    className="d-none d-md-flex col-md-4 col-lg-3 flex-column shadow-sm z-1"
                    style={{ backgroundColor: 'var(--bg-sidebar)', borderColor: 'var(--border-color)' }}
                >
                    <Cart
                        cart={cart}
                        onUpdateQuantity={handleUpdateQuantity}
                        onRemove={handleRemoveProduct}
                        onClearCart={handleClearCart}
                        onCheckout={() => setModalPaymentOpen(true)}
                        clienteSelecionado={clienteSelecionado}
                        onOpenClienteModal={() => setModalClienteOpen(true)}
                        onClearCliente={() => setClienteSelecionado(null)}
                        cpfCnpjNota={cpfCnpjNota}
                        onChangeCpfCnpjNota={setCpfCnpjNota}
                        pdvConfig={pdvConfig}
                        onToggleFiscalMode={handleToggleFiscalMode}
                    />
                </div>
            )}

            {/* Barra Flutuante Mobile */}
            {abaAtiva === 'PDV' && cart.length > 0 && (
                <div
                    className="d-md-none position-fixed bottom-0 start-0 w-100 border-top shadow-lg p-3 d-flex align-items-center justify-content-between z-3"
                    style={{ height: '90px', backgroundColor: 'var(--bg-sidebar)', borderColor: 'var(--border-color)' }}
                >
                    <div onClick={() => setShowMobileCart(true)} className="d-flex align-items-center gap-3 flex-grow-1 cursor-pointer px-2">
                        <div className="position-relative">
                            <ShoppingCart size={30} className="text-primary" />
                            <span className="position-absolute top-0 start-100 translate-middle badge rounded-circle bg-danger border border-white" style={{ padding: '4px 6px', fontSize: '10px' }}>
                                {cart.length}
                            </span>
                        </div>
                        <div className="ms-1">
                            <small className="d-block fw-bold text-uppercase" style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>Total a Pagar</small>
                            <span className="fw-bolder fs-4" style={{ color: 'var(--text-primary)', lineHeight: '1' }}>R$ {cartTotal.toFixed(2).replace('.', ',')}</span>
                        </div>
                    </div>
                    <Button
                        variant="success"
                        className="rounded-4 px-4 py-3 fw-bold shadow-sm d-flex align-items-center gap-2 border-0"
                        onClick={() => setModalPaymentOpen(true)}
                        style={{ fontSize: '14px' }}
                    >
                        PAGAR
                    </Button>
                </div>
            )}

            {/* Offcanvas Cesta Mobile */}
            <Offcanvas show={showMobileCart} onHide={() => setShowMobileCart(false)} placement="bottom" className="d-md-none rounded-top-4" style={{ height: '85vh', backgroundColor: 'var(--bg-sidebar)' }}>
                <Offcanvas.Header closeButton className="border-bottom py-3" style={{ borderColor: 'var(--border-color)' }}>
                    <Offcanvas.Title className="fs-6 fw-bold d-flex align-items-center" style={{ color: 'var(--text-primary)' }}>
                        <ShoppingCart size={20} className="me-2 text-primary" /> Cesta de Compras
                    </Offcanvas.Title>
                </Offcanvas.Header>
                <Offcanvas.Body className="p-0 d-flex flex-column">
                    <Cart
                        cart={cart}
                        onUpdateQuantity={handleUpdateQuantity}
                        onRemove={handleRemoveProduct}
                        onClearCart={handleClearCart}
                        onCheckout={() => { setShowMobileCart(false); setModalPaymentOpen(true); }}
                        isMobile={true}
                        clienteSelecionado={clienteSelecionado}
                        onOpenClienteModal={() => setModalClienteOpen(true)}
                        onClearCliente={() => setClienteSelecionado(null)}
                        cpfCnpjNota={cpfCnpjNota}
                        onChangeCpfCnpjNota={setCpfCnpjNota}
                        pdvConfig={pdvConfig}
                        onToggleFiscalMode={handleToggleFiscalMode}
                    />
                </Offcanvas.Body>
            </Offcanvas>

            {/* Modais Operacionais e de Configuração */}
            <CaixaModal
                isOpen={modalCaixaOpen}
                mode={statusCaixa === 'ABERTO' ? 'fechar' : 'abrir'}
                onClose={() => statusCaixa === 'ABERTO' && setModalCaixaOpen(false)}
                onSuccess={() => { setModalCaixaOpen(false); loadStatus(); }}
            />

            <PaymentModal
                isOpen={modalPaymentOpen}
                cart={cart}
                total={cartTotal}
                clienteId={clienteSelecionado?.id_usuario}
                clienteSelecionado={clienteSelecionado}
                cpfCnpjNota={cpfCnpjNota}
                onChangeCpfCnpjNota={setCpfCnpjNota}
                pdvConfig={pdvConfig}
                onClose={() => setModalPaymentOpen(false)}
                onFinishSuccess={handleVendaSuccess}
            />

            <MovimentacaoModal
                isOpen={modalMovimentacao.open}
                tipoInicial={modalMovimentacao.tipo}
                onClose={() => setModalMovimentacao({ ...modalMovimentacao, open: false })}
                onSuccess={() => loadStatus()}
            />

            <ClienteModal
                isOpen={modalClienteOpen}
                onClose={() => setModalClienteOpen(false)}
                onSelectCliente={(c) => { setClienteSelecionado(c); setModalClienteOpen(false); }}
            />

            <DailyReportModal
                isOpen={modalRelatorioOpen}
                onClose={() => setModalRelatorioOpen(false)}
            />

            <BarcodeScannerModal
                isOpen={modalScannerOpen}
                onClose={() => setModalScannerOpen(false)}
                onScan={processarCodigoBarras}
            />

            <PdvConfigModal
                isOpen={modalConfigOpen}
                initialTab={modalConfigTab}
                config={pdvConfig}
                onSave={(newCfg) => setPdvConfig(newCfg)}
                onClose={() => setModalConfigOpen(false)}
            />

            <PdvHelpModal
                isOpen={modalHelpOpen}
                onClose={() => setModalHelpOpen(false)}
            />

            <style>{`
                .hover-bg:hover { background-color: var(--bg-hover) !important; }
                .hover-text-primary:hover { color: #0ea5e9 !important; }
                .cursor-pointer { cursor: pointer; }
                body.dark-mode .btn-close { filter: invert(1); }
            `}</style>
        </div>
    );
}