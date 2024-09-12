type ColorConfig = {
  full: string;
  '01': string;
  '10': string;
  '30': string;
  '50': string;
};

export type Colors = {
  [key: string]: ColorConfig;
};
