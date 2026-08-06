export type PopupState = {
  type: 'row' | 'column';
  cellX: number;
  cellY: number;
  tableElement: HTMLTableElement;
  isHeader: boolean;
  hintElement: HTMLDivElement;
} | null;
