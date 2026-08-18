import React, { useState, useEffect } from 'react';
import { Button } from 'react-bootstrap';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../services/api';

const Header = ({ onLogout }) => {
    const [assinatura, setAssinatura] = useState(null);
    const location = useLocation();
    const navigate = useNavigate();

    // 🚀 BUSCA O STATUS DA FATURA NO BACKGROUND (SILENCIOSO)
    useEffect(() => {
        const fetchStatus = async () => {
            try {
                // 🟢 BLINDAGEM: Se o usuário não for dono/admin, engole o Erro 403 e não suja o console
                const { data } = await api.get('/fatura/status').catch(() => ({ data: null }));
                if (data) {
                    setAssinatura(data);
                }
            } catch (error) {
                // Falha silenciosa
            }
        };
        fetchStatus();
    }, [location.pathname]); // Atualiza sempre que mudar de tela

    // --- LÓGICA DE TEMPO E BLOQUEIO ---
    let isVencida = false;
    let isPertoDeVencer = false;
    let diasRestantes = 0;

    if (assinatura && assinatura.data_vencimento) {
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0); // Zera as horas para precisão
        
        const vencimento = new Date(assinatura.data_vencimento);
        vencimento.setHours(0, 0, 0, 0);

        const diffTime = vencimento - hoje;
        diasRestantes = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (assinatura.status_assinatura === 'VENCIDA' || diasRestantes < 0) {
            isVencida = true;
        } else if (diasRestantes >= 0 && diasRestantes <= 3) { // 3 Dias de aviso
            isPertoDeVencer = true;
        }
    }

    const isFaturaPage = location.pathname === '/admin/minha-fatura';
    const hasTopBanner = isPertoDeVencer || (isVencida && isFaturaPage);

    return (
        <>
            {/* 🚀 TELA DE BLOQUEIO TOTAL / CENSURA (Se vencida e NÃO estiver na tela de faturas) */}
            {isVencida && !isFaturaPage && (
                <div 
                    className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
                    style={{ 
                        zIndex: 9999, // Fica acima de TUDO no site
                        backgroundColor: 'rgba(0,0,0,0.6)', // Fundo escuro transparente
                        backdropFilter: 'blur(8px)' // Mágica: Efeito de vidro borrado no sistema inteiro
                    }}
                >
                    <div className="bg-white p-5 rounded-4 text-center shadow-lg" style={{ maxWidth: '500px', width: '90%' }}>
                        <i className="bi bi-exclamation-octagon-fill text-danger" style={{ fontSize: '4rem' }}></i>
                        <h3 className="fw-bold mt-3 text-dark">Acesso Bloqueado</h3>
                        <p className="text-muted mb-4">
                            Sua assinatura está vencida. Para continuar gerenciando seus pedidos e produtos, é necessário regularizar a sua fatura.
                        </p>
                        <Button 
                            variant="danger" 
                            size="lg" 
                            className="w-100 rounded-pill fw-bold shadow-sm"
                            onClick={() => navigate('/admin/minha-fatura')}
                        >
                            <i className="bi bi-credit-card-fill me-2"></i>
                            Ver Fatura e Pagar
                        </Button>
                    </div>
                </div>
            )}

            {/* 🚀 BARRA DE AVISO NO TOPO (Amarelo perto de vencer, Vermelho se na tela de fatura) */}
            {hasTopBanner && (
                <div 
                    className="position-fixed top-0 start-0 w-100 py-2 shadow-sm d-flex justify-content-center align-items-center px-3"
                    style={{ 
                        zIndex: 1050, 
                        backgroundColor: isVencida ? '#dc3545' : '#ffc107',
                        color: isVencida ? '#fff' : '#000',
                        transition: 'all 0.3s ease'
                    }}
                >
                    <span className="fw-bold small me-auto me-sm-3 text-truncate">
                        <i className="bi bi-exclamation-triangle-fill me-2"></i>
                        {isVencida 
                            ? 'Sua assinatura está suspensa. Regularize agora para liberar seu acesso.'
                            : `Atenção: Sua fatura vence em ${diasRestantes} dia${diasRestantes !== 1 ? 's' : ''}.`
                        }
                    </span>
                    {!isFaturaPage && (
                        <Button 
                            size="sm" 
                            variant={isVencida ? "light" : "dark"} 
                            className="rounded-pill fw-bold px-3 py-1"
                            onClick={() => navigate('/admin/minha-fatura')}
                            style={{ whiteSpace: 'nowrap' }}
                        >
                            Pagar Agora
                        </Button>
                    )}
                </div>
            )}

            {/* 🚀 NOVO HEADER LIMPO (Apenas com o botão de Logout) */}
            <div 
                className="w-100 d-flex justify-content-end align-items-center px-4 py-3"
                style={{ 
                    marginTop: hasTopBanner ? '45px' : '0', // Desce o botão caso tenha aviso da fatura no topo
                    transition: 'margin-top 0.3s ease'
                }}
            >
                <Button 
                    variant="outline-danger" 
                    size="sm" 
                    className="rounded-pill fw-bold px-4 shadow-sm bg-white"
                    onClick={onLogout}
                >
                    <i className="bi bi-box-arrow-right me-2"></i> Sair
                </Button>
            </div>
        </>
    );
};

export default Header;