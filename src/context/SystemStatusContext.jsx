import React, { createContext, useState, useContext } from 'react';

const SystemStatusContext = createContext();

export const SystemStatusProvider = ({ children }) => {
  const [isOnline, setIsOnline] = useState(true);

  const setOnlineStatus = (status) => {
    setIsOnline(status);
  };

  return (
    <SystemStatusContext.Provider value={{ isOnline, setOnlineStatus }}>
      {children}
    </SystemStatusContext.Provider>
  );
};

export const useSystemStatus = () => useContext(SystemStatusContext);
