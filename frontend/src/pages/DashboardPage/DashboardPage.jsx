import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { submitMoodEntry, checkTodayEntry, getWeekMoodData } from '../../services/moodService';
import { getToken, getUser } from '../../services/authService'; // Add this import
import './DashboardPage.css';

export default function DashboardPage({ user }) {
  const [moodLevel, setMoodLevel] = useState(3);
  const [moodNote, setMoodNote] = useState('');
  const [todayCheckedIn, setTodayCheckedIn] = useState(false);
  const [dailyAffirmation, setDailyAffirmation] = useState('');
  const [recentMoods, setRecentMoods] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Check authentication first
    const token = getToken();
    const currentUser = getUser();
    
    console.log('Dashboard - Token available:', !!token);
    console.log('Dashboard - User available:', !!currentUser);
    
    if (!token) {
      setError('Your session has expired. Please log in again.');
      return;
    }
    
    // Check if user already checked in today
    checkTodayMoodEntry();
    // Load recent mood data
    loadRecentMoods();
    // Generate daily affirmation
    generateDailyAffirmation();
  }, []);

  const checkTodayMoodEntry = async () => {
    try {
      const response = await checkTodayEntry();
      setTodayCheckedIn(response.hasEntry);
    } catch (error) {
      console.error('Error checking today entry:', error);
      
      // If it's an auth error, don't just fallback to false
      if (error.message.includes('401') || error.message.includes('Unauthorized')) {
        setError('Authentication failed. Please log in again.');
        return;
      }
      
      // Fallback to false if API fails for other reasons
      setTodayCheckedIn(false);
    }
  };

  const loadRecentMoods = async () => {
    try {
      const response = await getWeekMoodData();
      setRecentMoods(response.weekData);
    } catch (error) {
      console.error('Error loading recent moods:', error);
      
      // Don't show error for mood loading unless it's auth-related
      if (error.message.includes('401') || error.message.includes('Unauthorized')) {
        setError('Authentication failed. Please log in again.');
      }
      
      // Fallback to empty array if API fails
      setRecentMoods([]);
    }
  };

  const generateDailyAffirmation = () => {
    const affirmations = [
      "Your strength has carried you through challenges before, and it will carry you through today.",
      "Every small step forward is progress worth celebrating.",
      "You are worthy of support, kindness, and understanding - especially from yourself.",
      "Your experiences, both difficult and positive, have shaped your resilience.",
      "Today is a new opportunity to practice self-compassion and care.",
      "Your mental health journey is valid, and seeking support shows courage.",
      "You have survived 100% of your difficult days so far. That's a perfect record.",
      "Your service and sacrifice matter, and so does your wellbeing."
    ];
    
    const today = new Date().getDate();
    const todayAffirmation = affirmations[today % affirmations.length];
    setDailyAffirmation(todayAffirmation);
  };

  const handleMoodSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Debug: Check authentication before submitting
      const token = getToken();
      const currentUser = getUser();
      
      console.log('Submit - Token available:', !!token);
      console.log('Submit - User available:', !!currentUser);
      console.log('Token preview:', token ? token.substring(0, 50) + '...' : 'No token');
      
      if (!token) {
        setError('Your session has expired. Please log in again.');
        return;
      }

      // Debug: Check token payload
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        console.log('Token payload:', payload);
        console.log('Token expires at:', new Date(payload.exp * 1000));
        console.log('Token is expired:', payload.exp * 1000 < Date.now());
      } catch (e) {
        console.error('Token parsing error:', e);
        setError('Invalid token format. Please log in again.');
        return;
      }

      const moodData = {
        mood: moodLevel,
        note: moodNote
      };

      console.log('Submitting mood data:', moodData);
      await submitMoodEntry(moodData);
      
      setTodayCheckedIn(true);
      setMoodNote('');
      
      // Refresh recent moods
      await loadRecentMoods();
      
    } catch (error) {
      console.error('Full error submitting mood:', error);
      
      // More specific error handling
      if (error.message.includes('401') || error.message.includes('Unauthorized')) {
        setError('Your session has expired. Please log in again.');
      } else if (error.message.includes('403')) {
        setError('You do not have permission to perform this action.');
      } else if (error.message.includes('400')) {
        setError('Invalid mood data. Please check your input and try again.');
      } else {
        setError(error.message || 'Error saving mood check-in. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const getMoodEmoji = (mood) => {
    const emojis = ['😢', '😕', '😐', '😊', '😄'];
    return emojis[mood - 1] || '😐';
  };

  const getMoodLabel = (mood) => {
    const labels = ['Very Low', 'Low', 'Okay', 'Good', 'Great'];
    return labels[mood - 1] || 'Okay';
  };

  return (
    <div className="dashboard-page">
      <header className="dashboard-header">
        <h1>Welcome back, {user?.name || 'there'}! 👋</h1>
        <p className="date-display">{new Date().toLocaleDateString('en-US', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })}</p>
      </header>

      <div className="dashboard-grid">
        {/* Daily Mood Check-In */}
        <section className="mood-checkin-card">
          <h2>✅ Daily Mood Check-In</h2>
          {todayCheckedIn ? (
            <div className="already-checked-in">
              <p>✅ You've already checked in today!</p>
              <p>Great job staying connected with your mental health.</p>
            </div>
          ) : (
            <>
              {error && (
                <div className="error-message">
                  <p>⚠️ {error}</p>
                </div>
              )}
              <form onSubmit={handleMoodSubmit} className="mood-form">
              <div className="mood-selector">
                <label>How are you feeling today?</label>
                <div className="mood-scale">
                  {[1, 2, 3, 4, 5].map(level => (
                    <button
                      key={level}
                      type="button"
                      className={`mood-option ${moodLevel === level ? 'selected' : ''}`}
                      onClick={() => setMoodLevel(level)}
                    >
                      <span className="mood-emoji">{getMoodEmoji(level)}</span>
                      <span className="mood-label">{getMoodLabel(level)}</span>
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="mood-note">
                <label htmlFor="mood-note">Want to say more? (Optional)</label>
                <textarea
                  id="mood-note"
                  value={moodNote}
                  onChange={(e) => setMoodNote(e.target.value)}
                  placeholder="How was your day? Any specific thoughts or feelings you'd like to note?"
                  rows={3}
                />
              </div>
              
              <button type="submit" disabled={loading} className="submit-mood-btn">
                {loading ? 'Saving...' : 'Submit Check-In'}
              </button>
                          </form>
            </>
          )}
        </section>

        {/* Daily Affirmation */}
        <section className="affirmation-card">
          <h2>🧠 Today's Affirmation</h2>
          <blockquote className="affirmation-text">
            "{dailyAffirmation}"
          </blockquote>
          <p className="affirmation-note">Take a moment to reflect on these words.</p>
        </section>

        {/* Recent Mood Chart */}
        <section className="mood-chart-card">
          <h2>📈 Your Week at a Glance</h2>
          <div className="mood-chart">
            {recentMoods.map((entry, index) => (
              <div key={index} className="mood-bar">
                <div className="mood-date">{entry.date}</div>
                <div className="mood-visual">
                  {entry.hasEntry ? (
                    <>
                      <div 
                        className="mood-level-bar"
                        style={{ height: `${entry.mood * 20}%` }}
                      ></div>
                      <span className="mood-emoji-small">{getMoodEmoji(entry.mood)}</span>
                    </>
                  ) : (
                    <div className="no-entry">
                      <span className="no-entry-text">-</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          <Link to="/journal" className="view-details-link">
            View detailed mood history →
          </Link>
        </section>

        {/* Quick Access Buttons */}
        <section className="quick-access-card">
          <h2>🔗 Quick Access</h2>
          <div className="quick-access-grid">
            <Link to="/buddy-system" className="quick-access-btn buddy">
              <span className="btn-icon">🤝</span>
              <span className="btn-text">Buddy System</span>
              <span className="btn-desc">Connect with your support network</span>
            </Link>
            
            <Link to="/resources" className="quick-access-btn resources">
              <span className="btn-icon">📚</span>
              <span className="btn-text">Resources</span>
              <span className="btn-desc">Mental health tools & information</span>
            </Link>
            
            <Link to="/posts" className="quick-access-btn community">
              <span className="btn-icon">💬</span>
              <span className="btn-text">Peer Support</span>
              <span className="btn-desc">Connect with the community</span>
            </Link>
            
            <div className="crisis-resources">
              <h3>🚨 Need Immediate Help?</h3>
              <div className="crisis-links">
                <a href="tel:988" className="crisis-btn">
                  📞 Crisis Lifeline: 988
                </a>
                <a href="tel:1-800-273-8255" className="crisis-btn">
                  🎖️ Veterans Crisis Line
                </a>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}