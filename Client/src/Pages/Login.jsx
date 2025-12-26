import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import Logo from '@assets/transparentLogo.png';

function Login() {
  const navigate = useNavigate();

  const [userData, setUserData] = useState({
    Email: "",
    Password: ""
  });
  const [isPassword, setIsPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Check if already logged in (only once on mount)
  useEffect(() => {
    const token = localStorage.getItem('token') || localStorage.getItem('authToken');
    const email = localStorage.getItem('Email');
    if (token && email) {
      navigate('/dashboard');
    }
  }, [navigate]); // Only run once on mount

  const handleForgotPassword = async (event) => {
    event.preventDefault();
    if (!userData.Email) {
      setError("Please enter your email");
      return;
    }

    setLoading(true);
    setError("");
    try {
      await authAPI.forgotPassword(userData.Email);
      alert(`Password reset link sent to ${userData.Email}`);
      setIsPassword(false);
      setUserData({ Email: "", Password: "" });
    } catch (err) {
      setError(err.message || "Failed to send password reset email");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (event) => {
    event.preventDefault();
    if (!userData.Email || !userData.Password) {
      setError("Please enter both email and password");
        return;
      }

    setLoading(true);
    setError("");
    try {
      const response = await authAPI.login(userData.Email, userData.Password);
      
      if (response.success && response.data) {
        const userData = response.data.user || response.data;
        const token = response.data.token;
        
        // Store token and user info
        localStorage.setItem('token', token);
        localStorage.setItem('authToken', token);
        localStorage.setItem('Email', userData.email || userData.Email);
        localStorage.setItem('UserID', userData.UserID || userData._id || '');
        localStorage.setItem('UserType', userData.role || userData.UserType || '');
        localStorage.setItem('UserName', userData.name || userData.Name || 'User');
        localStorage.setItem('loggedIn', 'true');
        
        // Navigate to dashboard
        navigate('/dashboard');
      } else {
        setError("Invalid credentials");
      }
    } catch (err) {
      setError(err.message || "Invalid credentials. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const Submit = (event) => {
    if (isPassword) {
      handleForgotPassword(event);
    } else {
      handleLogin(event);
    }
  };

  return (
    <div className='login-page'>
      <div className='login-container'>
        <img className='login-logo' src={Logo} alt="logo" />
        <form onSubmit={Submit} className='login-form'>
          {error && (
            <div style={{
              padding: '12px',
              backgroundColor: '#fee',
              color: 'rgba(244, 1, 1, 1)',
              borderRadius: '8px',
              marginBottom: '15px',
              fontSize: '0.9rem'
            }}>
              {error}
            </div>
          )}
          {!isPassword ? (
            <>
              <h1>Welcome Back!</h1>
              <input
                type="email"
                placeholder='Email'
                value={userData.Email}
                onChange={(e) => {
                  setUserData({ ...userData, Email: e.target.value });
                  setError("");
                }}
                disabled={loading}
                required
              />
              <input
                type="password"
                placeholder='Password'
                value={userData.Password}
                onChange={(e) => {
                  setUserData({ ...userData, Password: e.target.value });
                  setError("");
                }}
                disabled={loading}
                required
              />
              <button type="submit" disabled={loading}>
                {loading ? 'Logging in...' : 'Login'}
              </button>
              <p className='login-forgot-password' onClick={() => {
                setIsPassword(true);
                setError("");
              }}>
                Forgot Password? Click Here
              </p>
            </>
          ) : (
            <>
              <h1>Reset Password</h1>
              <input
                type="email"
                placeholder='Email'
                value={userData.Email}
                onChange={(e) => {
                  setUserData({ ...userData, Email: e.target.value });
                  setError("");
                }}
                disabled={loading}
                required
              />
              <button type="submit" disabled={loading}>
                {loading ? 'Sending...' : 'Reset Password'}
              </button>
              <p className='login-forgot-password' onClick={() => {
                setIsPassword(false);
                setError("");
              }}>
                Back to Login
              </p>
            </>
          )}
        </form>
      </div>
    </div>
  );
}

export default Login;
