import { useState, useEffect } from 'react';
import { ThemeContext } from './useTheme';
export const ThemeProvider = ({children}) => {
  const [themeMode,setThemeMode] = useState(() => localStorage.getItem('neurolog-theme') || 'dark');
  const [systemDark,setSystemDark] = useState(() => matchMedia('(prefers-color-scheme: dark)').matches);
  useEffect(() => { const media=matchMedia('(prefers-color-scheme: dark)'); const listener=e=>setSystemDark(e.matches);media.addEventListener('change',listener);return()=>media.removeEventListener('change',listener); },[]);
  useEffect(() => { document.documentElement.dataset.theme=themeMode==='light'||(themeMode==='system'&&!systemDark)?'light':'dark';localStorage.setItem('neurolog-theme',themeMode); },[themeMode,systemDark]);
  return <ThemeContext.Provider value={{themeMode,setThemeMode}}>{children}</ThemeContext.Provider>;
};
