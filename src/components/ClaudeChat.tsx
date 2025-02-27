import { useState, useEffect, useRef } from 'react';

interface Task {
  id: number;
  name: string;
  status: string;
  dueDate?: string;
  notes?: string;
  completedDate?: string;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function ClaudeChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [hasApiKey, setHasApiKey] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Check if API key exists in localStorage
  useEffect(() => {
    const storedKey = localStorage.getItem('claude-api-key');
    if (storedKey) {
      setApiKey(storedKey);
      setHasApiKey(true);
    }
  }, []);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Save API key
  const saveApiKey = () => {
    localStorage.setItem('claude-api-key', apiKey);
    setHasApiKey(true);
  };

  // Fetch task data to include in context
  const getTaskContext = () => {
    const storedTasks = localStorage.getItem('adhd-tasks');
    if (!storedTasks) return '';
    
    const tasks: Task[] = JSON.parse(storedTasks);
    
    // Find highest task ID and count by status
    const highestId = Math.max(...tasks.map(t => t.id));
    const statusCounts = tasks.reduce((counts: Record<string, number>, task: Task) => {
      counts[task.status] = (counts[task.status] || 0) + 1;
      return counts;
    }, {});
    
    let context = `## Current Task Status (${new Date().toLocaleDateString()})\n\n`;
    context += `Total Tasks: ${tasks.length} | Highest ID: ${highestId}\n`;
    context += `Status Counts: `;
    
    Object.entries(statusCounts).forEach(([status, count]) => {
      context += `${status}: ${count} | `;
    });
    
    context += `\n\n### Task List:\n\n`;
    
    // Add each task
    tasks.forEach((task: Task) => {
      context += `- #${task.id}: ${task.name} (${task.status})`;
      
      if (task.dueDate) {
        context += ` | Due: ${new Date(task.dueDate).toLocaleDateString()}`;
      }
      
      if (task.completedDate) {
        context += ` | Completed: ${new Date(task.completedDate).toLocaleDateString()}`;
      }
      
      if (task.notes) {
        context += `\n  Notes: ${task.notes}`;
      }
      
      context += '\n';
    });
    
    return context;
  };

  // Add a system message about ADHD support
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

  // Send message to Claude API
  const sendMessage = async () => {
    if (!input.trim() || !apiKey) return;
    
    const userMessage = input;
    setInput('');
    setLoading(true);
    
    // Add user message to chat
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    
    try {
      // Get task data to include as context
      const taskContext = getTaskContext();
      const systemPrompt = getSystemPrompt();
      
      // Call Claude API
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-3-opus-20240229',
          max_tokens: 4000,
          system: systemPrompt,
          messages: [
            { role: 'user', content: taskContext },
            ...messages.filter(m => m.role === 'user').map(m => ({ role: m.role, content: m.content })),
            { role: 'user', content: userMessage }
          ]
        })
      });
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error.message || 'Error calling Claude API');
      }
      
      // Add Claude's response to chat
      setMessages(prev => [...prev, { role: 'assistant', content: data.content[0].text }]);
    } catch (error: any) {
      console.error('Error calling Claude API:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: `Error: ${error.message || 'Failed to communicate with Claude API'}`
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="claude-chat">
      <h2>Claude Assistant</h2>
      
      {!hasApiKey ? (
        <div className="api-key-setup">
          <p>Enter your Claude API key to continue:</p>
          <div className="input-group">
            <input
              type="password"
              className="api-input"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-ant-api03-..."
            />
            <button 
              onClick={saveApiKey}
              className="save-button"
            >
              Save Key
            </button>
          </div>
          <p className="api-note">
            Your API key is stored locally in your browser and never sent to our servers.
          </p>
        </div>
      ) : (
        <>
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
            />
            <button onClick={sendMessage} disabled={loading || !input.trim()}>
              Send
            </button>
          </div>
        </>
      )}
    </div>
  );
}