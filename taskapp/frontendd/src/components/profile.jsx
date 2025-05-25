import React, { useState, useEffect, useCallback } from 'react';
import { Authenticator } from '@aws-amplify/ui-react';
import { fetchAuthSession, fetchUserAttributes } from '@aws-amplify/auth';
import PinkNavbar from '../components/navbar';

const API_BASE_URL = "https://m7ucuqnlaf.execute-api.us-east-1.amazonaws.com/dev";

function Profile() {
  return (
    <Authenticator>
      {({ user, signOut }) => {
        return user ? (
          <ProfileContent user={user} signOut={signOut} />
        ) : (
          <div style={{ textAlign: 'center', paddingTop: 50, fontFamily: '"Comic Sans MS", cursive' }}>
            🌸 Please sign in to view your sparkly profile ✨
          </div>
        );
      }}
    </Authenticator>
  );
}

function ProfileContent({ user, signOut }) {
  const [profile, setProfile] = useState({ name: '', email: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const fetchProfile = useCallback(async () => {
    if (!user?.userId) {
      setError('User not authenticated');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError('');
      setMessage('');
      const userAttributes = await fetchUserAttributes();
      const session = await fetchAuthSession();
      const token = session?.tokens?.idToken?.toString();
      if (!token) throw new Error('Authentication token not found');

      const response = await fetch(`${API_BASE_URL}/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch profile: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      if (data.profile) {
        setProfile({
          name: data.profile.name || '',
          email: data.profile.email || userAttributes.email || '',
        });
      } else {
        throw new Error('Invalid profile data structure');
      }
    } catch (err) {
      setError(err.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  }, [user]);

  const handleUpdate = async () => {
    try {
      setError('');
      setMessage('');
      const session = await fetchAuthSession();
      const token = session?.tokens?.idToken?.toString();
      if (!token) throw new Error('Authentication token not found');

      const response = await fetch(`${API_BASE_URL}/profile`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profile),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to update profile: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      setMessage(data.message || '🌸 Profile updated with love!');
      await fetchProfile();
    } catch (err) {
      setError(err.message || 'Failed to update profile');
    }
  };

  const handleDelete = async () => {
    try {
      const session = await fetchAuthSession();
      const token = session?.tokens?.idToken?.toString();
      if (!token) throw new Error('Authentication token not found');

      const response = await fetch(`${API_BASE_URL}/profile`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to delete profile: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      setMessage(data.message || '💔 Profile deleted. We’ll miss you!');
      signOut();
    } catch (err) {
      setError(err.message || 'Failed to delete profile');
    }
  };

  useEffect(() => {
    if (user?.userId) {
      fetchProfile();
    } else {
      setLoading(false);
      setError('User not authenticated');
    }
  }, [user, fetchProfile]);

  if (loading) return <div style={{ textAlign: 'center', marginTop: 40, fontFamily: '"Comic Sans MS", cursive' }}>🌸 Loading your cute profile...</div>;

  return (
    <>
      <PinkNavbar />
      <div style={{ maxWidth: 600, margin: '0 auto', padding: 30, fontFamily: '"Comic Sans MS", "Segoe UI", cursive', backgroundColor: '#fff0f6', borderRadius: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 }}>
          <h2 style={{ margin: 0 }}>
            ✨ Welcome, <span style={{ color: '#e75480' }}>{user?.username || 'Cutie'}</span> 💖
          </h2>
          <button
            onClick={signOut}
            style={{
              padding: '8px 16px',
              background: 'linear-gradient(to right, #ff9a9e, #fad0c4)',
              color: '#fff',
              border: 'none',
              borderRadius: 20,
              cursor: 'pointer',
              fontWeight: 'bold',
              boxShadow: '0 4px 10px rgba(255, 182, 193, 0.5)'
            }}
          >
            🚪 Sign Out
          </button>
        </div>

        {error && (
          <div style={{ backgroundColor: '#ff4d6d', color: 'white', padding: 12, borderRadius: 10, marginBottom: 15 }}>
            ❌ {error}
          </div>
        )}

        {message && (
          <div style={{ backgroundColor: '#ffb6c1', color: '#fff', padding: 12, borderRadius: 10, marginBottom: 15 }}>
            💌 {message}
          </div>
        )}

        <div style={{ backgroundColor: '#fffafd', padding: 20, borderRadius: 15, boxShadow: '0 4px 12px rgba(255,182,193,0.2)', marginBottom: 30 }}>
          <label style={{ fontWeight: 'bold', marginBottom: 5, display: 'block' }}>Your Name 💕</label>
          <input
            type="text"
            value={profile.name}
            onChange={(e) => setProfile({ ...profile, name: e.target.value })}
            style={{
              width: '100%',
              padding: 12,
              marginBottom: 20,
              border: '2px solid #ffc0cb',
              borderRadius: 10,
              fontSize: 16,
              backgroundColor: '#fffafd',
              boxShadow: 'inset 0 2px 5px rgba(255, 192, 203, 0.2)'
            }}
          />

          <label style={{ fontWeight: 'bold', marginBottom: 5, display: 'block' }}>Your Email ✉️</label>
          <input
            type="email"
            value={profile.email}
            onChange={(e) => setProfile({ ...profile, email: e.target.value })}
            style={{
              width: '100%',
              padding: 12,
              border: '2px solid #ffc0cb',
              borderRadius: 10,
              fontSize: 16,
              backgroundColor: '#fffafd',
              boxShadow: 'inset 0 2px 5px rgba(255, 192, 203, 0.2)'
            }}
          />

          <button
            onClick={handleUpdate}
            style={{
              marginTop: 20,
              width: '100%',
              padding: 12,
              background: 'linear-gradient(to right, #ffb6c1, #ffc0cb)',
              color: 'white',
              border: 'none',
              borderRadius: 10,
              fontSize: 16,
              fontWeight: 'bold',
              cursor: 'pointer',
              boxShadow: '0 4px 10px rgba(255, 182, 193, 0.3)'
            }}
          >
            💾 Save 
          </button>
        </div>

        <div style={{ backgroundColor: '#fff', padding: 20, borderRadius: 10, borderLeft: '5px solid #ff4d6d', boxShadow: '0 4px 12px rgba(255,192,203,0.2)' }}>
          <h3 style={{ color: '#e75480' }}>⚠️💔 Danger Zone</h3>
          <p>This will permanently delete your profile . This action cannot be undone.</p>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            style={{
              padding: '10px 20px',
              backgroundColor: '#ff6f91',
              color: 'white',
              border: 'none',
              borderRadius: 10,
              cursor: 'pointer',
              fontSize: 16,
              fontWeight: 'bold'
            }}
          >
            💣 Delete My Account
          </button>
        </div>

        {showDeleteConfirm && (
          <div style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div style={{
              backgroundColor: 'white',
              padding: 25,
              borderRadius: 10,
              width: '90%',
              maxWidth: 400,
              textAlign: 'center',
              fontFamily: '"Comic Sans MS", cursive'
            }}>
              <h3 style={{ marginBottom: 10 }}>Are you really sure? 😢</h3>
              <p>This will break our hearts. Do you *really* want to delete your account?</p>
              <div style={{ marginTop: 20, display: 'flex', justifyContent: 'center', gap: 10 }}>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#ddd',
                    border: 'none',
                    borderRadius: 8,
                    cursor: 'pointer'
                  }}
                >
                  🚫 Cancel
                </button>
                <button
                  onClick={handleDelete}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#ff4d6d',
                    color: 'white',
                    border: 'none',
                    borderRadius: 8,
                    cursor: 'pointer',
                    fontWeight: 'bold'
                  }}
                >
                  💔 Yes, Delete Me
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default Profile;
