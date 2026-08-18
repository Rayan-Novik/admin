import React, { useState, useEffect } from 'react';
import { Printer, Network, Settings, Plus, Usb, Cpu } from 'lucide-react';
import { Spinner, Table, Form, Badge, Button, Modal, Card, Row, Col } from 'react-bootstrap';
import { toast } from 'react-toastify';
import api from '../../services/api';
import qz from 'qz-tray';

export default function ImpressorasPanel() {
    const [abaAtiva, setAbaAtiva] = useState('maquinas');
    const [impressoras, setImpressoras] = useState([]);
    const [categorias, setCategorias] = useState([]);
    const [loading, setLoading] = useState(true);

    const [modalOpen, setModalOpen] = useState(false);
    const [tipoConexaoModal, setTipoConexaoModal] = useState('REDE');
    const [novaImpressora, setNovaImpressora] = useState({ nome: '', endereco_ip: '', largura_papel: 80 });
    const [qzPrinters, setQzPrinters] = useState([]);

    // 🟢 Estados para as chaves de automação
    const [configAutomacao, setConfigAutomacao] = useState({
        IMPRIMIR_TERMICA_AUTO: false,
        IMPRIMIR_A4_AUTO: false
    });
    const [loadingConfig, setLoadingConfig] = useState(false);

    const carregarDados = async () => {
        try {
            setLoading(true);
            const [resImp, resCat, resConfigTermica, resConfigA4] = await Promise.all([
                api.get('/impressoras'),
                api.get('/categorias'),
                api.get('/configuracoes/IMPRIMIR_TERMICA_AUTO').catch(() => ({ data: { valor: 'false' } })),
                api.get('/configuracoes/IMPRIMIR_A4_AUTO').catch(() => ({ data: { valor: 'false' } }))
            ]);
            
            setImpressoras(resImp.data || []);
            setCategorias(resCat.data || []);
            
            setConfigAutomacao({
                IMPRIMIR_TERMICA_AUTO: resConfigTermica.data?.valor === 'true',
                IMPRIMIR_A4_AUTO: resConfigA4.data?.valor === 'true'
            });
        } catch (error) {
            toast.error("Erro ao carregar configurações de impressão.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        carregarDados();
    }, []);

    // 🟢 SALVAR AUTOMACAO NO BANCO
    const handleToggleAutomacao = async (chave, valorAtual) => {
        try {
            setLoadingConfig(true);
            const novoValor = !valorAtual;
            
            // Altera na API de configurações da loja
            await api.post('/configuracoes', {
                chave: chave,
                valor: String(novoValor)
            });

            setConfigAutomacao(prev => ({ ...prev, [chave]: novoValor }));
            toast.success("Preferência de automação atualizada!");
        } catch (error) {
            toast.error("Erro ao salvar preferência.");
        } finally {
            setLoadingConfig(false);
        }
    };

    const handleSalvarImpressora = async () => {
        if (!novaImpressora.nome) return toast.warning("Digite um nome para a impressora.");
        if (!novaImpressora.endereco_ip) return toast.warning("Defina o endereço IP ou selecione a impressora local.");

        try {
            const payload = {
                ...novaImpressora,
                tipo_conexao: tipoConexaoModal,
                is_padrao: impressoras.length === 0
            };
            
            await api.post('/impressoras', payload);
            toast.success("Máquina cadastrada com sucesso!");
            setModalOpen(false);
            carregarDados();
        } catch (error) {
            toast.error("Erro ao salvar impressora.");
        }
    };

    const handleRemoverImpressora = async (id) => {
        if (!window.confirm("Deseja realmente remover esta impressora? As categorias vinculadas a ela voltarão para o padrão.")) return;
        try {
            await api.delete(`/impressoras/${id}`);
            toast.success("Impressora removida!");
            carregarDados();
        } catch (error) {
            toast.error("Erro ao remover impressora.");
        }
    };

    const handleVincularCategoria = async (idCategoria, idImpressora) => {
        try {
            await api.put(`/impressoras/categorias/${idCategoria}`, { id_impressora: idImpressora || null });
            setCategorias(prev => prev.map(c => c.id_categoria === idCategoria ? { ...c, id_impressora: Number(idImpressora) } : c));
            toast.success("Regra de impressão updated!");
        } catch (error) {
            toast.error("Erro ao atualizar regra.");
        }
    };

    const buscarImpressorasQZ = async () => {
        try {
            if (!qz.websocket.isActive()) {
                await qz.websocket.connect();
            }
            const list = await qz.printers.find();
            setQzPrinters(list);
            toast.success("Impressoras locais carregadas!");
        } catch (error) {
            toast.error("QZ Tray não detectado localmente.");
        }
    };

    const testarImpressao = async (imp) => {
        try {
            if (!qz.websocket.isActive()) {
                await qz.websocket.connect();
            }
            let printerTarget = imp.endereco_ip;
            if (imp.tipo_conexao === 'REDE') {
                printerTarget = `raw://${imp.endereco_ip}:9100`;
            }
            const config = qz.configs.create(printerTarget);
            const data = [
                '\x1B\x40', '\x1B\x61\x01', '\x1B\x45\x01', 'TESTE DE CONEXAO\n', '\x1B\x45\x00',
                '--------------------------------\n', '\x1B\x61\x00', `Nome: ${imp.nome}\n`,
                `Alvo: ${printerTarget}\n`, '--------------------------------\n', '\x1B\x61\x01',
                'OK!\n', '\n\n\n\n\n\n', '\x1D\x56\x41\x10'
            ];
            await qz.print(config, data);
            toast.success("Teste enviado!");
        } catch (error) {
            toast.error("Erro no teste pelo QZ Tray.");
        }
    };

    if (loading) return <div className="text-center mt-5"><Spinner animation="border" variant="primary" /></div>;

    return (
        <div className="bg-white rounded-4 shadow-sm border overflow-hidden">
            <div className="d-flex border-bottom bg-light">
                <button className={`btn flex-grow-1 py-3 border-0 rounded-0 fw-bold d-flex justify-content-center align-items-center gap-2 ${abaAtiva === 'maquinas' ? 'bg-white text-primary border-bottom border-primary border-3' : 'text-secondary'}`} onClick={() => setAbaAtiva('maquinas')}>
                    <Printer size={20} /> Máquinas
                </button>
                <button className={`btn flex-grow-1 py-3 border-0 rounded-0 fw-bold d-flex justify-content-center align-items-center gap-2 ${abaAtiva === 'regras' ? 'bg-white text-primary border-bottom border-primary border-3' : 'text-secondary'}`} onClick={() => setAbaAtiva('regras')}>
                    <Settings size={20} /> Roteamento
                </button>
                <button className={`btn flex-grow-1 py-3 border-0 rounded-0 fw-bold d-flex justify-content-center align-items-center gap-2 ${abaAtiva === 'automacao' ? 'bg-white text-primary border-bottom border-primary border-3' : 'text-secondary'}`} onClick={() => setAbaAtiva('automacao')}>
                    <Cpu size={20} /> Automação e Fluxo
                </button>
            </div>

            <div className="p-4">
                {abaAtiva === 'maquinas' && (
                    <>
                        <div className="d-flex justify-content-between align-items-center mb-4">
                            <div>
                                <h5 className="fw-bold mb-0">Dispositivos Ativos</h5>
                                <small className="text-secondary">Gerencie hardware USB ou terminais IP de rede.</small>
                            </div>
                            <Button variant="primary" className="fw-bold d-flex align-items-center gap-2" onClick={() => setModalOpen(true)}>
                                <Plus size={18} /> Nova Impressora
                            </Button>
                        </div>
                        <div className="row g-3">
                            {impressoras.map(imp => (
                                <div className="col-md-6 col-lg-4" key={imp.id_impressora}>
                                    <div className="border rounded-4 p-3 position-relative bg-white shadow-sm">
                                        {imp.is_padrao && <Badge bg="success" className="position-absolute top-0 end-0 m-3">Padrão</Badge>}
                                        <h6 className="fw-bold mb-1">{imp.nome}</h6>
                                        <small className="text-secondary d-block mb-3">{imp.tipo_conexao} • {imp.endereco_ip}</small>
                                        <div className="d-flex justify-content-between border-top pt-2">
                                            <Button variant="link" className="text-danger p-0 text-decoration-none small" onClick={() => handleRemoverImpressora(imp.id_impressora)}>Remover</Button>
                                            <Button variant="link" className="text-primary p-0 text-decoration-none small" onClick={() => testarImpressao(imp)}>Testar</Button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}

                {abaAtiva === 'regras' && (
                    <div className="border rounded-4 overflow-hidden">
                        <Table hover className="mb-0 align-middle">
                            <thead className="bg-light">
                                <tr>
                                    <th className="py-3 px-4 small text-uppercase">Categoria</th>
                                    <th className="py-3 px-4 small text-uppercase">Destino</th>
                                </tr>
                            </thead>
                            <tbody>
                                {categorias.map(cat => (
                                    <tr key={cat.id_categoria}>
                                        <td className="px-4 py-3 fw-bold">{cat.nome}</td>
                                        <td className="px-4 py-3">
                                            <Form.Select value={cat.id_impressora || ''} onChange={(e) => handleVincularCategoria(cat.id_categoria, e.target.value)} className="shadow-sm border-light-subtle">
                                                <option value="">🚫 Impressora Padrão (Caixa)</option>
                                                {impressoras.map(imp => (
                                                    <option key={imp.id_impressora} value={imp.id_impressora}>🖨️ {imp.nome}</option>
                                                ))}
                                            </Form.Select>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    </div>
                )}

                {/* 🟢 NOVA ABA: CONFIGURAÇÕES DE DISPARO EM TEMPO REAL */}
                {abaAtiva === 'automacao' && (
                    <div>
                        <div className="mb-4">
                            <h5 className="fw-bold mb-0">Impressão em Tempo Real</h5>
                            <small className="text-secondary">Determine o comportamento do sistema assim que novos pedidos caírem no e-commerce ou iFood.</small>
                        </div>

                        <Row className="g-3">
                            <Col md={6}>
                                <Card className="border rounded-4 p-3 bg-light shadow-sm">
                                    <div className="d-flex justify-content-between align-items-start">
                                        <div>
                                            <h6 className="fw-bold mb-1 text-dark">Cupom Térmico Automático</h6>
                                            <p className="small text-secondary mb-0">Manda ordens diretamente para a impressora padrão do caixa sem intervenção humana.</p>
                                        </div>
                                        <Form.Check 
                                            type="switch"
                                            id="termica-auto-switch"
                                            disabled={loadingConfig}
                                            checked={configAutomacao.IMPRIMIR_TERMICA_AUTO}
                                            onChange={() => handleToggleAutomacao('IMPRIMIR_TERMICA_AUTO', configAutomacao.IMPRIMIR_TERMICA_AUTO)}
                                            style={{ transform: 'scale(1.2)' }}
                                        />
                                    </div>
                                </Card>
                            </Col>

                            <Col md={6}>
                                <Card className="border rounded-4 p-3 bg-light shadow-sm">
                                    <div className="d-flex justify-content-between align-items-start">
                                        <div>
                                            <h6 className="fw-bold mb-1 text-dark">Abertura Automática A4</h6>
                                            <p className="small text-secondary mb-0">Abre uma janela pop-up com a folha de expedição A4 no monitor principal ao receber a venda.</p>
                                        </div>
                                        <Form.Check 
                                            type="switch"
                                            id="a4-auto-switch"
                                            disabled={loadingConfig}
                                            checked={configAutomacao.IMPRIMIR_A4_AUTO}
                                            onChange={() => handleToggleAutomacao('IMPRIMIR_A4_AUTO', configAutomacao.IMPRIMIR_A4_AUTO)}
                                            style={{ transform: 'scale(1.2)' }}
                                        />
                                    </div>
                                </Card>
                            </Col>
                        </Row>
                    </div>
                )}
            </div>

            <Modal show={modalOpen} onHide={() => setModalOpen(false)} centered>
                <Modal.Header closeButton><Modal.Title className="fw-bold">Adicionar Impressora</Modal.Title></Modal.Header>
                <Modal.Body>
                    <div className="d-flex gap-2 mb-4">
                        <Button variant={tipoConexaoModal === 'REDE' ? 'primary' : 'outline-secondary'} className="flex-grow-1 fw-bold" onClick={() => { setTipoConexaoModal('REDE'); setNovaImpressora({...novaImpressora, endereco_ip: ''}); setQzPrinters([]); }}>Rede / Wi-Fi</Button>
                        <Button variant={tipoConexaoModal === 'USB' ? 'primary' : 'outline-secondary'} className="flex-grow-1 fw-bold" onClick={() => { setTipoConexaoModal('USB'); setNovaImpressora({...novaImpressora, endereco_ip: ''}); }}>USB / Local</Button>
                    </div>
                    {tipoConexaoModal === 'REDE' ? (
                        <>
                            <Form.Group className="mb-3">
                                <Form.Label className="fw-bold small text-secondary">Nome na Tela</Form.Label>
                                <Form.Control type="text" placeholder="Ex: Cozinha Quente" value={novaImpressora.nome} onChange={e => setNovaImpressora({...novaImpressora, nome: e.target.value})} />
                            </Form.Group>
                            <Form.Group className="mb-3">
                                <Form.Label className="fw-bold small text-secondary">Endereço IP</Form.Label>
                                <Form.Control type="text" placeholder="Ex: 192.168.1.110" value={novaImpressora.endereco_ip} onChange={e => setNovaImpressora({...novaImpressora, endereco_ip: e.target.value})} />
                            </Form.Group>
                        </>
                    ) : (
                        <div className="bg-light p-3 rounded-4 border mb-3">
                            <Form.Group className="mb-3">
                                <Form.Label className="fw-bold small text-secondary">Nome na Tela</Form.Label>
                                <Form.Control type="text" placeholder="Ex: Impressora do Caixa" value={novaImpressora.nome} onChange={e => setNovaImpressora({...novaImpressora, nome: e.target.value})} />
                            </Form.Group>
                            <Form.Group className="mb-2">
                                <Form.Label className="fw-bold small text-secondary">Nome Spooler Windows</Form.Label>
                                <div className="d-flex gap-2">
                                    <Form.Select value={novaImpressora.endereco_ip} onChange={e => setNovaImpressora({...novaImpressora, endereco_ip: e.target.value})} disabled={qzPrinters.length === 0}>
                                        <option value="">Selecione a máquina física...</option>
                                        {qzPrinters.map(p => <option key={p} value={p}>{p}</option>)}
                                    </Form.Select>
                                    <Button variant="dark" onClick={buscarImpressorasQZ}>Buscar</Button>
                                </div>
                            </Form.Group>
                        </div>
                    )}
                    <Form.Group>
                        <Form.Label className="fw-bold small text-secondary">Largura do Papel</Form.Label>
                        <Form.Select value={novaImpressora.largura_papel} onChange={e => setNovaImpressora({...novaImpressora, largura_papel: Number(e.target.value)})}>
                            <option value={80}>80mm (Padrão)</option>
                            <option value={58}>58mm (Pequena)</option>
                        </Form.Select>
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer><Button variant="primary" className="w-100 fw-bold" onClick={handleSalvarImpressora}>Salvar Máquina</Button></Modal.Footer>
            </Modal>
        </div>
    );
}