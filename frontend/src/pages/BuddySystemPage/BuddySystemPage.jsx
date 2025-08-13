import { useState, useEffect } from 'react';
import { 
  generateInviteCode, 
  joinWithInviteCode, 
  getBuddyList, 
  sendFlareSignal, 
  getFlareSignals, 
  respondToFlare,
  removeBuddy 
} from '../../services/buddyService';
import './BuddySystemPage.css';

export default function BuddySystemPage({ user }) {
  const [activeTab, setActiveTab] = useState('buddies');
  const [buddies, setBuddies] = useState([]);
  const [flares, setFlares] = useState([]);
  const [inviteCode, setInviteCode] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadBuddies();
    loadFlares();
  }, []);

  const loadBuddies = async () => {
    try {
      const response = await getBuddyList();
      setBuddies(response.buddies);
    } catch (error) {
      console.error('Error loading buddies:', error);
      setError('Failed to load buddy list');
    }
  };

  const loadFlares = async () => {
    try {
      const response = await getFlareSignals();
      setFlares(response.flares);
    } catch (error) {
      console.error('Error loading flares:', error);
    }
  };

  const handleGenerateInvite = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await generateInviteCode();
      setInviteCode(response.inviteCode);
      setSuccess('Invite code generated! Share it with someone you trust.');
    } catch (error) {
      setError(error.message || 'Failed to generate invite code');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinBuddy = async (e) => {
    e.preventDefault();
    if (!joinCode.trim()) return;

    setLoading(true);
    setError('');
    try {
      await joinWithInviteCode(joinCode.trim().toUpperCase());
      setJoinCode('');
      setSuccess('Successfully added as buddy!');
      await loadBuddies();
    } catch (error) {
      setError(error.message || 'Failed to join with invite code');
    } finally {
      setLoading(false);
    }
  };

  const handleSendFlare = async (buddyId, urgency = 'medium') => {
    const message = urgency === 'crisis' 
      ? 'I need immediate support - this is urgent.'
      : 'I could use some support right now.';

    try {
      await sendFlareSignal(buddyId, message, urgency);
      setSuccess(`Flare signal sent to your buddy.`);
    } catch (error) {
      setError(error.message || 'Failed to send flare signal');
    }
  };

  const handleRespondToFlare = async (flareId, response) => {
    try {
      await respondToFlare(flareId, response);
      await loadFlares();
      setSuccess('Response sent successfully');
    } catch (error) {
      setError(error.message || 'Failed to respond to flare');
    }
  };

  const handleRemoveBuddy = async (buddyId, buddyName) => {
    if (!window.confirm(`Are you sure you want to remove ${buddyName} as your buddy?`)) {
      return;
    }

    try {
      await removeBuddy(buddyId);
      await loadBuddies();
      setSuccess('Buddy removed successfully');
    } catch (error) {
      setError(error.message || 'Failed to remove buddy');
    }
  };

  const copyInviteCode = () => {
    navigator.clipboard.writeText(inviteCode);
    setSuccess('Invite code copied to clipboard!');
  };

  const getUrgencyColor = (urgency) => {
    const colors = {
      low: '#28a745',
      medium: '#ffc107', 
      high: '#fd7e14',
      crisis: '#dc3545'
    };
    return colors[urgency] || colors.medium;
  };

  const getTimeAgo = (date) => {
    const now = new Date();
    const past = new Date(date);
    const diffInMinutes = Math.floor((now - past) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  return (
    <div className="buddy-system-page">
      <header className="page-header">
        <h1>🤝 Buddy System</h1>
        <p>Connect with trusted friends and family for mutual support</p>
      </header>

      {error && (
        <div className="alert alert-error">
          <span>⚠️ {error}</span>
          <button onClick={() => setError('')} className="alert-close">×</button>
        </div>
      )}

      {success && (
        <div className="alert alert-success">
          <span>✅ {success}</span>
          <button onClick={() => setSuccess('')} className="alert-close">×</button>
        </div>
      )}

      <div className="tabs">
        <button 
          className={`tab ${activeTab === 'buddies' ? 'active' : ''}`}
          onClick={() => setActiveTab('buddies')}
        >
          My Buddies ({buddies.length})
        </button>
        <button 
          className={`tab ${activeTab === 'invite' ? 'active' : ''}`}
          onClick={() => setActiveTab('invite')}
        >
          Add Buddy
        </button>
        <button 
          className={`tab ${activeTab === 'flares' ? 'active' : ''}`}
          onClick={() => setActiveTab('flares')}
        >
          Flare Signals ({flares.filter(f => !f.isRead).length})
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'buddies' && (
          <div className="buddies-tab">
            <div className="section-header">
              <h2>Your Support Network</h2>
              <p>These are the people who have your back</p>
            </div>

            {buddies.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">🤝</div>
                <h3>No buddies yet</h3>
                <p>Add trusted friends or family members to your support network</p>
                <button 
                  className="btn btn-primary"
                  onClick={() => setActiveTab('invite')}
                >
                  Add Your First Buddy
                </button>
              </div>
            ) : (
              <div className="buddies-grid">
                {buddies.map(buddy => (
                  <div key={buddy.id} className="buddy-card">
                    <div className="buddy-info">
                      <div className="buddy-avatar">
                        {buddy.buddy.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="buddy-details">
                        <h3>{buddy.buddy.name}</h3>
                        <p className="buddy-email">{buddy.buddy.email}</p>
                        <p className="buddy-since">
                          Buddies since {new Date(buddy.since).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    
                    <div className="buddy-actions">
                      <div className="flare-buttons">
                        <button
                          className="flare-btn flare-medium"
                          onClick={() => handleSendFlare(buddy.buddy._id, 'medium')}
                          title="Send support request"
                        >
                          🚨 Need Support
                        </button>
                        <button
                          className="flare-btn flare-crisis"
                          onClick={() => handleSendFlare(buddy.buddy._id, 'crisis')}
                          title="Send urgent help request"
                        >
                          🆘 Crisis
                        </button>
                      </div>
                      
                      <div className="buddy-menu">
                        <button 
                          className="btn btn-small btn-secondary"
                          onClick={() => handleRemoveBuddy(buddy.id, buddy.buddy.name)}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'invite' && (
          <div className="invite-tab">
            <div className="invite-section">
              <h2>🔗 Generate Invite Code</h2>
              <p>Create a secure code to share with someone you trust</p>
              
              <button 
                className="btn btn-primary"
                onClick={handleGenerateInvite}
                disabled={loading}
              >
                {loading ? 'Generating...' : 'Generate New Invite Code'}
              </button>

              {inviteCode && (
                <div className="invite-code-display">
                  <h3>Your Invite Code:</h3>
                  <div className="code-container">
                    <code className="invite-code">{inviteCode}</code>
                    <button 
                      className="btn btn-small btn-secondary"
                      onClick={copyInviteCode}
                    >
                      Copy
                    </button>
                  </div>
                  <p className="code-instructions">
                    Share this code with someone you trust. It expires in 7 days.
                  </p>
                </div>
              )}
            </div>

            <div className="join-section">
              <h2>🤝 Join as Buddy</h2>
              <p>Have an invite code? Enter it below to join someone's support network</p>
              
              <form onSubmit={handleJoinBuddy} className="join-form">
                <div className="form-group">
                  <label htmlFor="joinCode">Invite Code</label>
                  <input
                    type="text"
                    id="joinCode"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    placeholder="Enter 8-character code"
                    maxLength={8}
                    className="form-input"
                  />
                </div>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={loading || !joinCode.trim()}
                >
                  {loading ? 'Joining...' : 'Join as Buddy'}
                </button>
              </form>
            </div>
          </div>
        )}

        {activeTab === 'flares' && (
          <div className="flares-tab">
            <div className="section-header">
              <h2>🚨 Flare Signals</h2>
              <p>Support requests from your buddies</p>
            </div>

            {flares.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">🚨</div>
                <h3>No flare signals</h3>
                <p>You'll see support requests from your buddies here</p>
              </div>
            ) : (
              <div className="flares-list">
                {flares.map(flare => (
                  <div 
                    key={flare._id} 
                    className={`flare-card ${!flare.isRead ? 'unread' : ''}`}
                  >
                    <div className="flare-header">
                      <div className="flare-sender">
                        <div className="sender-avatar">
                          {flare.sender.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="sender-info">
                          <h4>{flare.sender.name}</h4>
                          <span className="flare-time">{getTimeAgo(flare.createdAt)}</span>
                        </div>
                      </div>
                      <div 
                        className="urgency-badge"
                        style={{ backgroundColor: getUrgencyColor(flare.urgencyLevel) }}
                      >
                        {flare.urgencyLevel.toUpperCase()}
                      </div>
                    </div>
                    
                    <div className="flare-message">
                      <p>{flare.message}</p>
                    </div>

                    {!flare.isRead && (
                      <div className="flare-actions">
                        <button
                          className="btn btn-primary"
                          onClick={() => handleRespondToFlare(flare._id, "I'm here for you. Let's talk.")}
                        >
                          👋 I'm Here
                        </button>
                        <button
                          className="btn btn-secondary"
                          onClick={() => handleRespondToFlare(flare._id, "Checking in on you. How can I help?")}
                        >
                          💬 Check In
                        </button>
                        {flare.urgencyLevel === 'crisis' && (
                          <a 
                            href={`tel:${flare.sender.phone || '911'}`}
                            className="btn btn-danger"
                          >
                            📞 Call Now
                          </a>
                        )}
                      </div>
                    )}

                    {flare.isRead && flare.response && (
                      <div className="flare-response">
                        <p><strong>Your response:</strong> {flare.response}</p>
                        <span className="response-time">
                          Responded {getTimeAgo(flare.respondedAt)}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}