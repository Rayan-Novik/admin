import React, { useState, useEffect, useCallback } from 'react';
import {
    CreditCard,
    Banknote,
    QrCode,
    CheckCircle,
    Receipt,
    FileText,
    ShieldCheck,
    AlertTriangle,
    Printer,
    Sparkles,
    RefreshCw,
    ArrowRight,
    Lock,
    Building2,
    Wallet,
    Plus,
    Trash2
} from 'lucide-react';
import { Spinner, Badge } from 'react-bootstrap';
import { toast } from 'react-toastify';
import api from '../../../services/api';
import { emitirNotaFiscalVendaPdv, playPdvBeep } from './pdvService';
import { usePermission } from '../../../hooks/usePermission';

const FORMAS_PADRAO_SEFAZ = [
    { id: 'sefaz_01', codigo_sefaz: '01', descricao: 'Dinheiro' },
    { id: 'sefaz_17', codigo_sefaz: '17', descricao: 'PIX' },
    { id: 'sefaz_03', codigo_sefaz: '03', descricao: 'Cartão de Crédito' },
    { id: 'sefaz_04', codigo_sefaz: '04', descricao: 'Cartão de Débito' }
];

const converterCodigoSefazParaMetodo = (codigo) => {
    const cod = String(codigo || '').padStart(2, '0');
    if (cod === '01') return 'DINHEIRO';
    if (cod === '17') return 'PIX';
    if (cod === '03') return 'CARTAO_CREDITO';
    if (cod === '04') return 'CARTAO_DEBITO';
    if (cod === '02') return 'CHEQUE';
    if (cod === '05') return 'CREDITO_LOJA';
    if (cod === '15') return 'BOLETO';
    return 'OUTROS';
};

const getIconeForma = (codigo) => {
    const cod = String(codigo || '').padStart(2, '0');
    if (cod === '01') return Banknote;
    if (cod === '17') return QrCode;
    if (cod === '03' || cod === '04') return CreditCard;
    if (cod === '02' || cod === '15') return FileText;
    if (cod === '05') return Building2;
    return Wallet;
};

