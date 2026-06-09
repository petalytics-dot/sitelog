import React, { useState, useEffect } from 'react';
import { Download, Plus, Trash2, CheckCircle, Circle, LogOut } from 'lucide-react';

const SiteLog = () => {
  const [firebaseConfigured, setFirebaseConfigured] = useState(false);
  const [database, setDatabase] = useState(null);
  
  const [appState, setAppState] = useState('setup');
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

  // Employee task state
  const [employeeNewTask, setEmployeeNewTask] = useState({
    taskName: '',
    timeMinutes: 10,
    date: new Date().toISOString().split('T')[0],
    scope: 'out-of-scope',
  });

  // Initialize Firebase
  useEffect(() => {
    const storedConfig = localStorage.getItem('firebaseConfig');
    if (storedConfig) {
      setFirebaseConfigured(true);
      loadDataFromFirebase(JSON.parse(storedConfig));
      setAppState('modeSelect');
    }
  }, []);

  // Update default employee when employees list changes
  useEffect(() => {
    if (employees.length > 0 && !newTask.employee) {
      setNewTask(prev => ({ ...prev, employee: employees[0] }));
    }
  }, [employees]);

  const loadDataFromFirebase = async (config) => {
    try {
      const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js');
      const { getDatabase, ref, onValue } = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-database.js');
      
      const app = initializeApp(config);
      const dbRef = getDatabase(app);
      setDatabase(dbRef);

      onValue(ref(dbRef, 'config/supervisorName'), (snapshot) => {
        if (snapshot.exists()) {
          const name = snapshot.val();
          setSupervisorName(name);
        }
      });

      onValue(ref(dbRef, 'config/employees'), (snapshot) => {
        if (snapshot.exists()) {
          const emps = snapshot.val();
          setEmployees(emps);
        }
      });

      onValue(ref(dbRef, 'tasks'), (snapshot) => {
        if (snapshot.exists()) {
          const tasksArray = [];
          snapshot.forEach((child) => {
            tasksArray.push({ id: child.key, ...child.val() });
          });
          setTasks(tasksArray);
        } else {
          setTasks([]);
        }
      });
    } catch (error) {
      console.error('Error loading from Firebase:', error);
    }
  };

  const saveToFirebase = async (path, value) => {
    if (!database) return;
    try {
      const { ref, set } = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-database.js');
      await set(ref(database, path), value);
    } catch (error) {
      console.error('Error saving to Firebase:', error);
    }
  };

  const configureFirebase = (config) => {
    localStorage.setItem('firebaseConfig', JSON.stringify(config));
    setFirebaseConfigured(true);
    loadDataFromFirebase(config);
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
    const updated = [...employees, newEmployeeName];
    setEmployees(updated);
    setNewEmployeeName('');
  };

  const removeEmployee = (idx) => {
    setEmployees(employees.filter((_, i) => i !== idx));
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
    if (!newTask.employee) {
      alert('Please select an employee');
      return;
    }
    const taskId = Date.now().toString();
    await saveToFirebase(`tasks/${taskId}`, {
      ...newTask,
      id: taskId,
      createdAt: new Date().toISOString()
    });
    setNewTask({
      taskName: '',
      employee: employees[0] || '',
      timeMinutes: 10,
      date: new Date().toISOString().split('T')[0],
      scope: 'out-of-scope',
      verified: false,
    });
  };

  const handleEmployeeAddTask = async () => {
    if (!employeeNewTask.taskName.trim()) return;
    const taskId = Date.now().toString();
    await saveToFirebase(`tasks/${taskId}`, {
      taskName: employeeNewTask.taskName,
      employee: selectedEmployeeView,
      timeMinutes: employeeNewTask.timeMinutes,
      date: employeeNewTask.date,
      scope: employeeNewTask.scope,
      verified: false,
      createdAt: new Date().toISOString(),
      loggedByEmployee: true
    });
    setEmployeeNewTask({
      taskName: '',
      timeMinutes: 10,
      date: new Date().toISOString().split('T')[0],
      scope: 'out-of-scope',
    });
  };

  const updateTask = async (taskId, field, value) => {
    const { ref, update } = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-database.js');
    await update(ref(database, `tasks/${taskId}`), { [field]: value });
  };

  const deleteTask = async (taskId) => {
    const { ref, remove } = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-database.js');
    await remove(ref(database, `tasks/${taskId}`));
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
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 10px 40px rgba(0,0,0,0.15)', padding: '40px', maxWidth: '500px', width: '100%' }}>
          <h1 style={{ fontSize: '32px', fontWeight: 'bold', color: '#1a202c', margin: '0 0 8px 0' }}>SiteLog</h1>
          <p style={{ fontSize: '14px', color: '#718096', marginBottom: '30px', margin: '0 0 30px 0' }}>Real-time team time tracking</p>

          {!firebaseConfigured ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#2d3748', marginBottom: '8px' }}>Firebase Config (JSON)</label>
                <textarea
                  placeholder='{"apiKey": "...", "projectId": "...", ...}'
                  style={{ width: '100%', padding: '12px', border: '1px solid #cbd5e0', borderRadius: '8px', fontSize: '12px', fontFamily: 'monospace', height: '100px', boxSizing: 'border-box' }}
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
              <p style={{ fontSize: '12px', color: '#718096', margin: '0' }}>Get this from Firebase Console → Project Settings → Web app config</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#2d3748', marginBottom: '8px' }}>Your Name (Supervisor)</label>
                <input
                  type="text"
                  value={supervisorName}
                  onChange={(e) => setSupervisorName(e.target.value)}
                  style={{ width: '100%', padding: '12px', border: '1px solid #cbd5e0', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }}
                  placeholder="e.g., John"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#2d3748', marginBottom: '8px' }}>Supervisor Password</label>
                <input
                  type="password"
                  value={supervisorPassword}
                  onChange={(e) => setSupervisorPassword(e.target.value)}
                  style={{ width: '100%', padding: '12px', border: '1px solid #cbd5e0', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }}
                  placeholder="Set a password"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#2d3748', marginBottom: '12px' }}>Team Members</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
                  {employees.map((emp, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f7fafc', padding: '10px 12px', borderRadius: '6px' }}>
                      <span style={{ fontSize: '14px', color: '#2d3748' }}>{emp}</span>
                      <button
                        onClick={() => removeEmployee(idx)}
                        style={{ fontSize: '12px', color: '#e53e3e', fontWeight: '600', background: 'none', border: 'none', cursor: 'pointer' }}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    value={newEmployeeName}
                    onChange={(e) => setNewEmployeeName(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addEmployee()}
                    placeholder="Employee name"
                    style={{ flex: 1, padding: '10px 12px', border: '1px solid #cbd5e0', borderRadius: '6px', fontSize: '13px', boxSizing: 'border-box' }}
                  />
                  <button
                    onClick={addEmployee}
                    style={{ padding: '10px 16px', background: '#667eea', color: 'white', border: 'none', borderRadius: '6px', fontWeight: '600', fontSize: '13px', cursor: 'pointer' }}
                  >
                    Add
                  </button>
                </div>
              </div>

              <button
                onClick={completeSetup}
                style={{ width: '100%', padding: '12px 16px', background: '#667eea', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '600', fontSize: '14px', cursor: 'pointer' }}
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
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 10px 40px rgba(0,0,0,0.15)', padding: '40px', maxWidth: '400px', width: '100%' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#1a202c', textAlign: 'center', marginBottom: '30px', margin: '0 0 30px 0' }}>SiteLog</h1>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ border: '2px solid #667eea', borderRadius: '10px', padding: '24px' }}>
              <h2 style={{ fontWeight: '600', color: '#2d3748', marginBottom: '12px', margin: '0 0 12px 0', fontSize: '16px' }}>Supervisor Login</h2>
              <input
                type="password"
                value={enteredPassword}
                onChange={(e) => setEnteredPassword(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && supervisorLogin()}
                placeholder="Enter password"
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e0', borderRadius: '6px', marginBottom: '12px', fontSize: '13px', boxSizing: 'border-box' }}
              />
              <button
                onClick={supervisorLogin}
                style={{ width: '100%', padding: '10px 16px', background: '#667eea', color: 'white', border: 'none', borderRadius: '6px', fontWeight: '600', fontSize: '13px', cursor: 'pointer' }}
              >
                Login as Supervisor
              </button>
            </div>

            <div style={{ textAlign: 'center', position: 'relative', margin: '16px 0' }}>
              <div style={{ borderTop: '1px solid #cbd5e0' }}></div>
              <span style={{ position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)', background: 'white', padding: '0 12px', fontSize: '12px', color: '#718096' }}>or</span>
            </div>

            <div style={{ border: '2px solid #48bb78', borderRadius: '10px', padding: '24px' }}>
              <h2 style={{ fontWeight: '600', color: '#2d3748', marginBottom: '12px', margin: '0 0 12px 0', fontSize: '16px' }}>Employee Login</h2>
              <select
                value={selectedEmployeeView}
                onChange={(e) => setSelectedEmployeeView(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e0', borderRadius: '6px', marginBottom: '12px', fontSize: '13px', boxSizing: 'border-box' }}
              >
                <option value="">Select your name</option>
                {employees.map((emp) => (
                  <option key={emp} value={emp}>{emp}</option>
                ))}
              </select>
              <button
                onClick={employeeLogin}
                style={{ width: '100%', padding: '10px 16px', background: '#48bb78', color: 'white', border: 'none', borderRadius: '6px', fontWeight: '600', fontSize: '13px', cursor: 'pointer' }}
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
      <div style={{ minHeight: '100vh', background: '#f8f9fa', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        <div style={{ background: 'white', borderBottom: '1px solid #e2e8f0', position: 'sticky', top: 0, zIndex: 10 }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1a202c', margin: 0 }}>SiteLog</h1>
              <p style={{ fontSize: '12px', color: '#718096', margin: '4px 0 0 0' }}>Supervisor: {supervisorName}</p>
            </div>
            <button
              onClick={() => {
                setAppState('modeSelect');
                setEnteredPassword('');
              }}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: '#fed7d7', color: '#c53030', border: 'none', borderRadius: '6px', fontWeight: '600', fontSize: '13px', cursor: 'pointer' }}
            >
              <LogOut size={16} /> Logout
            </button>
          </div>
        </div>

        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
          {/* Quick Entry Form */}
          <div style={{ background: 'white', border: '2px solid #e2e8f0', borderRadius: '10px', padding: '24px', marginBottom: '24px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#1a202c', marginBottom: '16px', margin: '0 0 16px 0' }}>Log Task</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <input
                type="text"
                placeholder="Task description (e.g., 'Rewired panel')"
                value={newTask.taskName}
                onChange={(e) => setNewTask({ ...newTask, taskName: e.target.value })}
                onKeyPress={(e) => e.key === 'Enter' && addTask()}
                style={{ width: '100%', padding: '12px', border: '1px solid #cbd5e0', borderRadius: '6px', fontSize: '13px', boxSizing: 'border-box' }}
              />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px' }}>
                <select
                  value={newTask.employee}
                  onChange={(e) => setNewTask({ ...newTask, employee: e.target.value })}
                  style={{ padding: '10px 12px', border: '1px solid #cbd5e0', borderRadius: '6px', fontSize: '13px' }}
                >
                  <option value="">Select employee</option>
                  {employees.map(emp => (
                    <option key={emp} value={emp}>{emp}</option>
                  ))}
                </select>
                <select
                  value={newTask.timeMinutes}
                  onChange={(e) => setNewTask({ ...newTask, timeMinutes: Number(e.target.value) })}
                  style={{ padding: '10px 12px', border: '1px solid #cbd5e0', borderRadius: '6px', fontSize: '13px' }}
                >
                  {[10, 20, 30, 40, 50, 60, 90, 120].map(min => (
                    <option key={min} value={min}>{min} min</option>
                  ))}
                </select>
                <input
                  type="date"
                  value={newTask.date}
                  onChange={(e) => setNewTask({ ...newTask, date: e.target.value })}
                  style={{ padding: '10px 12px', border: '1px solid #cbd5e0', borderRadius: '6px', fontSize: '13px' }}
                />
                <select
                  value={newTask.scope}
                  onChange={(e) => setNewTask({ ...newTask, scope: e.target.value })}
                  style={{ padding: '10px 12px', border: '1px solid #cbd5e0', borderRadius: '6px', fontSize: '13px' }}
                >
                  <option value="in-scope">In-Scope</option>
                  <option value="out-of-scope">Out-of-Scope</option>
                </select>
              </div>
              <button
                onClick={addTask}
                style={{ width: '100%', padding: '12px 16px', background: '#667eea', color: 'white', border: 'none', borderRadius: '6px', fontWeight: '600', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                <Plus size={18} /> Add Task
              </button>
            </div>
          </div>

          {/* Tasks Section */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#1a202c', margin: 0 }}>All Tasks</h2>
              <button
                onClick={generateReport}
                style={{ padding: '10px 16px', background: '#48bb78', color: 'white', border: 'none', borderRadius: '6px', fontWeight: '600', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <Download size={16} /> Weekly Report
              </button>
            </div>

            {tasks.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#718096', padding: '32px 0', margin: 0 }}>No tasks logged yet</p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
                {tasks.map(task => (
                  <div key={task.id} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: '12px' }}>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontWeight: '600', color: '#1a202c', margin: '0 0 8px 0', fontSize: '14px' }}>{task.taskName}</p>
                        <div style={{ fontSize: '12px', color: '#718096', lineHeight: '1.6' }}>
                          <p style={{ margin: '4px 0' }}><strong>Employee:</strong> {task.employee}</p>
                          <p style={{ margin: '4px 0' }}><strong>Time:</strong> {task.timeMinutes} min ({(task.timeMinutes / 60).toFixed(2)} hrs)</p>
                          <p style={{ margin: '4px 0' }}><strong>Date:</strong> {task.date}</p>
                          <p style={{ margin: '4px 0' }}>
                            <strong>Scope:</strong> 
                            <span style={{ marginLeft: '4px', fontWeight: '600', color: task.scope === 'in-scope' ? '#22863a' : '#d97706' }}>
                              {task.scope === 'in-scope' ? 'In-Scope' : 'Out-of-Scope'}
                            </span>
                          </p>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => toggleVerify(task.id)}
                          style={{ padding: '6px', background: 'none', border: 'none', cursor: 'pointer' }}
                        >
                          {task.verified ? (
                            <CheckCircle size={18} color="#22863a" />
                          ) : (
                            <Circle size={18} color="#cbd5e0" />
                          )}
                        </button>
                        <button
                          onClick={() => deleteTask(task.id)}
                          style={{ padding: '6px', background: 'none', border: 'none', cursor: 'pointer' }}
                        >
                          <Trash2 size={18} color="#e53e3e" />
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
    const employeeTasks = tasks.filter(t => t.employee === selectedEmployeeView);

    return (
      <div style={{ minHeight: '100vh', background: '#f8f9fa', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        <div style={{ background: 'white', borderBottom: '1px solid #e2e8f0', position: 'sticky', top: 0, zIndex: 10 }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1a202c', margin: 0 }}>SiteLog</h1>
              <p style={{ fontSize: '12px', color: '#718096', margin: '4px 0 0 0' }}>{selectedEmployeeView}</p>
            </div>
            <button
              onClick={() => {
                setAppState('modeSelect');
                setSelectedEmployeeView('');
              }}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: '#fed7d7', color: '#c53030', border: 'none', borderRadius: '6px', fontWeight: '600', fontSize: '13px', cursor: 'pointer' }}
            >
              <LogOut size={16} /> Logout
            </button>
          </div>
        </div>

        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          {/* Log Time Form */}
          <div style={{ background: 'white', border: '2px solid #48bb78', borderRadius: '10px', padding: '24px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#1a202c', marginBottom: '16px', margin: '0 0 16px 0' }}>Log Your Time</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <input
                type="text"
                placeholder="What did you work on?"
                value={employeeNewTask.taskName}
                onChange={(e) => setEmployeeNewTask({ ...employeeNewTask, taskName: e.target.value })}
                onKeyPress={(e) => e.key === 'Enter' && handleEmployeeAddTask()}
                style={{ width: '100%', padding: '12px', border: '1px solid #cbd5e0', borderRadius: '6px', fontSize: '13px', boxSizing: 'border-box' }}
              />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                <select
                  value={employeeNewTask.timeMinutes}
                  onChange={(e) => setEmployeeNewTask({ ...employeeNewTask, timeMinutes: Number(e.target.value) })}
                  style={{ padding: '10px 12px', border: '1px solid #cbd5e0', borderRadius: '6px', fontSize: '13px' }}
                >
                  {[10, 20, 30, 40, 50, 60, 90, 120].map(min => (
                    <option key={min} value={min}>{min} min</option>
                  ))}
                </select>
                <input
                  type="date"
                  value={employeeNewTask.date}
                  onChange={(e) => setEmployeeNewTask({ ...employeeNewTask, date: e.target.value })}
                  style={{ padding: '10px 12px', border: '1px solid #cbd5e0', borderRadius: '6px', fontSize: '13px' }}
                />
                <select
                  value={employeeNewTask.scope}
                  onChange={(e) => setEmployeeNewTask({ ...employeeNewTask, scope: e.target.value })}
                  style={{ padding: '10px 12px', border: '1px solid #cbd5e0', borderRadius: '6px', fontSize: '13px' }}
                >
                  <option value="in-scope">In-Scope</option>
                  <option value="out-of-scope">Out-of-Scope</option>
                </select>
              </div>
              <button
                onClick={handleEmployeeAddTask}
                style={{ width: '100%', padding: '12px 16px', background: '#48bb78', color: 'white', border: 'none', borderRadius: '6px', fontWeight: '600', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                <Plus size={18} /> Log Time
              </button>
            </div>
          </div>

          {/* Tasks List */}
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#1a202c', marginBottom: '16px', margin: '0 0 16px 0' }}>Your Tasks ({employeeTasks.length})</h2>
            {employeeTasks.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#718096', padding: '32px 0', margin: 0 }}>No tasks assigned yet</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {employeeTasks.map(task => (
                  <div key={task.id} style={{ background: 'white', borderLeft: '4px solid #48bb78', borderRadius: '6px', padding: '16px' }}>
                    <p style={{ fontWeight: '600', color: '#1a202c', margin: '0 0 8px 0', fontSize: '14px' }}>{task.taskName}</p>
                    <div style={{ fontSize: '12px', color: '#718096', lineHeight: '1.6' }}>
                      <p style={{ margin: '4px 0' }}><strong>Time:</strong> {task.timeMinutes} min ({(task.timeMinutes / 60).toFixed(2)} hrs)</p>
                      <p style={{ margin: '4px 0' }}><strong>Date:</strong> {task.date}</p>
                      <p style={{ margin: '4px 0' }}>
                        <strong>Scope:</strong> 
                        <span style={{ marginLeft: '4px', fontWeight: '600', color: task.scope === 'in-scope' ? '#22863a' : '#d97706' }}>
                          {task.scope === 'in-scope' ? 'In-Scope' : 'Out-of-Scope'}
                        </span>
                      </p>
                      {task.loggedByEmployee && (
                        <p style={{ margin: '4px 0', color: '#667eea' }}>✓ You logged this</p>
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
