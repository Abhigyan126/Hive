import React, { useState, useEffect } from 'react';
import { Plus, Send, History, X, Hexagon, Search } from 'lucide-react';

const GRID_SIZE = 50;
const API_URL = 'http://localhost:5001';

export default function HiveComponent() {
  const [showHistory, setShowHistory] = useState(false);
  const [showHive, setShowHive] = useState(false);
  const [input, setInput] = useState('');
  const [hives, setHives] = useState([]);
  const [isCreatingHive, setIsCreatingHive] = useState(false);
  const [newHiveName, setNewHiveName] = useState('');
  const [searchTerm, setSearchTerm] = useState(''); // State for search term

  useEffect(() => {
    fetchHives();
  }, []);

  const fetchHives = async () => {
    try {
      const response = await fetch(`${API_URL}/api/hives`);
      if (response.ok) {
        const data = await response.json();
        setHives(data);
      }
    } catch (error) {
      console.error('Error fetching hives:', error);
    }
  };

  const createHive = async () => {
    if (!newHiveName.trim()) return;

    try {
      const response = await fetch(`${API_URL}/api/addhive`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newHiveName,
          description: ''
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Hive created:', data.hive.name);
        setNewHiveName('');
        setIsCreatingHive(false);
        await fetchHives(); // Refresh the list
      } else {
        const error = await response.json();
        console.error('Error creating hive:', error.error);
        alert(error.error);
      }
    } catch (error) {
      console.error('Error creating hive:', error);
      alert('Failed to create hive. Please check if the server is running.');
    }
  };

  const handleHiveClick = (hiveName) => {
    console.log('Hive clicked:', hiveName);
  };

  const handleSend = () => {
    if (input.trim()) {
      console.log('Sending:', input);
      setInput('');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Filtered hives based on search term
  const filteredHives = hives.filter(hive =>
    hive.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex h-screen bg-black overflow-hidden">
      <div
        className="flex-1"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255, 255, 255, 0.2) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.15) 1px, transparent 1px)
          `,
          backgroundSize: `${GRID_SIZE}px ${GRID_SIZE}px`,
        }}
      />

      {/* --- History Sidebar --- */}
      <div
        className={`fixed left-0 top-0 h-full ${showHistory ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 bg-black/40 backdrop-blur-md border-r border-white/10 flex flex-col w-80 z-50`}
      >
        <div className="flex items-center justify-between p-6 border-b border-white/20 bg-white/5">
          <h2 className="text-white font-semibold text-lg tracking-wide">HISTORY</h2>
          {/* History Close Button (Faster Hover) */}
          <button onClick={() => setShowHistory(false)} className="text-white/60 hover:text-white transition-colors duration-150">
            <X size={20} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <div className="text-white/40 text-sm">Chat history will appear here</div>
        </div>
      </div>

      {/* --- Hive Sidebar --- */}
      <div
        className={`fixed right-0 top-0 h-full ${showHive ? 'translate-x-0' : 'translate-x-full'} transition-transform duration-300 bg-black/40 backdrop-blur-md border-l border-white/10 flex flex-col w-80 z-50`}
      >
        <div className="p-6 border-b border-white/20 bg-white/5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-semibold text-lg tracking-wide">HIVE</h2>
            <div className="flex items-center gap-2">
              {/* Add Hive Button (Faster Hover) */}
              <button
                onClick={() => setIsCreatingHive(true)}
                className="text-white/60 hover:text-white transition-colors duration-150"
                title="Create New Hive"
              >
                <Plus size={20} />
              </button>
              {/* NEW: Hive Close Button (Faster Hover) */}
              <button onClick={() => setShowHive(false)} className="text-white/60 hover:text-white transition-colors duration-150">
                <X size={20} />
              </button>
            </div>
          </div>
          {/* Search Bar */}
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search hives..."
              className="w-full bg-white/5 text-white rounded-xl pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-white/20 border border-white/10 placeholder-white/30 text-sm"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {isCreatingHive ? (
            <div className="space-y-3">
              <input
                type="text"
                value={newHiveName}
                onChange={(e) => setNewHiveName(e.target.value)}
                placeholder="Hive name..."
                className="w-full bg-white/5 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-white/20 border border-white/10 placeholder-white/30"
                autoFocus
              />
              <div className="flex gap-2">
                <button
                  onClick={createHive}
                  className="flex-1 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-white transition-colors duration-150 border border-white/10 font-medium"
                >
                  Create
                </button>
                <button
                  onClick={() => {
                    setIsCreatingHive(false);
                    setNewHiveName('');
                  }}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-white transition-colors duration-150 border border-white/10"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : filteredHives.length === 0 && searchTerm === '' ? (
            <div className="flex items-center justify-center h-full">
              <button
                onClick={() => setIsCreatingHive(true)}
                className="px-6 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-white transition-colors duration-150 border border-white/10 font-medium"
              >
                Create Hive
              </button>
            </div>
          ) : filteredHives.length === 0 && searchTerm !== '' ? (
            <div className="text-white/50 text-center py-4">No hives found for "{searchTerm}"</div>
          ) : (
            <div className="space-y-2">
              {filteredHives.map((hive) => (
                <div
                  key={hive.id}
                  className="relative group w-full text-left px-4 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-white transition-colors duration-150 border border-white/10"
                >
                  <div
                    onClick={() => handleHiveClick(hive.name)}
                    className="cursor-pointer pr-20"
                  >
                    <div className="font-medium truncate">{hive.name}</div>
                    {hive.description && (
                      <div className="text-sm text-white/60 mt-1 truncate">{hive.description}</div>
                    )}
                  </div>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        console.log('Edit hive:', hive.name);
                      }}
                      className="p-1.5 bg-white/10 hover:bg-white/20 rounded-lg transition-colors duration-150"
                      title="Edit"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        console.log('Delete hive:', hive.name);
                      }}
                      className="p-1.5 bg-red-500/20 hover:bg-red-500/30 rounded-lg transition-colors duration-150"
                      title="Delete"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* --- Main Input Area --- */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[700px] bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl shadow-2xl">
        <div className="flex items-end gap-3 p-4">
          <button onClick={() => setShowHistory(!showHistory)} className="p-3 bg-white/5 hover:bg-white/10 rounded-xl text-white transition-colors duration-150 border border-white/10">
            <History size={20} />
          </button>
          <button className="p-3 bg-white/5 hover:bg-white/10 rounded-xl text-white transition-colors duration-150 border border-white/10">
            <Plus size={20} />
          </button>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="flex-1 bg-white/5 text-white rounded-xl px-4 py-3 resize-none focus:outline-none focus:ring-2 focus:ring-white/20 border border-white/10 placeholder-white/30"
            style={{ minHeight: '48px', maxHeight: '200px', height: `${Math.max(48, input.split('\n').length * 24)}px` }}
          />
          <button onClick={handleSend} className="p-3 bg-white/5 hover:bg-white/10 rounded-xl text-white transition-colors duration-150 border border-white/10">
            <Send size={20} />
          </button>
          <button onClick={() => setShowHive(!showHive)} className="p-3 bg-white/5 hover:bg-white/10 rounded-xl text-white transition-colors duration-150 border border-white/10">
            <Hexagon size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
