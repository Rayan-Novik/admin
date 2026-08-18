import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Spinner, Alert } from 'react-bootstrap';
import api from '../../services/api';

const UserStats = () => {
    const [stats, setStats] = useState({ today: 0, week: 0, month: 0 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchUserStats = async () => {
            try {
                const { data } = await api.get('/dashboard/user-stats');
                setStats(data);
            } catch (err) {
                setError('Não foi possível carregar as estatísticas de utilizadores.');
            } finally {
                setLoading(false);
            }
        };
        fetchUserStats();
    }, []);

    return (
        <Card className="shadow-sm h-100">
            <Card.Body>
                <Card.Title>Novos Clientes</Card.Title>
                 {loading ? <Spinner animation="border" size="sm" /> : error ? <Alert variant="danger" bsPrefix="alert-sm">{error}</Alert> : (
                    <Row className="text-center mt-3">
                        <Col>
                            <h4 className="mb-0">{stats.today}</h4>
                            <small className="text-muted">Hoje</small>
                        </Col>
                        <Col>
                            <h4 className="mb-0">{stats.week}</h4>
                            <small className="text-muted">Esta Semana</small>
                        </Col>
                        <Col>
                            <h4 className="mb-0">{stats.month}</h4>
                            <small className="text-muted">Este Mês</small>
                        </Col>
                    </Row>
                )}
            </Card.Body>
        </Card>
    );
};

export default UserStats;
