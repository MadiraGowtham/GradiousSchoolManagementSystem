import React, { useState, useEffect } from 'react';
import { usersAPI, profileAPI } from '../services/api';
import imageUrl from '../assets/Avatar.jpeg';

function Card({ Email }) {
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);

    useEffect(() => {
        loadUserData();
    }, [Email]);

    const loadUserData = async () => {
    try {
        setLoading(true);
        console.log('Card Email prop:', Email);
        
        // Get ALL users (students, teachers, admins)
        const [studentsRes, teachersRes, adminsRes] = await Promise.all([
            usersAPI.getAll('Student'),
            usersAPI.getAll('Teacher'),
            usersAPI.getAll('Admin')
        ]);
        
        // Combine all users
        const allUsers = [
            ...(studentsRes.success ? studentsRes.data : []),
            ...(teachersRes.success ? teachersRes.data : []),
            ...(adminsRes.success ? adminsRes.data : [])
        ];
        
        console.log('All users:', allUsers);
        
        const foundUser = allUsers.find(u => u.Email === Email);
        console.log('Found user:', foundUser);
        
        if (foundUser) {
            setUser(foundUser);
            
            // Get profile
            try {
                const profileRes = await profileAPI.getByUserID(foundUser.UserID);
                console.log('Profile API response:', profileRes);
                
                if (profileRes.success) {
                    setProfile(profileRes.data);
                }
            } catch (error) {
                console.error('Error loading profile:', error);
            }
        } else {
            console.log('No user found with email:', Email);
        }
    } catch (error) {
        console.error('Error loading user data:', error);
    } finally {
        setLoading(false);
    }
};

    if (loading) {
        return (
            <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                minHeight: '200px',
                color: '#2563EB',
                fontSize: '1.1rem'
            }}>
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '10px'
                }}>
                    <div style={{
                        width: '40px',
                        height: '40px',
                        border: '4px solid #E2E8F0',
                        borderTop: '4px solid #2563EB',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                    }}></div>
                    <span>Loading...</span>
                </div>
            </div>
        );
    }

    if (!user || !profile) {
        return (
            <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                minHeight: '200px',
                color: '#94A3B8',
                fontSize: '1rem'
            }}>
                User data not available
            </div>
        );
    }

    const getRoleColor = (userType) => {
        switch(userType) {
            case 'Admin': return '#8B5CF6';
            case 'Teacher': return '#14B8A6';
            case 'Student': return '#2563EB';
            default: return '#6366F1';
        }
    };

    const getRoleGradient = (userType) => {
        switch(userType) {
            case 'Admin': return 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)';
            case 'Teacher': return 'linear-gradient(135deg, #14B8A6 0%, #0EA5E9 100%)';
            case 'Student': return 'linear-gradient(135deg, #2563EB 0%, #6366F1 100%)';
            default: return 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)';
        }
    };

    return (
        <div style={{
            background: 'linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%)',
            borderRadius: '20px',
            padding: '32px',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.05)',
            border: '1px solid rgba(226, 232, 240, 0.8)',
            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
            position: 'relative',
            overflow: 'hidden',
            cursor: 'pointer',
            width: '100%',
            maxWidth: '380px'
        }}
        onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-8px) scale(1.02)';
            e.currentTarget.style.boxShadow = '0 20px 50px rgba(37, 99, 235, 0.2), 0 4px 12px rgba(0, 0, 0, 0.1)';
        }}
        onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0) scale(1)';
            e.currentTarget.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.05)';
        }}
        >
            {/* Top accent bar */}
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '6px',
                background: getRoleGradient(user.UserType),
                borderRadius: '20px 20px 0 0'
            }}></div>

            {/* Profile Image Section */}
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '20px',
                marginBottom: '24px',
                position: 'relative'
            }}>
                <div style={{
                    position: 'relative',
                    display: 'inline-block'
                }}>
                    <img 
                        src={imageUrl} 
                        alt='profile' 
                        style={{
                            width: '140px',
                            height: '140px',
                            borderRadius: '50%',
                            objectFit: 'cover',
                            border: '5px solid #FFFFFF',
                            boxShadow: '0 10px 30px rgba(37, 99, 235, 0.2), 0 0 0 4px rgba(37, 99, 235, 0.1)',
                            background: '#F8FAFC',
                            transition: 'all 0.3s ease'
                        }}
                        onError={(e) => {
                            e.target.src = './assets/Avatar.jpeg';
                        }}
                    />
                    {/* Status indicator */}
                    <div style={{
                        position: 'absolute',
                        bottom: '8px',
                        right: '8px',
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        background: '#10B981',
                        border: '3px solid #FFFFFF',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)'
                    }}></div>
                </div>
                
                {/* Role Badge */}
                <div style={{
                    padding: '10px 24px',
                    background: getRoleGradient(user.UserType),
                    color: 'white',
                    borderRadius: '30px',
                    fontSize: '0.85rem',
                    fontWeight: '700',
                    textTransform: 'uppercase',
                    letterSpacing: '1.2px',
                    boxShadow: '0 4px 15px rgba(37, 99, 235, 0.3)',
                    display: 'inline-block'
                }}>
                    {user.UserType}
                </div>
            </div>

            {/* User Information */}
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '16px'
            }}>
                {/* Name and REG */}
                <div style={{
                    textAlign: 'center',
                    marginBottom: '8px'
                }}>
                    <h3 style={{
                        margin: '0 0 8px 0',
                        fontSize: '1.5rem',
                        fontWeight: '700',
                        color: '#0F172A',
                        letterSpacing: '-0.5px'
                    }}>
                        {user.Name || user.Email}
                    </h3>
                    <p style={{
                        margin: 0,
                        fontSize: '0.95rem',
                        color: '#6366F1',
                        fontWeight: '600',
                        letterSpacing: '0.5px'
                    }}>
                        REG: {profile.REG || 'N/A'}
                    </p>
                </div>

                {/* Contact Information */}
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                }}>
                    {/* Email */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '14px 18px',
                        background: 'linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%)',
                        borderRadius: '12px',
                        border: '1px solid #E2E8F0',
                        transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%)';
                        e.currentTarget.style.borderColor = '#6366F1';
                        e.currentTarget.style.transform = 'translateX(4px)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%)';
                        e.currentTarget.style.borderColor = '#E2E8F0';
                        e.currentTarget.style.transform = 'translateX(0)';
                    }}
                    >
                        <div style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '10px',
                            background: 'linear-gradient(135deg, #2563EB 0%, #6366F1 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontSize: '18px',
                            fontWeight: 'bold',
                            flexShrink: 0
                        }}>✉</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{
                                fontSize: '0.75rem',
                                color: '#64748B',
                                fontWeight: '600',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px',
                                marginBottom: '4px'
                            }}>Email</div>
                            <div style={{
                                fontSize: '0.9rem',
                                color: '#1E293B',
                                fontWeight: '500',
                                wordBreak: 'break-word'
                            }}>{user.Email}</div>
                        </div>
                    </div>

                    {/* Phone */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '14px 18px',
                        background: 'linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%)',
                        borderRadius: '12px',
                        border: '1px solid #E2E8F0',
                        transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%)';
                        e.currentTarget.style.borderColor = '#14B8A6';
                        e.currentTarget.style.transform = 'translateX(4px)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%)';
                        e.currentTarget.style.borderColor = '#E2E8F0';
                        e.currentTarget.style.transform = 'translateX(0)';
                    }}
                    >
                        <div style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '10px',
                            background: 'linear-gradient(135deg, #14B8A6 0%, #0EA5E9 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontSize: '18px',
                            fontWeight: 'bold',
                            flexShrink: 0
                        }}>📞</div>
                        <div style={{ flex: 1 }}>
                            <div style={{
                                fontSize: '0.75rem',
                                color: '#64748B',
                                fontWeight: '600',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px',
                                marginBottom: '4px'
                            }}>Phone</div>
                            <div style={{
                                fontSize: '0.9rem',
                                color: '#1E293B',
                                fontWeight: '500'
                            }}>{profile.Phone || 'Not provided'}</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Decorative elements */}
            <div style={{
                position: 'absolute',
                top: '-50px',
                right: '-50px',
                width: '150px',
                height: '150px',
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(37, 99, 235, 0.05) 0%, transparent 70%)',
                pointerEvents: 'none'
            }}></div>
            <div style={{
                position: 'absolute',
                bottom: '-30px',
                left: '-30px',
                width: '100px',
                height: '100px',
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(139, 92, 246, 0.05) 0%, transparent 70%)',
                pointerEvents: 'none'
            }}></div>
        </div>
    );
}

export default Card;
