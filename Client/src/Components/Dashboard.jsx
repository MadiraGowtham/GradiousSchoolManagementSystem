import React, { useState, useEffect } from 'react';
import Timetable from './TimeTable.jsx';
import '../App.css';
import { useNavigate } from 'react-router-dom';
import { authAPI, announcementsAPI, timetableAPI, marksAPI, usersAPI, profileAPI } from '../services/api';

function Dashboard() {
  const navigate = useNavigate();  
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [studentGrade, setStudentGrade] = useState(null);
  const [teacherInfo, setTeacherInfo] = useState(null);
  const [studentTimetable, setStudentTimetable] = useState({});
  const [selectedClassNum, setSelectedClassNum] = useState("0");
  const [teacherTimetable, setTeacherTimetable] = useState(null);
  const [selectedAnnouncementClassNum, setSelectedAnnouncementClassNum] = useState("0");
  const [announcements, setAnnouncements] = useState([]);
  const [classes, setClasses] = useState([]);
  const [showAnnouncementForm, setShowAnnouncementForm] = useState(false);
  const [formAnnouncement, setFormAnnouncement] = useState({
    Title: '',
    Description: '',
    Visibility: 'All',
    Class: 0,
  });
  const [adminStats, setAdminStats] = useState({
    totalStudents: 0,
    totalTeachers: 0,
    totalClasses: 0,
    totalSubjects: 0,
    averageMarks: 0,
    totalAnnouncements: 0,
    activeStudents: 0,
    classDistribution: []
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
      
      // Fetch complete user profile from API
      const profileRes = await authAPI.getProfile();
      if (profileRes.success && profileRes.data) {
        const userData = profileRes.data;
        setUser(userData);
        localStorage.setItem('UserName', userData.Name || 'User');
        localStorage.setItem('UserID', userData.UserID || '');
        localStorage.setItem('UserType', userData.UserType || '');

        // Set role-specific data
        if (userData.UserType === 'Student' && userData.ClassEnrolled) {
          setStudentGrade({ ClassEnrolled: userData.ClassEnrolled });
        } else if (userData.UserType === 'Teacher') {
          if (userData.ClassAssigned && userData.Subject) {
            setTeacherInfo({
              ClassAssigned: userData.ClassAssigned,
              Subject: userData.Subject
            });
          }
        }

        // Load classes and announcements
        await loadClasses();
        await loadAnnouncements();
        
        if (userData.UserType === 'Admin') {
          await loadAdminStats();
        }
      } else {
        console.error('Failed to load user profile');
        navigate('/');
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      // Fallback to localStorage
      const email = localStorage.getItem('Email');
      const userType = localStorage.getItem('UserType');
      const userName = localStorage.getItem('UserName');
      if (email && userType) {
        setUser({
          Email: email,
          UserType: userType,
          Name: userName || 'User',
          UserID: localStorage.getItem('UserID') || ''
        });
        await loadClasses();
        await loadAnnouncements();
      } else {
        navigate('/');
      }
    } finally {
      setLoading(false);
    }
  };

  const loadClasses = async () => {
    try {
      const res = await timetableAPI.getAll();
      if (res.success) {
        setClasses(res.data || []);
      }
    } catch (error) {
      console.error('Error loading classes:', error);
    }
  };

  const loadAnnouncements = async () => {
    try {
      // Don't apply filters in the API call - load all announcements
      // We'll filter them in the component based on user role
      const res = await announcementsAPI.getAll();
      if (res.success) {
        setAnnouncements(res.data || []);
      }
    } catch (error) {
      console.error('Error loading announcements:', error);
    }
  };

  const loadAdminStats = async () => {
    try {
      const [studentsRes, teachersRes, classesRes, announcementsRes, marksRes] = await Promise.all([
        usersAPI.getAll('Student'),
        usersAPI.getAll('Teacher'),
        timetableAPI.getAll(),
        announcementsAPI.getAll(),
        marksAPI.getAll()
      ]);

      const totalStudents = studentsRes.success ? studentsRes.data.length : 0;
      const totalTeachers = teachersRes.success ? teachersRes.data.length : 0;
      const totalClasses = classesRes.success ? classesRes.data.length : 0;
      const totalAnnouncements = announcementsRes.success ? announcementsRes.data.length : 0;
      
      let averageMarks = 0;
      if (marksRes.success && marksRes.data.length > 0) {
        const total = marksRes.data.reduce((sum, m) => sum + (m.MarksObtained || 0), 0);
        averageMarks = (total / marksRes.data.length).toFixed(2);
      }

      const activeStudents = totalStudents;
      
      const classDistribution = classesRes.success 
        ? classesRes.data.map(cls => ({
          class: cls.Class,
            students: Math.floor(Math.random() * 20) + 10
          }))
        : [];

      setAdminStats({
        totalStudents,
        totalTeachers,
        totalClasses,
        totalSubjects: 4,
        averageMarks,
        totalAnnouncements,
        activeStudents,
        classDistribution
      });
    } catch (error) {
      console.error('Error loading admin stats:', error);
    }
  };

  useEffect(() => {
    if (user?.UserType === "Student" && studentGrade) {
      loadStudentTimetable(studentGrade.ClassEnrolled);
    }
  }, [user, studentGrade]);

  useEffect(() => {
    if ((user?.UserType === "Teacher" || user?.UserType === "Admin") && selectedClassNum !== "0") {
      loadTeacherTimetable(parseInt(selectedClassNum));
    } else if (selectedClassNum === "0") {
      setTeacherTimetable(null);
    }
  }, [selectedClassNum, user]);

  useEffect(() => {
    loadAnnouncements();
  }, [selectedAnnouncementClassNum]);

  const loadStudentTimetable = async (classNum) => {
    try {
      const res = await timetableAPI.getByClass(classNum);
      if (res.success && res.data && res.data.TimeTable) {
        const timetable = res.data.TimeTable;
        if (timetable instanceof Map) {
          const obj = {};
          timetable.forEach((value, key) => {
            obj[key] = Array.isArray(value) ? value : Array.from(value);
          });
          setStudentTimetable(obj);
        } else {
          setStudentTimetable(timetable);
        }
      }
    } catch (error) {
      console.error('Error loading student timetable:', error);
    }
  };

  const loadTeacherTimetable = async (classNum) => {
    try {
      const res = await timetableAPI.getByClass(classNum);
      if (res.success && res.data && res.data.TimeTable) {
        const timetable = res.data.TimeTable;
        if (timetable instanceof Map) {
          const obj = {};
          timetable.forEach((value, key) => {
            obj[key] = Array.isArray(value) ? value : Array.from(value);
          });
          setTeacherTimetable(obj);
        } else {
          setTeacherTimetable(timetable);
        }
      } else {
        setTeacherTimetable(null);
      }
    } catch (error) {
      console.error('Error loading teacher timetable:', error);
      setTeacherTimetable(null);
    }
  };

  const getAvailableClasses = () => {
    if (user?.UserType === "Admin") {
      return classes;
    } else if (user?.UserType === "Teacher" && teacherInfo) {
      return classes.filter(cls => teacherInfo.ClassAssigned?.includes(cls.Class));
    }
    return [];
  };

  const availableClasses = getAvailableClasses();

  const getTeacherName = (teacherID) => {
    return teacherID || 'Teacher';
  };

  const handleEdit = async (day, idx, updatedData) => {
    if (user?.UserType !== "Admin" || !teacherTimetable) return;
    
    const updatedTimetable = { ...teacherTimetable };
    updatedTimetable[day] = [...updatedTimetable[day]];
    updatedTimetable[day][idx] = updatedData;
    
    try {
      await timetableAPI.update(parseInt(selectedClassNum), { TimeTable: updatedTimetable });
      setTeacherTimetable(updatedTimetable);
      alert("Timetable updated successfully!");
    } catch (error) {
      console.error('Error updating timetable:', error);
      alert("Failed to update timetable");
    }
  };

  const filteredAnnouncements = announcements.filter(announcement => {
    // For Students - only show relevant announcements
    if (user?.UserType === "Student" && studentGrade) {
      if (announcement.Visibility === "All") return true;
      if (announcement.Visibility === "Student" && announcement.Class === studentGrade.ClassEnrolled) {
        return true;
      }
      if (announcement.Visibility === "Class" && announcement.Class === studentGrade.ClassEnrolled) {
        return true;
      }
      return false;
    }

    // For Teachers and Admins
    if (user?.UserType === "Teacher" || user?.UserType === "Admin") {
      // If "All Classes" is selected (value "0")
      if (selectedAnnouncementClassNum === "0") {
        // Admin sees everything
        if (user?.UserType === "Admin") {
          return true;
        }
        // Teacher sees "All" visibility announcements and announcements for their assigned classes
        if (user?.UserType === "Teacher" && teacherInfo) {
          if (announcement.Visibility === "All") return true;
          // Show announcements for teacher's assigned classes
          if (announcement.Class && teacherInfo.ClassAssigned?.includes(announcement.Class)) {
            return true;
          }
          return false;
        }
      }
      
      // If a specific class is selected
      if (selectedAnnouncementClassNum !== "0") {
        const selectedClass = parseInt(selectedAnnouncementClassNum);
        
        // Admin can see all announcements for selected class
        if (user?.UserType === "Admin") {
          if (announcement.Visibility === "All") return true;
          if (announcement.Class === selectedClass) return true;
          return false;
        }
        
        // Teacher can see announcements for selected class if it's in their assigned classes
        if (user?.UserType === "Teacher" && teacherInfo) {
          if (!teacherInfo.ClassAssigned?.includes(selectedClass)) {
            return false;
          }
          if (announcement.Visibility === "All") return true;
          if (announcement.Class === selectedClass) return true;
          return false;
        }
      }
    }

    return false;
  });

  const handleFormChange = e => {
    const { name, value } = e.target;
    setFormAnnouncement(prev => ({
      ...prev,
      [name]: name === 'Class' ? (parseInt(value) || 0) : value
    }));
  };

  const handleAddAnnouncement = async e => {
    e.preventDefault();
    const { Title, Description, Visibility, Class } = formAnnouncement;
    
    if (!Title.trim() || !Description.trim()) {
      alert("Please fill all required fields");
      return;
    }

    if ((Visibility === 'Class' || Visibility === 'Student') && (!Class || Class === 0)) {
      alert("Please select a class");
      return;
    }
    
    try {
      const res = await announcementsAPI.create({
        Title,
        Description,
        Visibility,
        Class: Visibility === 'All' ? undefined : Class
      });
    
      if (res.success) {
        setAnnouncements(prev => [...prev, res.data]);
        alert("Announcement added successfully");
        setFormAnnouncement({ Title: '', Description: '', Visibility: 'All', Class: 0 });
        setShowAnnouncementForm(false);
      }
    } catch (error) {
      console.error('Error adding announcement:', error);
      alert("Failed to add announcement");
    }
  };

  const handleDeleteAnnouncement = async (announcementId) => {
    // Confirm deletion
    if (!window.confirm('Are you sure you want to delete this announcement?')) {
      return;
    }

    try {
      const res = await announcementsAPI.delete(announcementId);
      
      if (res.success) {
        // Remove the announcement from state
        setAnnouncements(prev => prev.filter(ann => ann._id !== announcementId && ann.id !== announcementId));
        alert('Announcement deleted successfully');
        
        // Reload announcements to ensure sync
        await loadAnnouncements();
        
        // Reload admin stats if admin
        if (user?.UserType === 'Admin') {
          await loadAdminStats();
        }
      } else {
        throw new Error(res.message || 'Failed to delete announcement');
      }
    } catch (error) {
      console.error('Error deleting announcement:', error);
      alert(error.message || 'Failed to delete announcement');
    }
  };

  const teachersList = [];

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
        color: '#1025a1'
      }}>
        User not found. Please log in again.
      </div>
    );
  }

  return (
    <div className='dashboard-container'>
      <h1>Welcome {user.Name || user.Email}!</h1>
      {user.UserType === "Student" && studentGrade && (
        <h3 style={{ margin: "-35px 0px 70px 0px" }}>Grade: {studentGrade.ClassEnrolled}</h3>
      )}
      {user.UserType === "Teacher" && teacherInfo && (
        <h3 style={{ margin: "-35px 0px 70px 0px" }}>Subject: {teacherInfo.Subject}</h3>
      )}
      {user.UserType === "Admin" && (
        <h3 style={{ margin: "10px 0px 70px 0px" }}>Administrator</h3>
      )}
      
      {/* Admin Statistics Dashboard */}
      {user.UserType === "Admin" && (
        <div className="admin-stats-section" style={{
          marginBottom: '40px',
          padding: '20px',
          backgroundColor: '#FEFEFE',
          borderRadius: '8px'
        }}>
          <h2 style={{ marginBottom: '20px' }}>School Overview</h2>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '20px',
            marginBottom: '30px'
          }}>
            <div className="stat-card" style={{
              backgroundColor: '#FEFEFE',
              padding: '20px',
              borderRadius: '8px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              textAlign: 'center'
            }}>
              <h3 style={{ color: '#FE6D36', margin: '0 0 10px 0' }}>{adminStats.totalStudents}</h3>
              <p style={{ margin: 0, color: '#666' }}>Total Students</p>
            </div>
            
            <div className="stat-card" style={{
              backgroundColor: '#FEFEFE',
              padding: '20px',
              borderRadius: '8px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              textAlign: 'center'
            }}>
              <h3 style={{ color: '#4CAF50', margin: '0 0 10px 0' }}>{adminStats.activeStudents}</h3>
              <p style={{ margin: 0, color: '#666' }}>Active Students</p>
            </div>
            
            <div className="stat-card" style={{
              backgroundColor: '#FEFEFE',
              padding: '20px',
              borderRadius: '8px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              textAlign: 'center'
            }}>
              <h3 style={{ color: '#FF9800', margin: '0 0 10px 0' }}>{adminStats.totalTeachers}</h3>
              <p style={{ margin: 0, color: '#666' }}>Total Teachers</p>
            </div>
            
            <div className="stat-card" style={{
              backgroundColor: '#FEFEFE',
              padding: '20px',
              borderRadius: '8px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              textAlign: 'center'
            }}>
              <h3 style={{ color: '#9C27B0', margin: '0 0 10px 0' }}>{adminStats.totalClasses}</h3>
              <p style={{ margin: 0, color: '#666' }}>Total Classes</p>
            </div>
            
            <div className="stat-card" style={{
              backgroundColor: '#FEFEFE',
              padding: '20px',
              borderRadius: '8px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              textAlign: 'center'
            }}>
              <h3 style={{ color: '#F44336', margin: '0 0 10px 0' }}>{adminStats.totalSubjects}</h3>
              <p style={{ margin: 0, color: '#666' }}>Total Subjects</p>
            </div>
            
            <div className="stat-card" style={{
              backgroundColor: '#FEFEFE',
              padding: '20px',
              borderRadius: '8px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              textAlign: 'center'
            }}>
              <h3 style={{ color: '#00BCD4', margin: '0 0 10px 0' }}>{adminStats.averageMarks}%</h3>
              <p style={{ margin: 0, color: '#666' }}>Average Marks</p>
            </div>
            
            <div className="stat-card" style={{
              backgroundColor: '#FEFEFE',
              padding: '20px',
              borderRadius: '8px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              textAlign: 'center'
            }}>
              <h3 style={{ color: '#607D8B', margin: '0 0 10px 0' }}>{adminStats.totalAnnouncements}</h3>
              <p style={{ margin: 0, color: '#666' }}>Total Announcements</p>
            </div>
          </div>

          {/* Class Distribution */}
          <div style={{
            backgroundColor: '#FEFEFE',
            padding: '20px',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
          </div>
        </div>
      )}

      <div className='dashboard-data'>
        <div className='dashboard-data-container'>
          {/* Student timetable */}
          {user.UserType === "Student" && studentGrade && Object.keys(studentTimetable).length > 0 && (
            <div className='student-timetable'>
              <h2>My Timetable</h2>
              <Timetable
                timetable={studentTimetable}
                getTeacherName={getTeacherName}
                userType="Student"
              />
            </div>
          )}

          {user.UserType === "Student" && (!studentGrade || Object.keys(studentTimetable).length === 0) && (
            <p>No timetable available</p>
          )}

          {/* Teacher/Admin timetable */}
          {(user.UserType === "Teacher" || user.UserType === "Admin") && (
            <div className="teacher-timetable">
              <h2>{user.UserType === "Admin" ? "Manage Timetables" : "View Timetables"}</h2>
              <div className="filter-class">
                <label>
                  {user.UserType === "Admin" ? "Select Class: " : "Filter by Class: "}
                </label>
                <select onChange={e => setSelectedClassNum(e.target.value)} value={selectedClassNum}>
                  <option value="0">Select Class</option>
                  {availableClasses.map(cls => (
                    <option key={cls.Class} value={cls.Class}>Class {cls.Class}</option>
                  ))}
                </select>
              </div>
              
              {selectedClassNum !== "0" && teacherTimetable && (
                <Timetable
                  timetable={teacherTimetable}
                  getTeacherName={getTeacherName}
                  userType={user.UserType}
                  onEdit={handleEdit}
                  teachersList={teachersList}
                />
              )}
              
              {selectedClassNum !== "0" && !teacherTimetable && (
                <p>No timetable available for the selected class.</p>
              )}
              
              {selectedClassNum === "0" && (
                <p>Please select a class to view timetable.</p>
              )}
            </div>
          )}
        </div>

        {/* Announcements Section */}
        <div className='announcement-section'>
          <div className='announcement-header'>
            <h2>Announcements</h2>
            {(user.UserType === "Teacher" || user.UserType === "Admin") && (
              <div className="filter-class">
                <label>Filter by Class: </label>
                <select
                  onChange={e => setSelectedAnnouncementClassNum(e.target.value)}
                  value={selectedAnnouncementClassNum}
                >
                  <option value="0">All Classes</option>
                  {user.UserType === "Admin" 
                    ? classes.map(cls => (
                        <option key={cls.Class} value={cls.Class}>Class {cls.Class}</option>
                      ))
                    : availableClasses.map(cls => (
                        <option key={cls.Class} value={cls.Class}>Class {cls.Class}</option>
                      ))
                  }
                </select>
                <button onClick={() => setShowAnnouncementForm(true)}>Add Announcement</button>
              </div>
            )}
          </div>
          
          <div className='announcement-cards'>
            {filteredAnnouncements.length === 0 ? (
              <p>No announcements to display.</p>
            ) : (
              filteredAnnouncements.map((announcement, idx) => (
                <div key={announcement._id || announcement.id || idx} className='announcement-card'>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <h3>{announcement.Title}</h3>
                      <p>{announcement.Description}</p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                        <span>{new Date(announcement.LastUpdated).toLocaleDateString()}</span>
                        {announcement.Visibility !== 'All' && (
                          <span style={{ fontSize: '0.9em', color: '#666' }}>
                            (Class {announcement.Class})
                          </span>
                        )}
                      </div>
                    </div>
                    {(user.UserType === "Admin" || user.UserType === "Teacher") && (
                      <button
                        onClick={() => handleDeleteAnnouncement(announcement._id || announcement.id)}
                        style={{
                          background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          padding: '8px 16px',
                          cursor: 'pointer',
                          fontSize: '0.9rem',
                          fontWeight: '600',
                          marginLeft: '10px',
                          transition: 'all 0.3s ease',
                          boxShadow: '0 2px 8px rgba(239, 68, 68, 0.3)'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.4)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = '0 2px 8px rgba(239, 68, 68, 0.3)';
                        }}
                      >
                        🗑️ Delete
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Announcement Add Form */}
          {showAnnouncementForm && (user.UserType === "Teacher" || user.UserType === "Admin") && (
            <form className="announcement-form" onSubmit={handleAddAnnouncement}>
              <h3>Add Announcement</h3>
              <input
                type="text"
                name="Title"
                placeholder="Title"
                value={formAnnouncement.Title}
                onChange={handleFormChange}
                required
              />
              <textarea
                name="Description"
                placeholder="Description"
                value={formAnnouncement.Description}
                onChange={handleFormChange}
                required
              />
              <select name="Visibility" value={formAnnouncement.Visibility} onChange={handleFormChange}>
                <option value="All">All</option>
                <option value="Class">Class</option>
                <option value="Student">Student</option>
              </select>
              {(formAnnouncement.Visibility === "Class" || formAnnouncement.Visibility === "Student") && (
                <select
                  name="Class"
                  value={formAnnouncement.Class || '0'}
                  onChange={handleFormChange}
                  required
                >
                  <option value="0" disabled>Select Class</option>
                  {user.UserType === "Admin"
                    ? classes.map(cls => (
                        <option key={cls.Class} value={cls.Class}>Class {cls.Class}</option>
                      ))
                    : availableClasses.map(cls => (
                        <option key={cls.Class} value={cls.Class}>Class {cls.Class}</option>
                      ))
                  }
                </select>
              )}
              <div>
                <button type="submit">Submit</button>
                <button type="button" onClick={() => setShowAnnouncementForm(false)}>Cancel</button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;