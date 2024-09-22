export type SquarePosition = {
  id: string;
  top: number;
  right: number;
  bottom: number;
  left: number;
};

export const getSquarePositions = (idList: string[]): SquarePosition[] => {
  return idList
    .map<SquarePosition | null>((id) => {
      const element = document.getElementById(id);
      if (element) {
        const { top, right, bottom, left } = element.getBoundingClientRect();
        return { id, top, right, bottom, left };
      }
      return null;
    })
    .filter(Boolean) as SquarePosition[];
};
