import React, { useState, useEffect } from 'react';
import Header from '../Header/Header';
import styles from './Jobs.module.css';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark } from '@fortawesome/free-solid-svg-icons';
import { makeRequest } from '../../Services/apiUtility';  // Import the makeRequest function

function Jobs() {
    const [showForm, setShowForm] = useState(false);
    const [jobTitle, setJobTitle] = useState('');
    const [companyName, setCompanyName] = useState('');
    const [location, setLocation] = useState('');
    const [description, setDescription] = useState('');

    // State to store the list of jobs fetched from the backend
    const [jobListings, setJobListings] = useState([]);
    const [postedJobs, setPostedJobs] = useState([]);
    const userId = localStorage.getItem('userId');  // Fetch user ID from local storage

    // Fetch job listings and user posted jobs when the component mounts
    useEffect(() => {
        const fetchJobs = async () => {
            try {
                // Fetch the job feed (job IDs)
                const feedResponse = await makeRequest({
                    url: 'https://localhost:3000/api/job/feed',
                    method: 'GET',
                });

                const jobIds = feedResponse.data; // Job IDs are in the .data array

                // Fetch job details for each job ID in the feed
                const jobDetailsPromises = jobIds.map(async (jobId) => {
                    const jobResponse = await makeRequest({
                        url: `https://localhost:3000/api/job/info/${jobId}`,
                        method: 'GET',
                    });
                    return jobResponse.data;
                });

                // Wait for all job details to be fetched
                const jobDetails = await Promise.all(jobDetailsPromises);
                setJobListings(jobDetails); // Update the state with fetched job details

            } catch (error) {
                console.error('Error fetching jobs:', error);
            }
        };

        const fetchUserPostedJobs = async () => {
            try {
                // Fetch user info to get the user's posted jobs
                const userResponse = await makeRequest({
                    url: `https://localhost:3000/api/users/info/${userId}`,
                    method: 'GET',
                });

                const userPostedJobIds = userResponse.data.postedJobs; // Get posted job IDs

                // Fetch details of each job posted by the user
                const postedJobDetailsPromises = userPostedJobIds.map(async (jobId) => {
                    const jobResponse = await makeRequest({
                        url: `https://localhost:3000/api/job/info/${jobId}`,
                        method: 'GET',
                    });
                    return jobResponse.data;
                });

                const postedJobDetails = await Promise.all(postedJobDetailsPromises);
                setPostedJobs(postedJobDetails); // Update the state with user's posted jobs

            } catch (error) {
                console.error('Error fetching user posted jobs:', error);
            }
        };

        fetchJobs();
        fetchUserPostedJobs();
    }, [userId]);

    const toggleForm = () => {
        setShowForm(!showForm);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Create the job listing
        const jobDetails = {
            title: jobTitle,
            location,
            companyName,
            description,
        };

        try {
            // Make the API call using makeRequest
            const response = await makeRequest({
                url: 'https://localhost:3000/api/job',
                method: 'POST',
                data: jobDetails,
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            // Get the newly created job from the response
            const newJob = response.data;

            // Update the job listings in the state
            setJobListings([newJob, ...jobListings]);

            // Clear form fields and close the form
            setJobTitle('');
            setCompanyName('');
            setLocation('');
            setDescription('');
            setShowForm(false);

            alert('Job posted successfully!');
        } catch (error) {
            console.error('Error posting job:', error);
            alert('Failed to post the job. Please try again.');
        }
    };

    // Function to handle job application
    const handleApply = async (jobId) => {
        try {
            // Make the API call to apply for the job
            const response = await makeRequest({
                url: `https://localhost:3000/api/job/apply/${jobId}`,
                method: 'POST',
            });
    
            // Check the message from the response and display appropriate alerts
            const { message } = response.data;
    
            if (message === 'Application successful') {
                alert('You have successfully applied for this job!');
    
                // Update the specific job with the new applicant
                const updatedJobListings = jobListings.map((job) => {
                    if (job._id === jobId) {
                        return {
                            ...job,
                            applicants: response.data.job.applicants, // Update applicants list
                        };
                    }
                    return job;
                });
    
                // Update the job listings state
                setJobListings(updatedJobListings);
    
            } else if (message === 'You have already applied for this job') {
                alert('You have already applied for this job.');
            }
    
        } catch (error) {
            // Handle the case where the user already applied (400 Bad Request)
            if (error.response && error.response.status === 400) {
                const { message } = error.response.data;
                if (message === 'You have already applied for this job') {
                    alert('You have already applied for this job.');
                } else {
                    alert('Bad Request: ' + message);
                }
            } else {
                // Handle other errors (network issues, etc.)
                console.error('Error applying to job:', error);
                alert('Failed to apply for the job. Please try again.');
            }
        }
    };               

    return (
        <div className={styles.jobsPage}>
            <div className={styles.headerWrapper}>
                <Header />
            </div>
            <div className={styles.jobsContent}>
                <div className={styles.jobListings}>
                    {/* Display user's posted jobs */}
                    <h2>Your Posted Jobs</h2>
                    {postedJobs.length > 0 ? (
                        postedJobs.map((job, index) => (
                            <div key={index} className={styles.jobCard}>
                                <div className={styles.jobCardInfo}>
                                    <h3>{job.title}</h3>
                                    <p>{job.companyName} | {job.location}</p>
                                    <p>{job.description}</p>
                                </div>
                                <button 
                                    className={styles.jobCardButton} 
                                    onClick={() => {
                                        localStorage.setItem('jobId', job._id);  // Store jobId in local storage
                                        window.location.href = '/applicants';    // Navigate to applicants page
                                    }}
                                >
                                    See Applicants
                                </button>
                            </div>
                        ))
                    ) : (
                        <p>No jobs posted yet.</p>
                    )}

                    {/* Display general job feed */}
                    <h2>All Job Listings</h2>
                    {jobListings.map((job, index) => (
                        <div key={index} className={styles.jobCard}>
                            <div className={styles.jobCardInfo}>
                                <h3>{job.title}</h3>
                                <p>{job.companyName} | {job.location}</p>
                                <p>{job.description}</p>
                            </div>
                            <button className={styles.jobCardButton} onClick={() => handleApply(job._id)}>
                                APPLY
                            </button> 
                        </div>
                    ))}
                </div>
                <div className={styles.sidebar}>
                    <button className={styles.postJobButton} onClick={toggleForm}>
                        POST A JOB
                    </button>
                </div>
            </div>

            {/* Job Post Form */}
            {showForm && (
                <div className={styles.formOverlay}>
                    <form className={styles.jobForm} onSubmit={handleSubmit}>
                        <FontAwesomeIcon
                            icon={faXmark}
                            className={styles.closeIcon}
                            onClick={toggleForm}
                        />
                        <h2>Post a New Job</h2>
                        <label>
                            Job Title:
                            <input
                                type="text"
                                value={jobTitle}
                                onChange={(e) => setJobTitle(e.target.value)}
                                required
                            />
                        </label>
                        <label>
                            Company Name:
                            <input
                                type="text"
                                value={companyName}
                                onChange={(e) => setCompanyName(e.target.value)}
                                required
                            />
                        </label>
                        <label>
                            Location:
                            <input
                                type="text"
                                value={location}
                                onChange={(e) => setLocation(e.target.value)}
                                required
                            />
                        </label>
                        <label>
                            Description:
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                required
                            />
                        </label>
                        <div className={styles.formButtons}>
                            <button type="submit">Post Job</button>
                            <button type="button" onClick={toggleForm}>
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}

export default Jobs;
