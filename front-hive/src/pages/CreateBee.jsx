import { useState, useRef, useEffect } from 'react';
import { Handle, Position } from 'reactflow';
import Editor from '@monaco-editor/react';
import { Save, Eye, Code, Settings, FileText, ArrowLeft, AlertCircle } from 'lucide-react';

// Setup Monaco Editor with Python autocomplete
const setupMonacoEditor = (monaco) => {
  const PYTHON_KEYWORDS = [
    'False', 'None', 'True', 'and', 'as', 'assert', 'async', 'await', 'break',
    'class', 'continue', 'def', 'del', 'elif', 'else', 'except', 'finally',
    'for', 'from', 'global', 'if', 'import', 'in', 'is', 'lambda', 'nonlocal',
    'not', 'or', 'pass', 'raise', 'return', 'try', 'while', 'with', 'yield'
  ];

  monaco.languages.registerCompletionItemProvider('python', {
    provideCompletionItems: (model, position) => {
      const word = model.getWordUntilPosition(position);
      const range = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endColumn: word.endColumn,
      };

      const suggestions = PYTHON_KEYWORDS.map((keyword) => ({
        label: keyword,
        kind: monaco.languages.CompletionItemKind.Keyword,
        insertText: keyword,
        range: range,
      }));

      return { suggestions };
    },
  });
};

