import { useContext } from 'react';
import { TableConfigContext } from './TableConfigProvider';

export const useTableConfig = () => {
  const context = useContext(TableConfigContext);

  if (!context) {
    throw new Error('useTableConfig must be used within a TableConfigProvider');
  }

  return context;
};
