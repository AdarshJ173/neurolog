import React, { useState } from 'react';
import { auth, googleProvider } from '../firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { BrainCircuit, Mail, Lock, AlertCircle, Eye, EyeOff } from 'lucide-react';

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Native Email/Password Auth
  const handleNativeAuth = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
    } catch (err) {
      setError(err.message.replace('Firebase:', '').trim());
    } finally {
      setLoading(false);
    }
  };

  // Google OAuth Auth
  const handleGoogleAuth = async () => {
    setError('');
    setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      setError(err.message.replace('Firebase:', '').trim());
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ height: '100vh', width: '100vw', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
      
      {/* INLINE ANIMATION STYLES FOR BUTTERY SMOOTH STARTUP */}
      <style>
        {`
          @keyframes subtleScale {
            0% { transform: scale(0.9); opacity: 0; }
            100% { transform: scale(1); opacity: 1; }
          }
          @keyframes fadeUpSmooth {
            0% { transform: translateY(15px); opacity: 0; filter: blur(4px); }
            100% { transform: translateY(0); opacity: 1; filter: blur(0); }
          }
          @keyframes fadeInDelayed {
            0% { opacity: 0; }
            100% { opacity: 1; }
          }
          .anim-logo { animation: subtleScale 1s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
          .anim-title { animation: fadeUpSmooth 1s cubic-bezier(0.16, 1, 0.3, 1) forwards; animation-delay: 0.4s; opacity: 0; }
          .anim-subtitle { animation: fadeUpSmooth 1s cubic-bezier(0.16, 1, 0.3, 1) forwards; animation-delay: 0.8s; opacity: 0; }
          .anim-form { animation: fadeUpSmooth 1s cubic-bezier(0.16, 1, 0.3, 1) forwards; animation-delay: 1.2s; opacity: 0; }
        `}
      </style>

      <div className="glass-panel" style={{ width: '420px', padding: '3.5rem 2.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'rgba(10, 15, 30, 0.6)', border: '1px solid rgba(255,255,255,0.08)' }}>
        
        {/* 1. LOGO */}
        <div className="anim-logo" style={{ borderRadius: '50%', padding: '1.2rem', background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.3)', marginBottom: '1.5rem', boxShadow: '0 0 30px rgba(59, 130, 246, 0.2)' }}>
          <BrainCircuit size={42} color="#3b82f6" />
        </div>
        
        {/* 2. TITLE */}
        <h2 className="anim-title" style={{ margin: '0 0 0.5rem 0', letterSpacing: '2px', fontSize: '1.8rem', fontWeight: '800' }}>
          NEUROLOG
        </h2>

        {/* 3. SUBTITLE */}
        <p className="anim-subtitle" style={{ color: '#3b82f6', marginBottom: '2.5rem', fontSize: '0.85rem', fontWeight: '600', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
          AI Based Log Intelligence Engine
        </p>

        {/* 4. FORM (DELAYED FADE IN) */}
        <div className="anim-form" style={{ width: '100%' }}>
          
          {error && (
            <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444', padding: '12px', borderRadius: '10px', color: '#f8fafc', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
              <AlertCircle size={16} color="#ef4444" style={{ minWidth: '16px' }} /> <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleNativeAuth} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
            
            {/* EMAIL INPUT */}
            <div style={{ position: 'relative' }}>
              <Mail size={18} color="rgba(255,255,255,0.4)" style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', left: '16px' }} />
              <input 
                type="email" placeholder="Developer Email" value={email} onChange={(e) => setEmail(e.target.value)} required
                style={{ width: '87%', padding: '14px 14px 14px 44px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: 'white', fontSize: '0.95rem', outline: 'none', transition: 'border 0.2s' }}
                onFocus={(e) => e.target.style.border = '1px solid #3b82f6'}
                onBlur={(e) => e.target.style.border = '1px solid rgba(255,255,255,0.1)'}
              />
            </div>

            {/* PASSWORD INPUT WITH EYE ICON */}
            <div style={{ position: 'relative' }}>
              <Lock size={18} color="rgba(255,255,255,0.4)" style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', left: '16px' }} />
              <input 
                type={showPassword ? "text" : "password"} placeholder="Passcode" value={password} onChange={(e) => setPassword(e.target.value)} required
                style={{ width: '80%', padding: '14px 44px 14px 44px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: 'white', fontSize: '0.95rem', outline: 'none', transition: 'border 0.2s' }}
                onFocus={(e) => e.target.style.border = '1px solid #3b82f6'}
                onBlur={(e) => e.target.style.border = '1px solid rgba(255,255,255,0.1)'}
              />
              <div 
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', right: '16px', cursor: 'pointer', display: 'flex' }}
              >
                {showPassword ? <EyeOff size={18} color="rgba(255,255,255,0.4)" /> : <Eye size={18} color="rgba(255,255,255,0.4)" />}
              </div>
            </div>
            
            <button disabled={loading} type="submit" style={{ background: '#3b82f6', color: 'white', padding: '14px', borderRadius: '12px', border: 'none', fontSize: '1rem', fontWeight: 'bold', cursor: loading ? 'wait' : 'pointer', marginTop: '0.5rem', transition: 'all 0.2s', opacity: loading ? 0.7 : 1, boxShadow: '0 4px 15px rgba(59, 130, 246, 0.3)' }} onMouseEnter={e => !loading && (e.target.style.transform = 'translateY(-2px)')} onMouseLeave={e => !loading && (e.target.style.transform = 'translateY(0)')}>
              {loading ? 'Processing...' : (isLogin ? 'Log In' : 'Create Account')}
            </button>
          </form>

          {/* --- OR DIVIDER --- */}
          <div style={{ display: 'flex', alignItems: 'center', width: '100%', margin: '1.5rem 0' }}>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }}></div>
            <span style={{ margin: '0 10px', color: 'rgba(255,255,255,0.3)', fontSize: '0.75rem', fontWeight: 'bold' }}>OR</span>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }}></div>
          </div>

          {/* --- GOOGLE BUTTON --- */}
          <button 
            onClick={handleGoogleAuth}
            disabled={loading}
            style={{ 
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
              background: 'rgba(255,255,255,0.05)', color: 'white', padding: '12px', borderRadius: '12px', 
              border: '1px solid rgba(255,255,255,0.1)', fontWeight: 'bold', fontSize: '0.95rem', cursor: loading ? 'wait' : 'pointer', 
              transition: 'all 0.2s' 
            }}
            onMouseEnter={e => !loading && (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')} 
            onMouseLeave={e => !loading && (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>

          {/* TOGGLE LOGIN/SIGNUP */}
          <p style={{ marginTop: '2rem', fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)', textAlign: 'center' }}>
            {isLogin ? "Don't have an access key? " : "Already have a neural link? "}
            <span onClick={() => setIsLogin(!isLogin)} style={{ color: '#3b82f6', cursor: 'pointer', fontWeight: 'bold', marginLeft: '5px' }}>
              {isLogin ? "Sign Up" : "Log In"}
            </span>
          </p>
        </div>

      </div>
    </div>
  );
};

export default Login;