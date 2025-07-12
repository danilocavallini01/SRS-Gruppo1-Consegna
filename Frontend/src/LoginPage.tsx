import { useState } from "react";

interface LoginPageProps {
  login: (email: string, password: string) => void;
  register: (email: string, password: string) => void;
}
export default function LoginPage({ login, register }: LoginPageProps) {

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegister, setRegister] = useState(false)

  return (
    <div className="container w-full me-6 p-6 d-flex items-center center justify-content-center bg-gray-100">
      <div style={{ maxWidth: '400px' }} className="bg-gray mt-4 p-8 rounded-2xl shadow-xl max-w-md text-center">
        <h2 className="text-2xl font-semibold mb-6 text-gray-800">{isRegister ? 'Register' : 'Sign in to Your Account'}</h2>

        <div id="auth-form" className="mt-5">
          <div className="mb-3">
            <label className="form-label">Email address</label>
            <input type="email" value={email}
              onChange={(e) => setEmail(e.target.value)}
              id="email" className="form-control" placeholder="Enter email" required />
          </div>

          <div className="mb-3">
            <label className="form-label">Password</label>
            <input type="password" value={password}
              onChange={(e) => setPassword(e.target.value)}
              id="password" className="form-control" placeholder="Enter password" required />
          </div>

          <button className="btn btn-primary w-100" onClick={() => { if (isRegister) { register(email, password) } else { login(email, password) } }}>{isRegister ? 'Register' : 'Login'}</button>
        </div>

        <div className="text-center mt-3">
          <button className="btn btn-success w-100" onClick={() => { setRegister(!isRegister) }}>Don't have an account? Register</button>
        </div>
      </div>
    </div>
  );
}