import React, { useEffect, useState } from 'react';
import '../App.css';
import Card from './Card';
import { authAPI, usersAPI, timetableAPI, profileAPI } from '../services/api';

function Student({ Email }) {
    const userMail = Email || localStorage.getItem('Email');
    const [loading, setLoading] = useState(true);
    const [teacherInfoLoading, setTeacherInfoLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [teacherInfo, setTeacherInfo] = useState(null);
    const [userType, setUserType] = useState("Student");
    const [studentSearch, setStudentSearch] = useState("");
    const [studentClass, setStudentClass] = useState("");
    const [students, setStudents] = useState([]);
    const [teachers, setTeachers] = useState([]);
    const [availableClasses, setAvailableClasses] = useState([]);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [showEditForm, setShowEditForm] = useState(false);
    const [editingUserEmail, setEditingUserEmail] = useState(null);
    
    const [newStudent, setNewStudent] = useState({
        name: '',
        email: '',
        password: '',
        regNumber: '',
        classEnrolled: ''
    });

    const [newTeacher, setNewTeacher] = useState({
        name: '',
        email: '',
        password: '',
        regNumber: '',
        subject: '',
        classAssigned: []
    });

    const [editUser, setEditUser] = useState({
        userID: '',
        userType: '',
        name: '',
        email: '',
        password: '',
        regNumber: '',
        classEnrolled: '',
        classAssigned: [],
        subject: ''
    });

    useEffect(() => {
        loadUserData();
    }, [userMail]);

    useEffect(() => {
        // Only load users if:
        // 1. User data is loaded
        // 2. If teacher, wait for teacher info to load
        const isTeacher = user?.UserType === 'Teacher';
        const shouldLoadUsers = user && (!isTeacher || (isTeacher && !teacherInfoLoading));
        
        console.log('=== useEffect Check ===');
        console.log('User loaded:', !!user);
        console.log('Is Teacher:', isTeacher);
        console.log('Teacher Info Loading:', teacherInfoLoading);
        console.log('Should Load Users:', shouldLoadUsers);
        
        if (shouldLoadUsers) {
            loadUsers();
        }
    }, [userType, studentSearch, studentClass, user, teacherInfo, teacherInfoLoading]);

    const loadUserData = async () => {
        try {
            setLoading(true);
            const profileRes = await authAPI.getProfile();
            
            console.log('=== Loading User Data ===');
            console.log('Profile Response:', profileRes);
            
            if (profileRes.success && profileRes.data) {
                const userData = profileRes.data;
                setUser(userData);
                
                console.log('User Type:', userData.UserType);
                console.log('User REG:', userData.REG);
                
                if (userData.UserType === 'Teacher' && userData.REG) {
                    try {
                        setTeacherInfoLoading(true);
                        console.log('Fetching teacher info for REG:', userData.REG);
                        
                        const teacherRes = await profileAPI.getTeacherByREG(userData.REG);
                        console.log('Teacher Info Response:', teacherRes);
                        
                        if (teacherRes.success && teacherRes.data) {
                            setTeacherInfo(teacherRes.data);
                            console.log('Teacher Info Set:', teacherRes.data);
                            console.log('Assigned Classes:', teacherRes.data.ClassAssigned);
                        } else {
                            console.error('Failed to load teacher info:', teacherRes);
                        }
                    } catch (error) {
                        console.error('Error loading teacher info:', error);
                    } finally {
                        setTeacherInfoLoading(false);
                    }
                } else {
                    setTeacherInfoLoading(false);
                }

                await loadClasses();
            } else {
                // Fallback
                console.log('Using fallback - loading from localStorage');
                const email = localStorage.getItem('Email');
                const userType = localStorage.getItem('UserType');
                const regNumber = localStorage.getItem('REG');
                
                if (email && userType) {
                    const fallbackUser = {
                        Email: email,
                        UserType: userType,
                        Name: localStorage.getItem('UserName') || 'User',
                        REG: regNumber
                    };
                    setUser(fallbackUser);
                    
                    // If teacher, try to load teacher info
                    if (userType === 'Teacher' && regNumber) {
                        try {
                            setTeacherInfoLoading(true);
                            const teacherRes = await profileAPI.getTeacherByREG(regNumber);
                            if (teacherRes.success && teacherRes.data) {
                                setTeacherInfo(teacherRes.data);
                            }
                        } catch (error) {
                            console.error('Error loading teacher info from fallback:', error);
                        } finally {
                            setTeacherInfoLoading(false);
                        }
                    } else {
                        setTeacherInfoLoading(false);
                    }
                    
                    await loadClasses();
                }
            }
        } catch (error) {
            console.error('Error loading user data:', error);
            const email = localStorage.getItem('Email');
            const userType = localStorage.getItem('UserType');
            const regNumber = localStorage.getItem('REG');
            
            if (email && userType) {
                const fallbackUser = {
                    Email: email,
                    UserType: userType,
                    Name: localStorage.getItem('UserName') || 'User',
                    REG: regNumber
                };
                setUser(fallbackUser);
                
                // If teacher, try to load teacher info
                if (userType === 'Teacher' && regNumber) {
                    try {
                        setTeacherInfoLoading(true);
                        const teacherRes = await profileAPI.getTeacherByREG(regNumber);
                        if (teacherRes.success && teacherRes.data) {
                            setTeacherInfo(teacherRes.data);
                        }
                    } catch (error) {
                        console.error('Error loading teacher info from fallback:', error);
                    } finally {
                        setTeacherInfoLoading(false);
                    }
                } else {
                    setTeacherInfoLoading(false);
                }
                
                await loadClasses();
            }
        } finally {
            setLoading(false);
        }
    };

    const loadClasses = async () => {
        try {
            const res = await timetableAPI.getAll();
            if (res.success) {
                const classNumbers = res.data.map(c => c.Class);
                setAvailableClasses(classNumbers);
                console.log('Available Classes:', classNumbers);
            }
        } catch (error) {
            console.error('Error loading classes:', error);
        }
    };

    const loadUsers = async () => {
        console.log('=== loadUsers called ===');
        console.log('User:', user);
        console.log('UserType being loaded:', userType);
        console.log('Is Teacher?', user?.UserType === 'Teacher');
        console.log('Teacher Info:', teacherInfo);
        console.log('Teacher Info Loading:', teacherInfoLoading);
        
        try {
            if (userType === "Student") {
                const res = await usersAPI.getAll('Student');
                console.log('Students API Response:', res);
                
                if (res.success) {
                    let filtered = res.data || [];
                    console.log('All students:', filtered.length);

                    // Filter by name search
                    if (studentSearch) {
                        filtered = filtered.filter(u =>
                            u.Name?.toLowerCase().includes(studentSearch.toLowerCase())
                        );
                        console.log('After name filter:', filtered.length);
                    }

                    // For teachers, filter by assigned classes
                    if (user?.UserType === 'Teacher') {
                        console.log('Processing teacher filter...');
                        console.log('Teacher Info Available:', !!teacherInfo);
                        console.log('Teacher ClassAssigned:', teacherInfo?.ClassAssigned);
                        
                        if (!teacherInfo?.ClassAssigned || teacherInfo.ClassAssigned.length === 0) {
                            console.log('Teacher has no assigned classes - showing empty list');
                            setStudents([]);
                            return;
                        }
                        
                        console.log('Fetching class enrollment for each student...');
                        
                        // Use Promise.allSettled to handle individual failures gracefully
                        const studentsWithClassPromises = filtered.map(async (student) => {
                            try {
                                const profileRes = await profileAPI.getByUserID(student.UserID);
                                if (profileRes.success && profileRes.data?.REG) {
                                    const studentRes = await profileAPI.getStudentByREG(profileRes.data.REG);
                                    if (studentRes.success && studentRes.data) {
                                        console.log(`Student ${student.Name} - Class: ${studentRes.data.ClassEnrolled}`);
                                        return {
                                            ...student,
                                            ClassEnrolled: studentRes.data.ClassEnrolled
                                        };
                                    }
                                }
                            } catch (error) {
                                console.error('Error loading class for student:', student.Name, error);
                            }
                            return null;
                        });
                        
                        const studentsWithClassResults = await Promise.allSettled(studentsWithClassPromises);
                        
                        // Extract successful results
                        const studentsWithClass = studentsWithClassResults
                            .filter(result => result.status === 'fulfilled' && result.value !== null)
                            .map(result => result.value);
                        
                        console.log('Students with class info loaded:', studentsWithClass.length);
                        
                        // Filter by teacher's classes
                        const teacherClasses = teacherInfo.ClassAssigned.map(c => parseInt(c));
                        console.log('Teacher assigned classes (parsed):', teacherClasses);
                        
                        filtered = studentsWithClass.filter(s => {
                            if (!s || s.ClassEnrolled === undefined || s.ClassEnrolled === null) {
                                return false;
                            }
                            const studentClass = parseInt(s.ClassEnrolled);
                            const isInTeacherClass = !isNaN(studentClass) && teacherClasses.includes(studentClass);
                            console.log(`Student ${s.Name} - Class ${studentClass} - In teacher class: ${isInTeacherClass}`);
                            return isInTeacherClass;
                        });
                        
                        console.log('Students in teacher classes (final):', filtered.length);
                    } 
                    // For admins with class filter
                    else if (studentClass) {
                        console.log('Processing admin class filter...');
                        
                        const studentsWithClassPromises = filtered.map(async (student) => {
                            try {
                                const profileRes = await profileAPI.getByUserID(student.UserID);
                                if (profileRes.success && profileRes.data?.REG) {
                                    const studentRes = await profileAPI.getStudentByREG(profileRes.data.REG);
                                    if (studentRes.success && studentRes.data) {
                                        return {
                                            ...student,
                                            ClassEnrolled: studentRes.data.ClassEnrolled
                                        };
                                    }
                                }
                            } catch (error) {
                                console.error('Error loading class for student:', student.Name, error);
                            }
                            return null;
                        });
                        
                        const studentsWithClassResults = await Promise.allSettled(studentsWithClassPromises);
                        
                        const studentsWithClass = studentsWithClassResults
                            .filter(result => result.status === 'fulfilled' && result.value !== null)
                            .map(result => result.value);
                        
                        filtered = studentsWithClass.filter(s => 
                            s && s.ClassEnrolled === parseInt(studentClass)
                        );
                        
                        console.log('Students in selected class:', filtered.length);
                    }

                    console.log('Final students to display:', filtered.length);
                    setStudents(filtered);
                } else {
                    console.error('Failed to load students:', res.message);
                    setStudents([]);
                }
            } else {
                // Loading teachers
                console.log('Loading teachers...');
                const res = await usersAPI.getAll('Teacher');
                if (res.success) {
                    let filtered = res.data || [];
                    console.log('All teachers:', filtered.length);

                    if (studentSearch) {
                        filtered = filtered.filter(u =>
                            u.Name?.toLowerCase().includes(studentSearch.toLowerCase())
                        );
                        console.log('After name filter:', filtered.length);
                    }

                    setTeachers(filtered);
                } else {
                    console.error('Failed to load teachers:', res.message);
                    setTeachers([]);
                }
            }
        } catch (error) {
            console.error('Error loading users:', error);
            if (userType === "Student") {
                setStudents([]);
            } else {
                setTeachers([]);
            }
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        if (userType === "Student") {
            setNewStudent(prev => ({
                ...prev,
                [name]: value
            }));
        } else {
            setNewTeacher(prev => ({
                ...prev,
                [name]: value
            }));
        }
    };

    const handleClassAssignmentChange = (classNum) => {
        setNewTeacher(prev => {
            const currentClasses = [...prev.classAssigned];
            const index = currentClasses.indexOf(classNum);
            if (index > -1) {
                currentClasses.splice(index, 1);
            } else {
                currentClasses.push(classNum);
            }
            return { ...prev, classAssigned: currentClasses };
        });
    };

    const handleEditClassAssignmentChange = (classNum) => {
        setEditUser(prev => {
            const currentClasses = [...prev.classAssigned];
            const index = currentClasses.indexOf(classNum);
            if (index > -1) {
                currentClasses.splice(index, 1);
            } else {
                currentClasses.push(classNum);
            }
            return { ...prev, classAssigned: currentClasses };
        });
    };

    const handleEditInputChange = (e) => {
        const { name, value } = e.target;
        setEditUser(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleEditClick = async (userEmail) => {
        try {
            const usersRes = await usersAPI.getAll();
            if (usersRes.success) {
                const userData = usersRes.data.find(u => u.Email === userEmail);
                if (userData) {
                    const profileRes = await profileAPI.getByUserID(userData.UserID);
                    const profile = profileRes.success ? profileRes.data : null;
        
                    if (userData.UserType === "Student") {
                        const studentRes = await profileAPI.getStudentByREG(profile?.REG);
                        const studentData = studentRes.success ? studentRes.data : null;
                        
                        setEditUser({
                            userID: userData.UserID,
                            userType: 'Student',
                            name: userData.Name,
                            email: userData.Email,
                            password: '',
                            regNumber: profile?.REG || '',
                            classEnrolled: studentData?.ClassEnrolled || '',
                            classAssigned: [],
                            subject: ''
                        });
                    } else if (userData.UserType === "Teacher") {
                        const teacherRes = await profileAPI.getTeacherByREG(profile?.REG);
                        const teacherData = teacherRes.success ? teacherRes.data : null;
                        
                        setEditUser({
                            userID: userData.UserID,
                            userType: 'Teacher',
                            name: userData.Name,
                            email: userData.Email,
                            password: '',
                            regNumber: profile?.REG || '',
                            classEnrolled: '',
                            classAssigned: teacherData?.ClassAssigned || [],
                            subject: teacherData?.Subject || ''
                        });
                    }
        
                    setEditingUserEmail(userEmail);
                    setShowEditForm(true);
                    setShowCreateForm(false);
                }
            }
        } catch (error) {
            console.error('Error loading user for edit:', error);
            alert('Failed to load user data');
        }
    };

    const handleUpdateUser = async (e) => {
        e.preventDefault();
        
        if (!editUser.name || !editUser.email) {
            alert('Please fill in all required fields');
            return;
        }

        try {
            const updateData = {
                name: editUser.name,
                email: editUser.email
            };

            // Only include password if it's been changed
            if (editUser.password && editUser.password.trim() !== '') {
                updateData.password = editUser.password;
            }

            // Add type-specific fields
            if (editUser.userType === 'Student') {
                updateData.classEnrolled = parseInt(editUser.classEnrolled);
            } else if (editUser.userType === 'Teacher') {
                updateData.classAssigned = editUser.classAssigned.map(c => parseInt(c));
                updateData.subject = editUser.subject;
            }

            const response = await usersAPI.update(editUser.userID, updateData);

            if (response && response.success) {
                alert('User updated successfully!');
                setShowEditForm(false);
                setEditingUserEmail(null);
                await loadUsers();
            } else {
                throw new Error(response?.message || 'Failed to update user');
            }
        } catch (error) {
            console.error('Error updating user:', error);
            
            let errorMessage = 'Failed to update user';
            if (error.message) {
                errorMessage = error.message;
            } else if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            }
            
            if (errorMessage.toLowerCase().includes('permission') || 
                errorMessage.toLowerCase().includes('unauthorized')) {
                errorMessage = 'You do not have permission to update this user.';
            }
            
            alert(errorMessage);
        }
    };

    const handleDeleteUser = async (userID, userName, userTypeToDelete) => {
        // Confirm deletion
        const confirmMessage = `Are you sure you want to delete ${userName}? This action cannot be undone.`;
        if (!window.confirm(confirmMessage)) {
            return;
        }

        try {
            const response = await usersAPI.delete(userID);

            if (response && response.success) {
                alert(`${userTypeToDelete} deleted successfully!`);
                await loadUsers();
            } else {
                throw new Error(response?.message || 'Failed to delete user');
            }
        } catch (error) {
            console.error('Error deleting user:', error);
            
            let errorMessage = 'Failed to delete user';
            if (error.message) {
                errorMessage = error.message;
            } else if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            }
            
            if (errorMessage.toLowerCase().includes('permission') || 
                errorMessage.toLowerCase().includes('unauthorized') ||
                errorMessage.toLowerCase().includes('forbidden')) {
                errorMessage = 'You do not have permission to delete this user.';
            }
            
            alert(errorMessage);
        }
    };

    const handleCreateUser = async (e) => {
        e.preventDefault();
        
        try {
            if (userType === "Student") {
                if (!newStudent.name || !newStudent.email || !newStudent.password || 
                    !newStudent.regNumber || !newStudent.classEnrolled) {
                    alert('Please fill in all required fields');
                    return;
                }

                // Validate class enrollment for teachers
                if (user?.UserType === 'Teacher' && teacherInfo?.ClassAssigned) {
                    const selectedClass = parseInt(newStudent.classEnrolled);
                    const teacherClasses = teacherInfo.ClassAssigned.map(c => parseInt(c));
                    
                    if (!teacherClasses.includes(selectedClass)) {
                        alert(`You can only create students for classes you're assigned to: ${teacherClasses.join(', ')}`);
                        return;
                    }
                }

                const createData = {
                    name: newStudent.name,
                    email: newStudent.email,
                    password: newStudent.password,
                    userType: 'Student',
                    regNumber: newStudent.regNumber,
                    classEnrolled: parseInt(newStudent.classEnrolled)
                };

                console.log('Creating student with data:', createData);
                const response = await usersAPI.create(createData);
                console.log('Create response:', response);

                if (response && response.success) {
                    alert('Student created successfully!');
                    setNewStudent({
                        name: '',
                        email: '',
                        password: '',
                        regNumber: '',
                        classEnrolled: ''
                    });
                    setShowCreateForm(false);
                    await loadUsers();
                } else {
                    throw new Error(response?.message || 'Failed to create student');
                }
            } else {
                // Only admins can create teachers
                if (user?.UserType !== 'Admin') {
                    alert('Only administrators can create teacher accounts');
                    return;
                }

                if (!newTeacher.name || !newTeacher.email || !newTeacher.password || 
                    !newTeacher.regNumber || !newTeacher.subject || newTeacher.classAssigned.length === 0) {
                    alert('Please fill in all required fields and assign at least one class');
                    return;
                }

                const createData = {
                    name: newTeacher.name,
                    email: newTeacher.email,
                    password: newTeacher.password,
                    userType: 'Teacher',
                    regNumber: newTeacher.regNumber,
                    subject: newTeacher.subject,
                    classAssigned: newTeacher.classAssigned.map(c => parseInt(c))
                };

                console.log('Creating teacher with data:', createData);
                const response = await usersAPI.create(createData);
                console.log('Create response:', response);

                if (response && response.success) {
                    alert('Teacher created successfully!');
                    setNewTeacher({
                        name: '',
                        email: '',
                        password: '',
                        regNumber: '',
                        subject: '',
                        classAssigned: []
                    });
                    setShowCreateForm(false);
                    await loadUsers();
                } else {
                    throw new Error(response?.message || 'Failed to create teacher');
                }
            }
        } catch (error) {
            console.error('Error creating user:', error);
            
            // Handle specific error cases
            let errorMessage = 'Failed to create user';
            
            if (error.message && error.message !== 'Failed to create user') {
                errorMessage = error.message;
            } else if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            } else if (error.response?.data?.error) {
                errorMessage = error.response.data.error;
            } else if (error.response?.statusText) {
                errorMessage = `Error: ${error.response.statusText}`;
            }
            
            // Handle permission errors specifically
            if (errorMessage.toLowerCase().includes('permission') || 
                errorMessage.toLowerCase().includes('unauthorized') ||
                errorMessage.toLowerCase().includes('forbidden') ||
                errorMessage.toLowerCase().includes('403')) {
                errorMessage = 'You do not have permission to create this user. Please contact an administrator.';
            }
            
            // Handle duplicate errors
            if (errorMessage.toLowerCase().includes('duplicate') || 
                errorMessage.toLowerCase().includes('already exists')) {
                errorMessage = 'A user with this email or registration number already exists.';
            }
            
            alert(errorMessage);
        }
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
                Please log in to view this page
            </div>
        );
    }

    const isAdmin = user.UserType === "Admin";
    const isTeacher = user.UserType === "Teacher";
    const canAccess = isAdmin || isTeacher;

    if (!canAccess) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh',
                fontSize: '1.2rem',
                color: '#FD3012',
                flexDirection: 'column',
                gap: '20px'
            }}>
                <h2>Access Denied</h2>
                <p>Only teachers and administrators can view this page.</p>
            </div>
        );
    }

    return (
        <div style={{ 
            padding: '40px', 
            width: '100%',
            background: 'linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%)',
            minHeight: '100vh'
        }}>
            {/* View Toggle - Only show for Admin */}
            {isAdmin && (
                <div style={{
                    background: 'linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%)',
                    padding: '24px',
                    marginBottom: '30px',
                    borderRadius: '16px',
                    display: 'flex',
                    gap: '15px',
                    alignItems: 'center',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.06)',
                    border: '1px solid #E2E8F0',
                    animation: 'fadeIn 0.5s ease-out'
                }}>
                    <span style={{ 
                        fontWeight: '700', 
                        marginRight: '10px', 
                        fontSize: '1.1rem', 
                        color: '#1E293B',
                        letterSpacing: '0.5px'
                    }}>View:</span>
                    <button
                        onClick={() => {
                            setUserType("Student");
                            setStudentSearch("");
                            setStudentClass("");
                        }}
                        style={{
                            padding: '12px 28px',
                            background: userType === "Student" 
                                ? 'linear-gradient(135deg, #2563EB 0%, #6366F1 100%)' 
                                : '#FFFFFF',
                            color: userType === "Student" ? '#fff' : '#2563EB',
                            border: userType === "Student" ? 'none' : '2px solid #2563EB',
                            borderRadius: '12px',
                            cursor: 'pointer',
                            fontWeight: '700',
                            fontSize: '1rem',
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            boxShadow: userType === "Student" 
                                ? '0 4px 15px rgba(37, 99, 235, 0.3)' 
                                : 'none'
                        }}
                        onMouseEnter={(e) => {
                            if (userType !== "Student") {
                                e.currentTarget.style.background = 'linear-gradient(135deg, #2563EB 0%, #6366F1 100%)';
                                e.currentTarget.style.color = '#fff';
                                e.currentTarget.style.border = 'none';
                                e.currentTarget.style.boxShadow = '0 4px 15px rgba(37, 99, 235, 0.3)';
                                e.currentTarget.style.transform = 'translateY(-2px)';
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (userType !== "Student") {
                                e.currentTarget.style.background = '#FFFFFF';
                                e.currentTarget.style.color = '#2563EB';
                                e.currentTarget.style.border = '2px solid #2563EB';
                                e.currentTarget.style.boxShadow = 'none';
                                e.currentTarget.style.transform = 'translateY(0)';
                            }
                        }}
                    >
                        Students
                    </button>
                    <button
                        onClick={() => {
                            setUserType("Teacher");
                            setStudentSearch("");
                            setStudentClass("");
                        }}
                        style={{
                            padding: '12px 28px',
                            background: userType === "Teacher" 
                                ? 'linear-gradient(135deg, #2563EB 0%, #6366F1 100%)' 
                                : '#FFFFFF',
                            color: userType === "Teacher" ? '#fff' : '#2563EB',
                            border: userType === "Teacher" ? 'none' : '2px solid #2563EB',
                            borderRadius: '12px',
                            cursor: 'pointer',
                            fontWeight: '700',
                            fontSize: '1rem',
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            boxShadow: userType === "Teacher" 
                                ? '0 4px 15px rgba(37, 99, 235, 0.3)' 
                                : 'none'
                        }}
                        onMouseEnter={(e) => {
                            if (userType !== "Teacher") {
                                e.currentTarget.style.background = 'linear-gradient(135deg, #2563EB 0%, #6366F1 100%)';
                                e.currentTarget.style.color = '#fff';
                                e.currentTarget.style.border = 'none';
                                e.currentTarget.style.boxShadow = '0 4px 15px rgba(37, 99, 235, 0.3)';
                                e.currentTarget.style.transform = 'translateY(-2px)';
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (userType !== "Teacher") {
                                e.currentTarget.style.background = '#FFFFFF';
                                e.currentTarget.style.color = '#2563EB';
                                e.currentTarget.style.border = '2px solid #2563EB';
                                e.currentTarget.style.boxShadow = 'none';
                                e.currentTarget.style.transform = 'translateY(0)';
                            }
                        }}
                    >
                        Teachers
                    </button>
                </div>
            )}

            {/* Loading indicator for teacher info */}
            {isTeacher && teacherInfoLoading && (
                <div style={{
                    background: 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)',
                    padding: '16px 24px',
                    marginBottom: '20px',
                    borderRadius: '12px',
                    border: '1px solid #FCD34D',
                    textAlign: 'center',
                    color: '#92400E',
                    fontWeight: '600'
                }}>
                    Loading teacher information...
                </div>
            )}

            {/* Filter Section */}
            <div className='users-filter' style={{
                display: 'flex',
                gap: '15px',
                alignItems: 'center',
                marginBottom: '40px',
                padding: '24px',
                background: 'linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%)',
                borderRadius: '16px',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.06)',
                border: '1px solid #E2E8F0',
                flexWrap: 'wrap',
                animation: 'fadeIn 0.6s ease-out'
            }}>
                <input
                    type='text'
                    placeholder='🔍 Search by name...'
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    style={{
                        flex: '1',
                        minWidth: '200px',
                        padding: '14px 20px',
                        border: '2px solid #E2E8F0',
                        borderRadius: '12px',
                        fontSize: '1rem',
                        fontWeight: '500',
                        color: '#1E293B',
                        background: '#FFFFFF',
                        transition: 'all 0.3s ease',
                        outline: 'none'
                    }}
                    onFocus={(e) => {
                        e.target.style.borderColor = '#2563EB';
                        e.target.style.boxShadow = '0 0 0 4px rgba(37, 99, 235, 0.1)';
                    }}
                    onBlur={(e) => {
                        e.target.style.borderColor = '#E2E8F0';
                        e.target.style.boxShadow = 'none';
                    }}
                />
                {userType === "Student" && isAdmin && (
                    <select 
                        value={studentClass} 
                        onChange={(e) => setStudentClass(e.target.value)}
                        style={{
                            padding: '14px 20px',
                            border: '2px solid #E2E8F0',
                            borderRadius: '12px',
                            fontSize: '1rem',
                            fontWeight: '600',
                            color: '#1E293B',
                            background: '#FFFFFF',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            outline: 'none',
                            minWidth: '180px'
                        }}
                        onFocus={(e) => {
                            e.target.style.borderColor = '#2563EB';
                            e.target.style.boxShadow = '0 0 0 4px rgba(37, 99, 235, 0.1)';
                        }}
                        onBlur={(e) => {
                            e.target.style.borderColor = '#E2E8F0';
                            e.target.style.boxShadow = 'none';
                        }}
                    >
                        <option value=''>All Classes</option>
                        {availableClasses.map((grade) => (
                            <option key={grade} value={grade}>
                                Class {grade}
                            </option>
                        ))}
                    </select>
                )}
                <button 
                    onClick={() => {
                        setStudentSearch("");
                        setStudentClass("");
                    }}
                    style={{
                        padding: '14px 24px',
                        background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        fontWeight: '700',
                        fontSize: '1rem',
                        transition: 'all 0.3s ease',
                        boxShadow: '0 4px 15px rgba(239, 68, 68, 0.3)'
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 6px 20px rgba(239, 68, 68, 0.4)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 4px 15px rgba(239, 68, 68, 0.3)';
                    }}
                >
                    Clear Filters
                </button>
                {/* Only show Add button for admins, or for teachers when viewing students */}
                {(isAdmin || (isTeacher && userType === "Student")) && (
                    <button 
                        onClick={() => {
                            setShowCreateForm(!showCreateForm);
                            setShowEditForm(false);
                        }}
                        style={{
                            padding: '14px 24px',
                            background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '12px',
                            cursor: 'pointer',
                            fontWeight: '700',
                            fontSize: '1rem',
                            transition: 'all 0.3s ease',
                            boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.boxShadow = '0 6px 20px rgba(16, 185, 129, 0.4)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 4px 15px rgba(16, 185, 129, 0.3)';
                        }}
                    >
                        {showCreateForm ? 'Cancel' : `➕ Add New ${userType}`}
                    </button>
                )}
            </div>

            {/* Create Form - Only show for admins, or for teachers when creating students */}
            {showCreateForm && (isAdmin || (isTeacher && userType === "Student")) && (
                <div style={{
                    backgroundColor: '#FEFEFE',
                    padding: '30px',
                    margin: '30px 0',
                    borderRadius: '12px',
                    border: '2px solid #FE6D36',
                    boxShadow: '0 4px 12px rgba(254, 109, 54, 0.15)'
                }}>
                    <h3 style={{ marginTop: 0, marginBottom: '25px', color: '#FD3012' }}>Create New {userType}</h3>
                    <form onSubmit={handleCreateUser}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#333' }}>
                                    Name *
                                </label>
                                <input
                                    type='text'
                                    name='name'
                                    value={userType === "Student" ? newStudent.name : newTeacher.name}
                                    onChange={handleInputChange}
                                    required
                                    style={{
                                        width: '100%',
                                        padding: '12px',
                                        borderRadius: '8px',
                                        border: '2px solid #FDB5AB',
                                        fontSize: '1rem'
                                    }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#333' }}>
                                    Email *
                                </label>
                                <input
                                    type='email'
                                    name='email'
                                    value={userType === "Student" ? newStudent.email : newTeacher.email}
                                    onChange={handleInputChange}
                                    required
                                    style={{
                                        width: '100%',
                                        padding: '12px',
                                        borderRadius: '8px',
                                        border: '2px solid #FDB5AB',
                                        fontSize: '1rem'
                                    }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#333' }}>
                                    Password *
                                </label>
                                <input
                                    type='password'
                                    name='password'
                                    value={userType === "Student" ? newStudent.password : newTeacher.password}
                                    onChange={handleInputChange}
                                    required
                                    style={{
                                        width: '100%',
                                        padding: '12px',
                                        borderRadius: '8px',
                                        border: '2px solid #FDB5AB',
                                        fontSize: '1rem'
                                    }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#333' }}>
                                    Registration Number *
                                </label>
                                <input
                                    type='text'
                                    name='regNumber'
                                    value={userType === "Student" ? newStudent.regNumber : newTeacher.regNumber}
                                    onChange={handleInputChange}
                                    required
                                    placeholder={userType === "Student" ? 'e.g., STU001' : 'e.g., TCH001'}
                                    style={{
                                        width: '100%',
                                        padding: '12px',
                                        borderRadius: '8px',
                                        border: '2px solid #FDB5AB',
                                        fontSize: '1rem'
                                    }}
                                />
                            </div>

                            {userType === "Student" ? (
                                <div style={{ gridColumn: '1 / -1' }}>
                                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#333' }}>
                                        Class Enrolled *
                                    </label>
                                    <select
                                        name='classEnrolled'
                                        value={newStudent.classEnrolled}
                                        onChange={handleInputChange}
                                        required
                                        style={{
                                            width: '100%',
                                            padding: '12px',
                                            borderRadius: '8px',
                                            border: '2px solid #FDB5AB',
                                            fontSize: '1rem'
                                        }}
                                    >
                                        <option value=''>Select Class</option>
                                        {(isAdmin ? availableClasses : teacherInfo?.ClassAssigned || []).map((grade) => (
                                            <option key={grade} value={grade}>
                                                Class {grade}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            ) : (
                                <>
                                    <div style={{ gridColumn: '1 / -1' }}>
                                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#333' }}>
                                            Subject *
                                        </label>
                                        <input
                                            type='text'
                                            name='subject'
                                            value={newTeacher.subject}
                                            onChange={handleInputChange}
                                            required
                                            placeholder='e.g., Mathematics'
                                            style={{
                                                width: '100%',
                                                padding: '12px',
                                                borderRadius: '8px',
                                                border: '2px solid #FDB5AB',
                                                fontSize: '1rem'
                                            }}
                                        />
                                    </div>
                                    <div style={{ gridColumn: '1 / -1' }}>
                                        <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold', color: '#333' }}>
                                            Assign Classes * (Select at least one)
                                        </label>
                                        <div style={{
                                            display: 'grid',
                                            gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
                                            gap: '12px'
                                        }}>
                                            {availableClasses.map((classNum) => (
                                                <label
                                                    key={classNum}
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        padding: '12px',
                                                        backgroundColor: newTeacher.classAssigned.includes(classNum) ? '#FDB5AB' : '#FEFEFE',
                                                        border: '2px solid #FE6D36',
                                                        borderRadius: '8px',
                                                        cursor: 'pointer',
                                                        transition: 'all 0.3s ease'
                                                    }}
                                                >
                                                    <input
                                                        type='checkbox'
                                                        checked={newTeacher.classAssigned.includes(classNum)}
                                                        onChange={() => handleClassAssignmentChange(classNum)}
                                                        style={{ marginRight: '10px', width: '18px', height: '18px' }}
                                                    />
                                                    Class {classNum}
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                        <div style={{ marginTop: '25px', display: 'flex', gap: '12px' }}>
                            <button
                                type='submit'
                                style={{
                                    padding: '12px 28px',
                                    backgroundColor: '#4CAF50',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    fontWeight: 'bold',
                                    fontSize: '1rem',
                                    boxShadow: '0 4px 12px rgba(76, 175, 80, 0.3)'
                                }}
                            >
                                Create {userType}
                            </button>
                            <button
                                type='button'
                                onClick={() => setShowCreateForm(false)}
                                style={{
                                    padding: '12px 28px',
                                    backgroundColor: '#999',
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

            {/* Edit Form - Only show for admins, or for teachers when editing students */}
            {showEditForm && (isAdmin || (isTeacher && editUser.userType === 'Student')) && (
                <div style={{
                    backgroundColor: '#FFF9E6',
                    padding: '30px',
                    margin: '30px 0',
                    borderRadius: '12px',
                    border: '2px solid #FFC107',
                    boxShadow: '0 4px 12px rgba(255, 193, 7, 0.2)'
                }}>
                    <h3 style={{ marginTop: 0, marginBottom: '25px', color: '#FF9800' }}>Edit {editUser.userType} Information</h3>
                    <form onSubmit={handleUpdateUser}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#333' }}>
                                    Name *
                                </label>
                                <input
                                    type='text'
                                    name='name'
                                    value={editUser.name}
                                    onChange={handleEditInputChange}
                                    required
                                    style={{
                                        width: '100%',
                                        padding: '12px',
                                        borderRadius: '8px',
                                        border: '2px solid #FDB5AB',
                                        fontSize: '1rem'
                                    }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#333' }}>
                                    Email *
                                </label>
                                <input
                                    type='email'
                                    name='email'
                                    value={editUser.email}
                                    onChange={handleEditInputChange}
                                    required
                                    style={{
                                        width: '100%',
                                        padding: '12px',
                                        borderRadius: '8px',
                                        border: '2px solid #FDB5AB',
                                        fontSize: '1rem'
                                    }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#333' }}>
                                    Password (leave blank to keep current)
                                </label>
                                <input
                                    type='password'
                                    name='password'
                                    value={editUser.password}
                                    onChange={handleEditInputChange}
                                    placeholder='Enter new password'
                                    style={{
                                        width: '100%',
                                        padding: '12px',
                                        borderRadius: '8px',
                                        border: '2px solid #FDB5AB',
                                        fontSize: '1rem'
                                    }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#333' }}>
                                    Registration Number
                                </label>
                                <input
                                    type='text'
                                    value={editUser.regNumber}
                                    disabled
                                    style={{
                                        width: '100%',
                                        padding: '12px',
                                        borderRadius: '8px',
                                        border: '2px solid #FDB5AB',
                                        backgroundColor: '#f5f5f5',
                                        cursor: 'not-allowed',
                                        fontSize: '1rem'
                                    }}
                                />
                            </div>

                            {editUser.userType === 'Student' ? (
                                <div style={{ gridColumn: '1 / -1' }}>
                                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#333' }}>
                                        Class Enrolled *
                                    </label>
                                    <select
                                        name='classEnrolled'
                                        value={editUser.classEnrolled}
                                        onChange={handleEditInputChange}
                                        required
                                        style={{
                                            width: '100%',
                                            padding: '12px',
                                            borderRadius: '8px',
                                            border: '2px solid #FDB5AB',
                                            fontSize: '1rem'
                                        }}
                                    >
                                        <option value=''>Select Class</option>
                                        {(isAdmin ? availableClasses : teacherInfo?.ClassAssigned || []).map((grade) => (
                                            <option key={grade} value={grade}>
                                                Class {grade}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            ) : (
                                <>
                                    <div style={{ gridColumn: '1 / -1' }}>
                                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#333' }}>
                                            Subject *
                                        </label>
                                        <input
                                            type='text'
                                            name='subject'
                                            value={editUser.subject}
                                            onChange={handleEditInputChange}
                                            required
                                            style={{
                                                width: '100%',
                                                padding: '12px',
                                                borderRadius: '8px',
                                                border: '2px solid #FDB5AB',
                                                fontSize: '1rem'
                                            }}
                                        />
                                    </div>
                                    <div style={{ gridColumn: '1 / -1' }}>
                                        <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold', color: '#333' }}>
                                            Assign Classes * (Select at least one)
                                        </label>
                                        <div style={{
                                            display: 'grid',
                                            gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
                                            gap: '12px'
                                        }}>
                                            {availableClasses.map((classNum) => (
                                                <label
                                                    key={classNum}
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        padding: '12px',
                                                        backgroundColor: editUser.classAssigned.includes(classNum) ? '#FDB5AB' : '#FEFEFE',
                                                        border: '2px solid #FE6D36',
                                                        borderRadius: '8px',
                                                        cursor: 'pointer',
                                                        transition: 'all 0.3s ease'
                                                    }}
                                                >
                                                    <input
                                                        type='checkbox'
                                                        checked={editUser.classAssigned.includes(classNum)}
                                                        onChange={() => handleEditClassAssignmentChange(classNum)}
                                                        style={{ marginRight: '10px', width: '18px', height: '18px' }}
                                                    />
                                                    Class {classNum}
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                        <div style={{ marginTop: '25px', display: 'flex', gap: '12px' }}>
                            <button
                                type='submit'
                                style={{
                                    padding: '12px 28px',
                                    backgroundColor: '#FFC107',
                                    color: '#000',
                                    border: 'none',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    fontWeight: 'bold',
                                    fontSize: '1rem',
                                    boxShadow: '0 4px 12px rgba(255, 193, 7, 0.3)'
                                }}
                            >
                                Update {editUser.userType}
                            </button>
                            <button
                                type='button'
                                onClick={() => {
                                    setShowEditForm(false);
                                    setEditingUserEmail(null);
                                }}
                                style={{
                                    padding: '12px 28px',
                                    backgroundColor: '#999',
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

            {/* Users List */}
            <div className='users-container' style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
                gap: '30px',
                padding: '20px 0',
                animation: 'fadeIn 0.8s ease-out'
            }}>
                {userType === "Student" ? (
                    students.length > 0 ? (
                        students.map((student, index) => (
                            <div 
                                key={student.UserID || student._id} 
                                style={{ 
                                    position: 'relative',
                                    animation: `fadeIn 0.6s ease-out ${index * 0.1}s both`
                                }}
                            >
                                <Card Email={student.Email} />
                                {(isAdmin || isTeacher) && (
                                    <div style={{
                                        position: 'absolute',
                                        top: '20px',
                                        right: '20px',
                                        display: 'flex',
                                        gap: '8px',
                                        zIndex: 10
                                    }}>
                                        <button
                                            onClick={() => handleEditClick(student.Email)}
                                            style={{
                                                padding: '10px 18px',
                                                background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '12px',
                                                cursor: 'pointer',
                                                fontSize: '0.9rem',
                                                fontWeight: '700',
                                                boxShadow: '0 4px 15px rgba(99, 102, 241, 0.4)',
                                                transition: 'all 0.3s ease',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '6px'
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.transform = 'translateY(-2px) scale(1.05)';
                                                e.currentTarget.style.boxShadow = '0 6px 20px rgba(99, 102, 241, 0.5)';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.transform = 'translateY(0) scale(1)';
                                                e.currentTarget.style.boxShadow = '0 4px 15px rgba(99, 102, 241, 0.4)';
                                            }}
                                        >
                                            ✏️ Edit
                                        </button>
                                        <button
                                            onClick={() => handleDeleteUser(student.UserID, student.Name, 'Student')}
                                            style={{
                                                padding: '10px 18px',
                                                background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '12px',
                                                cursor: 'pointer',
                                                fontSize: '0.9rem',
                                                fontWeight: '700',
                                                boxShadow: '0 4px 15px rgba(239, 68, 68, 0.4)',
                                                transition: 'all 0.3s ease',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '6px'
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.transform = 'translateY(-2px) scale(1.05)';
                                                e.currentTarget.style.boxShadow = '0 6px 20px rgba(239, 68, 68, 0.5)';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.transform = 'translateY(0) scale(1)';
                                                e.currentTarget.style.boxShadow = '0 4px 15px rgba(239, 68, 68, 0.4)';
                                            }}
                                        >
                                            🗑️ Delete
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))
                    ) : (
                        <div style={{
                            gridColumn: '1 / -1',
                            textAlign: 'center',
                            padding: '60px 40px',
                            background: 'linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%)',
                            borderRadius: '20px',
                            border: '2px dashed #E2E8F0'
                        }}>
                            <div style={{
                                fontSize: '4rem',
                                marginBottom: '20px'
                            }}>👥</div>
                            <p style={{
                                color: '#64748B',
                                fontSize: '1.2rem',
                                fontWeight: '600',
                                margin: 0
                            }}>
                                {user?.UserType === 'Teacher' 
                                    ? teacherInfoLoading 
                                        ? 'Loading your assigned students...'
                                        : !teacherInfo?.ClassAssigned || teacherInfo.ClassAssigned.length === 0
                                            ? 'You have no assigned classes. Please contact an administrator.'
                                            : 'No students found in your assigned classes'
                                    : 'No students found matching the selected filters'}
                            </p>
                        </div>
                    )
                ) : (
                    /* Teachers view - only show for Admin */
                    isAdmin ? (
                        teachers.length > 0 ? (
                            teachers.map((teacher, index) => (
                                <div 
                                    key={teacher.UserID || teacher._id} 
                                    style={{ 
                                        position: 'relative',
                                        animation: `fadeIn 0.6s ease-out ${index * 0.1}s both`
                                    }}
                                >
                                    <Card Email={teacher.Email} />
                                    <div style={{
                                        position: 'absolute',
                                        top: '20px',
                                        right: '20px',
                                        display: 'flex',
                                        gap: '8px',
                                        zIndex: 10
                                    }}>
                                        <button
                                            onClick={() => handleEditClick(teacher.Email)}
                                            style={{
                                                padding: '10px 18px',
                                                background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '12px',
                                                cursor: 'pointer',
                                                fontSize: '0.9rem',
                                                fontWeight: '700',
                                                boxShadow: '0 4px 15px rgba(99, 102, 241, 0.4)',
                                                transition: 'all 0.3s ease',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '6px'
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.transform = 'translateY(-2px) scale(1.05)';
                                                e.currentTarget.style.boxShadow = '0 6px 20px rgba(99, 102, 241, 0.5)';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.transform = 'translateY(0) scale(1)';
                                                e.currentTarget.style.boxShadow = '0 4px 15px rgba(99, 102, 241, 0.4)';
                                            }}
                                        >
                                            ✏️ Edit
                                        </button>
                                        <button
                                            onClick={() => handleDeleteUser(teacher.UserID, teacher.Name, 'Teacher')}
                                            style={{
                                                padding: '10px 18px',
                                                background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '12px',
                                                cursor: 'pointer',
                                                fontSize: '0.9rem',
                                                fontWeight: '700',
                                                boxShadow: '0 4px 15px rgba(239, 68, 68, 0.4)',
                                                transition: 'all 0.3s ease',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '6px'
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.transform = 'translateY(-2px) scale(1.05)';
                                                e.currentTarget.style.boxShadow = '0 6px 20px rgba(239, 68, 68, 0.5)';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.transform = 'translateY(0) scale(1)';
                                                e.currentTarget.style.boxShadow = '0 4px 15px rgba(239, 68, 68, 0.4)';
                                            }}
                                        >
                                            🗑️ Delete
                                        </button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div style={{
                                gridColumn: '1 / -1',
                                textAlign: 'center',
                                padding: '60px 40px',
                                background: 'linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%)',
                                borderRadius: '20px',
                                border: '2px dashed #E2E8F0'
                            }}>
                                <div style={{
                                    fontSize: '4rem',
                                    marginBottom: '20px'
                                }}>👨‍🏫</div>
                                <p style={{
                                    color: '#64748B',
                                    fontSize: '1.2rem',
                                    fontWeight: '600',
                                    margin: 0
                                }}>
                                    No teachers found matching the selected filters
                                </p>
                            </div>
                        )
                    ) : null
                )}
            </div>
        </div>
    );
}

export default Student;
