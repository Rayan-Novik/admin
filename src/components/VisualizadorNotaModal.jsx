import React from 'react';
import { Modal, Button } from 'react-bootstrap';

export default function VisualizadorNotaModal({ show, onHide, nota }) {
    if (!nota) return null;

    return (
        <Modal show={show} onHide={onHide} size="lg" centered>
            <Modal.Header closeButton>
                <Modal.Title>Visualizar {nota.tipo_nota} - #{nota.numero_nota || 'Rascunho'}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <div className="p-3 border rounded bg-light">
                    <div className="row">
                        <div className="col-6">
                            <p><strong>Chave de Acesso:</strong><br />{nota.chave_acesso || 'N/A'}</p>
                            <p><strong>Protocolo:</strong><br />{nota.protocolo_sefaz || 'N/A'}</p>
                        </div>
                        <div className="col-6 text-end">
                            <p><strong>Data:</strong><br />{new Date(nota.data_emissao).toLocaleString()}</p>
                            <p><strong>Valor:</strong><br />R$ {Number(nota.valor_total).toFixed(2)}</p>
                        </div>
                    </div>
                    <div className="mt-3">
                        <h6>XML Gerado:</h6>
                        <pre className="bg-dark text-light p-3 rounded small overflow-auto" style={{ maxHeight: '200px' }}>
                            {nota.xml_gerado || 'Nenhum XML gerado ainda.'}
                        </pre>
                    </div>
                </div>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={onHide}>Fechar</Button>

                {nota.url_danfe ? (
                    <Button
                        variant="primary"
                        onClick={() => window.open(nota.url_danfe, '_blank')}
                    >
                        Download PDF
                    </Button>
                ) : (
                    <Button variant="primary" disabled>
                        PDF Indisponível
                    </Button>
                )}
            </Modal.Footer>
        </Modal>
    );
}