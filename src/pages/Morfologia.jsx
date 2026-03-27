import React, { useState, useRef, useMemo } from 'react';
import { parsePGM, drawMatrixToCanvas } from '../core/utils';
import { 
  complement, erosion, dilation, opening, closing, external, internal, gradient, thinning,
  erosionGray, dilationGray, openingGray, closingGray, gradientGray, topHat, bottomHat 
} from '../core/morphology';
import ImageViewer from '../components/ImageViewer';

export default function Morfologia() {
  const canvasOriginalRef = useRef(null);
  const canvasProcessedRef = useRef(null);

  const [imageState, setImageState] = useState(null);
  const [processedMatrix, setProcessedMatrix] = useState(null);
  const [selectedOperation, setSelectedOperation] = useState('2'); // Começa com Erosão Binária
  const [isProcessing, setIsProcessing] = useState(false);

  // O Elemento Estruturante (Kernel 3x3). Começa com a "cruz" clássica (vizinhos 4-conectados)
  const [kernel, setKernel] = useState([
    0, 1, 0,
    1, 1, 1,
    0, 1, 0
  ]);

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

  // Atualiza um valor específico dentro do array do Kernel 3x3
  const handleKernelChange = (index, value) => {
    const newKernel = [...kernel];
    // Garante que seja 0 ou 1 (para o elemento estruturante)
    newKernel[index] = parseInt(value) || 0;
    setKernel(newKernel);
  };

  const handleApplyMorphology = () => {
    if (!imageState) return alert("Por favor, carregue uma imagem primeiro.");

    setIsProcessing(true);

    setTimeout(() => {
      const { data, w, h, type } = imageState;
      const op = parseInt(selectedOperation);
      let result = [];

      // Roteamento das Operações Binárias (1 a 9) e Tons de Cinza (10 a 16)
      if (op === 1) result = complement(data);
      else if (op === 2) result = erosion(data, w, h, kernel);
      else if (op === 3) result = dilation(data, w, h, kernel);
      else if (op === 4) result = opening(data, w, h, kernel);
      else if (op === 5) result = closing(data, w, h, kernel);
      else if (op === 6) result = external(data, w, h, kernel);
      else if (op === 7) result = internal(data, w, h, kernel);
      else if (op === 8) result = gradient(data, w, h, kernel);
      else if (op === 9) result = thinning(data, w, h, kernel);
      else if (op === 10) result = erosionGray(data, w, h, kernel);
      else if (op === 11) result = dilationGray(data, w, h, kernel);
      else if (op === 12) result = openingGray(data, w, h, kernel);
      else if (op === 13) result = closingGray(data, w, h, kernel);
      else if (op === 14) result = gradientGray(data, w, h, kernel);
      else if (op === 15) result = topHat(data, w, h, kernel);
      else if (op === 16) result = bottomHat(data, w, h, kernel);
      else result = data; // 0 ou inválido

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
      <div className="flex flex-col lg:flex-row gap-6 bg-gray-800 p-4 rounded-lg border border-gray-700">
        
        <div className="flex-1 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Upload da Imagem PGM/PBM</label>
            <input 
              type="file" 
              accept=".pgm,.pbm" 
              onChange={handleFileUpload}
              className="block w-full text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Operação Morfológica</label>
            <select 
              value={selectedOperation}
              onChange={(e) => setSelectedOperation(e.target.value)}
              className="block w-full bg-gray-900 border border-gray-600 text-gray-300 rounded-md py-2 px-3 focus:outline-none focus:border-blue-500"
            >
              <option value="0">Nenhuma</option>
              <optgroup label="Binária (Para imagens PBM 0 e 1)">
                <option value="1">Complemento</option>
                <option value="2">Erosão</option>
                <option value="3">Dilatação</option>
                <option value="4">Abertura</option>
                <option value="5">Fechamento</option>
                <option value="6">Contorno Externo</option>
                <option value="7">Contorno Interno</option>
                <option value="8">Gradiente Morfológico</option>
                <option value="9">Afinamento (Thinning)</option>
              </optgroup>
              <optgroup label="Tons de Cinza (Para imagens PGM 0-255)">
                <option value="10">Erosão Gray</option>
                <option value="11">Dilatação Gray</option>
                <option value="12">Abertura Gray</option>
                <option value="13">Fechamento Gray</option>
                <option value="14">Gradiente Morfológico Gray</option>
                <option value="15">Top-Hat</option>
                <option value="16">Bottom-Hat</option>
              </optgroup>
            </select>
          </div>
        </div>

        {/* Matriz 3x3 do Elemento Estruturante */}
        <div className="flex flex-col items-center bg-gray-900 p-3 rounded-md border border-gray-700">
          <label className="block text-sm font-medium text-gray-400 mb-2">Elemento Estruturante (Kernel)</label>
          <div className="grid grid-cols-3 gap-1">
            {kernel.map((val, idx) => (
              <input 
                key={idx}
                type="number"
                min="0"
                max="1"
                value={val}
                onChange={(e) => handleKernelChange(idx, e.target.value)}
                className="w-10 h-10 text-center bg-gray-800 border border-gray-600 text-gray-200 rounded focus:outline-none focus:border-blue-500 font-mono"
              />
            ))}
          </div>
        </div>

        <div className="flex items-end">
          <button 
            onClick={handleApplyMorphology}
            disabled={isProcessing || !imageState}
            className="w-full h-10 bg-green-600 hover:bg-green-700 text-white font-bold px-6 rounded-md disabled:opacity-50 transition-colors"
          >
            {isProcessing ? 'Calculando...' : 'Aplicar'}
          </button>
        </div>
      </div>

     <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
        <ImageViewer 
          matrix={imageState?.data} 
          w={imageState?.w} 
          h={imageState?.h} 
          type={imageState?.type} 
          title="Imagem Original" 
        />
        <ImageViewer 
          matrix={processedMatrix} 
          w={imageState?.w} 
          h={imageState?.h} 
          type={imageState?.type} 
          title="Imagem Processada" 
        />
      </div>
    </div>
  );
}