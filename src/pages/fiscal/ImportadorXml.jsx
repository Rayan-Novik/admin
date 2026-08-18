import React, { useState, useEffect } from 'react';
import { Card, Button, Table, Form, Alert, Spinner, Badge } from 'react-bootstrap';
import api from '../../services/api';
import { toast } from 'react-toastify';

export default function ImportadorXml() {
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [dadosNota, setDadosNota] = useState(null);
    const [produtosSistema, setProdutosSistema] = useState([]);

    useEffect(() => {
        api.get('/produtos').then(res => setProdutosSistema(res.data)).catch(console.error);
    }, []);

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!file) return toast.warn("Selecione um arquivo XML.");

        setLoading(true);
        const formData = new FormData();
        formData.append('xml', file);

        try {
            const { data } = await api.post('/fiscal/entrada/importar', formData);
            
            const itensFormatados = data.itens.map(itemXml => {
                const sugestao = produtosSistema.find(p => p.id_externo === itemXml.ean || p.nome.toUpperCase() === itemXml.nome.toUpperCase());
                return { 
                    ...itemXml, 
                    id_produto_vinculado: sugestao ? sugestao.id_produto : '',
                    fator_conversao: 1 // 🟢 Valor padrão é 1 pra 1
                };
            });

            setDadosNota({ ...data, itens: itensFormatados });
            toast.success("XML lido! Faça a vinculação e a conversão.");
        } catch (err) {
            toast.error(err.response?.data?.message || "Erro ao ler o XML.");
        } finally {
            setLoading(false);
        }
    };

    const handleItemChange = (index, campo, valor) => {
        const novosItens = [...dadosNota.itens];
        novosItens[index][campo] = valor;
        setDadosNota({ ...dadosNota, itens: novosItens });
    };

    const confirmarImportacao = async () => {
        setLoading(true);
        try {
            await api.post('/fiscal/entrada/confirmar', dadosNota);
            toast.success("Nota salva e estoque atualizado com sucesso!");
            setDadosNota(null);
            setFile(null);
        } catch (err) {
            toast.error("Erro ao salvar a nota.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mt-4 mb-5">
            <h2 className="mb-4"><i className="bi bi-box-arrow-in-down me-2"></i>Entrada de Notas (XML)</h2>

            {!dadosNota ? (
                <Card className="shadow-sm p-4 text-center border-0 rounded-4">
                    <h5 className="mb-3 text-muted">Faça o upload do XML do Fornecedor</h5>
                    <Form onSubmit={handleUpload} className="d-flex justify-content-center gap-3">
                        <Form.Control type="file" accept=".xml" onChange={e => setFile(e.target.files[0])} style={{ maxWidth: '400px' }} />
                        <Button type="submit" variant="primary" disabled={loading || !file} className="fw-bold px-4">
                            {loading ? <Spinner size="sm" /> : 'Ler Arquivo XML'}
                        </Button>
                    </Form>
                </Card>
            ) : (
                <Card className="shadow-sm border-0 rounded-4">
                    <Card.Header className="bg-light p-3 border-bottom-0 rounded-top-4">
                        <div className="d-flex justify-content-between align-items-center">
                            <div>
                                <h5 className="mb-1 text-primary fw-bold">{dadosNota.fornecedor.nome_loja}</h5>
                                <small className="text-muted">CNPJ: {dadosNota.fornecedor.cnpj}</small>
                            </div>
                            <div className="text-end">
                                <h6 className="mb-1 fw-bold">Nota: #{dadosNota.numero_nota}</h6>
                                <Badge bg="success" className="fs-6">Total: R$ {dadosNota.valor_total.toFixed(2)}</Badge>
                            </div>
                        </div>
                    </Card.Header>
                    <Card.Body className="p-0">
                        <Alert variant="warning" className="m-3 small border-0">
                            <strong>Atenção à Conversão!</strong> Se você comprou 1 Caixa (CX) e dentro vêm 12 unidades, mude o Fator de Conversão para 12. O sistema vai automaticamente dividir o preço de custo e multiplicar a entrada no estoque.
                        </Alert>
                        <div className="table-responsive">
                            <Table hover className="align-middle mb-0" style={{ fontSize: '0.9rem' }}>
                                <thead className="table-light">
                                    <tr>
                                        <th className="ps-3">Produto no XML</th>
                                        <th className="text-center">Qtd XML</th>
                                        <th>Vincular ao Sistema</th>
                                        <th className="text-center" style={{ width: '120px' }}>Fator (Qtd por un.)</th>
                                        <th className="text-center bg-success bg-opacity-10">Entrada Real</th>
                                        <th className="text-end pe-3 bg-success bg-opacity-10">Novo Custo Un.</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {dadosNota.itens.map((item, index) => {
                                        const fator = Number(item.fator_conversao) || 1;
                                        const entradaReal = Number(item.quantidade) * fator;
                                        const custoUnReal = Number(item.valor_unitario) / fator;

                                        return (
                                            <tr key={index}>
                                                <td className="ps-3">
                                                    <span className="fw-bold d-block text-truncate" style={{ maxWidth: '200px' }} title={item.nome}>{item.nome}</span>
                                                    <small className="text-muted">EAN: {item.ean || 'S/N'}</small>
                                                </td>
                                                <td className="text-center">
                                                    <Badge bg="secondary">{item.quantidade}</Badge>
                                                    <br/><small className="text-muted">R$ {Number(item.valor_unitario).toFixed(2)}</small>
                                                </td>
                                                <td>
                                                    <Form.Select 
                                                        size="sm"
                                                        value={item.id_produto_vinculado} 
                                                        onChange={(e) => handleItemChange(index, 'id_produto_vinculado', e.target.value)}
                                                    >
                                                        <option value="">-- Ignorar Item --</option>
                                                        {produtosSistema.map(p => (
                                                            <option key={p.id_produto} value={p.id_produto}>{p.nome}</option>
                                                        ))}
                                                    </Form.Select>
                                                </td>
                                                <td className="text-center">
                                                    <Form.Control 
                                                        type="number" 
                                                        size="sm" 
                                                        min="1"
                                                        value={item.fator_conversao}
                                                        onChange={(e) => handleItemChange(index, 'fator_conversao', e.target.value)}
                                                        disabled={!item.id_produto_vinculado}
                                                    />
                                                </td>
                                                <td className="text-center bg-success bg-opacity-10 fw-bold text-success">
                                                    +{entradaReal}
                                                </td>
                                                <td className="text-end pe-3 bg-success bg-opacity-10 fw-bold text-primary">
                                                    R$ {custoUnReal.toFixed(2)}
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </Table>
                        </div>
                        <div className="d-flex justify-content-end gap-3 p-3 bg-light border-top rounded-bottom-4 mt-2">
                            <Button variant="outline-secondary" onClick={() => setDadosNota(null)} className="fw-bold px-4">Cancelar</Button>
                            <Button variant="success" onClick={confirmarImportacao} disabled={loading} className="fw-bold px-4">
                                {loading ? <Spinner size="sm"/> : 'Confirmar e Atualizar Estoque'}
                            </Button>
                        </div>
                    </Card.Body>
                </Card>
            )}
        </div>
    );
}