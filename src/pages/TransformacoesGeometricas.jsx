import React, { useState, useRef, useMemo } from 'react';
import { parsePGM, drawMatrixToCanvas } from '../core/utils';
import { translation, scale, reflection, shear, rotation } from '../core/geometric';
import ImageViewer from '../components/ImageViewer';

export default function TransformacoesGeometricas() {
  const canvasOriginalRef = useRef(null);
  const canvasProcessedRef = useRef(null);

  const [imageState, setImageState] = useState(null);
  const [processedResult, setProcessedResult] = useState(null);
  const [selectedTransform, setSelectedTransform] = useState('0');
  const [isProcessing, setIsProcessing] = useState(false);

  // Estados dos Parâmetros Geométricos
  const [dx, setDx] = useState(50);
  const [dy, setDy] = useState(50);
  const [sx, setSx] = useState(1.5);
  const [sy, setSy] = useState(1.5);
  const [axis, setAxis] = useState('x');
  const [cx, setCx] = useState(0.5);
  const [cy, setCy] = useState(0.0);
  const [angle, setAngle] = useState(45);

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const img = await parsePGM(file);
      setImageState(img);
      setProcessedResult(null);
      
      if (canvasOriginalRef.current) {
        drawMatrixToCanvas(canvasOriginalRef.current, img.data, img.w, img.h, img.type);
      }
      if (canvasProcessedRef.current) {
         const ctx = canvasProcessedRef.current.getContext('2d');
         ctx.clearRect(0, 0, canvasProcessedRef.current.width, canvasProcessedRef.current.height);
      }
    } catch (error) {
      alert("Erro ao ler a imagem: " + error.message);
    }
  };

  const handleApplyTransform = () => {
    if (!imageState) return alert("Por favor, carregue uma imagem primeiro.");

    setIsProcessing(true);

    setTimeout(() => {
      const { data, w, h, type } = imageState;
      let resultMatrix = [];
      let newW = w;
      let newH = h;

      if (selectedTransform === 'translation') {
        resultMatrix = translation(data, w, h, dx, dy);
      } else if (selectedTransform === 'scale') {
        const scaled = scale(data, w, h, sx, sy);
        resultMatrix = scaled.matrix;
        newW = scaled.w;
        newH = scaled.h;
      } else if (selectedTransform === 'reflection') {
        resultMatrix = reflection(data, w, h, axis);
      } else if (selectedTransform === 'shear') {
        resultMatrix = shear(data, w, h, cx, cy);
      } else if (selectedTransform === 'rotation') {
        resultMatrix = rotation(data, w, h, angle);
      } else {
        resultMatrix = data;
      }

      setProcessedResult({ matrix: resultMatrix, w: newW, h: newH });

      if (canvasProcessedRef.current && resultMatrix.length > 0) {
        drawMatrixToCanvas(canvasProcessedRef.current, resultMatrix, newW, newH, type);
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
          <label className="block text-sm font-medium text-gray-400 mb-1">Transformação Geométrica</label>
          <select 
            value={selectedTransform}
            onChange={(e) => setSelectedTransform(e.target.value)}
            className="block w-full bg-gray-900 border border-gray-600 text-gray-300 rounded-md py-2 px-3 focus:outline-none focus:border-blue-500"
          >
            <option value="0">Nenhuma</option>
            <option value="translation">Translação</option>
            <option value="scale">Escala</option>
            <option value="reflection">Reflexão</option>
            <option value="shear">Cisalhamento</option>
            <option value="rotation">Rotação</option>
          </select>
        </div>

        {/* Parâmetros Condicionais */}
        {selectedTransform === 'translation' && (
          <>
            <div className="w-20"><label className="block text-sm text-gray-400 mb-1">dx (X)</label><input type="number" value={dx} onChange={(e) => setDx(parseInt(e.target.value))} className="w-full bg-gray-900 border border-gray-600 text-gray-300 rounded-md py-2 px-3" /></div>
            <div className="w-20"><label className="block text-sm text-gray-400 mb-1">dy (Y)</label><input type="number" value={dy} onChange={(e) => setDy(parseInt(e.target.value))} className="w-full bg-gray-900 border border-gray-600 text-gray-300 rounded-md py-2 px-3" /></div>
          </>
        )}

        {selectedTransform === 'scale' && (
          <>
            <div className="w-20"><label className="block text-sm text-gray-400 mb-1">sx (X)</label><input type="number" step="0.1" value={sx} onChange={(e) => setSx(parseFloat(e.target.value))} className="w-full bg-gray-900 border border-gray-600 text-gray-300 rounded-md py-2 px-3" /></div>
            <div className="w-20"><label className="block text-sm text-gray-400 mb-1">sy (Y)</label><input type="number" step="0.1" value={sy} onChange={(e) => setSy(parseFloat(e.target.value))} className="w-full bg-gray-900 border border-gray-600 text-gray-300 rounded-md py-2 px-3" /></div>
          </>
        )}

        {selectedTransform === 'reflection' && (
          <div className="w-32">
            <label className="block text-sm text-gray-400 mb-1">Eixo</label>
            <select value={axis} onChange={(e) => setAxis(e.target.value)} className="w-full bg-gray-900 border border-gray-600 text-gray-300 rounded-md py-2 px-3">
              <option value="x">Horizontal (X)</option>
              <option value="y">Vertical (Y)</option>
            </select>
          </div>
        )}

        {selectedTransform === 'shear' && (
          <>
            <div className="w-20"><label className="block text-sm text-gray-400 mb-1">cx (X)</label><input type="number" step="0.1" value={cx} onChange={(e) => setCx(parseFloat(e.target.value))} className="w-full bg-gray-900 border border-gray-600 text-gray-300 rounded-md py-2 px-3" /></div>
            <div className="w-20"><label className="block text-sm text-gray-400 mb-1">cy (Y)</label><input type="number" step="0.1" value={cy} onChange={(e) => setCy(parseFloat(e.target.value))} className="w-full bg-gray-900 border border-gray-600 text-gray-300 rounded-md py-2 px-3" /></div>
          </>
        )}

        {selectedTransform === 'rotation' && (
          <div className="w-24">
            <label className="block text-sm text-gray-400 mb-1">Ângulo (°)</label>
            <input type="number" value={angle} onChange={(e) => setAngle(parseFloat(e.target.value))} className="w-full bg-gray-900 border border-gray-600 text-gray-300 rounded-md py-2 px-3" />
          </div>
        )}

        <div>
          <button 
            onClick={handleApplyTransform}
            disabled={isProcessing || !imageState}
            className="w-full md:w-auto bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-md disabled:opacity-50 transition-colors"
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
          matrix={processedResult?.matrix} 
          w={processedResult?.w} 
          h={processedResult?.h} 
          type={imageState?.type} 
          title="Imagem Transformada" 
        />
      </div>
    </div>
  );
}