'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

interface ModalContextType {
  isNewLeaveModalOpen: boolean;
  openNewLeaveModal: () => void;
  closeNewLeaveModal: () => void;
}

const ModalContext = createContext<ModalContextType>({
  isNewLeaveModalOpen: false,
  openNewLeaveModal: () => {},
  closeNewLeaveModal: () => {},
});

export function ModalProvider({ children }: { children: ReactNode }) {
  const [isNewLeaveModalOpen, setIsNewLeaveModalOpen] = useState(false);

  return (
    <ModalContext.Provider
      value={{
        isNewLeaveModalOpen,
        openNewLeaveModal: () => setIsNewLeaveModalOpen(true),
        closeNewLeaveModal: () => setIsNewLeaveModalOpen(false),
      }}
    >
      {children}
    </ModalContext.Provider>
  );
}

export const useModal = () => useContext(ModalContext);
