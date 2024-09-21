import Footer from '@/components/Footer';
import './styles.scss';
import dynamic from 'next/dynamic';
import { LightSource } from '@/components/animations';

const Backdrop = dynamic(
  () => import('../components/animations/backdrop/Backdrop'),
  { ssr: false }
);

export const metadata = {
  title: "The Game Master's Tool",
  description:
    "The Game Master's Tool is your ultimate companion for organizing tabletop RPG games. Plan campaigns, manage characters, and create immersive experiences for your players. Start mastering your game today!",
};

const RootLayout = ({ children }: { readonly children: React.ReactNode }) => {
  return (
    <html lang='en' className='h-full relative'>
      <body className='bg-gm-bg flex flex-col min-h-full'>
        <LightSource intensity='bright' />
        <Backdrop />

        <div className='flex-grow flex flex-col items-center justify-center px-2'>
          {children}
        </div>

        <Footer />
      </body>
    </html>
  );
};

export default RootLayout;
