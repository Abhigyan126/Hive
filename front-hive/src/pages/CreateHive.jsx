import { useCallback, useState, useMemo } from 'react';
import ReactFlow, {
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  ConnectionMode,
  useReactFlow,
  ReactFlowProvider,
  Panel,
  Handle,
  Position,
} from 'reactflow';
import { Hexagon, ArrowLeft, Menu, Plus, X, Search, Trash2 } from 'lucide-react';
import { useParams } from 'react-router-dom';
import 'reactflow/dist/style.css';

// =======================================================
// 🎛️ NODE CONFIGURATION
// =======================================================

const NODE_TYPES_CONFIG = [
  {
    type: 'queen',
    name: 'Queen Node',
    description: 'Primary controller node — only one allowed',
    color: '#a855f7', // purple
    bg: 'bg-purple-500/30',
    border: 'border-purple-400/40',
    glow: 'shadow-[0_0_12px_rgba(192,132,252,0.8)]',
    handles: [{ type: 'source', position: Position.Bottom, color: '#c084fc' }],
    deletable: false,
  },
  {
    type: 'code',
    name: 'Code Node',
    description: 'A standard worker node for code execution',
    color: '#facc15', // yellow
    bg: 'bg-yellow-500/30',
    border: 'border-yellow-400/40',
    glow: 'shadow-[0_0_12px_rgba(250,204,21,0.8)]',
    handles: [
      { type: 'target', position: Position.Left, color: '#facc15' },
      { type: 'source', position: Position.Right, color: '#facc15' },
    ],
    deletable: true,
  },
];

// =======================================================
// 🧩 DYNAMIC NODE COMPONENT FACTORY
// =======================================================

const NodeComponent = ({ data, selected, nodeType }) => {
  const config = NODE_TYPES_CONFIG.find((n) => n.type === nodeType);
  if (!config) return null;

  return (
    <div
      className={`relative px-4 py-3 rounded-xl ${config.bg} border shadow-lg text-center text-white flex items-center justify-center transition-all ${
        selected
          ? `${config.glow} border-opacity-100`
          : `${config.border}`
      }`}
    >
      {config.handles.map((h, i) => (
        <Handle
          key={i}
          type={h.type}
          position={h.position}
          id={`${nodeType}-handle-${i}`}
          style={{
            background: h.color,
            width: 10,
            height: 10,
          }}
        />
      ))}
      <span className="font-medium">{data.label}</span>
    </div>
  );
};

// Build nodeTypes map for ReactFlow
const nodeTypes = NODE_TYPES_CONFIG.reduce((acc, cfg) => {
  acc[cfg.type] = (props) => (
    <NodeComponent {...props} nodeType={cfg.type} />
  );
  return acc;
}, {});

// =======================================================
// 🐝 MAIN FLOW
// =======================================================

