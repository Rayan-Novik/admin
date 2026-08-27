import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Spinner } from 'react-bootstrap';
import api from '../services/api';

const MaintenancePage = () => {
    const [searchParams] = useSearchParams();
    const modulo = searchParams.get('modulo') || 'Sistema'; // Pega o nome do módulo da URL
    const navigate = useNavigate();
    
    // Mensagem padrão caso não tenha nenhuma configurada no banco
    const [mensagem, setMensagem] = useState('Estamos realizando melhorias neste módulo. Ele estará de volta em breve!');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchModuloInfo = async () => {
            try {
                // Busca as configurações de módulos no banco
                const { data } = await api.get('/admin/modulos');
                const modConfig = data.find(m => m.modulo === modulo);
                
                if (modConfig) {
                    if (modConfig.ativo) {
                        // Se o módulo já foi reativado enquanto o usuário estava aqui, manda ele de volta pro painel
                        navigate('/');
                    } else if (modConfig.mensagem_erro) {
                        // Define a mensagem exata que você digitou no painel
                        setMensagem(modConfig.mensagem_erro);
                    }
                }
            } catch (error) {
                console.error('Erro ao buscar status do módulo:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchModuloInfo();
    }, [modulo, navigate]);

    return (
        <div className="d-flex flex-column justify-content-center align-items-center bg-white" style={{ minHeight: '100vh' }}>
            {loading ? (
                <Spinner animation="border" variant="primary" />
            ) : (
                <div className="text-center" style={{ maxWidth: '600px', width: '90%' }}>
                    
                    {/* 🟢 Imagem limpa e centralizada */}
                    <img 
                        src="/devman.png" 
                        alt="Em Desenvolvimento" 
                        className="img-fluid mb-4" 
                        style={{ maxWidth: '350px' }} 
                    />
                    
                    {/* 🟢 Título com mais peso, sem o quadrado em volta */}
                    <h1 className="fw-bold mb-3" style={{ color: '#1a202c', fontSize: '2.2rem' }}>
                        Ops! Módulo em manutenção.
                    </h1>
                    
                    {/* 🟢 Mensagem dinâmica puxada do banco */}
                    <p className="text-muted mb-4" style={{ fontSize: '1.1rem' }}>
                        {mensagem}
                    </p>
                    
                    {/* 🟢 Botão arredondado com ícone de casa, seguindo a referência */}
                    <button 
                        className="btn btn-primary px-4 py-2 fw-semibold rounded-pill"
                        style={{ fontSize: '1.05rem' }}
                        onClick={() => navigate('/')}
                    >
                        Voltar para o início <i className="bi bi-house-door-fill ms-2"></i>
                    </button>
                </div>
            )}
        </div>
    );
};

export default MaintenancePage;