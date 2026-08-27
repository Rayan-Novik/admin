import React, { useState, useEffect } from 'react';
import { Container, Card, Row, Col, Form, Button, Spinner } from 'react-bootstrap';
import { toast } from 'react-toastify';
import api from '../../services/api';

// Lista fixa dos módulos que o sistema suporta
const MODULOS_DISPONIVEIS = [
    { 
        id: 'FISCAL', 
        nome: 'Módulo Fiscal', 
        icone: 'bi-receipt-cutoff text-primary', 
        descricao: 'Emissão de NFe, NFCe, notas de entrada e configurações tributárias.' 
    },
    { 
        id: 'PDV', 
        nome: 'Frente de Caixa (PDV)', 
        icone: 'bi-pc-display text-success', 
        descricao: 'Sistema de caixa balcão, controle de comandas e gerenciamento de mesas.' 
    },
    { 
        id: 'IFOOD', 
        nome: 'Integração iFood', 
        icone: 'bi-shop text-danger', 
        descricao: 'Sincronização automática de pedidos e catálogo com o iFood.' 
    }
];

const ModulosPage = () => {
    const [modulosAtivos, setModulosAtivos] = useState([]);
    const [mensagensErro, setMensagensErro] = useState({});
    const [loading, setLoading] = useState(true);
    const [salvando, setSalvando] = useState(false);

    useEffect(() => {
        buscarModulos();
    }, []);

    const buscarModulos = async () => {
        try {
            setLoading(true);
            // 🟢 O Date.now() impede que o navegador faça cache dessa rota!
            const { data } = await api.get(`/admin/modulos?_t=${Date.now()}`);
            
            const ativos = data.filter(m => m.ativo).map(m => m.modulo);
            setModulosAtivos(ativos);
            
            const msgs = {};
            data.forEach(m => { msgs[m.modulo] = m.mensagem_erro || ''; });
            setMensagensErro(msgs);
            
            localStorage.setItem('activeModules', JSON.stringify(ativos));
        } catch (error) {
            console.error('Erro ao buscar módulos', error);
            toast.error('Não foi possível carregar o status dos módulos.');
        } finally {
            setLoading(false);
        }
    };

    const handleToggle = (moduloId) => {
        setModulosAtivos(prev => 
            prev.includes(moduloId) 
                ? prev.filter(id => id !== moduloId) 
                : [...prev, moduloId]
        );
    };

    const handleMessageChange = (moduloId, text) => {
        setMensagensErro(prev => ({ ...prev, [moduloId]: text }));
    };

    const salvarConfiguracoes = async () => {
        try {
            setSalvando(true);
            
            // Prepara o payload para enviar ao backend
            const payload = MODULOS_DISPONIVEIS.map(mod => ({
                modulo: mod.id,
                ativo: modulosAtivos.includes(mod.id),
                mensagem_erro: mensagensErro[mod.id] || null
            }));

            await api.put('/admin/modulos', { modulos: payload });
            
            // Atualiza o frontend instantaneamente
            localStorage.setItem('activeModules', JSON.stringify(modulosAtivos));
            
            toast.success('Módulos atualizados com sucesso! A página será recarregada.');
            
            // Recarrega para aplicar as mudanças na Sidebar e Catraca
            setTimeout(() => window.location.reload(), 1500);

        } catch (error) {
            console.error('Erro ao salvar', error);
            toast.error('Erro ao salvar as configurações.');
        } finally {
            setSalvando(false);
        }
    };

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center h-100 mt-5">
                <Spinner animation="border" variant="primary" />
            </div>
        );
    }

    return (
        <Container fluid className="py-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h2 className="fw-bold mb-1"><i className="bi bi-puzzle me-2"></i>Gestão de Módulos</h2>
                    <p className="text-muted mb-0">Ligue ou desligue partes do sistema para manutenção.</p>
                </div>
                <Button 
                    variant="primary" 
                    onClick={salvarConfiguracoes} 
                    disabled={salvando}
                    className="px-4"
                >
                    {salvando ? <Spinner size="sm" className="me-2" /> : <i className="bi bi-save me-2"></i>}
                    Salvar Alterações
                </Button>
            </div>

            <Row className="g-4">
                {MODULOS_DISPONIVEIS.map((modulo) => {
                    const isAtivo = modulosAtivos.includes(modulo.id);
                    
                    return (
                        <Col md={6} lg={4} key={modulo.id}>
                            <Card className={`h-100 shadow-sm border-0 ${!isAtivo ? 'bg-light' : ''}`}>
                                <Card.Body>
                                    <div className="d-flex justify-content-between align-items-start mb-3">
                                        <div className="d-flex align-items-center">
                                            <div className="bg-white p-2 rounded shadow-sm me-3 border">
                                                <i className={`bi ${modulo.icone} fs-4`}></i>
                                            </div>
                                            <h5 className="fw-bold mb-0">{modulo.nome}</h5>
                                        </div>
                                        <Form.Check 
                                            type="switch"
                                            id={`switch-${modulo.id}`}
                                            className="fs-4"
                                            checked={isAtivo}
                                            onChange={() => handleToggle(modulo.id)}
                                        />
                                    </div>
                                    <Card.Text className="text-muted small">
                                        {modulo.descricao}
                                    </Card.Text>

                                    {!isAtivo && (
                                        <div className="mt-3 p-3 bg-warning bg-opacity-10 rounded border border-warning">
                                            <Form.Group>
                                                <Form.Label className="small fw-bold text-warning-emphasis mb-1">
                                                    <i className="bi bi-exclamation-triangle me-1"></i>
                                                    Mensagem de Manutenção
                                                </Form.Label>
                                                <Form.Control 
                                                    size="sm"
                                                    type="text" 
                                                    placeholder="Ex: Voltamos às 14h..."
                                                    value={mensagensErro[modulo.id] || ''}
                                                    onChange={(e) => handleMessageChange(modulo.id, e.target.value)}
                                                />
                                            </Form.Group>
                                        </div>
                                    )}
                                </Card.Body>
                            </Card>
                        </Col>
                    );
                })}
            </Row>
        </Container>
    );
};

export default ModulosPage;