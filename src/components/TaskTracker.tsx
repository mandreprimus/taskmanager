import { useState, useEffect } from 'react';
import { Task } from '../taskStore';

export default function TaskTracker() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filter, setFilter] = useState('active');
  const [taskName, setTaskName] = useState('');
  const [taskNotes, setTaskNotes] = useState('');
  const [taskStatus, setTaskStatus] = useState('Active');
  const [taskDueDate, setTaskDueDate] = useState('');
  
  // On component mount, load tasks from localStorage
  useEffect(() => {
    const storedTasks = localStorage.getItem('adhd-tasks');
    if (storedTasks) {
      setTasks(JSON.parse(storedTasks));
    } else {
      // Add some example tasks to start with
      const exampleTasks = [
        { 
          id: 1, 
          name: "Complete task manager project", 
          status: "Priority", 
          dueDate: new Date().toISOString(),
          notes: "First step is getting the basic version working",
          created: new Date().toISOString(),
          due: new Date().toISOString(),
          completedDate: null,
          subtasks: []
        },
        { 
          id: 2, 
          name: "Add more features later", 
          status: "Active", 
          notes: "Consider adding Google Calendar integration",
          created: new Date().toISOString(),
          due: null,
          completedDate: null,
          subtasks: []
        },
        { 
          id: 3, 
          name: "Set up GitHub repo", 
          status: "Complete", 
          completedDate: new Date().toISOString(),
          created: new Date().toISOString(),
          due: null,
          notes: "",
          subtasks: []
        }
      ];
      setTasks(exampleTasks);
      localStorage.setItem('adhd-tasks', JSON.stringify(exampleTasks));
    }
  }, []);
  
  // Save tasks to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('adhd-tasks', JSON.stringify(tasks));
  }, [tasks]);
  
  // Filter tasks based on selected filter
  const filteredTasks = tasks.filter(task => {
    if (filter === 'all') return true;
    if (filter === 'active') return task.status !== 'Complete';
    if (filter === 'urgent') return ['Urgent', 'Priority'].includes(task.status);
    if (filter === 'completed') return task.status === 'Complete';
    return true;
  });
  
  // Get next available task ID
  const getNextId = () => {
    return tasks.length > 0 ? Math.max(...tasks.map(t => t.id)) + 1 : 1;
  };
  
  // Add a new task
  const addTask = () => {
    if (!taskName.trim()) return;
    
    const newTask: Task = {
      id: getNextId(),
      name: taskName,
      status: taskStatus,
      due: taskDueDate ? new Date(taskDueDate).toISOString() : null,
      notes: taskNotes || "",
      created: new Date().toISOString(),
      completedDate: null,
      subtasks: []
    };
    
    setTasks([...tasks, newTask]);
    setTaskName('');
    setTaskNotes('');
    setTaskStatus('Active');
    setTaskDueDate('');
  };
  
  // Toggle task completion status
  const toggleTaskCompletion = (id: number) => {
    setTasks(tasks.map(task => {
      if (task.id === id) {
        const isComplete = task.status === 'Complete';
        return {
          ...task,
          status: isComplete ? 'Active' : 'Complete',
          completedDate: isComplete ? null : new Date().toISOString()
        };
      }
      return task;
    }));
  };
  
  // Delete a task
  const deleteTask = (id: number) => {
    setTasks(tasks.filter(task => task.id !== id));
  };
  
  // Format date for display
  const formatDate = (dateString?: string | null) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };
  
  // Calculate task counts
  const counts = {
    urgent: tasks.filter(t => t.status === 'Urgent').length,
    priority: tasks.filter(t => t.status === 'Priority').length,
    active: tasks.filter(t => !['Complete', 'Urgent', 'Priority'].includes(t.status)).length,
    completed: tasks.filter(t => t.status === 'Complete').length,
    total: tasks.length
  };
  
  return (
    <div className="task-tracker">
      <h2>Task Tracker</h2>
      
      <div className="task-stats">
        <div className="stat-item">Total: {counts.total}</div>
        <div className="stat-item">Urgent: {counts.urgent}</div>
        <div className="stat-item">Priority: {counts.priority}</div>
        <div className="stat-item">Active: {counts.active}</div>
        <div className="stat-item">Completed: {counts.completed}</div>
      </div>
      
      {/* Task filters */}
      <div className="task-filters">
        {['urgent', 'active', 'completed', 'all'].map(filterType => (
          <button
            key={filterType}
            className={`filter-button ${filter === filterType ? 'active' : ''}`}
            onClick={() => setFilter(filterType)}
          >
            {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
          </button>
        ))}
      </div>
      
      {/* Task form */}
      <div className="task-form">
        <h3>Add New Task</h3>
        <div className="input-group">
          <input
            type="text"
            className="task-input"
            placeholder="Task name..."
            value={taskName}
            onChange={(e) => setTaskName(e.target.value)}
          />
        </div>
        
        <div className="form-row">
          <select
            className="task-input"
            value={taskStatus}
            onChange={(e) => setTaskStatus(e.target.value)}
          >
            <option value="Active">Active</option>
            <option value="Priority">Priority</option>
            <option value="Urgent">Urgent</option>
          </select>
          
          <input
            type="date"
            className="task-input"
            value={taskDueDate}
            onChange={(e) => setTaskDueDate(e.target.value)}
          />
        </div>
        
        <textarea
          className="task-input"
          placeholder="Notes (optional)"
          value={taskNotes}
          onChange={(e) => setTaskNotes(e.target.value)}
          rows={2}
        />
        
        <button 
          className="add-button"
          onClick={addTask}
        >
          Add Task
        </button>
      </div>
      
      {/* Task list */}
      <div className="task-list">
        <h3>
          {filter.charAt(0).toUpperCase() + filter.slice(1)} Tasks 
          ({filteredTasks.length})
        </h3>
        
        {filteredTasks.length > 0 ? (
          filteredTasks.map(task => (
            <div 
              key={task.id} 
              className={`task-item ${task.status === 'Complete' ? 'task-completed' : ''} ${
                task.status === 'Urgent' ? 'task-urgent' : 
                task.status === 'Priority' ? 'task-priority' : ''
              }`}
            >
              <input
                type="checkbox"
                className="task-checkbox"
                checked={task.status === 'Complete'}
                onChange={() => toggleTaskCompletion(task.id)}
              />
              
              <div className="task-content">
                <div className="task-name">{task.name}</div>
                <div className="task-meta">
                  #{task.id} | Status: {task.status}
                  {task.due && ` | Due: ${formatDate(task.due)}`}
                  {task.completedDate && ` | Completed: ${formatDate(task.completedDate)}`}
                </div>
                {task.notes && <div className="task-notes">{task.notes}</div>}
              </div>
              
              <div className="task-actions">
                <button 
                  className="task-button"
                  onClick={() => deleteTask(task.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        ) : (
          <p className="empty-list">No {filter} tasks found.</p>
        )}
      </div>
    </div>
  );
}