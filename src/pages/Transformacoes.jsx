import React, { useState, useRef, useMemo } from 'react';
import { parsePGM, drawMatrixToCanvas } from '../core/utils';
import { 
  applyIntensityTransformation, 
  negative, 
  gamma, 
  logarithmic, 
  sigmoid, 
  dynamicRange, 
  linear 
} from '../core/transformations';

export default function Transformacoes() {
  const canvasOriginalRef = useRef(null);
  const canvasProcessedRef = useRef(null);

  const [imageState, setImageState] = useState(null);
  const [processedMatrix, setProcessedMatrix] = useState(null);
  const [selectedTransform, setSelectedTransform] = useState('0');
  const [isProcessing, setIsProcessing] = useState(false);
  const [doNormalize, setDoNormalize] = useState(false);

  // Estados para os parâmetros matemáticos das transformações
  const [gammaVal, setGammaVal] = useState(1);
  const [logVal, setLogVal] = useState(1);
  const [sigCenter, setSigCenter] = useState(127);
  const [sigWidth, setSigWidth] = useState(25);
  const [dynTarget, setDynTarget] = useState(255);
  const [linA, setLinA] = useState(1);
  const [linB, setLinB] = useState(0);

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

  const handleApplyTransform = () => {
    if (!imageState) return alert("Por favor, carregue uma imagem primeiro.");

    setIsProcessing(true);

    // O pequeno delay para a interface respirar antes do cálculo matricial
    setTimeout(() => {
      const { data, w, h, type } = imageState;
      const transformValue = parseInt(selectedTransform);
      let result = [];

      // Roteamento das Transformações de Intensidade
      if (transformValue === 0) {
        result = data;
      } else if (transformValue === 1) {
        result = applyIntensityTransformation(data, w, h, negative, doNormalize);
      } else if (transformValue === 2) {
        result = applyIntensityTransformation(data, w, h, (r) => gamma(r, gammaVal), doNormalize);
      } else if (transformValue === 3) {
        result = applyIntensityTransformation(data, w, h, (r) => logarithmic(r, logVal), doNormalize);
      } else if (transformValue === 4) {
        result = applyIntensityTransformation(data, w, h, (r) => linear(r, linA, linB), doNormalize);
      } else if (transformValue === 5) {
        result = applyIntensityTransformation(data, w, h, (r) => dynamicRange(r, dynTarget), doNormalize);
      } else if (transformValue === 6) {
        result = applyIntensityTransformation(data, w, h, (r) => sigmoid(r, sigCenter, sigWidth), doNormalize);
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
      <div className="flex flex-col md:flex-row gap-4 bg-gray-800 p-4 rounded-lg border border-gray-700 items-end flex-wrap">
        
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-medium text-gray-400 mb-1">Upload PGM</label>
          <input 
            type="file" 
            accept=".pgm" 
            onChange={handleFileUpload}
            className="block w-full text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer"
          />
        </div>

        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-medium text-gray-400 mb-1">Transformação</label>
          <select 
            value={selectedTransform}
            onChange={(e) => setSelectedTransform(e.target.value)}
            className="block w-full bg-gray-900 border border-gray-600 text-gray-300 rounded-md py-2 px-3 focus:outline-none focus:border-blue-500"
          >
            <option value="0">Nenhuma</option>
            <option value="1">Negativo</option>
            <option value="2">Gama</option>
            <option value="3">Logarítmica</option>
            <option value="4">Linear</option>
            <option value="5">Faixa Dinâmica</option>
            <option value="6">Sigmoide</option>
          </select>
        </div>

        {/* Inputs Dinâmicos Baseados na Seleção */}
        {selectedTransform === '2' && (
          <div className="w-24">
            <label className="block text-sm font-medium text-gray-400 mb-1">Valor Gama</label>
            <input type="number" step="0.1" value={gammaVal} onChange={(e) => setGammaVal(parseFloat(e.target.value))} className="block w-full bg-gray-900 border border-gray-600 text-gray-300 rounded-md py-2 px-3" />
          </div>
        )}

        {selectedTransform === '3' && (
          <div className="w-24">
            <label className="block text-sm font-medium text-gray-400 mb-1">Escalar</label>
            <input type="number" step="0.1" value={logVal} onChange={(e) => setLogVal(parseFloat(e.target.value))} className="block w-full bg-gray-900 border border-gray-600 text-gray-300 rounded-md py-2 px-3" />
          </div>
        )}

        {selectedTransform === '4' && (
          <>
            <div className="w-20">
              <label className="block text-sm font-medium text-gray-400 mb-1">Fator a</label>
              <input type="number" step="0.1" value={linA} onChange={(e) => setLinA(parseFloat(e.target.value))} className="block w-full bg-gray-900 border border-gray-600 text-gray-300 rounded-md py-2 px-3" />
            </div>
            <div className="w-20">
              <label className="block text-sm font-medium text-gray-400 mb-1">Fator b</label>
              <input type="number" step="1" value={linB} onChange={(e) => setLinB(parseFloat(e.target.value))} className="block w-full bg-gray-900 border border-gray-600 text-gray-300 rounded-md py-2 px-3" />
            </div>
          </>
        )}

        {selectedTransform === '5' && (
          <div className="w-24">
            <label className="block text-sm font-medium text-gray-400 mb-1">Alvo (Max)</label>
            <input type="number" step="1" value={dynTarget} onChange={(e) => setDynTarget(parseFloat(e.target.value))} className="block w-full bg-gray-900 border border-gray-600 text-gray-300 rounded-md py-2 px-3" />
          </div>
        )}

        {selectedTransform === '6' && (
          <>
            <div className="w-24">
              <label className="block text-sm font-medium text-gray-400 mb-1">Centro (W)</label>
              <input type="number" step="1" value={sigCenter} onChange={(e) => setSigCenter(parseFloat(e.target.value))} className="block w-full bg-gray-900 border border-gray-600 text-gray-300 rounded-md py-2 px-3" />
            </div>
            <div className="w-24">
              <label className="block text-sm font-medium text-gray-400 mb-1">Largura (σ)</label>
              <input type="number" step="1" value={sigWidth} onChange={(e) => setSigWidth(parseFloat(e.target.value))} className="block w-full bg-gray-900 border border-gray-600 text-gray-300 rounded-md py-2 px-3" />
            </div>
          </>
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
            onClick={handleApplyTransform}
            disabled={isProcessing || !imageState}
            className="w-full md:w-auto bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-md disabled:opacity-50 transition-colors"
          >
            {isProcessing ? 'Calculando...' : 'Aplicar Transformação'}
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
          <h3 className="text-lg font-medium text-gray-300 mb-4 text-center">Imagem Transformada</h3>
          <div className="bg-black flex items-center justify-center overflow-auto rounded shadow-inner mb-4" style={{ minHeight: '256px' }}>
             <canvas ref={canvasProcessedRef} className="block"></canvas>
          </div>
          <PixelTable matrix={processedMatrix} title="Matriz Resultante" />
        </div>
      </div>
    </div>
  );
}