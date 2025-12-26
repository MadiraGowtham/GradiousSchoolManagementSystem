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

        await loadInitialData();
      } else {
        // Fallback to localStorage
        const email = localStorage.getItem('Email');
        const userType = localStorage.getItem('UserType');
        if (email && userType) {
          setUser({
            Email: email,
            UserType: userType,
            Name: localStorage.getItem('UserName') || 'User'
          });
          await loadInitialData();
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
        setUser({
          Email: email,
          UserType: userType,
          Name: localStorage.getItem('UserName') || 'User'
        });
        await loadInitialData();
      }
    } finally {
      setLoading(false);
    }
  };

  const loadInitialData = async () => {
    try {
      // Load classes
      const classesRes = await timetableAPI.getAll();
      if (classesRes.success) {
        const classNumbers = classesRes.data.map(c => c.Class);
        setAvailableClasses(classNumbers);
      }

      // Load subjects from classes
      if (classesRes.success && classesRes.data.length > 0) {
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
        setSubjects(Array.from(allSubjects));
      }
    
      // Load exams from database
      const examsRes = await examAPI.getAll();
      if (examsRes.success) {
        setExams(examsRes.data || []);
      }
    } catch (error) {
      console.error('Error loading initial data:', error);
    }
  };

  const loadMarks = async () => {
    try {
      const filters = {};
      
      // For students, always filter by their REG
      if (user?.UserType === 'Student' && profile?.REG) {
        filters.reg = profile.REG;
      }
      
      // For teachers/admins, apply selected filters
      if (user?.UserType !== 'Student') {
        if (classes) {
          filters.class = classes; // Pass class to backend
        }
        if (exam) {
          filters.exam = exam;
        }
        if (search) {
          filters.reg = search;
        }
      }
      
      const res = await marksAPI.getAll(filters);
      if (res.success) {
        setMarks(res.data || []);
      }
    } catch (error) {
      console.error('Error loading marks:', error);
      setMarks([]);
    }
  };

  // Reload marks when filters change
  useEffect(() => {
    if (user) {
      loadMarks();
    }
  }, [user, profile, classes, exam, search]);

  const handleEdit = (data) => {
    const editKey = `${data.REG}-${data.Subject}-${data.Exam}`;
    setEditingKey(editKey);
    setEditData({
      REG: data.REG,
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

  const handleNewResultChange = (field, value) => {
    setNewResult(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddResult = async (e) => {
    e.preventDefault();
    
    if (!newResult.REG || !newResult.Subject || !newResult.MarksObtained || !newResult.Exam) {
      alert("Please fill all required fields");
      return;
    }

    const marksNum = parseInt(newResult.MarksObtained);
    if (isNaN(marksNum) || marksNum < 0 || marksNum > 100) {
      alert("Marks must be between 0 and 100");
      return;
    }

    try {
      const res = await marksAPI.create({
        REG: newResult.REG,
        Subject: newResult.Subject,
        MarksObtained: marksNum,
        Exam: newResult.Exam,
        Remarks: newResult.Remarks || ""
      });

      if (res.success) {
        await loadMarks();
        alert("Result added successfully!");
        setNewResult({
          REG: "",
          Subject: "",
          MarksObtained: "",
          Exam: "",
          Remarks: ""
        });
        setShowAddForm(false);
      }
    } catch (error) {
      console.error('Error adding result:', error);
      alert(error.message || "Failed to add result");
    }
  };

  const handleAddNewExam = async (e) => {
    e.preventDefault();
    
    const trimmedExamName = newExamName.trim();
    
    if (!trimmedExamName) {
      alert("Please enter an exam name");
      return;
    }

    try {
      const res = await examAPI.create({
        ExamName: trimmedExamName,
        Description: ''
      });
      
      if (res.success) {
        setExams(prev => [...prev, res.data]);
        alert(`Exam "${trimmedExamName}" created successfully!`);
        setNewExamName("");
        setShowNewExamForm(false);
      }
    } catch (error) {
      console.error('Error creating exam:', error);
      alert(error.message || "Failed to create exam");
    }
  };

  const getAllExams = () => {
    const examNames = exams.map(e => e.ExamName);
    const dbExams = [...new Set(marks.map(m => m.Exam))];
    const allExams = [...new Set([...examNames, ...dbExams])];
    return allExams.sort();
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontSize: '1.2rem',
        color: '#FE6D36'
      }}>
        Loading...
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontSize: '1.2rem',
        color: '#FD3012'
      }}>
        Please log in to view marks
      </div>
    );
  }

  const user_REG = profile?.REG || user.REG;

  return (
    <div className="marks">
      <h1>Examination Marks</h1>
      
      {user.UserType === "Student" && (
        <div className="exam-selection">
          <select onChange={(e) => setExam(e.target.value)} value={exam}>
            <option value="">Select Exam</option>
            {getAllExams().map((examName) => (
              <option key={examName} value={examName}>
                {examName}
              </option>
            ))}
          </select>
        </div>
      )}

      {(user.UserType === "Teacher" || user.UserType === "Admin") && (
        <>
          <div className="exam-selection">
            <select onChange={(e) => setClasses(e.target.value)} value={classes}>
              <option value="">Select Grade</option>
              {availableClasses.map((gradeNum) => (
                <option key={gradeNum} value={gradeNum}>
                  Class {gradeNum}
                </option>
              ))}
            </select>
            <select onChange={(e) => setExam(e.target.value)} value={exam}>
              <option value="">Select Exam</option>
              {getAllExams().map((examName) => (
                <option key={examName} value={examName}>
                  {examName}
                </option>
              ))}
            </select>
            <button 
              onClick={() => setShowNewExamForm(!showNewExamForm)}
              style={{
                marginLeft: '10px', 
                padding: '8px 16px',
                backgroundColor: '#9C27B0',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: '600'
              }}
            >
              {showNewExamForm ? 'Cancel' : '+ New Exam'}
            </button>
            <input 
              type="text" 
              placeholder="Search by Registration Number" 
              onChange={(e) => setSearch(e.target.value)} 
              value={search} 
              style={{ marginLeft: '10px', padding: '8px 12px', borderRadius: '6px', border: '1px solid #ddd' }}
            />
            <button 
              onClick={() => {
                setClasses("");
                setExam("");
                setSearch("");
              }}
              style={{marginLeft: '10px', padding: '8px 16px', backgroundColor: '#f44336', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer'}}
            >
              Clear Filters
            </button>
            {classes && (
              <button 
                onClick={() => setShowAddForm(!showAddForm)}
                style={{
                  marginLeft: '10px', 
                  padding: '8px 16px',
                  backgroundColor: '#4CAF50',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                {showAddForm ? 'Hide Form' : '+ Add New Result'}
              </button>
            )}
          </div>

          {showNewExamForm && (
            <div style={{
              backgroundColor: '#f3e5f5',
              padding: '20px',
              margin: '20px 0',
              borderRadius: '8px',
              border: '2px solid #9C27B0'
            }}>
              <h3 style={{marginTop: 0, color: '#9C27B0'}}>Create New Exam</h3>
              <form onSubmit={handleAddNewExam} style={{display: 'flex', gap: '10px', alignItems: 'flex-end'}}>
                <div style={{flex: 1}}>
                  <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>
                    Exam Name <span style={{color: 'red'}}>*</span>
                  </label>
                  <input
                    type="text"
                    value={newExamName}
                    onChange={(e) => setNewExamName(e.target.value)}
                    placeholder="e.g., Mid2, Final2024, Quiz1"
                    required
                    style={{width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #9C27B0'}}
                  />
                </div>
                <button 
                  type="submit"
                  style={{
                    padding: '10px 24px',
                    backgroundColor: '#9C27B0',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: 'bold'
                  }}
                >
                  Create Exam
                </button>
              </form>
            </div>
          )}

          {showAddForm && classes && (
            <div style={{
              backgroundColor: '#FEFEFE',
              padding: '25px',
              margin: '20px 0',
              borderRadius: '10px',
              border: '2px solid #FE6D36',
              boxShadow: '0 4px 12px rgba(254, 109, 54, 0.15)'
            }}>
              <h3 style={{ marginTop: 0, marginBottom: '20px', color: '#FD3012' }}>Add New Result for Class {classes}</h3>
              <form onSubmit={handleAddResult}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#333' }}>
                      Registration Number (REG) <span style={{color: 'red'}}>*</span>
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
                      Subject <span style={{color: 'red'}}>*</span>
                    </label>
                    <select
                      value={newResult.Subject}
                      onChange={(e) => handleNewResultChange('Subject', e.target.value)}
                      required
                      style={{width: '100%', padding: '10px', borderRadius: '6px', border: '2px solid #FDB5AB'}}
                    >
                      <option value="">Select Subject</option>
                      {subjects.map(subject => (
                        <option key={subject} value={subject}>
                          {subject}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#333' }}>
                      Exam <span style={{color: 'red'}}>*</span>
                    </label>
                    <select
                      value={newResult.Exam}
                      onChange={(e) => handleNewResultChange('Exam', e.target.value)}
                      required
                      style={{width: '100%', padding: '10px', borderRadius: '6px', border: '2px solid #FDB5AB'}}
                    >
                      <option value="">Select Exam</option>
                      {getAllExams().map(examName => (
                        <option key={examName} value={examName}>
                          {examName}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#333' }}>
                      Marks Obtained <span style={{color: 'red'}}>*</span>
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

      <div className="marks-table">
        {user.UserType === "Student" && exam && (
          <table>
            <thead>
              <tr>
                <th>REG.NO</th>
                <th>Grade</th>
                <th>Subject</th>
                <th>Marks</th>
                <th>Remarks</th>
                <th>Exam</th>
              </tr>
            </thead>
            <tbody>
              {marks.filter(m => m.REG === user_REG && m.Exam === exam).map((data, idx) => (
                <tr key={`${data._id || idx}`}>
                  <td>{data.REG}</td>
                  <td>{studentGrade?.ClassEnrolled || user.ClassEnrolled || 'N/A'}</td>
                  <td>{data.Subject}</td>
                  <td>{data.MarksObtained}</td>
                  <td>{data.Remarks || '-'}</td>
                  <td>{data.Exam}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {(user.UserType === "Teacher" || user.UserType === "Admin") && (classes || exam || search) && (
          <table>
            <thead>
              <tr>
                <th>REG.NO</th>
                <th>Grade</th>
                <th>Subject</th>
                <th>Marks</th>
                <th>Remarks</th>
                <th>Exam</th>
                <th>EDIT</th>
              </tr>
            </thead>
            <tbody>
              {marks.length > 0 ? (
                marks.map((data, index) => {
                  const editKey = `${data.REG}-${data.Subject}-${data.Exam}`;
                  const isEditing = editingKey === editKey;
                  
                  return (
                    <tr key={`${data._id || index}`}>
                      <td>{data.REG}</td>
                      <td>{data.ClassEnrolled || 'N/A'}</td>
                      <td>{data.Subject}</td>
                      <td>
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
                          data.MarksObtained
                        )}
                      </td>
                      <td>
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
                      <td>{data.Exam}</td>
                      <td>
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
        )}

        {user.UserType === "Student" && !exam && (
          <div style={{textAlign: 'center', padding: '40px', color: '#666'}}>
            Please select an exam to view your marks
          </div>
        )}

        {(user.UserType === "Teacher" || user.UserType === "Admin") && !classes && !exam && !search && (
          <div style={{textAlign: 'center', padding: '40px', color: '#666'}}>
            Please select filters to view marks
          </div>
        )}
      </div>
    </div>
  );
}

export default Marks;
