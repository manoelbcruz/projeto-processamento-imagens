import React, { useState, useEffect, useRef } from 'react';
import { drawMatrixToCanvas } from '../core/utils';

export default function ImageViewer({ matrix, w, h, type, title }) {
  const canvasRef = useRef(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [hoverPos, setHoverPos] = useState(null);

  const [prevMatrix, setPrevMatrix] = useState(matrix);
  if (matrix !== prevMatrix) {
    setPrevMatrix(matrix);
    // Reseta a lupa para o centro da NOVA imagem instantaneamente
    setPos({ x: Math.floor((w || 0) / 2), y: Math.floor((h || 0) / 2) });
  }

  useEffect(() => {
    if (matrix && canvasRef.current) {
      drawMatrixToCanvas(canvasRef.current, matrix, w, h, type || 'P2');
    }
  }, [matrix, w, h, type]);

  const handleCanvasMouseMove = (e) => {
    if (!matrix) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = w / rect.width;
    const scaleY = h / rect.height;
    const x = Math.floor((e.clientX - rect.left) * scaleX);
    const y = Math.floor((e.clientY - rect.top) * scaleY);
    
    if (x >= 0 && x < w && y >= 0 && y < h) {
      setHoverPos({ x, y });
    } else {
      setHoverPos(null);
    }
  };

  const handleCanvasClick = () => {
    if (hoverPos) setPos(hoverPos);
  };

  if (!matrix) {
    return (
      <div className="flex flex-col bg-gray-900 p-4 rounded-lg border border-gray-700 h-full justify-center items-center min-w-0">
        <p className="text-gray-500 text-sm">Aguardando {title}...</p>
      </div>
    );
  }

  const radius = 7; // Raio 7 = 15x15
  const startX = pos.x - radius;
  const startY = pos.y - radius;

  return (
    <div className="flex flex-col bg-gray-900 p-4 rounded-lg border border-gray-700 min-w-0 w-full overflow-hidden">
      <h3 className="text-lg font-medium text-gray-300 mb-4 text-center truncate">{title}</h3>
      
      <div className="bg-black flex items-center justify-center rounded shadow-inner mb-4 overflow-hidden relative min-h-[256px]">
        <div className="relative inline-block cursor-crosshair max-w-full">
          <canvas 
            ref={canvasRef} 
            className="block max-w-full object-contain"
            onMouseMove={handleCanvasMouseMove}
            onMouseLeave={() => setHoverPos(null)}
            onClick={handleCanvasClick}
          ></canvas>
          
          {hoverPos && (
            <div 
              className="absolute border border-red-500 pointer-events-none z-10"
              style={{
                top: `${(hoverPos.y / h) * 100}%`,
                left: `${(hoverPos.x / w) * 100}%`,
                width: `${Math.max((1 / w) * 100, 2)}%`,
                height: `${Math.max((1 / h) * 100, 2)}%`,
                transform: 'translate(-50%, -50%)',
                minWidth: '6px',
                minHeight: '6px'
              }}
            />
          )}
        </div>
      </div>

      <div className="mt-2 flex flex-col items-center w-full min-w-0">
        <div className="flex justify-between w-full mb-2 px-2">
            <span className="text-xs text-gray-400">Lupa: Eixo X/Y</span>
            <span className="text-xs text-blue-400 font-mono truncate">
                Centro: [{pos.x}, {pos.y}]
            </span>
        </div>
        
        <div className="max-w-full w-fit mx-auto overflow-x-auto bg-gray-950 border border-gray-700 rounded shadow-lg select-none">
          <table className="text-center border-collapse text-[10px] text-gray-300 font-mono min-w-max">
            <thead>
              <tr>
                <th className="border border-gray-800 p-1 bg-gray-800 text-gray-500 sticky left-0 z-10 w-8">X&rarr;<br/>Y&darr;</th>
                {Array.from({ length: 15 }).map((_, j) => {
                  const x = startX + j;
                  return <th key={j} className="border border-gray-800 p-0.5 bg-gray-800 text-gray-500 min-w-[24px]">{x >= 0 && x < w ? x : ''}</th>;
                })}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 15 }).map((_, i) => {
                const y = startY + i;
                const isValidY = y >= 0 && y < h;
                return (
                  <tr key={i}>
                    <td className="border border-gray-800 p-0.5 bg-gray-800 text-gray-500 font-bold sticky left-0 z-10">{isValidY ? y : ''}</td>
                    {Array.from({ length: 15 }).map((_, j) => {
                      const x = startX + j;
                      const isOutOfBounds = !isValidY || x < 0 || x >= w;
                      let val = isOutOfBounds ? '-' : matrix[y][x];
                      
                      if (typeof val === 'number') {
                         val = Math.round(val);
                      }

                      const isHovered = hoverPos && hoverPos.x === x && hoverPos.y === y;
                      const isCenter = x === pos.x && y === pos.y;

                      return (
                        <td 
                          key={j} 
                          className={`border border-gray-800 p-0.5 min-w-[24px] cursor-crosshair transition-colors
                            ${isHovered ? 'bg-red-600 text-white font-bold' : ''}
                            ${isCenter && !isHovered ? 'bg-blue-900 text-white' : ''}
                            ${isOutOfBounds ? 'text-gray-700 bg-black' : 'hover:bg-gray-700'}
                          `}
                          onMouseEnter={() => !isOutOfBounds && setHoverPos({x, y})}
                          onMouseLeave={() => setHoverPos(null)}
                          onClick={() => !isOutOfBounds && setPos({x, y})}
                        >
                          {val}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}