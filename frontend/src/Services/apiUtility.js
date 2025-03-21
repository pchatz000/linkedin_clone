import axios from 'axios';

// Utility function to handle API requests with token renewal
export const makeRequest = async (requestConfig) => {
  const accessToken = localStorage.getItem('accessToken');
  const refreshToken = localStorage.getItem('refreshToken');

  try {
    // Make the API request with the current access token
    const response = await axios({
      ...requestConfig,
      headers: {
        ...requestConfig.headers,
        Authorization: `Bearer ${accessToken}`,
      },
    });

    return response; // Return the response if successful
  } catch (error) {
    if (error.response && error.response.status === 403) {
      // If access token is expired, try to refresh the token
      try {
        const refreshResponse = await axios.post('https://localhost:3000/api/auth/refresh', {
          refreshToken,
        });

        const newAccessToken = refreshResponse.data.accessToken;
        localStorage.setItem('accessToken', newAccessToken); // Update the access token

        // Retry the original request with the new access token
        const retryResponse = await axios({
          ...requestConfig,
          headers: {
            ...requestConfig.headers,
            Authorization: `Bearer ${newAccessToken}`,
          },
        });

        return retryResponse; // Return the response after retrying
      } catch (refreshError) {
        // Handle refresh token failure 
        console.error('Error refreshing token:', refreshError);
        localStorage.clear(); // Clear tokens from localStorage
        window.location.href = '/welcome/login'; // Redirect to login
      }
    } else {
      // Handle other errors (non-token related)
      throw error;
    }
  }
};
