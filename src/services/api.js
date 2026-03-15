import axios from 'axios';

// 🔴 MUDANÇA IMPORTANTE PARA TESTE LOCAL:
// Troquei o link da ManateeChat pelo seu localhost temporariamente.
// Se o seu backend roda em uma porta diferente (ex: 3000, 8080), mude o 5000 abaixo!
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
    baseURL: API_URL,
});

// Interceptor de Requisição: Prepara o "pacote" antes de enviar pro backend
api.interceptors.request.use((config) => {
    // 1. Tenta buscar as informações do usuário do localStorage e anexa o TOKEN
    const adminInfoString = localStorage.getItem('adminInfo');
    
    if (adminInfoString) {
        const adminInfo = JSON.parse(adminInfoString);
        if (adminInfo && adminInfo.token) {
            // Anexa o token no formato 'Bearer TOKEN'
            config.headers.Authorization = `Bearer ${adminInfo.token}`;
        }
    }
    
    // 2. 🟢 A MÁGICA DO SAAS AQUI: Anexa a qual LOJA esse usuário pertence
    const tenantId = localStorage.getItem('tenantId');
    if (tenantId) {
        // Envia o ID da loja no cabeçalho. O seu backend (middlewares) vai ler isso!
        config.headers['x-tenant-id'] = tenantId;
    }
    
    return config;
});

export default api;