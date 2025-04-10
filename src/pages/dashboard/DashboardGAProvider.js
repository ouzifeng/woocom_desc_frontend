import React from 'react';
import GoogleAnalyticsWarningModal from '../../components/GoogleAnalyticsWarningModal';

export function DashboardGAProvider({ children }) {
  return (
    <>
      {children}
      <GoogleAnalyticsWarningModal />
    </>
  );
} 