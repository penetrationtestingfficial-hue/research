import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function DIDLoginPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [address, setAddress] = useState('');
  const [nonce, setNonce] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [startTime] = useState(Date.now());

  const hasWallet = !!window.csec08Wallet;

  const handleConnect = async () => {
    setLoading(true);
    setError('');

    try {
      const result = await window.csec08Wallet.connect();
      setAddress(result.address);
      setStep(1);
      
      // Get nonce
      const res = await fetch(`http://127.0.0.1:5000/api/auth/nonce/${result.address}`);
      const data = await res.json();
      setNonce(data.message);
      setStep(2);
    } catch (err) {
      setError(err.message === 'NO_WALLET' ? 'No wallet found. Create one first.' : 'Connection failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSign = async () => {
    setLoading(true);
    setError('');

    try {
      const timeTaken = Date.now() - startTime;
      const result = await window.csec08Wallet.signMessage(nonce);
      
      const res = await fetch('http://127.0.0.1:5000/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address,
          signature: result.signature,
          telemetry: {
            time_taken_ms: timeTaken,
            hesitation_score: 1.0
          }
        })
      });

      const data = await res.json();

      if (data.success) {
        localStorage.setItem('user', JSON.stringify(data));
        navigate('/dashboard');
      } else {
        setError('Verification failed');
      }
    } catch (err) {
      setError(err.message === 'REJECTED' ? 'You cancelled the signature' : 'Signing failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <button
          onClick={() => navigate('/')}
          className="mb-4 text-gray-600 hover:text-gray-900"
        >
          ← Back
        </button>

        <div className="bg-white p-8 rounded-2xl shadow-xl">
          <div className="text-center mb-6">
            <div className="text-4xl mb-3">💼</div>
            <h2 className="text-3xl font-bold">Wallet Login</h2>
            <p className="text-gray-600">Passwordless authentication</p>
          </div>

          {/* Progress */}
          <div className="flex justify-between mb-8">
            {['Connect', 'Get Challenge', 'Sign'].map((label, i) => (
              <div key={i} className="flex-1 text-center">
                <div className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center ${
                  i <= step ? 'bg-purple-600 text-white' : 'bg-gray-200'
                }`}>
                  {i < step ? '✓' : i + 1}
                </div>
                <p className="text-xs mt-2">{label}</p>
              </div>
            ))}
          </div>

          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-3 mb-4 text-red-700 text-sm">
              {error}
            </div>
          )}

          {!hasWallet && (
            <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-4">
              <p className="font-semibold text-yellow-900">Extension Not Installed</p>
              <p className="text-sm text-yellow-800 mt-1">
                Install the CSEC08 Wallet extension to use wallet login
              </p>
            </div>
          )}

          {hasWallet && step === 0 && (
            <button
              onClick={handleConnect}
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-3 rounded-lg font-semibold disabled:opacity-50"
            >
              {loading ? 'Connecting...' : 'Connect Wallet'}
            </button>
          )}

          {step === 1 && (
            <div className="text-center py-4">
              <div className="animate-spin w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full mx-auto"></div>
              <p className="mt-2 text-gray-600">Getting challenge...</p>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="bg-green-50 p-3 rounded border-l-4 border-green-500">
                <p className="text-sm text-green-800">✓ Wallet Connected</p>
                <p className="text-xs font-mono text-green-700">{address}</p>
              </div>

              <div className="bg-gray-50 p-3 rounded">
                <p className="text-xs font-semibold mb-2">Message to sign:</p>
                <div className="bg-white p-2 rounded border text-xs font-mono max-h-24 overflow-auto">
                  {nonce}
                </div>
              </div>

              <button
                onClick={handleSign}
                disabled={loading}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 rounded-lg font-semibold disabled:opacity-50"
              >
                {loading ? 'Authenticating...' : 'Sign & Login'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}