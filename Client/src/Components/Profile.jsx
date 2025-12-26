import React, { useState, useEffect } from 'react';
import { authAPI, profileAPI } from '../services/api';
import image from '../assets/Avatar.jpeg';
import emailImage from '../assets/mailIcon.png';
import phoneImage from '../assets/phoneIcon.png';
import locationImage from '../assets/addressIcon.png';

// Backend URL - change this based on environment
const API_BASE_URL = 'https://gradiousschoolmanagementsystem.onrender.com';
// For local development:
// const API_BASE_URL = 'http://localhost:5000';

function Profile({ Email }) {
  const email = Email || localStorage.getItem('Email');
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [teacherInfo, setTeacherInfo] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [profileData, setProfileData] = useState({
    phone: '',
    address: '',
    bio: '',
    age: '',
    gender: ''
  });

  useEffect(() => {
    loadProfileData();
  }, [email]);

  const loadProfileData = async () => {
    try {
      setLoading(true);
      const profileRes = await authAPI.getProfile();
      
      if (profileRes.success && profileRes.data) {
        const userData = profileRes.data;
        setUser(userData);
        
        // Set profile data
        setProfile({
          REG: userData.REG || '',
          Address: userData.Address || '',
          Phone: userData.Phone || '',
          Bio: userData.Bio || '',
          Gender: userData.Gender || '',
          Age: userData.Age || 0,
          ImageUrl: userData.ImageUrl || './Avatar.png'
        });

        // Get teacher info if teacher
        if (userData.UserType === 'Teacher' && userData.REG) {
          try {
            const teacherRes = await profileAPI.getTeacherByREG(userData.REG);
            if (teacherRes.success) {
              setTeacherInfo(teacherRes.data);
            }
          } catch (error) {
            console.error('Error loading teacher info:', error);
          }
        }

        // Initialize edit form data
        setProfileData({
          phone: userData.Phone || '',
          address: userData.Address || '',
          bio: userData.Bio || '',
          age: userData.Age || '',
          gender: userData.Gender || ''
        });
      } else {
        // Fallback
        const email = localStorage.getItem('Email');
        const userName = localStorage.getItem('UserName');
        const userType = localStorage.getItem('UserType');
        if (email) {
          setUser({
            Email: email,
            Name: userName || 'User',
            UserType: userType || 'Student'
          });
          setProfile({
            REG: '',
            Address: '',
            Phone: '',
            Bio: '',
            Gender: '',
            Age: 0,
            ImageUrl: './Avatar.png'
          });
        }
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      // Fallback to localStorage
      const email = localStorage.getItem('Email');
      const userName = localStorage.getItem('UserName');
      const userType = localStorage.getItem('UserType');
      if (email) {
        setUser({
          Email: email,
          Name: userName || 'User',
          UserType: userType || 'Student'
        });
        setProfile({
          REG: '',
          Address: '',
          Phone: '',
          Bio: '',
          Gender: '',
          Age: 0,
          ImageUrl: './Avatar.png'
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = () => {
    setIsEditing(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();

    try {
      const userID = user.UserID || localStorage.getItem('UserID');
      if (!userID) {
        alert('User ID not found');
        return;
      }

      const res = await profileAPI.update(userID, {
        Phone: profileData.phone,
        Address: profileData.address,
        Bio: profileData.bio,
        Age: parseInt(profileData.age) || 0,
        Gender: profileData.gender
      });

      if (res.success) {
        // Update local state
        setProfile(prev => ({
          ...prev,
          Phone: profileData.phone,
          Address: profileData.address,
          Bio: profileData.bio,
          Age: parseInt(profileData.age) || 0,
          Gender: profileData.gender
        }));
        alert('Profile updated successfully!');
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile. Please try again.');
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    // Reset to original values
    setProfileData({
      phone: profile?.Phone || '',
      address: profile?.Address || '',
      bio: profile?.Bio || '',
      age: profile?.Age || '',
      gender: profile?.Gender || ''
    });
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size must be less than 5MB');
      return;
    }

    try {
      setUploadingImage(true);
      const userID = user.UserID || localStorage.getItem('UserID');
      if (!userID) {
        alert('User ID not found');
        return;
      }

      console.log('Starting image upload...');
      const res = await profileAPI.uploadImage(userID, file);
      
      if (res.success) {
        console.log('Upload successful:', res);
        
        // Update local state with new image URL
        const newImageUrl = res.data?.ImageUrl || res.imageUrl;
        setProfile(prev => ({
          ...prev,
          ImageUrl: newImageUrl
        }));
        
        alert('Profile image updated successfully!');
        
        // Optional: Reload profile data to ensure sync
        await loadProfileData();
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      alert(error.message || 'Failed to upload image');
    } finally {
      setUploadingImage(false);
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
        Loading profile...
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
        Please log in to view your profile
      </div>
    );
  }

  // Get role-specific information
  let roleInfo = '';
  if (user.UserType === 'Student') {
    roleInfo = `Student || ${profile?.REG || 'N/A'}`;
  } else if (user.UserType === 'Teacher') {
    roleInfo = `Teacher || ${teacherInfo?.Subject || user.Subject || 'N/A'}`;
  } else if (user.UserType === 'Admin') {
    roleInfo = 'Administrator';
  }

  // FIXED: Properly construct image URL
  const getProfileImageUrl = () => {
    if (!profile?.ImageUrl || profile.ImageUrl === './Avatar.png') {
      return image; // Default avatar
    }
    
    // If it's already a full URL (starts with http)
    if (profile.ImageUrl.startsWith('http')) {
      return profile.ImageUrl;
    }
    
    // If it starts with /uploads/, prepend the API base URL
    if (profile.ImageUrl.startsWith('/uploads/')) {
      return `${API_BASE_URL}${profile.ImageUrl}`;
    }
    
    // Otherwise use as is
    return profile.ImageUrl;
  };

  const profileImageUrl = getProfileImageUrl();

  return (
    <div className='profile-container'>
      <div className='profile'>
        <div style={{ position: 'relative', display: 'inline-block' }}>
          <img 
            src={profileImageUrl} 
            alt='profile' 
            className='profile-img'
            onError={(e) => {
              console.error('Image failed to load:', profileImageUrl);
              e.target.src = image; // Fallback to default avatar
            }}
          />
          <label
            htmlFor='profile-image-upload'
            style={{
              position: 'absolute',
              bottom: '10px',
              right: '10px',
              backgroundColor: '#FE6D36',
              color: 'white',
              borderRadius: '50%',
              width: '45px',
              height: '45px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: uploadingImage ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 12px rgba(254, 109, 54, 0.4)',
              border: '3px solid white',
              transition: 'all 0.3s ease',
              opacity: uploadingImage ? 0.6 : 1
            }}
            title={uploadingImage ? 'Uploading...' : 'Upload new profile image'}
          >
            {uploadingImage ? (
              <span style={{ fontSize: '18px' }}>⏳</span>
            ) : (
              <span style={{ fontSize: '20px' }}>📷</span>
            )}
          </label>
          <input
            id='profile-image-upload'
            type='file'
            accept='image/*'
            onChange={handleImageUpload}
            style={{ display: 'none' }}
            disabled={uploadingImage}
          />
        </div>
        <div className='name'>
          <h2>{user.Name || user.Email}</h2>
          <h3>{roleInfo}</h3>
        </div>
        <div className='contacts'>
          <img
            src={emailImage}
            onClick={() => alert(user.Email)}
            alt='email'
            style={{ cursor: 'pointer' }}
          />
          <img
            src={phoneImage}
            onClick={() => alert(profile?.Phone || 'No phone number added')}
            alt='phone'
            style={{ cursor: 'pointer' }}
          />
          <img
            src={locationImage}
            onClick={() => alert(profile?.Address || 'No address added')}
            alt='address'
            style={{ cursor: 'pointer' }}
          />
        </div>
        {!isEditing && (
          <button
            onClick={handleEditClick}
            style={{
              marginTop: '15px',
              padding: '12px 24px',
              backgroundColor: '#FE6D36',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '1rem',
              boxShadow: '0 4px 12px rgba(254, 109, 54, 0.3)'
            }}
          >
            Edit Profile
          </button>
        )}
      </div>

      {isEditing ? (
        <div className='info' style={{ backgroundColor: '#FEFEFE', padding: '30px', borderRadius: '12px', border: '2px solid #FE6D36' }}>
          <h2 style={{ marginTop: 0, marginBottom: '25px', color: '#FD3012' }}>Edit Profile Information</h2>
          <form onSubmit={handleSaveProfile}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#333' }}>
                  Phone Number
                </label>
                <input
                  type='tel'
                  name='phone'
                  value={profileData.phone}
                  onChange={handleInputChange}
                  placeholder='Enter your phone number'
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
                  Address
                </label>
                <input
                  type='text'
                  name='address'
                  value={profileData.address}
                  onChange={handleInputChange}
                  placeholder='Enter your address'
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
                  Age
                </label>
                <input
                  type='number'
                  name='age'
                  value={profileData.age}
                  onChange={handleInputChange}
                  min='1'
                  max='100'
                  placeholder='Enter your age'
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
                  Gender
                </label>
                <select
                  name='gender'
                  value={profileData.gender}
                  onChange={handleInputChange}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '2px solid #FDB5AB',
                    fontSize: '1rem'
                  }}
                >
                  <option value=''>Select Gender</option>
                  <option value='Male'>Male</option>
                  <option value='Female'>Female</option>
                  <option value='Other'>Other</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#333' }}>
                  Bio
                </label>
                <textarea
                  name='bio'
                  value={profileData.bio}
                  onChange={handleInputChange}
                  rows='5'
                  placeholder='Tell us about yourself...'
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '2px solid #FDB5AB',
                    resize: 'vertical',
                    fontSize: '1rem',
                    fontFamily: 'inherit'
                  }}
                />
              </div>
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
                Save Changes
              </button>
              <button
                type='button'
                onClick={handleCancel}
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
      ) : (
        <div className='info'>
          <div className='about'>
            <h2>About</h2>
            <p>{profile?.Bio || 'No bio added yet. Click "Edit Profile" to add one.'}</p>
          </div>
          <div className='age'>
            <h2>
              <b>Age :</b> {profile?.Age || 'Not specified'}
            </h2>
            <h2>
              <b>Gender :</b> {profile?.Gender || 'Not specified'}
            </h2>
          </div>
        </div>
      )}
    </div>
  );
}

export default Profile;
