import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function DashboardPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (!stored) {
      navigate('/');
    } else {
      setUser(JSON.parse(stored));
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/');
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6 flex justify-between items-center">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-green-50 border-l-4 border-green-500 p-6 rounded mb-6">
          <h3 className="font-bold text-green-900 text-lg">✅ Login Successful!</h3>
          <p className="text-green-800">
            Method: {user.username ? 'Password' : 'Wallet'}
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">Your Information</h2>
          <dl className="space-y-2">
            <div>
              <dt className="text-sm text-gray-600">User ID</dt>
              <dd className="text-lg font-semibold">{user.id}</dd>
            </div>
            {user.username && (
              <div>
                <dt className="text-sm text-gray-600">Username</dt>
                <dd className="text-lg font-semibold">{user.username}</dd>
              </div>
            )}
            {user.wallet_address && (
              <div>
                <dt className="text-sm text-gray-600">Wallet Address</dt>
                <dd className="text-sm font-mono bg-gray-100 p-2 rounded">{user.wallet_address}</dd>
              </div>
            )}
          </dl>
        </div>
      </main>
    </div>
  );
}