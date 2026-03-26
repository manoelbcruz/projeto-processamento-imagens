/**
 * 1. Calcula o histograma de uma imagem (frequência de cada nível de cinza).
 * @param {Array<Array<number>>} matrix Matriz 2D da imagem
 * @param {number} w Largura da imagem
 * @param {number} h Altura da imagem
 * @returns {Array<number>} Array de 256 posições com a contagem de pixels
 */
export function getHistogram(matrix, w, h) {
    let hist = new Array(256).fill(0);
    
    for (let i = 0; i < h; i++) {
        for (let j = 0; j < w; j++) {
            // Garante que o valor está entre 0 e 255 inteiro para acessar o índice
            let val = Math.round(matrix[i][j]);
            if (val >= 0 && val <= 255) {
                hist[val]++;
            }
        }
    }
    
    return hist;
}

/**
 * 2. Calcula a probabilidade de ocorrência de cada nível de cinza
 */
export function getHistProbability(hist, totalPixels) {
    let prob = new Array(256).fill(0);
    for (let i = 0; i < 256; i++) {
        prob[i] = hist[i] / totalPixels;
    }
    return prob;
}

/**
 * 3. Calcula a Função de Distribuição Acumulada (FDA / CDF)
 */
export function getAccumulatedProbability(probArray) {
    let acc = new Array(256).fill(0);
    let sum = 0;
    for (let i = 0; i < 256; i++) {
        sum += probArray[i];
        acc[i] = sum;
    }
    return acc;
}

/**
 * 4. Gera o array de mapeamento dos novos níveis de cinza após equalização
 */
export function getEqualizationScale(accArray) {
    let scale = new Array(256).fill(0);
    for (let i = 0; i < 256; i++) {
        // Multiplica a FDA por 255 e arredonda
        scale[i] = Math.max(0, Math.min(255, Math.round(accArray[i] * 255)));
    }
    return scale;
}

/**
 * 5. Função principal: Equaliza a matriz da imagem
 * @param {Array<Array<number>>} matrix Matriz original
 * @param {number} w Largura
 * @param {number} h Altura
 * @returns {Array<Array<number>>} Nova matriz equalizada
 */
export function equalizeImage(matrix, w, h) {
    if (!matrix || matrix.length === 0) return [];

    const totalPixels = w * h;
    
    // Passo a Passo do Algoritmo Clássico de Equalização
    const hist = getHistogram(matrix, w, h);
    const histProb = getHistProbability(hist, totalPixels);
    const accProb = getAccumulatedProbability(histProb);
    const scale = getEqualizationScale(accProb);

    let res = [];
    
    // Aplica o novo valor de cinza para cada pixel baseado no mapa 'scale'
    for (let i = 0; i < h; i++) {
        res[i] = [];
        for (let j = 0; j < w; j++) {
            let oldVal = Math.round(matrix[i][j]);
            
            // Tratamento de segurança para limites
            if (oldVal < 0) oldVal = 0;
            if (oldVal > 255) oldVal = 255;
            
            res[i][j] = scale[oldVal];
        }
    }
    
    return res;
}

/**
 * Utilitário extra para o Frontend: 
 * Desenha um histograma simples usando API nativa do HTML5 Canvas (sem p5.js)
 */
export function drawHistogramToCanvas(canvas, histArray) {
    if (!canvas || !histArray) return;
    
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    
    // Limpa o canvas
    ctx.clearRect(0, 0, w, h);
    
    // Encontra o valor máximo para escalonar as barras
    const maxVal = Math.max(...histArray);
    if (maxVal === 0) return;
    
    const barWidth = w / 256;
    
    ctx.fillStyle = '#3b82f6'; // Cor azul padrão do Tailwind (blue-500)
    
    for (let i = 0; i < 256; i++) {
        const barHeight = (histArray[i] / maxVal) * (h * 0.9); // 90% da altura máxima
        ctx.fillRect(i * barWidth, h - barHeight, barWidth, barHeight);
    }
}