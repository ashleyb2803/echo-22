// frontend/src/pages/DashboardPage/DashboardPage.jsx
import React, { useState } from 'react';
import './DashboardPage.css';
import { createMoodEntry } from '../../services/moodService';

export default function DashboardPage({ user }) {
  const [mood, setMood] = useState(3);
  const [journal, setJournal] = useState('');
  const [affirmation, setAffirmation] = useState('');
  const [submitted, setSubmitted] = useState(false);

 const handleSubmit = async (e) => {
  e.preventDefault();
  try {
    const entry = await createMoodEntry({
      mood,
      journal,
      affirmation: "You made it today. That’s enough. Keep going." // placeholder for now
    });
    setAffirmation(entry.affirmation);
    setSubmitted(true);
    setJournal('');
  } catch (err) {
    console.error('Error submitting mood:', err);
  }
};


  return (
    <main className="dashboard-container">
      <h1>Welcome back, {user?.name || 'Warrior'}</h1>

      <section className="checkin-box">
        <h2>How are you feeling today?</h2>
        <form onSubmit={handleSubmit}>
          <label>Mood: {mood}</label>
          <input
            type="range"
            min="1"
            max="5"
            value={mood}
            onChange={(e) => setMood(Number(e.target.value))}
          />

          <textarea
            placeholder="Want to say more?"
            value={journal}
            onChange={(e) => setJournal(e.target.value)}
          />

          <button type="submit">Check In</button>
        </form>
      </section>

      {submitted && (
        <section className="affirmation-card">
          <h2>🧠 Daily Affirmation</h2>
          <p>{affirmation}</p>
        </section>
      )}

      <section className="quick-links">
        <h3>Quick Access</h3>
        <div className="button-row">
          <a href="/support-wall">Peer Support</a>
          <a href="/buddy-system">Buddy System</a>
          <a href="/resources">Resources</a>
        </div>
      </section>
    </main>
  );
}
