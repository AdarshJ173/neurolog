import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [background, setBackground] = useState({ name: 'Nebula', base: '#170b3b', mesh: 'radial-gradient(at 0% 0%, rgba(124, 58, 237, 0.35) 0px, transparent 50%), radial-gradient(at 100% 100%, rgba(79, 70, 229, 0.3) 0px, transparent 50%)' });
  const [themeMode, setThemeMode] = useState('dark');
  const [visualEffect, setVisualEffect] = useState('none');

  // THE FIX: This physically changes the CSS variables when you toggle Light/Dark Mode
  useEffect(() => {
    const root = document.documentElement;
    if (themeMode === 'light') {
      root.style.setProperty('--text-main', '#0f172a'); // Dark text
      root.style.setProperty('--text-muted', '#475569'); // Medium dark text
      root.style.setProperty('--glass-bg', 'rgba(255, 255, 255, 0.75)'); // White frosted glass
      root.style.setProperty('--glass-border', 'rgba(0, 0, 0, 0.1)'); // Dark borders
    } else {
      root.style.setProperty('--text-main', '#f8fafc'); // White text
      root.style.setProperty('--text-muted', '#94a3b8'); // Gray text
      root.style.setProperty('--glass-bg', 'rgba(0, 0, 0, 0.3)'); // Dark frosted glass
      root.style.setProperty('--glass-border', 'rgba(255, 255, 255, 0.1)'); // Light borders
    }
  }, [themeMode]);

  // If Light mode is on, we make the base background bright but keep the colorful mesh gradient
  const actualBase = themeMode === 'light' ? '#f1f5f9' : background.base;

  return (
    <ThemeContext.Provider value={{ background, setBackground, themeMode, setThemeMode, visualEffect, setVisualEffect }}>
      
      <style>
        {`
          .orb {
            position: fixed; border-radius: 50%; filter: blur(90px); z-index: 0; pointer-events: none;
            animation: float 20s infinite ease-in-out alternate; opacity: 0.3;
          }
          @keyframes float {
            0% { transform: translate(0, 0) scale(1); }
            100% { transform: translate(100px, -100px) scale(1.5); }
          }
          @keyframes twinkle {
            0% { opacity: 0.05; }
            100% { opacity: 0.2; }
          }
        `}
      </style>

      <div style={{ background: actualBase, backgroundImage: background.mesh, minHeight: '100vh', transition: 'background 0.5s ease', position: 'relative', overflowX: 'hidden' }}>
        
        {visualEffect === 'ambient_orbs' && (
          <>
            <div className="orb" style={{ top: '10%', left: '20%', width: '400px', height: '400px', background: '#7c3aed' }}></div>
            <div className="orb" style={{ bottom: '10%', right: '20%', width: '500px', height: '500px', background: '#3b82f6', animationDelay: '-5s' }}></div>
          </>
        )}
        
        {visualEffect === 'stardust' && (
           <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', backgroundImage: 'radial-gradient(white 1px, transparent 1px)', backgroundSize: '40px 40px', animation: 'twinkle 3s infinite alternate' }}></div>
        )}

        <div style={{ position: 'relative', zIndex: 1, height: '100%' }}>
          {children}
        </div>
      </div>
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);