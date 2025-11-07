'use client';

import { useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Connection,
  ReactFlowProvider,
  NodeTypes,
  Handle,
  Position,
  NodeResizer,
} from 'reactflow';
import 'reactflow/dist/style.css';

// Özel Node Tipleri
const CustomNode = ({ 
  data, 
  selected,
  width,
  height,
}: { 
  data: { label: string; shape: string }; 
  selected: boolean;
  width?: number;
  height?: number;
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState(data.label);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const handleDoubleClick = () => {
    setIsEditing(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleBlur = () => {
    setIsEditing(false);
    data.label = text;
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleBlur();
    }
    if (e.key === 'Escape') {
      setText(data.label);
      setIsEditing(false);
    }
  };

  // Circle için width ve height her zaman eşit olmalı
  const baseWidth = width || (data.shape === 'circle' || data.shape === 'diamond' ? 120 : data.shape === 'thin-rectangle' ? 200 : 150);
  const baseHeight = height || (data.shape === 'circle' || data.shape === 'diamond' ? 120 : data.shape === 'thin-rectangle' ? 40 : 80);
  
  // Circle için boyutları eşitle
  const nodeWidth = data.shape === 'circle' ? (width || height || 120) : baseWidth;
  const nodeHeight = data.shape === 'circle' ? nodeWidth : baseHeight;

  const getNodeStyle = () => {
    const baseStyle = 'flex items-center justify-center text-xs p-2 text-center border-2 transition-all relative';
    const selectedStyle = selected ? 'ring-2 ring-blue-500' : '';
    
    const style: React.CSSProperties = {
      width: data.shape === 'circle' ? nodeWidth : nodeWidth,
      height: data.shape === 'circle' ? nodeWidth : nodeHeight,
      minWidth: data.shape === 'thin-rectangle' ? 120 : data.shape === 'circle' || data.shape === 'diamond' ? 80 : 100,
      minHeight: data.shape === 'thin-rectangle' ? 30 : data.shape === 'circle' || data.shape === 'diamond' ? 80 : 50,
    };
    
    switch (data.shape) {
      case 'rectangle':
        return `${baseStyle} ${selectedStyle} rounded-none bg-white border-gray-800`;
      case 'thin-rectangle':
        return `${baseStyle} ${selectedStyle} rounded-none bg-white border-gray-800`;
      case 'circle':
        return `${baseStyle} ${selectedStyle} rounded-full bg-white border-gray-800`;
      case 'diamond':
        return `${baseStyle} ${selectedStyle} bg-white border-gray-800 transform rotate-45`;
      case 'rounded-rectangle':
        return `${baseStyle} ${selectedStyle} rounded-lg bg-white border-gray-800`;
      default:
        return `${baseStyle} ${selectedStyle} rounded-none bg-white border-gray-800`;
    }
  };

  const getTextStyle = () => {
    if (data.shape === 'diamond') {
      return 'transform -rotate-45 whitespace-pre-wrap';
    }
    return 'whitespace-pre-wrap';
  };

  return (
    <div 
      className={getNodeStyle()} 
      onDoubleClick={handleDoubleClick}
      style={{
        width: data.shape === 'circle' ? nodeWidth : nodeWidth,
        height: data.shape === 'circle' ? nodeWidth : nodeHeight,
        minWidth: data.shape === 'thin-rectangle' ? 120 : data.shape === 'circle' || data.shape === 'diamond' ? 80 : 100,
        minHeight: data.shape === 'thin-rectangle' ? 30 : data.shape === 'circle' || data.shape === 'diamond' ? 80 : 50,
      }}
    >
      {selected && (
        <NodeResizer
          color="#3b82f6"
          isVisible={selected}
          minWidth={data.shape === 'thin-rectangle' ? 120 : data.shape === 'circle' || data.shape === 'diamond' ? 80 : 100}
          minHeight={data.shape === 'thin-rectangle' ? 30 : data.shape === 'circle' || data.shape === 'diamond' ? 80 : 50}
          keepAspectRatio={data.shape === 'circle'}
          handleStyle={{
            width: '8px',
            height: '8px',
            borderRadius: '2px',
            backgroundColor: '#3b82f6',
            border: '2px solid white',
          }}
        />
      )}
      
      <Handle type="target" position={Position.Top} className="!bg-gray-800" />
      <Handle type="source" position={Position.Bottom} className="!bg-gray-800" />
      <Handle type="target" position={Position.Left} className="!bg-gray-800" />
      <Handle type="source" position={Position.Right} className="!bg-gray-800" />
      
      {isEditing ? (
        <textarea
          ref={inputRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className="w-full h-full text-xs border-none outline-none resize-none text-center bg-transparent"
          style={{ 
            minHeight: '40px',
            transform: data.shape === 'diamond' ? 'rotate(-45deg)' : 'none',
          }}
        />
      ) : (
        <div className={getTextStyle()}>{text || 'Çift tıklayarak düzenle'}</div>
      )}
    </div>
  );
};

const nodeTypes: NodeTypes = {
  custom: CustomNode,
};

const initialNodes: Node[] = [];
const initialEdges: Edge[] = [];

function FlowCanvas() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedShape, setSelectedShape] = useState<string>('rectangle');
  const nodeIdRef = useRef(0);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const addNode = (shape: string) => {
    const defaultSize = {
      rectangle: { width: 150, height: 80 },
      'thin-rectangle': { width: 200, height: 40 },
      circle: { width: 120, height: 120 },
      diamond: { width: 120, height: 120 },
      'rounded-rectangle': { width: 150, height: 80 },
    };
    
    const size = defaultSize[shape as keyof typeof defaultSize] || { width: 150, height: 80 };
    
    const newNode: Node = {
      id: `node-${nodeIdRef.current++}`,
      type: 'custom',
      position: {
        x: Math.random() * 400,
        y: Math.random() * 400,
      },
      data: {
        label: 'Yeni öğe',
        shape: shape,
      },
      width: size.width,
      height: size.height,
    };
    setNodes((nds) => [...nds, newNode]);
  };

  const deleteSelectedNodes = () => {
    setNodes((nds) => nds.filter((node) => !node.selected));
    setEdges((eds) =>
      eds.filter(
        (edge) =>
          !nodes.find((n) => n.selected && (n.id === edge.source || n.id === edge.target))
      )
    );
  };

  return (
    <div className="h-full w-full flex flex-col">
      {/* Toolbar */}
      <div className="bg-gray-100 border-b border-gray-200 p-2 flex items-center gap-2 flex-wrap">
        <span className="text-xs text-gray-600 font-semibold mr-2">Şekil Ekle:</span>
        
        <button
          onClick={() => addNode('rectangle')}
          className="px-3 py-1.5 text-xs bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
          title="Kare"
        >
          ⬜ Kare
        </button>
        
        <button
          onClick={() => addNode('thin-rectangle')}
          className="px-3 py-1.5 text-xs bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
          title="İnce Dikdörtgen"
        >
          ▭ İnce
        </button>
        
        <button
          onClick={() => addNode('circle')}
          className="px-3 py-1.5 text-xs bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
          title="Yuvarlak"
        >
          ⭕ Yuvarlak
        </button>
        
        <button
          onClick={() => addNode('diamond')}
          className="px-3 py-1.5 text-xs bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
          title="Elmas (Karar)"
        >
          🔶 Elmas
        </button>
        
        <button
          onClick={() => addNode('rounded-rectangle')}
          className="px-3 py-1.5 text-xs bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
          title="Yuvarlak Köşeli"
        >
          ▢ Yuvarlak Köşeli
        </button>

        <div className="ml-4 border-l border-gray-300 pl-4">
          <button
            onClick={deleteSelectedNodes}
            className="px-3 py-1.5 text-xs bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
            title="Seçili öğeleri sil (Delete tuşu)"
          >
            🗑️ Sil
          </button>
        </div>

        <div className="ml-auto text-[10px] text-gray-500">
          💡 Çift tıklayarak metin düzenleyin • Sürükle-bırak ile taşıyın • Seçili şeklin köşelerinden boyutlandırın • Bağlantılar için handle'ları sürükleyin
        </div>
      </div>

      {/* React Flow Canvas */}
      <div className="flex-1 bg-gray-50">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          fitView
          attributionPosition="bottom-left"
        >
          <Background />
          <Controls />
          <MiniMap />
        </ReactFlow>
      </div>
    </div>
  );
}

export default function IsAkisiPage() {
  return (
    <div className="h-screen bg-white flex flex-col overflow-hidden">
      {/* Üst Bar - Siyah, solda geri butonu */}
      <div className="bg-black text-white px-4 py-4 flex justify-between items-center flex-shrink-0">
        <Link 
          href="/" 
          className="text-xs font-light hover:underline"
        >
          ← Ana Sayfa
        </Link>
        <div className="text-xs font-light">İş Akışı</div>
      </div>
      
      {/* React Flow Canvas */}
      <div className="flex-1 overflow-hidden">
        <ReactFlowProvider>
          <FlowCanvas />
        </ReactFlowProvider>
      </div>
    </div>
  );
}
