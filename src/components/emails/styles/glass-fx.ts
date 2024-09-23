import { emailColors as colors } from './color';

export const glassFX: React.CSSProperties = {
  backgroundColor: colors.primary['01'],
  border: `1px solid ${colors.fg['20']}`,
  borderBottomColor: colors.primary['01'],
  borderRightColor: colors.primary['01'],
  boxShadow: `0px 0px 2px 1px ${colors.bg['30']} inset`,
  backdropFilter: 'blur(2px)',
  filter: `drop-shadow(0 0 1rem ${colors.fg.full})`,
  color: colors.fg.full,
};