export default function CreateBee() {
  const [nodeName, setNodeName] = useState('Custom API Node');
  const [nodeColor, setNodeColor] = useState('#facc15');
  const [activeTab, setActiveTab] = useState('config'); // config, form, code

  // Configuration for handles (connection points)
  const [handlesConfig, setHandlesConfig] = useState(`{
  "handles": [
    {
      "id": "data_input",
      "type": "target",
      "position": "left",
      "name": "input_data",
      "color": "#facc15"
    },
    {
      "id": "result_output",
      "type": "source",
      "position": "right",
      "name": "output_result",
      "color": "#facc15"
    }
  ]
}`);

  // Form template for user inputs
  const [formTemplate, setFormTemplate] = useState(`{
  "fields": [
    {
      "name": "api_key",
      "label": "API Key",
      "type": "text",
      "placeholder": "Enter your API key",
      "required": true,
      "description": "Your API authentication key"
    },
    {
      "name": "endpoint_url",
      "label": "API Endpoint URL",
      "type": "text",
      "placeholder": "https://api.example.com/v1/data",
      "required": true,
      "description": "Full URL to the API endpoint"
    },
    {
      "name": "timeout",
      "label": "Request Timeout",
      "type": "number",
      "placeholder": "30",
      "required": false,
      "description": "Request timeout in seconds"
    }
  ]
}`);

  // Python code with $variable syntax
  const [nodeCode, setNodeCode] = useState(`# Use $variablename to reference form inputs
# Available variables: $api_key, $endpoint_url, $timeout
# Your code will have access to: input_data (from previous node), output_result (your result)

import requests
import json
from urllib.parse import urljoin

def execute(input_data):
    """
    Execute API request with form parameters
    Available variables: $api_key, $endpoint_url, $timeout
    """
    # Access form values using $ prefix
    api_key = "$api_key"
    endpoint_url = "$endpoint_url"
    timeout = int("$timeout") if "$timeout" else 30

    try:
        # Prepare headers
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "User-Agent": "CustomBee/1.0"
        }

        # Make the API request
        response = requests.get(
            endpoint_url,
            headers=headers,
            timeout=timeout
        )

        # Check if request was successful
        response.raise_for_status()

        # Parse and return the response
        result_data = response.json()

        return {
            "status": "success",
            "data": result_data,
            "status_code": response.status_code,
            "endpoint": endpoint_url
        }

    except requests.exceptions.Timeout:
        return {
            "status": "error",
            "error": "Request timeout",
            "details": f"Request to {endpoint_url} timed out after {timeout} seconds"
        }
    except requests.exceptions.HTTPError as e:
        return {
            "status": "error",
            "error": "HTTP error",
            "details": str(e),
            "status_code": e.response.status_code if e.response else None
        }
    except requests.exceptions.RequestException as e:
        return {
            "status": "error",
            "error": "Request failed",
            "details": str(e)
        }
    except json.JSONDecodeError:
        return {
            "status": "error",
            "error": "Invalid JSON response",
            "details": "The API response could not be parsed as JSON"
        }
    except Exception as e:
        return {
            "status": "error",
            "error": "Unexpected error",
            "details": str(e)
        }`);

  const [errors, setErrors] = useState({
    handles: null,
    form: null,
    validation: null,
  });

  const editorRef = useRef(null);

  // Parse and validate JSON (without setting state during render)
  const parseJSON = (jsonString) => {
    try {
      return { data: JSON.parse(jsonString), error: null };
    } catch (e) {
      return { data: null, error: e.message };
    }
  };

  // Parse handles configuration
  const handlesResult = parseJSON(handlesConfig);
  const parsedHandles = handlesResult.data;
  const handles = parsedHandles?.handles || [];

  // Parse form template
  const formResult = parseJSON(formTemplate);
  const parsedForm = formResult.data;
  const formFields = parsedForm?.fields || [];

  // Update errors only when JSON changes (using useEffect)
  useEffect(() => {
    setErrors({
      handles: handlesResult.error,
      form: formResult.error
    });
  }, [handlesConfig, formTemplate]);

  // Extract $variables from code
  const extractVariables = (code) => {
    const matches = code.match(/\$([a-zA-Z_][a-zA-Z0-9_]*)/g);
    return matches ? [...new Set(matches.map(m => m.slice(1)))] : [];
  };

  const codeVariables = extractVariables(nodeCode);
  const formFieldNames = formFields.map(f => f.name);
  const missingVariables = codeVariables.filter(v => !formFieldNames.includes(v));
  const unusedVariables = formFieldNames.filter(v => !codeVariables.includes(v));

  // Validate handle names (should be descriptive and follow naming conventions)
  const validateHandles = (handles) => {
    const issues = [];

    handles.forEach((handle, index) => {
      // Check required fields
      if (!handle.id) {
        issues.push(`Handle ${index + 1}: Missing 'id' field`);
      }
      if (!handle.name) {
        issues.push(`Handle ${index + 1}: Missing 'name' field`);
      }
      if (!handle.type || !['source', 'target'].includes(handle.type)) {
        issues.push(`Handle ${index + 1}: Invalid or missing 'type' (must be 'source' or 'target')`);
      }
      if (!handle.position || !['left', 'right', 'top', 'bottom'].includes(handle.position)) {
        issues.push(`Handle ${index + 1}: Invalid or missing 'position' (must be 'left', 'right', 'top', or 'bottom')`);
      }

      // Check naming conventions
      if (handle.name && !/^[a-z_][a-z0-9_]*$/.test(handle.name)) {
        issues.push(`Handle '${handle.name}': Name should use snake_case (lowercase with underscores)`);
      }
      if (handle.id && !/^[a-z_][a-z0-9_]*$/.test(handle.id)) {
        issues.push(`Handle '${handle.id}': ID should use snake_case (lowercase with underscores)`);
      }
    });

    return issues;
  };

  const handleIssues = validateHandles(handles);

  // Validate variable-to-form field matching
  const validateVariableMapping = () => {
    const validationErrors = [];

    if (missingVariables.length > 0) {
      validationErrors.push(`Missing form fields for variables: ${missingVariables.join(', ')}`);
    }

    if (unusedVariables.length > 0) {
      validationErrors.push(`Unused form fields (not referenced in code): ${unusedVariables.join(', ')}`);
    }

    if (codeVariables.length === 0) {
      validationErrors.push("No variables found in code. Use $variable_name format to reference form inputs.");
    }

    return validationErrors;
  };

  const validationErrors = validateVariableMapping();

  // Handle editor mount
  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
    setupMonacoEditor(monaco);

    editor.updateOptions({
      quickSuggestions: { other: true, comments: false, strings: false },
      suggestOnTriggerCharacters: true,
      acceptSuggestionOnEnter: 'on',
      tabCompletion: 'on',
    });
  };

  // Save node configuration
  const saveNode = () => {
    // Check for JSON errors
    if (errors.handles) {
      alert(`Please fix handles configuration JSON error: ${errors.handles}`);
      return;
    }
    if (errors.form) {
      alert(`Please fix form template JSON error: ${errors.form}`);
      return;
    }

    // Check for handle validation issues
    if (handleIssues.length > 0) {
      alert(`Please fix handle configuration issues:\n${handleIssues.join('\n')}`);
      return;
    }

    // Check for variable mapping issues
    if (validationErrors.length > 0) {
      alert(`Please fix variable mapping issues:\n${validationErrors.join('\n')}`);
      return;
    }

    const nodeConfig = {
      name: nodeName,
      color: nodeColor,
      handles: parsedHandles,
      formTemplate: parsedForm,
      code: nodeCode,
      variables: codeVariables,
      validation: {
        codeVariables,
        formFields: formFieldNames,
        missingVariables,
        unusedVariables
      }
    };

    console.log('Node Configuration:', nodeConfig);

    // Here you would send to backend:
    // fetch('/api/custom-nodes', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(nodeConfig)
    // });

    alert('Node configuration saved successfully! (Check console for output)');
  };

  // Preview node component
  const PreviewNode = () => (
    <div className="flex items-center justify-center p-8">
      <div className="relative">
        <div
          className="px-6 py-4 rounded-xl border-2 shadow-2xl text-white font-medium min-w-[180px] text-center"
          style={{
            backgroundColor: `${nodeColor}30`,
            borderColor: `${nodeColor}80`,
            boxShadow: `0 0 20px ${nodeColor}40`
          }}
        >
          {nodeName}

          {/* Render handles */}
          {handles.map((handle, i) => {
            const positions = {
              left: { left: -5, top: '50%', transform: 'translateY(-50%)' },
              right: { right: -5, top: '50%', transform: 'translateY(-50%)' },
              top: { top: -5, left: '50%', transform: 'translateX(-50%)' },
              bottom: { bottom: -5, left: '50%', transform: 'translateX(-50%)' }
            };

            return (
              <div key={i}>
                <div
                  className="absolute w-3 h-3 rounded-full border-2 border-gray-900 transition-all hover:scale-125"
                  style={{
                    ...positions[handle.position],
                    backgroundColor: handle.color || nodeColor
                  }}
                  title={handle.name}
                />
                {/* Handle label */}
                <div
                  className="absolute text-xs text-white/70 whitespace-nowrap pointer-events-none"
                  style={{
                    ...(handle.position === 'left' ? { left: -10, top: '50%', transform: 'translate(-100%, -50%)' } :
                       handle.position === 'right' ? { right: -10, top: '50%', transform: 'translate(100%, -50%)' } :
                       handle.position === 'top' ? { top: -10, left: '50%', transform: 'translate(-50%, -100%)' } :
                       { bottom: -10, left: '50%', transform: 'translate(-50%, 100%)' })
                  }}
                >
                  {handle.name}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  // Form preview
  const FormPreview = () => (
    <div className="p-4 bg-gray-800/50 rounded-lg space-y-3">
      <h4 className="text-sm font-semibold text-white/80 mb-3">Form Preview</h4>
      {formFields.map((field, i) => (
        <div key={i}>
          <label className="block text-sm text-white/70 mb-1">
            {field.label}
            {field.required && <span className="text-red-400 ml-1">*</span>}
          </label>
          <input
            type={field.type}
            placeholder={field.placeholder}
            className="w-full px-3 py-2 rounded bg-gray-700 border border-gray-600 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled
          />
          <div className="text-xs text-white/40 mt-1">Variable: ${field.name}</div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="h-screen bg-gray-950 text-white flex flex-col">
      {/* Header */}
      <div className="bg-gray-900 border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button className="text-white/60 hover:text-white transition-colors">
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-2xl font-bold">Create Custom Bee</h1>
            <p className="text-sm text-white/50">Design your own node type</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={saveNode}
            className="flex items-center rounded-lg p-1 transition-all text-white/80 hover:bg-white/20"
          >
            <Save size={24} />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Half - Preview */}
        <div className="w-1/2 border-r border-white/10 flex flex-col bg-gray-900/50">
          <div className="p-6 border-b border-white/10">
            <h2 className="text-lg font-semibold mb-4">Node Configuration</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-white/70 mb-1">Node Name</label>
                <input
                  type="text"
                  value={nodeName}
                  onChange={(e) => setNodeName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm text-white/70 mb-1">Node Color</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={nodeColor}
                    onChange={(e) => setNodeColor(e.target.value)}
                    className="w-12 h-10 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={nodeColor}
                    onChange={(e) => setNodeColor(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            <h3 className="text-lg font-semibold mb-4">Visual Preview</h3>
            <PreviewNode />

            {/* Enhanced Variable Validation */}
            <div className="mt-6 p-4 bg-gray-800/50 rounded-lg">
              <h4 className="text-sm font-semibold text-white/80 mb-3">Variable Validation</h4>

              {/* Code variables */}
              <div className="mb-3">
                <h5 className="text-xs text-white/60 mb-2">Variables in Code:</h5>
                <div className="flex flex-wrap gap-2">
                  {codeVariables.length > 0 ? codeVariables.map((v, i) => (
                    <span
                      key={i}
                      className={`px-2 py-1 rounded text-xs ${
                        formFieldNames.includes(v)
                          ? 'bg-green-500/20 text-green-300 border border-green-400/30'
                          : 'bg-red-500/20 text-red-300 border border-red-400/30'
                      }`}
                    >
                      ${v}
                    </span>
                  )) : (
                    <span className="text-white/40 text-xs italic">No variables found</span>
                  )}
                </div>
              </div>

              {/* Form fields */}
              <div className="mb-3">
                <h5 className="text-xs text-white/60 mb-2">Form Fields:</h5>
                <div className="flex flex-wrap gap-2">
                  {formFields.map((field, i) => (
                    <span
                      key={i}
                      className={`px-2 py-1 rounded text-xs ${
                        codeVariables.includes(field.name)
                          ? 'bg-green-500/20 text-green-300 border border-green-400/30'
                          : 'bg-yellow-500/20 text-yellow-300 border border-yellow-400/30'
                      }`}
                    >
                      ${field.name}
                    </span>
                  ))}
                </div>
              </div>

              {/* Issues */}
              {(missingVariables.length > 0 || unusedVariables.length > 0 || validationErrors.length > 0) && (
                <div className="flex items-start gap-2 text-xs text-red-300 mt-3">
                  <AlertCircle size={14} className="mt-0.5" />
                  <div>
                    {missingVariables.length > 0 && (
                      <div>Missing form fields: {missingVariables.join(', ')}</div>
                    )}
                    {unusedVariables.length > 0 && (
                      <div>Unused form fields: {unusedVariables.join(', ')}</div>
                    )}
                    {validationErrors.map((error, i) => (
                      <div key={i}>{error}</div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Handle Validation */}
            {handles.length > 0 && (
              <div className="mt-6 p-4 bg-gray-800/50 rounded-lg">
                <h4 className="text-sm font-semibold text-white/80 mb-3">Handle Configuration</h4>
                <div className="space-y-2">
                  {handles.map((handle, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      <span className={`px-2 py-1 rounded ${
                        handleIssues.find(issue => issue.includes(handle.id || handle.name))
                          ? 'bg-red-500/20 text-red-300'
                          : 'bg-green-500/20 text-green-300'
                      }`}>
                        {handle.name} ({handle.type})
                      </span>
                      <span className="text-white/50">
                        {handle.position} • {handle.id}
                      </span>
                    </div>
                  ))}
                </div>
                {handleIssues.length > 0 && (
                  <div className="flex items-start gap-2 text-xs text-red-300 mt-3">
                    <AlertCircle size={14} className="mt-0.5" />
                    <div>
                      {handleIssues.map((issue, i) => (
                        <div key={i}>{issue}</div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Form Preview */}
            {formFields.length > 0 && (
              <div className="mt-6">
                <FormPreview />
              </div>
            )}
          </div>
        </div>

        {/* Right Half - Editors */}
        <div className="w-1/2 flex flex-col bg-gray-950">
          {/* Tabs */}
          <div className="flex border-b border-white/10 bg-gray-900">
            <button
              onClick={() => setActiveTab('config')}
              className={`flex items-center gap-2 px-6 py-3 transition-all ${
                activeTab === 'config'
                  ? 'bg-gray-950 text-white border-b-2 border-blue-500'
                  : 'text-white/60 hover:text-white hover:bg-gray-800'
              }`}
            >
              <Settings size={18} />
              Handles Config
            </button>
            <button
              onClick={() => setActiveTab('form')}
              className={`flex items-center gap-2 px-6 py-3 transition-all ${
                activeTab === 'form'
                  ? 'bg-gray-950 text-white border-b-2 border-blue-500'
                  : 'text-white/60 hover:text-white hover:bg-gray-800'
              }`}
            >
              <FileText size={18} />
              Form Template
            </button>
            <button
              onClick={() => setActiveTab('code')}
              className={`flex items-center gap-2 px-6 py-3 transition-all ${
                activeTab === 'code'
                  ? 'bg-gray-950 text-white border-b-2 border-blue-500'
                  : 'text-white/60 hover:text-white hover:bg-gray-800'
              }`}
            >
              <Code size={18} />
              Node Code
            </button>
          </div>

          {/* Editor Content */}
          <div className="flex-1 overflow-hidden">
            {activeTab === 'config' && (
              <div className="h-full flex flex-col">
                {errors.handles && (
                  <div className="bg-red-500/20 border-l-4 border-red-500 p-3 text-red-300 text-sm">
                    <strong>JSON Error:</strong> {errors.handles}
                  </div>
                )}
                <div className="flex-1">
                  <Editor
                    height="100%"
                    defaultLanguage="json"
                    theme="vs-dark"
                    value={handlesConfig}
                    onChange={(value) => setHandlesConfig(value || '')}
                    options={{
                      minimap: { enabled: false },
                      fontSize: 14,
                      lineNumbers: 'on',
                      scrollBeyondLastLine: false,
                      automaticLayout: true,
                    }}
                  />
                </div>
                <div className="p-4 bg-gray-900 border-t border-white/10 text-xs text-white/60">
                  <strong>Configuration Guide:</strong>
                  <ul className="mt-2 space-y-1">
                    <li>• <strong>id:</strong> Unique identifier (use snake_case)</li>
                    <li>• <strong>name:</strong> Display name (use snake_case)</li>
                    <li>• <strong>type:</strong> 'source' (output) or 'target' (input)</li>
                    <li>• <strong>position:</strong> 'left', 'right', 'top', or 'bottom'</li>
                    <li>• <strong>color:</strong> Handle color (hex or named color)</li>
                  </ul>
                </div>
              </div>
            )}

            {activeTab === 'form' && (
              <div className="h-full flex flex-col">
                {errors.form && (
                  <div className="bg-red-500/20 border-l-4 border-red-500 p-3 text-red-300 text-sm">
                    <strong>JSON Error:</strong> {errors.form}
                  </div>
                )}
                <div className="flex-1">
                  <Editor
                    height="100%"
                    defaultLanguage="json"
                    theme="vs-dark"
                    value={formTemplate}
                    onChange={(value) => setFormTemplate(value || '')}
                    options={{
                      minimap: { enabled: false },
                      fontSize: 14,
                      lineNumbers: 'on',
                      scrollBeyondLastLine: false,
                      automaticLayout: true,
                    }}
                  />
                </div>
                <div className="p-4 bg-gray-900 border-t border-white/10 text-xs text-white/60">
                  <strong>Form Guide:</strong>
                  <ul className="mt-2 space-y-1">
                    <li>• <strong>name:</strong> Variable name (must match $variable in code)</li>
                    <li>• <strong>label:</strong> User-friendly label</li>
                    <li>• <strong>type:</strong> 'text', 'number', 'password', 'textarea'</li>
                    <li>• <strong>required:</strong> true/false (default: false)</li>
                    <li>• <strong>description:</strong> Help text for users</li>
                  </ul>
                </div>
              </div>
            )}

            {activeTab === 'code' && (
              <div className="h-full flex flex-col">
                <div className="flex-1">
                  <Editor
                    height="100%"
                    defaultLanguage="python"
                    theme="vs-dark"
                    value={nodeCode}
                    onChange={(value) => setNodeCode(value || '')}
                    onMount={handleEditorDidMount}
                    options={{
                      minimap: { enabled: false },
                      fontSize: 14,
                      lineNumbers: 'on',
                      scrollBeyondLastLine: false,
                      automaticLayout: true,
                      quickSuggestions: { other: true, comments: false, strings: false },
                      suggestOnTriggerCharacters: true,
                    }}
                  />
                </div>
                <div className="p-4 bg-gray-900 border-t border-white/10 text-xs text-white/60">
                  <strong>Code Guide:</strong>
                  <ul className="mt-2 space-y-1">
                    <li>• Use <strong>$variablename</strong> to reference form inputs</li>
                    <li>• Variables will be replaced with actual values at runtime</li>
                    <li>• <strong>input_data:</strong> Data from previous node</li>
                    <li>• <strong>execute(input_data):</strong> Required function signature</li>
                    <li>• Return value will be passed to the next node</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
