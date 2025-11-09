import { useCallback } from 'react';
import ReactFlow, {
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  ConnectionMode,
  useReactFlow,
  ReactFlowProvider,
} from 'reactflow';
import { Hexagon, ArrowLeft, Menu, Plus } from 'lucide-react';
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

// Main component
function HiveFlow() {
  const { hiveName } = useParams();
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (params) =>
      setEdges((eds) =>
        addEdge({ ...params, style: { stroke: '#94a3b8' } }, eds)
      ),
    [setEdges]
  );

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
        className="bg-gray-950 no-reactflow-brand"
      >
        <Controls />
        <Background
          variant="dots"
          gap={50}
          size={1}
          color="rgba(255, 255, 255, 0.1)"
        />
      </ReactFlow>

      {/* Hide React Flow Branding */}
      <style>{`
        .react-flow__attribution {
          display: none !important;
        }
      `}</style>
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
