import React, { useState, useRef, useEffect } from 'react';
import Delaunator from 'delaunator';
import { parsePGM, drawMatrixToCanvas } from '../core/utils';
import { morphAntonRorres, crossDissolve } from '../core/morphing';

export default function Morfismo() {
  const canvasARef = useRef(null);
  const canvasBRef = useRef(null);
  const canvasResultRef = useRef(null);

  const [imageA, setImageA] = useState(null);
  const [imageB, setImageB] = useState(null);
  
  const [pointsA, setPointsA] = useState([]);
  const [pointsB, setPointsB] = useState([]);
  
  const [time, setTime] = useState(0); // t varia de 0.0 a 1.0
  const [isProcessing, setIsProcessing] = useState(false);

  // Manipulador para carregar Imagem A (Criança)
  const handleFileUploadA = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    try {
      const img = await parsePGM(file);
      setImageA(img);
      setPointsA([]); // Reseta pontos se trocar a imagem
      drawMatrixToCanvas(canvasARef.current, img.data, img.w, img.h, img.type);
      drawPoints(canvasARef.current, []);
    } catch (e) { alert(e.message); }
  };

  // Manipulador para carregar Imagem B (Adulto)
  const handleFileUploadB = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    try {
      const img = await parsePGM(file);
      setImageB(img);
      setPointsB([]); // Reseta pontos
      drawMatrixToCanvas(canvasBRef.current, img.data, img.w, img.h, img.type);
      drawPoints(canvasBRef.current, []);
    } catch (e) { alert(e.message); }
  };

  // Adiciona pontos ao clicar nos canvases
  const handleCanvasClick = (e, isImageA) => {
    setIsProcessing(true);

    const rect = e.target.getBoundingClientRect();
    const x = Math.round(e.clientX - rect.left);
    const y = Math.round(e.clientY - rect.top);

    if (isImageA) {
      const newPts = [...pointsA, { x, y }];
      setPointsA(newPts);
      drawMatrixToCanvas(canvasARef.current, imageA.data, imageA.w, imageA.h, imageA.type);
      drawPoints(canvasARef.current, newPts);
    } else {
      const newPts = [...pointsB, { x, y }];
      setPointsB(newPts);
      drawMatrixToCanvas(canvasBRef.current, imageB.data, imageB.w, imageB.h, imageB.type);
      drawPoints(canvasBRef.current, newPts);
    }
  };

  // Função utilitária para desenhar as bolinhas vermelhas onde o usuário clica
  const drawPoints = (canvas, points) => {
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'red';
    points.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
      ctx.fill();
    });
  };

  // Executa o Morfismo sempre que o controle deslizante (slider) mudar
  useEffect(() => {
    if (!imageA || !imageB) return;
    
    // As imagens precisam ter o mesmo tamanho para o morfismo funcionar perfeitamente
    if (imageA.w !== imageB.w || imageA.h !== imageB.h) {
      return; 
    }

    const timer = setTimeout(() => {
      let resultMatrix = [];
      const t = parseFloat(time);

      // Se o usuário não marcou pontos, fazemos apenas o Cross-Dissolve básico
      if (pointsA.length === 0 || pointsA.length !== pointsB.length || pointsA.length < 3) {
        resultMatrix = crossDissolve(imageA.data, imageB.data, imageA.w, imageA.h, t);
      } else {
        // Se temos pontos iguais, aplicamos a Teoria de Anton & Rorres!
        // Extrai a malha de Delaunay da Imagem A (usando delaunator)
        const coordsA = pointsA.map(p => [p.x, p.y]);
        const delaunay = Delaunator.from(coordsA);
        const triangles = delaunay.triangles; // Array de índices [i1, j1, k1, ...]

        resultMatrix = morphAntonRorres(
          imageA.data, imageB.data, imageA.w, imageA.h, 
          pointsA, pointsB, triangles, t
        );
      }

      drawMatrixToCanvas(canvasResultRef.current, resultMatrix, imageA.w, imageA.h, imageA.type);
      setIsProcessing(false);
    }, 10); // Executa rapidamente após mover o slider

    return () => clearTimeout(timer);
  }, [time, imageA, imageB, pointsA, pointsB]);

  return (
    <div className="space-y-6">
      <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
        <h2 className="text-xl font-bold text-gray-200 mb-2">Morfismo Temporal</h2>
        <p className="text-gray-400 text-sm mb-4">
          Carregue duas imagens do mesmo tamanho. Clique no rosto de ambas para marcar os mesmos pontos de controle (ex: olho esquerdo, olho direito, nariz) na mesma ordem. Depois, mova o controle deslizante do tempo (t).
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Imagem A */}
        <div className="flex flex-col bg-gray-900 p-4 rounded-lg border border-gray-700 items-center">
          <label className="block text-sm font-medium text-gray-400 mb-2">Imagem 1 (Início: t = 0)</label>
          <input type="file" accept=".pgm" onChange={handleFileUploadA} className="mb-4 text-sm text-gray-300" />
          <div className="bg-black relative rounded shadow-inner" style={{ minHeight: '256px', minWidth: '256px' }}>
             <canvas 
               ref={canvasARef} 
               onClick={(e) => imageA && handleCanvasClick(e, true)}
               className="block cursor-crosshair"
             ></canvas>
          </div>
          <p className="text-gray-400 text-xs mt-2">Pontos marcados: {pointsA.length}</p>
        </div>

        {/* Imagem B */}
        <div className="flex flex-col bg-gray-900 p-4 rounded-lg border border-gray-700 items-center">
          <label className="block text-sm font-medium text-gray-400 mb-2">Imagem 2 (Fim: t = 1)</label>
          <input type="file" accept=".pgm" onChange={handleFileUploadB} className="mb-4 text-sm text-gray-300" />
          <div className="bg-black relative rounded shadow-inner" style={{ minHeight: '256px', minWidth: '256px' }}>
             <canvas 
               ref={canvasBRef} 
               onClick={(e) => imageB && handleCanvasClick(e, false)}
               className="block cursor-crosshair"
             ></canvas>
          </div>
          <p className="text-gray-400 text-xs mt-2">Pontos marcados: {pointsB.length}</p>
        </div>
      </div>

      {/* Controle de Tempo e Resultado */}
      <div className="flex flex-col items-center bg-gray-900 p-6 rounded-lg border border-gray-700 mt-8">
        <h3 className="text-lg font-medium text-gray-300 mb-4">Morfismo Resultante</h3>
        
        <div className="w-full max-w-md mb-6">
          <label className="flex justify-between text-sm font-medium text-gray-400 mb-2">
            <span>Imagem 1</span>
            <span>Tempo (t = {time})</span>
            <span>Imagem 2</span>
          </label>
          <input 
            type="range" 
            min="0" max="1" step="0.05" 
            value={time} 
            onChange={(e) => {
            setIsProcessing(true); // Avisa a tela que vai calcular
            setTime(e.target.value); // Muda o tempo (o que dispara o useEffect)
            }}
            disabled={!imageA || !imageB}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
          />
        </div>

        <div className="bg-black flex items-center justify-center overflow-auto rounded shadow-inner" style={{ minHeight: '256px', minWidth: '256px' }}>
            <canvas ref={canvasResultRef} className="block"></canvas>
        </div>
        
        {isProcessing && <p className="text-blue-500 text-sm mt-4 font-bold animate-pulse">Calculando distorção geométrica...</p>}
      </div>
    </div>
  );
}