import React, { useState } from 'react';
import { useTaskStore } from './taskStore';

const TaskForm = ({ onTaskAdded, editTask }) => {
  const { addTask, updateTask } = useTaskStore();
  
  const [formData, setFormData] = useState({
    name: editTask ? editTask.name : '',
    status: editTask ? editTask.status : 'New',
    due: editTask && editTask.due ? editTask.due.substring(0, 10) : '',
    notes: editTask ? editTask.notes : '',
  });
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      alert('Task name is required');
      return;
    }
    
    if (editTask) {
      updateTask(editTask.id, {
        name: formData.name,
        status: formData.status,
        due: formData.due ? new Date(formData.due).toISOString() : null,
        notes: formData.notes,
      });
    } else {
      addTask({
        name: formData.name,
        status: formData.status,
        due: formData.due ? new Date(formData.due).toISOString() : null,
        notes: formData.notes,
      });
    }
    
    if (onTaskAdded) {
      onTaskAdded();
    }
    
    // Reset form if not editing
    if (!editTask) {
      setFormData({
        name: '',
        status: 'New',
        due: '',
        notes: '',
      });
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label htmlFor="name">Task Name:</label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
        />
      </div>
      
      <div>
        <label htmlFor="status">Status:</label>
        <select
          id="status"
          name="status"
          value={formData.status}
          onChange={handleChange}
        >
          <option value="New">New</option>
          <option value="Active">Active</option>
          <option value="In Progress">In Progress</option>
          <option value="Priority">Priority</option>
          <option value="Urgent">Urgent</option>
          <option value="Complete">Complete</option>
        </select>
      </div>
      
      <div>
        <label htmlFor="due">Due Date:</label>
        <input
          type="date"
          id="due"
          name="due"
          value={formData.due}
          onChange={handleChange}
        />
      </div>
      
      <div>
        <label htmlFor="notes">Notes:</label>
        <textarea
          id="notes"
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          rows="3"
        ></textarea>
      </div>
      
      <button type="submit">
        {editTask ? 'Update Task' : 'Add Task'}
      </button>
    </form>
  );
};

export default TaskForm;