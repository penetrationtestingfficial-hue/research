// client/src/App.jsx
/**
 * Main Application Component
 * Handles routing and authentication state management
 */

import { useState } from 'react';
import { TelemetryProvider } from './features/auth/hooks/useTelemetry';
import LoginForm from './features/auth/components/LoginForm';
import WalletLogin from './features/auth/components/WalletLogin';
import AdminReset from './features/auth/components/AdminReset';
import { setAuthToken } from './api/axios';

function App() {
  const [authMode, setAuthMode] = useState(null); // null, 'traditional', 'wallet'
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userData, setUserData] = useState(null);

  /**
   * Handle successful authentication
   */
  const handleAuthSuccess = (data) => {
    console.log('✅ Authentication successful:', data);
    
    // Store token
    if (data.token) {
      setAuthToken(data.token);
    }
    
    // Update state
    setUserData(data.user);
    setIsAuthenticated(true);
  };

  /**
   * Handle authentication error
   */
  const handleAuthError = (error) => {
    console.error('❌ Authentication failed:', error);
  };

  /**
   * Handle logout
   */
  const handleLogout = () => {
    setAuthToken(null);
    setIsAuthenticated(false);
    setUserData(null);
    setAuthMode(null);
  };

  /**
   * Handle kiosk reset
   */
  const handleReset = () => {
    handleLogout();
  };

  // Landing Page - Method Selection
  if (!authMode && !isAuthenticated) {
    return (
      <TelemetryProvider>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
          <div className="max-w-4xl w-full">
            {/* Header */}
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold text-gray-800 mb-2">
                University Portal
              </h1>
              <p className="text-gray-600">
                Choose your authentication method
              </p>
            </div>

            {/* Method Selection Cards */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Traditional Login Card */}
              <button
                onClick={() => setAuthMode('traditional')}
                className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow text-left group"
              >
                <div className="flex items-start mb-4">
                  <div className="bg-blue-100 rounded-lg p-3 group-hover:bg-blue-200 transition-colors">
                    <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">
                  Password Login
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Use your university username and password
                </p>
                <div className="text-xs text-gray-500">
                  • Traditional method<br/>
                  • Familiar interface<br/>
                  • Works everywhere
                </div>
              </button>

              {/* DID Login Card */}
              <button
                onClick={() => setAuthMode('wallet')}
                className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow text-left group"
              >
                <div className="flex items-start mb-4">
                  <div className="bg-green-100 rounded-lg p-3 group-hover:bg-green-200 transition-colors">
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                  </div>
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">
                  Wallet Login
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Sign in with your digital wallet (passwordless)
                </p>
                <div className="text-xs text-gray-500">
                  • No password needed<br/>
                  • Cryptographic security<br/>
                  • Modern authentication
                </div>
              </button>
            </div>

            {/* Research Notice */}
            <div className="mt-8 p-4 bg-white rounded-lg shadow text-center">
              <p className="text-xs text-gray-500">
                🔬 <strong>Research Study:</strong> This platform is part of a usability study. 
                Your interaction data will be anonymously recorded for research purposes.
              </p>
            </div>
          </div>

          {/* Admin Reset (Hidden) */}
          <AdminReset onResetComplete={handleReset} />
        </div>
      </TelemetryProvider>
    );
  }

  // Authentication Pages
  if (!isAuthenticated) {
    return (
      <TelemetryProvider>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
          {/* Back Button */}
          <button
            onClick={() => setAuthMode(null)}
            className="absolute top-4 left-4 px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
          >
            ← Back to method selection
          </button>

          {/* Login Component */}
          {authMode === 'traditional' ? (
            <LoginForm 
              onSuccess={handleAuthSuccess}
              onError={handleAuthError}
            />
          ) : (
            <WalletLogin
              onSuccess={handleAuthSuccess}
              onError={handleAuthError}
            />
          )}

          {/* Admin Reset */}
          <AdminReset onResetComplete={handleReset} />
        </div>
      </TelemetryProvider>
    );
  }

  // Authenticated - Dashboard
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">
            University Dashboard
          </h1>
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-600">
              {userData?.username || userData?.wallet_address}
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow p-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            ✅ Authentication Successful!
          </h2>
          
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <p className="text-green-800">
              You have successfully logged in using <strong>{authMode === 'traditional' ? 'Password' : 'Wallet'}</strong> authentication.
            </p>
          </div>

          {/* User Info */}
          <div className="space-y-2 text-sm text-gray-600">
            <p><strong>User ID:</strong> {userData?.id}</p>
            <p><strong>Role:</strong> {userData?.role}</p>
            <p><strong>Auth Method:</strong> {authMode === 'traditional' ? 'TRADITIONAL' : 'DID'}</p>
          </div>

          {/* Thank You Message for Research */}
          <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              🙏 <strong>Thank you for participating!</strong> Your login time and interaction 
              patterns have been recorded for research analysis.
            </p>
          </div>
        </div>
      </main>

      {/* Admin Reset */}
      <AdminReset onResetComplete={handleReset} />
    </div>
  );
}

export default App;