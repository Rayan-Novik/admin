import axios from 'axios';

// 🔴 MUDANÇA IMPORTANTE PARA TESTE LOCAL:
// Troquei o link da ManateeChat pelo seu localhost temporariamente.
// Se o seu backend roda em uma porta diferente (ex: 3000, 8080), mude o 5000 abaixo!
const API_URL = process.env.REACT_APP_API_URL;

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

    // 3. 🚀 NOVO: Pega o slug da loja diretamente da URL (ex: ?store=ararinhacloud)
    const urlParams = new URLSearchParams(window.location.search);
    const storeSlug = urlParams.get('store');

    if (storeSlug) {
        config.headers['x-tenant-slug'] = storeSlug;
    } else {
        // Fallback: Se não tem na URL, tenta ver se já tem o slug salvo no localStorage
        // Isso ajuda o admin a continuar navegando depois do login sem precisar do "?store=" na URL
        const savedSlug = localStorage.getItem('tenantSlug');
        if (savedSlug) {
            config.headers['x-tenant-slug'] = savedSlug;
        }
    }

    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        // 🟢 SE O BACKEND ENVIAR forceLogout, O FRONT DERRUBA A SESSÃO IMEDIATAMENTE
        if (error.response && error.response.status === 401 && error.response.data?.forceLogout) {
            localStorage.removeItem('adminInfo');
            localStorage.removeItem('tenantId');
            localStorage.removeItem('tenantSlug');
            
            // Avisa o usuário e redireciona
            alert("Você foi desconectado porque sua conta foi acessada em outro dispositivo.");
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default api;