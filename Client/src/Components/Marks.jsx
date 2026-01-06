import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { authAPI, marksAPI, timetableAPI, usersAPI, profileAPI, examAPI } from '../services/api';

function Marks() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [studentGrade, setStudentGrade] = useState(null);
  const [exam, setExam] = useState("");
  const [classes, setClasses] = useState("");
  const [marks, setMarks] = useState([]);
  const [allMarks, setAllMarks] = useState([]);
  const [search, setSearch] = useState("");
  const [editData, setEditData] = useState(null);
  const [editingKey, setEditingKey] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showNewExamForm, setShowNewExamForm] = useState(false);
  const [newExamName, setNewExamName] = useState("");
  const [exams, setExams] = useState([]);
  const [availableClasses, setAvailableClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [newResult, setNewResult] = useState({
    REG: "",
    Class: "",
    Subject: "",
    MarksObtained: "",
    Exam: "",
    Remarks: ""
  });

  useEffect(() => {
    const token = localStorage.getItem('token') || localStorage.getItem('authToken');
    const email = localStorage.getItem('Email');
    
    if (!token || !email) {
      navigate('/');
      return;
    }

    loadUserData();
  }, [navigate]);

  const loadUserData = async () => {
    try {
      setLoading(true);
      const profileRes = await authAPI.getProfile();
      
      if (profileRes.success && profileRes.data) {
        const userData = profileRes.data;
        setUser(userData);
        
        if (userData.REG) {
          setProfile({ REG: userData.REG });
          
          if (userData.UserType === 'Student' && userData.ClassEnrolled) {
            setStudentGrade({ ClassEnrolled: userData.ClassEnrolled });
          }
        }

        await loadInitialData(userData);
      } else {
        // Fallback to localStorage
        const email = localStorage.getItem('Email');
        const userType = localStorage.getItem('UserType');
        if (email && userType) {
          const fallbackUser = {
            Email: email,
            UserType: userType,
            Name: localStorage.getItem('UserName') || 'User'
          };
          setUser(fallbackUser);
          await loadInitialData(fallbackUser);
        } else {
          navigate('/');
        }
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      // Fallback to localStorage
      const email = localStorage.getItem('Email');
      const userType = localStorage.getItem('UserType');
      if (email && userType) {
        const fallbackUser = {
          Email: email,
          UserType: userType,
          Name: localStorage.getItem('UserName') || 'User'
        };
        setUser(fallbackUser);
        await loadInitialData(fallbackUser);
      }
    } finally {
      setLoading(false);
    }
  };

  const loadInitialData = async (userData) => {
    try {
      // Load exams first (important for dropdown)
      const examsRes = await examAPI.getAll();
      if (examsRes.success) {
        console.log('Loaded exams:', examsRes.data);
        setExams(examsRes.data || []);
      } else {
        console.error('Failed to load exams:', examsRes);
        setExams([]);
      }

      // Load classes
      const classesRes = await timetableAPI.getAll();
      if (classesRes.success) {
        const classNumbers = [...new Set(classesRes.data.map(c => c.Class))].sort((a, b) => a - b);
        setAvailableClasses(classNumbers);
        
        // Load subjects from classes
        const allSubjects = new Set();
        classesRes.data.forEach(cls => {
          if (cls.TimeTable) {
            const timetable = cls.TimeTable instanceof Map 
              ? Object.fromEntries(cls.TimeTable) 
              : cls.TimeTable;
            Object.values(timetable).forEach(day => {
              if (Array.isArray(day)) {
                day.forEach(slot => {
                  if (slot.subject) allSubjects.add(slot.subject);
                });
              }
            });
          }
        });
        setSubjects(Array.from(allSubjects).sort());
      }

      // Load marks based on user type
      if (userData) {
        await loadMarksInitial(userData);
      }
    } catch (error) {
      console.error('Error loading initial data:', error);
    }
  };

  const loadMarksInitial = async (userData) => {
    try {
      const filters = {};
      
      // If student, only load their marks
      if (userData?.UserType === 'Student' && (profile?.REG || userData?.REG)) {
        filters.reg = profile?.REG || userData?.REG;
      }
    
      const res = await marksAPI.getAll(filters);
      if (res.success) {
        console.log('Loaded marks:', res.data);
        setAllMarks(res.data || []);
        setMarks(res.data || []);
      } else {
        console.error('Failed to load marks:', res);
        setAllMarks([]);
        setMarks([]);
      }
    } catch (error) {
      console.error('Error loading marks:', error);
      setAllMarks([]);
      setMarks([]);
    }
  };

  const loadMarks = async () => {
    try {
      const filters = {};
      
      // If student, only load their marks
      if (user?.UserType === 'Student' && (profile?.REG || user?.REG)) {
        filters.reg = profile?.REG || user?.REG;
      }
      
      // If teacher/admin, apply class filter if selected
      if ((user?.UserType === 'Teacher' || user?.UserType === 'Admin') && classes) {
        filters.class = classes;
      }
      
      // Apply exam filter if selected
      if (exam) {
        filters.exam = exam;
      }
    
      console.log('Loading marks with filters:', filters);
      const res = await marksAPI.getAll(filters);
      if (res.success) {
        console.log('Marks loaded:', res.data);
        setAllMarks(res.data || []);
        applyFilters(res.data || []);
      } else {
        console.error('Failed to load marks:', res);
        setAllMarks([]);
        setMarks([]);
      }
    } catch (error) {
      console.error('Error loading marks:', error);
      setAllMarks([]);
      setMarks([]);
    }
  };

  const applyFilters = (marksData) => {
    let filtered = [...marksData];

    // Filter by class if selected
    if (classes) {
      filtered = filtered.filter(m => m.Class === parseInt(classes));
    }

    // Filter by exam if selected
    if (exam) {
      filtered = filtered.filter(m => m.Exam === exam);
    }

    // Filter by search (REG number)
    if (search) {
      filtered = filtered.filter(m => 
        m.REG?.toLowerCase().includes(search.toLowerCase())
      );
    }

    console.log('Filtered marks:', filtered);
    setMarks(filtered);
  };

  // Effect to reload marks when filters change
  useEffect(() => {
    if (user) {
      loadMarks();
    }
  }, [classes, exam]);

  // Effect to apply search filter on existing marks
  useEffect(() => {
    applyFilters(allMarks);
  }, [search]);

  const handleEdit = (data) => {
    const editKey = `${data.REG}-${data.Subject}-${data.Exam}`;
    setEditingKey(editKey);
    setEditData({
      REG: data.REG,
      Class: data.Class,
      MarksObtained: data.MarksObtained,
      Subject: data.Subject,
      Exam: data.Exam,
      Remarks: data.Remarks || '',
      _id: data._id
    });
  };

  const handleSaveEdit = async () => {
    if (!editData || !editData._id) return;
    
    try {
      const res = await marksAPI.update(editData._id, {
        MarksObtained: parseInt(editData.MarksObtained) || editData.MarksObtained,
        Remarks: editData.Remarks
      });
    
      if (res.success) {
        await loadMarks();
        alert("Marks updated successfully!");
        setEditingKey(null);
        setEditData(null);
      }
    } catch (error) {
      console.error('Error updating marks:', error);
      alert("Failed to update marks");
    }
  };

  const handleCancelEdit = () => {
    setEditingKey(null);
    setEditData(null);
  };

  const handleEditChange = (field, value) => {
    setEditData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddResult = async (e) => {
    e.preventDefault();
    
    if (!newResult.REG || !newResult.Class || !newResult.Subject || !newResult.MarksObtained || !newResult.Exam) {
      alert("Please fill in all required fields");
      return;
    }

    const marks = parseInt(newResult.MarksObtained);
    if (isNaN(marks) || marks < 0 || marks > 100) {
      alert("Marks must be between 0 and 100");
      return;
    }

    try {
      const res = await marksAPI.create({
        REG: newResult.REG.toUpperCase(),
        Class: parseInt(newResult.Class),
        Subject: newResult.Subject,
        MarksObtained: marks,
        Exam: newResult.Exam,
        Remarks: newResult.Remarks || ''
      });

      if (res.success) {
        alert("Result added successfully!");
        setShowAddForm(false);
        setNewResult({
          REG: "",
          Class: "",
          Subject: "",
          MarksObtained: "",
          Exam: "",
          Remarks: ""
        });
        await loadMarks();
      }
    } catch (error) {
      console.error('Error adding result:', error);
      alert(error.response?.data?.message || "Failed to add result");
    }
  };

  const handleNewResultChange = (field, value) => {
    setNewResult(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddExam = async (e) => {
    e.preventDefault();
    
    if (!newExamName.trim()) {
      alert("Please enter an exam name");
      return;
    }

    try {
      const res = await examAPI.create({ name: newExamName.trim() });
      
      if (res.success) {
        alert("Exam created successfully!");
        setShowNewExamForm(false);
        setNewExamName("");
        
        // Reload exams
        const examsRes = await examAPI.getAll();
        if (examsRes.success) {
          setExams(examsRes.data || []);
        }
      }
    } catch (error) {
      console.error('Error creating exam:', error);
      alert(error.response?.data?.message || "Failed to create exam");
    }
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '1.5rem',
        color: '#666'
      }}>
        Loading...
      </div>
    );
  }

  if (!user) return null;

  const user_REG = profile?.REG || user?.REG;

  return (
    <div className="marks-container" style={{padding: '20px', maxWidth: '1400px', margin: '0 auto'}}>
      <h1 style={{
        textAlign: 'center',
        color: '#FE6D36',
        marginBottom: '30px',
        fontSize: '2.5rem',
        fontWeight: 'bold'
      }}>
        📊 Marks Management
      </h1>

      {/* Filters Section */}
      <div style={{
        backgroundColor: 'white',
        padding: '25px',
        borderRadius: '12px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        marginBottom: '30px'
      }}>
        <h2 style={{marginBottom: '20px', color: '#333', fontSize: '1.5rem'}}>Filters</h2>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: user.UserType === 'Student' ? '1fr' : 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '20px'
        }}>
          {user.UserType === "Student" && (
            <div>
              <label style={{display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#555'}}>
                Select Exam
              </label>
              <select
                value={exam}
                onChange={(e) => {
                  console.log('Student selected exam:', e.target.value);
                  setExam(e.target.value);
                }}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '2px solid #FDB5AB',
                  fontSize: '1rem',
                  cursor: 'pointer',
                  backgroundColor: 'white'
                }}
              >
                <option value="">-- Select Exam --</option>
                {exams.length > 0 ? (
                  exams.map(ex => (
                    <option key={ex._id} value={ex.ExamName}>{ex.ExamName}</option>
                  ))
                ) : (
                  <option value="" disabled>No exams available</option>
                )}
              </select>
              {exams.length === 0 && (
                <p style={{color: '#f44336', fontSize: '0.85rem', marginTop: '5px'}}>
                  No exams found. Please contact your teacher.
                </p>
              )}
            </div>
          )}

          {(user.UserType === "Teacher" || user.UserType === "Admin") && (
            <>
              <div>
                <label style={{display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#555'}}>
                  Class
                </label>
                <select
                  value={classes}
                  onChange={(e) => {
                    console.log('Teacher/Admin selected class:', e.target.value);
                    setClasses(e.target.value);
                  }}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '2px solid #FDB5AB',
                    fontSize: '1rem',
                    cursor: 'pointer',
                    backgroundColor: 'white'
                  }}
                >
                  <option value="">-- Select Class --</option>
                  {availableClasses.map(cls => (
                    <option key={cls} value={cls}>Class {cls}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#555'}}>
                  Exam
                </label>
                <select
                  value={exam}
                  onChange={(e) => {
                    console.log('Teacher/Admin selected exam:', e.target.value);
                    setExam(e.target.value);
                  }}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '2px solid #FDB5AB',
                    fontSize: '1rem',
                    cursor: 'pointer',
                    backgroundColor: 'white'
                  }}
                >
                  <option value="">-- Select Exam --</option>
                  {exams.length > 0 ? (
                    exams.map(ex => (
                      <option key={ex._id} value={ex.ExamName}>{ex.ExamName}</option>
                    ))
                  ) : (
                    <option value="" disabled>No exams available</option>
                  )}
                </select>
              </div>

              <div>
                <label style={{display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#555'}}>
                  Search by REG
                </label>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Enter REG number"
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '2px solid #FDB5AB',
                    fontSize: '1rem'
                  }}
                />
              </div>
            </>
          )}
        </div>

        {/* Debug Info - Remove in production */}
        {process.env.NODE_ENV === 'development' && (
          <div style={{marginTop: '15px', padding: '10px', backgroundColor: '#f0f0f0', borderRadius: '6px', fontSize: '0.85rem'}}>
            <strong>Debug Info:</strong>
            <div>Total Exams Loaded: {exams.length}</div>
            <div>Selected Exam: {exam || 'None'}</div>
            <div>Total Marks: {allMarks.length}</div>
            <div>Filtered Marks: {marks.length}</div>
            <div>User Type: {user?.UserType}</div>
          </div>
        )}
      </div>

      {/* Action Buttons for Teachers/Admin */}
      {(user.UserType === "Teacher" || user.UserType === "Admin") && (
        <>
          <div style={{
            display: 'flex',
            gap: '15px',
            marginBottom: '30px',
            flexWrap: 'wrap'
          }}>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              style={{
                padding: '12px 24px',
                backgroundColor: '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '1rem',
                transition: 'all 0.3s'
              }}
            >
              {showAddForm ? '✖ Cancel' : '➕ Add New Result'}
            </button>

            <button
              onClick={() => setShowNewExamForm(!showNewExamForm)}
              style={{
                padding: '12px 24px',
                backgroundColor: '#2196F3',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '1rem',
                transition: 'all 0.3s'
              }}
            >
              {showNewExamForm ? '✖ Cancel' : '📝 Create New Exam'}
            </button>
          </div>

          {/* New Exam Form */}
          {showNewExamForm && (
            <div style={{
              backgroundColor: '#f0f8ff',
              padding: '25px',
              borderRadius: '12px',
              marginBottom: '30px',
              border: '2px solid #2196F3'
            }}>
              <h3 style={{marginBottom: '20px', color: '#2196F3', fontSize: '1.3rem'}}>
                Create New Exam
              </h3>
              <form onSubmit={handleAddExam}>
                <div style={{marginBottom: '20px'}}>
                  <label style={{display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#333'}}>
                    Exam Name *
                  </label>
                  <input
                    type="text"
                    value={newExamName}
                    onChange={(e) => setNewExamName(e.target.value)}
                    placeholder="e.g., Mid-Term, Final, Unit Test 1"
                    required
                    style={{
                      width: '100%',
                      maxWidth: '400px',
                      padding: '12px',
                      borderRadius: '8px',
                      border: '2px solid #2196F3',
                      fontSize: '1rem'
                    }}
                  />
                </div>

                <div style={{display: 'flex', gap: '10px'}}>
                  <button
                    type="submit"
                    style={{
                      padding: '12px 24px',
                      backgroundColor: '#2196F3',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                      fontSize: '1rem'
                    }}
                  >
                    Create Exam
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowNewExamForm(false);
                      setNewExamName("");
                    }}
                    style={{
                      padding: '12px 24px',
                      backgroundColor: '#f44336',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '1rem'
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Add Result Form */}
          {showAddForm && (
            <div style={{
              backgroundColor: '#f0fff4',
              padding: '25px',
              borderRadius: '12px',
              marginBottom: '30px',
              border: '2px solid #4CAF50'
            }}>
              <h3 style={{marginBottom: '20px', color: '#4CAF50', fontSize: '1.3rem'}}>
                Add New Result
              </h3>
              <form onSubmit={handleAddResult}>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '20px',
                  marginBottom: '20px'
                }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#333' }}>
                      REG Number *
                    </label>
                    <input
                      type="text"
                      value={newResult.REG}
                      onChange={(e) => handleNewResultChange('REG', e.target.value.toUpperCase())}
                      placeholder="e.g., STU001"
                      required
                      style={{width: '100%', padding: '10px', borderRadius: '6px', border: '2px solid #FDB5AB'}}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#333' }}>
                      Class *
                    </label>
                    <select
                      value={newResult.Class}
                      onChange={(e) => handleNewResultChange('Class', e.target.value)}
                      required
                      style={{width: '100%', padding: '10px', borderRadius: '6px', border: '2px solid #FDB5AB'}}
                    >
                      <option value="">-- Select Class --</option>
                      {availableClasses.map(cls => (
                        <option key={cls} value={cls}>Class {cls}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#333' }}>
                      Subject *
                    </label>
                    <select
                      value={newResult.Subject}
                      onChange={(e) => handleNewResultChange('Subject', e.target.value)}
                      required
                      style={{width: '100%', padding: '10px', borderRadius: '6px', border: '2px solid #FDB5AB'}}
                    >
                      <option value="">-- Select Subject --</option>
                      {subjects.map(sub => (
                        <option key={sub} value={sub}>{sub}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#333' }}>
                      Exam *
                    </label>
                    <select
                      value={newResult.Exam}
                      onChange={(e) => handleNewResultChange('Exam', e.target.value)}
                      required
                      style={{width: '100%', padding: '10px', borderRadius: '6px', border: '2px solid #FDB5AB'}}
                    >
                      <option value="">-- Select Exam --</option>
                      {exams.map(ex => (
                        <option key={ex._id} value={ex.ExamName}>{ex.ExamName}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#333' }}>
                      Marks Obtained (0-100) *
                    </label>
                    <input
                      type="number"
                      value={newResult.MarksObtained}
                      onChange={(e) => handleNewResultChange('MarksObtained', e.target.value)}
                      placeholder="0-100"
                      min="0"
                      max="100"
                      required
                      style={{width: '100%', padding: '10px', borderRadius: '6px', border: '2px solid #FDB5AB'}}
                    />
                  </div>

                  <div style={{gridColumn: '1 / -1'}}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#333' }}>
                      Remarks
                    </label>
                    <textarea
                      value={newResult.Remarks}
                      onChange={(e) => handleNewResultChange('Remarks', e.target.value)}
                      placeholder="Optional remarks"
                      rows="2"
                      style={{width: '100%', padding: '10px', borderRadius: '6px', border: '2px solid #FDB5AB'}}
                    />
                  </div>
                </div>

                <div style={{display: 'flex', gap: '10px'}}>
                  <button 
                    type="submit"
                    style={{
                      padding: '12px 24px',
                      backgroundColor: '#4CAF50',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                      fontSize: '1rem'
                    }}
                  >
                    Add Result
                  </button>
                  <button 
                    type="button"
                    onClick={() => {
                      setShowAddForm(false);
                      setNewResult({
                        REG: "",
                        Class: "",
                        Subject: "",
                        MarksObtained: "",
                        Exam: "",
                        Remarks: ""
                      });
                    }}
                    style={{
                      padding: '12px 24px',
                      backgroundColor: '#f44336',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '1rem'
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}
        </>
      )}

      {/* Marks Table */}
      <div className="marks-table" style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
      }}>
        {user.UserType === "Student" && (
          <>
            {exam ? (
              <table style={{width: '100%', borderCollapse: 'collapse'}}>
                <thead>
                  <tr style={{backgroundColor: '#FE6D36', color: 'white'}}>
                    <th style={{padding: '15px', textAlign: 'left'}}>REG.NO</th>
                    <th style={{padding: '15px', textAlign: 'left'}}>Class</th>
                    <th style={{padding: '15px', textAlign: 'left'}}>Subject</th>
                    <th style={{padding: '15px', textAlign: 'left'}}>Marks</th>
                    <th style={{padding: '15px', textAlign: 'left'}}>Remarks</th>
                    <th style={{padding: '15px', textAlign: 'left'}}>Exam</th>
                  </tr>
                </thead>
                <tbody>
                  {marks.filter(m => m.REG === user_REG && m.Exam === exam).length > 0 ? (
                    marks.filter(m => m.REG === user_REG && m.Exam === exam).map((data, idx) => (
                      <tr key={`${data._id || idx}`} style={{
                        borderBottom: '1px solid #eee',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9f9f9'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                      >
                        <td style={{padding: '15px'}}>{data.REG}</td>
                        <td style={{padding: '15px'}}>{data.Class}</td>
                        <td style={{padding: '15px'}}>{data.Subject}</td>
                        <td style={{padding: '15px', fontWeight: 'bold', color: data.MarksObtained >= 60 ? '#4CAF50' : '#f44336'}}>
                          {data.MarksObtained}
                        </td>
                        <td style={{padding: '15px'}}>{data.Remarks || '-'}</td>
                        <td style={{padding: '15px'}}>{data.Exam}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" style={{textAlign: 'center', padding: '40px', color: '#666'}}>
                        No marks found for {exam}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            ) : (
              <div style={{textAlign: 'center', padding: '40px', color: '#666'}}>
                Please select an exam to view your marks
              </div>
            )}
          </>
        )}

        {(user.UserType === "Teacher" || user.UserType === "Admin") && (
          <>
            {(classes || exam || search) ? (
              <table style={{width: '100%', borderCollapse: 'collapse'}}>
                <thead>
                  <tr style={{backgroundColor: '#FE6D36', color: 'white'}}>
                    <th style={{padding: '15px', textAlign: 'left'}}>REG.NO</th>
                    <th style={{padding: '15px', textAlign: 'left'}}>Class</th>
                    <th style={{padding: '15px', textAlign: 'left'}}>Subject</th>
                    <th style={{padding: '15px', textAlign: 'left'}}>Marks</th>
                    <th style={{padding: '15px', textAlign: 'left'}}>Remarks</th>
                    <th style={{padding: '15px', textAlign: 'left'}}>Exam</th>
                    <th style={{padding: '15px', textAlign: 'left'}}>EDIT</th>
                  </tr>
                </thead>
                <tbody>
                  {marks.length > 0 ? (
                    marks.map((data, index) => {
                      const editKey = `${data.REG}-${data.Subject}-${data.Exam}`;
                      const isEditing = editingKey === editKey;
                      
                      return (
                        <tr key={`${data._id || index}`} style={{
                          borderBottom: '1px solid #eee',
                          transition: 'background-color 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9f9f9'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                        >
                          <td style={{padding: '15px'}}>{data.REG}</td>
                          <td style={{padding: '15px'}}>{data.Class}</td>
                          <td style={{padding: '15px'}}>{data.Subject}</td>
                          <td style={{padding: '15px'}}>
                            {isEditing ? (
                              <input
                                type="number"
                                value={editData?.MarksObtained || ''}
                                onChange={(e) => handleEditChange('MarksObtained', e.target.value)}
                                style={{width: '80px', padding: '6px', borderRadius: '4px', border: '2px solid #FE6D36'}}
                                min="0"
                                max="100"
                              />
                            ) : (
                              <span style={{
                                fontWeight: 'bold',
                                color: data.MarksObtained >= 60 ? '#4CAF50' : '#f44336'
                              }}>
                                {data.MarksObtained}
                              </span>
                            )}
                          </td>
                          <td style={{padding: '15px'}}>
                            {isEditing ? (
                              <input
                                type="text"
                                value={editData?.Remarks || ''}
                                onChange={(e) => handleEditChange('Remarks', e.target.value)}
                                style={{width: '150px', padding: '6px', borderRadius: '4px', border: '2px solid #FE6D36'}}
                              />
                            ) : (
                              data.Remarks || '-'
                            )}
                          </td>
                          <td style={{padding: '15px'}}>{data.Exam}</td>
                          <td style={{padding: '15px'}}>
                            {isEditing ? (
                              <div style={{display: 'flex', gap: '5px'}}>
                                <button 
                                  onClick={handleSaveEdit}
                                  style={{
                                    padding: '6px 12px',
                                    backgroundColor: '#4CAF50',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontSize: '0.85rem'
                                  }}
                                >
                                  Save
                                </button>
                                <button 
                                  onClick={handleCancelEdit}
                                  style={{
                                    padding: '6px 12px',
                                    backgroundColor: '#f44336',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontSize: '0.85rem'
                                  }}
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <button 
                                onClick={() => handleEdit(data)}
                                style={{
                                  padding: '6px 16px',
                                  backgroundColor: '#1025a1',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  fontSize: '0.85rem',
                                  fontWeight: '600'
                                }}
                              >
                                Edit
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="7" style={{textAlign: 'center', padding: '40px', color: '#666'}}>
                        No marks found for the selected filters
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            ) : (
              <div style={{textAlign: 'center', padding: '40px', color: '#666'}}>
                Please select filters to view marks
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default Marks;
