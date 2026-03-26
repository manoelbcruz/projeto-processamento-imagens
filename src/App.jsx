import React, { useState } from 'react';
import Filtros from './pages/filtros';
import Transformacoes from './pages/Transformacoes';
import Histograma from './pages/Histograma';
import Morfologia from './pages/Morfologia';
import Morfismo from './pages/Morfismo';
import Combinacao from './pages/Combinacao';
import TransformacoesGeometricas from './pages/TransformacoesGeometricas';

export default function App() {
  const [activeModule, setActiveModule] = useState('filtros');

  const menuItems = [
    { id: 'filtros', label: 'Filtros Espaciais' },
    { id: 'transformacoes', label: 'Transformações' },
    { id: 'transformacoesGeometricas', label: 'Transformações Geométricas' },
    { id: 'histograma', label: 'Histograma' },
    { id: 'morfologia', label: 'Morfologia' },
    { id: 'combinacao', label: 'Combinação Lógica' },
    { id: 'morfismo', label: 'Morfismo Temporal' }
  ];

  return (
    <div className="flex h-screen bg-gray-900 font-sans text-gray-100">
      
      {/* Sidebar Lateral */}
      <aside className="w-64 bg-gray-800 border-r border-gray-700 flex flex-col">
        <div className="p-6">
          <h1 className="text-xl font-bold text-blue-400">Lab de Imagens</h1>
          <p className="text-xs text-gray-400 mt-1">Projeto CG</p>
        </div>
        
        <nav className="flex-1 px-4 space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveModule(item.id)}
              className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                activeModule === item.id 
                  ? 'bg-blue-600 text-white font-medium' 
                  : 'text-gray-400 hover:bg-gray-700 hover:text-white'
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </aside>

      {/* Área Principal de Conteúdo */}
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-100 mb-8 border-b border-gray-700 pb-4 capitalize">
            {menuItems.find(m => m.id === activeModule)?.label}
          </h2>
          
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-xl min-h-[500px]">
            {activeModule === 'filtros' && <Filtros />}
            {activeModule === 'transformacoes' && <Transformacoes />}
            {activeModule === 'transformacoesGeometricas' && <TransformacoesGeometricas />}
            {activeModule === 'histograma' && <Histograma />}
            {activeModule === 'morfologia' && <Morfologia />}
            {activeModule === 'morfismo' && <Morfismo />}
            {activeModule === 'combinacao' && <Combinacao />}
          </div>
        </div>
      </main>

    </div>
  );
}