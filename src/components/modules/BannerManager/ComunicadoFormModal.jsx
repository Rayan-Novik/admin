import React, { useState, useEffect, useRef } from 'react';
import { Modal, Button, Form, Row, Col, InputGroup, Accordion, Badge } from 'react-bootstrap';
import ImageUploader from '../../common/ImageUploader';

const ComunicadoFormModal = ({ show, handleClose, onSave, comunicado }) => {
    const [settings, setSettings] = useState({
        titulo: '',
        imagem_url: '',
        link_url: '',
        ativo: true,
        // 🟢 Estilos e Posições (Novo)
        TITLE_SIZE: 32,
        TITLE_COLOR: '#ffffff',
        TITLE_BG: '#00000000',
        TITLE_POS_X: 50, TITLE_POS_Y: 20,
        
        SUBTITLE_TEXT: '',
        SUB_SIZE: 16,
        SUB_COLOR: '#ffffff',
        SUB_BG: '#00000000',
        SUB_POS_X: 50, SUB_POS_Y: 40,

        BTN_TEXT: 'Aproveitar!',
        BTN_BG: '#FF0000',
        BTN_TEXT_COLOR: '#FFFFFF',
        BTN_RADIUS: 50,
        BTN_POS_X: 50, BTN_POS_Y: 80,
    });

    useEffect(() => {
        if (comunicado) {
            // Se o comunicado já tiver configurações extras salvas num campo JSON "estilos" (Opcional)
            const estilos = comunicado.estilos ? JSON.parse(comunicado.estilos) : {};
            setSettings({ 
                ...settings, 
                ...comunicado, 
                ...estilos 
            });
        }
    }, [comunicado]);

    // 🟢 Drag & Drop Lógica
    const previewRef = useRef(null);
    const [draggingElement, setDraggingElement] = useState(null);

    const handleMouseDown = (e, element) => { e.preventDefault(); e.stopPropagation(); setDraggingElement(element); };
    const handleMouseUp = () => setDraggingElement(null);
    
    const handleMouseMove = (e) => {
        if (!draggingElement || !previewRef.current) return;
        const rect = previewRef.current.getBoundingClientRect();
        let x = ((e.clientX - rect.left) / rect.width) * 100;
        let y = ((e.clientY - rect.top) / rect.height) * 100;
        x = Math.max(0, Math.min(100, x)); y = Math.max(0, Math.min(100, y));

        if (draggingElement === 'title') setSettings(p => ({ ...p, TITLE_POS_X: x, TITLE_POS_Y: y }));
        if (draggingElement === 'subtitle') setSettings(p => ({ ...p, SUB_POS_X: x, SUB_POS_Y: y }));
        if (draggingElement === 'button') setSettings(p => ({ ...p, BTN_POS_X: x, BTN_POS_Y: y }));
    };

    useEffect(() => {
        if (draggingElement) {
            window.addEventListener('mousemove', handleMouseMove); window.addEventListener('mouseup', handleMouseUp);
        } else {
            window.removeEventListener('mousemove', handleMouseMove); window.removeEventListener('mouseup', handleMouseUp);
        }
        return () => { window.removeEventListener('mousemove', handleMouseMove); window.removeEventListener('mouseup', handleMouseUp); };
    }, [draggingElement, settings]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setSettings(p => ({ ...p, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleSaveClick = () => {
        // Empacota os estilos visuais num JSON para enviar ao backend (Se a tabela não tiver essas colunas)
        const payload = {
            titulo: settings.titulo,
            imagem_url: settings.imagem_url,
            link_url: settings.link_url,
            ativo: settings.ativo,
            estilos: JSON.stringify({
                TITLE_SIZE: settings.TITLE_SIZE, TITLE_COLOR: settings.TITLE_COLOR, TITLE_BG: settings.TITLE_BG,
                TITLE_POS_X: settings.TITLE_POS_X, TITLE_POS_Y: settings.TITLE_POS_Y,
                SUBTITLE_TEXT: settings.SUBTITLE_TEXT, SUB_SIZE: settings.SUB_SIZE, SUB_COLOR: settings.SUB_COLOR, SUB_BG: settings.SUB_BG,
                SUB_POS_X: settings.SUB_POS_X, SUB_POS_Y: settings.SUB_POS_Y,
                BTN_TEXT: settings.BTN_TEXT, BTN_BG: settings.BTN_BG, BTN_TEXT_COLOR: settings.BTN_TEXT_COLOR,
                BTN_RADIUS: settings.BTN_RADIUS, BTN_POS_X: settings.BTN_POS_X, BTN_POS_Y: settings.BTN_POS_Y
            })
        };
        onSave(payload);
    };

    return (
        <Modal show={show} onHide={handleClose} size="xl" backdrop="static">
            <Modal.Header closeButton className="bg-light">
                <Modal.Title className="fw-bold">{comunicado ? 'Editar' : 'Novo'} Pop-up (Comunicado)</Modal.Title>
            </Modal.Header>
            <Modal.Body className="p-4 bg-white">
                <Row className="g-4">
                    
                    {/* ESQUERDA: CONTROLES */}
                    <Col lg={5}>
                        <Form.Group className="mb-3">
                            <Form.Label className="fw-bold small">Status do Pop-up</Form.Label>
                            <Form.Check type="switch" label={settings.ativo ? "Ligado" : "Desligado"} name="ativo" checked={settings.ativo} onChange={handleChange} className="fw-bold text-success"/>
                        </Form.Group>

                        <div className="mb-3">
                            <label className="form-label fw-bold small text-muted text-uppercase">1. Imagem de Fundo (Ex: 800x800px)</label>
                            <ImageUploader imageUrl={settings.imagem_url} onImageUpload={url => setSettings({...settings, imagem_url: url})} />
                        </div>

                        <Form.Group className="mb-4">
                            <Form.Label className="fw-bold small">Link de Destino (Onde o Pop-up vai levar?)</Form.Label>
                            <Form.Control type="text" name="link_url" value={settings.link_url} onChange={handleChange} placeholder="https://..." />
                        </Form.Group>

                        <Accordion defaultActiveKey="0" className="shadow-sm">
                            <Accordion.Item eventKey="0">
                                <Accordion.Header>1. Título Principal</Accordion.Header>
                                <Accordion.Body className="bg-light">
                                    <Form.Control name="titulo" value={settings.titulo} onChange={handleChange} placeholder="Ex: Black Friday!" className="mb-2 fw-bold"/>
                                    <Row className="g-2 mb-2">
                                        <Col xs={6}><Form.Label className="small">Cor do Texto</Form.Label><Form.Control type="color" name="TITLE_COLOR" value={settings.TITLE_COLOR} onChange={handleChange}/></Col>
                                        <Col xs={6}><Form.Label className="small">Fundo</Form.Label><Form.Control type="color" name="TITLE_BG" value={settings.TITLE_BG} onChange={handleChange}/></Col>
                                    </Row>
                                    <Form.Label className="small">Tamanho: {settings.TITLE_SIZE}px</Form.Label>
                                    <Form.Range name="TITLE_SIZE" value={settings.TITLE_SIZE} onChange={handleChange} min={10} max={80} />
                                </Accordion.Body>
                            </Accordion.Item>

                            <Accordion.Item eventKey="1">
                                <Accordion.Header>2. Subtítulo (Texto Menor)</Accordion.Header>
                                <Accordion.Body className="bg-light">
                                    <Form.Control as="textarea" rows={2} name="SUBTITLE_TEXT" value={settings.SUBTITLE_TEXT} onChange={handleChange} placeholder="Descrição..." className="mb-2"/>
                                    <Row className="g-2 mb-2">
                                        <Col xs={6}><Form.Label className="small">Cor</Form.Label><Form.Control type="color" name="SUB_COLOR" value={settings.SUB_COLOR} onChange={handleChange}/></Col>
                                        <Col xs={6}><Form.Label className="small">Fundo</Form.Label><Form.Control type="color" name="SUB_BG" value={settings.SUB_BG} onChange={handleChange}/></Col>
                                    </Row>
                                    <Form.Label className="small">Tamanho: {settings.SUB_SIZE}px</Form.Label>
                                    <Form.Range name="SUB_SIZE" value={settings.SUB_SIZE} onChange={handleChange} min={10} max={60} />
                                </Accordion.Body>
                            </Accordion.Item>

                            <Accordion.Item eventKey="2">
                                <Accordion.Header>3. Botão de Ação</Accordion.Header>
                                <Accordion.Body className="bg-light">
                                    <Form.Control name="BTN_TEXT" value={settings.BTN_TEXT} onChange={handleChange} placeholder="Ex: Aproveitar" className="mb-2"/>
                                    <Row className="g-2 mb-2">
                                        <Col xs={6}><Form.Label className="small">Cor do Fundo</Form.Label><Form.Control type="color" name="BTN_BG" value={settings.BTN_BG} onChange={handleChange}/></Col>
                                        <Col xs={6}><Form.Label className="small">Cor do Texto</Form.Label><Form.Control type="color" name="BTN_TEXT_COLOR" value={settings.BTN_TEXT_COLOR} onChange={handleChange}/></Col>
                                    </Row>
                                    <Form.Label className="small">Arredondamento: {settings.BTN_RADIUS}px</Form.Label>
                                    <Form.Range name="BTN_RADIUS" value={settings.BTN_RADIUS} onChange={handleChange} min={0} max={50} />
                                </Accordion.Body>
                            </Accordion.Item>
                        </Accordion>
                    </Col>

                    {/* DIREITA: PREVIEW ARRASTÁVEL */}
                    <Col lg={7}>
                        <div className="d-flex justify-content-between align-items-center mb-2">
                            <h6 className="fw-bold m-0 text-secondary">Preview do Pop-up</h6>
                            <Badge bg="primary"><i className="bi bi-arrows-move"></i> Arraste na tela</Badge>
                        </div>

                        <div className="bg-dark p-4 rounded-4 d-flex justify-content-center align-items-center" style={{ minHeight: '500px', backgroundImage: 'radial-gradient(#444 1px, transparent 0)', backgroundSize: '20px 20px' }}>
                            {settings.imagem_url ? (
                                // A "Caixa" do Modal Virtual
                                <div ref={previewRef} className="position-relative overflow-hidden shadow-lg" style={{
                                    width: '100%', maxWidth: '400px', aspectRatio: '1/1', // Pop-up quadrado por padrão
                                    backgroundImage: `url(${settings.imagem_url})`, backgroundSize: 'cover', backgroundPosition: 'center', borderRadius: '16px'
                                }}>
                                    
                                    {/* TÍTULO */}
                                    {settings.titulo && (
                                        <div onMouseDown={(e) => handleMouseDown(e, 'title')} style={{
                                            position: 'absolute', left: `${settings.TITLE_POS_X}%`, top: `${settings.TITLE_POS_Y}%`, transform: 'translate(-50%, -50%)',
                                            cursor: draggingElement === 'title' ? 'grabbing' : 'grab', zIndex: 10, padding: '5px',
                                            border: draggingElement === 'title' ? '2px dashed white' : '1px dashed rgba(255,255,255,0.4)',
                                            backgroundColor: draggingElement === 'title' ? 'rgba(0,0,0,0.5)' : 'transparent'
                                        }}>
                                            <h3 className="m-0 fw-bold text-center" style={{ color: settings.TITLE_COLOR, fontSize: `${settings.TITLE_SIZE}px`, backgroundColor: settings.TITLE_BG, pointerEvents: 'none' }}>
                                                {settings.titulo}
                                            </h3>
                                        </div>
                                    )}

                                    {/* SUBTÍTULO */}
                                    {settings.SUBTITLE_TEXT && (
                                        <div onMouseDown={(e) => handleMouseDown(e, 'subtitle')} style={{
                                            position: 'absolute', left: `${settings.SUB_POS_X}%`, top: `${settings.SUB_POS_Y}%`, transform: 'translate(-50%, -50%)',
                                            cursor: draggingElement === 'subtitle' ? 'grabbing' : 'grab', zIndex: 10, padding: '5px',
                                            border: draggingElement === 'subtitle' ? '2px dashed white' : '1px dashed rgba(255,255,255,0.4)'
                                        }}>
                                            <p className="m-0 fw-medium text-center" style={{ color: settings.SUB_COLOR, fontSize: `${settings.SUB_SIZE}px`, backgroundColor: settings.SUB_BG, pointerEvents: 'none' }}>
                                                {settings.SUBTITLE_TEXT}
                                            </p>
                                        </div>
                                    )}

                                    {/* BOTÃO */}
                                    {settings.BTN_TEXT && (
                                        <div onMouseDown={(e) => handleMouseDown(e, 'button')} style={{
                                            position: 'absolute', left: `${settings.BTN_POS_X}%`, top: `${settings.BTN_POS_Y}%`, transform: 'translate(-50%, -50%)',
                                            cursor: draggingElement === 'button' ? 'grabbing' : 'grab', zIndex: 10, padding: '5px',
                                            border: draggingElement === 'button' ? '2px dashed white' : '1px dashed rgba(255,255,255,0.4)'
                                        }}>
                                            <span className="d-inline-block px-4 py-2 fw-bold" style={{ backgroundColor: settings.BTN_BG, color: settings.BTN_TEXT_COLOR, borderRadius: `${settings.BTN_RADIUS}px`, pointerEvents: 'none' }}>
                                                {settings.BTN_TEXT}
                                            </span>
                                        </div>
                                    )}

                                </div>
                            ) : (
                                <p className="text-white opacity-50 fw-bold m-0"><i className="bi bi-image d-block fs-1 text-center mb-2"></i>Faça upload da imagem de fundo</p>
                            )}
                        </div>
                    </Col>
                </Row>
            </Modal.Body>
            <Modal.Footer className="bg-light">
                <Button variant="secondary" onClick={handleClose}>Cancelar</Button>
                <Button variant="primary" onClick={handleSaveClick} className="fw-bold px-4">Salvar Pop-up</Button>
            </Modal.Footer>
        </Modal>
    );
};

export default ComunicadoFormModal;