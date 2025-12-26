import { useState } from 'react';
import './App.css';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Login from './Pages/Login';
import Index from './Pages/Index';
import Marks from './Pages/MarksPage';
import ProfilePage from './Pages/ProfilePage';
import { UserProvider } from './contexts/UserContext';
import Users from './Pages/Users';

function App() {
  return (
    <UserProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/dashboard" element={<Index />} />
          <Route path="/marks" element={<Marks />} />
          <Route path="/students" element={<Users />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Routes>
      </BrowserRouter>
    </UserProvider>
  );
}

export default App;