function HiveFlow() {
  const { hiveName } = useParams();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [showQueenForm, setShowQueenForm] = useState(true);
  const [queenName, setQueenName] = useState('');
  const [selectedNode, setSelectedNode] = useState(null);
  const [selectedEdge, setSelectedEdge] = useState(null);
  const [showNodePanel, setShowNodePanel] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const { fitView } = useReactFlow();

  // 🕸️ Connections
  const onConnect = useCallback(
    (params) =>
      setEdges((eds) =>
        addEdge(
          {
            ...params,
            style: {
              stroke:
                selectedEdge?.id === params.id
                  ? '#facc15'
                  : 'rgba(148,163,184,0.9)',
              strokeWidth: 2,
            },
          },
          eds
        )
      ),
    [setEdges, selectedEdge]
  );

  // 🧹 Prevent deleting the queen
  const onNodesDelete = useCallback(
    (deleted) => {
      const protectedQueen = deleted.find((n) => n.id === 'queen');
      if (protectedQueen) {
        setNodes((nds) => [...nds, protectedQueen]);
      }
    },
    [setNodes]
  );

  // 👑 Create Queen Node
  const handleAddQueen = (e) => {
    e.preventDefault();
    if (!queenName.trim()) return;

    const queenConfig = NODE_TYPES_CONFIG.find((n) => n.type === 'queen');

    const queenNode = {
      id: 'queen',
      type: 'queen',
      position: { x: 300, y: 100 },
      data: { label: queenName },
    };

    setNodes([queenNode]);
    setShowQueenForm(false);
    setTimeout(() => fitView(), 300);
  };

  // ➕ Add Node
  const addNode = (type) => {
    const config = NODE_TYPES_CONFIG.find((n) => n.type === type);
    if (!config) return;

    const newNode = {
      id: `${Date.now()}`,
      type: config.type,
      position: { x: Math.random() * 500, y: Math.random() * 400 + 150 },
      data: { label: config.name },
    };

    setNodes((nds) => [...nds, newNode]);
    setShowNodePanel(false);
  };

  // 🧭 Selection Logic
  const handleNodeClick = (event, node) => {
    setSelectedNode(node);
    setSelectedEdge(null);
  };

  const handleEdgeClick = (event, edge) => {
    event.stopPropagation();
    setSelectedEdge(edge);
    setSelectedNode(null);
  };

  // 🗑️ Delete Node
  const deleteSelectedNode = () => {
    if (!selectedNode) return;

    const config = NODE_TYPES_CONFIG.find((n) => n.type === selectedNode.type);
    if (!config?.deletable) return;

    setNodes((nds) => nds.filter((n) => n.id !== selectedNode.id));
    setEdges((eds) =>
      eds.filter(
        (e) => e.source !== selectedNode.id && e.target !== selectedNode.id
      )
    );
    setSelectedNode(null);
  };

  // 🔍 Search available nodes
  const availableNodes = useMemo(
    () =>
      NODE_TYPES_CONFIG.filter(
        (node) =>
          node.deletable &&
          node.name.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    [searchTerm]
  );

  // 🎨 Highlight Selected Edge
  const highlightedEdges = edges.map((edge) => ({
    ...edge,
    style: {
      stroke:
        selectedEdge?.id === edge.id
          ? '#facc15'
          : 'rgba(148,163,184,0.6)',
      strokeWidth: selectedEdge?.id === edge.id ? 3 : 1.5,
    },
  }));

  return (
    <div className="h-screen bg-black text-white overflow-hidden fixed inset-0">
      {/* Nav */}
      <nav className="absolute top-0 left-0 right-0 z-20 flex items-center gap-3 px-4 py-3 bg-white/5 border-b border-white/10 backdrop-blur-md">
        <button className="text-white/80 hover:text-white transition-colors">
          <ArrowLeft size={20} />
        </button>
        <button className="text-white/80 hover:text-white transition-colors">
          <Menu size={20} />
        </button>
        <div className="flex items-center gap-2">
          <Hexagon size={24} className="text-white/80" />
          <h1 className="text-lg font-semibold">{hiveName || 'Unnamed Hive'}</h1>
        </div>
      </nav>

      {/* Queen Node Form */}
      {showQueenForm && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <form
            onSubmit={handleAddQueen}
            className="bg-gray-900 p-6 rounded-xl border border-white/10 shadow-lg space-y-4 w-80"
          >
            <h2 className="text-xl font-semibold text-center">
              Name Your Queen Node
            </h2>
            <input
              type="text"
              value={queenName}
              onChange={(e) => setQueenName(e.target.value)}
              placeholder="Enter Queen Name"
              className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-purple-400"
            />
            <button
              type="submit"
              className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-lg transition-all"
            >
              Create Queen
            </button>
          </form>
        </div>
      )}

      {/* Node Info Panel */}
      {selectedNode && (
        <div className="absolute right-0 top-0 z-30 h-full w-80 bg-gray-900 border-l border-white/10 p-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-semibold">
              Node: {selectedNode.data.label}
            </h3>
            <button
              onClick={() => setSelectedNode(null)}
              className="text-white/60 hover:text-white"
            >
              <X size={20} />
            </button>
          </div>

          <div className="text-white/60 italic mb-6">(Node form coming soon)</div>

          {NODE_TYPES_CONFIG.find((n) => n.type === selectedNode.type)?.deletable && (
            <button
              onClick={deleteSelectedNode}
              className="flex items-center gap-2 bg-red-500/20 hover:bg-red-500/30 border border-red-400/30 rounded-lg px-3 py-2 text-red-300 transition-all"
            >
              <Trash2 size={16} />
              Delete Node
            </button>
          )}
        </div>
      )}

      {/* Add Node Panel */}
      {showNodePanel && (
        <div className="absolute right-0 top-0 z-30 h-full w-96 bg-gray-900 border-l border-white/10 p-5 flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Create Node</h3>
            <button
              onClick={() => setShowNodePanel(false)}
              className="text-white/60 hover:text-white"
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex items-center bg-gray-800 rounded-lg border border-gray-700 px-3 py-2 mb-4">
            <Search size={16} className="text-white/60 mr-2" />
            <input
              type="text"
              placeholder="Search nodes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-transparent text-white w-full outline-none"
            />
          </div>

          <div className="flex-1 overflow-y-auto space-y-3">
            {availableNodes.map((node) => (
              <div
                key={node.type}
                onClick={() => addNode(node.type)}
                className="bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-400/30 rounded-lg p-3 cursor-pointer transition-all"
              >
                <h4 className="text-yellow-300 font-medium">{node.name}</h4>
                <p className="text-white/60 text-sm">{node.description}</p>
              </div>
            ))}
            {availableNodes.length === 0 && (
              <p className="text-white/50 text-center italic mt-10">
                No matching node types
              </p>
            )}
          </div>
        </div>
      )}

      {/* ReactFlow Canvas */}
      <ReactFlow
        nodes={nodes}
        edges={highlightedEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={handleNodeClick}
        onEdgeClick={handleEdgeClick}
        onNodesDelete={onNodesDelete}
        connectionMode={ConnectionMode.Loose}
        nodeTypes={nodeTypes}
        fitView
        deleteKeyCode={['Backspace', 'Delete']}
        className="bg-gray-950"
      >
        <Controls />
        <Background variant="dots" gap={50} size={1} color="rgba(255,255,255,0.1)" />
        {!showQueenForm && (
          <Panel position="bottom-left">
            <button
              onClick={() => setShowNodePanel(true)}
              className="flex items-center gap-2 bg-green-500/20 hover:bg-green-500/40 border border-green-400/30 rounded-lg px-3 py-2 text-green-300 transition-all"
            >
              <Plus size={16} />
              Add Node
            </button>
          </Panel>
        )}
      </ReactFlow>

      <style>{`.react-flow__attribution { display: none !important; }`}</style>
    </div>
  );
}

// Provider wrapper
export default function CreateHive() {
  return (
    <ReactFlowProvider>
      <HiveFlow />
    </ReactFlowProvider>
  );
}
