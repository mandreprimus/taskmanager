import { useState } from 'react';
import { useTaskStore, Task } from '../taskStore';

interface TaskListProps {
  tasks: Task[];
  showFilters?: boolean;
  sortBy?: keyof Task;
  sortDirection?: 'asc' | 'desc';
}

const TaskList = ({ 
  tasks, 
  showFilters = false, 
  sortBy = 'id', 
  sortDirection = 'asc' 
}: TaskListProps) => {
  const { updateTask } = useTaskStore();
  const [filter, setFilter] = useState('all');
  
  const filteredTasks = tasks.filter(task => {
    if (filter === 'all') return true;
    return task.status === filter;
  });
  
  // Sort tasks
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    let valueA = a[sortBy];
    let valueB = b[sortBy];
    
    // Handle date values
    if (sortBy === 'due' || sortBy === 'completedDate' || sortBy === 'created') {
      valueA = valueA ? new Date(valueA as string).getTime() : 0;
      valueB = valueB ? new Date(valueB as string).getTime() : 0;
    }
    
    if (sortDirection === 'asc') {
      return valueA > valueB ? 1 : -1;
    } else {
      return valueA < valueB ? 1 : -1;
    }
  });
  
  const handleStatusChange = (id: number, newStatus: string) => {
    const updates: Partial<Task> = { status: newStatus };
    
    // Add completedDate if task is being marked complete
    if (newStatus === 'Complete') {
      updates.completedDate = new Date().toISOString();
    }
    
    updateTask(id, updates);
  };
  
  return (
    <div>
      {showFilters && (
        <div className="filters" style={{ marginBottom: '15px' }}>
          <span>Filter: </span>
          <select 
            value={filter} 
            onChange={(e) => setFilter(e.target.value)}
            style={{ padding: '5px', marginLeft: '5px' }}
          >
            <option value="all">All</option>
            <option value="New">New</option>
            <option value="Active">Active</option>
            <option value="In Progress">In Progress</option>
            <option value="Priority">Priority</option>
            <option value="Urgent">Urgent</option>
          </select>
        </div>
      )}
      
      <div className="task-list">
        {sortedTasks.length === 0 ? (
          <p>No tasks found.</p>
        ) : (
          sortedTasks.map(task => (
            <div 
              key={task.id} 
              className={`task-item ${task.status === 'Complete' ? 'task-complete' : ''} ${
                task.status === 'Urgent' ? 'task-urgent' : 
                task.status === 'Priority' ? 'task-priority' : ''
              }`}
            >
              <div>
                <span className="task-id">#{task.id}</span>
                <strong className="task-name">{task.name}</strong>
                {task.due && (
                  <span className="task-due">
                    {' · Due: '}
                    {new Date(task.due).toLocaleDateString()}
                  </span>
                )}
                {task.notes && <p className="task-notes">{task.notes}</p>}
              </div>
              <div>
                <select 
                  value={task.status}
                  onChange={(e) => handleStatusChange(task.id, e.target.value)}
                  style={{ padding: '3px', fontSize: '14px' }}
                >
                  <option value="New">New</option>
                  <option value="Active">Active</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Priority">Priority</option>
                  <option value="Urgent">Urgent</option>
                  <option value="Complete">Complete</option>
                </select>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default TaskList;