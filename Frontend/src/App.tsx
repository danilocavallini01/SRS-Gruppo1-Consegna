import { useEffect, useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import PromptInput from './PromptInput';
import CodeEditor from './CodeEditor';
import TerraformPreview from './TerraformPreview';
import ConfirmCode from './ConfirmCode';
import LoginPage from './LoginPage';
import { URI } from './secret';
import { CostEstimator } from './CostEstimator';

interface LogEntry {
  request: string;
  response: string,
  folderId: number
}

export default function App() {
  const [generatedCode, setGeneratedCode] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [editedCode, setEditedCode] = useState('');
  const [output, setOutput] = useState('');
  const [stage, setStage] = useState('NONE')
  const [loading, setLoading] = useState(false);
  const [loadingLog, setLoadingLogs] = useState(false)
  const [codeConfirmed, setCodeConfirmed] = useState(false);
  const [folderId, setFolderId] = useState(0)
  const [darkMode, setDarkMode] = useState(true);
  const [previousRequests, setPreviousRequests] = useState<LogEntry[]>([])
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);


  const handleCodeGenerated = (code: string, folderId: number) => {
    console.log(code, folderId)
    setFolderId(folderId);
    setGeneratedCode(code);
    setEditedCode(code);
    setOutput('');
    setCodeConfirmed(false); // Reset confirmation state when new code is generated
  };

  const getCookie = (name: string) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()!.split(';').shift();
  }

  useEffect(() => {
    const token = getCookie('istokenset');

    if (token) {
      setAuthenticated(true);
      handleGetLog()
      console.log('Authenticated with Token');
    }
  }, []);

  useEffect(() => {
    if (codeConfirmed && editedCode !== generatedCode) {
      setCodeConfirmed(false);
      setOutput('');
    }
  }, [editedCode, generatedCode, codeConfirmed]);

  useEffect(() => {
    handleGetLog()
  }, [])


  const handleLogin = async (email: string, password: string) => {
    setLoadingLogs(true);
    try {
      await fetch(`${URI}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email, password: password }),
        credentials: 'include',
      });

      setAuthenticated(true)

      handleGetLog()
    } catch (err) {
      console.error('Error generating preview:', err);
    } finally {
      setLoadingLogs(false);
    }
  }

  const handleRegister = async (email: string, password: string) => {
    setLoadingLogs(true);
    try {
      await fetch(`${URI}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email, password: password }),
        credentials: 'include',
      });

      handleLogin(email, password)
    } catch (err) {
      console.error('Error registering:', err);
    } finally {
      setLoadingLogs(false);
    }
  }


  const handleGetLog = async () => {
    console.log('Trying to get logs')
    setLoadingLogs(true);
    try {
      const response = await fetch(`${URI}/api/getlog`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
        credentials: 'include',
      });

      const data = await response.json();

      if (data.logs !== undefined && data.logs !== null) {
        setPreviousRequests(data.logs)
        console.log('Received Logs', data.logs)
      }
    } catch (err) {
      console.error('Error generating preview:', err);
    } finally {
      setLoadingLogs(false);
    }
  }


  const handlePreview = async () => {
    if (!editedCode.trim()) return;
    setLoading(true);
    setOutput('');

    try {
      const response = await fetch(`${URI}/api/preview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: editedCode, folderId: folderId }),
        credentials: 'include',
      });

      const data = await response.json();

      setOutput(data.output);
      setStage('PREVIEW')
    } catch (err) {
      console.error('Error generating preview:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async () => {
    if (!editedCode.trim()) return;
    setLoading(true);

    try {
      const response = await fetch(`${URI}/api/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: editedCode, folderId: folderId }),
        credentials: 'include',
      });

      const data = await response.json();
      setOutput(output + '\n' + data.output);
      setStage('APPLY')

      handleGetLog()

    } catch (err) {
      console.error('Error generating preview:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDestroy = async () => {
    if (!editedCode.trim()) return;
    setLoading(true);

    try {
      const response = await fetch(`${URI}/api/destroy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: editedCode, folderId: folderId }),
        credentials: 'include',
      });

      const data = await response.json();
      setOutput(output + '\n' + data.output);
      setStage('NONE')

    } catch (err) {
      console.error('Error generating preview:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmCode = () => {
    setCodeConfirmed(true);
    setGeneratedCode(editedCode); // Update generated code to the edited version
  };

  const importPreviousCode = (log: LogEntry) => {
    handleCodeGenerated(log.response, log.folderId);
  }

  const generatingText = () => {
    if (stage == 'NONE') {
      return 'preview'
    } else if (stage == 'PREVIEW') {
      return 'apply'
    } else if (stage == 'APPLY') {
      return 'destroy'
    }
  }

  const logs = () => {
    const result = []
    let i = 0;
    for (const req of previousRequests) {
      result.push(
        <div key={i++}>
          <div className={`p-1 mt-3 mb-1 rounded-4 shadow-sm text-center border mx-auto ${darkMode ? 'bg-dark text-white' : 'bg-light text-dark'}`}>User Request: {req.request}</div>
          <button className="btn text-center mb-3 rounded-4" onClick={() => { importPreviousCode(req) }}>▶ Load .tf Output</button>
        </div>
      )
    }
    return result
  }

  if (!authenticated) {
    return <LoginPage login={handleLogin} register={handleRegister} />;
  }

  return (
    <div className={darkMode ? 'bg-dark text-white min-vh-100' : 'bg-light text-dark min-vh-100'}>
      <div className="container-fluid">
        <div className="row">
          <div className={`border transition-all ${sidebarCollapsed ? 'col-md-1' : 'col-md-3'}`} style={{ minHeight: '100vh' }}>
            <div className="d-flex justify-content-end p-2">
              <button
                className="btn btn-sm btn-secondary"
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              >
                {sidebarCollapsed ? '▶' : '◀'}
              </button>
            </div>

            {!sidebarCollapsed && (
              <>
                <h1 className="p-3">Previous Chats</h1>
                {loadingLog && <div className="alert alert-info">Loading Previous logs...</div>}
                <div>{logs()}</div>
              </>
            )}
          </div>

          <div className='col-md-9 d-flex flex-column'>
            <div className="container">
              <div
                className={`p-5 mt-3 rounded-4 shadow-sm text-center border mx-auto ${darkMode ? 'bg-dark text-white' : 'bg-light text-dark'}`}
                style={{ maxWidth: '480px' }}
              >
                <h1 className="fw-bold mb-3" style={{ fontSize: '3rem' }}>
                  🛠️ GCPilot
                </h1>
                <p className="mb-0" style={{ fontSize: '1.05rem', color: darkMode ? '#bbbbbb' : '#555555' }}>
                  From prompt to provisioning—instantly.
                </p>
              </div>
            </div>


            {!generatedCode ? (
              <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '70vh' }}>
                <div className="text-center w-100" style={{ maxWidth: '600px' }}>
                  <h1 className="mb-4">What's on your Cloud today?</h1>
                  <PromptInput onGeneratedCode={handleCodeGenerated} />
                </div>
              </div>
            ) : (
              <>
                <CodeEditor
                  code={editedCode}
                  onChange={setEditedCode}
                  onRun={handlePreview}
                />

                {!codeConfirmed && (
                  <ConfirmCode
                    code={editedCode}
                    onConfirmed={handleConfirmCode}
                  />
                )}

                {(codeConfirmed && stage == 'NONE') && (
                  <div className="mb-3">
                    <button className="btn btn-success" onClick={handlePreview} disabled={loading}>
                      {loading ? 'Previewing...' : '▶  Run Preview'}
                    </button>
                  </div>
                )}
              </>
            )}

            <TerraformPreview output={output} stage={stage} />

            {loading && <div className="alert alert-info">Generating {generatingText()}...</div>}

            {
              stage == 'PREVIEW' && (
                <button className="btn btn-success" onClick={handleApply} disabled={loading}>
                  {loading ? 'Previewing...' : '▶ Run Apply'}
                </button>
              )
            }

            {
              stage == 'APPLY' && (
                <button className="btn btn-success" onClick={handleDestroy} disabled={loading}>
                  {loading ? 'Previewing...' : '▶ Run Destroy'}
                </button>
              )
            }
            <div>
              <CostEstimator
                folderId={folderId} 
                editedCode={editedCode}/>
            </div>
          </div>
        </div>

        <div className="form-check form-switch text-end mb-3">
          <input
            className="form-check-input"
            type="checkbox"
            id="themeSwitch"
            checked={darkMode}
            onChange={() => setDarkMode(!darkMode)}
          />
          <label className="form-check-label ms-2" htmlFor="themeSwitch">
            {darkMode ? '🌙' : '☀️'}
          </label>
        </div>
      </div>
    </div>
  );
}