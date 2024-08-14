import '@testing-library/jest-dom';
import { version } from '../../package.json';
import { render, screen } from '@testing-library/react';
import Footer from './Footer';

describe('Footer component', () => {
  it('should have the version number anywhere within the footer', () => {
    render(<Footer />);

    expect(screen.getByRole('contentinfo')).toHaveTextContent(version);
  });
});
