import React, { useState, useEffect } from 'react';
import { Download, Plus, Trash2, CheckCircle, Circle, Settings, LogOut } from 'lucide-react';

const SiteLog = () => {
  const [firebaseConfigured, setFirebaseConfigured] = useState(false);
  const [firebaseConfig, setFirebaseConfig] = useState(null);
  const [database, setDatabase] = useState(null);
  
  const [appState, setAppState] = useState('setup'); // setup, modeSelect, supervisor, employee
  const [supervisorName, setSupervisorName] = useState('');
  const [employees, setEmployees] = useState([]);
  const [newEmployeeName, setNewEmployeeName] = useState('');
  const [selectedEmployeeView, setSelectedEmployeeView] = useState('');
  const [supervisorPassword, setSupervisorPassword] = useState('');
  const [enteredPassword, setEnteredPassword] = useState('');
  
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState({
    taskName: '',
    employee: '',
    timeMinutes: 10,
    date: new Date().toISOString().split('T')[0],
    scope: 'out-of-scope',
    verified: false,
  });

  // Initialize Firebase
  useEffect(() => {
    const initFirebase = async () => {
      try {
        const firebase = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js');
        const db = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-database.js');
        
        // Check if config is stored in localStorage
        const storedConfig = localStorage.getItem('firebaseConfig');
        if (storedConfig) {
          const config = JSON.parse(storedConfig);
          const app = firebase.initializeApp(config);
          const dbRef = db.getDatabase(app);
          setDatabase(dbRef);
          setFirebaseConfig(config);
          setFirebaseConfigured(true);
          
          // Load existing data
          loadDataFromFirebase(dbRef);
          setAppState('modeSelect');
        }
      } catch (error) {
        console.log('Firebase setup ready. Add config when prompted.');
      }
    };
    initFirebase();
  }, []);

  const loadDataFromFirebase = async (dbRef) => {
    try {
      const db = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-database.js');
      
      // Load supervisor name
      const supervisorRef = db.ref(dbRef, 'config/supervisorName');
      db.onValue(supervisorRef, (snapshot) => {
        if (snapshot.exists()) {
          setSupervisorName(snapshot.val());
        }
      });

      // Load employees
      const employeesRef = db.ref(dbRef, 'config/employees');
      db.onValue(employeesRef, (snapshot) => {
        if (snapshot.exists()) {
          setEmployees(snapshot.val());
        }
      });

      // Load tasks with real-time updates
      const tasksRef = db.ref(dbRef, 'tasks');
      db.onValue(tasksRef, (snapshot) => {
        if (snapshot.exists()) {
          const tasksArray = [];
          snapshot.forEach((childSnapshot) => {
            tasksArray.push({
              id: childSnapshot.key,
              ...childSnapshot.val()
            });
          });
          setTasks(tasksArray);
        }
      });
    } catch (error) {
      console.error('Error loading from Firebase:', error);
    }
  };

  const saveToFirebase = async (path, value) => {
    if (!database) return;
    try {
      const db = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-database.js');
      const ref = db.ref(database, path);
      await db.set(ref, value);
    } catch (error) {
      console.error('Error saving to Firebase:', error);
    }
  };

  const configureFirebase = (config) => {
    localStorage.setItem('firebaseConfig', JSON.stringify(config));
    setFirebaseConfig(config);
    setFirebaseConfigured(true);
    
    const firebase = require('https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js');
    const app = firebase.initializeApp(config);
    const db = require('https://www.gstatic.com/firebasejs/10.7.0/firebase-database.js');
    const dbRef = db.getDatabase(app);
    setDatabase(dbRef);
    loadDataFromFirebase(dbRef);
  };

  const completeSetup = async () => {
    if (!supervisorName.trim() || employees.length === 0) {
      alert('Please set supervisor name and at least one employee');
      return;
    }
    
    await saveToFirebase('config/supervisorName', supervisorName);
    await saveToFirebase('config/employees', employees);
    await saveToFirebase('config/password', supervisorPassword);
    setAppState('modeSelect');
  };

  const addEmployee = () => {
    if (!newEmployeeName.trim()) return;
    const updatedEmployees = [...employees, newEmployeeName];
    setEmployees(updatedEmployees);
    setNewEmployeeName('');
  };

  const removeEmployee = (index) => {
    const updatedEmployees = employees.filter((_, i) => i !== index);
    setEmployees(updatedEmployees);
  };

  const supervisorLogin = () => {
    if (enteredPassword !== supervisorPassword) {
      alert('Incorrect password');
      return;
    }
    setAppState('supervisor');
  };

  const employeeLogin = () => {
    if (!selectedEmployeeView) {
      alert('Please select your name');
      return;
    }
    setAppState('employee');
  };

  const addTask = async () => {
    if (!newTask.taskName.trim()) return;
    
    const taskId = Date.now().toString();
    const taskData = {
      ...newTask,
      id: taskId,
      createdAt: new Date().toISOString()
    };

    await saveToFirebase(`tasks/${taskId}`, taskData);
    
    setNewTask({
      taskName: '',
      employee: employees[0] || '',
      timeMinutes: 10,
      date: new Date().toISOString().split('T')[0],
      scope: 'out-of-scope',
      verified: false,
    });
  };

  const updateTask = async (taskId, field, value) => {
    await saveToFirebase(`tasks/${taskId}/${field}`, value);
  };

  const deleteTask = async (taskId) => {
    const db = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-database.js');
    const ref = db.ref(database, `tasks/${taskId}`);
    await db.remove(ref);
  };

  const toggleVerify = async (taskId) => {
    const task = tasks.find(t => t.id === taskId);
    await updateTask(taskId, 'verified', !task.verified);
  };

  const generateReport = () => {
    const getWeekStart = (dateStr) => {
      const date = new Date(dateStr);
      const day = date.getDay();
      const diff = date.getDate() - day + (day === 0 ? -6 : 1);
      return new Date(date.setDate(diff)).toISOString().split('T')[0];
    };

    const currentWeekStart = getWeekStart(new Date().toISOString().split('T')[0]);
    const weekTasks = tasks.filter(t => getWeekStart(t.date) === currentWeekStart);

    if (weekTasks.length === 0) {
      alert('No tasks logged for this week yet.');
      return;
    }

    let csv = 'Date,Employee,Task,Time (minutes),Time (hours),Scope,Verified\n';
    weekTasks.forEach(task => {
      const hours = (task.timeMinutes / 60).toFixed(2);
      csv += `${task.date},"${task.employee}","${task.taskName}",${task.timeMinutes},${hours},"${task.scope}","${task.verified ? 'Yes' : 'No'}"\n`;
    });

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

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SiteLog_Report_${currentWeekStart}.csv`;
    a.click();
  };

  // SETUP VIEW
  if (appState === 'setup') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
          <h1 className="text-3xl font-bold text-blue-900 mb-2">SiteLog</h1>
          <p className="text-blue-700 mb-6">Real-time team time tracking</p>

          {!firebaseConfigured ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Firebase Config (JSON)</label>
                <textarea
                  placeholder='{"apiKey": "...", "projectId": "...", ...}'
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-xs h-24 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onBlur={(e) => {
                    try {
                      const config = JSON.parse(e.target.value);
                      configureFirebase(config);
                    } catch (err) {
                      alert('Invalid JSON');
                    }
                  }}
                />
              </div>
              <p className="text-xs text-gray-600">
                Get this from Firebase Console → Project Settings → Web app config
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Your Name (Supervisor)</label>
                <input
                  type="text"
                  value={supervisorName}
                  onChange={(e) => setSupervisorName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., John"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Supervisor Password</label>
                <input
                  type="password"
                  value={supervisorPassword}
                  onChange={(e) => setSupervisorPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Set a password"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Team Members</label>
                <div className="space-y-2">
                  {employees.map((emp, idx) => (
                    <div key={idx} className="flex justify-between items-center bg-blue-50 p-2 rounded">
                      <span className="text-sm">{emp}</span>
                      <button
                        onClick={() => removeEmployee(idx)}
                        className="text-red-600 hover:text-red-800 text-sm font-medium"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2 mt-3">
                  <input
                    type="text"
                    value={newEmployeeName}
                    onChange={(e) => setNewEmployeeName(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addEmployee()}
                    placeholder="Employee name"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={addEmployee}
                    className="px-3 py-2 bg-blue-600 text-white rounded-md font-medium text-sm hover:bg-blue-700"
                  >
                    Add
                  </button>
                </div>
              </div>

              <button
                onClick={completeSetup}
                className="w-full bg-blue-600 text-white py-2 rounded-md font-medium hover:bg-blue-700 transition"
              >
                Start SiteLog
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // MODE SELECT VIEW
  if (appState === 'modeSelect') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
          <h1 className="text-3xl font-bold text-blue-900 mb-6 text-center">SiteLog</h1>

          <div className="space-y-4">
            <div className="border-2 border-blue-300 rounded-lg p-4">
              <h2 className="font-semibold text-blue-900 mb-3">Supervisor Login</h2>
              <input
                type="password"
                value={enteredPassword}
                onChange={(e) => setEnteredPassword(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && supervisorLogin()}
                placeholder="Enter password"
                className="w-full px-3 py-2 border border-gray-300 rounded-md mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={supervisorLogin}
                className="w-full bg-blue-600 text-white py-2 rounded-md font-medium hover:bg-blue-700"
              >
                Login as Supervisor
              </button>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">or</span>
              </div>
            </div>

            <div className="border-2 border-green-300 rounded-lg p-4">
              <h2 className="font-semibold text-green-900 mb-3">Employee Login</h2>
              <select
                value={selectedEmployeeView}
                onChange={(e) => setSelectedEmployeeView(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md mb-3 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">Select your name</option>
                {employees.map((emp) => (
                  <option key={emp} value={emp}>{emp}</option>
                ))}
              </select>
              <button
                onClick={employeeLogin}
                className="w-full bg-green-600 text-white py-2 rounded-md font-medium hover:bg-green-700"
              >
                Login as Employee
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // SUPERVISOR VIEW
  if (appState === 'supervisor') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
          <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">SiteLog</h1>
              <p className="text-xs text-slate-600">Supervisor: {supervisorName}</p>
            </div>
            <button
              onClick={() => {
                setAppState('modeSelect');
                setEnteredPassword('');
              }}
              className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 font-medium text-sm"
            >
              <LogOut size={16} /> Logout
            </button>
          </div>
        </div>

        <div className="max-w-6xl mx-auto py-6 px-4 space-y-6">
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

          {/* Tasks & Report */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-slate-900">All Tasks</h2>
              <button
                onClick={generateReport}
                className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md flex items-center gap-2 transition text-sm"
              >
                <Download size={16} /> Weekly Report
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
      </div>
    );
  }

  // EMPLOYEE VIEW
  if (appState === 'employee') {
    const [employeeNewTask, setEmployeeNewTask] = useState({
      taskName: '',
      timeMinutes: 10,
      date: new Date().toISOString().split('T')[0],
      scope: 'out-of-scope',
    });

    const handleEmployeeAddTask = async () => {
      if (!employeeNewTask.taskName.trim()) return;

      const taskId = Date.now().toString();
      const taskData = {
        taskName: employeeNewTask.taskName,
        employee: selectedEmployeeView,
        timeMinutes: employeeNewTask.timeMinutes,
        date: employeeNewTask.date,
        scope: employeeNewTask.scope,
        verified: false,
        createdAt: new Date().toISOString(),
        loggedByEmployee: true
      };

      await saveToFirebase(`tasks/${taskId}`, taskData);

      setEmployeeNewTask({
        taskName: '',
        timeMinutes: 10,
        date: new Date().toISOString().split('T')[0],
        scope: 'out-of-scope',
      });
    };

    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100">
        <div className="bg-white border-b border-green-200 sticky top-0 z-10">
          <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-green-900">SiteLog</h1>
              <p className="text-xs text-green-700">{selectedEmployeeView}</p>
            </div>
            <button
              onClick={() => {
                setAppState('modeSelect');
                setSelectedEmployeeView('');
              }}
              className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 font-medium text-sm"
            >
              <LogOut size={16} /> Logout
            </button>
          </div>
        </div>

        <div className="max-w-4xl mx-auto py-6 px-4 space-y-6">
          {/* Employee Task Entry */}
          <div className="bg-white border-2 border-green-300 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-green-900 mb-4">Log Your Time</h2>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="What did you work on?"
                value={employeeNewTask.taskName}
                onChange={(e) => setEmployeeNewTask({ ...employeeNewTask, taskName: e.target.value })}
                onKeyPress={(e) => e.key === 'Enter' && handleEmployeeAddTask()}
                className="w-full px-3 py-2 border border-green-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <div className="grid grid-cols-3 gap-3">
                <select
                  value={employeeNewTask.timeMinutes}
                  onChange={(e) => setEmployeeNewTask({ ...employeeNewTask, timeMinutes: Number(e.target.value) })}
                  className="px-3 py-2 border border-green-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  {[10, 20, 30, 40, 50, 60, 90, 120].map(min => (
                    <option key={min} value={min}>{min} min</option>
                  ))}
                </select>
                <input
                  type="date"
                  value={employeeNewTask.date}
                  onChange={(e) => setEmployeeNewTask({ ...employeeNewTask, date: e.target.value })}
                  className="px-3 py-2 border border-green-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <select
                  value={employeeNewTask.scope}
                  onChange={(e) => setEmployeeNewTask({ ...employeeNewTask, scope: e.target.value })}
                  className="px-3 py-2 border border-green-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="in-scope">In-Scope</option>
                  <option value="out-of-scope">Out-of-Scope</option>
                </select>
              </div>
              <button
                onClick={handleEmployeeAddTask}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md flex items-center justify-center gap-2 transition"
              >
                <Plus size={18} /> Log Time
              </button>
            </div>
          </div>

          {/* Assigned Tasks */}
          <div>
            <h2 className="text-xl font-semibold text-green-900 mb-4">Your Tasks</h2>
            {tasks.filter(t => t.employee === selectedEmployeeView).length === 0 ? (
              <p className="text-center text-green-700 py-8">No tasks assigned yet</p>
            ) : (
              <div className="space-y-3">
                {tasks
                  .filter(t => t.employee === selectedEmployeeView)
                  .map(task => (
                    <div key={task.id} className="bg-white border-l-4 border-green-500 rounded-lg p-4">
                      <p className="font-semibold text-slate-900">{task.taskName}</p>
                      <div className="text-sm text-slate-600 mt-2 space-y-1">
                        <p><strong>Time:</strong> {task.timeMinutes} min ({(task.timeMinutes / 60).toFixed(2)} hrs)</p>
                        <p><strong>Date:</strong> {task.date}</p>
                        <p>
                          <strong>Scope:</strong> 
                          <span className={`ml-1 font-medium ${task.scope === 'in-scope' ? 'text-green-600' : 'text-orange-600'}`}>
                            {task.scope === 'in-scope' ? 'In-Scope' : 'Out-of-Scope'}
                          </span>
                        </p>
                        {task.loggedByEmployee && (
                          <p className="text-xs text-blue-600 mt-2">✓ You logged this</p>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
};

export default SiteLog;