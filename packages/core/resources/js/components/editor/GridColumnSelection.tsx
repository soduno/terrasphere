import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

type GridColumnSelection = {
  containerId: string;
  columnIndex: number;
};

type GridColumnSelectionContextValue = {
  selection: GridColumnSelection | null;
  selectColumn: (containerId: string, columnIndex: number) => void;
  clearSelection: () => void;
};

const GridColumnSelectionContext =
  createContext<GridColumnSelectionContextValue | null>(null);

export function GridColumnSelectionProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [selection, setSelection] =
    useState<GridColumnSelection | null>(null);
  const value = useMemo<GridColumnSelectionContextValue>(() => ({
    selection,
    selectColumn: (containerId, columnIndex) =>
      setSelection({ containerId, columnIndex }),
    clearSelection: () => setSelection(null),
  }), [selection]);

  return (
    <GridColumnSelectionContext.Provider value={value}>
      {children}
    </GridColumnSelectionContext.Provider>
  );
}

export function useGridColumnSelection() {
  const context = useContext(GridColumnSelectionContext);
  if (!context) {
    throw new Error(
      'useGridColumnSelection must be used inside GridColumnSelectionProvider.',
    );
  }
  return context;
}
