import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal, Button, Form, Row, Col, Alert, Spinner, Badge } from 'react-bootstrap';
import { FaCashRegister, FaCheckCircle, FaExclamationTriangle, FaTimesCircle, FaCalculator } from 'react-icons/fa';
import { abrirCaixa, conferirCaixa, fecharCaixa } from './pdvService';
import api from '../../../services/api'; 

export default function CaixaModal({ isOpen, mode, onClose, onSuccess }) {
    const navigate = useNavigate();

    // ------------------------------------
    // ESTADOS: LOGO DO CLIENTE
    // ------------------------------------
    const [logoLoja, setLogoLoja] = useState('');

    // ------------------------------------
    // ESTADOS: ABERTURA COM AUTENTICAÇÃO
    // ------------------------------------
    const [saldoInicial, setSaldoInicial] = useState('');
    const [authEmail, setAuthEmail] = useState('');
    const [authSenha, setAuthSenha] = useState('');
    
    // Estados para Fechamento
    const [valores, setValores] = useState({ DINHEIRO: '', PIX: '', CREDITO: '', DEBITO: '' });
    const [conferencia, setConferencia] = useState(null); 
    const [observacoes, setObservacoes] = useState('');
    
    // UI States
    const [step, setStep] = useState(1); 
    const [loading, setLoading] = useState(false);
    const [authError, setAuthError] = useState('');

    // 🟢 Busca a logo quando o modal é aberto
    useEffect(() => {
        if (isOpen) {
            const fetchLogo = async () => {
                try {
                    const { data } = await api.get('/configuracoes/appearance');
                    if (data && data.LOGO_URL) {
                        setLogoLoja(data.LOGO_URL);
                    }
                } catch (error) {
                    console.warn('Erro ao carregar a logo no CaixaModal:', error);
                }
            };
            fetchLogo();
        }
    }, [isOpen]);

    const handleReset = () => {
        setSaldoInicial('');
        setAuthEmail('');
        setAuthSenha('');
        setValores({ DINHEIRO: '', PIX: '', CREDITO: '', DEBITO: '' });
        setConferencia(null);
        setObservacoes('');
        setStep(1);
        setAuthError('');
    };

    const handleClose = () => {
        handleReset();
        if (mode === 'abrir') {
            navigate('/');
        } else {
            onClose();
        }
    };

    const handleAbrirComAutenticacao = async (e) => {
        e.preventDefault();
        setAuthError('');
        
        if (!authEmail || !authSenha) {
            setAuthError('Preencha seu e-mail e senha para abrir o caixa.');
            return;
        }

        try {
            setLoading(true);
            
            // 🟢 Variável para capturar os dados do novo login
            let loginData; 
            const tenantAtual = localStorage.getItem('tenantId') || 'default';

            // Tenta como Funcionário primeiro
            try {
                const res = await api.post('/usuarios/staff-login', { 
                    email: authEmail, 
                    senha: authSenha,
                    tenant: tenantAtual // Sempre bom mandar o tenant!
                });
                loginData = res.data;
            } catch (errFuncionario) {
                // Se falhar, tenta como Dono (Admin)
                try {
                    const res = await api.post('/usuarios/admin-login', {
                        email: authEmail,
                        senha: authSenha,
                        tenant: tenantAtual
                    });
                    loginData = res.data;
                } catch (errAdmin) {
                    setAuthError('E-mail ou senha incorretos. Acesso negado.');
                    setLoading(false);
                    return;
                }
            }

            // 🟢 A MÁGICA ACONTECE AQUI: 
            // Como o backend gerou uma nova sessão (UUID), precisamos salvar o novo token 
            // no localStorage para o middleware não achar que fomos hackeados.
            if (loginData && loginData.token) {
                // Atualiza o adminInfo mantendo o resto da aplicação logada
                localStorage.setItem('adminInfo', JSON.stringify(loginData));
                
                // Se tiver algum ouvinte na tela, avisa que o token renovou
                window.dispatchEvent(new Event('authChange'));
            }

            // Se a senha bater (seja func ou admin), abre o caixa!
            await abrirCaixa(saldoInicial || 0, observacoes);
            
            handleReset();
            onSuccess(); 
        } catch (error) {
            setAuthError('Erro ao abrir: ' + (error.response?.data?.message || error.message));
        } finally {
            setLoading(false);
        }
    };

    const handleConferir = async () => {
        try {
            setLoading(true);
            const resultado = await conferirCaixa(valores);
            setConferencia(resultado);
            setStep(2); 
        } catch (error) {
            alert('Erro ao conferir: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleFechar = async () => {
        if (conferencia?.divergencia_total !== 0 && observacoes.trim().length < 5) {
            alert("⚠️ Atenção: Como há divergência de valores, você DEVE escrever uma justificativa nas observações.");
            return;
        }

        try {
            setLoading(true);
            await fecharCaixa(valores, observacoes);
            handleReset();
            onSuccess();
            alert("Caixa fechado com sucesso!");
        } catch (error) {
            alert('Erro ao fechar: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal show={isOpen} onHide={handleClose} centered backdrop="static" size={mode === 'fechar' && step === 2 ? 'lg' : 'md'} contentClassName="modal-dark-fix border-0 shadow-lg rounded-4 overflow-hidden">
            
            {/* 🟢 HEADER ESTILO TELA DE LOGIN BEM BONITA E CENTRALIZADA */}
            <Modal.Header closeButton className="border-0 pt-4 pb-0 d-flex flex-column align-items-center position-relative" style={{ backgroundColor: 'var(--bg-main)' }}>
                {/* Botão de fechar fica no cantinho, mas empurra o conteúdo pro meio */}
                <div className="position-absolute top-0 end-0 p-3">
                    <button type="button" className="btn-close" aria-label="Close" onClick={handleClose}></button>
                </div>

                {logoLoja ? (
                    <div className="text-center mb-2 mt-2 w-100 d-flex justify-content-center">
                        <img 
                            src={logoLoja} 
                            alt="Logo Loja" 
                            className="logo-caixa-hero"
                        />
                    </div>
                ) : (
                    <div className="d-flex align-items-center justify-content-center rounded-circle shadow-sm mb-3 mt-2" style={{ width: '70px', height: '70px', backgroundColor: mode === 'abrir' ? 'var(--text-primary)' : '#dc2626', color: 'var(--bg-sidebar)' }}>
                        <FaCashRegister size={32} />
                    </div>
                )}
                
                <h4 className="fw-bold mt-2 text-center" style={{ color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>
                    {mode === 'abrir' ? 'Iniciar Turno de Vendas' : 'Encerrar Turno'}
                </h4>
                {mode === 'fechar' && (
                    <p className="text-muted small mb-0">Confira os valores antes de fechar o caixa.</p>
                )}
            </Modal.Header>

            <Modal.Body className="p-4 pt-3" style={{ backgroundColor: 'var(--bg-main)' }}>
                
                {/* === MODO ABRIR CAIXA COM CREDENCIAIS === */}
                {mode === 'abrir' && (
                    <Form onSubmit={handleAbrirComAutenticacao} className="mt-2">
                        
                        {authError && <Alert variant="danger" className="border-0 py-2 small shadow-sm">{authError}</Alert>}

                        <div className="p-4 bg-primary bg-opacity-10 border border-primary border-opacity-25 rounded-4 mb-4 text-center shadow-sm">
                            <Form.Label className="small fw-bold text-uppercase text-primary ls-1 mb-2 d-block">Saldo em Gaveta (Fundo de Troco)</Form.Label>
                            <div className="d-flex justify-content-center align-items-center">
                                <span className="fs-4 fw-bold text-primary me-2">R$</span>
                                <input 
                                    type="number" 
                                    inputMode="decimal"
                                    autoFocus
                                    placeholder="0.00" 
                                    value={saldoInicial} 
                                    onChange={e => setSaldoInicial(e.target.value)} 
                                    className="form-control border-0 bg-transparent shadow-none p-0 fw-bolder text-primary text-center"
                                    style={{ fontSize: '3rem', width: '180px' }}
                                />
                            </div>
                        </div>

                        <div className="p-4 rounded-4 border shadow-sm mb-4" style={{ backgroundColor: 'var(--bg-sidebar)', borderColor: 'var(--border-color)' }}>
                            <h6 className="fw-bold mb-3 d-flex align-items-center" style={{ color: 'var(--text-primary)', fontSize: '14px' }}>
                                <i className="bi bi-shield-lock-fill text-warning me-2 fs-5"></i> 
                                Confirme sua Identidade
                            </h6>
                            
                            <Form.Group className="mb-3">
                                <Form.Control 
                                    type="email" 
                                    placeholder="Seu E-mail de Acesso" 
                                    value={authEmail} 
                                    onChange={e => setAuthEmail(e.target.value)} 
                                    className="form-dark-input border shadow-none py-3"
                                    style={{ fontSize: '15px', borderRadius: '12px' }}
                                    required
                                />
                            </Form.Group>

                            <Form.Group>
                                <Form.Control 
                                    type="password" 
                                    placeholder="Sua Senha" 
                                    value={authSenha} 
                                    onChange={e => setAuthSenha(e.target.value)} 
                                    className="form-dark-input border shadow-none py-3"
                                    style={{ fontSize: '15px', borderRadius: '12px' }}
                                    required
                                />
                            </Form.Group>
                        </div>
                        
                        <div className="d-grid gap-2 mt-2">
                            <Button variant="primary" type="submit" className="py-3 fw-bold rounded-pill shadow-lg border-0 d-flex justify-content-center align-items-center" disabled={loading} style={{ fontSize: '16px', letterSpacing: '0.5px' }}>
                                {loading ? <Spinner size="sm" className="me-2" /> : <><FaCashRegister className="me-2"/> ABRIR CAIXA AGORA</>}
                            </Button>
                            <Button variant="link" className="text-muted text-decoration-none small fw-medium mt-2 hover-opacity-100 opacity-75" onClick={handleClose}>
                                Cancelar e voltar ao início
                            </Button>
                        </div>
                    </Form>
                )}

                {/* === MODO FECHAR CAIXA: PASSO 1 (DIGITAÇÃO) === */}
                {mode === 'fechar' && step === 1 && (
                    <div className="fade-in mt-2">
                        <Alert variant="warning" className="small border-0 shadow-sm rounded-4 d-flex align-items-center gap-3 mb-4 p-3">
                            <FaExclamationTriangle size={28} className="text-warning opacity-75"/>
                            <div>Conte os valores da gaveta e da maquininha <b>fisicamente</b> antes de digitar. O sistema fará o cruzamento dos dados!</div>
                        </Alert>
                        
                        <div className="p-4 rounded-4 border shadow-sm mb-4" style={{ backgroundColor: 'var(--bg-sidebar)', borderColor: 'var(--border-color)' }}>
                            <Row className="g-4">
                                <Col md={6}>
                                    <Form.Group>
                                        <Form.Label className="fw-bold small mb-2 text-uppercase ls-1" style={{ color: '#16a34a' }}><i className="bi bi-cash me-1"></i> Dinheiro</Form.Label>
                                        <div className="input-group input-group-lg">
                                            <span className="input-group-text bg-transparent border-end-0 text-muted border-secondary border-opacity-25 fs-6">R$</span>
                                            <Form.Control type="number" inputMode="decimal" placeholder="0.00" value={valores.DINHEIRO} onChange={e => setValores({...valores, DINHEIRO: e.target.value})} className="form-dark-input border-start-0 border-secondary border-opacity-25 shadow-none fw-bolder fs-5" />
                                        </div>
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Form.Group>
                                        <Form.Label className="fw-bold small mb-2 text-uppercase ls-1" style={{ color: '#0ea5e9' }}><i className="bi bi-qr-code me-1"></i> Pix</Form.Label>
                                        <div className="input-group input-group-lg">
                                            <span className="input-group-text bg-transparent border-end-0 text-muted border-secondary border-opacity-25 fs-6">R$</span>
                                            <Form.Control type="number" inputMode="decimal" placeholder="0.00" value={valores.PIX} onChange={e => setValores({...valores, PIX: e.target.value})} className="form-dark-input border-start-0 border-secondary border-opacity-25 shadow-none fw-bolder fs-5" />
                                        </div>
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Form.Group>
                                        <Form.Label className="fw-bold small mb-2 text-uppercase ls-1" style={{ color: '#6366f1' }}><i className="bi bi-credit-card-fill me-1"></i> Crédito</Form.Label>
                                        <div className="input-group input-group-lg">
                                            <span className="input-group-text bg-transparent border-end-0 text-muted border-secondary border-opacity-25 fs-6">R$</span>
                                            <Form.Control type="number" inputMode="decimal" placeholder="0.00" value={valores.CREDITO} onChange={e => setValores({...valores, CREDITO: e.target.value})} className="form-dark-input border-start-0 border-secondary border-opacity-25 shadow-none fw-bolder fs-5" />
                                        </div>
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Form.Group>
                                        <Form.Label className="fw-bold small mb-2 text-uppercase ls-1" style={{ color: 'var(--text-secondary)' }}><i className="bi bi-credit-card me-1"></i> Débito</Form.Label>
                                        <div className="input-group input-group-lg">
                                            <span className="input-group-text bg-transparent border-end-0 text-muted border-secondary border-opacity-25 fs-6">R$</span>
                                            <Form.Control type="number" inputMode="decimal" placeholder="0.00" value={valores.DEBITO} onChange={e => setValores({...valores, DEBITO: e.target.value})} className="form-dark-input border-start-0 border-secondary border-opacity-25 shadow-none fw-bolder fs-5" />
                                        </div>
                                    </Form.Group>
                                </Col>
                            </Row>
                        </div>
                        
                        <Button variant="danger" className="w-100 py-3 fw-bold rounded-pill shadow-lg border-0 d-flex justify-content-center align-items-center" onClick={handleConferir} disabled={loading} style={{ fontSize: '15px', letterSpacing: '0.5px' }}>
                            <FaCalculator className="me-2"/> CONFERIR VALORES
                        </Button>
                    </div>
                )}

                {/* === MODO FECHAR CAIXA: PASSO 2 (CONFERÊNCIA) === */}
                {mode === 'fechar' && step === 2 && conferencia && (
                    <div className="fade-in mt-2">
                        <div className="d-flex justify-content-between align-items-center mb-4 p-3 rounded-4" style={{ backgroundColor: 'var(--bg-sidebar)', border: '1px solid var(--border-color)' }}>
                            <h6 className="mb-0 fw-bold text-uppercase" style={{ color: 'var(--text-secondary)', fontSize: '12px', letterSpacing: '0.5px' }}>Resultado Final:</h6>
                            {conferencia.divergencia_total === 0 ? (
                                <Badge bg="success" className="px-4 py-2 fs-6 fw-bold bg-opacity-10 text-success border border-success"><FaCheckCircle className="me-1"/> CAIXA BATIDO</Badge>
                            ) : (
                                <Badge bg="danger" className="px-4 py-2 fs-6 fw-bold bg-opacity-10 text-danger border border-danger"><FaTimesCircle className="me-1"/> DIVERGÊNCIA</Badge>
                            )}
                        </div>

                        <div className="border rounded-4 overflow-hidden mb-4 shadow-sm" style={{ borderColor: 'var(--border-color)' }}>
                            <table className="table table-borderless table-hover mb-0 align-middle text-center small">
                                <thead style={{ backgroundColor: 'var(--bg-sidebar)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                                    <tr className="text-uppercase" style={{ fontSize: '11px', letterSpacing: '0.5px' }}>
                                        <th className="py-3 text-start ps-4">Método</th>
                                        <th>Esperado</th>
                                        <th>Gaveta</th>
                                        <th className="pe-3">Diferença</th>
                                    </tr>
                                </thead>
                                <tbody style={{ backgroundColor: 'var(--bg-main)' }}>
                                    {conferencia.conferencia.map((item) => (
                                        <tr key={item.metodo} style={{ borderBottom: '1px dotted var(--border-color)' }}>
                                            <td className="fw-bold text-start ps-4 py-3" style={{ color: 'var(--text-primary)' }}>{item.metodo}</td>
                                            <td style={{ color: 'var(--text-secondary)' }}>R$ {item.esperado.toFixed(2)}</td>
                                            <td className="fw-bold" style={{ color: 'var(--text-primary)' }}>R$ {item.informado.toFixed(2)}</td>
                                            <td className={`pe-3 ${item.diferenca === 0 ? 'text-success' : (item.diferenca > 0 ? 'text-primary fw-bold' : 'text-danger fw-bold')}`}>
                                                {item.diferenca > 0 ? `+ ${item.diferenca.toFixed(2)}` : `${item.diferenca.toFixed(2)}`}
                                            </td>
                                        </tr>
                                    ))}
                                    <tr style={{ backgroundColor: 'var(--bg-sidebar)' }}>
                                        <td colSpan="3" className="text-end pe-3 fw-bold py-3" style={{ color: 'var(--text-secondary)' }}>Saldo de Diferença:</td>
                                        <td className={`fw-bolder fs-5 pe-3 ${conferencia.divergencia_total < 0 ? 'text-danger' : 'text-success'}`}>
                                            R$ {conferencia.divergencia_total.toFixed(2)}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        <Form.Group className="mb-4">
                            <Form.Label className="small fw-bold mb-2 text-uppercase ls-1" style={{ color: conferencia.divergencia_total !== 0 ? '#dc2626' : 'var(--text-secondary)' }}>
                                {conferencia.divergencia_total !== 0 ? 'Justificativa Obrigatória *' : 'Observações Finais'}
                            </Form.Label>
                            <Form.Control 
                                as="textarea" 
                                rows={3} 
                                placeholder={conferencia.divergencia_total !== 0 ? "Obrigatório explicar a divergência..." : "Alguma observação do turno?"}
                                value={observacoes}
                                onChange={e => setObservacoes(e.target.value)}
                                className={`form-dark-input shadow-none rounded-4 p-3 ${conferencia.divergencia_total !== 0 ? 'border-danger' : 'border-secondary border-opacity-25'}`}
                                style={{ resize: 'none' }}
                            />
                        </Form.Group>

                        <div className="d-flex w-100 gap-3 mt-4">
                            <Button variant="light" className="w-50 py-3 fw-bold rounded-pill border shadow-sm text-secondary" style={{ backgroundColor: 'var(--bg-sidebar)', borderColor: 'var(--border-color)' }} onClick={() => setStep(1)}>
                                CORRIGIR VALORES
                            </Button>
                            <Button 
                                variant={conferencia?.divergencia_total !== 0 ? "danger" : "success"} 
                                className="w-50 py-3 fw-bold rounded-pill shadow-lg border-0" 
                                onClick={handleFechar} 
                                disabled={loading}
                            >
                                {loading ? <Spinner size="sm"/> : (conferencia?.divergencia_total !== 0 ? 'FECHAR COM DIVERGÊNCIA' : 'CONFIRMAR FECHAMENTO')}
                            </Button>
                        </div>
                    </div>
                )}
            </Modal.Body>

            <style>{`
                input[type=number]::-webkit-inner-spin-button, input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
                input[type=number] { -moz-appearance: textfield; }
                .ls-1 { letter-spacing: 0.5px; }
                .fade-in { animation: fadeIn 0.3s ease; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
                
                /* 🟢 LOGO GIGANTE E BONITA NO TOPO DA TELA */
                .logo-caixa-hero {
                    max-width: 140px;
                    max-height: 80px;
                    object-fit: contain;
                    /* O Efeito anti-branco para que não suma em fundos claros */
                    filter: drop-shadow(0px 0px 1px rgba(0,0,0,0.5));
                }
                
                body.dark-mode .logo-caixa-hero {
                    /* Efeito anti-preto no modo noturno */
                    filter: drop-shadow(0px 0px 1px rgba(255,255,255,0.5));
                }
                
                /* Esconde o botão de close default pra usar o do Bootstrap bonito no cantinho */
                .modal-header .btn-close {
                    display: none;
                }
            `}</style>
        </Modal>
    );
}