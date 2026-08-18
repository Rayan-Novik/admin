import React, { useState, useEffect } from 'react';
import { adicionarMovimentacao } from './pdvService'; // O "mensageiro" que leva os dados ao banco
import { ArrowUpCircle, ArrowDownCircle, DollarSign, AlertTriangle } from 'lucide-react';

export default function MovimentacaoModal({ isOpen, tipoInicial, onClose, onSuccess }) {
    // 1. ESTADOS (A memória temporária do formulário)
    const [tipo, setTipo] = useState('ENTRADA'); // Guarda se é Suprimento ou Sangria
    const [valor, setValor] = useState('');      // Guarda o valor em dinheiro
    const [motivo, setMotivo] = useState('');    // Guarda a justificativa
    const [loading, setLoading] = useState(false); // Diz se o sistema está "pensando"

    // Limpa o formulário toda vez que você abre a janelinha
    useEffect(() => {
        if (isOpen) {
            setTipo(tipoInicial || 'ENTRADA');
            setValor('');
            setMotivo('');
        }
    }, [isOpen, tipoInicial]);

    if (!isOpen) return null;

    // 2. FUNÇÃO DE ENVIO (O que acontece ao clicar em Confirmar)
    const handleSubmit = async (e) => {
        e.preventDefault(); // Impede a página de recarregar
        
        if (Number(valor) <= 0) {
            alert("Ei! Você precisa digitar um valor maior que zero.");
            return;
        }

        setLoading(true);
        try {
            // Envia para o seu Backend (Prisma)
            await adicionarMovimentacao(tipo, valor, motivo);
            
            alert(`Sucesso! O sistema registrou a ${tipo === 'ENTRADA' ? 'entrada' : 'saída'} de R$ ${valor}`);
            
            onSuccess(); // Avisa a tela principal para atualizar o saldo exibido
            onClose();   // Fecha a janelinha
        } catch (error) {
            alert("Ops! Algo deu errado ao salvar no banco de dados.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
            <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
                    
                    {/* CABEÇALHO: Muda de cor conforme a operação (Verde para entrada, Vermelho para saída) */}
                    <div className={`modal-header border-0 p-4 text-white ${tipo === 'ENTRADA' ? 'bg-success' : 'bg-danger'}`}>
                        <h5 className="modal-title fw-bold d-flex align-items-center gap-2 text-uppercase">
                            {tipo === 'ENTRADA' ? <ArrowUpCircle size={28}/> : <ArrowDownCircle size={24}/>}
                            {tipo === 'ENTRADA' ? 'Suprimento (Colocar Dinheiro)' : 'Sangria (Retirar Dinheiro)'}
                        </h5>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className="modal-body p-4 bg-light">
                            
                            {/* AVISO VISUAL: Explica o que está acontecendo */}
                            <div className="alert alert-info border-0 shadow-sm rounded-3 small mb-4 d-flex align-items-center gap-2">
                                <DollarSign size={18}/>
                                <span>Esta ação altera o saldo físico da sua gaveta de dinheiro.</span>
                            </div>

                            {/* CAMPO DE VALOR */}
                            <div className="card border-0 shadow-sm rounded-3 p-3 mb-3">
                                <label className="form-label fw-bold text-muted small text-uppercase">Valor da Movimentação</label>
                                <div className="input-group input-group-lg">
                                    <span className="input-group-text bg-white border-end-0 fw-bold text-muted">R$</span>
                                    <input
                                        type="number" step="0.01" required autoFocus
                                        className="form-control border-start-0 ps-0 fw-bold text-primary"
                                        style={{ fontSize: '2rem' }}
                                        value={valor}
                                        onChange={(e) => setValor(e.target.value)}
                                        placeholder="0,00"
                                    />
                                </div>
                            </div>

                            {/* CAMPO DE MOTIVO: Fundamental para auditoria */}
                            <div className="px-1">
                                <label className="form-label fw-bold text-muted small text-uppercase">Justificativa (Por que está fazendo isso?)</label>
                                <textarea
                                    className="form-control border-0 shadow-sm rounded-3 p-3"
                                    rows="3" required
                                    value={motivo}
                                    onChange={(e) => setMotivo(e.target.value)}
                                    placeholder="Ex: Troco inicial do dia / Pagamento de fornecedor de gelo..."
                                />
                            </div>
                        </div>

                        {/* BOTÕES DE AÇÃO */}
                        <div className="modal-footer border-0 p-4 bg-white d-flex gap-2">
                            <button type="button" className="btn btn-light btn-lg flex-grow-1 rounded-3 fw-semibold text-muted border shadow-sm" onClick={onClose}>
                                CANCELAR
                            </button>
                            <button 
                                type="submit" 
                                disabled={loading}
                                className={`btn btn-lg flex-grow-1 fw-bold shadow-sm rounded-3 text-white ${tipo === 'ENTRADA' ? 'btn-success' : 'btn-danger'}`}
                            >
                                {loading ? 'Gravando...' : 'CONFIRMAR AGORA'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}