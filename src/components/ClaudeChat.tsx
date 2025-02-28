import { useState, useEffect, useRef } from 'react';
import { Task } from '../taskStore';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function ClaudeChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [backendUrl, setBackendUrl] = useState('http://localhost:3002'); // Updated to port 3002
  const [backendStatus, setBackendStatus] = useState<'unknown' | 'connected' | 'disconnected'>('unknown');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Check backend connection on component mount
  useEffect(() => {
    checkBackendConnection();
  }, [backendUrl]);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Check if backend is available
  const checkBackendConnection = async () => {
    try {
      const response = await fetch(`${backendUrl}/api/health`);
      if (response.ok) {
        setBackendStatus('connected');
      } else {
        setBackendStatus('disconnected');
      }
    } catch (error) {
      console.error('Error connecting to backend:', error);
      setBackendStatus('disconnected');
    }
  };

  // Fetch task data to include in context
  const getTaskContext = () => {
    try {
      // Try both localStorage keys to find tasks
      let tasks: Task[] = [];
      
      // First try the Zustand store format
      const zustandStore = localStorage.getItem('task-management-store');
      if (zustandStore) {
        const parsed = JSON.parse(zustandStore);
        if (parsed.state && Array.isArray(parsed.state.tasks)) {
          tasks = parsed.state.tasks;
        }
      }
      
      // If no tasks found, try the older format
      if (tasks.length === 0) {
        const oldStore = localStorage.getItem('adhd-tasks');
        if (oldStore) {
          tasks = JSON.parse(oldStore);
        }
      }
      
      if (tasks.length === 0) {
        return 'No tasks found.';
      }
      
      // Find highest task ID and count by status
      const highestId = Math.max(...tasks.map(t => t.id || 0));
      const statusCounts = tasks.reduce((counts: Record<string, number>, task: Task) => {
        const status = task.status || 'Unknown';
        counts[status] = (counts[status] || 0) + 1;
        return counts;
      }, {});
      
      let context = `## Current Task Status (${new Date().toLocaleDateString()})\n\n`;
      context += `Total Tasks: ${tasks.length} | Highest ID: ${highestId}\n`;
      context += `Status Counts: `;
      
      Object.entries(statusCounts).forEach(([status, count]) => {
        context += `${status}: ${count} | `;
      });
      
      context += `\n\n### Task List:\n\n`;
      
      // Add each task (limit to 10 to avoid token limits)
      tasks.slice(0, 10).forEach((task: Task) => {
        context += `- #${task.id}: ${task.name} (${task.status})`;
        
        if (task.due) {
          context += ` | Due: ${new Date(task.due).toLocaleDateString()}`;
        }
        
        if (task.completedDate) {
          context += ` | Completed: ${new Date(task.completedDate).toLocaleDateString()}`;
        }
        
        if (task.notes) {
          const shortNotes = task.notes.length > 100 
            ? task.notes.substring(0, 100) + '...' 
            : task.notes;
          context += `\n  Notes: ${shortNotes}`;
        }
        
        context += '\n';
      });
      
      if (tasks.length > 10) {
        context += `\n... and ${tasks.length - 10} more tasks (omitted to save space)`;
      }
      
      return context;
    } catch (err) {
      console.error('Error parsing tasks:', err);
      return 'Error reading tasks.';
    }
  };

  // System prompt for Claude
  const getSystemPrompt = () => {
    return `You are Claude, acting as an executive functioning and task management support system for a user with ADHD. 
    
Your role is to:
1. Help prioritize tasks based on urgency, importance, and energy levels
2. Break down overwheling tasks into smaller steps
3. Suggest effective time-blocking strategies
4. Provide accountability and encouragement
5. Help recover from missed deadlines or procrastination without judgment
6. Identify patterns in task completion and suggest optimizations

Always be concise but supportive in your responses. You'll receive context about the user's current tasks at the beginning of each conversation.`;
  };

  // Send message to Claude API via the backend proxy
  const sendMessage = async () => {
    if (!input.trim()) return;
    
    const userMessage = input;
    setInput('');
    setLoading(true);
    
    // Add user message to chat
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    
    try {
      // Get task data and system prompt
      const taskContext = getTaskContext();
      const systemPrompt = getSystemPrompt();
      
      // Prepare the request
      const requestMessages = [
        { role: 'user', content: taskContext },
        ...messages.map(m => ({ role: m.role, content: m.content })),
        { role: 'user', content: userMessage }
      ];
      
      const payload = {
        model: 'claude-3-opus-20240229',
        max_tokens: 4000,
        system: systemPrompt,
        messages: requestMessages
      };
      
      // Use the backend proxy endpoint
      const response = await fetch(`${backendUrl}/api/claude`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });
      
      // Handle non-OK responses
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Error calling Claude API via backend');
      }
      
      // Parse response
      const data = await response.json();
      
      // Add Claude's response to chat
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: data.content[0].text 
      }]);
    } catch (error: any) {
      console.error('Error sending message:', error);
      
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: `Error: ${error.message || 'Failed to communicate with Claude API'}`
      }]);
    } finally {
      setLoading(false);
    }
  };

  // Update the backend URL
  const handleBackendUrlChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setBackendUrl(event.target.value);
  };

  return (
    <div className="claude-chat">
      <h2>Claude Assistant</h2>
      
      {/* Backend Settings */}
      <div className="api-key-setup">
        <h3>Backend Connection</h3>
        <div className="input-group">
          <input
            type="text"
            className="api-input"
            value={backendUrl}
            onChange={handleBackendUrlChange}
            placeholder="http://localhost:3002"
          />
          <button 
            onClick={checkBackendConnection}
            className="save-button"
          >
            Check Connection
          </button>
        </div>
        
        <div style={{ marginTop: '10px' }}>
          Status: {
            backendStatus === 'connected' ? '✅ Connected' :
            backendStatus === 'disconnected' ? '❌ Not Connected' :
            '⏳ Unknown'
          }
        </div>
        
        {backendStatus === 'disconnected' && (
          <div style={{ marginTop: '10px', color: '#e74c3c' }}>
            <p>
              The backend server appears to be offline. Make sure you've started the backend
              server by running <code>node server.js</code> in the backend directory.
            </p>
          </div>
        )}
      </div>
      
      {/* Chat Interface */}
      <div className="message-container">
        {messages.length === 0 ? (
          <div className="welcome-message">
            <p>Hello! I'm Claude, your ADHD task management assistant.</p>
            <p>I can help you plan your day, manage tasks, and stay focused.</p>
            <p>What would you like to work on today?</p>
          </div>
        ) : (
          messages.map((message, index) => (
            <div key={index} className={`message ${message.role}`}>
              {message.content.split('\n').map((line, i) => (
                <p key={i}>{line}</p>
              ))}
            </div>
          ))
        )}
        {loading && (
          <div className="message assistant">
            <p>Thinking...</p>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Message Input */}
      <div className="message-input">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask Claude about your tasks..."
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              sendMessage();
            }
          }}
          disabled={backendStatus !== 'connected'}
        />
        <button 
          onClick={sendMessage} 
          disabled={loading || !input.trim() || backendStatus !== 'connected'}
        >
          Send
        </button>
      </div>
    </div>
  );
}