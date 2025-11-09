import { useCallback, useState, useMemo, useRef } from 'react';
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
import { Hexagon, ArrowLeft, Menu, SquarePlus, X, Search, Trash2, Code } from 'lucide-react';
import { useParams } from 'react-router-dom';
import Editor from '@monaco-editor/react';
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
// 🎯 PYTHON AUTOCOMPLETE SETUP
// =======================================================

const PYTHON_KEYWORDS = [
  'False', 'None', 'True', 'and', 'as', 'assert', 'async', 'await', 'break',
  'class', 'continue', 'def', 'del', 'elif', 'else', 'except', 'finally',
  'for', 'from', 'global', 'if', 'import', 'in', 'is', 'lambda', 'nonlocal',
  'not', 'or', 'pass', 'raise', 'return', 'try', 'while', 'with', 'yield'
];

const PYTHON_BUILTINS = [
  'abs', 'all', 'any', 'ascii', 'bin', 'bool', 'breakpoint', 'bytearray',
  'bytes', 'callable', 'chr', 'classmethod', 'compile', 'complex', 'delattr',
  'dict', 'dir', 'divmod', 'enumerate', 'eval', 'exec', 'filter', 'float',
  'format', 'frozenset', 'getattr', 'globals', 'hasattr', 'hash', 'help',
  'hex', 'id', 'input', 'int', 'isinstance', 'issubclass', 'iter', 'len',
  'list', 'locals', 'map', 'max', 'memoryview', 'min', 'next', 'object',
  'oct', 'open', 'ord', 'pow', 'print', 'property', 'range', 'repr',
  'reversed', 'round', 'set', 'setattr', 'slice', 'sorted', 'staticmethod',
  'str', 'sum', 'super', 'tuple', 'type', 'vars', 'zip', '__import__'
];

const PYTHON_COMMON_SNIPPETS = [
  {
    label: 'if',
    kind: 'Snippet',
    insertText: 'if ${1:condition}:\n    ${2:pass}',
    documentation: 'If statement'
  },
  {
    label: 'elif',
    kind: 'Snippet',
    insertText: 'elif ${1:condition}:\n    ${2:pass}',
    documentation: 'Elif statement'
  },
  {
    label: 'else',
    kind: 'Snippet',
    insertText: 'else:\n    ${1:pass}',
    documentation: 'Else statement'
  },
  {
    label: 'for',
    kind: 'Snippet',
    insertText: 'for ${1:item} in ${2:iterable}:\n    ${3:pass}',
    documentation: 'For loop'
  },
  {
    label: 'while',
    kind: 'Snippet',
    insertText: 'while ${1:condition}:\n    ${2:pass}',
    documentation: 'While loop'
  },
  {
    label: 'def',
    kind: 'Snippet',
    insertText: 'def ${1:function_name}(${2:parameters}):\n    ${3:pass}',
    documentation: 'Function definition'
  },
  {
    label: 'class',
    kind: 'Snippet',
    insertText: 'class ${1:ClassName}:\n    def __init__(self${2:, parameters}):\n        ${3:pass}',
    documentation: 'Class definition'
  },
  {
    label: 'try',
    kind: 'Snippet',
    insertText: 'try:\n    ${1:pass}\nexcept ${2:Exception} as ${3:e}:\n    ${4:pass}',
    documentation: 'Try-except block'
  },
  {
    label: 'with',
    kind: 'Snippet',
    insertText: 'with ${1:expression} as ${2:variable}:\n    ${3:pass}',
    documentation: 'With statement'
  },
  {
    label: 'print',
    kind: 'Function',
    insertText: 'print(${1:})',
    documentation: 'Print to console'
  }
];

