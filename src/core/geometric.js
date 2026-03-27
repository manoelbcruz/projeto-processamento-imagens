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
  const result = [];
  
  // Encontramos o centro exato da imagem para usar como pivô (prego central)
  const halfW = w / 2;
  const halfH = h / 2;

  for (let y = 0; y < h; y++) {
    result[y] = [];
    for (let x = 0; x < w; x++) {
      // 1. Deslocamos a coordenada para o centro
      // Agora o (0,0) matemático é o meio da testa da pessoa na foto
      let dx = x - halfW;
      let dy = y - halfH;

      // 2. Mapeamento Inverso do Cisalhamento
      // Invertemos os sinais matemáticos (+ em vez de -) para compensar
      // o eixo Y invertido do monitor
      let srcX = dx + (cx * dy);
      let srcY = dy + (cy * dx);

      // 3. Devolvemos a coordenada para o espaço real do Canvas
      srcX = Math.round(srcX + halfW);
      srcY = Math.round(srcY + halfH);

      // 4. Aritmética Modular
      // Se a imagem esticar para fora da tela, o operador % amarra os
      // limites criando um cilindro, fazendo o pixel entrar pelo lado oposto!
      srcX = ((srcX % w) + w) % w;
      srcY = ((srcY % h) + h) % h;

      // Garantimos que a coordenada seja um número inteiro válido para a matriz
      srcX = Math.floor(srcX);
      srcY = Math.floor(srcY);

      result[y][x] = matrix[srcY][srcX];
    }
  }
  return result;
}

/**
 * Função Auxiliar: Interpolação Bilinear (Spline Linear Bidimensional)
 * Calcula a cor sub-pixel baseada na distância dos 4 vizinhos.
 */
function getPixelBilinear(matrix, w, h, x, y) {
    // Se a coordenada cair nas bordas fora da imagem, preenchemos com preto (0)
    if (x < 0 || x >= w - 1 || y < 0 || y >= h - 1) {
        return 0;
    }

    // Pega as coordenadas inteiras (o "quadrado" ao redor do ponto decimal)
    let x1 = Math.floor(x);
    let y1 = Math.floor(y);
    let x2 = x1 + 1;
    let y2 = y1 + 1;

    // Calcula os "pesos" fracionários (ex: se x = 14.7, dx = 0.7)
    let dx = x - x1;
    let dy = y - y1;

    // Pega o valor da cor dos 4 pixels vizinhos reais
    let p11 = matrix[y1][x1]; // Topo-Esquerda
    let p21 = matrix[y1][x2]; // Topo-Direita
    let p12 = matrix[y2][x1]; // Base-Esquerda
    let p22 = matrix[y2][x2]; // Base-Direita

    // Interpolação no Eixo X (Horizontal)
    let r1 = p11 * (1 - dx) + p21 * dx;
    let r2 = p12 * (1 - dx) + p22 * dx;

    // Interpolação no Eixo Y (Vertical) juntando o resultado
    let val = r1 * (1 - dy) + r2 * dy;

    return Math.round(val);
}



/**
 * 5. Rotação (Com Interpolação Bilinear)
 * Rotaciona a imagem em torno do seu centro eliminando o serrilhado.
 * @param {number} angle Graus da rotação (ex: 45, 90, -30)
 */
export function rotation(matrix, w, h, angle) {
    // Converte graus para radianos
    let rad = angle * (Math.PI / 180);
    let cos = Math.cos(rad);
    let sin = Math.sin(rad);
    
    // A Matriz de Transformação Inversa do Mapeamento Inverso é:
    // T_inv = [ cos, -sin ]
    //         [ sin,  cos ]

    // Encontra o centro fracionário para rotacionar em torno dele
    let centerX = (w - 1) / 2;
    let centerY = (h - 1) / 2;
    
    const zoomFactor = Math.abs(cos) + Math.abs(sin);

    let res = [];
    for (let y = 0; y < h; y++) {
        res[y] = [];
        for (let x = 0; x < w; x++) {
            // Desloca para o centro (0,0) imaginário
            let dx = x - centerX;
            let dy = y - centerY;

            // 1. Aplica o Zoom (Mapeamento Inverso do Zoom)
            // Para o mapeamento inverso, precisamos calcular de onde no espaço da
            // imagem original com zoom puxar o pixel. Então, dividimos pelo zoomFactor.
            let zoomedDx = dx / zoomFactor;
            let zoomedDy = dy / zoomFactor;

            // 2. Mapeamento Inverso da Rotação (usando a matriz inversa)
            // x_origem = cos(θ) * zoomedDx - sin(θ) * zoomedDy
            // y_origem = sin(θ) * zoomedDx + cos(θ) * zoomedDy
            let srcX = (zoomedDx * cos) - (zoomedDy * sin);
            let srcY = (zoomedDx * sin) + (zoomedDy * cos);

            // Retorna para as coordenadas reais do canvas
            srcX += centerX;
            srcY += centerY;

            // Aplica a interpolação Bilinear (Spline Linear) de alta qualidade
            // Interpolação Bilinear
            res[y][x] = getPixelBilinear(matrix, w, h, srcX, srcY);
        }
    }
    return res;
}