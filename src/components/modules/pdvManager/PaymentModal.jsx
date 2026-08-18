import React, { useState, useEffect } from 'react';
import { realizarVenda, gerarRascunhoFiscalPdv, emitirNotaFiscalPdv } from './pdvService';
import { CreditCard, Banknote, QrCode, Info, CheckCircle, Receipt, FileText, Briefcase } from 'lucide-react';
import { Spinner } from 'react-bootstrap';

export default function PaymentModal({ isOpen, cart, total, onClose, onFinishSuccess }) {
    const [method, setMethod] = useState('DINHEIRO');
    const [recebido, setRecebido] = useState('');
    const [troco, setTroco] = useState(0);
    const [loading, setLoading] = useState(false);
    
    // 🟢 Estados da Pós-Venda (Fiscal)
    const [vendaFinalizada, setVendaFinalizada] = useState(null); 
    const [statusFiscal, setStatusFiscal] = useState(null); 
    const [notaFiscalId, setNotaFiscalId] = useState(null);
    const [notaFiscalTipo, setNotaFiscalTipo] = useState(null); // Guarda qual foi o tipo escolhido

    useEffect(() => {
        if (isOpen) { 
            setMethod('DINHEIRO'); 
            setRecebido(''); 
            setTroco(0); 
            setVendaFinalizada(null);
            setStatusFiscal(null);
            setNotaFiscalId(null);
            setNotaFiscalTipo(null);
        }
    }, [isOpen]);

    useEffect(() => {
        if (method === 'DINHEIRO' && recebido) setTroco(Number(recebido) - total);
        else setTroco(0);
    }, [recebido, method, total]);

    if (!isOpen) return null;

    // ========================================================
    // LÓGICA DE PAGAMENTO
    // ========================================================
    const handleConfirm = async () => {
        if (method === 'DINHEIRO' && Number(recebido) < total) {
            alert('Valor recebido é menor que o total!'); return;
        }

        setLoading(true);
        try {
            const payload = {
                itens: cart.map(item => ({ id_produto: item.id_produto, quantidade: item.quantidade })),
                metodo_pagamento: method,
                valor_recebido: method === 'DINHEIRO' ? Number(recebido) : total
            };
            const result = await realizarVenda(payload);
            
            setVendaFinalizada(result.pedido); 
        } catch (error) {
            alert(error.response?.data?.message || 'Erro ao finalizar venda');
        } finally { setLoading(false); }
    };

    // ========================================================
    // LÓGICA FISCAL PÓS-VENDA (DINÂMICA PARA QUALQUER NOTA)
    // ========================================================
    const handleEmitirNota = async (tipo) => {
        if (!vendaFinalizada) return;
        
        try {
            setStatusFiscal('gerando');
            setNotaFiscalTipo(tipo);
            
            // Passo 1: Rascunho
            const rascunho = await gerarRascunhoFiscalPdv(vendaFinalizada.id_pedido, tipo);
            setNotaFiscalId(rascunho.nota.id_nota);
            
            setStatusFiscal('transmitindo');
            // Passo 2: Transmitir
            await emitirNotaFiscalPdv(rascunho.nota.id_nota);
            
            setStatusFiscal('autorizada');
        } catch (error) {
            alert(`Erro ao emitir ${tipo}: ` + (error.response?.data?.message || error.message));
            setStatusFiscal(null);
            setNotaFiscalTipo(null);
        }
    };

    const handleImprimirNota = () => {
        if (notaFiscalId) {
            if (notaFiscalTipo === 'NFCE') {
                window.open(`/admin/nfce/${notaFiscalId}`, '_blank');
            } else {
                // NF-e e NFS-e abrem no visualizador de A4/DANFE
                window.open(`/admin/danfe/${notaFiscalId}`, '_blank');
            }
        }
    };

    const fecharTudo = () => {
        onFinishSuccess({ pedido: vendaFinalizada }); 
    };

    // ========================================================
    // TELA 2: SUCESSO E EMISSÃO FISCAL
    // ========================================================
    if (vendaFinalizada) {
        return (
            <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }} tabIndex="-1">
                <div className="modal-dialog modal-dialog-centered">
                    <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden modal-dark-fix text-center p-4">
                        <CheckCircle size={80} className="text-success mx-auto mb-3" />
                        <h4 className="fw-bold" style={{ color: 'var(--text-primary)' }}>Venda Finalizada!</h4>
                        <p className="text-muted mb-4">Pedido #{vendaFinalizada.id_pedido} registrado com sucesso.</p>

                        <div className="d-flex flex-column gap-3 mt-2">
                            
                            {/* 🟢 BLOCO FISCAL: TODAS AS OPÇÕES */}
                            {statusFiscal === null && (
                                <div className="d-flex flex-column gap-2">
                                    <p className="text-muted small mb-1">Selecione o documento fiscal:</p>
                                    <button onClick={() => handleEmitirNota('NFCE')} className="btn btn-primary btn-lg rounded-4 fw-bold shadow-sm d-flex align-items-center justify-content-center gap-2">
                                        <Receipt size={24} /> Cupom NFC-e
                                    </button>
                                    
                                    <div className="d-flex gap-2">
                                        <button onClick={() => handleEmitirNota('NFE')} className="btn btn-outline-secondary w-50 rounded-4 fw-bold shadow-sm d-flex align-items-center justify-content-center gap-2">
                                            <FileText size={18} /> NF-e (A4)
                                        </button>
                                        <button onClick={() => handleEmitirNota('NFSE')} className="btn btn-outline-info w-50 rounded-4 fw-bold shadow-sm d-flex align-items-center justify-content-center gap-2">
                                            <Briefcase size={18} /> NFS-e
                                        </button>
                                    </div>
                                </div>
                            )}

                            {(statusFiscal === 'gerando' || statusFiscal === 'transmitindo') && (
                                <button disabled className="btn btn-primary btn-lg rounded-4 fw-bold shadow-sm">
                                    <Spinner size="sm" className="me-2"/> Transmitindo para SEFAZ...
                                </button>
                            )}

                            {statusFiscal === 'autorizada' && (
                                <button onClick={handleImprimirNota} className="btn btn-success btn-lg rounded-4 fw-bold shadow-sm d-flex align-items-center justify-content-center gap-2">
                                    <Receipt size={24} /> Imprimir {notaFiscalTipo}
                                </button>
                            )}

                            {/* Botão de Fechar */}
                            <button onClick={fecharTudo} className="btn btn-light btn-lg rounded-4 fw-bold border mt-2" style={{ backgroundColor: 'var(--bg-sidebar)', color: 'var(--text-primary)' }}>
                                {statusFiscal === 'autorizada' ? 'Nova Venda' : 'Pular Emissão (Nova Venda)'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ========================================================
    // TELA 1: PAGAMENTO NORMAL (Permanece igual)
    // ========================================================
    return (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }} tabIndex="-1">
            <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable">
                <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden modal-dark-fix">
                    
                    <div className="p-4 d-flex justify-content-between align-items-center" style={{ backgroundColor: 'var(--bg-main)', borderBottom: '1px solid var(--border-color)' }}>
                        <div>
                            <h5 className="fw-bold mb-1" style={{ color: 'var(--text-primary)' }}>Pagamento</h5>
                            <span className="small fw-semibold text-uppercase" style={{ color: 'var(--text-secondary)', fontSize: '10px', letterSpacing: '0.5px' }}>Total do Cupom</span>
                        </div>
                        <div className="text-end">
                            <h3 className="mb-0 fw-bolder text-primary">R$ {total.toFixed(2)}</h3>
                        </div>
                    </div>

                    <div className="modal-body p-4" style={{ backgroundColor: 'var(--bg-sidebar)' }}>
                        <label className="d-block small fw-bold text-uppercase mb-3" style={{ color: 'var(--text-secondary)', fontSize: '11px', letterSpacing: '0.5px' }}>1. Selecione o Meio</label>
                        
                        <div className="row g-2 mb-4">
                            <div className="col-4">
                                <button onClick={() => setMethod('DINHEIRO')} className={`btn w-100 py-3 rounded-4 d-flex flex-column align-items-center gap-2 shadow-sm border transition-all ${method === 'DINHEIRO' ? 'btn-primary border-primary' : 'bg-transparent'}`} style={{ borderColor: method === 'DINHEIRO' ? '' : 'var(--border-color)', color: method === 'DINHEIRO' ? '#fff' : 'var(--text-primary)' }}>
                                    <Banknote size={26} /> <span className="fw-bold" style={{ fontSize: '11px' }}>Dinheiro</span>
                                </button>
                            </div>
                            <div className="col-4">
                                <button onClick={() => setMethod('PIX')} className={`btn w-100 py-3 rounded-4 d-flex flex-column align-items-center gap-2 shadow-sm border transition-all ${method === 'PIX' ? 'btn-primary border-primary' : 'bg-transparent'}`} style={{ borderColor: method === 'PIX' ? '' : 'var(--border-color)', color: method === 'PIX' ? '#fff' : 'var(--text-primary)' }}>
                                    <QrCode size={26} /> <span className="fw-bold" style={{ fontSize: '11px' }}>Pix</span>
                                </button>
                            </div>
                            <div className="col-4">
                                <button onClick={() => setMethod('CARTAO_CREDITO')} className={`btn w-100 py-3 rounded-4 d-flex flex-column align-items-center gap-2 shadow-sm border transition-all ${method === 'CARTAO_CREDITO' ? 'btn-primary border-primary' : 'bg-transparent'}`} style={{ borderColor: method === 'CARTAO_CREDITO' ? '' : 'var(--border-color)', color: method === 'CARTAO_CREDITO' ? '#fff' : 'var(--text-primary)' }}>
                                    <CreditCard size={26} /> <span className="fw-bold" style={{ fontSize: '11px' }}>Cartão</span>
                                </button>
                            </div>
                        </div>

                        {method === 'DINHEIRO' && (
                            <div className="p-4 rounded-4 border shadow-sm mb-4" style={{ backgroundColor: 'var(--bg-main)', borderColor: 'var(--border-color)' }}>
                                <label className="d-block fw-bold text-uppercase mb-2" style={{ color: 'var(--text-secondary)', fontSize: '11px' }}>2. Valor Recebido (R$)</label>
                                <div className="input-group input-group-lg border rounded-4 overflow-hidden mb-4" style={{ borderColor: 'var(--border-color)' }}>
                                    <span className="input-group-text border-0 fw-bold" style={{ backgroundColor: 'var(--bg-sidebar)', color: 'var(--text-secondary)' }}>R$</span>
                                    <input type="number" inputMode="decimal" className="form-control form-dark-input border-0 fw-bolder text-primary" style={{ fontSize: '1.8rem', padding: '12px', boxShadow: 'none' }} autoFocus placeholder="0,00" value={recebido} onChange={(e) => setRecebido(e.target.value)} />
                                </div>
                                
                                <div className="d-flex justify-content-between align-items-center">
                                    <span className="fw-bold text-uppercase" style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>Troco a devolver:</span>
                                    <span className={`h3 mb-0 fw-bold ${troco < 0 ? 'text-danger' : 'text-success'}`}>R$ {troco.toFixed(2)}</span>
                                </div>
                            </div>
                        )}

                        {(method === 'PIX' || method === 'CARTAO_CREDITO') && (
                            <div className="p-3 rounded-4 border d-flex align-items-center gap-3 mb-4" style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', borderColor: 'rgba(245, 158, 11, 0.2)', color: '#d97706' }}>
                                <Info size={32} className="flex-shrink-0" />
                                <div className="small fw-semibold" style={{ fontSize: '12px', lineHeight: '1.4' }}>
                                    Confirme o recebimento na maquininha ou aplicativo do banco antes de prosseguir.
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="p-4 border-top" style={{ backgroundColor: 'var(--bg-main)', borderColor: 'var(--border-color)' }}>
                        <div className="row g-3">
                            <div className="col-6">
                                <button onClick={onClose} className="btn btn-light btn-lg w-100 py-3 rounded-4 fw-bold border shadow-sm" style={{ fontSize: '14px', backgroundColor: 'var(--bg-sidebar)', color: 'var(--text-primary)', borderColor: 'var(--border-color)' }}>
                                    Cancelar
                                </button>
                            </div>
                            <div className="col-6">
                                <button onClick={handleConfirm} disabled={loading} className="btn btn-success btn-lg w-100 py-3 rounded-4 fw-bold shadow border-0" style={{ fontSize: '14px' }}>
                                    {loading ? <Spinner size="sm" /> : 'Finalizar'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                .modal-dark-fix { background-color: var(--bg-sidebar); border-color: var(--border-color); }
                input[type=number]::-webkit-inner-spin-button, input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
                input[type=number] { -moz-appearance: textfield; }
                .form-dark-input { background-color: var(--bg-sidebar) !important; color: var(--text-primary) !important; }
            `}</style>
        </div>
    );
}