    import React from "react";

    export default function BearLoading({ text = "Carregando..." }) {
    return (
        <div className="bear-loading-page">
        <div className="bear-container">
            <div className="bear-walk">
            <img src="logologin.png" alt="Urso andando" />
            <div className="bear-shadow"></div>
            </div>

            <div className="loading-text">{text}</div>
        </div>

        <style>{`
            /* ===== TELA ===== */
            .bear-loading-page {
            position: fixed;
            inset: 0;
            background: #ffffff;
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 9999;
            }

            .bear-container {
            text-align: center;
            }

            .loading-text {
            margin-top: 14px;
            font-weight: 600;
            color: #6c757d;
            }

            /* ===== URSO ===== */
            .bear-walk {
            position: relative;
            width: 220px;
            height: 140px;
            margin: 0 auto;
            }

            .bear-walk img {
            width: 200px;
            position: absolute;
            left: 50%;
            bottom: 24px;
            transform: translateX(-50%);
            transform-origin: center bottom;
            animation:
                bear-step 0.6s ease-in-out infinite,
                bear-sway 1.1s ease-in-out infinite;
            will-change: transform;
            pointer-events: none;
            user-select: none;
            }

            /* ===== SOMBRA ===== */
            .bear-shadow {
            position: absolute;
            left: 50%;
            bottom: 16px;
            transform: translateX(-50%);
            width: 120px;
            height: 16px;
            background: rgba(0,0,0,0.15);
            border-radius: 50%;
            animation: shadow-step 0.6s ease-in-out infinite;
            filter: blur(1px);
            }

            /* ===== ANIMAÇÕES ===== */

            /* Passo (sobe/desce + leve squash) */
            @keyframes bear-step {
            0% {
                transform: translateX(-50%) translateY(0) scaleX(1);
            }
            50% {
                transform: translateX(-50%) translateY(-8px) scaleX(0.97);
            }
            100% {
                transform: translateX(-50%) translateY(0) scaleX(1);
            }
            }

            /* Balanço do corpo (caminhada) */
            @keyframes bear-sway {
            0%   { rotate: -1.5deg; }
            50%  { rotate:  1.5deg; }
            100% { rotate: -1.5deg; }
            }

            /* Sombra acompanha o passo */
            @keyframes shadow-step {
            0% {
                transform: translateX(-50%) scaleX(1);
                opacity: 0.16;
            }
            50% {
                transform: translateX(-50%) scaleX(0.75);
                opacity: 0.1;
            }
            100% {
                transform: translateX(-50%) scaleX(1);
                opacity: 0.16;
            }
            }

            /* Mobile */
            @media (max-width: 480px) {
            .bear-walk {
                width: 180px;
                height: 120px;
            }

            .bear-walk img {
                width: 160px;
            }

            .bear-shadow {
                width: 95px;
            }
            }

            /* Acessibilidade */
            @media (prefers-reduced-motion: reduce) {
            .bear-walk img,
            .bear-shadow {
                animation: none !important;
            }
            }
        `}</style>
        </div>
    );
    }
