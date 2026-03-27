import { convolution, magnitude, normalize } from './utils.js';

// ===============================
// Constantes para cálculos de máscaras
// ===============================
export const HALF = 1.0 / 2.0;
export const FOURTH = 1.0 / 4.0;
export const EIGHTH = 1.0 / 8.0;
export const NINTH = 1.0 / 9.0;
export const SIXTEENTH = 1.0 / 16.0;

// ===============================
// Definição das máscaras de filtros (Kernels)
// ===============================

export const sobelX = [[-1, -2, -1], [0, 0, 0], [1, 2, 1]];
export const sobelY = [[-1, 0, 1], [-2, 0, 2], [-1, 0, 1]];
export const sobelXY = (matrix, w, h, doNormalize) => 
    magnitude(convolution(matrix, w, h, sobelX, doNormalize), convolution(matrix, w, h, sobelY, doNormalize), w, h, doNormalize);

export const prewittX = [[-1, -1, -1], [0, 0, 0], [1, 1, 1]];
export const prewittY = [[-1, 0, 1], [-1, 0, 1], [-1, 0, 1]];
export const prewittXY = (matrix, w, h, doNormalize) => 
    magnitude(convolution(matrix, w, h, prewittX, doNormalize), convolution(matrix, w, h, prewittY, doNormalize), w, h, doNormalize);

export const average = [[NINTH, NINTH, NINTH], [NINTH, NINTH, NINTH], [NINTH, NINTH, NINTH]];

export const gaussianBlur = [
    [SIXTEENTH, EIGHTH, SIXTEENTH],
    [EIGHTH, FOURTH, EIGHTH],
    [SIXTEENTH, EIGHTH, SIXTEENTH]
];

export const gradientX = [[0, 0, 0], [0, 1, 0], [0, -1, 0]];
export const gradientY = [[0, 0, 0], [0, 1, -1], [0, 0, 0]];
export const gradientXY = (matrix, w, h, doNormalize) => 
    magnitude(convolution(matrix, w, h, gradientX, doNormalize), convolution(matrix, w, h, gradientY, doNormalize), w, h, doNormalize);

export const robertsX = [[0, 0, 0], [0, 1, 0], [0, 0, -1]];
export const robertsY = [[0, 0, 0], [0, 0, 1], [0, -1, 0]];
export const robertsXY = (matrix, w, h, doNormalize) => 
    magnitude(convolution(matrix, w, h, robertsX, doNormalize), convolution(matrix, w, h, robertsY, doNormalize), w, h, doNormalize);

export const none = [[0, 0, 0], [0, 1, 0], [0, 0, 0]];
export const custom = [[0, 0, 0], [0, 1, 0], [0, 0, 0]];

// ===============================
// Mapas de Kernel para acesso fácil
// ===============================
export const kernelMap = {
    0: none,
    5: sobelX,
    6: sobelY,
    7: prewittX,
    8: prewittY,
    9: average,
    10: gaussianBlur,
    11: gradientX,
    12: gradientY,
    13: robertsX,
    14: robertsY,
};

// ===============================
// Função Auxiliar de Ordenação
// ===============================
export function insertionSort(arr, n) {
    for (let i = 1; i < n; i++) {
        let key = arr[i];
        let j = i - 1;
        while (j >= 0 && arr[j] > key) {
            arr[j + 1] = arr[j];
            j = j - 1;
        }
        arr[j + 1] = key;
    }
}

// ===============================
// Função de filtro da mediana
// ===============================
export function medianFilter(matrix, w, h, doNormalize = true) {
    let arr = [];
    let res = [];

    for (let i = 0; i < h; i++) {
        res[i] = [];

        for (let j = 0; j < w; j++) {
            // Coleta a vizinhança 3x3 tratando as bordas da imagem (preenchendo com 0)
            arr[0] = i === 0 || j === 0 ? 0 : matrix[i - 1][j - 1];
            arr[1] = i === 0 ? 0 : matrix[i - 1][j];
            arr[2] = i === 0 || j === w - 1 ? 0 : matrix[i - 1][j + 1];

            arr[3] = j === 0 ? 0 : matrix[i][j - 1];
            arr[4] = matrix[i][j];
            arr[5] = j === w - 1 ? 0 : matrix[i][j + 1];

            arr[6] = i === h - 1 || j === 0 ? 0 : matrix[i + 1][j - 1];
            arr[7] = i === h - 1 ? 0 : matrix[i + 1][j];
            arr[8] = i === h - 1 || j === w - 1 ? 0 : matrix[i + 1][j + 1];

            insertionSort(arr, 9);
            // O elemento do meio (mediana) em um array de 9 posições é o índice 4
            res[i][j] = arr[4];
        }
    }

    return doNormalize ? normalize(res, w, h) : res;
}

// ===============================
// Função de filtro High-Boost
// ===============================
export function highBoostFilter(matrix, w, h, A = 1.5, doNormalize = true) {
    A = parseFloat(A);
    if (isNaN(A)) A = 1.5;

    // Etapa 1: Obter a versão suavizada (passa-baixa) da imagem.
    // Usando gaussianBlur
    const blurred = convolution(matrix, w, h, gaussianBlur, false); 
    const result = [];

    for (let i = 0; i < h; i++) {
        result[i] = [];
        for (let j = 0; j < w; j++) {
            const original = matrix[i][j];
            const smooth = blurred[i][j];

            // Etapa 2: Calcular a máscara de nitidez (unsharp mask)
            const g_mascara = original - smooth;

            // Etapa 3: Aplicar o filtro High-Boost.
            let boosted = original + (A * g_mascara);

            // Garante que o valor do pixel permaneça no intervalo válido [0, 255].
            boosted = Math.min(255, Math.max(0, boosted));
            result[i][j] = boosted;
        }
    }

    return doNormalize ? normalize(result, w, h) : result;
}