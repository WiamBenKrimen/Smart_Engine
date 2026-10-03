export default function SmartEngineLogo({ className = 'h-10 w-10', inverse = false }) {
    const surface = inverse ? '#FFFFFF' : '#1F4E79';
    const detail = inverse ? '#1F4E79' : '#FFFFFF';
    return (<svg viewBox="0 0 48 48" className={className} role="img" aria-label="Smart Engine" xmlns="http://www.w3.org/2000/svg">
      <rect width="48" height="48" rx="15" fill={surface}/>
      <path d="M14 16.5h9.5a4.5 4.5 0 0 1 4.5 4.5v6a4.5 4.5 0 0 0 4.5 4.5H35" fill="none" stroke={detail} strokeWidth="3" strokeLinecap="round"/>
      <circle cx="14" cy="16.5" r="3.5" fill={detail}/>
      <circle cx="35" cy="31.5" r="3.5" fill={detail}/>
      <path d="M18 31.5h5.5a4.5 4.5 0 0 0 4.5-4.5" fill="none" stroke={detail} strokeWidth="3" strokeLinecap="round"/>
      <circle cx="15" cy="31.5" r="2.5" fill={detail} opacity=".7"/>
    </svg>);
}
