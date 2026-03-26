export const add = (a, b) => a + b;
export const sub = (a, b) => a - b;
export const mul = (a, b) => a * b;
export const divide = (a, b) => b === 0 ? 0 : a / b;

export const or = (a, b) => a | b;
export const and = (a, b) => a & b;
export const xor = (a, b) => a ^ b;

export const operators = {
    1: add,
    2: sub,
    3: mul,
    4: divide,
    5: or,
    6: and,
    7: xor,
};

export function applyComposition(matrixA, matrixB, width, height, operatorFn, doNormalize = true) {
    if (!matrixA || !matrixB || matrixA.length === 0 || matrixB.length === 0) {
        throw new Error("Matrizes de imagem inválidas ou vazias.");
    }

    let result = [];
    let minVal = Infinity;
    let maxVal = -Infinity;

    // Etapa 1: Aplica a operação pixel a pixel
    for (let i = 0; i < height; i++) {
        result[i] = [];
        for (let j = 0; j < width; j++) {
            let val = operatorFn(matrixA[i][j], matrixB[i][j]);
            result[i][j] = val;

            // Rastreia o mínimo e máximo para a normalização
            if (val < minVal) minVal = val;
            if (val > maxVal) maxVal = val;
        }
    }

    // Etapa 2: Normalização (ajusta os valores para caberem entre 0 e 255)
    if (doNormalize) {
        for (let i = 0; i < height; i++) {
            for (let j = 0; j < width; j++) {
                if (maxVal === minVal) {
                    result[i][j] = 0; // Evita divisão por zero se a imagem for uma cor sólida
                } else {
                    // Equação clássica de remapeamento (Min-Max Scaling)
                    result[i][j] = Math.round(((result[i][j] - minVal) / (maxVal - minVal)) * 255);
                }
            }
        }
    } else {
        // Se não for normalizar, fazemos apenas um "Clamp" cortando o que passa de 255 ou desce de 0
        for (let i = 0; i < height; i++) {
            for (let j = 0; j < width; j++) {
                result[i][j] = Math.min(255, Math.max(0, result[i][j]));
            }
        }
    }

    return result;
}