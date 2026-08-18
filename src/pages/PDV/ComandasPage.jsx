import React, { useState, useEffect } from 'react';
import { Lock } from 'lucide-react';
import { Spinner } from 'react-bootstrap';
import { toast } from 'react-toastify';
import api from '../../services/api';
import qz from 'qz-tray'; // 🟢 IMPORTANDO O QZ TRAY
import ComandaHeader from '../../components/comanda/ComandaHeader';
import ComandaBottomNav from '../../components/comanda/ComandaBottomNav';
import ComandaList from '../../components/comanda/ComandaList';
import ComandaDetalhe from '../../components/comanda/ComandaDetalhe';
import ProdutoCatalogo from '../../components/comanda/ProdutoCatalogo';
import RevisaoPedido from '../../components/comanda/RevisaoPedido';

export default function ComandasPage() {
  const [isCaixaAberto, setIsCaixaAberto] = useState(null);
  const [telaAtiva, setTelaAtiva] = useState('lista');
  const [loadingAcao, setLoadingAcao] = useState(false);

  const [mesaContexto, setMesaContexto] = useState(null);
  const [comandaAberta, setComandaAberta] = useState(null);
  const [carrinho, setCarrinho] = useState([]);

  useEffect(() => {
    const checarCaixa = async () => {
      try {
        const { data } = await api.get('/comandas/status-caixa');
        setIsCaixaAberto(data.isAberto);
      } catch (error) {
        setIsCaixaAberto(false);
      }
    };
    checarCaixa();
  }, []);

  // ==========================================================
  // 🖨️ MOTOR DE IMPRESSÃO (RECEBE OS JOBS DO BACKEND)
  // ==========================================================
  const executarImpressaoQZ = async (printJobs) => {
    if (!printJobs || printJobs.length === 0) return;

    try {
      if (!qz.websocket.isActive()) {
        // NOTA: Se o garçom estiver num celular, o QZ Tray precisa estar configurado para 
        // aceitar conexões da rede Wi-Fi, e você passaria o IP do servidor aqui: connect({ host: '192.168.x.x' })
        await qz.websocket.connect();
      }

      for (const job of printJobs) {
        const imp = job.impressora;
        if (!imp) continue;

        let printerTarget = imp.endereco_ip;
        if (imp.tipo_conexao === 'REDE') {
          printerTarget = `raw://${imp.endereco_ip}:9100`;
        }

        const config = qz.configs.create(printerTarget);
        let data = [
          '\x1B\x40',          // Inicializa
          '\x1B\x61\x01',      // Centraliza
          '\x1B\x45\x01',      // Negrito
          `\n=== ${job.tipo === 'CONTA' ? 'CONTA DA MESA' : 'PEDIDO P/ PRODUCAO'} ===\n`,
          `MESA: ${job.mesa}\n`,
          '\x1B\x45\x00',      // Tira o negrito
          '--------------------------------\n',
          '\x1B\x61\x00',      // Alinha a esquerda
        ];

        // Adiciona os Itens
        job.itens.forEach(item => {
          data.push(`${item.quantidade}x ${item.nome}\n`);
          if (job.tipo === 'CONTA') {
            data.push(`   R$ ${Number(item.preco).toFixed(2)}\n`);
          }
        });

        // Adiciona o Total se for conta
        if (job.tipo === 'CONTA') {
          data.push('--------------------------------\n');
          data.push('\x1B\x61\x02'); // Alinha a direita
          data.push('\x1B\x45\x01'); // Negrito
          data.push(`TOTAL: R$ ${Number(job.total).toFixed(2)}\n`);
          data.push('\x1B\x45\x00'); // Tira negrito
        }

        data.push('\n\n\n\n\n', '\x1D\x56\x41\x10'); // Avança o papel e corta
        await qz.print(config, data);
      }
    } catch (err) {
      console.error("Erro na impressão:", err);
      toast.warning("Aviso: Falha ao enviar para a impressora. Verifique a conexão com o QZ Tray.");
    }
  };

  const handleMesaLivre = (mesa) => {
    setMesaContexto(mesa);
    setComandaAberta(null);
    setCarrinho([]);
    setTelaAtiva('catalogo');
  };

  const handleMesaOcupada = (mesa, comanda) => {
    setMesaContexto(mesa);
    setComandaAberta(comanda);
    setCarrinho([]);
    setTelaAtiva('detalhe');
  };

  // 🟢 AÇÃO CENTRAL: Enviar para Cozinha
  const acaoEnviarCozinha = async () => {
    if (carrinho.length === 0) return toast.warning("O carrinho está vazio!");
    setLoadingAcao(true);
    try {
        let idPedidoAlvo = comandaAberta?.id_pedido;
        if (!idPedidoAlvo) {
            const { data } = await api.post('/comandas/abrir', { codigo_comanda: mesaContexto.nome, nome_cliente: '' });
            idPedidoAlvo = data.comanda.id_pedido;
            if (mesaContexto.status === 'RESERVADA') {
                await api.put(`/mesas/${mesaContexto.id_mesa}`, { nome: mesaContexto.nome, status: 'OCUPADA' });
            }
        }

        for (const item of carrinho) {
            await api.post(`/comandas/${idPedidoAlvo}/itens`, { id_produto: item.produto.id_produto, quantidade: item.quantidade });
        }

        // 📱 O Celular só avisa o backend. O backend se vira com o caixa.
        await api.post(`/comandas/${idPedidoAlvo}/imprimir-cozinha`);
        
        toast.success("Enviado para a cozinha!");
        if (window.navigator && window.navigator.vibrate) window.navigator.vibrate([50, 50, 50]);

        const { data: comandasAtualizadas } = await api.get('/comandas');
        setCarrinho([]);
        setComandaAberta(comandasAtualizadas.find(c => c.id_pedido === idPedidoAlvo));
        setTelaAtiva('detalhe');
    } catch (error) {
        toast.error("Erro ao enviar pedido.");
    } finally {
        setLoadingAcao(false);
    }
};

  // 🟢 AÇÃO CENTRAL: Pedir a Conta
  const acaoPedirConta = async () => {
    if (!window.confirm("Deseja imprimir a conta e fechar a mesa no caixa?")) return;
    setLoadingAcao(true);
    try {
        // 📱 O Celular só avisa o backend.
        await api.post(`/comandas/${comandaAberta.id_pedido}/solicitar-fechamento`);
        toast.success("Conta solicitada no caixa!");
        setTelaAtiva('lista');
    } catch (error) {
        toast.error("Erro ao solicitar fechamento.");
    } finally {
        setLoadingAcao(false);
    }
};

  if (isCaixaAberto === null) return <div className="vh-100 d-flex justify-content-center align-items-center bg-light"><Spinner animation="border" variant="primary" /></div>;

  if (isCaixaAberto === false) {
    return (
      <div className="vh-100 d-flex flex-column justify-content-center align-items-center bg-light px-4 text-center">
        <div className="bg-danger-subtle p-4 rounded-circle mb-4 text-danger"><Lock size={64} strokeWidth={2} /></div>
        <h2 className="fw-black text-dark mb-2">Caixa Fechado</h2>
        <p className="text-secondary fw-medium mb-5">As comandas estão bloqueadas.<br />Solicite a abertura do caixa.</p>
        <button className="btn btn-primary fw-bold px-5 py-3 rounded-pill" onClick={() => window.location.reload()}>Tentar Novamente</button>
      </div>
    );
  }

  return (
    <div className="vh-100 d-flex flex-column bg-white">
      <ComandaHeader
        titulo={telaAtiva === 'lista' ? 'Mesas & Comandas' : telaAtiva === 'detalhe' ? `Mesa ${mesaContexto?.nome || ''}` : telaAtiva === 'revisao' ? `Revisão Mesa ${mesaContexto?.nome}` : 'Catálogo'}
        comandaAberta={comandaAberta}
      />

      <main className="flex-grow-1 overflow-auto bg-light pb-5 mb-5">
        {telaAtiva === 'lista' && <ComandaList aoClicarMesaLivre={handleMesaLivre} aoClicarMesaOcupada={handleMesaOcupada} />}
        {telaAtiva === 'detalhe' && <ComandaDetalhe comandaOriginal={comandaAberta} atualizarComandaBase={setComandaAberta} />}
        {telaAtiva === 'catalogo' && <ProdutoCatalogo carrinho={carrinho} setCarrinho={setCarrinho} />}
        {telaAtiva === 'revisao' && <RevisaoPedido carrinho={carrinho} setCarrinho={setCarrinho} aoVoltar={() => setTelaAtiva('catalogo')} />}
      </main>

      <ComandaBottomNav
        telaAtiva={telaAtiva}
        setTelaAtiva={setTelaAtiva}
        comandaSelecionada={comandaAberta}
        carrinho={carrinho}
        loadingAcao={loadingAcao}
        acaoRevisar={() => setTelaAtiva('revisao')}
        acaoEnviarCozinha={acaoEnviarCozinha}
        acaoAdicionarItem={() => setTelaAtiva('catalogo')}
        acaoPedirConta={acaoPedirConta}
      />
    </div>
  );
}