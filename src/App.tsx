import { useState } from 'react'
import './App.css'
import TaskTracker from './components/TaskTracker'
import ClaudeChat from './components/ClaudeChat'

function App() {
  const [activeTab, setActiveTab] = useState('tasks');

  return (
    <div className="app-container">
      <header>
        <h1>ADHD Task Manager</h1>
        <div className="tabs">
          <button 
            className={activeTab === 'tasks' ? 'active' : ''} 
            onClick={() => setActiveTab('tasks')}
          >
            Tasks
          </button>
          <button 
            className={activeTab === 'claude' ? 'active' : ''} 
            onClick={() => setActiveTab('claude')}
          >
            Claude Assistant
          </button>
        </div>
      </header>
      <main>
        {activeTab === 'tasks' && <TaskTracker />}
        {activeTab === 'claude' && <ClaudeChat />}
      </main>
    </div>
  )
}

export default App