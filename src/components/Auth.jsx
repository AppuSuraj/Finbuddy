import { useState } from 'react';
import { supabase } from '../supabaseClient';
import { Shield, Lock, Activity } from 'lucide-react';

export default function Auth() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
       if (isSignUp) {
           const { error } = await supabase.auth.signUp({ 
               email, 
               password,
               options: {
                   emailRedirectTo: window.location.origin
               }
           });
           if (error) alert(error.message);
           else alert("Registration successful! Please check your email and click the confirmation link to activate your terminal.");
       } else {
           const { error } = await supabase.auth.signInWithPassword({ email, password });
           if (error) alert(error.message);
       }
    } catch(err) {
       alert(err.message);
    }
    setLoading(false);
  };

  return (
    <div className="app-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'radial-gradient(circle at 50% 50%, #0a1f26 0%, #030a0d 100%)' }}>
       <div className="glass-panel animate-in" style={{ width: '100%', maxWidth: '400px', padding: '40px', textAlign: 'center', border: '1px solid var(--accent-primary)', position: 'relative', overflow: 'hidden' }}>
          {/* Decorative Background Flare */}
          <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '150px', height: '150px', background: 'var(--accent-primary)', filter: 'blur(80px)', opacity: 0.2 }}></div>

          <Shield size={48} className="text-secondary" style={{ margin: '0 auto 20px auto' }} />
          <h2 style={{ fontSize: '28px', marginBottom: '8px' }}>Finbuddy Terminal</h2>
          <p className="text-muted text-sm" style={{ marginBottom: '30px', letterSpacing: '0.5px' }}>
            Restricted Predictive Intelligence Systems
          </p>

          <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
             <div style={{ textAlign: 'left' }}>
               <label className="text-secondary text-xs" style={{ marginBottom: '4px', display: 'block' }}>SECURE EMAIL</label>
               <input 
                 type="email" 
                 value={email}
                 onChange={e => setEmail(e.target.value)}
                 required
                 style={{ width: '100%', padding: '12px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--card-border)', borderRadius: '8px', color: '#fff', outline: 'none' }}
                 placeholder="investor@fund.com"
               />
             </div>
             <div style={{ textAlign: 'left', marginBottom: '10px' }}>
               <label className="text-secondary text-xs flex items-center gap-2" style={{ marginBottom: '4px' }}>
                 <Lock size={12} /> ENCRYPTED PASSPHRASE
               </label>
               <input 
                 type="password" 
                 value={password}
                 onChange={e => setPassword(e.target.value)}
                 required
                 style={{ width: '100%', padding: '12px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--card-border)', borderRadius: '8px', color: '#fff', outline: 'none' }}
                 placeholder="••••••••"
               />
             </div>
             
             <button type="submit" className="btn btn-primary" style={{ padding: '14px', fontSize: '15px', fontWeight: 600, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }} disabled={loading}>
                {loading ? <Activity size={18} className="spin-animation" /> : isSignUp ? 'Initialize Instance' : 'Decrypt Portfolio'}
             </button>
          </form>

          <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
             <button 
               onClick={() => setIsSignUp(!isSignUp)} 
               style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '13px', cursor: 'pointer', textDecoration: 'underline' }}
             >
               {isSignUp ? 'Already have access? Authenticate.' : 'Request new terminal instance.'}
             </button>
          </div>
       </div>
    </div>
  );
}
