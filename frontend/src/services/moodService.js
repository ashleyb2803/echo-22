import sendRequest from './sendRequest';

const BASE_URL = '/api/moods';

export function createMoodEntry(data) {
  return sendRequest(BASE_URL, 'POST', data);
}

export function getRecentMoodEntries() {
  return sendRequest(BASE_URL);
}
