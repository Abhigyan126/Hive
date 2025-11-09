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

// ===== Node Components =====

const QueenNode = ({ data, selected }) => (
  <div
    className={`relative px-4 py-3 rounded-xl bg-purple-500/30 border shadow-lg text-center text-white w-full h-full flex items-center justify-center transition-all ${
      selected
        ? 'border-purple-400 shadow-[0_0_12px_rgba(192,132,252,0.8)]'
        : 'border-purple-400/40'
    }`}
  >
    <Handle
      type="source"
      position={Position.Bottom}
      id="queen-output"
      style={{ background: '#c084fc', width: 10, height: 10 }}
    />
    <span className="font-semibold text-lg">{data.label}</span>
  </div>
);

const BeeNode = ({ data, selected }) => (
  <div
    className={`relative px-4 py-2 rounded-xl bg-yellow-500/30 border shadow-lg text-center text-white w-full h-full flex items-center justify-center transition-all ${
      selected
        ? 'border-yellow-300 shadow-[0_0_12px_rgba(250,204,21,0.8)]'
        : 'border-yellow-400/40'
    }`}
  >
    <Handle
      type="target"
      position={Position.Left}
      id="bee-input"
      style={{ background: '#facc15', width: 10, height: 10 }}
    />
    <span className="font-medium">{data.label}</span>
    <Handle
      type="source"
      position={Position.Right}
      id="bee-output"
      style={{ background: '#facc15', width: 10, height: 10 }}
    />
  </div>
);

const nodeTypes = {
  queen: QueenNode,
  bee: BeeNode,
};

// ====== Main Flow Component ======

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

  // ============ Connect and Delete Handlers ============

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

  const onNodesDelete = useCallback(
    (deleted) => {
      const protectedQueen = deleted.find((n) => n.id === 'queen');
      if (protectedQueen) {
        setNodes((nds) => [...nds, protectedQueen]);
      }
    },
    [setNodes]
  );

  const handleAddQueen = (e) => {
    e.preventDefault();
    if (!queenName.trim()) return;

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

  const addBeeNode = () => {
    const newNode = {
      id: `${Date.now()}`,
      type: 'bee',
      position: { x: Math.random() * 500, y: Math.random() * 400 + 150 },
      data: { label: 'Code Node' },
    };
    setNodes((nds) => [...nds, newNode]);
    setShowNodePanel(false);
  };

  const handleNodeClick = (event, node) => {
    setSelectedNode(node);
    setSelectedEdge(null);
  };

  const handleEdgeClick = (event, edge) => {
    event.stopPropagation();
    setSelectedEdge(edge);
    setSelectedNode(null);
  };

  const deleteSelectedNode = () => {
    if (!selectedNode || selectedNode.id === 'queen') return;
    setNodes((nds) => nds.filter((n) => n.id !== selectedNode.id));
    setEdges((eds) =>
      eds.filter(
        (e) => e.source !== selectedNode.id && e.target !== selectedNode.id
      )
    );
    setSelectedNode(null);
  };

  const availableNodes = useMemo(
    () =>
      [
        {
          name: 'Code Node',
          description: 'A standard worker node for code execution',
          type: 'bee',
        },
      ].filter((node) =>
        node.name.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    [searchTerm]
  );

  // ============ Highlight Edges ============

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
      {/* Top Nav */}
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

          <div className="text-white/60 italic mb-6">
            (Node form coming soon)
          </div>

          {selectedNode.id !== 'queen' && (
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
                key={node.name}
                onClick={() => addBeeNode(node)}
                className="bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-400/30 rounded-lg p-3 cursor-pointer transition-all"
              >
                <h4 className="text-yellow-300 font-medium">
                  {node.name}
                </h4>
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

      {/* React Flow Canvas */}
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
        className="bg-gray-950"
        deleteKeyCode={['Backspace', 'Delete']}
      >
        <Controls />
        <Background
          variant="dots"
          gap={50}
          size={1}
          color="rgba(255,255,255,0.1)"
        />

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

      <style>{`
        .react-flow__attribution { display: none !important; }
      `}</style>
    </div>
  );
}

// Export with provider
export default function CreateHive() {
  return (
    <ReactFlowProvider>
      <HiveFlow />
    </ReactFlowProvider>
  );
}
