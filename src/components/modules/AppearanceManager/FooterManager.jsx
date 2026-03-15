import React, { useState, useEffect } from 'react';
import { Card, Form, Button, Table, Row, Col, Tab, Nav } from 'react-bootstrap';
import api from '../../../services/api';
import { toast } from 'react-toastify';

const FooterManager = () => {
    const [links, setLinks] = useState({ linksRapidos: [], ajuda: [] });
    const [sobreTexto, setSobreTexto] = useState('');
    
    // Form States
    const [newLink, setNewLink] = useState({ titulo: '', url: '', coluna: 'links_rapidos', ordem: 0 });

    const fetchData = async () => {
        try {
            const { data } = await api.get('/footer'); // Chama a rota pública que retorna tudo organizado
            setLinks({ linksRapidos: data.linksRapidos, ajuda: data.ajuda });
            setSobreTexto(data.sobreTexto);
        } catch (error) { console.error(error); }
    };

    useEffect(() => { fetchData(); }, []);

    const handleAddLink = async (e) => {
        e.preventDefault();
        try {
            await api.post('/footer/link', newLink);
            toast.success('Link adicionado!');
            setNewLink({ titulo: '', url: '', coluna: 'links_rapidos', ordem: 0 });
            fetchData();
        } catch (error) { toast.error('Erro ao adicionar link'); }
    };

    const handleDeleteLink = async (id) => {
        if(window.confirm("Remover este link?")) {
            try {
                await api.delete(`/footer/link/${id}`);
                fetchData();
            } catch (error) { toast.error('Erro ao remover'); }
        }
    };

    const handleSaveSobre = async () => {
        try {
            await api.post('/footer/sobre', { texto: sobreTexto });
            toast.success('Texto atualizado!');
        } catch (error) { toast.error('Erro ao salvar texto'); }
    };

    return (
        <div className="p-4">
            <h3 className="mb-4">Gerenciar Rodapé</h3>
            
            <Row>
                {/* 1. Editor de Texto "Sobre a Loja" */}
                <Col md={12} className="mb-4">
                    <Card>
                        <Card.Header>Texto "Sobre a Loja"</Card.Header>
                        <Card.Body>
                            <Form.Control 
                                as="textarea" 
                                rows={3} 
                                value={sobreTexto} 
                                onChange={(e) => setSobreTexto(e.target.value)} 
                            />
                            <Button className="mt-2" onClick={handleSaveSobre}>Salvar Texto</Button>
                        </Card.Body>
                    </Card>
                </Col>

                {/* 2. Adicionar Novo Link */}
                <Col md={12} className="mb-4">
                    <Card>
                        <Card.Header>Adicionar Novo Link</Card.Header>
                        <Card.Body>
                            <Form onSubmit={handleAddLink}>
                                <Row>
                                    <Col md={3}>
                                        <Form.Control placeholder="Título (ex: FAQ)" value={newLink.titulo} onChange={e => setNewLink({...newLink, titulo: e.target.value})} required />
                                    </Col>
                                    <Col md={3}>
                                        <Form.Control placeholder="URL (ex: /faq)" value={newLink.url} onChange={e => setNewLink({...newLink, url: e.target.value})} required />
                                    </Col>
                                    <Col md={3}>
                                        <Form.Select value={newLink.coluna} onChange={e => setNewLink({...newLink, coluna: e.target.value})}>
                                            <option value="links_rapidos">Coluna: Links Rápidos</option>
                                            <option value="ajuda">Coluna: Ajuda</option>
                                        </Form.Select>
                                    </Col>
                                    <Col md={2}>
                                        <Form.Control type="number" placeholder="Ordem" value={newLink.ordem} onChange={e => setNewLink({...newLink, ordem: e.target.value})} />
                                    </Col>
                                    <Col md={1}>
                                        <Button type="submit" variant="success"><i className="fas fa-plus"></i></Button>
                                    </Col>
                                </Row>
                            </Form>
                        </Card.Body>
                    </Card>
                </Col>

                {/* 3. Listagem dos Links Atuais */}
                <Col md={6}>
                    <Card>
                        <Card.Header className="bg-primary text-white">Links Rápidos (Coluna 1)</Card.Header>
                        <Table striped hover size="sm">
                            <tbody>
                                {links.linksRapidos.map(link => (
                                    <tr key={link.id_link}>
                                        <td>{link.titulo}</td>
                                        <td className="text-muted small">{link.url}</td>
                                        <td className="text-end">
                                            <Button size="sm" variant="danger" onClick={() => handleDeleteLink(link.id_link)}><i className="fas fa-trash"></i></Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    </Card>
                </Col>

                <Col md={6}>
                    <Card>
                        <Card.Header className="bg-info text-white">Ajuda (Coluna 2)</Card.Header>
                        <Table striped hover size="sm">
                            <tbody>
                                {links.ajuda.map(link => (
                                    <tr key={link.id_link}>
                                        <td>{link.titulo}</td>
                                        <td className="text-muted small">{link.url}</td>
                                        <td className="text-end">
                                            <Button size="sm" variant="danger" onClick={() => handleDeleteLink(link.id_link)}><i className="fas fa-trash"></i></Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default FooterManager;