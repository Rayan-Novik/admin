import React, { useState, useEffect, useRef } from 'react';
import { Spinner } from 'react-bootstrap';
import { toast } from 'react-toastify';
import api from '../../services/api';

export default function ComandaList({ aoClicarMesaLivre, aoClicarMesaOcupada }) {
    const [mesasFisicas, setMesasFisicas] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // 🟢 Referência para guardar a mesa que está sendo arrastada no DEDO (Mobile)
    const touchOriginRef = useRef(null);

    const carregarDados = async () => {
        try {
            setLoading(true);
            const [resMesas, resComandas] = await Promise.all([
                api.get('/mesas'),
                api.get('/comandas')
            ]);
            const comandasAbertas = resComandas.data;

            const mesasMapeadas = resMesas.data.map(mesa => {
                const comandaDaMesa = comandasAbertas.find(c => c.codigo_comanda === mesa.nome);
                let statusExibicao = mesa.status;

                if (mesa.status === 'AGRUPADA') {
                    statusExibicao = 'AGRUPADA';
                } else if (comandaDaMesa) {
                    statusExibicao = comandaDaMesa.status_comanda === 'FECHANDO' ? 'FECHANDO' : 'OCUPADA';
                }

                return { ...mesa, comanda: comandaDaMesa || null, statusExibicao };
            });
            setMesasFisicas(mesasMapeadas);
        } catch (error) {
            toast.error("Erro ao carregar mesas.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { carregarDados(); }, []);

    const handleMesaClick = (mesa) => {
        if (mesa.statusExibicao === 'AGRUPADA') {
            toast.info(`Mesa bloqueada. Os itens estão sendo lançados na ${mesa.mesa_agrupada}`);
            return;
        }

        if (mesa.statusExibicao === 'LIVRE' || mesa.statusExibicao === 'RESERVADA') {
            aoClicarMesaLivre(mesa);
        } else {
            aoClicarMesaOcupada(mesa, mesa.comanda);
        }
    };

    // =======================================================
    // 🟢 FUNÇÃO CENTRAL DE JUNTAR MESAS (Usada no PC e Mobile)
    // =======================================================
    const executarJuncao = async (idOrigemStr, idDestinoStr) => {
        const idOrigem = Number(idOrigemStr);
        const idDestino = Number(idDestinoStr);

        if (!idOrigem || !idDestino || idOrigem === idDestino) return;

        const mesaOrigem = mesasFisicas.find(m => m.id_mesa === idOrigem);
        const mesaDestino = mesasFisicas.find(m => m.id_mesa === idDestino);

        if (!mesaOrigem || !mesaDestino) return;

        if (mesaDestino.statusExibicao === 'AGRUPADA') return toast.warning("Não pode vincular a uma mesa que já está agrupada.");
        if (!mesaDestino.comanda) return toast.warning("A mesa de destino precisa estar aberta.");

        const msg = mesaOrigem.comanda ? `Juntar a ${mesaOrigem.nome} com a ${mesaDestino.nome}?` : `Vincular a ${mesaOrigem.nome} à ${mesaDestino.nome}?`;
        
        if (window.confirm(msg)) {
            try {
                await api.post('/comandas/juntar', { 
                    id_mesa_origem: mesaOrigem.id_mesa, 
                    id_comanda_destino: mesaDestino.comanda.id_pedido 
                });
                toast.success("Mesas unidas!");
                if (window.navigator && window.navigator.vibrate) window.navigator.vibrate([50, 50, 50]);
                carregarDados();
            } catch (error) { 
                toast.error("Erro ao juntar mesas."); 
            }
        }
    };

    // ==========================================
    // 💻 EVENTOS DO COMPUTADOR (DRAG & DROP NATIVO)
    // ==========================================
    const handleDragStart = (e, mesa) => e.dataTransfer.setData("mesa_origem_id", mesa.id_mesa);
    const handleDragOver = (e) => e.preventDefault();
    const handleDrop = (e, mesaDestino) => {
        e.preventDefault();
        const idOrigem = e.dataTransfer.getData("mesa_origem_id");
        executarJuncao(idOrigem, mesaDestino.id_mesa);
    };

    // ==========================================
    // 📱 EVENTOS DO CELULAR (TOUCH DRAG)
    // ==========================================
    const handleTouchStart = (e, mesa) => {
        if (mesa.statusExibicao === 'AGRUPADA') return;
        touchOriginRef.current = mesa.id_mesa;
        // Dá um micro-choque pra avisar o usuário que "pegou" a mesa
        if (window.navigator && window.navigator.vibrate) window.navigator.vibrate(15); 
    };

    const handleTouchEnd = (e) => {
        if (!touchOriginRef.current) return;

        // Pega as coordenadas X e Y exatas de onde o dedo saiu da tela
        const touch = e.changedTouches[0];
        
        // Pega o elemento HTML que estava exatamente embaixo do dedo
        const elementUnderFinger = document.elementFromPoint(touch.clientX, touch.clientY);

        if (elementUnderFinger) {
            // Procura se esse elemento ou o pai dele tem a classe "mesa-droppable"
            const dropTarget = elementUnderFinger.closest('.mesa-droppable');
            
            if (dropTarget) {
                const idDestino = dropTarget.getAttribute('data-mesa-id');
                executarJuncao(touchOriginRef.current, idDestino);
            }
        }

        // Limpa a memória do dedo
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
                                
                                // Dados essenciais para a mágica do mobile funcionar!
                                data-mesa-id={mesa.id_mesa}
                                className={`mesa-droppable w-100 p-2 rounded-4 d-flex flex-column align-items-center justify-content-center border border-2 ${estilo.bg} ${estilo.border}`}
                                
                                // Eventos do PC
                                draggable={!isAgrupada}
                                onDragStart={(e) => handleDragStart(e, mesa)}
                                onDragOver={handleDragOver}
                                onDrop={(e) => handleDrop(e, mesa)}
                                
                                // 🟢 Eventos do Celular
                                onTouchStart={(e) => handleTouchStart(e, mesa)}
                                onTouchEnd={handleTouchEnd}

                                style={{ 
                                    minHeight: '90px', 
                                    transition: 'background-color 0.2s', 
                                    cursor: isAgrupada ? 'not-allowed' : 'grab', 
                                    opacity: isAgrupada ? 0.7 : 1,
                                    // Evita o celular dar zoom se apertar duas vezes rápido
                                    touchAction: 'manipulation' 
                                }}
                            >
                                <span className={`fs-3 fw-bold mb-0 ${estilo.text}`}>{mesa.nome}</span>
                                <span className={`mt-1 fw-bold text-uppercase ${estilo.sub}`} style={{ fontSize: '10px' }}>
                                    {isAgrupada ? `🔗 À ${mesa.mesa_agrupada}` : (!mesa.comanda ? mesa.statusExibicao : `R$ ${Number(mesa.comanda.preco_total).toFixed(2)}`)}
                                </span>
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}