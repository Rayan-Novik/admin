import React, { useState, useEffect } from 'react';
import { Modal, Button, Card, Badge, Form, Spinner, Alert } from 'react-bootstrap';
import { Monitor, Globe, ShieldAlert, Key, CheckCircle, RefreshCw, ArrowLeft, Cpu } from 'lucide-react';
import { toast } from 'react-toastify';
import {
    listarCaixasCadastrados,
    iniciarSessaoCaixa,
    assumirSessaoCaixa
} from './pdvService';

export default function CaixaSelectorModal({
    isOpen,
    onClose,
    onCaixaSelecionado,
    usuarioLogado
}) {
    const [caixas, setCaixas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [caixaParaAssumir, setCaixaParaAssumir] = useState(null);
    const [senhaOperador, setSenhaOperador] = useState('');
    const [loadingAcao, setLoadingAcao] = useState(false);
    const [erroAcao, setErroAcao] = useState('');

    useEffect(() => {
        if (isOpen) {
            carregarCaixas();
        }
    }, [isOpen]);

    const carregarCaixas = async () => {
        setLoading(true);
        setErroAcao('');
        try {
            const data = await listarCaixasCadastrados();
            setCaixas(data.caixas || []);
        } catch (err) {
            console.error('Erro ao carregar caixas:', err);
            toast.error('Não foi possível carregar os caixas cadastrados.');
        } finally {
            setLoading(false);
        }
    };

    const handleSelecionarCaixa = async (caixa) => {
        setErroAcao('');
        // Se o caixa já estiver ativo no EXE, precisa de senha do operador para assumir
        if (caixa.ambiente_ativo === 'EXE') {
            setCaixaParaAssumir(caixa);
            setSenhaOperador('');
            return;
        }

        // Se está livre ou já na Web, inicia a sessão
        setLoadingAcao(true);
        try {
            const res = await iniciarSessaoCaixa({
                caixa_id: caixa.id,
                ambiente: 'WEB',
                operador_id: usuarioLogado?.id || usuarioLogado?.id_usuario || usuarioLogado?.id_funcionario,
                operador_nome: usuarioLogado?.nome || usuarioLogado?.nome_completo || 'Operador Web',
                operador_codigo: usuarioLogado?.codigo_acesso || ''
            });

            if (res.success) {
                toast.success(`Caixa ${caixa.nome} selecionado! Série Web: ${caixa.serie_web}`);
                onCaixaSelecionado(caixa, res.session_token);
            }
        } catch (err) {
            if (err.response?.status === 409) {
                // Conflito: acabou de ser aberto no EXE
                setCaixaParaAssumir({
                    ...caixa,
                    ambiente_ativo: err.response.data.ambiente_ativo,
                    operador_ativo_nome: err.response.data.operador_nome
                });
            } else {
                toast.error(err.response?.data?.error || err.response?.data?.message || 'Erro ao iniciar sessão no caixa.');
            }
        } finally {
            setLoadingAcao(false);
        }
    };

    const handleConfirmarAssumir = async (e) => {
        e.preventDefault();
        if (!senhaOperador) {
            setErroAcao('Digite a senha do operador ativo ou de um Administrador.');
            return;
        }

        setLoadingAcao(true);
        setErroAcao('');

        try {
            const res = await assumirSessaoCaixa({
                caixa_id: caixaParaAssumir.id,
                ambiente: 'WEB',
                senha_operador: senhaOperador,
                operador_id: usuarioLogado?.id || usuarioLogado?.id_usuario || usuarioLogado?.id_funcionario,
                operador_nome: usuarioLogado?.nome || usuarioLogado?.nome_completo || 'Operador Web',
                operador_codigo: usuarioLogado?.codigo_acesso || ''
            });

            if (res.success) {
                toast.success(`Caixa assumido na Web! O PDV Desktop (.EXE) foi desconectado.`);
                const caixaAtualizado = {
                    ...caixaParaAssumir,
                    ambiente_ativo: 'WEB',
                    operador_ativo_nome: usuarioLogado?.nome || 'Operador Web'
                };
                setCaixaParaAssumir(null);
                onCaixaSelecionado(caixaAtualizado, res.session_token);
            }
        } catch (err) {
            setErroAcao(err.response?.data?.message || 'Senha incorreta. Não foi possível assumir o caixa.');
        } finally {
            setLoadingAcao(false);
        }
    };

    return (
        <>
            <Modal
                show={isOpen && !caixaParaAssumir}
                onHide={onClose}
                size="lg"
                centered
                backdrop="static"
                keyboard={false}
                className="modal-caixas-selector"
            >
                <Modal.Header className="border-0 pb-0 pt-4 px-4 d-flex justify-content-between align-items-center">
                    <div>
                        <div className="d-flex align-items-center gap-2 mb-1">
                            <span className="badge bg-primary-subtle text-primary border border-primary-subtle px-2 py-1 rounded-pill small font-monospace">
                                <Cpu size={13} className="me-1 inline" /> SELEÇÃO OBRIGATÓRIA DE TERMINAL
                            </span>
                        </div>
                        <h4 className="fw-bold mb-0 text-dark">Selecione o Caixa Cadastrado</h4>
                        <p className="text-muted small mb-0 mt-1">
                            Para operar o PDV Web é necessário selecionar um caixa real registrado no sistema.
                        </p>
                    </div>
                    <Button
                        variant="outline-secondary"
                        size="sm"
                        onClick={carregarCaixas}
                        disabled={loading}
                        className="rounded-3 shadow-sm d-flex align-items-center gap-1"
                        title="Atualizar lista"
                    >
                        <RefreshCw size={14} className={loading ? 'spin' : ''} />
                        <span>Atualizar</span>
                    </Button>
                </Modal.Header>

                <Modal.Body className="p-4">
                    {loading ? (
                        <div className="text-center py-5">
                            <Spinner animation="border" variant="primary" />
                            <p className="text-muted small mt-2">Consultando caixas cadastrados e sessões ativas...</p>
                        </div>
                    ) : caixas.length === 0 ? (
                        <Alert variant="warning" className="rounded-3 text-center py-4">
                            <h5>Nenhum caixa encontrado</h5>
                            <p className="mb-0 small text-muted">
                                Não há nenhum terminal de caixa cadastrado para sua empresa. Crie um novo caixa no menu de Caixas do PDV.
                            </p>
                        </Alert>
                    ) : (
                        <div className="d-flex flex-column gap-3">
                            {caixas.map((c) => {
                                const isNoExe = c.ambiente_ativo === 'EXE';
                                const isNaWeb = c.ambiente_ativo === 'WEB';
                                const isLivre = !c.ambiente_ativo;

                                return (
                                    <Card
                                        key={c.id}
                                        className={`border rounded-4 transition-all shadow-sm ${
                                            isNoExe
                                                ? 'border-warning bg-warning-subtle bg-opacity-10'
                                                : isNaWeb
                                                ? 'border-primary bg-primary-subtle bg-opacity-10'
                                                : 'border-light-subtle hover-shadow'
                                        }`}
                                    >
                                        <Card.Body className="p-3 d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
                                            <div>
                                                <div className="d-flex align-items-center gap-2 mb-1">
                                                    <span className="fw-bold fs-5 text-dark">{c.nome}</span>
                                                    <Badge bg="dark" className="rounded-pill px-2 py-1 font-monospace">
                                                        Caixa #{c.numero_caixa}
                                                    </Badge>
                                                    {c.token_conexao && (
                                                        <span className="badge bg-secondary-subtle text-secondary border small font-monospace">
                                                            {c.token_conexao}
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="d-flex flex-wrap align-items-center gap-2 text-muted small mt-2">
                                                    <span className="badge bg-light text-dark border font-monospace">
                                                        🖥️ Série Desktop (.EXE): <strong>{c.serie_exe || c.numero_caixa}</strong>
                                                    </span>
                                                    <span className="badge bg-success-subtle text-success border border-success-subtle font-monospace">
                                                        🌐 Série Web (Navegador): <strong>{c.serie_web || (50 + c.numero_caixa)}</strong>
                                                    </span>
                                                    {c.dispositivo_vinculado && (
                                                        <span className="badge bg-info-subtle text-info border border-info-subtle" title={c.hardware_id}>
                                                            🔒 PC Vinculado
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="mt-2">
                                                    {isNoExe && (
                                                        <span className="badge bg-warning text-dark px-2 py-1 rounded-pill small d-inline-flex align-items-center gap-1">
                                                            <Monitor size={12} /> Em uso no PDV Desktop (.EXE) por <strong>{c.operador_ativo_nome || 'Operador'}</strong>
                                                        </span>
                                                    )}
                                                    {isNaWeb && (
                                                        <span className="badge bg-primary text-white px-2 py-1 rounded-pill small d-inline-flex align-items-center gap-1">
                                                            <Globe size={12} /> Em uso na Web por <strong>{c.operador_ativo_nome || 'Operador'}</strong>
                                                        </span>
                                                    )}
                                                    {isLivre && (
                                                        <span className="badge bg-success-subtle text-success border border-success-subtle px-2 py-1 rounded-pill small d-inline-flex align-items-center gap-1">
                                                            <CheckCircle size={12} /> Disponível (Livre)
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="d-flex align-items-center gap-2">
                                                {isNoExe ? (
                                                    <Button
                                                        variant="warning"
                                                        className="fw-bold px-3 py-2 rounded-3 shadow-sm d-flex align-items-center gap-2"
                                                        onClick={() => handleSelecionarCaixa(c)}
                                                        disabled={loadingAcao}
                                                    >
                                                        <ShieldAlert size={16} />
                                                        <span>Assumir (.EXE → Web)</span>
                                                    </Button>
                                                ) : isNaWeb ? (
                                                    <Button
                                                        variant="primary"
                                                        className="fw-bold px-3 py-2 rounded-3 shadow-sm d-flex align-items-center gap-2"
                                                        onClick={() => handleSelecionarCaixa(c)}
                                                        disabled={loadingAcao}
                                                    >
                                                        <Globe size={16} />
                                                        <span>Continuar Operando</span>
                                                    </Button>
                                                ) : (
                                                    <Button
                                                        variant="success"
                                                        className="fw-bold px-3 py-2 rounded-3 shadow-sm d-flex align-items-center gap-2"
                                                        onClick={() => handleSelecionarCaixa(c)}
                                                        disabled={loadingAcao}
                                                    >
                                                        <CheckCircle size={16} />
                                                        <span>Operar este Caixa</span>
                                                    </Button>
                                                )}
                                            </div>
                                        </Card.Body>
                                    </Card>
                                );
                            })}
                        </div>
                    )}
                </Modal.Body>

                <Modal.Footer className="border-0 pt-0 px-4 pb-4 d-flex justify-content-between align-items-center">
                    <Button
                        variant="link"
                        className="text-muted text-decoration-none p-0 d-flex align-items-center gap-1"
                        onClick={onClose}
                    >
                        <ArrowLeft size={16} /> Voltar ao Painel Geral
                    </Button>
                    <small className="text-muted font-monospace" style={{ fontSize: '11px' }}>
                        Regra SEFAZ: Caixa 1 (Exe=1, Web=51) | Caixa 2 (Exe=2, Web=52)
                    </small>
                </Modal.Footer>
            </Modal>

            {/* Modal de confirmação com senha para assumir caixa em operação no EXE */}
            <Modal
                show={Boolean(caixaParaAssumir)}
                onHide={() => { if (!loadingAcao) setCaixaParaAssumir(null); }}
                centered
                backdrop="static"
                keyboard={false}
            >
                <Modal.Header closeButton={!loadingAcao} className="border-0 pb-0 pt-4 px-4">
                    <div className="d-flex align-items-center gap-2">
                        <div className="p-2 bg-warning-subtle text-warning rounded-circle">
                            <ShieldAlert size={24} />
                        </div>
                        <div>
                            <h5 className="fw-bold mb-0 text-dark">Assumir Caixa do PDV Desktop</h5>
                            <small className="text-muted">{caixaParaAssumir?.nome} (Série Web: {caixaParaAssumir?.serie_web})</small>
                        </div>
                    </div>
                </Modal.Header>

                <Form onSubmit={handleConfirmarAssumir}>
                    <Modal.Body className="px-4 py-3">
                        <Alert variant="warning" className="rounded-3 small mb-3">
                            <p className="mb-1 fw-bold">
                                🖥️ Este caixa está sendo operado no aplicativo de computador (.EXE) por:
                            </p>
                            <p className="mb-0 fs-6 text-dark font-monospace fw-bold">
                                {caixaParaAssumir?.operador_ativo_nome || 'Operador do Terminal'}
                            </p>
                        </Alert>

                        <p className="small text-muted mb-3">
                            Para assumir este caixa na versão Web e <strong>desconectar a sessão do PDV Desktop (.EXE)</strong>, informe a senha do operador ativo ou de um Administrador/Gerente da loja:
                        </p>

                        {erroAcao && (
                            <Alert variant="danger" className="py-2 small rounded-3 mb-3">
                                {erroAcao}
                            </Alert>
                        )}

                        <Form.Group className="mb-3">
                            <Form.Label className="small fw-bold text-dark">
                                <Key size={14} className="me-1 inline" /> Senha do Operador / Administrador:
                            </Form.Label>
                            <Form.Control
                                type="password"
                                placeholder="Digite a senha para autorizar"
                                value={senhaOperador}
                                onChange={(e) => setSenhaOperador(e.target.value)}
                                autoFocus
                                required
                                className="rounded-3 py-2 font-monospace"
                                disabled={loadingAcao}
                            />
                        </Form.Group>
                    </Modal.Body>

                    <Modal.Footer className="border-0 pt-0 px-4 pb-4 d-flex justify-content-end gap-2">
                        <Button
                            variant="light"
                            onClick={() => setCaixaParaAssumir(null)}
                            disabled={loadingAcao}
                            className="rounded-3"
                        >
                            Cancelar
                        </Button>
                        <Button
                            variant="warning"
                            type="submit"
                            disabled={loadingAcao}
                            className="rounded-3 fw-bold shadow-sm d-flex align-items-center gap-2"
                        >
                            {loadingAcao ? (
                                <>
                                    <Spinner size="sm" animation="border" />
                                    <span>Assumindo...</span>
                                </>
                            ) : (
                                <>
                                    <ShieldAlert size={16} />
                                    <span>Assumir e Desconectar Desktop</span>
                                </>
                            )}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>
        </>
    );
}
