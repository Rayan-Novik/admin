import React, { useState, useEffect } from 'react';
import { Form, Button, Table, Row, Col } from 'react-bootstrap';
import api from '../../../services/api';
import { toast } from 'react-toastify';

const FooterManager = () => {
    const [links, setLinks] = useState({ linksRapidos: [], ajuda: [] });
    const [sobreTexto, setSobreTexto] = useState('');
    const [newLink, setNewLink] = useState({ titulo: '', url: '', coluna: 'links_rapidos', ordem: 0 });

    const fetchData = async () => {
        try {
            const { data } = await api.get('/footer');
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
            toast.success('Texto do rodapé atualizado!');
        } catch (error) { toast.error('Erro ao salvar texto'); }
    };

    return (
        <div className="footer-manager-clean p-4 rounded-4 border" style={{ backgroundColor: 'var(--bg-sidebar)', borderColor: 'var(--border-color)' }}>
            
            {/* Texto Sobre a Loja */}
            <div className="mb-5 pb-4 border-bottom" style={{ borderColor: 'var(--border-color)' }}>
                <h6 className="fw-bold mb-3" style={{ color: 'var(--text-primary)' }}>Texto "Sobre a Loja"</h6>
                <Form.Control 
                    as="textarea" 
                    rows={2} 
                    value={sobreTexto} 
                    onChange={(e) => setSobreTexto(e.target.value)} 
                    placeholder="Escreva um breve resumo sobre a sua loja..."
                    className="mb-3 border shadow-none form-dark-input"
                    style={{ fontSize: '13px' }}
                />
                <Button size="sm" variant="outline-primary" className="fw-medium px-4 py-2 rounded-3" onClick={handleSaveSobre}>Salvar Texto</Button>
            </div>

            {/* Adicionar Link */}
            <div className="mb-5">
                <h6 className="fw-bold mb-3" style={{ color: 'var(--text-primary)' }}>Adicionar Novo Link</h6>
                <Form onSubmit={handleAddLink} className="p-3 rounded-3 border" style={{ backgroundColor: 'var(--bg-main)', borderColor: 'var(--border-color)' }}>
                    <Row className="g-3 align-items-center">
                        <Col lg={3}>
                            <Form.Control className="form-dark-input shadow-none border" size="sm" placeholder="Título (ex: Política de Troca)" value={newLink.titulo} onChange={e => setNewLink({...newLink, titulo: e.target.value})} style={{ fontSize: '13px' }} required />
                        </Col>
                        <Col lg={4}>
                            <Form.Control className="form-dark-input shadow-none border" size="sm" placeholder="URL (ex: /politicas)" value={newLink.url} onChange={e => setNewLink({...newLink, url: e.target.value})} style={{ fontSize: '13px' }} required />
                        </Col>
                        <Col lg={3}>
                            <Form.Select className="form-dark-input shadow-none border" size="sm" value={newLink.coluna} onChange={e => setNewLink({...newLink, coluna: e.target.value})} style={{ fontSize: '13px' }}>
                                <option value="links_rapidos">Coluna 1: Links Rápidos</option>
                                <option value="ajuda">Coluna 2: Ajuda e Suporte</option>
                            </Form.Select>
                        </Col>
                        <Col lg={2}>
                            <Button type="submit" size="sm" variant="dark" className="w-100 fw-medium rounded-3 border-0" style={{ backgroundColor: 'var(--text-primary)', color: 'var(--bg-sidebar)' }}>Adicionar</Button>
                        </Col>
                    </Row>
                </Form>
            </div>

            {/* Listagem de Links */}
            <Row className="g-5">
                <Col md={6}>
                    <h6 className="fw-bold text-uppercase mb-3" style={{ fontSize: '12px', color: 'var(--text-secondary)', letterSpacing: '0.5px' }}>Coluna 1: Links Rápidos</h6>
                    <div className="border rounded-3" style={{ borderColor: 'var(--border-color)' }}>
                        <Table size="sm" borderless hover className="bg-transparent mb-0">
                            <tbody>
                                {links.linksRapidos.map(link => (
                                    <tr key={link.id_link} className="border-bottom hover-effect" style={{ borderColor: 'var(--border-color)' }}>
                                        <td className="py-3 ps-3 fw-medium" style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{link.titulo}</td>
                                        <td className="py-3 text-end pe-3">
                                            <Button size="sm" variant="link" className="text-danger p-0 text-decoration-none fw-medium" style={{ fontSize: '12px' }} onClick={() => handleDeleteLink(link.id_link)}>Remover</Button>
                                        </td>
                                    </tr>
                                ))}
                                {links.linksRapidos.length === 0 && <tr><td colSpan="2" className="text-center py-4 opacity-50" style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Nenhum link cadastrado.</td></tr>}
                            </tbody>
                        </Table>
                    </div>
                </Col>
                <Col md={6}>
                    <h6 className="fw-bold text-uppercase mb-3" style={{ fontSize: '12px', color: 'var(--text-secondary)', letterSpacing: '0.5px' }}>Coluna 2: Ajuda</h6>
                    <div className="border rounded-3" style={{ borderColor: 'var(--border-color)' }}>
                        <Table size="sm" borderless hover className="bg-transparent mb-0">
                            <tbody>
                                {links.ajuda.map(link => (
                                    <tr key={link.id_link} className="border-bottom hover-effect" style={{ borderColor: 'var(--border-color)' }}>
                                        <td className="py-3 ps-3 fw-medium" style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{link.titulo}</td>
                                        <td className="py-3 text-end pe-3">
                                            <Button size="sm" variant="link" className="text-danger p-0 text-decoration-none fw-medium" style={{ fontSize: '12px' }} onClick={() => handleDeleteLink(link.id_link)}>Remover</Button>
                                        </td>
                                    </tr>
                                ))}
                                {links.ajuda.length === 0 && <tr><td colSpan="2" className="text-center py-4 opacity-50" style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Nenhum link cadastrado.</td></tr>}
                            </tbody>
                        </Table>
                    </div>
                </Col>
            </Row>

            <style>{`
                .hover-effect:hover td { background-color: var(--bg-hover) !important; }
            `}</style>
        </div>
    );
};

export default FooterManager;