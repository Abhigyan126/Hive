import { useState } from 'react';
import { Terminal, LogIn, UserPlus, X, Check } from 'lucide-react';
import { authAPI } from '../components/api';
import { Navigate } from 'react-router-dom';

export default function Login() {
  const [activeTab, setActiveTab] = useState('login');
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [signupData, setSignupData] = useState({ username: '', email: '', password: '', confirmPassword: '' });
  const [output, setOutput] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const navigate = Navigate();

  const validateEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleLogin = async () => {
    if (!loginData.email || !loginData.password) {
      addOutput('error', 'login', 'All fields are required');
      return;
    }

    if (!validateEmail(loginData.email)) {
      addOutput('error', 'login', 'Invalid email format');
      return;
    }

    setIsProcessing(true);
    addOutput('info', 'login', 'Authenticating user...');

    try {
      const result = await authAPI.login(loginData.email, loginData.password);

      if (result.success) {
        addOutput('success', 'login', `Welcome! ${result.data.message || 'Login successful'}`);
        setLoginData({ email: '', password: '' });
        navigate('/dashboard')

        // Optional: Redirect or update app state here
        // Example: window.location.href = '/dashboard';
      } else {
        addOutput('error', 'login', result.error);
      }
    } catch (error) {
      addOutput('error', 'login', 'Network error. Please check your connection.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSignup = async () => {
    if (!signupData.username || !signupData.email || !signupData.password || !signupData.confirmPassword) {
      addOutput('error', 'signup', 'All fields are required');
      return;
    }

    if (!validateEmail(signupData.email)) {
      addOutput('error', 'signup', 'Invalid email format');
      return;
    }

    if (signupData.password.length < 6) {
      addOutput('error', 'signup', 'Password must be at least 6 characters');
      return;
    }

    if (signupData.password !== signupData.confirmPassword) {
      addOutput('error', 'signup', 'Passwords do not match');
      return;
    }

    setIsProcessing(true);
    addOutput('info', 'signup', 'Creating new account...');

    try {
      const result = await authAPI.signup(
        signupData.username,
        signupData.email,
        signupData.password
      );

      if (result.success) {
        addOutput('success', 'signup', `Account created! ${result.data.message || 'Welcome aboard'}`);
        setSignupData({ username: '', email: '', password: '', confirmPassword: '' });

        // Optional: Auto-switch to login tab or redirect
        // setTimeout(() => setActiveTab('login'), 2000);
      } else {
        addOutput('error', 'signup', result.error);
      }
    } catch (error) {
      addOutput('error', 'signup', 'Network error. Please check your connection.');
    } finally {
      setIsProcessing(false);
    }
  };

  const addOutput = (type, command, data) => {
    const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false });
    setOutput(prev => [...prev, { time: timestamp, command, data, type }]);
  };

  const clearOutput = () => setOutput([]);

  const handleKeyPress = (e, action) => {
    if (e.key === 'Enter' && !isProcessing) {
      action();
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-3xl">
        <div className="bg-gray-950 rounded-lg shadow-2xl overflow-hidden border border-green-900/30">

          {/* Terminal Header */}
          <div className="bg-gray-900 px-4 py-2 flex items-center justify-between border-b border-green-900/30">
            <div className="flex items-center gap-3">
              <Terminal className="w-4 h-4 text-green-500" />
              <span className="text-green-500 font-mono text-xs">root@auth-server:~#</span>
            </div>
            <div className="flex gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
            </div>
          </div>

          {/* Command Line Tabs */}
          <div className="bg-gray-900 px-4 py-1 flex gap-4 border-b border-green-900/30">
            <button
              onClick={() => setActiveTab('login')}
              className={`py-2 font-mono text-xs transition-all ${
                activeTab === 'login'
                  ? 'text-green-500'
                  : 'text-gray-500 hover:text-gray-400'
              }`}
            >
              {activeTab === 'login' && '> '}./login.sh
            </button>
            <button
              onClick={() => setActiveTab('signup')}
              className={`py-2 font-mono text-xs transition-all ${
                activeTab === 'signup'
                  ? 'text-green-500'
                  : 'text-gray-500 hover:text-gray-400'
              }`}
            >
              {activeTab === 'signup' && '> '}./signup.sh
            </button>
          </div>

          {/* Terminal Body */}
          <div className="p-6 min-h-[400px]">
            {activeTab === 'login' ? (
              <div className="space-y-4">
                <div className="font-mono text-xs text-green-500">
                  <div className="mb-1">$ cat authentication.json</div>
                  <div className="text-gray-500 mb-4">Executing login procedure...</div>
                </div>

                <div className="bg-black/50 rounded border border-green-900/30 p-4 space-y-3">
                  <div className="text-gray-400 font-mono text-sm">
                    <span className="text-green-500">{'{'}</span>
                  </div>

                  <div className="ml-4 space-y-3">
                    <div className="flex items-start gap-2">
                      <span className="text-blue-400 font-mono text-sm pt-2">"email":</span>
                      <div className="flex-1">
                        <input
                          type="email"
                          value={loginData.email}
                          onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                          onKeyDown={(e) => handleKeyPress(e, handleLogin)}
                          className="w-full bg-transparent border border-green-900/30 focus:border-green-500 outline-none text-yellow-300 px-3 py-2 font-mono text-sm rounded"
                          placeholder="user@domain.com"
                          disabled={isProcessing}
                        />
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <span className="text-blue-400 font-mono text-sm pt-2">"password":</span>
                      <div className="flex-1">
                        <input
                          type="password"
                          value={loginData.password}
                          onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                          onKeyDown={(e) => handleKeyPress(e, handleLogin)}
                          className="w-full bg-transparent border border-green-900/30 focus:border-green-500 outline-none text-yellow-300 px-3 py-2 font-mono text-sm rounded"
                          placeholder="••••••••"
                          disabled={isProcessing}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="text-gray-400 font-mono text-sm">
                    <span className="text-green-500">{'}'}</span>
                  </div>
                </div>

                <button
                  onClick={handleLogin}
                  disabled={isProcessing}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 text-black disabled:text-gray-500 px-4 py-2 rounded font-mono text-sm transition-all"
                >
                  {isProcessing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <LogIn className="w-4 h-4" />
                      $ execute --login
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="font-mono text-xs text-green-500">
                  <div className="mb-1">$ cat registration.json</div>
                  <div className="text-gray-500 mb-4">Executing signup procedure...</div>
                </div>

                <div className="bg-black/50 rounded border border-green-900/30 p-4 space-y-3">
                  <div className="text-gray-400 font-mono text-sm">
                    <span className="text-green-500">{'{'}</span>
                  </div>

                  <div className="ml-4 space-y-3">
                    <div className="flex items-start gap-2">
                      <span className="text-blue-400 font-mono text-sm pt-2">"username":</span>
                      <div className="flex-1">
                        <input
                          type="text"
                          value={signupData.username}
                          onChange={(e) => setSignupData({ ...signupData, username: e.target.value })}
                          onKeyDown={(e) => handleKeyPress(e, handleSignup)}
                          className="w-full bg-transparent border border-green-900/30 focus:border-green-500 outline-none text-yellow-300 px-3 py-2 font-mono text-sm rounded"
                          placeholder="johndoe"
                          disabled={isProcessing}
                        />
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <span className="text-blue-400 font-mono text-sm pt-2">"email":</span>
                      <div className="flex-1">
                        <input
                          type="email"
                          value={signupData.email}
                          onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                          onKeyDown={(e) => handleKeyPress(e, handleSignup)}
                          className="w-full bg-transparent border border-green-900/30 focus:border-green-500 outline-none text-yellow-300 px-3 py-2 font-mono text-sm rounded"
                          placeholder="user@domain.com"
                          disabled={isProcessing}
                        />
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <span className="text-blue-400 font-mono text-sm pt-2">"password":</span>
                      <div className="flex-1">
                        <input
                          type="password"
                          value={signupData.password}
                          onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                          onKeyDown={(e) => handleKeyPress(e, handleSignup)}
                          className="w-full bg-transparent border border-green-900/30 focus:border-green-500 outline-none text-yellow-300 px-3 py-2 font-mono text-sm rounded"
                          placeholder="••••••••"
                          disabled={isProcessing}
                        />
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <span className="text-blue-400 font-mono text-sm pt-2">"confirm":</span>
                      <div className="flex-1">
                        <input
                          type="password"
                          value={signupData.confirmPassword}
                          onChange={(e) => setSignupData({ ...signupData, confirmPassword: e.target.value })}
                          onKeyDown={(e) => handleKeyPress(e, handleSignup)}
                          className="w-full bg-transparent border border-green-900/30 focus:border-green-500 outline-none text-yellow-300 px-3 py-2 font-mono text-sm rounded"
                          placeholder="••••••••"
                          disabled={isProcessing}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="text-gray-400 font-mono text-sm">
                    <span className="text-green-500">{'}'}</span>
                  </div>
                </div>

                <button
                  onClick={handleSignup}
                  disabled={isProcessing}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 text-black disabled:text-gray-500 px-4 py-2 rounded font-mono text-sm transition-all"
                >
                  {isProcessing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      $ execute --signup
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Output Console */}
          {output.length > 0 && (
            <div className="bg-black border-t border-green-900/30 p-4 max-h-48 overflow-y-auto">
              <div className="flex items-center justify-between mb-3">
                <span className="text-green-500 font-mono text-xs">$ tail -f /var/log/auth.log</span>
                <button
                  onClick={clearOutput}
                  className="text-red-500 hover:text-red-400 transition-colors"
                  title="Clear logs"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-1 font-mono text-xs">
                {output.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <span className="text-gray-600">[{item.time}]</span>
                    {item.type === 'success' ? (
                      <>
                        <Check className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-green-500">{item.command}:</span>
                        <span className="text-yellow-300 break-all">{item.data}</span>
                      </>
                    ) : item.type === 'info' ? (
                      <>
                        <Terminal className="w-3 h-3 text-blue-400 mt-0.5 flex-shrink-0" />
                        <span className="text-blue-400">{item.command}:</span>
                        <span className="text-gray-300">{item.data}</span>
                      </>
                    ) : (
                      <>
                        <X className="w-3 h-3 text-red-500 mt-0.5 flex-shrink-0" />
                        <span className="text-red-500">{item.command}:</span>
                        <span className="text-red-400">{item.data}</span>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="text-center mt-4 text-gray-600 font-mono text-xs">
          Press [ENTER] to execute command
        </div>
      </div>
    </div>
  );
}
