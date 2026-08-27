import React, { useState, useEffect, useRef } from 'react';
import { Spinner, Modal, Button } from 'react-bootstrap';
import { toast } from 'react-toastify';
import api from '../../services/api';

export default function ComandaList({ aoClicarMesaLivre, aoClicarMesaOcupada }) {
    const [mesasFisicas, setMesasFisicas] = useState([]);
    const [loading, setLoading] = useState(true);
    
    const [modalJuncao, setModalJuncao] = useState({ open: false, origem: null, destino: null });
    const touchOriginRef = useRef(null);

    const carregarDados = async (silencioso = false) => {
        try {
            if (!silencioso) setLoading(true);
            const [resMesas, resComandas] = await Promise.all([
                api.get('/mesas'),
                api.get('/comandas')
            ]);
            const comandasAbertas = resComandas.data;

            const mesasMapeadas = resMesas.data.map(mesa => {
                
                // 🟢 FIM DO CLONE: Lógica Rígida de Associação de Comanda
                const comandaDaMesa = comandasAbertas.find(c => {
                    // 1. Se tiver o ID, é absoluto e incontestável
                    if (c.id_mesa === mesa.id_mesa) return true;
                    // 2. Se for uma comanda antiga simples
                    if (c.codigo_comanda === mesa.nome) return true;
                    
                    // 3. Se o nome estiver mesclado "03 + 02" ou "03 (+02)", 
                    // O DONO DA COMANDA É SEMPRE O PRIMEIRO NOME ANTES DO '+'
                    const nomePrincipal = c.codigo_comanda.split('+')[0].replace(/[()]/g, '').trim();
                    return nomePrincipal === mesa.nome;
                });
                
                let statusExibicao = mesa.status;

                if (mesa.status === 'AGRUPADA') {
                    statusExibicao = 'AGRUPADA';
                } else if (comandaDaMesa) {
                    statusExibicao = comandaDaMesa.status_comanda === 'FECHANDO' ? 'FECHANDO' : 'OCUPADA';
                }

                return { ...mesa, comanda: comandaDaMesa || null, statusExibicao };
            });
            
            setMesasFisicas(mesasMapeadas);

            // 🟢 AUTO-HEAL: Limpeza de Fantasmas
            mesasMapeadas.forEach(async (m) => {
                if ((m.status === 'OCUPADA' || m.status === 'AGRUPADA') && !m.comanda) {
                    try {
                        await api.put(`/mesas/${m.id_mesa}`, { nome: m.nome, status: 'LIVRE' });
                    } catch (e) {}
                }
            });

        } catch (error) {
            if (!silencioso) toast.error("Erro ao carregar mesas.");
        } finally {
            if (!silencioso) setLoading(false);
        }
    };

    useEffect(() => { 
        carregarDados(); 
        const interval = setInterval(() => carregarDados(true), 4000);
        return () => clearInterval(interval);
    }, []);

    const handleMesaClick = (mesa) => {
        if (mesa.statusExibicao === 'AGRUPADA') {
            toast.info(`Mesa agrupada. Os itens devem ser lançados na mesa: ${mesa.mesa_agrupada}`);
            return;
        }

        if (mesa.comanda) {
            aoClicarMesaOcupada(mesa, mesa.comanda);
        } else if (mesa.statusExibicao === 'LIVRE' || mesa.statusExibicao === 'RESERVADA') {
            aoClicarMesaLivre(mesa);
        } else {
            aoClicarMesaOcupada(mesa, mesa.comanda);
        }
    };

    const confirmarJuncao = async (tipo_juncao) => {
        const { origem, destino } = modalJuncao;
        setModalJuncao({ open: false, origem: null, destino: null });

        try {
            await api.post('/comandas/juntar', { 
                id_mesa_origem: origem.id_mesa, 
                id_comanda_destino: destino.comanda.id_pedido,
                tipo_juncao: tipo_juncao 
            });
            toast.success("Mesas atualizadas com sucesso!");
            if (window.navigator && window.navigator.vibrate) window.navigator.vibrate([50, 50, 50]);
            carregarDados();
        } catch (error) { 
            toast.error("Erro ao processar as mesas."); 
        }
    };

    const handleDragStart = (e, mesa) => e.dataTransfer.setData("mesa_origem_id", mesa.id_mesa);
    const handleDragOver = (e) => e.preventDefault();
    
    const handleDrop = (e, mesaDestino) => {
        e.preventDefault();
        const idOrigem = Number(e.dataTransfer.getData("mesa_origem_id"));
        if (idOrigem === mesaDestino.id_mesa) return;

        const mesaOrigem = mesasFisicas.find(m => m.id_mesa === idOrigem);
        
        if (mesaDestino.statusExibicao === 'AGRUPADA') return toast.warning("Não pode vincular a uma mesa que já está agrupada.");
        if (!mesaDestino.comanda) return toast.warning("A mesa de destino precisa estar aberta.");

        setModalJuncao({ open: true, origem: mesaOrigem, destino: mesaDestino });
    };

    const handleTouchStart = (e, mesa) => {
        if (mesa.statusExibicao === 'AGRUPADA') return;
        touchOriginRef.current = mesa.id_mesa;
        if (window.navigator && window.navigator.vibrate) window.navigator.vibrate(15); 
    };

    const handleTouchEnd = (e) => {
        if (!touchOriginRef.current) return;
        const touch = e.changedTouches[0];
        const elementUnderFinger = document.elementFromPoint(touch.clientX, touch.clientY);

        if (elementUnderFinger) {
            const dropTarget = elementUnderFinger.closest('.mesa-droppable');
            if (dropTarget) {
                const idDestino = Number(dropTarget.getAttribute('data-mesa-id'));
                if (idDestino !== touchOriginRef.current) {
                    const mesaOrigem = mesasFisicas.find(m => m.id_mesa === touchOriginRef.current);
                    const mesaDestino = mesasFisicas.find(m => m.id_mesa === idDestino);
                    
                    if (mesaDestino && mesaDestino.comanda && mesaDestino.statusExibicao !== 'AGRUPADA') {
                        setModalJuncao({ open: true, origem: mesaOrigem, destino: mesaDestino });
                    }
                }
            }
        }
        touchOriginRef.current = null;
    };

    const getEstiloMesa = (status) => {
        switch (status) {
            case 'LIVRE': return { bg: 'bg-white', border: 'border-success', text: 'text-success', sub: 'text-success opacity-75' };
            case 'RESERVADA': return { bg: 'bg-warning', border: 'border-warning', text: 'text-dark', sub: 'text-dark opacity-75' };
            case 'OCUPADA': return { bg: 'bg-primary-subtle', border: 'border-primary', text: 'text-primary', sub: 'text-primary' };
            case 'FECHANDO': return { bg: 'bg-danger-subtle', border: 'border-danger', text: 'text-danger', sub: 'text-danger' };
            case 'AGRUPADA': return { bg: 'bg-secondary', border: 'border-secondary', text: 'text-white', sub: 'text-white' };
            default: return { bg: 'bg-white', border: 'border-secondary', text: 'text-secondary', sub: 'text-secondary opacity-50' };
        }
    };

    if (loading) return <div className="text-center mt-5"><Spinner animation="border" variant="primary" /></div>;

    return (
        <div className="p-3 pb-5">
            <div className="row g-2">
                {mesasFisicas.map((mesa) => {
                    const estilo = getEstiloMesa(mesa.statusExibicao);
                    const isAgrupada = mesa.statusExibicao === 'AGRUPADA';
                    
                    return (
                        <div className="col-4 col-sm-3 col-md-2" key={mesa.id_mesa}>
                            <button
                                onClick={() => handleMesaClick(mesa)}
                                data-mesa-id={mesa.id_mesa}
                                className={`mesa-droppable w-100 p-2 rounded-4 d-flex flex-column align-items-center justify-content-center border border-2 ${estilo.bg} ${estilo.border}`}
                                draggable={!isAgrupada}
                                onDragStart={(e) => handleDragStart(e, mesa)}
                                onDragOver={handleDragOver}
                                onDrop={(e) => handleDrop(e, mesa)}
                                onTouchStart={(e) => handleTouchStart(e, mesa)}
                                onTouchEnd={handleTouchEnd}
                                style={{ 
                                    minHeight: '90px', 
                                    transition: 'background-color 0.2s', 
                                    cursor: isAgrupada ? 'not-allowed' : 'grab', 
                                    opacity: isAgrupada ? 0.7 : 1,
                                    touchAction: 'manipulation' 
                                }}
                            >
                                <span className={`fs-3 fw-bold mb-0 ${estilo.text}`} style={{ fontSize: mesa.comanda?.codigo_comanda.length > 5 ? '16px' : '24px' }}>
                                    {mesa.comanda ? mesa.comanda.codigo_comanda : mesa.nome}
                                </span>
                                <span className={`mt-1 fw-bold text-uppercase ${estilo.sub}`} style={{ fontSize: '10px' }}>
                                    {isAgrupada ? `🔗 À ${mesa.mesa_agrupada}` : (!mesa.comanda ? mesa.statusExibicao : `R$ ${Number(mesa.comanda.preco_total).toFixed(2)}`)}
                                </span>
                            </button>
                        </div>
                    );
                })}
            </div>

            <Modal show={modalJuncao.open} onHide={() => setModalJuncao({ open: false, origem: null, destino: null })} centered>
                <Modal.Header closeButton className="border-0 pb-0">
                    <Modal.Title className="fw-bold">Agrupar Mesas</Modal.Title>
                </Modal.Header>
                <Modal.Body className="pt-2 pb-4 px-4 text-center">
                    <p className="text-secondary mb-4">
                        Você associou a mesa <strong>{modalJuncao.origem?.nome}</strong> com a <strong>{modalJuncao.destino?.nome}</strong>.<br/> Como os clientes vão pagar a conta?
                    </p>
                    <div className="d-grid gap-3">
                        <Button variant="primary" className="py-3 fw-bold rounded-4 shadow-sm text-start ps-4" onClick={() => confirmarJuncao('UNIR_CONTAS')}>
                            <i className="bi bi-diagram-3-fill me-3 fs-5"></i> 
                            Juntar Tudo (Uma única conta)
                        </Button>
                        <Button variant="outline-primary" className="py-3 fw-bold rounded-4 text-start ps-4" onClick={() => confirmarJuncao('VINCULAR_MESAS')}>
                            <i className="bi bi-people-fill me-3 fs-5"></i> 
                            Apenas Juntar Mesas (Contas Separadas)
                        </Button>
                    </div>
                </Modal.Body>
            </Modal>
        </div>
    );
}