import React from 'react';
import { useLocation } from 'react-router-dom';
import Header from '../Components/Header';
import Profile from '../Components/Profile';
import '../App.css';

function ProfilePage() {
  const location = useLocation();
  const email = location.state?.Email || localStorage.getItem('Email');
  return (
    <div className='profile-page'>
        <Header Email={email} />
        <Profile Email={email} />
    </div>
  );
}

export default ProfilePage;