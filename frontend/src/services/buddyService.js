import { getToken } from './authService';

const BASE_URL = '/api/buddy';

// Helper function to make authenticated requests
async function makeRequest(url, options = {}) {
  const token = getToken();
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    },
    ...options
  };

  const response = await fetch(url, config);
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
  }
  
  return response.json();
}

// Generate invite code for buddy system
export async function generateInviteCode() {
  return makeRequest(`${BASE_URL}/invite`, {
    method: 'POST'
  });
}

// Join buddy system using invite code
export async function joinWithInviteCode(inviteCode) {
  return makeRequest(`${BASE_URL}/join`, {
    method: 'POST',
    body: JSON.stringify({ inviteCode })
  });
}

// Get list of user's buddies
export async function getBuddyList() {
  return makeRequest(`${BASE_URL}/list`);
}

// Send flare signal to buddy
export async function sendFlareSignal(buddyId, message, urgencyLevel = 'medium') {
  return makeRequest(`${BASE_URL}/flare`, {
    method: 'POST',
    body: JSON.stringify({
      buddyId,
      message,
      urgencyLevel
    })
  });
}

// Get received flare signals
export async function getFlareSignals(unreadOnly = false) {
  const url = `${BASE_URL}/flares${unreadOnly ? '?unreadOnly=true' : ''}`;
  return makeRequest(url);
}

// Respond to flare signal
export async function respondToFlare(flareId, response) {
  return makeRequest(`${BASE_URL}/flares/${flareId}/respond`, {
    method: 'PUT',
    body: JSON.stringify({ response })
  });
}

// Update buddy permissions
export async function updateBuddyPermissions(buddyId, permissions) {
  return makeRequest(`${BASE_URL}/${buddyId}/permissions`, {
    method: 'PUT',
    body: JSON.stringify({ permissions })
  });
}

// Remove buddy relationship
export async function removeBuddy(buddyId) {
  return makeRequest(`${BASE_URL}/${buddyId}`, {
    method: 'DELETE'
  });
}

// Get buddy's recent mood data (if permissions allow)
export async function getBuddyMoodData(buddyId, days = 7) {
  return makeRequest(`${BASE_URL}/${buddyId}/mood?days=${days}`);
}