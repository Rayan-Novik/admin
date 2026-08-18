import React, { useState, useEffect } from 'react';
import { Modal, Table, Badge, Spinner, Alert } from 'react-bootstrap';
import api from '../../services/api';

// Formatador de Data
const formatDate = (dateStr) => {
    return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit', month: '2-digit', year: '2-digit',
        hour: '2-digit', minute: '2-digit'
    }).format(new Date(dateStr));
};

// ✅ Lógica de Formatação Precisa
const formatQty = (val, unit) => {
    const num = Number(val);
    if (isNaN(num)) return '0';

    // Lista explícita de unidades que DEVEM ter casas decimais
    const decimalUnits = ['KG', 'G', 'M', 'CM', 'L', 'ML', 'M2', 'M3', 'M³'];
    
    // Se a unidade estiver na lista, força 3 casas decimais
    if (decimalUnits.includes(unit)) {
        return num.toLocaleString('pt-BR', {
            minimumFractionDigits: 3,
            maximumFractionDigits: 3
        });
    }

    // Para todas as outras (UN, CX, PCT, PAR, etc.), trata como inteiro,
    // mas se por algum erro vier quebrado (ex: 1.5 UN), mostra até 3 casas para não esconder valor.
    return num.toLocaleString('pt-BR', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 3 
    });
};

const ProductStockViewModal = ({ show, onHide, productId, productName, productUnit }) => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (show && productId) {
            fetchHistory();
        }
    }, [show, productId]);

    const fetchHistory = async () => {
        try {
            setLoading(true);
            setError('');
            const { data } = await api.get(`/produtos/${productId}/rastreio`);
            setHistory(data);
        } catch (err) {
            setError('Não foi possível carregar o histórico.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal show={show} onHide={onHide} centered scrollable>
            <Modal.Header closeButton>
                <Modal.Title className="fs-6">
                    Movimentações: <span className="fw-bold">{productName}</span> 
                    {/* Exibe a unidade no cabeçalho */}
                    <Badge bg="light" text="dark" className="border ms-2">{productUnit || 'UN'}</Badge>
                </Modal.Title>
            </Modal.Header>
            <Modal.Body className="p-0">
                {loading ? (
                    <div className="text-center py-4"><Spinner size="sm" animation="border" /></div>
                ) : error ? (
                    <Alert variant="danger" className="m-3 small">{error}</Alert>
                ) : history.length === 0 ? (
                    <div className="text-center py-4 text-muted small">Nenhuma movimentação recente.</div>
                ) : (
                    <Table striped hover responsive className="mb-0 small">
                        <thead className="bg-light">
                            <tr>
                                <th className="ps-3">Data</th>
                                <th>Operação</th>
                                <th>Qtd</th>
                                <th>Saldo</th>
                            </tr>
                        </thead>
                        <tbody>
                            {history.map((item) => (
                                <tr key={item.id_movimentacao}>
                                    <td className="ps-3">{formatDate(item.data)}</td>
                                    <td>
                                        <Badge bg={item.tipo === 'ENTRADA' ? 'success' : 'secondary'} className="fw-normal">
                                            {item.tipo === 'ENTRADA' ? 'Entrada' : 'Saída'}
                                        </Badge>
                                        <div className="text-muted" style={{ fontSize: '0.7rem', marginTop: '2px' }}>
                                            {item.motivo}
                                        </div>
                                    </td>
                                    <td className={item.tipo === 'ENTRADA' ? 'text-success fw-bold' : 'text-danger fw-bold'}>
                                        {/* Usa a formatação correta baseada na unidade */}
                                        {item.tipo === 'ENTRADA' ? '+' : '-'}{formatQty(item.quantidade, productUnit)}
                                    </td>
                                    <td className="text-muted fw-bold">
                                        {formatQty(item.saldo_momento, productUnit)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                )}
            </Modal.Body>
        </Modal>
    );
};

export default ProductStockViewModal;