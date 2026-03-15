import React from 'react';
import { Link } from 'react-router-dom';
import ProductAddForm from '../components/ProdutoForms/ProductAddForm'; // Importa o seu formulário

const ProductCreatePage = () => {
    return (
        <>
            <Link to='/products' className='btn btn-light my-3'>
                Voltar
            </Link>
            {/* A página simplesmente renderiza o componente do formulário de adição */}
            <ProductAddForm />
        </>
    );
};

export default ProductCreatePage;
