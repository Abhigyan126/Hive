import { useCallback, useState } from 'react';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  ConnectionMode,
  Panel,
  useReactFlow,
  ReactFlowProvider,
} from 'reactflow';
import { Hexagon, ArrowLeft, Menu, Plus, Minus } from 'lucide-react';
import { useParams } from 'react-router-dom';
import 'reactflow/dist/style.css';

const initialNodes = [
  {
    id: '1',
    type: 'input',
    position: { x: 250, y: 25 },
    data: { label: 'Start Node' },
    style: {
      background: 'rgba(16, 185, 129, 0.2)',
      border: '1px solid rgba(34, 197, 94, 0.5)',
      borderRadius: '12px',
      color: 'white',
      width: 200,
      height: 100,
    },
  },
  {
    id: '2',
    position: { x: 100, y: 125 },
    data: { label: 'Process Node' },
    style: {
      background: 'rgba(59, 130, 246, 0.2)',
      border: '1px solid rgba(59, 130, 246, 0.5)',
      borderRadius: '12px',
      color: 'white',
      width: 200,
      height: 100,
    },
  },
];

const initialEdges = [
  { id: 'e1-2', source: '1', target: '2', style: { stroke: '#94a3b8' } },
];

// Custom node component
const CustomNode = ({ data }) => (
  <div className="px-4 py-2 shadow-lg rounded-xl bg-green-500/20 border border-green-500/50 flex items-center justify-center text-white w-full h-full">
    <Plus size={24} className="text-green-400 mr-2" />
    <span className="font-medium">{data.label}</span>
  </div>
);

const nodeTypes = {
  custom: CustomNode,
};

// Main component that uses React Flow hooks
function HiveFlow() {
  const { hiveName } = useParams();
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const { fitView, zoomIn, zoomOut, setCenter } = useReactFlow();

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge({ ...params, style: { stroke: '#94a3b8' } }, eds)),
    [setEdges]
  );

  const addNewNode = useCallback(() => {
    const newNode = {
      id: `${Date.now()}`,
      type: 'custom',
      position: {
        x: Math.random() * 400,
        y: Math.random() * 400,
      },
      data: { label: 'New Node' },
    };
    setNodes((nds) => [...nds, newNode]);
  }, [setNodes]);

  const handleCenter = useCallback(() => {
    setCenter(0, 0, { zoom: 1 });
  }, [setCenter]);

  const handleFitView = useCallback(() => {
    fitView();
  }, [fitView]);

  return (
    <div className="h-screen bg-black text-white overflow-hidden fixed inset-0">
      {/* Top Navigation */}
      <nav className="absolute top-0 left-0 right-0 z-20 flex items-center gap-3 px-4 py-3 bg-white/5 border-b border-white/10 backdrop-blur-md">
        <button className="text-white/80 hover:text-white transition-colors">
          <ArrowLeft size={20} />
        </button>
        <button className="text-white/80 hover:text-white transition-colors">
          <Menu size={20} />
        </button>
        <div className="flex items-center gap-2">
          <Hexagon size={24} className="text-white/80" />
          <h1 className="text-lg font-semibold">
            {hiveName || 'Unnamed Hive'}
          </h1>
        </div>
      </nav>

      {/* React Flow Canvas */}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        connectionMode={ConnectionMode.Loose}
        nodeTypes={nodeTypes}
        fitView
        className="bg-gray-950"
      >
        <Controls
          className="bg-gray-900 border border-white/20 rounded-lg"
          position="bottom-left"
        />

        <MiniMap
          className="bg-gray-900 border border-white/20 rounded-lg"
          nodeColor="rgba(16, 185, 129, 0.4)"
          position="bottom-right"
        />

        <Background
          variant="dots"
          gap={50}
          size={1}
          color="rgba(255, 255, 255, 0.1)"
        />

        {/* Control Panel */}
        <Panel position="top-right" className="space-y-2">
          <button
            onClick={addNewNode}
            className="flex items-center gap-2 bg-green-500/20 hover:bg-green-500/40 border border-green-400/30 rounded-lg px-3 py-2 transition-all text-green-300 w-full"
          >
            <Plus size={16} />
            Add Node
          </button>
          <button
            onClick={handleFitView}
            className="flex items-center gap-2 bg-blue-500/20 hover:bg-blue-500/40 border border-blue-400/30 rounded-lg px-3 py-2 transition-all text-blue-300 w-full"
          >
            Fit View
          </button>
          <button
            onClick={handleCenter}
            className="flex items-center gap-2 bg-purple-500/20 hover:bg-purple-500/40 border border-purple-400/30 rounded-lg px-3 py-2 transition-all text-purple-300 w-full"
          >
            Reset Center
          </button>
        </Panel>

        {/* Zoom Controls */}
        <Panel position="bottom-left">
          <div className="flex gap-1 bg-gray-900/95 backdrop-blur-xl border border-white/20 rounded-lg p-1">
            <button
              onClick={() => zoomIn()}
              className="p-2 hover:bg-white/10 rounded transition-colors"
              title="Zoom In"
            >
              <Plus size={16} />
            </button>
            <button
              onClick={() => zoomOut()}
              className="p-2 hover:bg-white/10 rounded transition-colors"
              title="Zoom Out"
            >
              <Minus size={16} />
            </button>
          </div>
        </Panel>
      </ReactFlow>
    </div>
  );
}

// Main export wrapped with ReactFlowProvider
export default function CreateHive() {
  return (
    <ReactFlowProvider>
      <HiveFlow />
    </ReactFlowProvider>
  );
}
