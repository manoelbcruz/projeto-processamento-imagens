/**
 * Função utilitária: Mapeamento Inverso com Vizinho Mais Próximo (Nearest Neighbor)
 * Evita o problema de "buracos" em transformações espaciais.
 */
function getPixel(matrix, x, y, w, h) {
    // Arredonda para o índice inteiro mais próximo
    let px = Math.round(x);
    let py = Math.round(y);

    // Se a coordenada mapeada cair fora da imagem original, retorna 0 (fundo preto)
    if (px < 0 || px >= w || py < 0 || py >= h) {
        return 0;
    }
    return matrix[py][px];
}

/**
 * 1. Translação (Deslocamento)
 * Move a imagem dx pixels no eixo X e dy pixels no eixo Y.
 */
export function translation(matrix, w, h, dx, dy) {
    let res = [];
    for (let y = 0; y < h; y++) {
        res[y] = [];
        for (let x = 0; x < w; x++) {
            // Mapeamento Inverso: x_origem = x_destino - dx
            let srcX = x - dx;
            let srcY = y - dy;
            res[y][x] = getPixel(matrix, srcX, srcY, w, h);
        }
    }
    return res;
}

/**
 * 2. Escala (Zoom in / Zoom out)
 * Redimensiona a imagem baseada nos fatores sx (largura) e sy (altura).
 */
export function scale(matrix, w, h, sx, sy) {
    // Calcula as novas dimensões
    let newW = Math.round(w * sx);
    let newH = Math.round(h * sy);
    
    let res = [];
    for (let y = 0; y < newH; y++) {
        res[y] = [];
        for (let x = 0; x < newW; x++) {
            // Mapeamento Inverso: x_origem = x_destino / sx
            let srcX = x / sx;
            let srcY = y / sy;
            res[y][x] = getPixel(matrix, srcX, srcY, w, h);
        }
    }
    return { matrix: res, w: newW, h: newH };
}

/**
 * 3. Reflexão (Espelhamento)
 * axis = 'x' (espelha horizontalmente) ou 'y' (espelha verticalmente)
 */
export function reflection(matrix, w, h, axis = 'x') {
    let res = [];
    for (let y = 0; y < h; y++) {
        res[y] = [];
        for (let x = 0; x < w; x++) {
            let srcX = axis === 'x' ? (w - 1 - x) : x;
            let srcY = axis === 'y' ? (h - 1 - y) : y;
            res[y][x] = getPixel(matrix, srcX, srcY, w, h);
        }
    }
    return res;
}

/**
 * 4. Cisalhamento (Shear)
 * "Entorta" a imagem proporcionalmente nos eixos.
 * cx = fator de cisalhamento horizontal, cy = vertical.
 */
export function shear(matrix, w, h, cx, cy) {
    let res = [];
    for (let y = 0; y < h; y++) {
        res[y] = [];
        for (let x = 0; x < w; x++) {
            // Mapeamento Inverso resolvendo o sistema de equações lineares:
            // destX = srcX + cx * srcY  ==> srcX = destX - cx * srcY
            // destY = srcY + cy * srcX  (Considerando transformações independentes simples)
            
            let srcX = x - cx * y;
            let srcY = y - cy * x;
            
            res[y][x] = getPixel(matrix, srcX, srcY, w, h);
        }
    }
    return res;
}

/**
 * 5. Rotação
 * Rotaciona a imagem em torno do seu centro.
 * @param {number} angle Graus da rotação (ex: 45, 90, -30)
 */
export function rotation(matrix, w, h, angle) {
    // Converte graus para radianos
    let rad = angle * (Math.PI / 180);
    let cos = Math.cos(rad);
    let sin = Math.sin(rad);

    // Encontra o centro da imagem para rotacionar em torno dele
    let centerX = (w - 1) / 2;
    let centerY = (h - 1) / 2;

    let res = [];
    for (let y = 0; y < h; y++) {
        res[y] = [];
        for (let x = 0; x < w; x++) {
            // Desloca para o centro (0,0) imaginário
            let dx = x - centerX;
            let dy = y - centerY;

            // Mapeamento Inverso usando a matriz de rotação inversa:
            // x' = x*cos(θ) + y*sin(θ)
            // y' = -x*sin(θ) + y*cos(θ)
            let srcX = (dx * cos) + (dy * sin);
            let srcY = -(dx * sin) + (dy * cos);

            // Retorna para as coordenadas reais
            srcX += centerX;
            srcY += centerY;

            res[y][x] = getPixel(matrix, srcX, srcY, w, h);
        }
    }
    return res;
}