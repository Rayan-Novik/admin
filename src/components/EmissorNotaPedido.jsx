import React, { useState } from 'react';
import api from '../services/api'; // Ajuste o caminho se necessário

export default function EmissorNotaPedido({ idPedido, notaInicial }) {
    // 🟢 Agora o estado é um Array. Aceita múltiplas notas pro mesmo pedido.
    const [notas, setNotas] = useState(
        notaInicial ? (Array.isArray(notaInicial) ? notaInicial : [notaInicial]) : []
    );
    const [loading, setLoading] = useState(false);
    const [erro, setErro] = useState('');

    const gerarRascunho = async (tipoNota) => {
        setLoading(true);
        setErro('');
        try {
            // 🟢 ATUALIZADO: Aponta para a nova rota de saída
            const { data } = await api.post('/fiscal/saida/rascunho', {
                id_pedido: idPedido,
                tipo_nota: tipoNota
            });
            // Adiciona a nova nota na lista sem apagar as antigas
            setNotas(prev => [...prev, data.nota]);
        } catch (err) {
            setErro(err.response?.data?.message || 'Erro ao gerar rascunho.');
        } finally {
            setLoading(false);
        }
    };

    const emitirSefaz = async (notaAlvo) => {
        setLoading(true);
        setErro('');
        try {
            // 🟢 MUDOU AQUI: Tiramos a palavra "simular" da rota!
            const { data } = await api.post(`/fiscal/saida/${notaAlvo.id_nota}/emitir`);
            
            setNotas(prev => prev.map(n => n.id_nota === notaAlvo.id_nota ? data.nota : n));
        } catch (err) {
            setErro(err.response?.data?.message || 'Erro ao emitir nota.');
        } finally {
            setLoading(false);
        }
    };

    const baixarPDF = (notaAlvo) => {
        if (notaAlvo.tipo_nota === 'NFCE') {
            window.open(`/admin/nfce/${notaAlvo.id_nota}`, '_blank');
        } else {
            window.open(`/admin/danfe/${notaAlvo.id_nota}`, '_blank');
        }
    };

    // ==========================================
    // LÓGICA DE EXIBIÇÃO DOS BOTÕES
    // ==========================================
    const tiposGerados = notas.map(n => n.tipo_nota);
    // Se gerou NFE ou NFCE, oculta os botões de produto
    const temNotaProduto = tiposGerados.includes('NFE') || tiposGerados.includes('NFCE');
    // Se gerou NFSE, oculta o botão de serviço
    const temNotaServico = tiposGerados.includes('NFSE');

    return (
        <div className="card border-secondary mb-4">
            <div className="card-header bg-light d-flex justify-content-between align-items-center">
                <strong>Módulo Fiscal</strong>
                <span className="badge bg-secondary">{notas.length} doc(s)</span>
            </div>
            <div className="card-body">
                {erro && <div className="alert alert-danger py-2">{erro}</div>}

                {/* 🟢 SESSÃO 1: LISTA DE NOTAS JÁ GERADAS */}
                {notas.length > 0 && (
                    <div className="mb-4">
                        <h6 className="fw-bold text-muted border-bottom pb-2 mb-3">Documentos Fiscais do Pedido</h6>
                        {notas.map(nota => (
                            <div key={nota.id_nota} className="border rounded p-3 mb-3 bg-light shadow-sm">
                                <div className="d-flex justify-content-between align-items-start mb-2">
                                    <div>
                                        <p className="mb-1"><strong>Tipo:</strong> <span className="badge bg-secondary">{nota.tipo_nota}</span></p>
                                        <p className="mb-1"><strong>Número/Série:</strong> {nota.numero_nota} / {nota.serie}</p>
                                        {nota.chave_acesso && <p className="mb-1 text-break" style={{fontSize: '12px'}}><strong>Chave:</strong> {nota.chave_acesso}</p>}
                                    </div>
                                    <span className={`badge ${nota.status === 'AUTORIZADA' ? 'bg-success' : 'bg-warning text-dark'}`}>
                                        {nota.status}
                                    </span>
                                </div>
                                <p className="mb-3 text-muted small"><em>{nota.motivo_status}</em></p>

                                <div className="d-flex gap-2">
                                    {nota.status === 'RASCUNHO' && (
                                        <button className="btn btn-success btn-sm w-100 fw-bold" onClick={() => emitirSefaz(nota)} disabled={loading}>
                                            {loading ? 'Transmitindo...' : 'Transmitir para SEFAZ'}
                                        </button>
                                    )}
                                    {nota.status === 'AUTORIZADA' && (
                                        <button className="btn btn-primary btn-sm w-100 fw-bold" onClick={() => baixarPDF(nota)}>
                                            📄 Baixar PDF ({nota.tipo_nota})
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* 🟢 SESSÃO 2: BOTÕES PARA GERAR (Somente o que falta) */}
                {(!temNotaProduto || !temNotaServico) && (
                    <div>
                        <p className="text-muted small mb-2">
                            {notas.length === 0 ? "Este pedido ainda não possui documento fiscal." : "Gerar documentos adicionais para este pedido:"}
                        </p>
                        <div className="d-flex gap-2 flex-wrap">
                            
                            {/* Oculta ambos se já existir nota de Produto */}
                            {!temNotaProduto && (
                                <>
                                    <button className="btn btn-outline-primary btn-sm" onClick={() => gerarRascunho('NFCE')} disabled={loading}>
                                        Gerar NFC-e (Cupom)
                                    </button>
                                    <button className="btn btn-outline-secondary btn-sm" onClick={() => gerarRascunho('NFE')} disabled={loading}>
                                        Gerar NF-e (Produto)
                                    </button>
                                </>
                            )}
                            
                            {/* Oculta se já existir nota de Serviço */}
                            {!temNotaServico && (
                                <button className="btn btn-outline-info btn-sm" onClick={() => gerarRascunho('NFSE')} disabled={loading}>
                                    Gerar NFS-e (Serviço)
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}