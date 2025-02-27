import React, { useState } from 'react';
import { useTaskStore } from './taskStore';
import TaskImporter from './TaskImporter';
import TaskList from './TaskList';
import TaskForm from './TaskForm';

const TaskManagerApp = () => {
  const [activeTab, setActiveTab] = useState('tasks');
  const [importMode, setImportMode] = useState(false);
  
  const { 
    tasks, 
    importTasks, 
    getTaskCounts 
  } = useTaskStore();
  
  const taskCounts = getTaskCounts();
  
  const handleTasksImported = (importedTasks) => {
    const result = importTasks(importedTasks);
    console.log('Import result:', result);
    
    // After importing, switch back to tasks view
    setImportMode(false);
    setActiveTab('tasks');
  };
  
  return (
    <div className="container">
      <h1>Task Manager</h1>
      
      <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <span style={{ marginRight: '15px' }}>Total Tasks: {taskCounts.all}</span>
          <span style={{ marginRight: '15px' }}>Active: {taskCounts.active}</span>
          <span>Completed: {taskCounts.completed}</span>
        </div>
        
        <button onClick={() => setImportMode(!importMode)}>
          {importMode ? 'Cancel Import' : 'Import Tasks'}
        </button>
      </div>
      
      {importMode ? (
        <TaskImporter onTasksImported={handleTasksImported} />
      ) : (
        <div>
          <div className="tabs">
            <div 
              className={`tab ${activeTab === 'tasks' ? 'active' : ''}`}
              onClick={() => setActiveTab('tasks')}
            >
              Tasks
            </div>
            <div 
              className={`tab ${activeTab === 'upcoming' ? 'active' : ''}`}
              onClick={() => setActiveTab('upcoming')}
            >
              Upcoming
            </div>
            <div 
              className={`tab ${activeTab === 'completed' ? 'active' : ''}`}
              onClick={() => setActiveTab('completed')}
            >
              Completed
            </div>
            <div 
              className={`tab ${activeTab === 'add' ? 'active' : ''}`}
              onClick={() => setActiveTab('add')}
            >
              Add Task
            </div>
          </div>
          
          {activeTab === 'tasks' && (
            <div className="card">
              <div className="card-header">
                <h2>All Tasks</h2>
              </div>
              <div className="card-content">
                <TaskList 
                  tasks={tasks.filter(task => task.status !== 'Complete')}
                  showFilters={true}
                />
              </div>
            </div>
          )}
          
          {activeTab === 'upcoming' && (
            <div className="card">
              <div className="card-header">
                <h2>Upcoming Tasks</h2>
              </div>
              <div className="card-content">
                <TaskList 
                  tasks={tasks.filter(task => 
                    task.status !== 'Complete' && task.due
                  )}
                  sortBy="due"
                />
              </div>
            </div>
          )}
          
          {activeTab === 'completed' && (
            <div className="card">
              <div className="card-header">
                <h2>Completed Tasks</h2>
              </div>
              <div className="card-content">
                <TaskList 
                  tasks={tasks.filter(task => task.status === 'Complete')}
                  sortBy="completedDate"
                  sortDirection="desc"
                />
              </div>
            </div>
          )}
          
          {activeTab === 'add' && (
            <div className="card">
              <div className="card-header">
                <h2>Add New Task</h2>
              </div>
              <div className="card-content">
                <TaskForm onTaskAdded={() => setActiveTab('tasks')} />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TaskManagerApp;