import React, { useState, useEffect } from 'react';
import { Button, Spinner, Form, Card, Row, Col, Badge } from 'react-bootstrap';
import { Trash2, Plus, LayoutTemplate } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { toast } from 'react-toastify';
import api from '../../../services/api';
import ImageUploader from '../../common/ImageUploader';

const LandingPageManager = () => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [pageSettings, setPageSettings] = useState({
        backgroundColor: '#000000',
        slug: 'clube',
        showServices: true
    });

    const [blocks, setBlocks] = useState([]);
    const [produtos, setProdutos] = useState([]);
    const [categorias, setCategorias] = useState([]);

    useEffect(() => {
        const loadData = async () => {
            try {
                const resConfig = await api.get('/configuracoes/LANDING_PAGE_CONFIG').catch(() => ({ data: null }));
                if (resConfig.data && resConfig.data.valor) {
                    const parsed = JSON.parse(resConfig.data.valor);
                    setPageSettings(parsed.pageSettings || { backgroundColor: '#000000', slug: 'clube', showServices: true });
                    setBlocks(parsed.blocks || []);
                }

                const [prodRes, catRes] = await Promise.all([
                    api.get('/produtos?limit=100').catch(() => ({ data: [] })),
                    api.get('/categorias').catch(() => ({ data: [] }))
                ]);
                setProdutos(prodRes.data.products || prodRes.data || []);
                setCategorias(catRes.data || []);
            } catch (error) {
                toast.error("Erro ao carregar a página.");
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    const addBlock = (type) => {
        const newBlock = { id: Date.now().toString(), type };
        
        switch (type) {
            case 'image':
                newBlock.url = '';
                newBlock.width = 250;
                newBlock.rounded = true;
                break;
            case 'h1':
                newBlock.text = 'TÍTULO PRINCIPAL';
                newBlock.color = '#F59E0B'; 
                break;
            case 'h2':
                newBlock.text = 'Subtítulo chamativo';
                newBlock.color = '#FFFFFF';
                break;
            case 'p':
                newBlock.text = 'Texto descritivo menor. Ideal para explicar as vantagens...';
                newBlock.color = '#CCCCCC';
                break;
            case 'button':
                newBlock.text = 'Assine já!';
                newBlock.bgColor = '#F59E0B';
                newBlock.textColor = '#FFFFFF';
                newBlock.actionType = 'scroll_services'; 
                newBlock.actionValue = '';
                break;
            case 'spacer':
                newBlock.height = 40;
                break;
            default: break;
        }
        
        setBlocks([...blocks, newBlock]);
    };

    const updateBlock = (id, field, value) => {
        setBlocks(blocks.map(b => b.id === id ? { ...b, [field]: value } : b));
    };

    const removeBlock = (id) => {
        setBlocks(blocks.filter(b => b.id !== id));
    };

    // 🟢 FUNÇÃO DO DRAG AND DROP
    const onDragEnd = (result) => {
        if (!result.destination) return; // Soltou fora da lista
        
        const items = Array.from(blocks);
        const [reorderedItem] = items.splice(result.source.index, 1);
        items.splice(result.destination.index, 0, reorderedItem);
        
        setBlocks(items);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await api.post('/configuracoes', {
                chave: 'LANDING_PAGE_CONFIG',
                valor: JSON.stringify({ pageSettings, blocks })
            });
            toast.success('Landing Page salva com sucesso!');
        } catch (error) {
            toast.error('Erro ao salvar a página.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="text-center p-5"><Spinner animation="border" /></div>;

    return (
        <Card className="border-0 shadow-none bg-transparent">
            <Card.Body className="p-0">
                <div className="d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom">
                    <div>
                        <h5 className="fw-bold text-dark mb-1"><LayoutTemplate className="me-2 text-primary"/> Construtor de Landing Page</h5>
                        <p className="text-muted small mb-0">Crie uma página de captura arrastando e configurando blocos.</p>
                    </div>
                    <Button variant="success" className="fw-bold px-4 rounded-pill shadow-sm" onClick={handleSave} disabled={saving}>
                        {saving ? <Spinner size="sm" /> : 'Salvar Página'}
                    </Button>
                </div>

                <Row className="g-4">
                    {/* COLUNA ESQUERDA: CONFIGURAÇÕES GERAIS E MENU DE BLOCOS */}
                    <Col lg={4}>
                        <Card className="border-1 border-light shadow-sm rounded-4 mb-4">
                            <Card.Body>
                                <h6 className="fw-bold text-primary mb-3">Configuração Geral</h6>
                                <Form.Group className="mb-3">
                                    <Form.Label className="small fw-bold text-muted d-block">Cor de Fundo da Página</Form.Label>
                                    <Form.Control type="color" value={pageSettings.backgroundColor} onChange={e => setPageSettings({...pageSettings, backgroundColor: e.target.value})} className="w-100 p-1 rounded" style={{ height: '40px' }} />
                                </Form.Group>
                                <Form.Group>
                                    <Form.Check 
                                        type="switch"
                                        label="Mostrar Grade de Serviços no final?"
                                        checked={pageSettings.showServices}
                                        onChange={e => setPageSettings({...pageSettings, showServices: e.target.checked})}
                                        className="fw-bold text-dark"
                                    />
                                </Form.Group>
                            </Card.Body>
                        </Card>

                        <Card className="border-1 border-light shadow-sm rounded-4">
                            <Card.Body>
                                <h6 className="fw-bold text-primary mb-3">Adicionar Bloco</h6>
                                <div className="d-grid gap-2">
                                    <Button variant="outline-dark" className="text-start" size="sm" onClick={() => addBlock('image')}><Plus size={16} className="me-2"/> Logo / Imagem</Button>
                                    <Button variant="outline-dark" className="text-start" size="sm" onClick={() => addBlock('h1')}><Plus size={16} className="me-2"/> Título Gigante (H1)</Button>
                                    <Button variant="outline-dark" className="text-start" size="sm" onClick={() => addBlock('h2')}><Plus size={16} className="me-2"/> Subtítulo (H2)</Button>
                                    <Button variant="outline-dark" className="text-start" size="sm" onClick={() => addBlock('p')}><Plus size={16} className="me-2"/> Parágrafo (P)</Button>
                                    <Button variant="outline-dark" className="text-start" size="sm" onClick={() => addBlock('button')}><Plus size={16} className="me-2"/> Botão de Ação</Button>
                                    <Button variant="outline-dark" className="text-start" size="sm" onClick={() => addBlock('spacer')}><Plus size={16} className="me-2"/> Espaço Vazio</Button>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>

                    {/* COLUNA DIREITA: OS BLOCOS COM DRAG AND DROP */}
                    <Col lg={8}>
                        {blocks.length === 0 ? (
                            <div className="text-center p-5 bg-white rounded-4 border border-dashed">
                                <p className="text-muted mb-0">Nenhum bloco adicionado. Escolha um ao lado.</p>
                            </div>
                        ) : (
                            <DragDropContext onDragEnd={onDragEnd}>
                                <Droppable droppableId="landing-blocks">
                                    {(provided) => (
                                        <div {...provided.droppableProps} ref={provided.innerRef} className="d-flex flex-column gap-3">
                                            
                                            {blocks.map((block, index) => (
                                                <Draggable key={block.id} draggableId={block.id} index={index}>
                                                    {(provided, snapshot) => (
                                                        <Card 
                                                            ref={provided.innerRef}
                                                            {...provided.draggableProps}
                                                            className={`border-1 rounded-4 transition-all ${snapshot.isDragging ? 'shadow border-primary' : 'shadow-sm border-light'}`}
                                                            style={{ ...provided.draggableProps.style, backgroundColor: '#ffffff' }}
                                                        >
                                                            <Card.Body className="p-3 d-flex gap-3">
                                                                
                                                                {/* 🟢 O "PUXADOR" PARA ARRASTAR */}
                                                                <div 
                                                                    {...provided.dragHandleProps} 
                                                                    className="d-flex flex-column align-items-center justify-content-center border-end pe-3"
                                                                    style={{ cursor: 'grab' }}
                                                                >
                                                                    <i className="bi bi-grip-vertical text-muted fs-3 mb-1"></i>
                                                                    <Badge bg="secondary" className="bg-opacity-10 text-secondary border px-2 py-1" style={{fontSize: '11px'}}>{index + 1}º</Badge>
                                                                </div>

                                                                {/* Propriedades do Bloco */}
                                                                <div className="flex-grow-1">
                                                                    <div className="d-flex justify-content-between align-items-center mb-3">
                                                                        <Badge bg="dark" className="text-uppercase px-3 py-2">{block.type}</Badge>
                                                                        <Button variant="link" className="text-danger p-0 m-0" onClick={() => removeBlock(block.id)}><Trash2 size={18}/></Button>
                                                                    </div>

                                                                    {block.type === 'image' && (
                                                                        <Row className="g-3 align-items-center">
                                                                            <Col md={6}>
                                                                                <ImageUploader imageUrl={block.url} onImageUpload={(url) => updateBlock(block.id, 'url', url)} />
                                                                            </Col>
                                                                            <Col md={3}>
                                                                                <Form.Label className="small fw-bold">Largura (px)</Form.Label>
                                                                                <Form.Control type="number" value={block.width} onChange={e => updateBlock(block.id, 'width', e.target.value)} />
                                                                            </Col>
                                                                            <Col md={3}>
                                                                                <Form.Check type="checkbox" label="Arredondar" checked={block.rounded} onChange={e => updateBlock(block.id, 'rounded', e.target.checked)} className="mt-md-4 fw-bold" />
                                                                            </Col>
                                                                        </Row>
                                                                    )}

                                                                    {(block.type === 'h1' || block.type === 'h2' || block.type === 'p') && (
                                                                        <Row className="g-3">
                                                                            <Col md={10}>
                                                                                <Form.Label className="small fw-bold">Texto Exibido</Form.Label>
                                                                                <Form.Control as={block.type === 'p' ? "textarea" : "input"} rows={2} value={block.text} onChange={e => updateBlock(block.id, 'text', e.target.value)} />
                                                                            </Col>
                                                                            <Col md={2}>
                                                                                <Form.Label className="small fw-bold">Cor</Form.Label>
                                                                                <Form.Control type="color" value={block.color} onChange={e => updateBlock(block.id, 'color', e.target.value)} className="w-100 p-1 shadow-sm" style={{height: '38px'}} />
                                                                            </Col>
                                                                        </Row>
                                                                    )}

                                                                    {block.type === 'button' && (
                                                                        <Row className="g-3">
                                                                            <Col md={8}>
                                                                                <Form.Label className="small fw-bold">Texto do Botão</Form.Label>
                                                                                <Form.Control type="text" value={block.text} onChange={e => updateBlock(block.id, 'text', e.target.value)} />
                                                                            </Col>
                                                                            <Col md={2}>
                                                                                <Form.Label className="small fw-bold">Fundo</Form.Label>
                                                                                <Form.Control type="color" value={block.bgColor} onChange={e => updateBlock(block.id, 'bgColor', e.target.value)} className="w-100 p-1 shadow-sm" style={{height: '38px'}}/>
                                                                            </Col>
                                                                            <Col md={2}>
                                                                                <Form.Label className="small fw-bold">Texto</Form.Label>
                                                                                <Form.Control type="color" value={block.textColor} onChange={e => updateBlock(block.id, 'textColor', e.target.value)} className="w-100 p-1 shadow-sm" style={{height: '38px'}}/>
                                                                            </Col>
                                                                            <Col md={6}>
                                                                                <Form.Label className="small fw-bold mt-2">Ação do Botão</Form.Label>
                                                                                <Form.Select value={block.actionType} onChange={e => updateBlock(block.id, 'actionType', e.target.value)}>
                                                                                    <option value="scroll_services">Rolar até os Serviços 👇</option>
                                                                                    <option value="produto">Abrir Serviço Específico</option>
                                                                                    <option value="url">Abrir Link Livre</option>
                                                                                </Form.Select>
                                                                            </Col>
                                                                            <Col md={6}>
                                                                                {block.actionType === 'produto' && (
                                                                                    <>
                                                                                        <Form.Label className="small fw-bold mt-2">Qual serviço?</Form.Label>
                                                                                        <Form.Select value={block.actionValue} onChange={e => updateBlock(block.id, 'actionValue', e.target.value)}>
                                                                                            <option value="">Selecione...</option>
                                                                                            {produtos.filter(p => p.tipo_produto === 'SERVICO').map(p => <option key={p.id_produto} value={p.id_produto}>{p.nome}</option>)}
                                                                                        </Form.Select>
                                                                                    </>
                                                                                )}
                                                                                {block.actionType === 'url' && (
                                                                                    <>
                                                                                        <Form.Label className="small fw-bold mt-2">Link da URL</Form.Label>
                                                                                        <Form.Control type="text" value={block.actionValue} onChange={e => updateBlock(block.id, 'actionValue', e.target.value)} placeholder="https://..." />
                                                                                    </>
                                                                                )}
                                                                            </Col>
                                                                        </Row>
                                                                    )}

                                                                    {block.type === 'spacer' && (
                                                                        <Row className="g-3">
                                                                            <Col md={4}>
                                                                                <Form.Label className="small fw-bold">Altura do Espaço (px)</Form.Label>
                                                                                <Form.Control type="number" value={block.height} onChange={e => updateBlock(block.id, 'height', e.target.value)} />
                                                                            </Col>
                                                                        </Row>
                                                                    )}
                                                                </div>
                                                            </Card.Body>
                                                        </Card>
                                                    )}
                                                </Draggable>
                                            ))}
                                            
                                            {provided.placeholder}
                                        </div>
                                    )}
                                </Droppable>
                            </DragDropContext>
                        )}
                    </Col>
                </Row>
            </Card.Body>
        </Card>
    );
};

export default LandingPageManager;