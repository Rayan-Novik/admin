import React, { useState } from 'react';
import { buscarCliente, cadastrarCliente } from './pdvService'; 
import { UserPlus, Search, UserCheck, ArrowLeft, Save, X } from 'lucide-react';

export default function ClienteModal({ isOpen, onClose, onSelectCliente }) {
    // Estados de Navegação
    const [view, setView] = useState('search'); // 'search' ou 'create'

    // Estados de Busca
    const [busca, setBusca] = useState('');
    const [resultado, setResultado] = useState([]);
    const [loading, setLoading] = useState(false);

    // Estados de Cadastro
    const [novoCliente, setNovoCliente] = useState({
        nome: '',
        cpf: '',
        email: '',
        telefone: ''
    });
    const [loadingCadastro, setLoadingCadastro] = useState(false);

    if (!isOpen) return null;

    // --- LÓGICA DE BUSCA ---
    const handleBuscar = async () => {
        if (!busca.trim()) return;
        setLoading(true);
        try {
            const data = await buscarCliente(busca);
            setResultado(data);
        } catch (error) {
            alert("Erro ao buscar cliente. Verifique a conexão.");
        } finally {
            setLoading(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') handleBuscar();
    };

    // --- LÓGICA DE CADASTRO ---
    const handleSalvarCliente = async () => {
        if (!novoCliente.nome.trim()) {
            alert("O nome do cliente é obrigatório.");
            return;
        }

        setLoadingCadastro(true);
        try {
            // Envia para a API criar o cliente
            const clienteCriado = await cadastrarCliente({
                nome_completo: novoCliente.nome,
                email: novoCliente.email,
                cpf: novoCliente.cpf, 
                telefone: novoCliente.telefone
            });

            // Já seleciona o cliente criado e fecha o modal
            onSelectCliente(clienteCriado);
            onClose();
            
            // Reseta estados
            setView('search'); 
            setNovoCliente({ nome: '', cpf: '', email: '', telefone: '' });
            setBusca('');
            setResultado([]);
            
        } catch (error) {
            console.error(error);
            alert("Erro ao cadastrar: " + (error.response?.data?.message || error.message));
        } finally {
            setLoadingCadastro(false);
        }
    };

    const handleSwitchToCreate = () => {
        // Se o usuário digitou algo na busca, já preenche o nome para facilitar
        if (busca && resultado.length === 0) {
            setNovoCliente(prev => ({ ...prev, nome: busca }));
        }
        setView('create');
    };

    return (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1060 }} tabIndex="-1">
            <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
                    
                    {/* CABEÇALHO */}
                    <div className="modal-header bg-dark text-white border-0 p-4">
                        <h5 className="modal-title fw-bold text-uppercase d-flex align-items-center gap-2 small">
                            {view === 'search' ? (
                                <><Search className="text-warning" size={20} /> Identificar Cliente</>
                            ) : (
                                <><UserPlus className="text-success" size={20} /> Novo Cadastro Rápido</>
                            )}
                        </h5>
                        <button type="button" className="btn-close btn-close-white" onClick={onClose} aria-label="Close"></button>
                    </div>

                    <div className="modal-body p-4 bg-light">
                        
                        {/* === VISÃO 1: BUSCA === */}
                        {view === 'search' && (
                            <>
                                <div className="card border-0 shadow-sm rounded-3 p-1 mb-4">
                                    <div className="input-group input-group-lg">
                                        <span className="input-group-text bg-white border-0 text-muted ps-3">
                                            <Search size={20} />
                                        </span>
                                        <input
                                            type="text"
                                            className="form-control border-0 shadow-none fw-semibold"
                                            placeholder="Digite CPF ou Nome..."
                                            value={busca}
                                            onChange={(e) => setBusca(e.target.value)}
                                            onKeyPress={handleKeyPress}
                                            autoFocus
                                        />
                                        <button 
                                            className="btn btn-dark px-4 rounded-3 m-1 fw-bold shadow-sm" 
                                            onClick={handleBuscar}
                                            disabled={loading}
                                        >
                                            {loading ? <span className="spinner-border spinner-border-sm" /> : 'BUSCAR'}
                                        </button>
                                    </div>
                                </div>

                                <div className="list-group shadow-sm rounded-3 border-0 overflow-auto" style={{ maxHeight: '300px' }}>
                                    {loading ? (
                                        <div className="list-group-item text-center py-5 border-0 bg-white">
                                            <div className="spinner-border text-primary mb-2" role="status"></div>
                                            <div className="text-muted small fw-bold">Pesquisando...</div>
                                        </div>
                                    ) : resultado.length > 0 ? (
                                        resultado.map(c => (
                                            <button
                                                key={c.id_usuario}
                                                onClick={() => { onSelectCliente(c); onClose(); }}
                                                className="list-group-item list-group-item-action d-flex justify-content-between align-items-center py-3 border-start-0 border-end-0 border-top-0"
                                            >
                                                <div className="d-flex align-items-center gap-3">
                                                    <div className="bg-light rounded-circle p-2 border">
                                                        <UserCheck className="text-success" size={20} />
                                                    </div>
                                                    <div className="text-start">
                                                        <div className="fw-bold text-dark">{c.nome_completo || c.nome}</div>
                                                        <small className="text-muted d-block" style={{ fontSize: '0.85rem' }}>
                                                            {c.cpf ? `CPF: ${c.cpf}` : (c.email || 'Sem dados de contato')}
                                                        </small>
                                                    </div>
                                                </div>
                                                <span className="badge bg-success bg-opacity-10 text-success rounded-pill px-3 py-2 small fw-bold">
                                                    SELECIONAR
                                                </span>
                                            </button>
                                        ))
                                    ) : (
                                        <div className="text-center py-4 text-muted opacity-75 bg-white">
                                            <p className="fw-semibold mb-2">Nenhum cliente encontrado.</p>
                                            
                                            {/* BOTÃO PARA IR PARA CADASTRO */}
                                            <button 
                                                className="btn btn-outline-success btn-sm fw-bold px-4 py-2 rounded-pill"
                                                onClick={handleSwitchToCreate}
                                            >
                                                <UserPlus size={16} className="me-2" />
                                                CADASTRAR NOVO
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </>
                        )}

                        {/* === VISÃO 2: CADASTRO === */}
                        {view === 'create' && (
                            <form onSubmit={(e) => { e.preventDefault(); handleSalvarCliente(); }}>
                                <div className="row g-3">
                                    <div className="col-12">
                                        <label className="form-label small fw-bold text-muted">Nome Completo *</label>
                                        <input 
                                            type="text" 
                                            className="form-control form-control-lg" 
                                            value={novoCliente.nome}
                                            onChange={e => setNovoCliente({...novoCliente, nome: e.target.value})}
                                            autoFocus
                                            required
                                        />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label small fw-bold text-muted">CPF (Opcional)</label>
                                        <input 
                                            type="text" 
                                            className="form-control" 
                                            value={novoCliente.cpf}
                                            onChange={e => setNovoCliente({...novoCliente, cpf: e.target.value})}
                                            placeholder="000.000.000-00"
                                        />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label small fw-bold text-muted">Telefone (Opcional)</label>
                                        <input 
                                            type="text" 
                                            className="form-control" 
                                            value={novoCliente.telefone}
                                            onChange={e => setNovoCliente({...novoCliente, telefone: e.target.value})}
                                            placeholder="(00) 00000-0000"
                                        />
                                    </div>
                                    <div className="col-12">
                                        <label className="form-label small fw-bold text-muted">Email (Opcional)</label>
                                        <input 
                                            type="email" 
                                            className="form-control" 
                                            value={novoCliente.email}
                                            onChange={e => setNovoCliente({...novoCliente, email: e.target.value})}
                                            placeholder="cliente@email.com"
                                        />
                                    </div>
                                </div>

                                <div className="mt-4 pt-3 border-top d-flex gap-2">
                                    <button 
                                        type="button" 
                                        className="btn btn-light border w-50 fw-bold"
                                        onClick={() => setView('search')}
                                    >
                                        <ArrowLeft size={18} className="me-2"/> Voltar
                                    </button>
                                    <button 
                                        type="submit" 
                                        className="btn btn-success w-50 fw-bold shadow-sm"
                                        disabled={loadingCadastro}
                                    >
                                        {loadingCadastro ? 'Salvando...' : <><Save size={18} className="me-2"/> Salvar Cliente</>}
                                    </button>
                                </div>
                            </form>
                        )}

                    </div>

                    {/* RODAPÉ (Apenas na Busca) */}
                    {view === 'search' && (
                        <div className="modal-footer border-0 p-4 bg-white d-flex flex-column gap-2">
                            <button 
                                className="btn btn-outline-secondary w-100 py-3 rounded-3 fw-bold text-uppercase border-2 hover-shadow small"
                                onClick={() => { onSelectCliente(null); onClose(); }}
                            >
                                Continuar sem identificar (Consumidor Final)
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}