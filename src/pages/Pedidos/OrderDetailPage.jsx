import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Row, Col, Table, Spinner, Alert, Badge, Button, Container, Dropdown } from 'react-bootstrap';
import api from '../../services/api';
import { toast } from 'react-toastify';
import EmissorNotaPedido from '../../components/EmissorNotaPedido';

const OrderDetailPage = () => {
    const { id: orderId } = useParams();
    const navigate = useNavigate();

    const rawUser = localStorage.getItem('adminInfo') || localStorage.getItem('user') || localStorage.getItem('usuario') || '{}';
    let dadosUser = {};
    try {
        dadosUser = JSON.parse(rawUser);
        if (dadosUser.user) dadosUser = { ...dadosUser, ...dadosUser.user };
    } catch (e) { }

    const roleUpper = String(dadosUser.role || '').toUpperCase();
    const isDono = roleUpper === 'PROPRIETÁRIO' ||
        roleUpper === 'DONO' ||
        roleUpper === 'ADMIN' ||
        dadosUser.isAdmin === true;

    let permissoesUsuario = [];
    if (Array.isArray(dadosUser.permissoes)) {
        permissoesUsuario = dadosUser.permissoes;
    } else if (dadosUser.cargo && Array.isArray(dadosUser.cargo.permissoes)) {
        permissoesUsuario = dadosUser.cargo.permissoes;
    }

    const podeEditar = isDono || permissoesUsuario.includes('PEDIDOS_MANAGE');
    const podeVer = podeEditar || permissoesUsuario.includes('PEDIDOS_VIEW');

    const [order, setOrder] = useState(null);
    const [lojaInfo, setLojaInfo] = useState(null);
    const [tenantContact, setTenantContact] = useState({});
    const [storeAppearance, setStoreAppearance] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [loadingPrint, setLoadingPrint] = useState(false);

    const tenantSlug = localStorage.getItem('tenantSlug') || 'minha-loja';
    const storeName = tenantContact.nome_fantasia || localStorage.getItem('tenantName') || tenantSlug.toUpperCase();

    const getStoreUrl = () => {
        const slug = localStorage.getItem('tenantSlug');
        const domain = localStorage.getItem('tenantDomain');
        let baseDomain = 'ararinhacloud.shop';

        if (process.env.REACT_APP_ECOMMERCE_URL) {
            baseDomain = process.env.REACT_APP_ECOMMERCE_URL.replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/$/, '');
        }
        if (domain && domain !== 'null' && domain !== 'undefined') return `https://${domain}`;
        if (slug && slug !== 'null' && slug !== 'undefined') return `https://${slug}.${baseDomain}`;
        return `https://${baseDomain}`;
    };

    const storeUrl = getStoreUrl();

    const fetchData = async () => {
        try {
            setLoading(true);
            const orderRes = await api.get(`/pedidos/${orderId}`);
            setOrder(orderRes.data);

            try {
                const appRes = await api.get('/configuracoes/appearance');
                setStoreAppearance(appRes.data || {});
            } catch (e) { }

            try {
                const tenantRes = await api.get('/tenants/info');
                setTenantContact(tenantRes.data || {});
            } catch (e) { }

            try {
                const lojasRes = await api.get('/lojas');
                if (lojasRes.data && lojasRes.data.length > 0) {
                    setLojaInfo(lojasRes.data[0]);
                }
            } catch (e) { }

        } catch (err) {
            setError('Pedido não encontrado ou acesso negado.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (podeVer) {
            fetchData();
        } else {
            setError('Acesso Negado: Você não tem permissão para visualizar pedidos.');
            setLoading(false);
        }
    }, [orderId, podeVer]);

    const handleAction = async (action) => {
        if (!podeEditar) return toast.error("Sem permissão para alterar o pedido.");
        if (!window.confirm('Tem certeza que deseja executar esta ação?')) return;
        try {
            if (action === 'ready') await api.put(`/pedidos/${orderId}/status`, { status_entrega: 'Pronto para Retirada' });
            if (action === 'pickedup') await api.put(`/pedidos/${orderId}/status`, { status_entrega: 'Entregue' });

            if (action === 'deliver') {
                const response = await api.put(`/pedidos/${orderId}/deliver`);
                const driverToken = response.data.driver_token || (response.data.link_motorista ? response.data.link_motorista.split('/').pop() : '');

                if (driverToken) {
                    const finalLink = `${storeUrl}/driver/delivery/${driverToken}`;
                    navigator.clipboard.writeText(finalLink).catch(() => { });
                    toast.success('Pedido despachado e Link do Motoboy copiado!');
                } else {
                    toast.info('Pedido despachado via Correios/Transportadora.');
                }
            }

            if (action === 'delete') {
                await api.delete(`/pedidos/${orderId}`);
                toast.success('Pedido cancelado com sucesso.');
                navigate('/admin/orderlist');
                return;
            }

            fetchData();
        } catch (err) {
            toast.error('Erro na operação. Tente novamente.');
        }
    };

    const copyDriverLink = (driverToken) => {
        if (!driverToken) return;
        const link = `${storeUrl}/driver/delivery/${driverToken}`;
        navigator.clipboard.writeText(link)
            .then(() => toast.info('Link copiado!'))
            .catch(() => toast.error('Erro ao copiar link.'));
    };

    // ==========================================================
    // 🟢 IMPRESSÃO A4 (VIA CSS DO NAVEGADOR - MANTÉM O ESTILO!)
    // ==========================================================
    const handlePrintA4 = () => {
        // Isso vai abrir a janela nativa do Chrome.
        // O CSS no final do arquivo garante que o menu lateral suma e vire um PDF A4 perfeito.
        window.print();
    };

    // ==========================================================
    // 🟢 IMPRESSÃO TÉRMICA REMOTA (VIA SOCKET)
    // ==========================================================
    const handlePrintTermica = async () => {
        try {
            setLoadingPrint(true);
            await api.post(`/pedidos/${orderId}/imprimir-termica`);
            toast.success("Cupom enviado com sucesso para a impressora do caixa!");
        } catch (error) {
            toast.error(error.response?.data?.message || "Falha ao enviar impressão térmica.");
        } finally {
            setLoadingPrint(false);
        }
    };

    if (loading) return <div className="text-center p-5"><Spinner animation="border" /></div>;
    if (error) return <Alert variant="danger" className="m-4 shadow-sm border-0 fw-bold"><i className="bi bi-exclamation-triangle-fill me-2"></i> {error}</Alert>;
    if (!order) return null;

    const pedidoInfo = order.pedido || {};
    const clienteInfo = order.cliente || order.usuarios || {};
    const itemsInfo = order.items || [];

    const enderecoInfo = pedidoInfo.entrega_logradouro ? {
        logradouro: pedidoInfo.entrega_logradouro,
        numero: pedidoInfo.entrega_numero,
        complemento: pedidoInfo.entrega_complemento,
        bairro: pedidoInfo.entrega_bairro,
        cidade: pedidoInfo.entrega_cidade,
        estado: pedidoInfo.entrega_estado,
        cep: pedidoInfo.entrega_cep
    } : (order.endereco || {});

    let cpfCliente = clienteInfo.cpf_descriptografado || 'Não informado';
    let telefoneCliente = clienteInfo.telefone_descriptografado || 'Não informado';

    if (cpfCliente.length === 11) cpfCliente = cpfCliente.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
    if (telefoneCliente.length === 11) telefoneCliente = telefoneCliente.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");

    const statusPagamento = pedidoInfo.status_pagamento ? pedidoInfo.status_pagamento.toUpperCase() : '';
    const isPago = statusPagamento === 'PAGO';
    const isPendente = statusPagamento === 'PENDENTE' || statusPagamento === 'AGUARDANDO_PAGAMENTO';
    const isFalha = statusPagamento === 'CANCELADO' || statusPagamento === 'REJEITADO' || statusPagamento === 'ERRO';

    const isActionable = isPago || (pedidoInfo.metodo_pagamento && pedidoInfo.metodo_pagamento.toUpperCase().includes('OFFLINE'));

    const metodoEnvio = pedidoInfo.metodo_envio || '';
    const temEnderecoDeEntrega = !!enderecoInfo.logradouro;

    const isConsumoLocal = metodoEnvio === 'Consumo no Local' || (!temEnderecoDeEntrega && pedidoInfo.entrega_complemento?.toLowerCase().includes('mesa'));
    const isRetirada = pedidoInfo.status_entrega === 'Retirada na Loja' || (!temEnderecoDeEntrega && !isConsumoLocal);

    const isReady = pedidoInfo.status_entrega === 'Pronto para Retirada';
    const isOutForDelivery = String(pedidoInfo.status_entrega || '').toLowerCase().includes('rota') || Boolean(pedidoInfo.delivery_pin);
    const isDelivered = String(pedidoInfo.status_entrega || '').toLowerCase() === 'entregue';

    const primaryColor = storeAppearance.HEADER_PRIMARY_COLOR || '#343a40';
    const logoUrl = storeAppearance.LOGO_URL || null;
    const notasAdmin = pedidoInfo.observacoes || '';

    return (
        <Container className="my-4 pb-5">
            <div className="d-flex justify-content-between align-items-center mb-4 no-print">
                <Button as={Link} to="/orders" variant="outline-dark" className="rounded-pill px-4 fw-bold">
                    <i className="bi bi-arrow-left me-2"></i> Voltar
                </Button>

                <div className="d-flex gap-2">
                    <Dropdown align="end">
                        <Dropdown.Toggle variant="dark" className="rounded-pill px-4 shadow-sm fw-bold">
                            <i className="bi bi-printer me-2"></i> Opções de Impressão <i className="bi bi-chevron-down ms-1"></i>
                        </Dropdown.Toggle>
                        <Dropdown.Menu className="shadow border-0 rounded-3 mt-2">
                            <Dropdown.Item onClick={handlePrintA4}>
                                <i className="bi bi-file-earmark-text me-2 text-secondary"></i> Gerar/Imprimir Nota A4
                            </Dropdown.Item>
                            <Dropdown.Item onClick={handlePrintTermica} disabled={loadingPrint}>
                                {loadingPrint ? <Spinner size="sm" className="me-2"/> : <i className="bi bi-receipt me-2 text-primary"></i>} 
                                Imprimir Cupom Térmico (Caixa)
                            </Dropdown.Item>
                        </Dropdown.Menu>
                    </Dropdown>

                    {podeEditar && (
                        <Dropdown align="end">
                            <Dropdown.Toggle variant="primary" className="rounded-pill px-4 shadow-sm fw-bold">
                                Ações do Pedido <i className="bi bi-chevron-down ms-1"></i>
                            </Dropdown.Toggle>

                            <Dropdown.Menu className="shadow border-0 rounded-3 mt-2" style={{ minWidth: '250px' }}>
                                <Dropdown.Header className="fw-bold text-uppercase">Gestão Logística</Dropdown.Header>

                                {isOutForDelivery && !isDelivered && pedidoInfo.delivery_pin ? (
                                    <>
                                        <Dropdown.ItemText className="text-primary fw-bold bg-primary bg-opacity-10 py-2">
                                            <i className="bi bi-bicycle me-2"></i> Em Rota - PIN: {pedidoInfo.delivery_pin}
                                        </Dropdown.ItemText>
                                        <Dropdown.Item onClick={() => copyDriverLink(pedidoInfo.driver_token)}>
                                            <i className="bi bi-link-45deg me-2"></i> Copiar Link do Motoboy
                                        </Dropdown.Item>
                                    </>
                                ) : (
                                    <>
                                        {isActionable && !isDelivered && !isOutForDelivery && (
                                            (isRetirada || isConsumoLocal) ? (
                                                isReady ?
                                                    <Dropdown.Item onClick={() => handleAction('pickedup')} className="text-success fw-bold">
                                                        <i className="bi bi-check-circle me-2"></i> Confirmar Entrega
                                                    </Dropdown.Item>
                                                    :
                                                    <Dropdown.Item onClick={() => handleAction('ready')} className="text-primary fw-bold">
                                                        <i className="bi bi-box-seam me-2"></i> Marcar Pronto (Separar)
                                                    </Dropdown.Item>
                                            ) : (
                                                <Dropdown.Item onClick={() => handleAction('deliver')} className="text-info fw-bold">
                                                    <i className="bi bi-bicycle me-2"></i> Despachar Entregador
                                                </Dropdown.Item>
                                            )
                                        )}
                                    </>
                                )}

                                <Dropdown.Divider />
                                <Dropdown.Item onClick={() => navigate(`/admin/etiqueta/${pedidoInfo.id_pedido}`)} disabled={!isActionable}>
                                    <i className="bi bi-tag me-2"></i> Etiqueta de Envio Simplificada
                                </Dropdown.Item>

                                {!isPago && !isFalha && (
                                    <>
                                        <Dropdown.Divider />
                                        <Dropdown.Item onClick={() => handleAction('delete')} className="text-danger fw-bold">
                                            <i className="bi bi-x-circle me-2"></i> Cancelar Pedido
                                        </Dropdown.Item>
                                    </>
                                )}
                            </Dropdown.Menu>
                        </Dropdown>
                    )}
                </div>
            </div>

            <div className="no-print mercantile-alert mb-4">
                {isPendente && (
                    <Alert variant="warning" className="border-warning shadow-sm border-2 fw-bold">
                        <i className="bi bi-exclamation-triangle-fill me-2"></i> PAGAMENTO PENDENTE: Não entregue o pedido até a aprovação.
                    </Alert>
                )}
                {isFalha && (
                    <Alert variant="danger" className="shadow-sm border-2 fw-bold">
                        <i className="bi bi-x-circle-fill me-2"></i> PEDIDO CANCELADO / FALHOU.
                    </Alert>
                )}
            </div>

            <div className="no-print mercantile-alert mb-4">
                {isPendente && (
                    <Alert variant="warning" className="border-warning shadow-sm border-2 fw-bold">
                        <i className="bi bi-exclamation-triangle-fill me-2"></i> PAGAMENTO PENDENTE: Não entregue o pedido até a aprovação.
                    </Alert>
                )}
                {isFalha && (
                    <Alert variant="danger" className="shadow-sm border-2 fw-bold">
                        <i className="bi bi-x-circle-fill me-2"></i> PEDIDO CANCELADO / FALHOU.
                    </Alert>
                )}
            </div>

            {/* 🟢 MÓDULO FISCAL AQUI (Oculto na impressão) */}
            {podeEditar && (
                <div className="no-print mb-4">
                    <EmissorNotaPedido 
                        idPedido={pedidoInfo.id_pedido} 
                        // Verifica se a API retornou a nota dentro do pedido ou na raiz do objeto
                        notaInicial={order.nota_fiscal || pedidoInfo.nota_fiscal || null} 
                    />
                </div>
            )}

            <div className="a4-page bg-white mx-auto position-relative d-flex flex-column">
                <div className="d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom border-2" style={{ borderColor: primaryColor }}>
                    <div className="d-flex align-items-center gap-3 w-50">
                        {logoUrl ? (
                            <img src={logoUrl} alt="Logo da Loja" style={{ maxWidth: '120px', maxHeight: '80px', objectFit: 'contain' }} />
                        ) : (
                            <div className="text-white d-flex align-items-center justify-content-center fw-bold rounded p-2 text-center" style={{ width: '80px', height: '80px', backgroundColor: primaryColor, fontSize: '11px' }}>
                                {storeName}
                            </div>
                        )}
                        <div>
                            <h3 className="m-0 fw-black text-uppercase" style={{ letterSpacing: '1px', color: primaryColor }}>{storeName}</h3>
                            <div className="text-muted small fw-medium mt-1">
                                {storeUrl.replace(/^https?:\/\//, '')}
                            </div>
                        </div>
                    </div>

                    <div className="text-end w-50">
                        <h2 className="fw-black text-uppercase mb-1" style={{ color: primaryColor, letterSpacing: '1px' }}>Pedido de Compra</h2>
                        <h4 className="fw-bold m-0 text-dark">#{pedidoInfo.id_pedido}</h4>
                        <div className="text-muted mt-1 fw-medium" style={{ fontSize: '14px' }}>
                            Data: {pedidoInfo.data_pedido ? new Date(pedidoInfo.data_pedido).toLocaleDateString('pt-BR') : 'N/A'}
                        </div>
                    </div>
                </div>

                <Row className="mb-4 gx-4">
                    <Col xs={6}>
                        <div className="p-2 mb-2 fw-bold text-white text-uppercase" style={{ backgroundColor: '#475569', fontSize: '12px', letterSpacing: '1px' }}>
                            Dados da Empresa (Vendedor)
                        </div>
                        <div className="ps-2 text-dark" style={{ fontSize: '13px', lineHeight: '1.6' }}>
                            <div className="fw-bold fs-6 mb-1">{storeName}</div>
                            {tenantContact.documento && <div><strong>CNPJ/CPF:</strong> {tenantContact.documento}</div>}
                            {tenantContact.email_contato && <div><strong>Email:</strong> {tenantContact.email_contato}</div>}
                            {tenantContact.telefone_contato && <div><strong>Tel:</strong> {tenantContact.telefone_contato}</div>}

                            {lojaInfo && (
                                <div className="mt-2 border-top border-dashed pt-2">
                                    <strong>Endereço da Loja:</strong><br />
                                    {lojaInfo.logradouro}, {lojaInfo.numero} - {lojaInfo.bairro}<br />
                                    {lojaInfo.cidade}/{lojaInfo.estado} - CEP: {lojaInfo.cep}
                                </div>
                            )}
                        </div>
                    </Col>

                    <Col xs={6}>
                        <div className="p-2 mb-2 fw-bold text-white text-uppercase" style={{ backgroundColor: primaryColor, fontSize: '12px', letterSpacing: '1px' }}>
                            Cliente / Destino
                        </div>
                        <div className="ps-2 text-dark" style={{ fontSize: '13px', lineHeight: '1.6' }}>
                            <div className="fw-bold fs-6 mb-1">{clienteInfo.nome_completo}</div>
                            {clienteInfo.email && !clienteInfo.email.includes('avulsa_t') && <div><strong>Email:</strong> {clienteInfo.email}</div>}
                            <div><strong>CPF:</strong> {cpfCliente}</div>
                            <div><strong>Tel:</strong> {telefoneCliente}</div>

                            <div className="mt-2 pt-2 border-top border-dashed">
                                {isConsumoLocal ? (
                                    <div>
                                        <div className="fw-bold text-danger mb-1"><i className="bi bi-cup-hot me-1"></i> CONSUMO NO LOCAL</div>
                                        <div className="fs-6 fw-bold">{pedidoInfo.entrega_complemento?.replace('Mesa/Nome:', '') || 'Mesa não informada'}</div>
                                    </div>
                                ) : isRetirada ? (
                                    <div>
                                        <div className="fw-bold text-primary mb-1"><i className="bi bi-shop me-1"></i> RETIRADA NA LOJA</div>
                                        {lojaInfo ? (
                                            <>Será retirado diretamente no balcão da loja matriz.</>
                                        ) : (
                                            <strong>Loja Principal</strong>
                                        )}
                                    </div>
                                ) : (
                                    <address className="mb-0">
                                        <div className="fw-bold mb-1"><i className="bi bi-truck me-1"></i> ENDEREÇO DE ENTREGA</div>
                                        {enderecoInfo.logradouro === 'Endereço a combinar no WhatsApp' ? (
                                            <div className="text-primary fw-bold mt-1">
                                                <i className="bi bi-whatsapp me-2"></i> Endereço a combinar no WhatsApp
                                            </div>
                                        ) : (
                                            <>
                                                {enderecoInfo.logradouro}, {enderecoInfo.numero}<br />
                                                {enderecoInfo.complemento && <>{enderecoInfo.complemento}<br /></>}
                                                {enderecoInfo.bairro} - {enderecoInfo.cidade}/{enderecoInfo.estado}<br />
                                                <strong>CEP:</strong> {enderecoInfo.cep}
                                            </>
                                        )}
                                    </address>
                                )}
                            </div>
                        </div>
                    </Col>
                </Row>

                <div className="mb-4">
                    <Table size="sm" className="mb-0 invoice-table" style={{ border: '1px solid #e2e8f0' }}>
                        <thead style={{ backgroundColor: primaryColor, color: 'white' }}>
                            <tr>
                                <th className="text-center py-2 border-0" style={{ width: '10%' }}>QTD</th>
                                <th className="py-2 border-0" style={{ width: '50%' }}>ITEM</th>
                                <th className="text-end py-2 border-0" style={{ width: '20%' }}>PREÇO UNIT.</th>
                                <th className="text-end py-2 border-0" style={{ width: '20%' }}>TOTAL</th>
                            </tr>
                        </thead >
                        <tbody>
                        {itemsInfo.map((item, idx) => {
                            const nomeExibicao = item.nome || item.nome_produto || 'Item do Pedido';
                            
                            // 🟢 Tratamento seguro dos complementos
                            let comps = [];
                            try { 
                                comps = typeof item.complementos === 'string' ? JSON.parse(item.complementos) : (item.complementos || []); 
                            } catch(e){}

                            // 🟢 Calcula o total dos complementos para somar ao preço do item
                            let totalComplementosPreco = 0;
                            comps.forEach((c) => {
                                const precoComp = parseFloat(c.preco_adicional ?? c.preco ?? 0);
                                const qtdComp = parseInt(c.quantidade || 1, 10);
                                totalComplementosPreco += (precoComp * qtdComp);
                            });

                            const precoUnitarioBase = parseFloat(item.preco_unitario || item.preco || 0);
                            const precoUnitarioFinal = precoUnitarioBase + totalComplementosPreco;
                            const valorTotalItem = Number(item.quantidade) * precoUnitarioFinal;

                            return (
                                <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                                    <td className="text-center align-middle fw-bold py-2">{item.quantidade}</td>
                                    <td className="align-middle py-2">
                                        <div className="d-flex align-items-start gap-3">
                                            {item.imagem_url ? (
                                                <img src={item.imagem_url} alt={nomeExibicao} style={{ width: '45px', height: '45px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #e2e8f0' }} className="mt-1" />
                                            ) : (
                                                <div style={{ width: '45px', height: '45px', backgroundColor: '#f1f5f9', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} className="mt-1">
                                                    <i className="bi bi-image text-muted"></i>
                                                </div>
                                            )}
                                            <div className="d-flex flex-column">
                                                <span className="fw-medium text-dark">{nomeExibicao}</span>
                                                
                                                {/* 🟢 Renderização dos Detalhes, Variações, Complementos e Observações */}
                                                {(item.cor || item.tamanho || comps.length > 0 || item.observacao) && (
                                                    <div className="d-flex flex-column mt-1" style={{ fontSize: '11px', color: '#64748b' }}>
                                                        {item.cor && <span>Cor: {item.cor}</span>}
                                                        {item.tamanho && <span>Tam: {item.tamanho}</span>}
                                                        {comps.map((c, i) => {
                                                            const precoComp = parseFloat(c.preco_adicional ?? c.preco ?? 0);
                                                            const nomeComp = c.nome || c.produto_add?.nome || 'Adicional';
                                                            const precoFormatado = precoComp > 0 ? ` (R$ ${precoComp.toFixed(2)})` : '';
                                                            return (
                                                                <span key={i} className="fw-medium">
                                                                    + {c.quantidade || 1}x {nomeComp}{precoFormatado}
                                                                </span>
                                                          );
                                                        })}
                                                        {item.observacao && <span className="text-danger fw-bold mt-0.5">Obs: {item.observacao}</span>}
                                                    </div>
                                            )}
                                        </div>
                                    </div>
                                    </td>
                                    <td className="text-end align-middle py-2">R$ {precoUnitarioFinal.toFixed(2)}</td>
                                    <td className="text-end align-middle fw-bold py-2">R$ {valorTotalItem.toFixed(2)}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                    </Table>
                </div>

                <Row className="mt-auto">
                    <Col xs={7}>
                        <div className="p-3 h-100 rounded" style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                            <h6 className="fw-bold text-uppercase mb-2 text-muted" style={{ fontSize: '11px', letterSpacing: '1px' }}>Observações / Status de Pagamento</h6>
                            <p className="mb-1" style={{ fontSize: '13px' }}><strong>Método:</strong> {pedidoInfo.metodo_pagamento || 'Não informado'}</p>
                            <p className="mb-1" style={{ fontSize: '13px' }}>
                                <strong>Situação Financeira:</strong> <span className={`fw-bold text-${isPago ? 'success' : isFalha ? 'danger' : 'warning'}`}>{pedidoInfo.status_pagamento || 'PENDENTE'}</span>
                            </p>
                            <p className="mb-1" style={{ fontSize: '13px' }}>
                                <strong>Logística:</strong> {pedidoInfo.status_entrega || 'Pendente'}
                            </p>
                            {notasAdmin && (
                                <p className="mb-1 mt-2 text-primary" style={{ fontSize: '13px', whiteSpace: 'pre-wrap' }}>
                                    <strong>Anotações:</strong><br />{notasAdmin}
                                </p>
                            )}
                        </div>
                    </Col>

                    <Col xs={5}>
                        <div className="p-3 rounded h-100 d-flex flex-column justify-content-end" style={{ border: `2px solid ${primaryColor}20`, backgroundColor: `${primaryColor}05` }}>
                            <div className="d-flex justify-content-between mb-2 pb-2 border-bottom border-dark border-opacity-10">
                                <span className="fw-bold text-muted" style={{ fontSize: '13px' }}>SUBTOTAL:</span>
                                <span className="fw-medium" style={{ fontSize: '13px' }}>R$ {parseFloat(pedidoInfo.preco_itens || 0).toFixed(2)}</span>
                            </div>
                            <div className="d-flex justify-content-between mb-2 pb-2 border-bottom border-dark border-opacity-10">
                                <span className="fw-bold text-muted text-uppercase" style={{ fontSize: '13px' }}>{(isRetirada || isConsumoLocal) ? 'TAXA LOCAL:' : 'FRETE / ENVIO:'}</span>
                                <span className="fw-medium" style={{ fontSize: '13px' }}>{parseFloat(pedidoInfo.preco_frete) === 0 ? 'Grátis' : `R$ ${parseFloat(pedidoInfo.preco_frete || 0).toFixed(2)}`}</span>
                            </div>
                            <div className="d-flex justify-content-between mt-2 pt-2">
                                <span className="fw-black fs-5 text-dark">TOTAL:</span>
                                <span className="fw-black fs-5" style={{ color: primaryColor }}>R$ {parseFloat(pedidoInfo.preco_total || 0).toFixed(2)}</span>
                            </div>
                        </div>
                    </Col>
                </Row>
            </div>

            {/* 🟢 CSS BLINDADO PARA IMPRESSÃO PERFEITA DO REACT */}
            <style>{`
                .fw-black { font-weight: 900; }
                .border-dashed { border-style: dashed !important; border-color: #cbd5e1 !important; }
                .a4-page { width: 21cm; min-height: 29.7cm; padding: 1.5cm; margin: 0 auto; border: 1px solid #cbd5e1; background-color: white; border-radius: 8px; }
                
                @media print {
                    @page { size: A4 portrait; margin: 0; }
                    
                    /* Limpa a tela inteira e reseta as cores do navegador */
                    html, body { 
                        width: 21cm; 
                        height: 29.7cm; 
                        margin: 0 !important; 
                        padding: 0 !important; 
                        background-color: white !important; 
                        -webkit-print-color-adjust: exact !important; 
                        color-adjust: exact !important;
                    }
                    
                    /* Oculta tudo que não for o container raiz da nossa folha */
                    body > *:not(#root) { display: none !important; }
                    
                    /* Oculta Navbar, Menus Laterais, Botões e Alertas */
                    .no-print, nav, header, footer, aside, .sidebar, #sidebar, .mercantile-alert { 
                        display: none !important; 
                    }
                    
                    /* Força o container principal a ignorar os paddings do AdminLayout */
                    .container, .container-fluid, main {
                        max-width: 100% !important;
                        padding: 0 !important;
                        margin: 0 !important;
                        overflow: visible !important;
                    }

                    /* Garante que a folha A4 assuma a página inteira limpa */
                    .a4-page { 
                        width: 21cm !important; 
                        height: auto !important; 
                        padding: 1.5cm !important; 
                        margin: 0 !important; 
                        border: none !important; 
                        box-shadow: none !important; 
                        border-radius: 0 !important;
                        position: absolute;
                        top: 0;
                        left: 0;
                    }
                }
            `}</style>
        </Container>
    );
};

export default OrderDetailPage;