import { useState } from 'react';

export function LoginPage({ onLoginSuccess }) {
  const [email, setEmail]       = useState('demo@oilwatch.com');
  const [password, setPassword] = useState('demo1234');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (email && password) {
      onLoginSuccess(email);
    }
  };

  return (
    <div className="min-h-screen bg-[#070b0e] flex items-center justify-center p-4 font-sans">
      <div className="bg-[#0d151c] border border-slate-800 rounded-2xl p-8 w-full max-w-md shadow-2xl">

        {/* Brand Header */}
        <div className="text-center mb-8">
          <span className="text-amber text-[23px] font-semibold font-orbitron tracking-widest">OILWATCH</span>
          <p className="text-sm text-slate-500 mt-1 uppercase font-rajdhani tracking-widest">Field Surveillance System V2</p>
        </div>

        {/* Demo banner */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-950/40 border border-amber-800/50 mb-6">
          <span className="text-amber-400 text-[10px] font-mono tracking-wider leading-relaxed">
            DEMO MODE — credentials are pre-filled. Just click Authorize Terminal to enter.
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-[12px] font-bold text-slate-400 font-rajdhani uppercase tracking-widest mb-2">
              Engineer Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@company.com"
              className="w-full bg-[#070b0e] border border-slate-800 focus:border-amber rounded-lg px-4 py-2.5 text-slate-200 text-sm outline-none transition-colors"
              required
            />
          </div>

          <div>
            <label className="block text-[12px] font-bold text-slate-400 font-rajdhani uppercase tracking-widest mb-2">
              Secure Access Key
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-[#070b0e] border border-slate-800 focus:border-amber rounded-lg px-4 py-2.5 text-slate-200 text-sm outline-none transition-colors"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-amber hover:bg-[#d97706] text-slate-950 font-bold font-rajdhani uppercase text-[15px] py-2.5 px-4 rounded-lg text-sm transition-all shadow-lg mt-2">
            Authorize Terminal
          </button>
        </form>
      </div>
    </div>
  );
}