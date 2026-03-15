import React, { useState, useEffect } from 'react';
import { Modal, Form, Button, Row, Col, InputGroup, Spinner, Alert } from 'react-bootstrap';
import api from '../../../services/api';

const SqlLegacyModal = ({ show, onHide, initialData, onUpdateSuccess }) => {
    const [config, setConfig] = useState({ 
        host: '', port: 1433, user: '', password: '', database: '', tabela_origem: '', ativo: false, intervalo_sync: 10 
    });
    
    const [loading, setLoading] = useState(false);
    const [testing, setTesting] = useState(false);
    const [syncing, setSyncing] = useState(false);
    const [msg, setMsg] = useState({ type: '', text: '' });

    // Atualiza o formulário quando os dados vêm do pai
    useEffect(() => {
        if (initialData) {
            // Garante valores padrão
            setConfig(prev => ({ ...prev, ...initialData, intervalo_sync: initialData.intervalo_sync || 10 }));
        }
    }, [initialData]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        const finalValue = type === 'checkbox' ? checked : (name === 'intervalo_sync' || name === 'port' ? Number(value) : value);
        setConfig(prev => ({ ...prev, [name]: finalValue }));
    };

    const handleTest = async () => {
        setTesting(true); setMsg({});
        try {
            const { data } = await api.post('/integracao/test', config);
            setMsg({ type: 'success', text: data.message });
        } catch (err) {
            setMsg({ type: 'danger', text: err.response?.data?.message || 'Falha na conexão.' });
        } finally {
            setTesting(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault(); setLoading(true); setMsg({});
        try {
            await api.post('/integracao', config);
            onUpdateSuccess(); // Avisa o pai para recarregar os status
            onHide(); // Fecha o modal
        } catch (err) {
            setMsg({ type: 'danger', text: 'Erro ao salvar configuração.' });
        } finally {
            setLoading(false);
        }
    };

    const handleSyncNow = async () => {
        if(!window.confirm("Deseja forçar a sincronização agora?")) return;
        setSyncing(true); setMsg({});
        try {
            const { data } = await api.post('/integracao/sync');
            setMsg({ type: 'success', text: data.message });
        } catch (err) {
            setMsg({ type: 'danger', text: 'Erro ao sincronizar.' });
        } finally {
            setSyncing(false);
        }
    };

    return (
        <Modal show={show} onHide={onHide} centered size="lg">
            <Modal.Header closeButton className="border-0 pb-0"><Modal.Title className="fw-bold">Banco de Dados Externo (SQL Server)</Modal.Title></Modal.Header>
            <Modal.Body className="p-4">
                <Alert variant="secondary" className="small mb-4">
                    <i className="bi bi-server me-2"></i>
                    Conecte o banco de dados do seu cliente para sincronizar produtos automaticamente.
                </Alert>

                {msg.text && <Alert variant={msg.type} dismissible onClose={() => setMsg({})}>{msg.text}</Alert>}
                
                <Form onSubmit={handleSave}>
                    <div className="d-flex justify-content-between align-items-center mb-3 bg-light p-3 rounded">
                        <span className="fw-bold">Status da Integração</span>
                        <Form.Check 
                            type="switch" id="legacy-active-switch"
                            label={config.ativo ? "Habilitado" : "Desabilitado"}
                            name="ativo" checked={config.ativo} onChange={handleChange}
                            className="fw-medium"
                        />
                    </div>

                    <div className="mb-4">
                        <Form.Label className="fw-medium">Frequência de Sincronização</Form.Label>
                        <Form.Select name="intervalo_sync" value={config.intervalo_sync} onChange={handleChange}>
                            <option value="5">A cada 5 minutos</option>
                            <option value="10">A cada 10 minutos (Padrão)</option>
                            <option value="30">A cada 30 minutos</option>
                            <option value="60">A cada 1 hora</option>
                            <option value="1440">Uma vez por dia (24h)</option>
                        </Form.Select>
                    </div>

                    <Row className="g-3">
                        <Col md={8}><Form.Group><Form.Label>Host / IP</Form.Label><Form.Control name="host" value={config.host} onChange={handleChange} required /></Form.Group></Col>
                        <Col md={4}><Form.Group><Form.Label>Porta</Form.Label><Form.Control type="number" name="port" value={config.port} onChange={handleChange} required /></Form.Group></Col>
                        <Col md={6}><Form.Group><Form.Label>Usuário</Form.Label><Form.Control name="user" value={config.user} onChange={handleChange} required /></Form.Group></Col>
                        <Col md={6}><Form.Group><Form.Label>Senha</Form.Label><Form.Control type="password" name="password" value={config.password} onChange={handleChange} required placeholder={config.password ? '********' : ''} /></Form.Group></Col>
                        <Col md={6}><Form.Group><Form.Label>Database</Form.Label><Form.Control name="database" value={config.database} onChange={handleChange} required /></Form.Group></Col>
                        <Col md={6}><Form.Group><Form.Label>Tabela Origem</Form.Label><Form.Control name="tabela_origem" value={config.tabela_origem} onChange={handleChange} /></Form.Group></Col>
                    </Row>

                    <div className="d-flex gap-2 mt-4 pt-2 border-top">
                        <Button variant="outline-dark" className="w-50" onClick={handleTest} disabled={testing}>
                            {testing ? <Spinner size="sm" animation="border" /> : <><i className="bi bi-wifi me-2"></i>Testar Conexão</>}
                        </Button>
                        <Button variant="primary" type="submit" className="w-50" disabled={loading}>
                            {loading ? <Spinner size="sm" animation="border" /> : <><i className="bi bi-save me-2"></i>Salvar Config</>}
                        </Button>
                    </div>

                    {config.ativo && config.host && (
                        <div className="mt-3">
                            <Button variant="warning" className="w-100 fw-bold text-dark" onClick={handleSyncNow} disabled={syncing}>
                                {syncing ? <><Spinner size="sm" /> Sincronizando...</> : <><i className="bi bi-arrow-repeat me-2"></i> Forçar Sincronização</>}
                            </Button>
                        </div>
                    )}
                </Form>
            </Modal.Body>
        </Modal>
    );
};

export default SqlLegacyModal;