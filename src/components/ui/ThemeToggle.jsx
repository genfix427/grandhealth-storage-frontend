import { Monitor, Moon, Sun } from 'lucide-react'
import { useTheme } from '../../hooks/useTheme.jsx'

const themes = [{ id: 'light', label: 'Light', icon: Sun }, { id: 'dark', label: 'Dark', icon: Moon }, { id: 'system', label: 'System', icon: Monitor }]

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  return <div className="theme-options" role="radiogroup" aria-label="Color theme">
    {themes.map(({ id, label, icon: Icon }) => <button key={id} role="radio" aria-checked={theme === id} className={theme === id ? 'active' : ''} onClick={() => setTheme(id)}><Icon size={18} /><span>{label}</span></button>)}
  </div>
}
