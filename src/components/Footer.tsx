import pkg from '../../package.json';

const Footer = () => {
  return (
    <footer
      aria-label='Footer section'
      aria-roledescription='This is the footer section.'
      style={{ borderLeft: 0, borderRight: 0 }}
      className='p-4 flex items-center justify-center glass-fx w-full mt-8'
    >
      Version {pkg.version}
    </footer>
  );
};

export default Footer;
