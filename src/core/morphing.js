import { inTriangle } from './utils.js';

/**
 * Interpolação linear simples de cor (Cross-Dissolve).
 * Usado como fallback ou para a etapa final do morfismo.
 */
export function crossDissolve(matrixA, matrixB, w, h, t) {
    let res = [];
    for (let i = 0; i < h; i++) {
        res[i] = [];
        for (let j = 0; j < w; j++) {
            let val = ((1 - t) * matrixA[i][j]) + (t * matrixB[i][j]);
            res[i][j] = Math.min(255, Math.max(0, Math.round(val)));
        }
    }
    return res;
}

/**
 * Calcula as coordenadas baricêntricas de um ponto P em relação a um triângulo.
 * Fundamental para o método de Morfismo de Anton & Rorres (Transformação Afim).
 */
export function getBarycentricCoordinates(p, t) {
    let v0 = { x: t.b.x - t.a.x, y: t.b.y - t.a.y };
    let v1 = { x: t.c.x - t.a.x, y: t.c.y - t.a.y };
    let v2 = { x: p.x - t.a.x, y: p.y - t.a.y };

    let d00 = v0.x * v0.x + v0.y * v0.y;
    let d01 = v0.x * v1.x + v0.y * v1.y;
    let d11 = v1.x * v1.x + v1.y * v1.y;
    let d20 = v2.x * v0.x + v2.y * v0.y;
    let d21 = v2.x * v1.x + v2.y * v1.y;

    let denom = d00 * d11 - d01 * d01;
    
    // Se o denominador for 0, o triângulo é degenerado (uma linha)
    if (denom === 0) return { alpha: 0, beta: 0, gamma: 0 };

    let v = (d11 * d20 - d01 * d21) / denom;
    let w = (d00 * d21 - d01 * d20) / denom;
    let u = 1.0 - v - w;

    return { alpha: u, beta: v, gamma: w };
}

/**
 * Morfismo Dependente do Tempo (Anton & Rorres - Cap. 11.21)
 * Combina Distorção Espacial (Warping) baseada em Triangulação com Cross-Dissolve.
 * * @param {Array} matrixA Matriz da imagem Criança
 * @param {Array} matrixB Matriz da imagem Adulto
 * @param {number} w Largura
 * @param {number} h Altura
 * @param {Array} pointsA Pontos de controle na imagem Criança [{x, y}, ...]
 * @param {Array} pointsB Pontos de controle na imagem Adulto [{x, y}, ...]
 * @param {Array} triangles Índices dos triângulos (Delaunay) [i1, j1, k1, i2, j2, k2...]
 * @param {number} t Tempo da animação (0.0 a 1.0)
 */
export function morphAntonRorres(matrixA, matrixB, w, h, pointsA, pointsB, triangles, t) {
    if (!pointsA || !pointsB || pointsA.length === 0) {
        // Fallback para cross-dissolve se não houver pontos de controle
        return crossDissolve(matrixA, matrixB, w, h, t);
    }

    let res = Array.from({ length: h }, () => new Array(w).fill(0));

    // 1. Interpola a posição dos pontos de controle para o instante 't'
    let intermediatePoints = [];
    for (let i = 0; i < pointsA.length; i++) {
        intermediatePoints.push({
            x: (1 - t) * pointsA[i].x + t * pointsB[i].x,
            y: (1 - t) * pointsA[i].y + t * pointsB[i].y
        });
    }

    // 2. Constrói os objetos de triângulo para facilitar o acesso
    let trisA = [], trisB = [], trisMid = [];
    for (let i = 0; i < triangles.length; i += 3) {
        let idx1 = triangles[i], idx2 = triangles[i+1], idx3 = triangles[i+2];
        
        trisA.push({ a: pointsA[idx1], b: pointsA[idx2], c: pointsA[idx3] });
        trisB.push({ a: pointsB[idx1], b: pointsB[idx2], c: pointsB[idx3] });
        trisMid.push({ a: intermediatePoints[idx1], b: intermediatePoints[idx2], c: intermediatePoints[idx3] });
    }

    // 3. Mapeamento Inverso (Inverse Warping)
    // Para cada pixel da imagem final, descobrimos de onde ele veio na imagem A e na B
    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            let currentPoint = { x: x, y: y };
            let foundTriangle = false;

            // Busca em qual triângulo intermediário este pixel caiu
            for (let k = 0; k < trisMid.length; k++) {
                if (inTriangle(currentPoint, trisMid[k])) {
                    foundTriangle = true;
                    
                    // Encontra as coordenadas baricêntricas no triângulo intermediário
                    let coords = getBarycentricCoordinates(currentPoint, trisMid[k]);

                    // Usa as coordenadas para achar o pixel correspondente na Imagem A
                    let srcX_A = Math.round(coords.alpha * trisA[k].a.x + coords.beta * trisA[k].b.x + coords.gamma * trisA[k].c.x);
                    let srcY_A = Math.round(coords.alpha * trisA[k].a.y + coords.beta * trisA[k].b.y + coords.gamma * trisA[k].c.y);

                    // Acha o pixel correspondente na Imagem B
                    let srcX_B = Math.round(coords.alpha * trisB[k].a.x + coords.beta * trisB[k].b.x + coords.gamma * trisB[k].c.x);
                    let srcY_B = Math.round(coords.alpha * trisB[k].a.y + coords.beta * trisB[k].b.y + coords.gamma * trisB[k].c.y);

                    // Garante que os índices não saiam da matriz (Clamp)
                    srcX_A = Math.min(w - 1, Math.max(0, srcX_A));
                    srcY_A = Math.min(h - 1, Math.max(0, srcY_A));
                    srcX_B = Math.min(w - 1, Math.max(0, srcX_B));
                    srcY_B = Math.min(h - 1, Math.max(0, srcY_B));

                    // 4. Cross-Dissolve dos pixels mapeados
                    let valA = matrixA[srcY_A][srcX_A];
                    let valB = matrixB[srcY_B][srcX_B];
                    
                    res[y][x] = Math.round((1 - t) * valA + t * valB);
                    break; // Já achou o triângulo, vai para o próximo pixel
                }
            }

            // Se o pixel cair fora da malha de triângulos, aplica apenas o cross-dissolve puro
            if (!foundTriangle) {
                res[y][x] = Math.round(((1 - t) * matrixA[y][x]) + (t * matrixB[y][x]));
            }
        }
    }

    return res;
}