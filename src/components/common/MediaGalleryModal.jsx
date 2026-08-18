import React, { useState, useEffect } from 'react';
import { Modal, Spinner, Row, Col, Image, Badge } from 'react-bootstrap';
import api from '../../services/api'; // Ajuste o caminho conforme sua estrutura
import { toast } from 'react-toastify';

const MediaGalleryModal = ({ show, onHide, onSelect }) => {
    const [images, setImages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [provider, setProvider] = useState('');

    useEffect(() => {
        if (show) fetchGallery();
    }, [show]);

    const fetchGallery = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/uploadimages/gallery');
            setImages(data.images || []);
            setProvider(data.provider);
        } catch (error) {
            console.error("Erro galeria", error);
            toast.error("Erro ao carregar galeria.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal show={show} onHide={onHide} size="lg" scrollable>
            <Modal.Header closeButton><Modal.Title>Biblioteca ({provider})</Modal.Title></Modal.Header>
            <Modal.Body className="bg-light">
                {loading ? <div className="text-center p-5"><Spinner animation="border" /></div> : 
                 images.length === 0 ? <div className="text-center p-5 text-muted">Vazia.</div> : (
                    <Row className="g-3">
                        {images.map((img, idx) => (
                            <Col xs={4} md={3} key={idx}>
                                <div className="border rounded position-relative bg-white" style={{ cursor: 'pointer', aspectRatio: '1/1' }} onClick={() => { onSelect(img.url); onHide(); }}>
                                    <Image src={img.url} className="w-100 h-100 object-fit-cover" />
                                    <Badge bg="secondary" className="position-absolute top-0 end-0 m-1 opacity-75">Usar</Badge>
                                </div>
                            </Col>
                        ))}
                    </Row>
                )}
            </Modal.Body>
        </Modal>
    );
};

export default MediaGalleryModal;