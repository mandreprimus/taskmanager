import React, { useState } from 'react';

const TaskImporter = ({ onTasksImported }) => {
  const [importMethod, setImportMethod] = useState('file');
  const [fileContent, setFileContent] = useState(null);
  const [pastedCode, setPastedCode] = useState('');
  const [extractedTasks, setExtractedTasks] = useState([]);
  const [importStatus, setImportStatus] = useState('idle');
  const [importLog, setImportLog] = useState([]);

  const logMessage = (message, type = 'info') => {
    setImportLog(prev => [...prev, { message, type, timestamp: new Date() }]);
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      setFileContent(e.target.result);
    };
    reader.readAsText(file);
  };

  const parseTasksFromReactComponent = (code) => {
    setImportStatus('processing');
    logMessage('Starting task extraction...');
    
    try {
      const tasksRegex = /const\s+tasks\s*=\s*\[([\s\S]*?)\];/;
      const match = code.match(tasksRegex);
      
      if (!match) {
        throw new Error('Could not locate tasks array in the provided code');
      }
      
      const tasksArrayContent = match[1];
      
      const extractTasks = new Function(`
        try {
          const tasks = [${tasksArrayContent}];
          return tasks;
        } catch (e) {
          throw new Error('Failed to parse tasks: ' + e.message);
        }
      `);
      
      const tasks = extractTasks();
      
      if (!Array.isArray(tasks) || tasks.length === 0) {
        throw new Error('Extracted tasks are not in the expected format');
      }
      
      logMessage(`Successfully extracted ${tasks.length} tasks`);
      
      const validTasks = tasks.filter(task => {
        const isValid = task && typeof task === 'object' && 
                       task.id !== undefined && 
                       typeof task.name === 'string';
        
        if (!isValid) {
          logMessage(`Skipping invalid task: ${JSON.stringify(task)}`, 'warning');
        }
        
        return isValid;
      });
      
      logMessage(`Validated ${validTasks.length} tasks with required properties`);
      setExtractedTasks(validTasks);
      setImportStatus('success');
      
      return validTasks;
    } catch (error) {
      logMessage(`Error extracting tasks: ${error.message}`, 'error');
      setImportStatus('error');
      return [];
    }
  };

  const handleImport = () => {
    let codeToProcess = '';
    
    if (importMethod === 'file' && fileContent) {
      codeToProcess = fileContent;
    } else if (importMethod === 'paste' && pastedCode) {
      codeToProcess = pastedCode;
    } else {
      logMessage('No content to process. Please upload a file or paste code.', 'error');
      return;
    }
    
    const tasks = parseTasksFromReactComponent(codeToProcess);
    
    if (tasks.length > 0 && typeof onTasksImported === 'function') {
      onTasksImported(tasks);
    }
  };

  const renderTaskSummary = () => {
    if (extractedTasks.length === 0) return null;
    
    const highestId = Math.max(...extractedTasks.map(t => t.id));
    
    const statusCounts = extractedTasks.reduce((acc, task) => {
      acc[task.status] = (acc[task.status] || 0) + 1;
      return acc;
    }, {});
    
    return (
      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-medium mb-2">Extracted Tasks Summary</h3>
        <p>Total Tasks: {extractedTasks.length}</p>
        <p>Highest Task ID: {highestId}</p>
        <div className="mt-2">
          <h4 className="font-medium">Status Distribution:</h4>
          <ul className="mt-1">
            {Object.entries(statusCounts).map(([status, count]) => (
              <li key={status}>{status}: {count}</li>
            ))}
          </ul>
        </div>
      </div>
    );
  };

  return (
    <div className="card">
      <div className="card-header">
        <h2>Import Existing Tasks</h2>
      </div>
      <div className="card-content">
        <div>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
            <button 
              style={{ backgroundColor: importMethod === 'file' ? '#4361ee' : '#ccc' }}
              onClick={() => setImportMethod('file')}
            >
              Upload File
            </button>
            <button 
              style={{ backgroundColor: importMethod === 'paste' ? '#4361ee' : '#ccc' }}
              onClick={() => setImportMethod('paste')}
            >
              Paste Code
            </button>
          </div>
          
          {importMethod === 'file' && (
            <div style={{ marginTop: '10px' }}>
              <input 
                type="file" 
                accept=".tsx,.jsx,.js,.txt" 
                onChange={handleFileUpload}
              />
              {fileContent && (
                <p style={{ marginTop: '10px', fontSize: '14px', color: '#666' }}>
                  File loaded ({(fileContent.length / 1024).toFixed(2)} KB)
                </p>
              )}
            </div>
          )}
          
          {importMethod === 'paste' && (
            <div style={{ marginTop: '10px' }}>
              <textarea
                value={pastedCode}
                onChange={(e) => setPastedCode(e.target.value)}
                placeholder="Paste your React component code here..."
                style={{ width: '100%', height: '200px', padding: '8px' }}
              />
            </div>
          )}
          
          <button 
            onClick={handleImport} 
            disabled={importStatus === 'processing' || 
                     (importMethod === 'file' && !fileContent) || 
                     (importMethod === 'paste' && !pastedCode)}
            style={{ marginTop: '10px' }}
          >
            {importStatus === 'processing' ? 'Processing...' : 'Import Tasks'}
          </button>
          
          {importStatus !== 'idle' && (
            <div style={{ marginTop: '10px', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}>
              <h3 style={{ display: 'flex', alignItems: 'center' }}>
                {importStatus === 'success' ? 'Import Successful' : 
                 importStatus === 'error' ? 'Import Failed' : 'Import Log'}
              </h3>
              <div style={{ marginTop: '10px', maxHeight: '150px', overflow: 'auto', fontSize: '14px' }}>
                {importLog.map((log, i) => (
                  <div 
                    key={i} 
                    style={{ 
                      padding: '4px 0', 
                      color: log.type === 'error' ? '#e63946' : 
                             log.type === 'warning' ? '#ffba08' : '#666'
                    }}
                  >
                    {log.message}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {renderTaskSummary()}
        </div>
      </div>
    </div>
  );
};

export default TaskImporter;