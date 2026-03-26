import React, { useState, useRef, useMemo } from 'react';
import { parsePGM, drawMatrixToCanvas, convolution } from '../core/utils';
import { 
  kernelMap, 
  medianFilter, 
  highBoostFilter, 
  sobelXY, 
  prewittXY, 
  gradientXY, 
  robertsXY 
} from '../core/filters';

export default function Filtros() {
  const canvasOriginalRef = useRef(null);
  const canvasProcessedRef = useRef(null);

  const [imageState, setImageState] = useState(null); 
  const [processedMatrix, setProcessedMatrix] = useState(null); 
  const [selectedFilter, setSelectedFilter] = useState('0');
  const [isProcessing, setIsProcessing] = useState(false);
  const [highBoostA, setHighBoostA] = useState(1.5);
  
  const [doNormalize, setDoNormalize] = useState(false);

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const img = await parsePGM(file);
      setImageState(img);
      setProcessedMatrix(null);
      
      if (canvasOriginalRef.current) {
        drawMatrixToCanvas(canvasOriginalRef.current, img.data, img.w, img.h, img.type);
      }
      
      if (canvasProcessedRef.current) {
         const ctx = canvasProcessedRef.current.getContext('2d');
         ctx.clearRect(0, 0, img.w, img.h);
      }
    } catch (error) {
      alert("Erro ao ler a imagem: " + error.message);
    }
  };

  const handleApplyFilter = () => {
    if (!imageState) {
      alert("Por favor, carregue uma imagem primeiro.");
      return;
    }

    setIsProcessing(true);

    setTimeout(() => {
      const { data, w, h, type } = imageState;
      const filterValue = parseInt(selectedFilter);
      let result = [];

      // Funções Especiais de Magnitude e Suavização
      if (filterValue === 0) {
        result = data;
      } else if (filterValue === 23) { 
        result = medianFilter(data, w, h, doNormalize);
      } else if (filterValue === 24) { 
        result = highBoostFilter(data, w, h, highBoostA, doNormalize);
      } else if (filterValue === 19) { 
        result = robertsXY(data, w, h, doNormalize);
      } else if (filterValue === 20) { 
        result = gradientXY(data, w, h, doNormalize);
      } else if (filterValue === 22) { 
        result = prewittXY(data, w, h, doNormalize);
      } else if (filterValue === 21) { 
        result = sobelXY(data, w, h, doNormalize);
      } else {
        // Pega todos os direcionais (X e Y), Laplace e Média direto do kernelMap
        const activeKernel = kernelMap[filterValue];
        if (activeKernel) {
          result = convolution(data, w, h, activeKernel, doNormalize);
        }
      }

      setProcessedMatrix(result);

      if (canvasProcessedRef.current && result.length > 0) {
        drawMatrixToCanvas(canvasProcessedRef.current, result, w, h, type);
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

    if (!matrix) return <p className="text-gray-500 text-sm mt-4">Aguardando imagem...</p>;

    return (
      <div className="mt-4 flex flex-col h-64">
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
      <div className="flex flex-col md:flex-row gap-4 bg-gray-800 p-4 rounded-lg border border-gray-700 items-end">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-400 mb-1">Upload PGM</label>
          <input 
            type="file" 
            accept=".pgm" 
            onChange={handleFileUpload}
            className="block w-full text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer"
          />
        </div>

        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-400 mb-1">Selecione o Filtro</label>
          <select 
            value={selectedFilter}
            onChange={(e) => setSelectedFilter(e.target.value)}
            className="block w-full bg-gray-900 border border-gray-600 text-gray-300 rounded-md py-2 px-3 focus:outline-none focus:border-blue-500"
          >
            <option value="0">Nenhum</option>
            <optgroup label="Filtros Gerais">
              <option value="9">Média (Passa-Baixa)</option>
              <option value="23">Mediana</option>
              <option value="24">High-Boost</option>
            </optgroup>
            <optgroup label="Filtros Direcionais: Roberts">
              <option value="13">Roberts Eixo X</option>
              <option value="14">Roberts Eixo Y</option>
              <option value="19">Roberts Magnitude Cruzada (XY)</option>
            </optgroup>
            <optgroup label="Filtros Direcionais: Sobel">
              <option value="5">Sobel Eixo X</option>
              <option value="6">Sobel Eixo Y</option>
              <option value="21">Sobel Magnitude Cruzada (XY)</option>
            </optgroup>
            <optgroup label="Filtros Direcionais: Prewitt">
              <option value="7">Prewitt Eixo X</option>
              <option value="8">Prewitt Eixo Y</option>
              <option value="22">Prewitt Magnitude Cruzada (XY)</option>
            </optgroup>
            <optgroup label="Filtros Direcionais: Gradiente">
              <option value="11">Gradiente Eixo X</option>
              <option value="12">Gradiente Eixo Y</option>
              <option value="20">Gradiente Magnitude Cruzada (XY)</option>
            </optgroup>
          </select>
        </div>

        {selectedFilter === '24' && (
          <div className="w-20">
            <label className="block text-sm font-medium text-gray-400 mb-1">Fator (A)</label>
            <input 
              type="number" 
              step="0.1"
              value={highBoostA}
              onChange={(e) => setHighBoostA(parseFloat(e.target.value))}
              className="block w-full bg-gray-900 border border-gray-600 text-gray-300 rounded-md py-2 px-3 focus:outline-none focus:border-blue-500"
            />
          </div>
        )}

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
            onClick={handleApplyFilter}
            disabled={isProcessing || !imageState}
            className="w-full md:w-auto bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-md disabled:opacity-50 transition-colors"
          >
            {isProcessing ? 'Calculando...' : 'Aplicar'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
        <div className="flex flex-col bg-gray-900 p-4 rounded-lg border border-gray-700">
          <h3 className="text-lg font-medium text-gray-300 mb-4 text-center">Imagem Original</h3>
          <div className="bg-black flex items-center justify-center overflow-auto rounded shadow-inner mb-4" style={{ minHeight: '256px' }}>
             <canvas ref={canvasOriginalRef} className="block"></canvas>
          </div>
          <PixelTable matrix={imageState?.data} title="Matriz de Pixels Original" />
        </div>

        <div className="flex flex-col bg-gray-900 p-4 rounded-lg border border-gray-700">
          <h3 className="text-lg font-medium text-gray-300 mb-4 text-center">Imagem Filtrada</h3>
          <div className="bg-black flex items-center justify-center overflow-auto rounded shadow-inner mb-4" style={{ minHeight: '256px' }}>
             <canvas ref={canvasProcessedRef} className="block"></canvas>
          </div>
          <PixelTable matrix={processedMatrix} title="Matriz Resultante" />
        </div>
      </div>
    </div>
  );
}