// Setup Monaco Editor with Python autocomplete
const setupMonacoEditor = (monaco) => {
  // Register completion provider for Python
  monaco.languages.registerCompletionItemProvider('python', {
    provideCompletionItems: (model, position) => {
      const word = model.getWordUntilPosition(position);
      const range = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endColumn: word.endColumn,
      };

      const suggestions = [];

      // Add keyword suggestions
      PYTHON_KEYWORDS.forEach((keyword) => {
        suggestions.push({
          label: keyword,
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: keyword,
          range: range,
          documentation: `Python keyword: ${keyword}`,
        });
      });

      // Add builtin function suggestions
      PYTHON_BUILTINS.forEach((builtin) => {
        suggestions.push({
          label: builtin,
          kind: monaco.languages.CompletionItemKind.Function,
          insertText: builtin + '()',
          range: range,
          documentation: `Python builtin: ${builtin}`,
        });
      });

      // Add snippet suggestions
      PYTHON_COMMON_SNIPPETS.forEach((snippet) => {
        suggestions.push({
          label: snippet.label,
          kind: snippet.kind === 'Snippet' 
            ? monaco.languages.CompletionItemKind.Snippet 
            : monaco.languages.CompletionItemKind.Function,
          insertText: snippet.insertText,
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          range: range,
          documentation: snippet.documentation,
        });
      });

      return { suggestions };
    },
  });

  // Configure editor options for better autocomplete experience
  monaco.languages.setLanguageConfiguration('python', {
    wordPattern: /(-?\d*\.\d\w*)|([^\`\~\!\@\#\%\^\&\*\(\)\-\=\+\[\{\]\}\\\|\;\:\'\"\,\.\<\>\/\?\s]+)/g,
  });
};

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
  const [showCodeEditor, setShowCodeEditor] = useState(false);
  const [currentCode, setCurrentCode] = useState('');
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const editorRef = useRef(null);

  const { fitView } = useReactFlow();
  const reactFlowWrapper = useRef(null);
  const { project } = useReactFlow();

  // Handle editor mount
  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
    setupMonacoEditor(monaco);
    
    // Enable suggestions on trigger characters
    editor.updateOptions({
      quickSuggestions: {
        other: true,
        comments: false,
        strings: false
      },
      suggestOnTriggerCharacters: true,
      acceptSuggestionOnCommitCharacter: true,
      acceptSuggestionOnEnter: 'on',
      tabCompletion: 'on',
    });
  };

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
      data: { label: queenName, code: '' },

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
      position: mousePosition,
      data: { label: config.name, code: '' },
    };

    setNodes((nds) => [...nds, newNode]);
    setShowNodePanel(false);
  };

  // 🖱️ Track mouse position
  const onMouseMove = useCallback((event) => {
    if (reactFlowWrapper.current) {
      const rect = reactFlowWrapper.current.getBoundingClientRect();
      const position = project({
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      });
      setMousePosition(position);
    }
  }, [project]);

  // 🧭 Selection Logic
  const handleNodeClick = (event, node) => {
    setSelectedNode(node);
    setSelectedEdge(null);
    setShowCodeEditor(false);
  };

  const handleEdgeClick = (event, edge) => {
    event.stopPropagation();
    setSelectedEdge(edge);
    setSelectedNode(null);
    setShowCodeEditor(false);
  };

  // 💾 Open Code Editor
  const openCodeEditor = () => {
    if (!selectedNode) return;
    setCurrentCode(selectedNode.data.code || '');
    setShowCodeEditor(true);
  };

  // 💾 Save Code to Node
  const saveCode = () => {
    if (!selectedNode) return;

    setNodes((nds) =>
      nds.map((node) =>
        node.id === selectedNode.id
          ? { ...node, data: { ...node.data, code: currentCode } }
          : node
      )
    );

    setShowCodeEditor(false);
    // Update selected node to reflect new code
    setSelectedNode((prev) => ({
      ...prev,
      data: { ...prev.data, code: currentCode }
    }));
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
      {selectedNode && !showCodeEditor && (
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

          <div className="space-y-3">
            <button
              onClick={openCodeEditor}
              className="flex items-center gap-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-400/30 rounded-lg px-3 py-2 text-blue-300 transition-all w-full justify-center"
            >
              <Code size={16} />
              {selectedNode.data.code ? 'Edit Code' : 'Add Code'}
            </button>

            {NODE_TYPES_CONFIG.find((n) => n.type === selectedNode.type)?.deletable && (
              <button
                onClick={deleteSelectedNode}
                className="flex items-center gap-2 bg-red-500/20 hover:bg-red-500/30 border border-red-400/30 rounded-lg px-3 py-2 text-red-300 transition-all w-full justify-center"
              >
                <Trash2 size={16} />
                Delete Node
              </button>
            )}
          </div>
        </div>
      )}

      {/* Code Editor Panel */}
      {showCodeEditor && selectedNode && (
        <div className="absolute right-0 top-0 z-30 h-full w-[600px] bg-gray-900 border-l border-white/10 flex flex-col">
          <div className="flex justify-between items-center p-4 border-b border-white/10">
            <h3 className="text-lg font-semibold">
              Code Editor - {selectedNode.data.label}
            </h3>
            <button
              onClick={() => setShowCodeEditor(false)}
              className="text-white/60 hover:text-white"
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-hidden">
            <Editor
              height="100%"
              defaultLanguage="python"
              theme="vs-dark"
              value={currentCode}
              onChange={(value) => setCurrentCode(value || '')}
              onMount={handleEditorDidMount}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                lineNumbers: 'on',
                scrollBeyondLastLine: false,
                automaticLayout: true,
                suggestOnTriggerCharacters: true,
                quickSuggestions: {
                  other: true,
                  comments: false,
                  strings: false
                },
                acceptSuggestionOnCommitCharacter: true,
                acceptSuggestionOnEnter: 'on',
                tabCompletion: 'on',
                wordBasedSuggestions: true,
                suggest: {
                  showKeywords: true,
                  showSnippets: true,
                  showFunctions: true,
                },
              }}
            />
          </div>

          <div className="p-4 border-t border-white/10 flex gap-3">
            <button
              onClick={saveCode}
              className="flex-1 bg-green-500/20 hover:bg-green-500/30 border border-green-400/30 rounded-lg px-4 py-2 text-green-300 transition-all"
            >
              Save Code
            </button>
            <button
              onClick={() => setShowCodeEditor(false)}
              className="flex-1 bg-gray-700/50 hover:bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-gray-300 transition-all"
            >
              Cancel
            </button>
          </div>
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
      <div ref={reactFlowWrapper} className="h-full w-full" onMouseMove={onMouseMove}>
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
        /* Disable spacebar behavior and use Alt for panning instead */
        panOnDrag
        panActivationKeyCode="Alt"
        /* Be explicit about other key mappings to avoid accidental Space usage */
        selectionKeyCode="Shift"
        multiSelectionKeyCode="Control"
        className="bg-gray-950"
      >
        <Controls />
        <Background variant="dots" gap={50} size={1} color="rgba(255,255,255,0.1)" />
        {!showQueenForm && (
          <Panel position="bottom-left">
            <button
              onClick={() => setShowNodePanel(true)}
              className="flex items-center bg-white hover:bg-white/95 text-black transition-all p-[1px] translate-x-8"
            >
              <SquarePlus size={21} />
            </button>
          </Panel>
        )}
        </ReactFlow>
      </div>

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
