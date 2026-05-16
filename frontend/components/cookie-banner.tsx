'use client';

import { useEffect, useState } from 'react';

export default function CookieBanner() {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Only check localStorage on the client side
    if (!localStorage.getItem('cookieConsent')) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setShowBanner(true);
    }
  }, []);

  if (!showBanner) return null;

  const handleAccept = () => {
    localStorage.setItem('cookieConsent', 'accepted');
    setShowBanner(false);
  };

  const handleReject = () => {
    localStorage.setItem('cookieConsent', 'rejected');
    setShowBanner(false);
  };

  return (
    <div className="fixed bottom-0 w-full bg-gray-900 text-white p-4 z-50">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
        <p className="text-sm">
          Përdorim cookies për të përmirësuar shërbimin. Duke vazhduar, ju pranoni{' '}
          <a href="/cookies" className="underline">
            Cookie Policy
          </a>
          .
        </p>
        <div className="flex gap-2">
          <button
            onClick={handleAccept}
            className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded text-sm"
          >
            Prano Të Gjitha
          </button>
          <button
            onClick={handleReject}
            className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded text-sm"
          >
            Refuzo Jo-Esencialet
          </button>
        </div>
      </div>
    </div>
  );
}
