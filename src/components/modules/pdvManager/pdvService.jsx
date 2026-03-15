import api from '../../../services/api'; // Ajuste o caminho conforme sua estrutura

// ============================================================
// 🟢 STATUS E CONTROLE DE CAIXA
// ============================================================
export const getStatusCaixa = async () => {
    const { data } = await api.get('/pdv/status');
    return data;
};

export const abrirCaixa = async (saldo_inicial, observacoes) => {
    const { data } = await api.post('/pdv/abrir', { 
        saldo_inicial: Number(saldo_inicial), 
        observacoes 
    });
    return data;
};

export const conferirCaixa = async (valores) => {
    // valores: { DINHEIRO: 100, PIX: 50 ... }
    const { data } = await api.post('/pdv/conferir', { valores_informados: valores });
    return data;
};

export const fecharCaixa = async (valores, observacoes) => {
    const { data } = await api.post('/pdv/fechar', { 
        valores_informados: valores, 
        observacoes 
    });
    return data;
};

// ============================================================
// 🟢 MOVIMENTAÇÕES (Sangria / Suprimento)
// ============================================================
export const adicionarMovimentacao = async (tipo, valor, motivo) => {
    const { data } = await api.post('/pdv/movimentacao', { 
        tipo, // 'ENTRADA' ou 'SAIDA'
        valor: Number(valor), 
        motivo 
    });
    return data;
};

// ============================================================
// 🟢 PRODUTOS (Busca Híbrida: Nome ou Código)
// ============================================================
export const buscarProdutos = async (termo, tipo = 'geral') => {
    if (!termo) return [];
    
    const termoCodificado = encodeURIComponent(termo);
    
    // Envia o tipo para o backend saber onde procurar
    const { data } = await api.get(`/produtos/busca?q=${termoCodificado}&type=${tipo}`); 
    return data;
};

// ============================================================
// 🟢 VENDAS (Checkout)
// ============================================================
export const realizarVenda = async (vendaData) => {
    // vendaData deve conter: { itens, metodo_pagamento, valor_recebido, cliente_id }
    const { data } = await api.post('/pdv/venda', vendaData);
    return data;
};

// ============================================================
// 🟢 CLIENTES (Busca por Nome ou CPF)
// ============================================================
export const buscarCliente = async (termo) => {
    if (!termo || termo.trim() === '') return [];
    
    const termoCodificado = encodeURIComponent(termo);
    
    // ✅ ATUALIZADO: Mantém busca por parâmetro na rota de usuários
    const { data } = await api.get(`/usuarios/search/${termoCodificado}`);
    return data;
};

export const cadastrarCliente = async (clienteData) => {
    // clienteData: { nome_completo, email, cpf, telefone }
    const { data } = await api.post('/usuarios/pdv', clienteData); 
    return data;
};

// ============================================================
// 🟢 HISTÓRICO DE VENDAS
// ============================================================
export const getHistoricoVendas = async () => {
    // Busca as vendas recentes para a lista
    const { data } = await api.get('/pdv/vendas'); 
    return data;
};

// ============================================================
// 🟢 RELATÓRIOS E HISTÓRICO DE CAIXAS (NOVO)
// ============================================================

// Lista todos os caixas anteriores para o Select do Modal
export const listarCaixas = async () => {
    const { data } = await api.get('/pdv/historico-caixas');
    return data;
};

// Pega os dados completos (Vendas + Financeiro + Fechamento) de um caixa específico
export const buscarRelatorioCaixa = async (id_caixa) => {
    const { data } = await api.get(`/pdv/relatorio/${id_caixa}`);
    return data;
};