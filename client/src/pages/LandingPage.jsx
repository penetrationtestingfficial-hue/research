import { useNavigate } from 'react-router-dom';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-12">
          <div className="text-6xl mb-4">🔐</div>
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            CSEC08 Research
          </h1>
          <p className="text-gray-600">Choose your authentication method</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <button
            onClick={() => navigate('/login/traditional')}
            className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-2"
          >
            <div className="text-4xl mb-4">🔑</div>
            <h3 className="text-2xl font-bold mb-2">Password Login</h3>
            <p className="text-gray-600 mb-4">Traditional username & password</p>
            <div className="text-blue-600 font-semibold">Continue →</div>
          </button>

          <button
            onClick={() => navigate('/login/did')}
            className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-2"
          >
            <div className="text-4xl mb-4">💼</div>
            <h3 className="text-2xl font-bold mb-2">Wallet Login</h3>
            <p className="text-gray-600 mb-4">Passwordless with crypto wallet</p>
            <div className="text-purple-600 font-semibold">Continue →</div>
          </button>
        </div>

        <div className="mt-8 bg-white p-4 rounded-lg text-center text-sm text-gray-600">
          🔬 Research Study: Your interaction is anonymously recorded for research
        </div>
      </div>
    </div>
  );
}