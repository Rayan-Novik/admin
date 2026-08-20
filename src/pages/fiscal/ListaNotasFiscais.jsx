import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import VisualizadorNotaModal from '../../components/VisualizadorNotaModal'; // Ajuste o import conforme o caminho
import { toast } from 'react-toastify'; // 🟢 Para mostrar os avisos bonitos na tela

export default function ListaNotasFiscais() {
    const [notas, setNotas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [notaSelecionada, setNotaSelecionada] = useState(null);
    const [transmitindo, setTransmitindo] = useState(null); // 🟢 Guarda qual nota está sendo enviada no momento

    useEffect(() => {
        carregarNotas();
    }, []);

    const carregarNotas = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/fiscal/saida');
            setNotas(data);
        } catch (error) {
            console.error("Erro ao buscar notas", error);
            toast.error("Erro ao carregar a lista de notas.");
        } finally {
            setLoading(false);
        }
    };

    const abrirNota = (nota) => {
        setNotaSelecionada(nota);
        setShowModal(true);
    };

    const formatarMoeda = (valor) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
    };

    // 🟢 NOVA FUNÇÃO: Dispara a rota de emissão no backend
    const transmitirSefaz = async (id_nota) => {
        setTransmitindo(id_nota);
        try {
            const { data } = await api.post(`/fiscal/saida/${id_nota}/emitir`);
            toast.success(data.message || "Nota autorizada com sucesso!");
            carregarNotas(); // 🟢 Recarrega a tabela para atualizar o status e a cor
        } catch (error) {
            const msgErro = error.response?.data?.message || "Erro ao conectar com a SEFAZ.";
            toast.error(`Falha: ${msgErro}`);
            carregarNotas(); // 🟢 Recarrega pra ver se o status mudou para ERRO ou REJEITADA
        } finally {
            setTransmitindo(null);
        }
    };

    return (
        <div className="container mt-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2>Histórico de Notas Fiscais (Saída)</h2>
                <button className="btn btn-outline-secondary" onClick={carregarNotas} disabled={loading}>
                    {loading ? 'Atualizando...' : 'Atualizar'}
                </button>
            </div>

            <div className="card shadow-sm border-0 rounded-3">
                <div className="card-body p-0">
                    <div className="table-responsive">
                        <table className="table table-hover table-striped mb-0 text-center align-middle">
                            <thead className="table-light">
                                <tr>
                                    <th>ID</th>
                                    <th>Pedido</th>
                                    <th>Tipo</th>
                                    <th>Número/Série</th>
                                    <th>Status SEFAZ</th>
                                    <th>Valor</th>
                                    <th>Data</th>
                                    <th>Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading && <tr><td colSpan="8" className="py-4"><span className="spinner-border spinner-border-sm text-primary me-2"></span>Carregando notas...</td></tr>}
                                {!loading && notas.length === 0 && <tr><td colSpan="8" className="py-4 text-muted">Nenhuma nota encontrada.</td></tr>}
                                
                                {notas.map(nota => (
                                    <tr key={nota.id_nota}>
                                        <td>#{nota.id_nota}</td>
                                        <td><a href={`/admin/order/${nota.id_pedido}`} className="fw-bold text-decoration-none">#{nota.id_pedido}</a></td>
                                        <td><span className="badge bg-secondary">{nota.tipo_nota}</span></td>
                                        <td className="fw-bold">{nota.numero_nota ? `${nota.numero_nota} / ${nota.serie}` : '-'}</td>
                                        <td>
                                            <span 
                                                className={`badge ${
                                                    nota.status === 'AUTORIZADA' ? 'bg-success' : 
                                                    nota.status === 'REJEITADA' ? 'bg-danger' : 
                                                    nota.status === 'ERRO_TRANSMISSAO' ? 'bg-dark' : 'bg-warning text-dark'
                                                }`}
                                                title={nota.motivo_status || 'Sem detalhes'}
                                                style={{ cursor: 'help' }}
                                            >
                                                {nota.status}
                                            </span>
                                            {/* Mostra um resuminho do motivo embaixo do badge se deu erro */}
                                            {(nota.status === 'REJEITADA' || nota.status === 'ERRO_TRANSMISSAO') && (
                                                <div className="small text-muted mt-1" style={{ fontSize: '11px', maxWidth: '150px', margin: '0 auto', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                    {nota.motivo_status}
                                                </div>
                                            )}
                                        </td>
                                        <td className="text-success fw-bold">{formatarMoeda(nota.valor_total)}</td>
                                        <td>{new Date(nota.data_emissao).toLocaleDateString('pt-BR')}</td>
                                        <td>
                                            <div className="d-flex justify-content-center gap-2">
                                                {/* 🟢 SE A NOTA NÃO ESTIVER AUTORIZADA, MOSTRA O BOTÃO DE TRANSMITIR */}
                                                {nota.status !== 'AUTORIZADA' && (
                                                    <button 
                                                        className="btn btn-sm btn-success fw-bold d-flex align-items-center" 
                                                        onClick={() => transmitirSefaz(nota.id_nota)}
                                                        disabled={transmitindo === nota.id_nota}
                                                    >
                                                        {transmitindo === nota.id_nota ? (
                                                            <><span className="spinner-border spinner-border-sm me-1"></span> Enviando...</>
                                                        ) : (
                                                            <><i className="bi bi-send-check me-1"></i> Transmitir</>
                                                        )}
                                                    </button>
                                                )}

                                                <button 
                                                    className={`btn btn-sm ${nota.status === 'AUTORIZADA' ? 'btn-primary fw-bold' : 'btn-outline-secondary'}`} 
                                                    onClick={() => abrirNota(nota)}
                                                    title="Ver Detalhes ou Imprimir"
                                                >
                                                    {nota.status === 'AUTORIZADA' ? (
                                                        <><i className="bi bi-printer me-1"></i> DANFE</>
                                                    ) : (
                                                        <i className="bi bi-eye"></i>
                                                    )}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Modal de Visualização */}
            <VisualizadorNotaModal 
                show={showModal} 
                onHide={() => setShowModal(false)} 
                nota={notaSelecionada} 
            />
        </div>
    );
}