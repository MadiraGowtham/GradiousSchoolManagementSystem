import react from 'react';
import { useLocation } from 'react-router-dom';
import Header from '../Components/Header';
import '../App.css';
import Student from '../Components/Student';

function Users() {
    const location = useLocation();
  const email = location.state?.Email || localStorage.getItem('Email');
  return (
    <div className='users-page'>
        <Header Email={email} />
        <Student Email={email} />
    </div>
  );
}

export default Users;