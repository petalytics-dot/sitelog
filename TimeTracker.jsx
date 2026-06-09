import React, { useState, useEffect } from 'react';
import { Download, Plus, Eye, EyeOff, Trash2, CheckCircle, Circle } from 'lucide-react';

const TimeTracker = () => {
  const [supervisorName, setSupervisorName] = useState('Supervisor');
  const [tasks, setTasks] = useState([]);
  const [employees, setEmployees] = useState(['Supervisor', 'Employee 1']);
  const [activeView, setActiveView] = useState('supervisor'); // supervisor or employee
  const [selectedEmployee, setSelectedEmployee] = useState('Employee 1');
  const [newTask, setNewTask] = useState({
    taskName: '',
    employee: 'Supervisor',
    timeMinutes: 10,
    date: new Date().toISOString().split('T')[0],
    scope: 'out-of-scope',
    verified: false,
    id: Date.now(),
  });

  // Load tasks from localStorage
  useEffect(() => {
    const savedTasks = localStorage.getItem('timeTasks');
    const savedEmployees = localStorage.getItem('timeEmployees');
    const savedSupervisor = localStorage.getItem('supervisorName');
    if (savedTasks) setTasks(JSON.parse(savedTasks));
    if (savedEmployees) setEmployees(JSON.parse(savedEmployees));
    if (savedSupervisor) setSupervisorName(JSON.parse(savedSupervisor));
  }, []);

  // Save tasks to localStorage
  useEffect(() => {
    localStorage.setItem('timeTasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('timeEmployees', JSON.stringify(employees));
  }, [employees]);

  useEffect(() => {
    localStorage.setItem('supervisorName', JSON.stringify(supervisorName));
  }, [supervisorName]);

  const addTask = () => {
    if (!newTask.taskName.trim()) return;
    setTasks([...tasks, { ...newTask, id: Date.now() }]);
    setNewTask({
      taskName: '',
      employee: supervisorName,
      timeMinutes: 10,
      date: new Date().toISOString().split('T')[0],
      scope: 'out-of-scope',
      verified: false,
      id: Date.now(),
    });
  };

  const addEmployee = () => {
    const newEmpName = `Employee ${employees.length + 1}`;
    setEmployees([...employees, newEmpName]);
  };

  const updateTask = (id, field, value) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, [field]: value } : t));
  };

  const deleteTask = (id) => {
    setTasks(tasks.filter(t => t.id !== id));
  };

  const toggleVerify = (id) => {
    updateTask(id, 'verified', !tasks.find(t => t.id === id).verified);
  };

  const generateReport = () => {
    // Sort tasks by date and employee
    const sortedTasks = [...tasks].sort((a, b) => new Date(a.date) - new Date(b.date));

    // Group by week (Monday start)
    const getWeekStart = (dateStr) => {
      const date = new Date(dateStr);
      const day = date.getDay();
      const diff = date.getDate() - day + (day === 0 ? -6 : 1);
      return new Date(date.setDate(diff)).toISOString().split('T')[0];
    };

    const currentWeekStart = getWeekStart(new Date().toISOString().split('T')[0]);

    // Filter for current week
    const weekTasks = sortedTasks.filter(t => getWeekStart(t.date) === currentWeekStart);

    if (weekTasks.length === 0) {
      alert('No tasks logged for this week yet.');
      return;
    }

    // Create CSV
    let csv = 'Date,Employee,Task,Time (minutes),Time (hours),Scope,Verified\n';
    weekTasks.forEach(task => {
      const hours = (task.timeMinutes / 60).toFixed(2);
      csv += `${task.date},"${task.employee}","${task.taskName}",${task.timeMinutes},${hours},"${task.scope}","${task.verified ? 'Yes' : 'No'}"\n`;
    });

    // Add summary
    csv += '\n\nSUMMARY BY SCOPE:\n';
    csv += 'Scope,Total Minutes,Total Hours\n';
    const inScope = weekTasks.filter(t => t.scope === 'in-scope').reduce((sum, t) => sum + t.timeMinutes, 0);
    const outScope = weekTasks.filter(t => t.scope === 'out-of-scope').reduce((sum, t) => sum + t.timeMinutes, 0);
    csv += `In-Scope,${inScope},${(inScope / 60).toFixed(2)}\n`;
    csv += `Out-of-Scope,${outScope},${(outScope / 60).toFixed(2)}\n`;

    csv += '\n\nSUMMARY BY EMPLOYEE:\n';
    csv += 'Employee,In-Scope (hours),Out-of-Scope (hours),Total (hours)\n';
    employees.forEach(emp => {
      const empTasks = weekTasks.filter(t => t.employee === emp);
      const empInScope = empTasks.filter(t => t.scope === 'in-scope').reduce((sum, t) => sum + t.timeMinutes, 0);
      const empOutScope = empTasks.filter(t => t.scope === 'out-of-scope').reduce((sum, t) => sum + t.timeMinutes, 0);
      const empTotal = empInScope + empOutScope;
      csv += `"${emp}",${(empInScope / 60).toFixed(2)},${(empOutScope / 60).toFixed(2)},${(empTotal / 60).toFixed(2)}\n`;
    });

    // Download
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `TimeTracking_${currentWeekStart}.csv`;
    a.click();
  };

  const supervisorView = () => (
    <div className="w-full max-w-4xl mx-auto p-4 space-y-6">
      {/* Supervisor Name Settings */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
        <label className="block text-sm font-medium text-slate-700 mb-2">Your Name (for logging)</label>
        <input
          type="text"
          value={supervisorName}
          onChange={(e) => {
            setSupervisorName(e.target.value);
            const updatedEmployees = [...employees];
            updatedEmployees[0] = e.target.value;
            setEmployees(updatedEmployees);
            // Update newTask employee if it's the supervisor
            if (newTask.employee === supervisorName) {
              setNewTask({ ...newTask, employee: e.target.value });
            }
          }}
          className="w-full sm:w-64 px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Quick Entry Form */}
      <div className="bg-white border-2 border-slate-200 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-slate-900 mb-4">Log Task</h2>
        <div className="space-y-4">
          <input
            type="text"
            placeholder="Task description (e.g., 'Rewired panel')"
            value={newTask.taskName}
            onChange={(e) => setNewTask({ ...newTask, taskName: e.target.value })}
            onKeyPress={(e) => e.key === 'Enter' && addTask()}
            className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <select
              value={newTask.employee}
              onChange={(e) => setNewTask({ ...newTask, employee: e.target.value })}
              className="px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {employees.map(emp => (
                <option key={emp} value={emp}>{emp}</option>
              ))}
            </select>
            <select
              value={newTask.timeMinutes}
              onChange={(e) => setNewTask({ ...newTask, timeMinutes: Number(e.target.value) })}
              className="px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {[10, 20, 30, 40, 50, 60, 90, 120].map(min => (
                <option key={min} value={min}>{min} min</option>
              ))}
            </select>
            <input
              type="date"
              value={newTask.date}
              onChange={(e) => setNewTask({ ...newTask, date: e.target.value })}
              className="px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select
              value={newTask.scope}
              onChange={(e) => setNewTask({ ...newTask, scope: e.target.value })}
              className="px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="in-scope">In-Scope</option>
              <option value="out-of-scope">Out-of-Scope</option>
            </select>
          </div>
          <button
            onClick={addTask}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md flex items-center justify-center gap-2 transition"
          >
            <Plus size={18} /> Add Task
          </button>
        </div>
      </div>

      {/* Add Employee */}
      <div className="text-center">
        <button
          onClick={addEmployee}
          className="text-sm text-blue-600 hover:text-blue-800 font-medium"
        >
          + Add Employee
        </button>
      </div>

      {/* Task List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-900">All Tasks</h2>
          <button
            onClick={generateReport}
            className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md flex items-center gap-2 transition text-sm"
          >
            <Download size={16} /> Download Weekly Report
          </button>
        </div>

        {tasks.length === 0 ? (
          <p className="text-center text-slate-500 py-8">No tasks logged yet</p>
        ) : (
          <div className="space-y-2">
            {tasks.map(task => (
              <div key={task.id} className="bg-white border border-slate-200 rounded-lg p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <p className="font-semibold text-slate-900">{task.taskName}</p>
                    <div className="text-xs text-slate-600 mt-1 space-y-1">
                      <p><strong>Employee:</strong> {task.employee}</p>
                      <p><strong>Time:</strong> {task.timeMinutes} min ({(task.timeMinutes / 60).toFixed(2)} hrs)</p>
                      <p><strong>Date:</strong> {task.date}</p>
                      <p>
                        <strong>Scope:</strong> 
                        <span className={`ml-1 font-medium ${task.scope === 'in-scope' ? 'text-green-600' : 'text-orange-600'}`}>
                          {task.scope === 'in-scope' ? 'In-Scope' : 'Out-of-Scope'}
                        </span>
                      </p>
                      <p>
                        <strong>Verified:</strong> 
                        <span className={`ml-1 ${task.verified ? 'text-green-600' : 'text-slate-500'}`}>
                          {task.verified ? '✓ Yes' : '○ No'}
                        </span>
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => toggleVerify(task.id)}
                      className="p-2 hover:bg-slate-100 rounded-md transition"
                      title={task.verified ? 'Mark unverified' : 'Mark verified'}
                    >
                      {task.verified ? (
                        <CheckCircle size={20} className="text-green-600" />
                      ) : (
                        <Circle size={20} className="text-slate-400" />
                      )}
                    </button>
                    <button
                      onClick={() => deleteTask(task.id)}
                      className="p-2 hover:bg-red-50 rounded-md transition"
                      title="Delete task"
                    >
                      <Trash2 size={20} className="text-red-600" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const employeeView = () => (
    <div className="w-full max-w-2xl mx-auto p-4 space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-900">
          <strong>Viewing as:</strong> {selectedEmployee}
        </p>
        <select
          value={selectedEmployee}
          onChange={(e) => setSelectedEmployee(e.target.value)}
          className="mt-2 w-full px-3 py-2 border border-blue-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {employees.map(emp => (
            <option key={emp} value={emp}>{emp}</option>
          ))}
        </select>
      </div>

      <div>
        <h2 className="text-xl font-semibold text-slate-900 mb-4">Assigned Tasks</h2>
        {tasks.filter(t => t.employee === selectedEmployee).length === 0 ? (
          <p className="text-center text-slate-500 py-8">No tasks assigned yet</p>
        ) : (
          <div className="space-y-3">
            {tasks
              .filter(t => t.employee === selectedEmployee)
              .map(task => (
                <div key={task.id} className="bg-white border-l-4 border-blue-500 rounded-lg p-4">
                  <p className="font-semibold text-slate-900">{task.taskName}</p>
                  <div className="text-sm text-slate-600 mt-2 space-y-1">
                    <p><strong>Time:</strong> {task.timeMinutes} min</p>
                    <p><strong>Date:</strong> {task.date}</p>
                    <p>
                      <strong>Scope:</strong> 
                      <span className={`ml-1 font-medium ${task.scope === 'in-scope' ? 'text-green-600' : 'text-orange-600'}`}>
                        {task.scope === 'in-scope' ? 'In-Scope' : 'Out-of-Scope'}
                      </span>
                    </p>
                    <p>
                      <strong>Verified:</strong>
                      <span className={`ml-1 ${task.verified ? 'text-green-600' : 'text-slate-500'}`}>
                        {task.verified ? '✓ Confirmed' : '○ Pending'}
                      </span>
                    </p>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-slate-900">ScopeLog</h1>
          <p className="text-sm text-slate-600 mt-1">Track in-scope & out-of-scope work for invoicing</p>
        </div>
      </div>

      {/* View Selector */}
      <div className="bg-white border-b border-slate-200 sticky top-16 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex gap-2">
          <button
            onClick={() => setActiveView('supervisor')}
            className={`px-4 py-2 rounded-md font-medium transition text-sm ${
              activeView === 'supervisor'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Supervisor Dashboard
          </button>
          <button
            onClick={() => setActiveView('employee')}
            className={`px-4 py-2 rounded-md font-medium transition text-sm ${
              activeView === 'employee'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Employee View
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto py-6">
        {activeView === 'supervisor' ? supervisorView() : employeeView()}
      </div>
    </div>
  );
};

export default TimeTracker;