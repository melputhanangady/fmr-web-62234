// Demo mode utilities for testing without Firebase
export const isDemoMode = () => {
  // Check if Firebase is configured
  const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
  const forceDemo = import.meta.env.VITE_FORCE_DEMO_MODE === 'true';
  const hasFirebaseConfig = 
    apiKey && 
    apiKey !== 'your_api_key_here';
  
  // Force demo mode if VITE_FORCE_DEMO_MODE=true
  // For now, always return true to force demo mode
  const isDemo = true; // forceDemo || !hasFirebaseConfig;
  
  console.log('Demo mode check:', {
    apiKey,
    hasFirebaseConfig,
    forceDemo,
    isDemoMode: isDemo
  });
  
  return isDemo;
};

export const showDemoNotice = () => {
  return isDemoMode();
};

export const getDemoNotice = () => {
  return {
    title: "Demo Mode",
    message: "This app is running in demo mode. To enable full functionality, set up Firebase following the instructions in SETUP.md",
    type: "info" as const
  };
};
