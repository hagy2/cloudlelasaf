import React, { useState, useEffect, useCallback } from 'react';
import { Authenticator } from '@aws-amplify/ui-react';
import { fetchAuthSession, fetchUserAttributes } from '@aws-amplify/auth';

const API_BASE_URL = "https://m7ucuqnlaf.execute-api.us-east-1.amazonaws.com/dev";

function Profile() {
  return (
    <Authenticator>
      {({ user, signOut }) => {
        console.log('Authenticator user:', user);
        return user ? (
          <ProfileContent user={user} signOut={signOut} />
        ) : (
          <div>Please sign in to view your profile.</div>
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

  console.log('ProfileContent user:', user);
  console.log('User userId:', user?.userId);

  const fetchProfile = useCallback(async () => {
    console.log('fetchProfile called with user:', user);
    if (!user?.userId) {
      console.log('No user or userId found');
      setError('User not authenticated');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError('');
      setMessage('');

      const userAttributes = await fetchUserAttributes();
      console.log('Fetched user attributes:', userAttributes);

      const session = await fetchAuthSession();
      console.log('Auth session:', session);
      const token = session?.tokens?.idToken?.toString();
      console.log('JWT token:', token ? 'Token present' : 'No token');

      if (!token) throw new Error('Authentication token not found');

      console.log('Fetching profile from:', `${API_BASE_URL}/profile`);
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
      console.log('API response:', data);

      if (data.profile) {
        setProfile({
          name: data.profile.name || '',
          email: data.profile.email || userAttributes.email || '',
        });
      } else {
        throw new Error('Invalid profile data structure');
      }
    } catch (err) {
      console.error('Profile fetch error:', err);
      setError(err.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  }, [user]);

  const handleUpdate = async () => {
    if (!user?.userId) {
      setError('User not authenticated');
      return;
    }

    try {
      setError('');
      setMessage('');

      const session = await fetchAuthSession();
      const token = session?.tokens?.idToken?.toString();
      console.log('Update JWT token:', token ? 'Token present' : 'No token');

      if (!token) throw new Error('Authentication token not found');

      console.log('Updating profile with:', profile);
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
      console.log('Update API response:', data);
      setMessage(data.message || 'Profile updated successfully');

      await fetchProfile();
    } catch (err) {
      console.error('Update error:', err);
      setError(err.message || 'Failed to update profile');
    }
  };

  const handleDelete = async () => {
    try {
      setError('');
      setMessage('');

      const session = await fetchAuthSession();
      const token = session?.tokens?.idToken?.toString();
      console.log('Delete JWT token:', token ? 'Token present' : 'No token');

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
      console.log('Delete API response:', data);
      setMessage(data.message || 'Profile deleted successfully');
      signOut();
    } catch (err) {
      console.error('Delete error:', err);
      setError(err.message || 'Failed to delete profile');
    }
  };

  useEffect(() => {
    console.log('useEffect triggered with userId:', user?.userId);
    if (user?.userId) {
      fetchProfile();
    } else {
      setLoading(false);
      setError('User not authenticated');
    }
  }, [user, fetchProfile]);

  if (loading) return <div>Loading profile...</div>;

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ margin: 0 }}>Welcome, {user?.username || 'User'}</h2>
        <button
          onClick={signOut}
          style={{ 
            padding: '8px 16px', 
            backgroundColor: '#f5f5f5', 
            border: '1px solid #ddd',
            borderRadius: 4,
            cursor: 'pointer'
          }}
        >
          Sign Out
        </button>
      </div>

      {error && (
        <div style={{ 
          color: 'white',
          backgroundColor: '#ff4444',
          padding: 10,
          borderRadius: 4,
          margin: '10px 0'
        }}>
          Error: {error}
        </div>
      )}
      
      {message && (
        <div style={{ 
          color: 'white',
          backgroundColor: '#00C851',
          padding: 10,
          borderRadius: 4,
          margin: '10px 0'
        }}>
          {message}
        </div>
      )}

      <div style={{ 
        backgroundColor: 'white',
        padding: 20,
        borderRadius: 8,
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        marginBottom: 20
      }}>
        <div style={{ margin: '15px 0' }}>
          <label style={{ display: 'block', marginBottom: 5, fontWeight: 'bold' }}>Name:</label>
          <input
            value={profile.name}
            onChange={(e) => setProfile({ ...profile, name: e.target.value })}
            style={{ 
              width: '100%', 
              padding: 10,
              border: '1px solid #ddd',
              borderRadius: 4,
              fontSize: 16
            }}
          />
        </div>

        <div style={{ margin: '15px 0' }}>
          <label style={{ display: 'block', marginBottom: 5, fontWeight: 'bold' }}>Email:</label>
          <input
            type="email"
            value={profile.email}
            onChange={(e) => setProfile({ ...profile, email: e.target.value })}
            style={{ 
              width: '100%', 
              padding: 10,
              border: '1px solid #ddd',
              borderRadius: 4,
              fontSize: 16
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          <button 
            onClick={handleUpdate}
            style={{ 
              padding: '10px 20px', 
              backgroundColor: '#4285f4',
              color: 'white',
              border: 'none',
              borderRadius: 4,
              cursor: 'pointer',
              fontSize: 16,
              flex: 1
            }}
          >
            Update Profile
          </button>
        </div>
      </div>

      <div style={{ 
        backgroundColor: 'white',
        padding: 20,
        borderRadius: 8,
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        borderLeft: '4px solid #ff4444'
      }}>
        <h3 style={{ marginTop: 0, color: '#ff4444' }}>Danger Zone</h3>
        <p style={{ marginBottom: 20 }}>Permanently delete your account and all associated data.</p>
        <button
          onClick={() => setShowDeleteConfirm(true)}
          style={{ 
            padding: '10px 20px', 
            backgroundColor: '#ff4444',
            color: 'white',
            border: 'none',
            borderRadius: 4,
            cursor: 'pointer',
            fontSize: 16
          }}
        >
          Delete Account
        </button>
      </div>

      {showDeleteConfirm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: 20,
            borderRadius: 8,
            maxWidth: 400,
            width: '100%'
          }}>
            <h3 style={{ marginTop: 0 }}>Confirm Deletion</h3>
            <p>Are you sure you want to delete your account? This action cannot be undone.</p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#f5f5f5',
                  border: '1px solid #ddd',
                  borderRadius: 4,
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#ff4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: 4,
                  cursor: 'pointer'
                }}
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Profile;