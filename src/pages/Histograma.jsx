import React, { useState, useRef, useMemo } from 'react';
import { parsePGM, drawMatrixToCanvas } from '../core/utils';
import { getHistogram, equalizeImage, drawHistogramToCanvas } from '../core/histogram';
import ImageViewer from '../components/ImageViewer';

export default function Histograma() {
  // Referências para os Canvases de Imagem
  const canvasOriginalRef = useRef(null);
  const canvasProcessedRef = useRef(null);

  // Referências para os Canvases de Gráfico (Histograma)
  const histOriginalRef = useRef(null);
  const histProcessedRef = useRef(null);

  const [imageState, setImageState] = useState(null);
  const [processedMatrix, setProcessedMatrix] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Manipulador de upload
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const img = await parsePGM(file);
      setImageState(img);
      setProcessedMatrix(null); // Reseta o estado processado
      
      // Desenha a Imagem Original
      if (canvasOriginalRef.current) {
        drawMatrixToCanvas(canvasOriginalRef.current, img.data, img.w, img.h, img.type);
      }
      
      // Calcula e desenha o Histograma Original
      const originalHist = getHistogram(img.data, img.w, img.h);
      if (histOriginalRef.current) {
        drawHistogramToCanvas(histOriginalRef.current, originalHist);
      }

      // Limpa os canvases da direita
      if (canvasProcessedRef.current) {
         const ctx = canvasProcessedRef.current.getContext('2d');
         ctx.clearRect(0, 0, img.w, img.h);
      }
      if (histProcessedRef.current) {
        const ctx = histProcessedRef.current.getContext('2d');
        ctx.clearRect(0, 0, histProcessedRef.current.width, histProcessedRef.current.height);
      }

    } catch (error) {
      alert("Erro ao ler a imagem: " + error.message);
    }
  };

  // Manipulador para Equalizar
  const handleEqualize = () => {
    if (!imageState) return alert("Por favor, carregue uma imagem primeiro.");

    setIsProcessing(true);

    setTimeout(() => {
      const { data, w, h, type } = imageState;

      // 1. Equaliza a matriz da imagem
      const resultMatrix = equalizeImage(data, w, h);
      setProcessedMatrix(resultMatrix);

      // 2. Desenha a Imagem Equalizada
      if (canvasProcessedRef.current && resultMatrix.length > 0) {
        drawMatrixToCanvas(canvasProcessedRef.current, resultMatrix, w, h, type);
      }

      // 3. Calcula e desenha o NOVO Histograma Equalizado
      const processedHist = getHistogram(resultMatrix, w, h);
      if (histProcessedRef.current) {
        drawHistogramToCanvas(histProcessedRef.current, processedHist);
      }

      setIsProcessing(false);
    }, 50);
  };

  // Componente da Tabela de Pixels (Otimizado)
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
      {/* Controles */}
      <div className="flex flex-col md:flex-row gap-4 bg-gray-800 p-4 rounded-lg border border-gray-700 items-end">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-400 mb-1">Upload da Imagem PGM</label>
          <input 
            type="file" 
            accept=".pgm" 
            onChange={handleFileUpload}
            className="block w-full text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer"
          />
        </div>

        <div>
          <button 
            onClick={handleEqualize}
            disabled={isProcessing || !imageState}
            className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-8 rounded-md disabled:opacity-50 transition-colors"
          >
            {isProcessing ? 'Equalizando...' : 'Equalizar Histograma'}
          </button>
        </div>
      </div>

      {/* Visualização: Imagens e Histogramas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
        
        {/* Coluna 1: Original */}
        <div className="flex flex-col bg-gray-900 p-4 rounded-lg border border-gray-700 space-y-4">
          <ImageViewer 
            matrix={imageState?.data} 
            w={imageState?.w} 
            h={imageState?.h} 
            type={imageState?.type} 
            title="Imagem Original" 
          />
          
          <h3 className="text-sm font-medium text-gray-400 text-center pt-2 border-t border-gray-800">Gráfico do Histograma</h3>
          <div className="bg-gray-950 rounded border border-gray-800 p-2 flex justify-center">
             {/* Canvas do gráfico fixo em 256x150 para caber todas as 256 barras */}
             <canvas ref={histOriginalRef} width="256" height="150" className="block"></canvas>
          </div>
        </div>

        {/* Coluna 2: Processada */}
        <div className="flex flex-col bg-gray-900 p-4 rounded-lg border border-gray-700 space-y-4">
          <ImageViewer 
            matrix={processedMatrix} 
            w={imageState?.w} 
            h={imageState?.h} 
            type={imageState?.type} 
            title="Imagem Equalizada" 
          />

          <h3 className="text-sm font-medium text-gray-400 text-center pt-2 border-t border-gray-800">Gráfico do Histograma Equalizado</h3>
          <div className="bg-gray-950 rounded border border-gray-800 p-2 flex justify-center">
             <canvas ref={histProcessedRef} width="256" height="150" className="block"></canvas>
          </div>
        </div>

      </div>
    </div>
  );
}