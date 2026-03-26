// src/core/utils.js

// ===============================
// 1. Leitura e Parse de Arquivos PGM
// ===============================

/**
 * Lê um arquivo e faz o parse do formato PGM (P1 ou P2)
 * Retorna uma Promise que resolve com um objeto: { type, w, h, data }
 */
export function parsePGM(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = function (event) {
            try {
                let lines = event.target.result.trim().split('\n');
                let count = 0;

                let img = {
                    type: lines[count++].trim(),
                    w: 0,
                    h: 0,
                    data: []
                };

                // Pula comentários
                if (lines[count].charAt(0) === '#') count++;

                let resolution = lines[count++].trim().split(/\s+/);
                img.w = parseInt(resolution[0]);
                img.h = parseInt(resolution[1]);

                let separator = img.type === 'P1' ? '' : /\s+/;
                let flat = [];

                // Se for P2, o próximo valor é o maxval (geralmente 255), pulamos ele.
                if (img.type === 'P2') count++;

                for (let i = count; i < lines.length; i++) {
                    let line = lines[i].trim().split(separator);
                    for (let j = 0; j < line.length; j++) {
                        if (line[j]) { // Ignora strings vazias
                            flat.push(parseInt(line[j]) || 0);
                        }
                    }
                }

                let k = 0;
                for (let i = 0; i < img.h; i++) {
                    img.data[i] = [];
                    for (let j = 0; j < img.w; j++) {
                        img.data[i][j] = flat[k++];
                    }
                }

                resolve(img);
            } catch (error) {
                reject(new Error("Erro ao processar o arquivo PGM: " + error.message));
            }
        };

        reader.onerror = () => reject(new Error("Erro ao ler o arquivo."));
        reader.readAsText(file);
    });
}

// ===============================
// 2. Renderização Nativa (HTML5 Canvas)
// ===============================

/**
 * Desenha uma matriz 2D de pixels em um elemento <canvas> do HTML.
 * Substitui o p5.js por uma renderização nativa muito mais rápida.
 */
export function drawMatrixToCanvas(canvas, matrix, w, h, type = 'P2') {
    if (!canvas || !matrix || matrix.length === 0) return;

    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    const imageData = ctx.createImageData(w, h);
    
    let isBinary = (type === 'P1');
    let k = 0;

    for (let i = 0; i < h; i++) {
        for (let j = 0; j < w; j++) {
            let val = matrix[i][j];
            
            // Tratamento para binário (P1) vs Tons de cinza (P2)
            val = isBinary ? (val === 0 ? 255 : 0) : Math.min(255, Math.max(0, val));

            imageData.data[k++] = val; // R
            imageData.data[k++] = val; // G
            imageData.data[k++] = val; // B
            imageData.data[k++] = 255; // Alpha (Opacidade total)
        }
    }

    ctx.putImageData(imageData, 0, 0);
}

// ===============================
// 3. Matemática de Matrizes (Visão Computacional)
// ===============================

export function getRange(matrix, w, h) {
    let max = matrix[0][0];
    let min = max;
    
    for (let i = 0; i < h; i++) {
        for (let j = 0; j < w; j++) {
            let v = matrix[i][j];
            if (v > max) max = v;
            if (v < min) min = v;
        }
    }
    return [min, max];
}

export function normalize(matrix, w, h) {
    let [min, max] = getRange(matrix, w, h);
    let res = [];
    let range = (max - min) === 0 ? 0 : 255 / (max - min);

    for (let i = 0; i < h; ++i) {
        res[i] = [];
        for (let j = 0; j < w; ++j) {
            res[i][j] = Math.round(range * (matrix[i][j] - min));
        }
    }
    return res;
}

export function convolution(matrix, w, h, k, doNormalize = true) {
    let res = [];

    for (let i = 0; i < h; i++) {
        res[i] = [];
        for (let j = 0; j < w; j++) {
            let acc = 0;

            // Preenchimento com zero (Zero-padding) nas bordas
            acc += k[2][2] * (i === 0 || j === 0 ? 0 : matrix[i - 1][j - 1]);
            acc += k[2][1] * (i === 0 ? 0 : matrix[i - 1][j]);
            acc += k[2][0] * (i === 0 || j === w - 1 ? 0 : matrix[i - 1][j + 1]);

            acc += k[1][2] * (j === 0 ? 0 : matrix[i][j - 1]);
            acc += k[1][1] * matrix[i][j];
            acc += k[1][0] * (j === w - 1 ? 0 : matrix[i][j + 1]);

            acc += k[0][2] * (i === h - 1 || j === 0 ? 0 : matrix[i + 1][j - 1]);
            acc += k[0][1] * (i === h - 1 ? 0 : matrix[i + 1][j]);
            acc += k[0][0] * (i === h - 1 || j === w - 1 ? 0 : matrix[i + 1][j + 1]);

            res[i][j] = acc;
        }
    }

    return doNormalize ? normalize(res, w, h) : res;
}

export function magnitude(gx, gy, w, h, doNormalize = true) {
    let res = [];
    for (let i = 0; i < h; i++) {
        res[i] = [];
        for (let j = 0; j < w; j++) {
            res[i][j] = Math.abs(gx[i][j]) + Math.abs(gy[i][j]);
        }
    }
    return doNormalize ? normalize(res, w, h) : res;
}

// ===============================
// 4. Utilitários Gerais e Geometria
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

export function inTriangle(p, t) {
    let v0 = [t.c.x - t.a.x, t.c.y - t.a.y];
    let v1 = [t.b.x - t.a.x, t.b.y - t.a.y];
    let v2 = [p.x - t.a.x, p.y - t.a.y];

    let dot00 = (v0[0] * v0[0]) + (v0[1] * v0[1]);
    let dot01 = (v0[0] * v1[0]) + (v0[1] * v1[1]);
    let dot02 = (v0[0] * v2[0]) + (v0[1] * v2[1]);
    let dot11 = (v1[0] * v1[0]) + (v1[1] * v1[1]);
    let dot12 = (v1[0] * v2[0]) + (v1[1] * v2[1]);

    let invDenom = 1 / (dot00 * dot11 - dot01 * dot01);

    let u = (dot11 * dot02 - dot01 * dot12) * invDenom;
    let v = (dot00 * dot12 - dot01 * dot02) * invDenom;

    return ((u >= 0) && (v >= 0) && (u + v < 1));
}

// ===============================
// 5. Exportação e Download
// ===============================

export function imgToText(matrix, w, h, type = 'P2') {
    let str = `${type}\n${w} ${h}\n`;
    if (type === 'P2') str += '255\n';
    let separator = type === 'P2' ? ' ' : '';

    for (let i = 0; i < h; i++) {
        for (let j = 0; j < w; j++) {
            str += `${matrix[i][j]}${separator}`;
        }
        str += '\n';
    }
    return str;
}

export function downloadPGM(filename, matrix, w, h, type = 'P2') {
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(imgToText(matrix, w, h, type)));
    element.setAttribute('download', filename);

    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
}