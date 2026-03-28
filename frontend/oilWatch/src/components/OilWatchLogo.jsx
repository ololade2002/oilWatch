const OilWatchLogo = () => {
  return (
    <svg width="52" height="52" viewBox="0 0 52 52" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="glow">
          <feGaussianBlur stdDeviation="2.5" result="blur"/>
          <feMerge>
            <feMergeNode in="blur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>

      {/* Amber square glow */}
      <rect x="4" y="4" width="44" height="44" rx="10"
        fill="none" stroke="#f59e0b" strokeWidth="2"
        filter="url(#glow)" opacity="0.5"/>

      {/* Amber square outline */}
      <rect x="4" y="4" width="44" height="44" rx="10"
        fill="none" stroke="#f59e0b" strokeWidth="2"/>

      {/* Oil drop glow */}
      <path
        d="M26,16 C26,16 20,23.5 20,28.5 C20,32.6 22.7,36 26,36 C29.3,36 32,32.6 32,28.5 C32,23.5 26,16 26,16 Z"
        fill="#f59e0b" filter="url(#glow)" opacity="0.3"/>

      {/* Oil drop outline */}
      <path
        d="M26,16 C26,16 20,23.5 20,28.5 C20,32.6 22.7,36 26,36 C29.3,36 32,32.6 32,28.5 C32,23.5 26,16 26,16 Z"
        fill="none" stroke="#f59e0b" strokeWidth="1.8"
        strokeLinejoin="round"/>

      {/* Shine */}
      <path d="M22.5,26 C22.5,26 21,28.5 21,30.5"
        fill="none" stroke="#f59e0b" strokeWidth="1"
        strokeLinecap="round" opacity="0.45"/>
    </svg>
  );
};

export default OilWatchLogo;