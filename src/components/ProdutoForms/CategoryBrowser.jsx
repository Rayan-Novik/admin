import React, { useState, useEffect } from 'react';
import { Modal, Button, ListGroup, Col, Row, Spinner, Badge, Breadcrumb, Alert } from 'react-bootstrap';
import api from '../../services/api';

const CategoryBrowser = ({ show, onHide, onCategorySelect }) => {
    const [path, setPath] = useState([]); // Guarda o caminho: [{id, name}, {id, name}]
    const [currentCategories, setCurrentCategories] = useState([]); // Apenas a lista de categorias do nível atual
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Hook para detectar se a tela é pequena
    const useIsMobile = (breakpoint = 768) => {
        const [isMobile, setIsMobile] = useState(window.innerWidth < breakpoint);
        useEffect(() => {
            const handleResize = () => setIsMobile(window.innerWidth < breakpoint);
            window.addEventListener('resize', handleResize);
            return () => window.removeEventListener('resize', handleResize);
        }, [breakpoint]);
        return isMobile;
    };
    const isMobile = useIsMobile();

    // Carrega as categorias com base no caminho atual (path)
    const fetchCategories = async (currentPath) => {
        setLoading(true);
        setError('');
        try {
            if (currentPath.length === 0) {
                // Se o caminho está vazio, busca as categorias raiz
                const { data } = await api.get('/mercadolivre/categories');
                setCurrentCategories(data);
            } else {
                // Se há um caminho, busca os filhos da última categoria
                const lastCategoryId = currentPath[currentPath.length - 1].id;
                const { data } = await api.get(`/mercadolivre/categories/${lastCategoryId}`);
                setCurrentCategories(data.children_categories || []);
            }
        } catch (err) {
            setError('Não foi possível carregar as categorias.');
        } finally {
            setLoading(false);
        }
    };
    
    // Efeito para carregar as categorias raiz quando o modal abre
    useEffect(() => {
        if (show) {
            setPath([]);
            fetchCategories([]);
        }
    }, [show]);

    // Lida com a seleção de uma categoria
    const handleSelect = async (category) => {
        setLoading(true);
        const { data: details } = await api.get(`/mercadolivre/categories/${category.id}`);
        setLoading(false);

        if (details.children_categories && details.children_categories.length > 0) {
            // Se tem filhos, avança no caminho e busca os filhos
            const newPath = [...path, { id: category.id, name: category.name }];
            setPath(newPath);
            setCurrentCategories(details.children_categories);
        } else {
            // Se não tem filhos, é a categoria final
            onCategorySelect(details);
            onHide();
        }
    };

    // Lida com cliques no Breadcrumb para voltar
    const handlePathClick = (index) => {
        const newPath = path.slice(0, index);
        setPath(newPath);
        fetchCategories(newPath);
    };

    return (
        <Modal show={show} onHide={onHide} size="lg" centered scrollable>
            <Modal.Header closeButton>
                <Modal.Title>Selecionar Categoria do Mercado Livre</Modal.Title>
            </Modal.Header>
            <Modal.Body style={{ minHeight: '400px' }}>
                {/* Breadcrumb para navegação */}
                <Breadcrumb>
                    <Breadcrumb.Item active={path.length === 0} onClick={() => handlePathClick(0)}>
                        Categorias
                    </Breadcrumb.Item>
                    {path.map((p, i) => (
                        <Breadcrumb.Item key={p.id} active={i === path.length - 1} onClick={() => handlePathClick(i + 1)}>
                            {p.name}
                        </Breadcrumb.Item>
                    ))}
                </Breadcrumb>
                <hr className="mt-2" />

                {loading ? (
                    <div className="d-flex justify-content-center align-items-center" style={{ height: '300px' }}><Spinner /></div>
                ) : error ? (
                    <Alert variant="danger">{error}</Alert>
                ) : (
                    <ListGroup variant="flush">
                        {currentCategories.map(cat => (
                            <ListGroup.Item
                                key={cat.id}
                                action
                                onClick={() => handleSelect(cat)}
                                className="d-flex justify-content-between align-items-center"
                            >
                                {cat.name}
                                <i className="fas fa-chevron-right text-muted"></i>
                            </ListGroup.Item>
                        ))}
                    </ListGroup>
                )}
            </Modal.Body>
        </Modal>
    );
};

export default CategoryBrowser;