import React, { useState, useEffect } from 'react';
import { Card, ListGroup, Spinner, Alert, Badge } from 'react-bootstrap';
import api from '../../services/api';
import { Link } from 'react-router-dom';

const TopSellingProducts = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchTopSelling = async () => {
            try {
                const { data } = await api.get('/dashboard/top-selling');
                setProducts(data);
            } catch (err) {
                setError('Não foi possível carregar os produtos mais vendidos.');
            } finally {
                setLoading(false);
            }
        };
        fetchTopSelling();
    }, []);

    return (
        <Card className="shadow-sm h-100">
            <Card.Body>
                <Card.Title>Produtos Mais Vendidos</Card.Title>
                {loading ? <Spinner animation="border" size="sm" /> : error ? <Alert variant="danger" bsPrefix="alert-sm">{error}</Alert> : (
                    <ListGroup variant="flush">
                        {products.map(product => (
                            <ListGroup.Item key={product.id_produto} className="d-flex justify-content-between align-items-center">
                                <Link to={`/admin/product/${product.id_produto}/edit`}>{product.nome}</Link>
                                <Badge bg="primary" pill>{product._sum.quantidade} vendidos</Badge>
                            </ListGroup.Item>
                        ))}
                    </ListGroup>
                )}
            </Card.Body>
        </Card>
    );
};

export default TopSellingProducts;
