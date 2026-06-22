// Beautiful Broken Image SVG Fallback (cartoon style matching user upload)
const brokenImageSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 110" width="100%" height="100%">
  <defs>
    <!-- Left Half Clip Path -->
    <clipPath id="clip-left">
      <path d="M 22 20 L 66 20 L 54 35 L 68 50 L 52 68 L 64 80 L 52 90 L 22 90 C 15 90, 10 85, 10 78 L 10 32 C 10 25, 15 20, 22 20 Z" />
    </clipPath>
    <!-- Right Half Clip Path -->
    <clipPath id="clip-right">
      <path d="M 98 20 L 74 20 L 62 35 L 76 50 L 60 68 L 72 80 L 60 90 L 98 90 C 105 90, 110 85, 110 78 L 110 32 C 110 25, 105 20, 98 20 Z" />
    </clipPath>
  </defs>
  
  <!-- Left Half Group -->
  <g clip-path="url(#clip-left)">
    <!-- Sky -->
    <rect x="5" y="15" width="110" height="80" fill="#54b0f3" />
    <!-- Sun -->
    <circle cx="35" cy="40" r="10" fill="#ffd166" stroke="#2d2d2d" stroke-width="4" />
    <!-- Left Mountain -->
    <path d="M 8 92 L 35 58 L 62 92 Z" fill="#70e000" stroke="#2d2d2d" stroke-width="4" stroke-linejoin="round" />
  </g>
  <!-- Left Half Border -->
  <path d="M 22 20 L 66 20 L 54 35 L 68 50 L 52 68 L 64 80 L 52 90 L 22 90 C 15 90, 10 85, 10 78 L 10 32 C 10 25, 15 20, 22 20 Z" fill="none" stroke="#2d2d2d" stroke-width="4" stroke-linejoin="round" />

  <!-- Right Half Group -->
  <g clip-path="url(#clip-right)">
    <!-- Sky -->
    <rect x="5" y="15" width="110" height="80" fill="#54b0f3" />
    <!-- Right Mountain -->
    <path d="M 48 92 L 82 50 L 115 92 Z" fill="#38b000" stroke="#2d2d2d" stroke-width="4" stroke-linejoin="round" />
  </g>
  <!-- Right Half Border -->
  <path d="M 98 20 L 74 20 L 62 35 L 76 50 L 60 68 L 72 80 L 60 90 L 98 90 C 105 90, 110 85, 110 78 L 110 32 C 110 25, 105 20, 98 20 Z" fill="none" stroke="#2d2d2d" stroke-width="4" stroke-linejoin="round" />
</svg>
`;

export const FALLBACK_IMAGE_URI = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(brokenImageSvg)));

// Helper to register the global capture-phase listener
export function initGlobalImageFallback() {
  window.addEventListener('error', (e) => {
    if (e.target && e.target.tagName === 'IMG') {
      const img = e.target;
      if (img.dataset.fallbackApplied) return;
      img.dataset.fallbackApplied = 'true';
      
      // Determine if it is a profile picture
      const srcStr = img.src || '';
      const isProfile = srcStr.includes('profiles') || 
                        img.className.includes('rounded-full') || 
                        img.parentElement?.className?.includes('rounded-full') ||
                        img.closest('.personal-view') || 
                        img.closest('.usuarios-view');
                        
      if (isProfile) {
        // Simple elegant user avatar SVG for profiles
        const avatarSvg = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="100%" height="100%" fill="none" stroke="%2394a3b8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
        `;
        img.src = 'data:image/svg+xml;utf8,' + avatarSvg;
      } else {
        img.src = FALLBACK_IMAGE_URI;
      }
    }
  }, true);
}
