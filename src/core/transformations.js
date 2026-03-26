// src/core/transformations.js

import { normalize } from './utils.js';

// ===============================
// Funções de Transformação de Ponto (Intensidade)
// ===============================

// a) Negativo: S = 255 - r
export const negative = (r) => 255 - r;

// b) Transformação Gamma: S = c * r^γ (c = 1)
export const gamma = (r, gammaValue = 1) => {
    if (gammaValue <= 0) return r; // Evita erros matemáticos com gamma <= 0
    return Math.round(Math.pow(r / 255, 1 / gammaValue) * 255);
};

// c) Transformação Logarítmica: S = a * log(r + 1)
export const logarithmic = (r, logScalarValue = 1) => {
    const c = 255 / Math.log(1 + 255);
    const val = Math.round(logScalarValue * c * Math.log(r + 1));
    return Math.max(0, Math.min(255, val));
};

// d) Transformação Sigmoide (Faixa dinâmica não linear)
export const sigmoid = (r, greyCenterValue = 127, sigmaValue = 25) => {
    // Evita divisão por zero (comportamento de função degrau)
    if (sigmaValue === 0) return r < greyCenterValue ? 0 : 255;
    return Math.round(255 / (1 + Math.exp(-(r - greyCenterValue) / sigmaValue)));
};

// e) Faixa Dinâmica (Mapeamento linear direto)
export const dynamicRange = (r, targetValue = 255) => {
    return Math.round((r / 255) * targetValue);
};

// f) Transformação Linear: S = a * r + b
export const linear = (r, aValue = 1, bValue = 0) => {
    const val = Math.round(aValue * r + bValue);
    return Math.max(0, Math.min(255, val));
};


// ===============================
// Motor de Aplicação
// ===============================

/**
 * Aplica uma transformação de ponto a todos os pixels da matriz.
 * @param {Array<Array<number>>} matrix Matriz da imagem original
 * @param {number} w Largura
 * @param {number} h Altura
 * @param {Function} operationFn Função que recebe o pixel (r) e devolve o novo valor
 * @param {boolean} doNormalize Flag para aplicar normalização Min-Max no resultado
 * @returns {Array<Array<number>>} Matriz transformada
 */
export function applyIntensityTransformation(matrix, w, h, operationFn, doNormalize = false) {
    if (!matrix || matrix.length === 0) return [];

    let res = [];
    for (let i = 0; i < h; i++) {
        res[i] = [];
        for (let j = 0; j < w; j++) {
            // Aplica a operação matemática no pixel atual
            res[i][j] = operationFn(matrix[i][j]);
        }
    }

    return doNormalize ? normalize(res, w, h) : res;
}