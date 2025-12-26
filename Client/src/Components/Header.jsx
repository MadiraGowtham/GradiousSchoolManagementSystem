import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from '@assets/transparentLogoBlack.png';
import '../App.css';
import logo from '../assets/Logo.png';
import home from '../assets/homeIcon.png';
import result from '../assets/examIcon.png';
import profile from '../assets/profileIcon.png';
import logout from '../assets/logoutIcon.png';
import student from '../assets/Students.png';
import classes from '../assets/Classes.png';
import { authAPI } from '../services/api';

function Header() {
    const userEmail = localStorage.getItem('Email');
    const userType = localStorage.getItem('UserType');
    const navigate = useNavigate();
    const [isHovered, setIsHovered] = useState(false);
    const [userName, setUserName] = useState('');

    useEffect(() => {
        // Try to get user name from localStorage or fetch from API
        const storedName = localStorage.getItem('UserName');
        if (storedName) {
            setUserName(storedName);
        } else if (userEmail) {
            // Optionally fetch user profile
            authAPI.getProfile().then(res => {
                if (res.success && res.data) {
                    setUserName(res.data.Name || 'User');
                    localStorage.setItem('UserName', res.data.Name || 'User');
                }
            }).catch(() => {
                // Fallback if API fails
                setUserName('User');
            });
        }
    }, [userEmail]);

    const Logout = async () => {
        try {
            // Call logout API if token exists
            const token = localStorage.getItem('token') || localStorage.getItem('authToken');
            if (token) {
                try {
                    await authAPI.logout();
                } catch (err) {
                    console.error('Logout API error:', err);
                }
            }
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            // Clear all local storage
        localStorage.removeItem('Email');
        localStorage.removeItem('loggedIn');
            localStorage.removeItem('token');
            localStorage.removeItem('authToken');
            localStorage.removeItem('UserID');
            localStorage.removeItem('UserType');
            localStorage.removeItem('UserName');
        navigate('/');
    }
    };

    if (!userEmail || !userType) return null;

    return (
        <>
            {userType === "Student" && (
                <header className='student-header' onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}>

                    {
                        !isHovered && (
                            <>
                                <div className='header-top'>
                                    <img src={logo} alt='Logo' className='header-logo' style={{ width: '50px', height: '50px' }} />
                                    <div className='header-btns'>
                                        <img src={home} alt='Home' className='header-img' />
                                        <img src={result} alt='Logout' className='header-img' />
                                        <img src={profile} alt='Profile' className='header-img' />
                                    </div>
                                </div>
                                <div className='header-bottom'>
                                    <img src={logout} onClick={Logout} alt='Logout' className='header-img' style={{ marginLeft: '-10px' }} />
                                </div>
                            </>
                        )
                    }
                    {
                        isHovered && (
                            <>

                                <div className='header-top'>
                                    <img src={Logo} alt='Logo' className='header-logo' style={{ height: '100px' }} />
                                    <div className='header-btns'>
                                        <button className='header-btn' onClick={() => navigate('/dashboard' , { state: { Email: userEmail } })}> <img src={home} alt='Home' /> Home</button>
                                        <button className='header-btn' onClick={() => navigate('/marks')}> <img src={result} alt='Logout' /> Results</button>
                                        <button
                                            className='header-btn'
                                            onClick={() => navigate('/profile', { state: { Email: userEmail } })}
                                        >
                                            <img src={profile} alt='Profile' /> Profile
                                        </button>

                                    </div>
                                </div>
                                <div className='header-bottom'>
                                    <button className='header-btn' onClick={Logout}> <img src={logout} alt='Logout' /> Logout</button>
                                </div>
                            </>

                        )
                    }
                </header >
            )
            }
            {userType === "Teacher" && (
                <header className='student-header' onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}>

                    {
                        !isHovered && (
                            <>
                                <div className='header-top'>
                                    <img src={logo} alt='Logo' className='header-logo' style={{ width: '50px', height: '50px' }} />
                                    <div className='header-btns'>
                                        <img src={home} alt='Home' className='header-img' />
                                        <img src={result} alt='result' className='header-img' />
                                        <img src={student} alt='students' className='header-img' />
                                        <img src={profile} alt='Profile' className='header-img' />
                                    </div>
                                </div>
                                <div className='header-bottom'>
                                    <img src={logout} alt='Logout' className='header-img' style={{ marginLeft: '-10px' }} />
                                </div>
                            </>
                        )
                    }
                    {
                        isHovered && (
                            <>

                                <div className='header-top'>
                                    <img src={Logo} alt='Logo' className='header-logo' style={{ height: '100px' }} />
                                    <div className='header-btns'>
                                        <button className='header-btn' onClick={() => navigate('/dashboard' , { state: { Email: userEmail } })}> <img src={home} alt='Home' /> Home</button>
                                        <button className='header-btn' onClick={() => navigate('/marks' , { state: { Email: userEmail } })}> <img src={result} alt='Logout' /> Results</button>
                                        <button className='header-btn' onClick={() => navigate('/students', { state: { Email: userEmail } })}> <img src={student} alt='Users' /> Students</button>
                                        <button className='header-btn' onClick={() => navigate('/profile', { state: { Email: userEmail } })}> <img src={profile} alt='Profile' /> Profile</button>
                                    </div>
                                </div>
                                <div className='header-bottom'>
                                    <button className='header-btn' onClick={Logout}> <img src={logout} alt='Logout' /> Logout</button>
                                </div>
                            </>

                        )
                    }
                </header >
            )
            }
            {userType === "Admin" && (
                <header className='student-header' onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}>

                    {
                        !isHovered && (
                            <>
                                <div className='header-top'>
                                    <img src={logo} alt='Logo' className='header-logo' style={{ width: '50px', height: '50px' }} />
                                    <div className='header-btns'>
                                        <img src={home} alt='Home' className='header-img' />
                                        <img src={result} alt='result' className='header-img' />
                                        <img src={student} alt='students' className='header-img' />
                                        <img src={profile} alt='Profile' className='header-img' />
                                    </div>
                                </div>
                                <div className='header-bottom'>
                                    <img src={logout} alt='Logout' className='header-img' style={{ marginLeft: '-10px' }} />
                                </div>
                            </>
                        )
                    }
                    {
                        isHovered && (
                            <>

                                <div className='header-top'>
                                    <img src={Logo} alt='Logo' className='header-logo' style={{ height: '100px' }} />
                                    <div className='header-btns'>
                                        <button className='header-btn' onClick={() => navigate('/dashboard' , { state: { Email: userEmail } })}> <img src={home} alt='Home' /> Home</button>
                                        <button className='header-btn' onClick={() => navigate('/marks' , { state: { Email: userEmail } })}> <img src={result} alt='Logout' /> Results</button>
                                        <button className='header-btn' onClick={() => navigate('/students', { state: { Email: userEmail } })}> <img src={student} alt='Users' /> Users</button>
                                        <button className='header-btn' onClick={() => navigate('/profile', { state: { Email: userEmail } })}> <img src={profile} alt='Profile' /> Profile</button>
                                    </div>
                                </div>
                                <div className='header-bottom'>
                                    <button className='header-btn' onClick={Logout}> <img src={logout} alt='Logout' /> Logout</button>
                                </div>
                            </>

                        )
                    }
                </header >
            )
            }
        </>
    );
}

export default Header;
