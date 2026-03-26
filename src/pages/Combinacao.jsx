import React, { useState, useRef, useMemo } from 'react';
import { parsePGM, drawMatrixToCanvas } from '../core/utils';
import { applyComposition, operators } from '../core/composition';

export default function Combinacao() {
  const canvasARef = useRef(null);
  const canvasBRef = useRef(null);
  const canvasResultRef = useRef(null);

  const [imageA, setImageA] = useState(null);
  const [imageB, setImageB] = useState(null);
  const [processedMatrix, setProcessedMatrix] = useState(null);
  
  const [selectedOperator, setSelectedOperator] = useState('1'); // Começa na Adição
  const [doNormalize, setDoNormalize] = useState(true); // Normalização é super importante aqui
  const [isProcessing, setIsProcessing] = useState(false);

  // Upload Imagem A
  const handleFileUploadA = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    try {
      const img = await parsePGM(file);
      setImageA(img);
      setProcessedMatrix(null);
      drawMatrixToCanvas(canvasARef.current, img.data, img.w, img.h, img.type);
    } catch (e) { alert(e.message); }
  };

  // Upload Imagem B
  const handleFileUploadB = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    try {
      const img = await parsePGM(file);
      setImageB(img);
      setProcessedMatrix(null);
      drawMatrixToCanvas(canvasBRef.current, img.data, img.w, img.h, img.type);
    } catch (e) { alert(e.message); }
  };

  const handleApplyCombination = () => {
    if (!imageA || !imageB) {
      alert("Por favor, carregue as duas imagens (A e B) primeiro.");
      return;
    }

    if (imageA.w !== imageB.w || imageA.h !== imageB.h) {
      alert("Atenção: As matrizes precisam ter exatamente as mesmas dimensões para serem combinadas!");
      return;
    }

    setIsProcessing(true);

    setTimeout(() => {
      const operatorFn = operators[selectedOperator];
      
      // Aplica a matemática isolada que criamos no core
      const resultMatrix = applyComposition(
        imageA.data, 
        imageB.data, 
        imageA.w, 
        imageA.h, 
        operatorFn, 
        doNormalize
      );

      setProcessedMatrix(resultMatrix);

      if (canvasResultRef.current && resultMatrix.length > 0) {
        drawMatrixToCanvas(canvasResultRef.current, resultMatrix, imageA.w, imageA.h, imageA.type);
      }

      setIsProcessing(false);
    }, 50);
  };

  const PixelTable = ({ matrix, title }) => {
    const tableHTML = useMemo(() => {
      if (!matrix || matrix.length === 0) return '';
      let html = '<table class="w-full text-center border-collapse text-[10px] text-gray-300">';
      html += '<tbody>';
      for (let i = 0; i < matrix.length; i++) {
        html += '<tr>';
        for (let j = 0; j < matrix[i].length; j++) {
          html += `<td class="border border-gray-700 p-0.5 min-w-[20px]">${matrix[i][j]}</td>`;
        }
        html += '</tr>';
      }
      html += '</tbody></table>';
      return html;
    }, [matrix]);

    if (!matrix) return <p className="text-gray-500 text-sm mt-4">Aguardando...</p>;

    return (
      <div className="mt-4 flex flex-col h-48">
        <h4 className="text-sm font-semibold text-gray-400 mb-2">{title}</h4>
        <div 
          className="flex-1 overflow-auto bg-gray-950 border border-gray-700 rounded"
          dangerouslySetInnerHTML={{ __html: tableHTML }}
        />
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Controles Principais */}
      <div className="flex flex-col lg:flex-row gap-4 bg-gray-800 p-4 rounded-lg border border-gray-700 items-end flex-wrap">
        
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-medium text-gray-400 mb-1">Upload Imagem A</label>
          <input type="file" accept=".pgm,.pbm" onChange={handleFileUploadA} className="block w-full text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer" />
        </div>

        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-medium text-gray-400 mb-1">Upload Imagem B</label>
          <input type="file" accept=".pgm,.pbm" onChange={handleFileUploadB} className="block w-full text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer" />
        </div>

        <div className="w-48">
          <label className="block text-sm font-medium text-gray-400 mb-1">Operação</label>
          <select 
            value={selectedOperator}
            onChange={(e) => setSelectedOperator(e.target.value)}
            className="block w-full bg-gray-900 border border-gray-600 text-gray-300 rounded-md py-2 px-3 focus:outline-none focus:border-blue-500"
          >
            <optgroup label="Aritméticas">
              <option value="1">Adição (A + B)</option>
              <option value="2">Subtração (A - B)</option>
              <option value="3">Multiplicação (A * B)</option>
              <option value="4">Divisão (A / B)</option>
            </optgroup>
            <optgroup label="Lógicas">
              <option value="5">OR (A | B)</option>
              <option value="6">AND (A & B)</option>
              <option value="7">XOR (A ^ B)</option>
            </optgroup>
          </select>
        </div>

        <div className="flex items-center pb-2 px-2">
          <label className="flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              checked={doNormalize}
              onChange={(e) => setDoNormalize(e.target.checked)}
              className="form-checkbox h-5 w-5 text-blue-600 bg-gray-900 border-gray-600 rounded"
            />
            <span className="ml-2 text-sm text-gray-300">Normalizar</span>
          </label>
        </div>

        <div>
          <button 
            onClick={handleApplyCombination}
            disabled={isProcessing || !imageA || !imageB}
            className="w-full md:w-auto bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-md disabled:opacity-50 transition-colors"
          >
            {isProcessing ? 'Calculando...' : 'Combinar'}
          </button>
        </div>
      </div>

      {/* Visualização de Matrizes e Imagens */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        
        {/* Imagem A */}
        <div className="flex flex-col bg-gray-900 p-4 rounded-lg border border-gray-700">
          <h3 className="text-md font-medium text-gray-300 mb-4 text-center">Imagem A</h3>
          <div className="bg-black flex items-center justify-center overflow-auto rounded shadow-inner mb-4" style={{ minHeight: '200px' }}>
             <canvas ref={canvasARef} className="block"></canvas>
          </div>
          <PixelTable matrix={imageA?.data} title="Matriz A" />
        </div>

        {/* Imagem B */}
        <div className="flex flex-col bg-gray-900 p-4 rounded-lg border border-gray-700">
          <h3 className="text-md font-medium text-gray-300 mb-4 text-center">Imagem B</h3>
          <div className="bg-black flex items-center justify-center overflow-auto rounded shadow-inner mb-4" style={{ minHeight: '200px' }}>
             <canvas ref={canvasBRef} className="block"></canvas>
          </div>
          <PixelTable matrix={imageB?.data} title="Matriz B" />
        </div>

        {/* Resultado */}
        <div className="flex flex-col bg-indigo-950 p-4 rounded-lg border border-indigo-700">
          <h3 className="text-md font-bold text-indigo-300 mb-4 text-center">Resultado (A op B)</h3>
          <div className="bg-black flex items-center justify-center overflow-auto rounded shadow-inner mb-4" style={{ minHeight: '200px' }}>
             <canvas ref={canvasResultRef} className="block"></canvas>
          </div>
          <PixelTable matrix={processedMatrix} title="Matriz Resultante" />
        </div>

      </div>
    </div>
  );
}