export default function PaymentModal({
    isOpen,
    cart,
    total,
    clienteId,
    clienteSelecionado,
    cpfCnpjNota = '',
    onChangeCpfCnpjNota,
    pdvConfig,
    onClose,
    onFinishSuccess
}) {
    const { can, user } = usePermission();
    // Apenas donos, admins ou supervisores podem alterar para Modo Não Fiscal
    const podeAlternarModoFiscal = Boolean(
        user?.is_dono ||
        user?.isAdmin ||
        user?.role === 'ADMIN' ||
        can('FISCAL_MANAGE') ||
        can('PDV_ALTERAR_MODO_FISCAL')
    );

    const [method, setMethod] = useState('DINHEIRO');
    const [formasSefaz, setFormasSefaz] = useState(FORMAS_PADRAO_SEFAZ);
    const [formaSelecionada, setFormaSelecionada] = useState(null);
    const [loadingFormas, setLoadingFormas] = useState(false);

    // Modalidade: 'UNICO' (pagamento total em 1 forma) ou 'MULTIPLO' (dividir em várias formas)
    const [tipoPagamento, setTipoPagamento] = useState('UNICO');
    const [pagamentosMultiplos, setPagamentosMultiplos] = useState([]);
    const [valorParcialInput, setValorParcialInput] = useState('');

    const [recebido, setRecebido] = useState('');
    const [desconto, setDesconto] = useState('');
    const [troco, setTroco] = useState(0);
    const [loading, setLoading] = useState(false);

    // Modo de emissão selecionado para esta venda ('NFCE' | 'NFE' | 'NAO_FISCAL')
    const [modoEmissao, setModoEmissao] = useState('NFCE');

    // Pós-venda
    const [vendaFinalizada, setVendaFinalizada] = useState(null);
    const [fiscalResult, setFiscalResult] = useState(null);
    const [emitindoPosterior, setEmitindoPosterior] = useState(false);

    const valorDesconto = Math.max(0, Math.min(Number(desconto) || 0, total));
    const totalLiquido = Math.max(0, Number((total - valorDesconto).toFixed(2)));

    // Cálculos do Pagamento Múltiplo
    const totalPagoMultiplo = Number(pagamentosMultiplos.reduce((acc, p) => acc + Number(p.valor || 0), 0).toFixed(2));
    const saldoRestanteMultiplo = Math.max(0, Number((totalLiquido - totalPagoMultiplo).toFixed(2)));
    const trocoMultiplo = Math.max(0, Number((totalPagoMultiplo - totalLiquido).toFixed(2)));

    // Carrega formas de pagamento cadastradas na SEFAZ do banco
    const carregarFormasSefaz = useCallback(async () => {
        setLoadingFormas(true);
        try {
            const { data } = await api.get('/fiscal/formas-pagamento');
            if (Array.isArray(data) && data.length > 0) {
                setFormasSefaz(data);
                const padrao = data.find(f => String(f.codigo_sefaz) === '01') || data[0];
                setFormaSelecionada(padrao);
                setMethod(converterCodigoSefazParaMetodo(padrao.codigo_sefaz));
            } else {
                setFormasSefaz(FORMAS_PADRAO_SEFAZ);
                setFormaSelecionada(FORMAS_PADRAO_SEFAZ[0]);
                setMethod('DINHEIRO');
            }
        } catch (err) {
            console.error('Erro ao carregar formas de pagamento SEFAZ:', err);
            setFormasSefaz(FORMAS_PADRAO_SEFAZ);
            setFormaSelecionada(FORMAS_PADRAO_SEFAZ[0]);
            setMethod('DINHEIRO');
        } finally {
            setLoadingFormas(false);
        }
    }, []);

    useEffect(() => {
        if (isOpen) {
            setRecebido('');
            setDesconto('');
            setTroco(0);
            setTipoPagamento('UNICO');
            setPagamentosMultiplos([]);
            setValorParcialInput('');
            setVendaFinalizada(null);
            setFiscalResult(null);
            setEmitindoPosterior(false);
            setModoEmissao(pdvConfig?.modo_fiscal || 'NFCE');
            carregarFormasSefaz();
        }
    }, [isOpen, pdvConfig?.modo_fiscal, carregarFormasSefaz]);

    useEffect(() => {
        if (method === 'DINHEIRO' && recebido !== '') {
            setTroco(Number(recebido) - totalLiquido);
        } else {
            setTroco(0);
        }
    }, [recebido, method, totalLiquido]);

    const handleSelecionarForma = (forma) => {
        setFormaSelecionada(forma);
        setMethod(converterCodigoSefazParaMetodo(forma.codigo_sefaz));
        if (tipoPagamento === 'MULTIPLO') {
            const rest = Math.max(0, Number((totalLiquido - totalPagoMultiplo).toFixed(2)));
            setValorParcialInput(rest > 0 ? String(rest) : '');
        }
    };

    const handleAdicionarPagamentoParcial = () => {
        const val = Number(valorParcialInput);
        if (!val || val <= 0) {
            toast.warning('Informe um valor válido maior que zero para adicionar.');
            return;
        }
        if (!formaSelecionada) {
            toast.warning('Selecione uma forma de pagamento.');
            return;
        }

        const novoItem = {
            id: `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            forma: formaSelecionada,
            metodo: converterCodigoSefazParaMetodo(formaSelecionada.codigo_sefaz),
            codigo_sefaz: formaSelecionada.codigo_sefaz,
            descricao: formaSelecionada.descricao,
            valor: Number(val.toFixed(2))
        };

        const novaLista = [...pagamentosMultiplos, novoItem];
        setPagamentosMultiplos(novaLista);

        const novoTotalPago = Number(novaLista.reduce((acc, p) => acc + p.valor, 0).toFixed(2));
        const novoRest = Math.max(0, Number((totalLiquido - novoTotalPago).toFixed(2)));
        setValorParcialInput(novoRest > 0 ? String(novoRest) : '');
    };

    const handleRemoverPagamentoParcial = (idRemover) => {
        const novaLista = pagamentosMultiplos.filter(p => p.id !== idRemover);
        setPagamentosMultiplos(novaLista);
        const novoTotalPago = Number(novaLista.reduce((acc, p) => acc + p.valor, 0).toFixed(2));
        const novoRest = Math.max(0, Number((totalLiquido - novoTotalPago).toFixed(2)));
        setValorParcialInput(novoRest > 0 ? String(novoRest) : '');
    };

    const handleSelecionarModoEmissao = (novoModo) => {
        if (novoModo === 'NAO_FISCAL' && !podeAlternarModoFiscal) {
            toast.error('Acesso restrito: Operadores de caixa não têm permissão para emitir vendas no modo Não Fiscal.');
            return;
        }
        setModoEmissao(novoModo);
    };

    const abrirPdfNota = useCallback(async (notaId) => {
        if (!notaId) return;
        const pdfWindow = window.open('', '_blank');
        if (pdfWindow) {
            pdfWindow.document.write('<div style="font-family:sans-serif;padding:24px;text-align:center;">Gerando DANFE / DANFCE, aguarde...</div>');
        }
        try {
            const response = await api.get(`/fiscal/notas/${notaId}/pdf`, { responseType: 'blob' });
            const contentType = response.headers?.['content-type'] || '';

            if (contentType.includes('application/pdf')) {
                const blob = new Blob([response.data], { type: 'application/pdf' });
                const blobUrl = URL.createObjectURL(blob);
                if (pdfWindow) pdfWindow.location.href = blobUrl;
                else window.open(blobUrl, '_blank');
                return;
            }

            const text = await response.data.text();
            const data = JSON.parse(text);
            const urlPdf = data.url || data.pdf_url || data.link || data.danfe_url;
            const base64Pdf = data.base64 || data.pdf_base64 || data.danfe_base64;

            if (urlPdf) {
                if (pdfWindow) pdfWindow.location.href = urlPdf;
            } else if (base64Pdf) {
                if (pdfWindow) pdfWindow.location.href = `data:application/pdf;base64,${base64Pdf}`;
            } else {
                if (pdfWindow) pdfWindow.close();
                toast.warning('PDF da nota ainda não disponível.');
            }
        } catch (err) {
            if (pdfWindow) pdfWindow.close();
            toast.error('Erro ao abrir o PDF da Nota Fiscal.');
        }
    }, []);

    // Confirmar venda no PDV
    const handleConfirm = async () => {
        if (loading || vendaFinalizada) return;

        const isMultiplo = tipoPagamento === 'MULTIPLO';

        if (isMultiplo) {
            if (pagamentosMultiplos.length === 0) {
                playPdvBeep('error');
                toast.warning('Adicione pelo menos 1 forma de pagamento à lista!');
                return;
            }
            if (totalPagoMultiplo < totalLiquido) {
                playPdvBeep('error');
                toast.warning(`Total lançado (R$ ${totalPagoMultiplo.toFixed(2)}) é menor que o total a pagar (R$ ${totalLiquido.toFixed(2)}). Faltam R$ ${saldoRestanteMultiplo.toFixed(2)}.`);
                return;
            }
        } else {
            const valorRecNum = recebido === '' ? totalLiquido : Number(recebido);
            if (method === 'DINHEIRO' && valorRecNum < totalLiquido) {
                playPdvBeep('error');
                toast.warning('O valor recebido em dinheiro é menor que o total a pagar!');
                return;
            }
        }

        setLoading(true);
        try {
            const emitirFiscal = modoEmissao !== 'NAO_FISCAL';
            const valorRecNum = recebido === '' ? totalLiquido : Number(recebido);

            const payload = {
                itens: cart.map(item => ({
                    id_produto: item.id_produto,
                    quantidade: Number(item.quantidade),
                    preco: Number(item.preco),
                    complementos: item.complementos || []
                })),
                metodo_pagamento: isMultiplo
                    ? pagamentosMultiplos.map(p => p.descricao).join(' + ').substring(0, 50)
                    : (formaSelecionada?.descricao || method),
                pagamentos_multiplos: isMultiplo ? pagamentosMultiplos.map(p => ({
                    forma_id: p.forma?.id && !String(p.forma.id).startsWith('sefaz_') ? p.forma.id : null,
                    codigo_sefaz: p.codigo_sefaz,
                    descricao: p.descricao,
                    valor: p.valor
                })) : null,
                forma_pagamento_id: !isMultiplo && formaSelecionada?.id && !String(formaSelecionada.id).startsWith('sefaz_') ? formaSelecionada.id : null,
                caixa_id: pdvConfig?.caixa_id || undefined,
                serie_numero: pdvConfig?.serie_numero || undefined,
                valor_recebido: isMultiplo ? totalPagoMultiplo : (method === 'DINHEIRO' ? valorRecNum : totalLiquido),
                desconto: valorDesconto,
                cliente_id: clienteId || null,
                cpf_cnpj_nota: cpfCnpjNota ? String(cpfCnpjNota).replace(/\D/g, '') : null,
                nome_nota: clienteSelecionado?.nome || clienteSelecionado?.nome_completo || null,
                emitir_fiscal: emitirFiscal,
                tipo_documento_fiscal: modoEmissao === 'NFE' ? 'NFE' : 'NFCE',
                cenario_id: pdvConfig?.cenario_id || undefined,
                ambiente_fiscal: pdvConfig?.ambiente_fiscal || undefined
            };

            const { data } = await api.post('/pdv/venda', payload);
            setVendaFinalizada(data.pedido);
            const fiscalInfo = data.fiscal || data.nota_fiscal || (data.fiscal_error ? { success: false, status: 'REJEITADA', error: data.fiscal_error } : null);
            setFiscalResult(fiscalInfo);
            playPdvBeep('success');

            if (fiscalInfo?.success && fiscalInfo?.status === 'AUTORIZADA') {
                toast.success(`Venda #${data.pedido.id_pedido} e ${modoEmissao} autorizada na SEFAZ!`);
                if (pdvConfig?.auto_imprimir_cupom && fiscalInfo?.nota_id) {
                    abrirPdfNota(fiscalInfo.nota_id);
                }
            } else if (emitirFiscal && fiscalInfo && !fiscalInfo.success) {
                toast.warning(`Venda #${data.pedido.id_pedido} salva, mas houve alerta fiscal: ${fiscalInfo.error || fiscalInfo.motivo_sefaz || 'Verifique os dados fiscais'}`);
            } else {
                toast.success(`Venda #${data.pedido.id_pedido} registrada com sucesso!`);
                if (pdvConfig?.auto_imprimir_cupom && !emitirFiscal) {
                    setTimeout(() => window.print(), 300);
                }
            }
        } catch (error) {
            playPdvBeep('error');
            toast.error(error.response?.data?.message || 'Erro ao finalizar venda no PDV.');
        } finally {
            setLoading(false);
        }
    };

    // Emitir posterior
    const handleEmitirPosterior = async (tipoDoc = 'NFCE') => {
        if (!vendaFinalizada?.id_pedido || emitindoPosterior) return;
        setEmitindoPosterior(true);
        try {
            const { data } = await api.post(`/pdv/venda/${vendaFinalizada.id_pedido}/emitir-fiscal`, {
                tipo_documento_fiscal: tipoDoc,
                cpf_cnpj_nota: cpfCnpjNota ? String(cpfCnpjNota).replace(/\D/g, '') : null,
                cenario_id: pdvConfig?.cenario_id,
                caixa_id: pdvConfig?.caixa_id,
                serie_numero: pdvConfig?.serie_numero,
                forma_pagamento_id: formaSelecionada?.id && !String(formaSelecionada.id).startsWith('sefaz_') ? formaSelecionada.id : null
            });
            setFiscalResult(data.nota_fiscal);
            if (data.nota_fiscal?.status === 'AUTORIZADA') {
                toast.success(`Nota Fiscal autorizada com sucesso na SEFAZ!`);
                if (data.nota_fiscal.id) abrirPdfNota(data.nota_fiscal.id);
            } else {
                toast.warning(`Nota emitida com status: ${data.nota_fiscal?.status}`);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Falha ao emitir nota fiscal.');
        } finally {
            setEmitindoPosterior(false);
        }
    };

    const fecharTudo = useCallback(() => {
        if (vendaFinalizada) {
            onFinishSuccess({ pedido: vendaFinalizada, fiscal: fiscalResult });
        } else {
            onClose();
        }
    }, [vendaFinalizada, fiscalResult, onFinishSuccess, onClose]);

    // Atalhos de teclado no Checkout
    useEffect(() => {
        if (!isOpen) return;
        const onKeyDown = (e) => {
            if (vendaFinalizada) {
                if (e.key === 'Enter' || e.key === 'Escape') {
                    e.preventDefault();
                    fecharTudo();
                }
                return;
            }

            if (e.key === 'Escape') {
                e.preventDefault();
                onClose();
                return;
            }

            if (e.key === 'F9') {
                e.preventDefault();
                if (!podeAlternarModoFiscal) {
                    toast.error('Acesso restrito: Operadores de caixa não têm permissão para alterar o modo fiscal.');
                    return;
                }
                setModoEmissao(prev => (prev === 'NAO_FISCAL' ? 'NFCE' : 'NAO_FISCAL'));
                return;
            }

            // Teclas 1 a 9 selecionam a forma de pagamento correspondente
            const isInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target?.tagName);
            if (!isInput) {
                const keyNum = parseInt(e.key, 10);
                if (!isNaN(keyNum) && keyNum >= 1 && keyNum <= formasSefaz.length) {
                    const formaEscolhida = formasSefaz[keyNum - 1];
                    if (formaEscolhida) {
                        e.preventDefault();
                        handleSelecionarForma(formaEscolhida);
                    }
                }
            }

            if (e.key === 'F2' || (e.key === 'Enter' && !loading)) {
                e.preventDefault();
                handleConfirm();
            }
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [isOpen, vendaFinalizada, loading, method, formasSefaz, recebido, totalLiquido, modoEmissao, cpfCnpjNota, podeAlternarModoFiscal, fecharTudo, onClose]);

    if (!isOpen) return null;

    const formatBRL = (val) =>
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(val || 0));

    // ========================================================
    // TELA 2: PÓS-VENDA (COMPROVANTE FISCAL / NÃO FISCAL)
    // ========================================================
    if (vendaFinalizada) {
        const isAutorizada = fiscalResult?.status === 'AUTORIZADA';
        const notaId = fiscalResult?.nota_id || fiscalResult?.id;

        return (
            <div
                className="modal fade show d-block"
                style={{
                    backgroundColor: 'rgba(15, 23, 42, 0.75)',
                    backdropFilter: 'blur(5px)',
                    zIndex: 1060
                }}
                tabIndex="-1"
            >
                <div className="modal-dialog modal-dialog-centered">
                    <div
                        className="modal-content border-0 shadow-lg rounded-4 overflow-hidden p-4 d-print-none"
                        style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0' }}
                    >
                        <div className="text-center mb-3">
                            <div
                                className="rounded-circle bg-success bg-opacity-10 text-success d-inline-flex align-items-center justify-content-center mb-2"
                                style={{ width: '64px', height: '64px' }}
                            >
                                <CheckCircle size={38} />
                            </div>
                            <h4 className="fw-bold mb-1" style={{ color: '#0f172a' }}>
                                Venda #{vendaFinalizada.id_pedido} Concluída!
                            </h4>
                            <div className="d-flex justify-content-center gap-2 align-items-center flex-wrap">
                                <Badge bg="primary" className="rounded-pill px-3 py-1">
                                    Total: {formatBRL(totalLiquido)}
                                </Badge>
                                {tipoPagamento === 'MULTIPLO' ? (
                                    <>
                                        <Badge bg="info" text="dark" className="rounded-pill px-3 py-1 fw-bold">
                                            {pagamentosMultiplos.length} Formas de Pagamento
                                        </Badge>
                                        {trocoMultiplo > 0 && (
                                            <Badge bg="warning" text="dark" className="rounded-pill px-3 py-1 fw-bold">
                                                Troco: {formatBRL(trocoMultiplo)}
                                            </Badge>
                                        )}
                                    </>
                                ) : (
                                    method === 'DINHEIRO' && troco > 0 && (
                                        <Badge bg="warning" text="dark" className="rounded-pill px-3 py-1 fw-bold">
                                            Troco: {formatBRL(troco)}
                                        </Badge>
                                    )
                                )}
                            </div>
                        </div>

                        {/* Detalhe de pagamentos múltiplos no pós-venda */}
                        {tipoPagamento === 'MULTIPLO' && pagamentosMultiplos.length > 0 && (
                            <div className="p-3 rounded-4 border bg-light mb-3 text-start small">
                                <span className="fw-bold d-block text-secondary text-uppercase mb-2" style={{ fontSize: '11px' }}>
                                    Pagamentos Divididos:
                                </span>
                                {pagamentosMultiplos.map((p, idx) => (
                                    <div key={idx} className="d-flex justify-content-between py-1 border-bottom border-light-subtle">
                                        <span>{p.descricao} (Cód. {p.codigo_sefaz}):</span>
                                        <strong className="text-dark">{formatBRL(p.valor)}</strong>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Status Fiscal da Venda */}
                        {isAutorizada ? (
                            <div className="p-3 rounded-4 border border-success border-opacity-25 bg-success bg-opacity-10 mb-3 text-start">
                                <div className="d-flex align-items-center justify-content-between mb-2">
                                    <span className="fw-bold text-success d-flex align-items-center gap-2" style={{ fontSize: '13px' }}>
                                        <ShieldCheck size={18} />
                                        {fiscalResult.tipo || 'NFC-e'} Autorizada pela SEFAZ
                                    </span>
                                    <Badge bg="success" className="rounded-pill">
                                        Nº {fiscalResult.numero} / Série {fiscalResult.serie}
                                    </Badge>
                                </div>
                                {fiscalResult.chave_acesso && (
                                    <div className="small text-muted font-monospace text-break mb-1" style={{ fontSize: '10.5px' }}>
                                        Chave: {fiscalResult.chave_acesso}
                                    </div>
                                )}
                                {fiscalResult.protocolo_autorizacao && (
                                    <div className="small text-muted" style={{ fontSize: '11px' }}>
                                        Protocolo: <strong>{fiscalResult.protocolo_autorizacao}</strong>
                                    </div>
                                )}
                            </div>
                        ) : fiscalResult && !fiscalResult.success ? (
                            <div className="p-3 rounded-4 border border-warning border-opacity-50 bg-warning bg-opacity-10 mb-3 text-start">
                                <div className="fw-bold text-warning-emphasis d-flex align-items-center gap-2 mb-1" style={{ fontSize: '13px' }}>
                                    <AlertTriangle size={18} className="text-warning" />
                                    Venda salva! Emissão Fiscal pendente/rejeitada:
                                </div>
                                <div className="small text-muted mb-2" style={{ fontSize: '11.5px' }}>
                                    {fiscalResult.motivo_sefaz || fiscalResult.error}
                                </div>
                                <div className="d-flex gap-2">
                                    <button
                                        type="button"
                                        disabled={emitindoPosterior}
                                        onClick={() => handleEmitirPosterior('NFCE')}
                                        className="btn btn-sm btn-warning fw-bold rounded-3 d-flex align-items-center gap-1"
                                    >
                                        {emitindoPosterior ? <Spinner size="sm" /> : <RefreshCw size={14} />}
                                        Tentar NFC-e Novamente
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="p-3 rounded-4 border mb-3 text-start" style={{ backgroundColor: '#f8fafc', borderColor: '#e2e8f0' }}>
                                <div className="d-flex align-items-center justify-content-between">
                                    <div>
                                        <span className="fw-bold d-block" style={{ color: '#0f172a', fontSize: '13px' }}>
                                            Venda registrada em Modo Não Fiscal
                                        </span>
                                        <small className="text-muted" style={{ fontSize: '11px' }}>
                                            Deseja emitir o Cupom Fiscal (NFC-e) para esta venda agora?
                                        </small>
                                    </div>
                                    <button
                                        type="button"
                                        disabled={emitindoPosterior}
                                        onClick={() => handleEmitirPosterior('NFCE')}
                                        className="btn btn-sm btn-outline-success rounded-3 fw-bold d-flex align-items-center gap-1 text-nowrap"
                                    >
                                        {emitindoPosterior ? <Spinner size="sm" /> : <ShieldCheck size={15} />}
                                        Emitir NFC-e
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Botões de Impressão e Nova Venda */}
                        <div className="d-flex flex-column gap-2">
                            {isAutorizada && notaId && (
                                <button
                                    type="button"
                                    onClick={() => abrirPdfNota(notaId)}
                                    className="btn btn-success btn-lg rounded-4 fw-bold shadow-sm d-flex align-items-center justify-content-center gap-2"
                                >
                                    <Receipt size={20} /> Imprimir Cupom Fiscal (DANFCE)
                                </button>
                            )}

                            <button
                                type="button"
                                onClick={() => window.print()}
                                className="btn btn-outline-secondary rounded-4 py-2 fw-bold d-flex align-items-center justify-content-center gap-2"
                            >
                                <Printer size={18} /> Imprimir Recibo Não Fiscal (Térmica)
                            </button>

                            <button
                                type="button"
                                onClick={fecharTudo}
                                autoFocus
                                className="btn btn-primary btn-lg rounded-4 py-3 fw-bold shadow-sm d-flex align-items-center justify-content-center gap-2 mt-2"
                            >
                                <span>Nova Venda (Enter)</span>
                                <ArrowRight size={18} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Área de Impressão Térmica Não Fiscal */}
                <div className="d-none d-print-block font-monospace" id="pdv-thermal-receipt" style={{ width: '80mm', color: '#000', fontSize: '11px', lineHeight: '1.25' }}>
                    <div className="text-center mb-2">
                        <h6 className="fw-bold text-uppercase mb-0">COMPROVANTE DE VENDA</h6>
                        <small>SEM VALOR FISCAL</small>
                    </div>
                    <div className="border-top border-bottom border-dark py-1 my-1">
                        <div className="d-flex justify-content-between">
                            <span>PEDIDO: #{vendaFinalizada.id_pedido}</span>
                            <span>{new Date().toLocaleString('pt-BR')}</span>
                        </div>
                        {cpfCnpjNota && (
                            <div>CPF/CNPJ: {cpfCnpjNota}</div>
                        )}
                    </div>
                    <table style={{ width: '100%', fontSize: '11px' }} className="my-2">
                        <thead>
                            <tr style={{ borderBottom: '1px dashed #000' }}>
                                <th className="text-start">ITEM</th>
                                <th className="text-center">QTD</th>
                                <th className="text-end">TOTAL</th>
                            </tr>
                        </thead>
                        <tbody>
                            {cart.map((item, idx) => (
                                <tr key={idx}>
                                    <td>{String(item.nome).substring(0, 20)}</td>
                                    <td className="text-center">{item.quantidade}</td>
                                    <td className="text-end">{formatBRL(Number(item.preco) * Number(item.quantidade))}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <div className="border-top border-dark pt-1">
                        {valorDesconto > 0 && (
                            <div className="d-flex justify-content-between">
                                <span>DESCONTO:</span>
                                <span>- {formatBRL(valorDesconto)}</span>
                            </div>
                        )}
                        <div className="d-flex justify-content-between fw-bold">
                            <span>TOTAL A PAGAR:</span>
                            <span>{formatBRL(totalLiquido)}</span>
                        </div>
                        {tipoPagamento === 'MULTIPLO' ? (
                            <div>
                                <div className="fw-bold mt-1">FORMAS DE PAGAMENTO:</div>
                                {pagamentosMultiplos.map((p, idx) => (
                                    <div key={idx} className="d-flex justify-content-between">
                                        <span>- {p.descricao}:</span>
                                        <span>{formatBRL(p.valor)}</span>
                                    </div>
                                ))}
                                {trocoMultiplo > 0 && (
                                    <div className="d-flex justify-content-between">
                                        <span>TROCO:</span>
                                        <span>{formatBRL(trocoMultiplo)}</span>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <>
                                <div className="d-flex justify-content-between">
                                    <span>FORMA PGTO:</span>
                                    <span>{formaSelecionada?.descricao || method.replace('_', ' ')}</span>
                                </div>
                                {method === 'DINHEIRO' && troco > 0 && (
                                    <div className="d-flex justify-content-between">
                                        <span>TROCO:</span>
                                        <span>{formatBRL(troco)}</span>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // ========================================================
    // TELA 1: CHECKOUT COM FUNDO OPACO E FORMAS SEFAZ
    // ========================================================
    const cedulasRapidas = [10, 20, 50, 100, 200];

    return (
        <div
            className="modal fade show d-block"
            style={{
                backgroundColor: 'rgba(15, 23, 42, 0.75)',
                backdropFilter: 'blur(5px)',
                zIndex: 1060
            }}
            tabIndex="-1"
        >
            <div className="modal-dialog modal-dialog-centered modal-lg">
                <div
                    className="modal-content border-0 shadow-lg rounded-4 overflow-hidden"
                    style={{
                        backgroundColor: '#ffffff',
                        border: '1px solid #e2e8f0',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.45)'
                    }}
                >
                    {/* Cabeçalho */}
                    <div
                        className="p-3 px-4 d-flex justify-content-between align-items-center"
                        style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}
                    >
                        <div>
                            <h5 className="fw-bold mb-0" style={{ color: '#0f172a' }}>
                                Finalizar Venda
                            </h5>
                            <small style={{ color: '#64748b', fontSize: '12px' }}>
                                Escolha a forma de pagamento e o tipo de comprovante
                            </small>
                        </div>
                        <div className="text-end">
                            <span className="d-block text-uppercase fw-bold" style={{ color: '#64748b', fontSize: '10.5px' }}>
                                Total a Pagar
                            </span>
                            <h3 className="mb-0 fw-bolder text-primary">{formatBRL(totalLiquido)}</h3>
                        </div>
                    </div>

                    <div className="modal-body p-4" style={{ backgroundColor: '#ffffff' }}>
                        {/* 1. SELETOR RÁPIDO: FISCAL vs NÃO FISCAL */}
                        <div className="mb-4">
                            <div className="d-flex justify-content-between align-items-center mb-2">
                                <label className="small fw-bold text-uppercase m-0" style={{ color: '#475569', fontSize: '11px', letterSpacing: '0.5px' }}>
                                    1. Comprovante da Venda
                                    {podeAlternarModoFiscal && <span className="text-muted ms-1">(F9 alterna)</span>}
                                </label>
                                <Badge bg={modoEmissao !== 'NAO_FISCAL' ? 'success' : 'secondary'} className="rounded-pill">
                                    {modoEmissao !== 'NAO_FISCAL' ? 'Emissão SEFAZ Ativa' : 'Somente Recibo Interno'}
                                </Badge>
                            </div>

                            <div className="row g-2">
                                <div className="col-4">
                                    <button
                                        type="button"
                                        onClick={() => handleSelecionarModoEmissao('NFCE')}
                                        className={`btn w-100 py-2 px-3 rounded-4 border d-flex align-items-center justify-content-center gap-2 fw-bold transition-all ${
                                            modoEmissao === 'NFCE'
                                                ? 'btn-success text-white border-success shadow-sm'
                                                : ''
                                        }`}
                                        style={{
                                            fontSize: '12.5px',
                                            backgroundColor: modoEmissao === 'NFCE' ? '#16a34a' : '#f8fafc',
                                            borderColor: modoEmissao === 'NFCE' ? '#16a34a' : '#e2e8f0',
                                            color: modoEmissao === 'NFCE' ? '#ffffff' : '#0f172a'
                                        }}
                                    >
                                        <ShieldCheck size={18} />
                                        <span>Fiscal NFC-e</span>
                                    </button>
                                </div>
                                <div className="col-4">
                                    <button
                                        type="button"
                                        onClick={() => handleSelecionarModoEmissao('NAO_FISCAL')}
                                        disabled={!podeAlternarModoFiscal}
                                        className={`btn w-100 py-2 px-3 rounded-4 border d-flex align-items-center justify-content-center gap-2 fw-bold transition-all ${
                                            modoEmissao === 'NAO_FISCAL'
                                                ? 'btn-secondary text-white border-secondary shadow-sm'
                                                : ''
                                        }`}
                                        style={{
                                            fontSize: '12.5px',
                                            backgroundColor: modoEmissao === 'NAO_FISCAL' ? '#475569' : (!podeAlternarModoFiscal ? '#f1f5f9' : '#f8fafc'),
                                            borderColor: modoEmissao === 'NAO_FISCAL' ? '#475569' : '#e2e8f0',
                                            color: modoEmissao === 'NAO_FISCAL' ? '#ffffff' : (!podeAlternarModoFiscal ? '#94a3b8' : '#0f172a'),
                                            cursor: !podeAlternarModoFiscal ? 'not-allowed' : 'pointer'
                                        }}
                                        title={!podeAlternarModoFiscal ? 'Apenas gerentes/administradores podem alterar para Não Fiscal' : 'Emissão de Recibo Interno'}
                                    >
                                        {!podeAlternarModoFiscal ? <Lock size={16} className="text-muted" /> : <Receipt size={18} />}
                                        <span>Não Fiscal (Recibo)</span>
                                    </button>
                                </div>
                                <div className="col-4">
                                    <button
                                        type="button"
                                        onClick={() => handleSelecionarModoEmissao('NFE')}
                                        className={`btn w-100 py-2 px-3 rounded-4 border d-flex align-items-center justify-content-center gap-2 fw-bold transition-all ${
                                            modoEmissao === 'NFE'
                                                ? 'btn-primary text-white border-primary shadow-sm'
                                                : ''
                                        }`}
                                        style={{
                                            fontSize: '12.5px',
                                            backgroundColor: modoEmissao === 'NFE' ? '#2563eb' : '#f8fafc',
                                            borderColor: modoEmissao === 'NFE' ? '#2563eb' : '#e2e8f0',
                                            color: modoEmissao === 'NFE' ? '#ffffff' : '#0f172a'
                                        }}
                                    >
                                        <FileText size={18} />
                                        <span>NF-e (Mod. 55)</span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* 2. MODALIDADE: PAGAMENTO ÚNICO vs MÚLTIPLAS FORMAS (DIVIDIR) */}
                        <div className="d-flex align-items-center justify-content-between p-2 mb-3 rounded-4 bg-light border shadow-xs">
                            <div className="d-flex align-items-center gap-2">
                                <Wallet size={18} className="text-primary ms-2" />
                                <span className="small fw-bold text-dark">Modalidade:</span>
                            </div>
                            <div className="btn-group btn-group-sm" role="group">
                                <button
                                    type="button"
                                    onClick={() => setTipoPagamento('UNICO')}
                                    className={`btn rounded-start-pill px-3 py-1 fw-bold ${
                                        tipoPagamento === 'UNICO' ? 'btn-primary shadow-sm' : 'btn-outline-secondary'
                                    }`}
                                >
                                    Pagamento Único
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setTipoPagamento('MULTIPLO');
                                        const rest = Math.max(0, Number((totalLiquido - totalPagoMultiplo).toFixed(2)));
                                        setValorParcialInput(rest > 0 ? String(rest) : '');
                                    }}
                                    className={`btn rounded-end-pill px-3 py-1 fw-bold ${
                                        tipoPagamento === 'MULTIPLO' ? 'btn-primary shadow-sm' : 'btn-outline-secondary'
                                    }`}
                                >
                                    <Sparkles size={14} className="me-1" />
                                    Dividir / Múltiplas Formas
                                </button>
                            </div>
                        </div>

                        {/* SE MODALIDADE MÚLTIPLA: CAIXA DE LANÇAMENTO E LISTA DE FORMAS */}
                        {tipoPagamento === 'MULTIPLO' && (
                            <div className="p-3 rounded-4 border shadow-sm mb-3" style={{ backgroundColor: '#f8fafc', borderColor: '#e2e8f0' }}>
                                <div className="d-flex justify-content-between align-items-center mb-2">
                                    <label className="d-block fw-bold text-uppercase mb-0" style={{ color: '#475569', fontSize: '11px' }}>
                                        Lançar Valor para: <span className="text-primary">{formaSelecionada?.descricao || 'Selecione abaixo'}</span>
                                    </label>
                                    <Badge bg={saldoRestanteMultiplo === 0 ? 'success' : 'warning'} className="rounded-pill px-2.5 py-1">
                                        {saldoRestanteMultiplo === 0 ? '✓ Total Coberto' : `Faltam ${formatBRL(saldoRestanteMultiplo)}`}
                                    </Badge>
                                </div>

                                <div className="input-group border rounded-4 overflow-hidden mb-2" style={{ borderColor: '#cbd5e1', backgroundColor: '#ffffff' }}>
                                    <span className="input-group-text border-0 fw-bold" style={{ backgroundColor: '#f1f5f9', color: '#475569' }}>
                                        R$
                                    </span>
                                    <input
                                        type="number"
                                        step="0.01"
                                        inputMode="decimal"
                                        className="form-control border-0 fw-bolder text-primary"
                                        style={{ fontSize: '1.25rem', padding: '6px 12px', boxShadow: 'none' }}
                                        placeholder={saldoRestanteMultiplo > 0 ? saldoRestanteMultiplo.toFixed(2) : '0,00'}
                                        value={valorParcialInput}
                                        onChange={(e) => setValorParcialInput(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                handleAdicionarPagamentoParcial();
                                            }
                                        }}
                                    />
                                    <button
                                        type="button"
                                        onClick={handleAdicionarPagamentoParcial}
                                        className="btn btn-primary fw-bold px-3 d-flex align-items-center gap-1"
                                        title="Adicionar forma de pagamento"
                                    >
                                        <Plus size={18} /> Adicionar
                                    </button>
                                </div>

                                {/* Lista de formas adicionadas */}
                                {pagamentosMultiplos.length > 0 ? (
                                    <div className="mt-2">
                                        <span className="d-block small fw-bold text-secondary text-uppercase mb-1" style={{ fontSize: '10px' }}>
                                            Formas de Pagamento Lançadas:
                                        </span>
                                        <div className="d-flex flex-column gap-1">
                                            {pagamentosMultiplos.map((p) => {
                                                const IconP = getIconeForma(p.codigo_sefaz);
                                                return (
                                                    <div key={p.id} className="d-flex align-items-center justify-content-between p-2 rounded-3 bg-white border shadow-xs">
                                                        <div className="d-flex align-items-center gap-2">
                                                            <IconP size={16} className="text-primary" />
                                                            <span className="fw-bold small text-dark">{p.descricao}</span>
                                                            <span className="badge bg-light text-muted border font-monospace" style={{ fontSize: '9px' }}>
                                                                Cód. {p.codigo_sefaz}
                                                            </span>
                                                        </div>
                                                        <div className="d-flex align-items-center gap-2">
                                                            <span className="fw-bolder text-success fs-6">{formatBRL(p.valor)}</span>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleRemoverPagamentoParcial(p.id)}
                                                                className="btn btn-sm btn-outline-danger p-1 rounded-circle d-flex align-items-center justify-content-center"
                                                                style={{ width: '26px', height: '26px' }}
                                                                title="Remover"
                                                            >
                                                                <Trash2 size={13} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        <div className="d-flex justify-content-between align-items-center mt-2 pt-2 border-top">
                                            <span className="small text-muted">
                                                Total Lançado: <strong className="text-dark">{formatBRL(totalPagoMultiplo)}</strong>
                                            </span>
                                            {trocoMultiplo > 0 ? (
                                                <span className="small fw-bold text-warning-emphasis">
                                                    Troco: {formatBRL(trocoMultiplo)}
                                                </span>
                                            ) : (
                                                <span className={`small fw-bold ${saldoRestanteMultiplo > 0 ? 'text-danger' : 'text-success'}`}>
                                                    {saldoRestanteMultiplo > 0 ? `Faltam ${formatBRL(saldoRestanteMultiplo)}` : '✓ Pagamento Completo'}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <small className="text-muted d-block mt-1">
                                        Nenhuma forma lançada. Escolha a forma abaixo, digite o valor e clique em <strong>Adicionar</strong>.
                                    </small>
                                )}
                            </div>
                        )}

                        {/* 3. FORMAS DE PAGAMENTO SEFAZ */}
                        <div className="mb-3">
                            <div className="d-flex justify-content-between align-items-center mb-2">
                                <label className="small fw-bold text-uppercase m-0" style={{ color: '#475569', fontSize: '11px', letterSpacing: '0.5px' }}>
                                    {tipoPagamento === 'MULTIPLO' ? 'Selecione a Forma para Adicionar:' : `Formas de Pagamento SEFAZ (Teclas 1 a ${Math.min(9, formasSefaz.length)})`}
                                </label>
                                {loadingFormas && <Spinner size="sm" animation="border" className="text-primary" />}
                            </div>

                            <div className="row g-2">
                                {formasSefaz.map((forma, idx) => {
                                    const Icon = getIconeForma(forma.codigo_sefaz);
                                    const active = formaSelecionada?.id === forma.id || (!formaSelecionada && idx === 0);
                                    return (
                                        <div className="col-6 col-sm-4 col-md-3" key={forma.id || idx}>
                                            <button
                                                type="button"
                                                onClick={() => handleSelecionarForma(forma)}
                                                className="btn w-100 py-3 rounded-4 d-flex flex-column align-items-center gap-1 shadow-sm border transition-all text-center position-relative"
                                                style={{
                                                    backgroundColor: active ? '#2563eb' : '#f8fafc',
                                                    borderColor: active ? '#2563eb' : '#e2e8f0',
                                                    color: active ? '#ffffff' : '#0f172a'
                                                }}
                                            >
                                                {/* Badge do atalho numérico */}
                                                {idx < 9 && (
                                                    <span
                                                        className="position-absolute top-0 start-0 m-1 badge rounded-pill"
                                                        style={{
                                                            fontSize: '9px',
                                                            backgroundColor: active ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.08)',
                                                            color: active ? '#ffffff' : '#475569'
                                                        }}
                                                    >
                                                        {idx + 1}
                                                    </span>
                                                )}

                                                <Icon size={22} className={active ? 'text-white' : 'text-primary'} />
                                                <span className="fw-bold text-truncate w-100 px-1" style={{ fontSize: '12px' }}>
                                                    {forma.descricao}
                                                </span>
                                                <small
                                                    className="font-monospace text-uppercase"
                                                    style={{
                                                        fontSize: '9.5px',
                                                        opacity: active ? 0.9 : 0.6
                                                    }}
                                                >
                                                    Cód. {forma.codigo_sefaz}
                                                </small>
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* 4. VALOR RECEBIDO E CÉDULAS RÁPIDAS (PARA PAGAMENTO ÚNICO EM DINHEIRO) */}
                        {tipoPagamento === 'UNICO' && method === 'DINHEIRO' && (
                            <div
                                className="p-3 rounded-4 border shadow-sm mb-3"
                                style={{ backgroundColor: '#f8fafc', borderColor: '#e2e8f0' }}
                            >
                                <div className="row g-3 align-items-center">
                                    <div className="col-md-7">
                                        <label className="d-block fw-bold text-uppercase mb-1" style={{ color: '#475569', fontSize: '10.5px' }}>
                                            Valor Recebido em Dinheiro (R$)
                                        </label>
                                        <div className="input-group border rounded-4 overflow-hidden" style={{ borderColor: '#cbd5e1', backgroundColor: '#ffffff' }}>
                                            <span className="input-group-text border-0 fw-bold" style={{ backgroundColor: '#f1f5f9', color: '#475569' }}>
                                                R$
                                            </span>
                                            <input
                                                type="number"
                                                inputMode="decimal"
                                                className="form-control border-0 fw-bolder text-primary"
                                                style={{ fontSize: '1.4rem', padding: '8px 12px', boxShadow: 'none', backgroundColor: '#ffffff' }}
                                                autoFocus
                                                placeholder={totalLiquido.toFixed(2)}
                                                value={recebido}
                                                onChange={(e) => setRecebido(e.target.value)}
                                            />
                                        </div>

                                        {/* Botões de cédulas rápidas */}
                                        <div className="d-flex flex-wrap gap-1 mt-2">
                                            <button
                                                type="button"
                                                onClick={() => setRecebido(String(totalLiquido.toFixed(2)))}
                                                className="btn btn-sm btn-outline-primary rounded-pill px-2 py-0 fw-bold"
                                                style={{ fontSize: '11px' }}
                                            >
                                                Valor Exato
                                            </button>
                                            {cedulasRapidas.map((val) => (
                                                <button
                                                    key={val}
                                                    type="button"
                                                    onClick={() => setRecebido(String(val))}
                                                    className="btn btn-sm btn-light border rounded-pill px-2 py-0 fw-semibold"
                                                    style={{ fontSize: '11px', backgroundColor: '#ffffff', borderColor: '#cbd5e1' }}
                                                >
                                                    R$ {val}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="col-md-5 text-md-end border-start-md ps-md-3">
                                        <span className="fw-bold text-uppercase d-block" style={{ color: '#475569', fontSize: '11px' }}>
                                            Troco a Devolver
                                        </span>
                                        <span className={`h3 mb-0 fw-bolder ${troco < 0 ? 'text-danger' : 'text-success'}`}>
                                            {formatBRL(Math.max(0, troco))}
                                        </span>
                                        {troco < 0 && (
                                            <small className="d-block text-danger fw-semibold" style={{ fontSize: '11px' }}>
                                                Faltam {formatBRL(Math.abs(troco))}
                                            </small>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* 4. DESCONTO E CPF NA NOTA */}
                        <div className="row g-2">
                            <div className="col-md-6">
                                <label className="form-label small fw-bold mb-1" style={{ color: '#475569', fontSize: '11px' }}>
                                    CPF / CNPJ na Nota (Opcional)
                                </label>
                                <input
                                    type="text"
                                    className="form-control rounded-3"
                                    style={{ borderColor: '#cbd5e1', fontSize: '13px', backgroundColor: '#ffffff' }}
                                    placeholder="Digite somente números..."
                                    value={cpfCnpjNota}
                                    onChange={(e) => onChangeCpfCnpjNota && onChangeCpfCnpjNota(e.target.value.replace(/\D/g, '').slice(0, 14))}
                                />
                            </div>
                            <div className="col-md-6">
                                <label className="form-label small fw-bold mb-1" style={{ color: '#475569', fontSize: '11px' }}>
                                    Desconto na Venda (R$)
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    className="form-control rounded-3"
                                    style={{ borderColor: '#cbd5e1', fontSize: '13px', backgroundColor: '#ffffff' }}
                                    placeholder="0,00"
                                    value={desconto}
                                    onChange={(e) => setDesconto(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Rodapé */}
                    <div
                        className="p-3 px-4 border-top d-flex justify-content-between align-items-center gap-3"
                        style={{ backgroundColor: '#f8fafc', borderColor: '#e2e8f0' }}
                    >
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={loading}
                            className="btn btn-light btn-lg px-4 py-2 rounded-4 fw-bold border shadow-sm"
                            style={{
                                fontSize: '14px',
                                backgroundColor: '#ffffff',
                                color: '#475569',
                                borderColor: '#cbd5e1'
                            }}
                        >
                            Cancelar (Esc)
                        </button>

                        <button
                            type="button"
                            onClick={handleConfirm}
                            disabled={loading || (tipoPagamento === 'MULTIPLO' && totalPagoMultiplo < totalLiquido)}
                            className={`btn btn-lg flex-grow-1 py-2 rounded-4 fw-bold shadow border-0 d-flex align-items-center justify-content-center gap-2 ${
                                tipoPagamento === 'MULTIPLO' && totalPagoMultiplo < totalLiquido
                                    ? 'btn-secondary text-white-50'
                                    : (modoEmissao !== 'NAO_FISCAL' ? 'btn-success' : 'btn-primary')
                            }`}
                            style={{ fontSize: '15px' }}
                        >
                            {loading ? (
                                <>
                                    <Spinner size="sm" />
                                    <span>{modoEmissao !== 'NAO_FISCAL' ? 'Transmitindo para SEFAZ...' : 'Registrando Venda...'}</span>
                                </>
                            ) : (
                                <>
                                    {tipoPagamento === 'MULTIPLO' && totalPagoMultiplo < totalLiquido ? (
                                        <>
                                            <AlertTriangle size={20} className="text-warning" />
                                            <span>Faltam {formatBRL(saldoRestanteMultiplo)} para Finalizar</span>
                                        </>
                                    ) : (
                                        <>
                                            {modoEmissao !== 'NAO_FISCAL' ? <ShieldCheck size={20} /> : <Sparkles size={20} />}
                                            <span>
                                                {modoEmissao === 'NFCE'
                                                    ? 'Confirmar e Emitir NFC-e (Enter)'
                                                    : modoEmissao === 'NFE'
                                                    ? 'Confirmar e Emitir NF-e (Enter)'
                                                    : 'Confirmar Venda Não Fiscal (Enter)'}
                                            </span>
                                        </>
                                    )}
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            <style>{`
                input[type=number]::-webkit-inner-spin-button, input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
                input[type=number] { -moz-appearance: textfield; }
                @media print {
                    @page { size: 80mm auto; margin: 0; }
                    body * { visibility: hidden; }
                    #pdv-thermal-receipt, #pdv-thermal-receipt * { visibility: visible; }
                    #pdv-thermal-receipt { position: absolute; left: 0; top: 0; width: 80mm; padding: 4mm; background: #fff !important; }
                }
            `}</style>
        </div>
    );
}
