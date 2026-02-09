import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function TraditionalLoginPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [startTime] = useState(Date.now());

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const timeTaken = Date.now() - startTime;

    try {
      const response = await fetch('http://127.0.0.1:5000/api/auth/login/traditional', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          password,
          telemetry: {
            time_taken_ms: timeTaken,
            hesitation_score: 1.0
          }
        })
      });

      const data = await response.json();

      if (data.success) {
        localStorage.setItem('user', JSON.stringify(data));
        navigate('/dashboard');
      } else {
        setError(data.message || 'Login failed');
      }
    } catch (err) {
      setError('Connection error. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <button
          onClick={() => navigate('/')}
          className="mb-4 text-gray-600 hover:text-gray-900"
        >
          ← Back
        </button>

        <div className="bg-white p-8 rounded-2xl shadow-xl">
          <div className="text-center mb-6">
            <div className="text-4xl mb-3">🔑</div>
            <h2 className="text-3xl font-bold">Student Login</h2>
            <p className="text-gray-600">Enter your credentials</p>
          </div>

          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-3 mb-4 text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-2">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-blue-500"
                placeholder="student001"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-blue-500"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          <p className="text-center text-xs text-gray-500 mt-4">
            Test: student001 / test123
          </p>
        </div>
      </div>
    </div>
  );
}