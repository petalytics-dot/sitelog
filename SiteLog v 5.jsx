import React, { useState, useEffect } from 'react';
import { Download, Plus, Trash2, CheckCircle, Circle, LogOut, Settings, X, Edit2 } from 'lucide-react';

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
    employeeCompleted: false,
  });

  const [employeeNewTask, setEmployeeNewTask] = useState({
    taskName: '',
    timeMinutes: 10,
    date: new Date().toISOString().split('T')[0],
    scope: 'out-of-scope',
  });

  // Modal states
  const [editingTask, setEditingTask] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [showSettings, setShowSettings] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [editEmployeeName, setEditEmployeeName] = useState('');

  // Initialize Firebase
  useEffect(() => {
    const storedConfig = localStorage.getItem('firebaseConfig');
    if (storedConfig) {
      setFirebaseConfigured(true);
      loadDataFromFirebase(JSON.parse(storedConfig));
      setAppState('modeSelect');
    }
  }, []);

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
        if (snapshot.exists()) setSupervisorName(snapshot.val());
      });

      onValue(ref(dbRef, 'config/employees'), (snapshot) => {
        if (snapshot.exists()) setEmployees(snapshot.val());
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
      employeeCompleted: false,
    });
  };

  const handleEmployeeAddTask = async () => {
    if (!employeeNewTask.taskName.trim()) return;
    const taskId = Date.now().toString();
    const customMinutes = parseInt(employeeNewTask.customMinutes) || employeeNewTask.timeMinutes;
    
    await saveToFirebase(`tasks/${taskId}`, {
      taskName: employeeNewTask.taskName,
      employee: selectedEmployeeView,
      timeMinutes: customMinutes,
      date: employeeNewTask.date,
      scope: employeeNewTask.scope,
      verified: false,
      employeeCompleted: false,
      createdAt: new Date().toISOString(),
      loggedByEmployee: true
    });
    setEmployeeNewTask({
      taskName: '',
      timeMinutes: 10,
      customMinutes: '',
      date: new Date().toISOString().split('T')[0],
      scope: 'out-of-scope',
    });
  };

  const startEditTask = (task) => {
    setEditingTask(task.id);
    setEditFormData({ ...task });
  };

  const saveEditTask = async () => {
    if (!editFormData.taskName.trim()) {
      alert('Task name required');
      return;
    }
    const customMinutes = parseInt(editFormData.customMinutes) || editFormData.timeMinutes;
    
    await updateTask(editingTask, {
      taskName: editFormData.taskName,
      employee: editFormData.employee,
      timeMinutes: customMinutes,
      date: editFormData.date,
      scope: editFormData.scope,
    });
    setEditingTask(null);
    setEditFormData({});
  };

  const updateTask = async (taskId, updates) => {
    const { ref, update } = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-database.js');
    await update(ref(database, `tasks/${taskId}`), updates);
  };

  const deleteTask = async (taskId) => {
    const { ref, remove } = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-database.js');
    await remove(ref(database, `tasks/${taskId}`));
  };

  const toggleVerify = async (taskId) => {
    const task = tasks.find(t => t.id === taskId);
    await updateTask(taskId, { verified: !task.verified });
  };

  const toggleEmployeeCompleted = async (taskId) => {
    const task = tasks.find(t => t.id === taskId);
    await updateTask(taskId, { employeeCompleted: !task.employeeCompleted });
  };

  const changePassword = async () => {
    if (!newPassword.trim()) {
      alert('Please enter a new password');
      return;
    }
    if (newPassword !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }
    setSupervisorPassword(newPassword);
    await saveToFirebase('config/password', newPassword);
    setNewPassword('');
    setConfirmPassword('');
    alert('Password updated!');
  };

  const updateEmployeeName = (idx) => {
    if (!editEmployeeName.trim()) return;
    const updated = [...employees];
    updated[idx] = editEmployeeName;
    setEmployees(updated);
    setEditingEmployee(null);
    setEditEmployeeName('');
  };

  const exportData = () => {
    const dataToExport = {
      supervisorName,
      employees,
      tasks,
      exportedAt: new Date().toISOString(),
    };
    const json = JSON.stringify(dataToExport, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SiteLog_Backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  const clearAllData = () => {
    if (window.confirm('⚠️ WARNING: This will delete ALL tasks. This cannot be undone. Are you sure?')) {
      if (window.confirm('Really? Last chance!')) {
        setTasks([]);
        const { ref, remove } = import('https://www.gstatic.com/firebasejs/10.7.0/firebase-database.js').then(({ ref, remove }) => {
          remove(ref(database, 'tasks'));
        });
      }
    }
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

    let csv = 'Date,Employee,Task,Time (minutes),Time (hours),Scope,Employee Completed,Verified\n';
    weekTasks.forEach(task => {
      const hours = (task.timeMinutes / 60).toFixed(2);
      csv += `${task.date},"${task.employee}","${task.taskName}",${task.timeMinutes},${hours},"${task.scope}","${task.employeeCompleted ? 'Yes' : 'No'}","${task.verified ? 'Yes' : 'No'}"\n`;
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

  // Calculate dashboard stats
  const getWeekStart = (dateStr) => {
    const date = new Date(dateStr);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(date.setDate(diff)).toISOString().split('T')[0];
  };

  const currentWeekStart = getWeekStart(new Date().toISOString().split('T')[0]);
  const weekTasks = tasks.filter(t => getWeekStart(t.date) === currentWeekStart);
  const totalMinutes = weekTasks.reduce((sum, t) => sum + t.timeMinutes, 0);
  const inScopeMinutes = weekTasks.filter(t => t.scope === 'in-scope').reduce((sum, t) => sum + t.timeMinutes, 0);
  const outScopeMinutes = weekTasks.filter(t => t.scope === 'out-of-scope').reduce((sum, t) => sum + t.timeMinutes, 0);
  const unverifiedCount = weekTasks.filter(t => !t.verified).length;
  const pendingCompletionCount = weekTasks.filter(t => !t.employeeCompleted).length;

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
        {/* Header */}
        <div style={{ background: 'white', borderBottom: '1px solid #e2e8f0', position: 'sticky', top: 0, zIndex: 10 }}>
          <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1a202c', margin: 0 }}>SiteLog</h1>
              <p style={{ fontSize: '12px', color: '#718096', margin: '4px 0 0 0' }}>Supervisor: {supervisorName}</p>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setShowSettings(true)}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: '#edf2f7', color: '#2d3748', border: 'none', borderRadius: '6px', fontWeight: '600', fontSize: '13px', cursor: 'pointer' }}
              >
                <Settings size={16} /> Settings
              </button>
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
        </div>

        {/* Dashboard Stats */}
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
            <div style={{ background: 'white', borderRadius: '8px', padding: '20px', borderLeft: '4px solid #667eea' }}>
              <p style={{ fontSize: '12px', color: '#718096', margin: '0 0 8px 0', fontWeight: '600' }}>Total Hours (This Week)</p>
              <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#1a202c', margin: 0 }}>{(totalMinutes / 60).toFixed(1)}</p>
            </div>
            <div style={{ background: 'white', borderRadius: '8px', padding: '20px', borderLeft: '4px solid #22863a' }}>
              <p style={{ fontSize: '12px', color: '#718096', margin: '0 0 8px 0', fontWeight: '600' }}>In-Scope Hours</p>
              <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#22863a', margin: 0 }}>{(inScopeMinutes / 60).toFixed(1)}</p>
              <p style={{ fontSize: '11px', color: '#718096', margin: '4px 0 0 0' }}>({((inScopeMinutes / totalMinutes) * 100 || 0).toFixed(0)}%)</p>
            </div>
            <div style={{ background: 'white', borderRadius: '8px', padding: '20px', borderLeft: '4px solid #d97706' }}>
              <p style={{ fontSize: '12px', color: '#718096', margin: '0 0 8px 0', fontWeight: '600' }}>Out-of-Scope Hours</p>
              <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#d97706', margin: 0 }}>{(outScopeMinutes / 60).toFixed(1)}</p>
              <p style={{ fontSize: '11px', color: '#718096', margin: '4px 0 0 0' }}>({((outScopeMinutes / totalMinutes) * 100 || 0).toFixed(0)}%)</p>
            </div>
            <div style={{ background: 'white', borderRadius: '8px', padding: '20px', borderLeft: '4px solid #e53e3e' }}>
              <p style={{ fontSize: '12px', color: '#718096', margin: '0 0 8px 0', fontWeight: '600' }}>Pending Verification</p>
              <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#e53e3e', margin: 0 }}>{unverifiedCount}</p>
            </div>
            <div style={{ background: 'white', borderRadius: '8px', padding: '20px', borderLeft: '4px solid #3182ce' }}>
              <p style={{ fontSize: '12px', color: '#718096', margin: '0 0 8px 0', fontWeight: '600' }}>Waiting on Employee</p>
              <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#3182ce', margin: 0 }}>{pendingCompletionCount}</p>
            </div>
          </div>

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
                  {[supervisorName, ...employees.filter(e => e !== supervisorName)].map(emp => (
                    <option key={emp} value={emp}>{emp}</option>
                  ))}
                </select>
                <select
                  value={newTask.timeMinutes}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === 'custom') {
                      setNewTask({ ...newTask, timeMinutes: 0, customMinutes: '' });
                    } else {
                      setNewTask({ ...newTask, timeMinutes: Number(val), customMinutes: '' });
                    }
                  }}
                  style={{ padding: '10px 12px', border: '1px solid #cbd5e0', borderRadius: '6px', fontSize: '13px' }}
                >
                  <option value={10}>10 min</option>
                  <option value={20}>20 min</option>
                  <option value={30}>30 min</option>
                  <option value={60}>1 hour</option>
                  <option value={90}>1.5 hours</option>
                  <option value={120}>2 hours</option>
                  <option value={180}>3 hours</option>
                  <option value={240}>4 hours</option>
                  <option value="custom">Custom</option>
                </select>
                {newTask.customMinutes !== undefined && newTask.timeMinutes === 0 && (
                  <input
                    type="number"
                    placeholder="Minutes"
                    value={newTask.customMinutes || ''}
                    onChange={(e) => setNewTask({ ...newTask, customMinutes: e.target.value })}
                    style={{ padding: '10px 12px', border: '1px solid #cbd5e0', borderRadius: '6px', fontSize: '13px' }}
                  />
                )}
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
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
                {tasks.map(task => {
                  const bgColor = task.scope === 'in-scope' ? '#f0fdf4' : '#fffbeb';
                  const borderColor = task.scope === 'in-scope' ? '#22863a' : '#d97706';
                  
                  return (
                    <div key={task.id} style={{ background: bgColor, border: `1px solid ${borderColor}`, borderRadius: '8px', padding: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: '12px', marginBottom: '12px' }}>
                        <div style={{ flex: 1 }}>
                          <p style={{ fontWeight: '600', color: '#1a202c', margin: '0 0 4px 0', fontSize: '14px' }}>{task.taskName}</p>
                          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            {task.employeeCompleted && (
                              <span style={{ fontSize: '11px', background: '#dbeafe', color: '#1e40af', padding: '2px 8px', borderRadius: '4px', fontWeight: '600' }}>✓ Employee Done</span>
                            )}
                            {task.verified && (
                              <span style={{ fontSize: '11px', background: '#dcfce7', color: '#166534', padding: '2px 8px', borderRadius: '4px', fontWeight: '600' }}>✓ Verified</span>
                            )}
                            <span style={{ fontSize: '11px', background: borderColor === '#22863a' ? '#dcfce7' : '#fef3c7', color: borderColor, padding: '2px 8px', borderRadius: '4px', fontWeight: '600' }}>
                              {task.scope === 'in-scope' ? 'In-Scope' : 'Out-of-Scope'}
                            </span>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            onClick={() => startEditTask(task)}
                            style={{ padding: '6px', background: 'none', border: 'none', cursor: 'pointer', color: '#667eea' }}
                            title="Edit task"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => deleteTask(task.id)}
                            style={{ padding: '6px', background: 'none', border: 'none', cursor: 'pointer', color: '#e53e3e' }}
                            title="Delete task"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>

                      <div style={{ fontSize: '12px', color: '#718096', lineHeight: '1.6', marginBottom: '12px' }}>
                        <p style={{ margin: '3px 0' }}><strong>Employee:</strong> {task.employee}</p>
                        <p style={{ margin: '3px 0' }}><strong>Time:</strong> {task.timeMinutes} min ({(task.timeMinutes / 60).toFixed(2)} hrs)</p>
                        <p style={{ margin: '3px 0' }}><strong>Date:</strong> {task.date}</p>
                      </div>

                      <div style={{ display: 'flex', gap: '8px', paddingTop: '12px', borderTop: `1px solid ${borderColor}` }}>
                        <button
                          onClick={() => toggleEmployeeCompleted(task.id)}
                          title={task.employeeCompleted ? 'Mark incomplete' : 'Mark employee complete'}
                          style={{ flex: 1, padding: '8px 12px', fontSize: '12px', fontWeight: '600', border: 'none', borderRadius: '4px', cursor: 'pointer', background: task.employeeCompleted ? '#dbeafe' : '#f3f4f6', color: task.employeeCompleted ? '#1e40af' : '#6b7280', transition: 'all 0.2s' }}
                        >
                          {task.employeeCompleted ? '✓ Done' : 'Mark Done'}
                        </button>
                        <button
                          onClick={() => toggleVerify(task.id)}
                          title={task.verified ? 'Mark unverified' : 'Mark verified'}
                          style={{ flex: 1, padding: '8px 12px', fontSize: '12px', fontWeight: '600', border: 'none', borderRadius: '4px', cursor: 'pointer', background: task.verified ? '#dcfce7' : '#f3f4f6', color: task.verified ? '#166534' : '#6b7280', transition: 'all 0.2s' }}
                        >
                          {task.verified ? '✓ Verified' : 'Verify'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Edit Task Modal */}
        {editingTask && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
            <div style={{ background: 'white', borderRadius: '12px', padding: '30px', maxWidth: '500px', width: '90%', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1a202c', margin: 0 }}>Edit Task</h2>
                <button
                  onClick={() => setEditingTask(null)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '24px', color: '#718096' }}
                >
                  ×
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#2d3748', marginBottom: '6px' }}>Task Name</label>
                  <input
                    type="text"
                    value={editFormData.taskName || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, taskName: e.target.value })}
                    style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e0', borderRadius: '6px', fontSize: '13px', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#2d3748', marginBottom: '6px' }}>Employee</label>
                  <select
                    value={editFormData.employee || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, employee: e.target.value })}
                    style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e0', borderRadius: '6px', fontSize: '13px' }}
                  >
                    {[supervisorName, ...employees.filter(e => e !== supervisorName)].map(emp => (
                      <option key={emp} value={emp}>{emp}</option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#2d3748', marginBottom: '6px' }}>Time (minutes)</label>
                    <input
                      type="number"
                      value={editFormData.customMinutes !== undefined && editFormData.customMinutes !== '' ? editFormData.customMinutes : editFormData.timeMinutes}
                      onChange={(e) => setEditFormData({ ...editFormData, customMinutes: e.target.value, timeMinutes: Number(e.target.value) })}
                      style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e0', borderRadius: '6px', fontSize: '13px', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#2d3748', marginBottom: '6px' }}>Date</label>
                    <input
                      type="date"
                      value={editFormData.date || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, date: e.target.value })}
                      style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e0', borderRadius: '6px', fontSize: '13px' }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#2d3748', marginBottom: '6px' }}>Scope</label>
                  <select
                    value={editFormData.scope || 'out-of-scope'}
                    onChange={(e) => setEditFormData({ ...editFormData, scope: e.target.value })}
                    style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e0', borderRadius: '6px', fontSize: '13px' }}
                  >
                    <option value="in-scope">In-Scope</option>
                    <option value="out-of-scope">Out-of-Scope</option>
                  </select>
                </div>

                <div style={{ display: 'flex', gap: '12px', paddingTop: '16px', borderTop: '1px solid #e2e8f0' }}>
                  <button
                    onClick={() => setEditingTask(null)}
                    style={{ flex: 1, padding: '10px 16px', background: '#e2e8f0', color: '#2d3748', border: 'none', borderRadius: '6px', fontWeight: '600', fontSize: '13px', cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveEditTask}
                    style={{ flex: 1, padding: '10px 16px', background: '#667eea', color: 'white', border: 'none', borderRadius: '6px', fontWeight: '600', fontSize: '13px', cursor: 'pointer' }}
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Settings Modal */}
        {showSettings && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, overflowY: 'auto' }}>
            <div style={{ background: 'white', borderRadius: '12px', padding: '30px', maxWidth: '600px', width: '90%', boxShadow: '0 20px 60px rgba(0,0,0,0.3)', margin: '20px 0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1a202c', margin: 0 }}>Settings</h2>
                <button
                  onClick={() => setShowSettings(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '24px', color: '#718096' }}
                >
                  ×
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {/* Change Password */}
                <div>
                  <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#1a202c', marginBottom: '12px', margin: '0 0 12px 0' }}>Change Supervisor Password</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <input
                      type="password"
                      placeholder="New password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e0', borderRadius: '6px', fontSize: '13px', boxSizing: 'border-box' }}
                    />
                    <input
                      type="password"
                      placeholder="Confirm password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e0', borderRadius: '6px', fontSize: '13px', boxSizing: 'border-box' }}
                    />
                    <button
                      onClick={changePassword}
                      style={{ padding: '10px 16px', background: '#667eea', color: 'white', border: 'none', borderRadius: '6px', fontWeight: '600', fontSize: '13px', cursor: 'pointer' }}
                    >
                      Update Password
                    </button>
                  </div>
                </div>

                <div style={{ borderTop: '1px solid #e2e8f0' }}></div>

                {/* Manage Employees */}
                <div>
                  <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#1a202c', marginBottom: '12px', margin: '0 0 12px 0' }}>Team Members</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
                    {employees.map((emp, idx) => (
                      <div key={idx} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        {editingEmployee === idx ? (
                          <>
                            <input
                              type="text"
                              value={editEmployeeName}
                              onChange={(e) => setEditEmployeeName(e.target.value)}
                              style={{ flex: 1, padding: '8px 10px', border: '1px solid #cbd5e0', borderRadius: '6px', fontSize: '13px', boxSizing: 'border-box' }}
                            />
                            <button
                              onClick={() => updateEmployeeName(idx)}
                              style={{ padding: '6px 12px', background: '#48bb78', color: 'white', border: 'none', borderRadius: '4px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingEmployee(null)}
                              style={{ padding: '6px 12px', background: '#e2e8f0', color: '#2d3748', border: 'none', borderRadius: '4px', fontSize: '12px', cursor: 'pointer' }}
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <span style={{ flex: 1, fontSize: '13px', color: '#2d3748' }}>{emp}</span>
                            <button
                              onClick={() => {
                                setEditingEmployee(idx);
                                setEditEmployeeName(emp);
                              }}
                              style={{ padding: '6px 12px', background: '#edf2f7', color: '#667eea', border: 'none', borderRadius: '4px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => removeEmployee(idx)}
                              style={{ padding: '6px 12px', background: '#fed7d7', color: '#c53030', border: 'none', borderRadius: '4px', fontSize: '12px', cursor: 'pointer' }}
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="text"
                      value={newEmployeeName}
                      onChange={(e) => setNewEmployeeName(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addEmployee()}
                      placeholder="Add new employee"
                      style={{ flex: 1, padding: '10px', border: '1px solid #cbd5e0', borderRadius: '6px', fontSize: '13px', boxSizing: 'border-box' }}
                    />
                    <button
                      onClick={addEmployee}
                      style={{ padding: '10px 16px', background: '#667eea', color: 'white', border: 'none', borderRadius: '6px', fontWeight: '600', fontSize: '13px', cursor: 'pointer' }}
                    >
                      Add
                    </button>
                  </div>
                </div>

                <div style={{ borderTop: '1px solid #e2e8f0' }}></div>

                {/* Data Management */}
                <div>
                  <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#1a202c', marginBottom: '12px', margin: '0 0 12px 0' }}>Data</h3>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                      onClick={exportData}
                      style={{ flex: 1, padding: '10px 16px', background: '#48bb78', color: 'white', border: 'none', borderRadius: '6px', fontWeight: '600', fontSize: '13px', cursor: 'pointer' }}
                    >
                      📥 Export Backup
                    </button>
                    <button
                      onClick={clearAllData}
                      style={{ flex: 1, padding: '10px 16px', background: '#e53e3e', color: 'white', border: 'none', borderRadius: '6px', fontWeight: '600', fontSize: '13px', cursor: 'pointer' }}
                    >
                      🗑️ Clear All Data
                    </button>
                  </div>
                </div>

                <div style={{ paddingTop: '16px', borderTop: '1px solid #e2e8f0' }}>
                  <button
                    onClick={() => setShowSettings(false)}
                    style={{ width: '100%', padding: '10px 16px', background: '#667eea', color: 'white', border: 'none', borderRadius: '6px', fontWeight: '600', fontSize: '13px', cursor: 'pointer' }}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
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
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === 'custom') {
                      setEmployeeNewTask({ ...employeeNewTask, timeMinutes: 0, customMinutes: '' });
                    } else {
                      setEmployeeNewTask({ ...employeeNewTask, timeMinutes: Number(val), customMinutes: '' });
                    }
                  }}
                  style={{ padding: '10px 12px', border: '1px solid #cbd5e0', borderRadius: '6px', fontSize: '13px' }}
                >
                  <option value={10}>10 min</option>
                  <option value={20}>20 min</option>
                  <option value={30}>30 min</option>
                  <option value={60}>1 hour</option>
                  <option value={90}>1.5 hrs</option>
                  <option value={120}>2 hours</option>
                  <option value={180}>3 hours</option>
                  <option value={240}>4 hours</option>
                  <option value="custom">Custom</option>
                </select>
                {employeeNewTask.customMinutes !== undefined && employeeNewTask.timeMinutes === 0 && (
                  <input
                    type="number"
                    placeholder="Minutes"
                    value={employeeNewTask.customMinutes || ''}
                    onChange={(e) => setEmployeeNewTask({ ...employeeNewTask, customMinutes: e.target.value })}
                    style={{ padding: '10px 12px', border: '1px solid #cbd5e0', borderRadius: '6px', fontSize: '13px' }}
                  />
                )}
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
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: '12px', marginBottom: '8px' }}>
                      <p style={{ fontWeight: '600', color: '#1a202c', margin: 0, fontSize: '14px' }}>{task.taskName}</p>
                      {!task.employeeCompleted && (
                        <button
                          onClick={() => toggleEmployeeCompleted(task.id)}
                          style={{ padding: '4px 12px', background: '#fef3c7', color: '#92400e', border: '1px solid #fcd34d', borderRadius: '4px', fontSize: '11px', fontWeight: '600', cursor: 'pointer' }}
                        >
                          Mark Done
                        </button>
                      )}
                      {task.employeeCompleted && (
                        <span style={{ padding: '4px 12px', background: '#dbeafe', color: '#1e40af', borderRadius: '4px', fontSize: '11px', fontWeight: '600' }}>
                          ✓ Completed
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '12px', color: '#718096', lineHeight: '1.6' }}>
                      <p style={{ margin: '3px 0' }}><strong>Time:</strong> {task.timeMinutes} min ({(task.timeMinutes / 60).toFixed(2)} hrs)</p>
                      <p style={{ margin: '3px 0' }}><strong>Date:</strong> {task.date}</p>
                      <p style={{ margin: '3px 0' }}>
                        <strong>Scope:</strong> 
                        <span style={{ marginLeft: '4px', fontWeight: '600', color: task.scope === 'in-scope' ? '#22863a' : '#d97706' }}>
                          {task.scope === 'in-scope' ? 'In-Scope' : 'Out-of-Scope'}
                        </span>
                      </p>
                      {task.loggedByEmployee && (
                        <p style={{ margin: '3px 0', color: '#667eea' }}>✓ You logged this</p>
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
