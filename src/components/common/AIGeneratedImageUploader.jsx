import React, { useState } from 'react';
import { Form, Button, InputGroup, Spinner, Alert, Image, Card } from 'react-bootstrap';
import api from '../../services/api';

/**
 * Componente que permite ao utilizador gerar uma imagem por IA e usá-la.
 * @param {string} label - O rótulo para o componente.
 * @param {function(string): void} onImageGenerated - Callback com a nova URL da imagem.
 */
const AIGeneratedImageUploader = ({ label, onImageGenerated }) => {
    const [prompt, setPrompt] = useState('');
    const [generating, setGenerating] = useState(false);
    const [error, setError] = useState('');
    const [generatedImageUrl, setGeneratedImageUrl] = useState(null);

    const handleGenerateImage = async () => {
        if (!prompt.trim()) {
            setError('Por favor, escreva uma descrição para a imagem.');
            return;
        }
        setGenerating(true);
        setError('');
        setGeneratedImageUrl(null);

        try {
            const { data } = await api.post('/images/generate', { prompt });
            setGeneratedImageUrl(data.imageUrl);
        } catch (err) {
            const message = err.response?.data?.message || 'Não foi possível gerar a imagem.';
            setError(message);
        } finally {
            setGenerating(false);
        }
    };

    const handleUseImage = () => {
        if (generatedImageUrl) {
            onImageGenerated(generatedImageUrl);
            setGeneratedImageUrl(null); // Limpa a prévia após o uso
        }
    };

    return (
        <Card className="p-3 mb-3 bg-light">
            <Form.Group>
                <Form.Label as="strong">{label}</Form.Label>
                <InputGroup className="mb-2">
                    <Form.Control
                        as="textarea"
                        rows={2}
                        placeholder="Ex: bota de couro marrom masculina, cano curto"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        disabled={generating}
                    />
                    <Button onClick={handleGenerateImage} disabled={generating || !prompt.trim()}>
                        {generating ? <Spinner as="span" size="sm" /> : <><i className="fas fa-magic me-2"></i> Gerar</>}
                    </Button>
                </InputGroup>
                <Form.Text>Descreva o produto e a nossa IA irá criar uma imagem de anúncio profissional para si.</Form.Text>
            </Form.Group>

            {error && <Alert variant="danger" className="mt-2">{error}</Alert>}

            {generating && (
                <div className="text-center my-3">
                    <Spinner animation="border" />
                    <p className="text-muted mt-2">A criar a sua imagem... Isto pode levar um momento.</p>
                </div>
            )}
            
            {generatedImageUrl && (
                <div className="text-center mt-2">
                    <p><strong>Pré-visualização da Imagem Gerada:</strong></p>
                    <Image src={generatedImageUrl} alt="Imagem gerada por IA" thumbnail style={{ maxHeight: '200px' }} />
                    <div className="d-grid mt-2">
                         <Button variant="success" onClick={handleUseImage}>
                            <i className="fas fa-check me-2"></i> Usar esta Imagem
                        </Button>
                    </div>
                </div>
            )}
        </Card>
    );
};

export default AIGeneratedImageUploader;