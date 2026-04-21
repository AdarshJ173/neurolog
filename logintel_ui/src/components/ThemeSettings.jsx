import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { X, Moon, Sun, Monitor } from 'lucide-react';

const ThemeSettings = ({ onClose }) => {
  const { themeMode, setThemeMode, background, setBackground } = useTheme();

  // The iOS-style Ambient Mesh Presets
  const presets = [
    {
      name: 'Aurora',
      base: '#022c22',
      mesh: 'radial-gradient(at 0% 0%, rgba(16, 185, 129, 0.3) 0px, transparent 50%), radial-gradient(at 100% 0%, rgba(20, 184, 166, 0.25) 0px, transparent 50%), radial-gradient(at 100% 100%, rgba(6, 182, 212, 0.15) 0px, transparent 50%)'
    },
    {
      name: 'Cyberpunk',
      base: '#2a0845',
      mesh: 'radial-gradient(at 0% 0%, rgba(236, 72, 153, 0.3) 0px, transparent 50%), radial-gradient(at 100% 0%, rgba(139, 92, 246, 0.3) 0px, transparent 50%), radial-gradient(at 100% 100%, rgba(6, 182, 212, 0.2) 0px, transparent 50%)'
    },
    {
      name: 'Sunset',
      base: '#450a0a',
      mesh: 'radial-gradient(at 0% 0%, rgba(249, 115, 22, 0.3) 0px, transparent 50%), radial-gradient(at 100% 0%, rgba(225, 29, 72, 0.3) 0px, transparent 50%), radial-gradient(at 100% 100%, rgba(147, 51, 234, 0.2) 0px, transparent 50%)'
    },
    {
      name: 'Abyss',
      base: '#0f172a',
      mesh: 'radial-gradient(at 0% 0%, rgba(51, 65, 85, 0.4) 0px, transparent 50%), radial-gradient(at 100% 0%, rgba(30, 41, 59, 0.4) 0px, transparent 50%), radial-gradient(at 100% 100%, rgba(15, 23, 42, 0.4) 0px, transparent 50%)'
    }
  ];

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }} className="animate-in">
      <div className="glass-panel" style={{ width: '400px', padding: '2rem', position: 'relative' }}>
        
        <button onClick={onClose} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'transparent', border: 'none', color: 'var(--text-main)', cursor: 'pointer' }}>
          <X size={24} />
        </button>

        <h2 style={{ marginTop: 0, color: 'var(--text-main)' }}>Personalization</h2>

        <div style={{ marginBottom: '2rem' }}>
          <p style={{ color: 'var(--text-muted)', marginBottom: '10px', fontSize: '0.9rem' }}>Appearance</p>
          <div style={{ display: 'flex', gap: '10px' }}>
            {['system', 'dark', 'light'].map(mode => (
              <button 
                key={mode}
                onClick={() => setThemeMode(mode)}
                style={{ 
                  flex: 1, padding: '10px', borderRadius: '12px', cursor: 'pointer',
                  background: themeMode === mode ? '#3b82f6' : 'var(--glass-bg)',
                  color: themeMode === mode ? 'white' : 'var(--text-main)', 
                  border: '1px solid var(--glass-border)',
                  textTransform: 'capitalize', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  transition: 'all 0.2s',
                  boxShadow: themeMode === mode ? '0 4px 12px rgba(59, 130, 246, 0.4)' : 'none'
                }}
              >
                {mode === 'system' ? <Monitor size={16}/> : mode === 'dark' ? <Moon size={16}/> : <Sun size={16}/>}
                {mode}
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <p style={{ color: 'var(--text-muted)', marginBottom: '10px', fontSize: '0.9rem' }}>Ambient Mesh Theme</p>
          <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
            {/* The Default Auto Button */}
            <button 
                onClick={() => setBackground(null)} 
                style={{ 
                    width: '44px', height: '44px', borderRadius: '50%', background: 'var(--glass-bg)', 
                    border: !background ? '2px solid #3b82f6' : '1px solid var(--glass-border)', 
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', 
                    color: 'var(--text-main)', fontSize: '11px', fontWeight: 'bold' 
                }} 
            >
                Auto
            </button>
            
            {/* The Animated Mesh Preset Orbs */}
            {presets.map((preset, index) => {
              const isActive = background?.name === preset.name;
              return (
                <button 
                  key={index} 
                  onClick={() => setBackground(preset)} 
                  title={preset.name}
                  style={{ 
                    width: '44px', height: '44px', borderRadius: '50%', 
                    backgroundColor: preset.base,
                    backgroundImage: preset.mesh, // Previews the actual gradient!
                    border: isActive ? '2px solid #fff' : '1px solid rgba(255,255,255,0.1)', 
                    cursor: 'pointer', 
                    boxShadow: isActive ? '0 0 15px rgba(255,255,255,0.4)' : '0 4px 10px rgba(0,0,0,0.3)', 
                    transition: 'transform 0.2s, box-shadow 0.2s' 
                  }} 
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                />
              )
            })}
          </div>
        </div>

      </div>
    </div>
  );
};

export default ThemeSettings;