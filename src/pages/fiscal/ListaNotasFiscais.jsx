import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import VisualizadorNotaModal from '../../components/VisualizadorNotaModal'; // Ajuste o import conforme o caminho

export default function ListaNotasFiscais() {
    const [notas, setNotas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [notaSelecionada, setNotaSelecionada] = useState(null);

    useEffect(() => {
        carregarNotas();
    }, []);

    const carregarNotas = async () => {
        setLoading(true);
        try {
            // 🟢 CORRIGIDO: Agora aponta para a rota correta de Saída (ou você pode trocar para /fiscal/entrada se for a tela de compras)
            const { data } = await api.get('/fiscal/saida');
            setNotas(data);
        } catch (error) {
            console.error("Erro ao buscar notas", error);
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

    return (
        <div className="container mt-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2>Histórico de Notas Fiscais (Saída)</h2>
                <button className="btn btn-outline-secondary" onClick={carregarNotas}>Atualizar</button>
            </div>

            <div className="card shadow-sm">
                <div className="card-body p-0">
                    <div className="table-responsive">
                        <table className="table table-hover table-striped mb-0 text-center align-middle">
                            <thead className="table-light">
                                <tr>
                                    <th>ID</th>
                                    <th>Pedido</th>
                                    <th>Tipo</th>
                                    <th>Número/Série</th>
                                    <th>Status</th>
                                    <th>Valor</th>
                                    <th>Data</th>
                                    <th>Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading && <tr><td colSpan="8" className="py-4">Carregando...</td></tr>}
                                {!loading && notas.length === 0 && <tr><td colSpan="8" className="py-4">Nenhuma nota encontrada.</td></tr>}
                                
                                {notas.map(nota => (
                                    <tr key={nota.id_nota}>
                                        <td>#{nota.id_nota}</td>
                                        <td><a href={`/admin/order/${nota.id_pedido}`}>#{nota.id_pedido}</a></td>
                                        <td><span className="badge bg-secondary">{nota.tipo_nota}</span></td>
                                        <td>{nota.numero_nota ? `${nota.numero_nota} / ${nota.serie}` : '-'}</td>
                                        <td>
                                            <span className={`badge ${nota.status === 'AUTORIZADA' ? 'bg-success' : 'bg-warning text-dark'}`}>
                                                {nota.status}
                                            </span>
                                        </td>
                                        <td>{formatarMoeda(nota.valor_total)}</td>
                                        <td>{new Date(nota.data_emissao).toLocaleDateString('pt-BR')}</td>
                                        <td>
                                            <button 
                                                className={`btn btn-sm ${nota.status === 'AUTORIZADA' ? 'btn-primary' : 'btn-outline-secondary'}`} 
                                                onClick={() => abrirNota(nota)}
                                            >
                                                {nota.status === 'AUTORIZADA' ? 'Visualizar' : 'Ver Detalhes'}
                                            </button>
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