import React, { useState, useEffect } from 'react';
import Header from '../Header/Header';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faTrash } from '@fortawesome/free-solid-svg-icons';
import { Link } from 'react-router-dom';
import { makeRequest } from '../../Services/apiUtility'; 
import styles from './EditProfile.module.css';

function EditProfile() {
  const [userName, setUserName] = useState(null); // State to store user name
  const [skills, setSkills] = useState([]);
  const [experience, setExperience] = useState([]);
  const [education, setEducation] = useState([]);
  const [profilePicture, setProfilePicture] = useState(null); // State to store the uploaded profile picture
  const [imagePreview, setImagePreview] = useState('');       // State to show preview of selected image
  const [loading, setLoading] = useState(true);
  
  const userId = localStorage.getItem('userId');               // Retrieve userId from local storage

  // Fetch user data from backend
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await makeRequest({
          url: `https://localhost:3000/api/users/info/${userId}`,
          method: 'GET',
        });
        
        // Populate the state with the fetched data
        setUserName(response.data.name);
        setSkills(response.data.skills || []);  
        setExperience(response.data.workExperience || []);  
        setEducation(response.data.education || []);  
        if (response.data.profilePicture) {
          setImagePreview(`https://localhost:3000/api/users/uploads/profile-pictures/${response.data.profilePicture.split('/').pop()}`);
        } else {
          setImagePreview('https://via.placeholder.com/150'); 
        }
        setLoading(false);
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    fetchUserData();
  }, [userId]);

  // Add a new item (skill, workExperience, education)
  const addItem = async (type) => {
    const newItem = prompt(`Add ${type}`);
    
    if (newItem && type === 'skill') {
      try {
        await makeRequest({
          url: 'https://localhost:3000/api/users/skills',
          method: 'POST',
          data: { skill: newItem },
          headers: { 'Content-Type': 'application/json' },
        });
        setSkills([...skills, { text: newItem, public: true }]);  // Skill is public by default
      } catch (error) {
        console.error('Error adding new skill:', error);
      }
    } else if (newItem && type === 'experience') {
      try {
        await makeRequest({
          url: 'https://localhost:3000/api/users/work-experience',
          method: 'POST',
          data: { experience: newItem },
          headers: { 'Content-Type': 'application/json' },
        });
        setExperience([...experience, { text: newItem }]); 
      } catch (error) {
        console.error('Error adding new experience:', error);
      }
    } else if (newItem && type === 'education') {
      try {
        await makeRequest({
          url: 'https://localhost:3000/api/users/education',
          method: 'POST',
          data: { education: newItem },
          headers: { 'Content-Type': 'application/json' },
        });
        setEducation([...education, { text: newItem }]);  
      } catch (error) {
        console.error('Error adding new education:', error);
      }
    }
  };  

  const removeItem = async (type, index) => {
    try {
      let url;
      if (type === 'skill') {
        url = `https://localhost:3000/api/users/skills/${index}`;
      } else if (type === 'experience') {
        url = `https://localhost:3000/api/users/work-experience/${index}`;
      } else if (type === 'education') {
        url = `https://localhost:3000/api/users/education/${index}`;
      }

      await makeRequest({
        url,
        method: 'DELETE',
      });

      if (type === 'skill') {
        setSkills(skills.filter((_, i) => i !== index));
      } else if (type === 'experience') {
        setExperience(experience.filter((_, i) => i !== index));
      } else if (type === 'education') {
        setEducation(education.filter((_, i) => i !== index));
      }
    } catch (error) {
      console.error(`Error deleting ${type}:`, error);
    }
  };

  // Handle profile picture upload
  const handleProfilePictureChange = (e) => {
    const file = e.target.files[0];
    setProfilePicture(file);
    setImagePreview(URL.createObjectURL(file));  // Preview the selected image
  };

  const uploadProfilePicture = async () => {
    if (!profilePicture) return;

    const formData = new FormData();
    formData.append('profilePicture', profilePicture);

    try {
      await makeRequest({
        url: 'https://localhost:3000/api/users/profile-picture',
        method: 'POST',
        data: formData,
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      alert('Profile picture updated successfully!');
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      alert('Failed to upload profile picture');
    }
  };

  const togglePublicStatus = async (type, index, item) => {
    const newStatus = !item.public;
    
    try {
      let url;
      if (type === 'skill') {
        url = `https://localhost:3000/api/users/skills/${index}`;
      } else if (type === 'experience') {
        url = `https://localhost:3000/api/users/work-experience/${index}`;
      } else if (type === 'education') {
        url = `https://localhost:3000/api/users/education/${index}`;
      }

      await makeRequest({
        url,
        method: 'PUT',
        data: { public: newStatus },
        headers: { 'Content-Type': 'application/json' },
      });

      if (type === 'skill') {
        setSkills(skills.map((s, i) => (i === index ? { ...s, public: newStatus } : s)));
      } else if (type === 'experience') {
        setExperience(experience.map((exp, i) => (i === index ? { ...exp, public: newStatus } : exp)));
      } else if (type === 'education') {
        setEducation(education.map((edu, i) => (i === index ? { ...edu, public: newStatus } : edu)));
      }
    } catch (error) {
      console.error('Error toggling public status:', error);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className={styles['edit-profile-page']}>
      <Header />
      <div className={styles['profile-content']}>
        {/* Profile Header Section */}
        <div className={styles['profile-header']}>
          <div className={styles['profile-info']}>
            <img src={imagePreview} alt="Profile" className={styles['profile-pic']} />
            <h2 className={styles['profile-name']}>{userName}</h2>
            <input type="file" accept="image/*" onChange={handleProfilePictureChange} />
            <button onClick={uploadProfilePicture} className={styles['upload-button']}>
              Upload Profile Picture
            </button>
          </div>
        </div>

        {/* Profile Details Section */}
        <div className={styles['profile-details-section']}>
          {/* Skills Section */}
          <div className={styles['skills-container']}>
            <div className={styles['container-header']}>
              <h3>Skills</h3>
              <FontAwesomeIcon
                icon={faPlus}
                className={styles['add-icon']}
                onClick={() => addItem('skill')}
              />
            </div>
            <ul>
              {(skills || []).map((skill, index) => (  
                <li key={index}>
                  <span>{skill.text}</span>
                  <button onClick={() => togglePublicStatus('skill', index, skill)}>
                    Make {skill.public ? 'Private' : 'Public'}
                  </button>
                  <FontAwesomeIcon
                    icon={faTrash}
                    className={styles['remove-icon']}
                    onClick={() => removeItem('skill', index)}
                  />
                </li>
              ))}
            </ul>
          </div>

          {/* Experience Section */}
          <div className={styles['experience-container']}>
            <div className={styles['container-header']}>
              <h3>Experience</h3>
              <FontAwesomeIcon
                icon={faPlus}
                className={styles['add-icon']}
                onClick={() => addItem('experience')}
              />
            </div>
            <ul>
              {(experience || []).map((exp, index) => (
                <li key={index}>
                  <span>{exp.text}</span>
                  <button onClick={() => togglePublicStatus('experience', index, exp)}>
                    Make {exp.public ? 'Private' : 'Public'}
                  </button>
                  <FontAwesomeIcon
                    icon={faTrash}
                    className={styles['remove-icon']}
                    onClick={() => removeItem('experience', index)}
                  />
                </li>
              ))}
            </ul>
          </div>

         {/* Education Section */}
         <div className={styles['education-container']}>
            <div className={styles['container-header']}>
              <h3>Education</h3>
              <FontAwesomeIcon
                icon={faPlus}
                className={styles['add-icon']}
                onClick={() => addItem('education')}
              />
            </div>
            <ul>
              {(education || []).map((edu, index) => (
                <li key={index}>
                  <span>{edu.text}</span>
                  <button onClick={() => togglePublicStatus('education', index, edu)}>
                    Make {edu.public ? 'Private' : 'Public'}
                  </button>
                  <FontAwesomeIcon
                    icon={faTrash}
                    className={styles['remove-icon']}
                    onClick={() => removeItem('education', index)}
                  />
                </li>
              ))}
            </ul>
          </div>

          {/* Done Button */}
          <div className={styles['done-button-container']}>
            <Link to={`/profile/${userId}`}>
              <button className={styles['done-button']}>Done</button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EditProfile;
