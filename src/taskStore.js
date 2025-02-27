import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useTaskStore = create(
  persist(
    (set, get) => ({
      tasks: [],
      nextId: 1,
      
      addTask: (task) => {
        const { tasks, nextId } = get();
        
        if (!task.name) {
          console.error('Task requires a name');
          return false;
        }
        
        const newTask = {
          id: task.id || nextId,
          name: task.name,
          status: task.status || 'New',
          created: task.created || new Date().toISOString(),
          due: task.due || null,
          completedDate: task.completedDate || null,
          notes: task.notes || '',
          subtasks: task.subtasks || [],
        };
        
        const updatedNextId = Math.max(nextId, newTask.id + 1);
        
        set({
          tasks: [...tasks, newTask],
          nextId: updatedNextId,
        });
        
        return newTask.id;
      },
      
      updateTask: (id, updates) => {
        const { tasks } = get();
        
        set({
          tasks: tasks.map(task => 
            task.id === id ? { ...task, ...updates } : task
          ),
        });
      },
      
      removeTask: (id) => {
        const { tasks } = get();
        
        set({
          tasks: tasks.filter(task => task.id !== id),
        });
      },
      
      importTasks: (tasksToImport) => {
        const { tasks, nextId } = get();
        
        const validTasks = tasksToImport.filter(task => 
          task && typeof task === 'object' && task.id && task.name
        );
        
        const existingIds = new Set(tasks.map(t => t.id));
        const importedIds = new Set(validTasks.map(t => t.id));
        const conflictingIds = [...existingIds].filter(id => importedIds.has(id));
        
        let tasksToAdd = validTasks;
        if (conflictingIds.length > 0) {
          const nonConflictingExistingTasks = tasks.filter(t => !importedIds.has(t.id));
          set({ tasks: [...nonConflictingExistingTasks, ...validTasks] });
          return {
            added: validTasks.length,
            conflicts: conflictingIds.length,
            skipped: 0
          };
        } else {
          set({ tasks: [...tasks, ...tasksToAdd] });
        }
        
        const highestImportedId = Math.max(...validTasks.map(t => t.id), 0);
        const newNextId = Math.max(nextId, highestImportedId + 1);
        set({ nextId: newNextId });
        
        return {
          added: tasksToAdd.length,
          conflicts: conflictingIds.length,
          skipped: tasksToImport.length - validTasks.length
        };
      },
      
      getTasksByStatus: (status) => {
        const { tasks } = get();
        
        if (!status || status === 'all') {
          return tasks;
        }
        
        return tasks.filter(task => task.status === status);
      },
      
      getTaskCounts: () => {
        const { tasks } = get();
        
        const counts = {
          all: tasks.length,
          active: 0,
          completed: 0,
          urgent: 0,
          priority: 0
        };
        
        tasks.forEach(task => {
          if (task.status === 'Complete') {
            counts.completed++;
          } else {
            counts.active++;
            
            if (task.status === 'Urgent') {
              counts.urgent++;
            } else if (task.status === 'Priority') {
              counts.priority++;
            }
          }
        });
        
        return counts;
      },
      
      clearAllTasks: () => set({ tasks: [], nextId: 1 }),
      
      getHighestTaskId: () => {
        const { tasks } = get();
        if (tasks.length === 0) return 0;
        return Math.max(...tasks.map(t => t.id));
      }
    }),
    {
      name: 'task-management-store',
      version: 1,
    }
  )
);