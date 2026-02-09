import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import LoadingSpinner from '../components/common/LoadingSpinner';

export default function AdminPage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const response = await api.get('/telemetry/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    if (!confirm('⚠️ Reset kiosk for next participant?\n\nThis will:\n- Clear local storage\n- Reset session\n- Reload the page')) {
      return;
    }

    setResetting(true);
    
    try {
      // Clear storage
      localStorage.clear();
      sessionStorage.clear();
      
      // Disconnect wallet if connected
      if (window.csec08Wallet) {
        window.dispatchEvent(new Event('csec08WalletDisconnected'));
      }
      
      console.log('🔄 Kiosk reset complete');
      
      // Navigate home and reload
      setTimeout(() => {
        window.location.href = '/';
      }, 500);
    } catch (error) {
      console.error('Reset error:', error);
      setResetting(false);
    }
  };

  const handleExport = async () => {
    try {
      const response = await api.get('/telemetry/export');
      const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `telemetry_${new Date().toISOString()}.json`;
      a.click();
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export data');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-gray-900 text-white py-6">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Admin Panel</h1>
              <p className="text-gray-400 text-sm">Research Platform Management</p>
            </div>
            <button
              onClick={() => navigate('/')}
              className="px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600"
            >
              Exit Admin
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {loading ? (
          <LoadingSpinner message="Loading statistics..." />
        ) : (
          <div className="grid gap-6">
            {/* Stats Cards */}
            <div className="grid md:grid-cols-2 gap-6">
              {stats?.statistics?.map((stat, index) => (
                <div key={index} className="bg-white rounded-xl shadow-md p-6">
                  <h3 className="text-lg font-bold mb-4 text-gray-900">
                    {stat.auth_method} Authentication
                  </h3>
                  <dl className="space-y-3">
                    <div>
                      <dt className="text-sm text-gray-500">Total Attempts</dt>
                      <dd className="text-2xl font-bold text-gray-900">{stat.total_attempts}</dd>
                    </div>
                    <div>
                      <dt className="text-sm text-gray-500">Success Rate</dt>
                      <dd className="text-2xl font-bold text-green-600">{stat.success_rate}%</dd>
                    </div>
                    <div>
                      <dt className="text-sm text-gray-500">Avg Time</dt>
                      <dd className="text-2xl font-bold text-blue-600">{stat.avg_success_time_ms}ms</dd>
                    </div>
                  </dl>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-lg font-bold mb-4">Actions</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <button
                  onClick={handleExport}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  📊 Export Data
                </button>
                <button
                  onClick={handleReset}
                  disabled={resetting}
                  className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  {resetting ? 'Resetting...' : '🔄 Reset Kiosk'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}