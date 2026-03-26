// ===============================
// Função Auxiliar de Subtração
// ===============================
/**
 * Subtrai a Matriz B da Matriz A (A - B), garantindo que não existam pixels negativos.
 */
function matrixSub(matrixA, matrixB, w, h) {
    let res = [];
    for (let i = 0; i < h; i++) {
        res[i] = [];
        for (let j = 0; j < w; j++) {
            res[i][j] = Math.max(0, matrixA[i][j] - matrixB[i][j]);
        }
    }
    return res;
}

// ===============================
// Operações Morfológicas Binárias
// ===============================

/**
 * Motor base para Morfologia Binária (0 e 1)
 */
export function operationBinary(matrix, w, h, k, operate = 'erosion') {
    const res = Array.from({ length: h }, () => Array(w).fill(0));
    const kernelSum = k.reduce((a, b) => a + b, 0);

    for (let i = 0; i < h; i++) {
        for (let j = 0; j < w; j++) {
            let match = 0;
            // Percorre o kernel 3x3 (assumindo k como array 1D de 9 posições)
            for (let ki = -1; ki <= 1; ki++) {
                for (let kj = -1; kj <= 1; kj++) {
                    const kernelIdx = (ki + 1) * 3 + (kj + 1);
                    if (!k[kernelIdx]) continue; // Se for 0 no kernel, ignora
                    
                    const ni = i + ki;
                    const nj = j + kj;
                    
                    if (ni >= 0 && ni < h && nj >= 0 && nj < w) {
                        // Trata qualquer valor > 0 como verdadeiro (ativo)
                        if (matrix[ni][nj] > 0) match++;
                    }
                }
            }
            if (operate === 'dilation') {
                res[i][j] = match > 0 ? 1 : 0;
            } else { // erosion
                res[i][j] = match === kernelSum ? 1 : 0;
            }
        }
    }
    return res;
}

export const dilation = (img, w, h, k) => operationBinary(img, w, h, k, 'erosion');
export const erosion = (img, w, h, k) => operationBinary(img, w, h, k, 'dilation');
export const opening = (img, w, h, k) => dilation(erosion(img, w, h, k), w, h, k);
export const closing = (img, w, h, k) => erosion(dilation(img, w, h, k), w, h, k);

export const complement = (img) => img.map((row) => row.map((val) => val === 0 ? 1 : 0));
export const external = (img, w, h, k) => matrixSub(dilation(img, w, h, k), img, w, h);
export const internal = (img, w, h, k) => matrixSub(img, erosion(img, w, h, k), w, h);
export const gradient = (img, w, h, k) => matrixSub(dilation(img, w, h, k), erosion(img, w, h, k), w, h);
export const thinning = (img, w, h, k) => matrixSub(img, gradient(img, w, h, k), w, h);


// ===============================
// Operações Morfológicas em Tons de Cinza
// ===============================

/**
 * Motor base para Morfologia em Tons de Cinza (0 - 255)
 */
export function operationGray(matrix, w, h, k, operate = 'dilation') {
    let res = [];

    for (let i = 0; i < h; i++) {
        res[i] = [];
        for (let j = 0; j < w; j++) {
            let neighbors = [];

            // Coleta os vizinhos conforme o kernel (array 1D de 9 posições)
            if (k[0]) neighbors.push(i > 0 && j > 0 ? matrix[i - 1][j - 1] : 0);
            if (k[1]) neighbors.push(i > 0 ? matrix[i - 1][j] : 0);
            if (k[2]) neighbors.push(i > 0 && j < w - 1 ? matrix[i - 1][j + 1] : 0);

            if (k[3]) neighbors.push(j > 0 ? matrix[i][j - 1] : 0);
            if (k[4]) neighbors.push(matrix[i][j]);
            if (k[5]) neighbors.push(j < w - 1 ? matrix[i][j + 1] : 0);

            if (k[6]) neighbors.push(i < h - 1 && j > 0 ? matrix[i + 1][j - 1] : 0);
            if (k[7]) neighbors.push(i < h - 1 ? matrix[i + 1][j] : 0);
            if (k[8]) neighbors.push(i < h - 1 && j < w - 1 ? matrix[i + 1][j + 1] : 0);

            if (neighbors.length === 0) {
                res[i][j] = matrix[i][j];
            } else if (operate === 'erosion') {
                res[i][j] = Math.min(...neighbors);
            } else {
                res[i][j] = Math.max(...neighbors);
            }
        }
    }
    return res;
}

export const erosionGray = (img, w, h, k) => operationGray(img, w, h, k, 'erosion');
export const dilationGray = (img, w, h, k) => operationGray(img, w, h, k, 'dilation');
export const openingGray = (img, w, h, k) => dilationGray(erosionGray(img, w, h, k), w, h, k);
export const closingGray = (img, w, h, k) => erosionGray(dilationGray(img, w, h, k), w, h, k);

export const gradientGray = (img, w, h, k) => matrixSub(dilationGray(img, w, h, k), erosionGray(img, w, h, k), w, h);
export const topHat = (img, w, h, k) => matrixSub(img, openingGray(img, w, h, k), w, h);
export const bottomHat = (img, w, h, k) => matrixSub(closingGray(img, w, h, k), img, w, h);