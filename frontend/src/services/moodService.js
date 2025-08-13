import { getToken } from './authService';

const BASE_URL = '/api/mood';

// Helper function to make authenticated requests
async function makeRequest(url, options = {}) {
  const token = getToken();
  
  console.log('Making request to:', url);
  console.log('Token available for request:', !!token);
  console.log('Token preview:', token ? token.substring(0, 50) + '...' : 'No token');
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    },
    ...options
  };

  console.log('Request headers:', config.headers);
  console.log('Request config:', config);

  const response = await fetch(url, config);
  
  console.log('Response status:', response.status);
  console.log('Response ok:', response.ok);
  
  if (!response.ok) {
    let errorData = {};
    let errorText = '';
    
    try {
      // Try to get JSON error response
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        errorData = await response.json();
      } else {
        // If not JSON, get text
        errorText = await response.text();
      }
    } catch (parseError) {
      console.error('Error parsing response:', parseError);
      errorText = 'Unable to parse error response';
    }
    
    console.log('Error response data:', errorData);
    console.log('Error response text:', errorText);
    
    // Create a more descriptive error message
    let errorMessage = '';
    if (response.status === 400) {
      errorMessage = errorData.error || errorText || 'Bad Request - Invalid data sent to server';
    } else if (response.status === 401) {
      errorMessage = 'Unauthorized - Please log in again';
    } else if (response.status === 403) {
      errorMessage = 'Forbidden - You do not have permission for this action';
    } else if (response.status === 404) {
      errorMessage = 'Not Found - The requested resource was not found';
    } else if (response.status === 500) {
      errorMessage = 'Internal Server Error - Something went wrong on the server. Please try again or contact support.';
    } else {
      errorMessage = errorData.error || errorText || `HTTP ${response.status}: ${response.statusText}`;
    }
    
    throw new Error(errorMessage);
  }
  
  return response.json();
}

// Submit daily mood check-in
export async function submitMoodEntry(moodData) {
  console.log('submitMoodEntry called with:', moodData);
  
  // Validate mood data before sending
  if (!moodData || typeof moodData.mood !== 'number') {
    throw new Error('Invalid mood data: mood level is required and must be a number');
  }
  
  if (moodData.mood < 1 || moodData.mood > 5) {
    throw new Error('Invalid mood data: mood level must be between 1 and 5');
  }
  
  return makeRequest(BASE_URL, {
    method: 'POST',
    body: JSON.stringify(moodData)
  });
}

// Check if user has submitted mood for today
export async function checkTodayEntry() {
  return makeRequest(`${BASE_URL}/today`);
}

// Get mood history with optional filters
export async function getMoodHistory(filters = {}) {
  const params = new URLSearchParams();
  
  if (filters.startDate) params.append('startDate', filters.startDate);
  if (filters.endDate) params.append('endDate', filters.endDate);
  if (filters.limit) params.append('limit', filters.limit);
  
  const url = `${BASE_URL}/history${params.toString() ? '?' + params.toString() : ''}`;
  return makeRequest(url);
}

// Get current week's mood data for dashboard
export async function getWeekMoodData() {
  return makeRequest(`${BASE_URL}/week`);
}

// Update existing mood entry (same day only)
export async function updateMoodEntry(entryId, updateData) {
  return makeRequest(`${BASE_URL}/${entryId}`, {
    method: 'PUT',
    body: JSON.stringify(updateData)
  });
}

// Get mood statistics
export async function getMoodStats(days = 30) {
  return makeRequest(`${BASE_URL}/stats?days=${days}`);
}