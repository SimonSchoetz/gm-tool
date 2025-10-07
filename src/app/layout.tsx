import Footer from '@/components/Footer';
import './styles.scss';

import { Backdrop, LightSource } from '@/components/animations';
import { ConvexClientProvider } from '@/components/ConvexClientProvider';

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
        <div className='flex-grow flex flex-col items-center justify-between'>
          <ConvexClientProvider>{children}</ConvexClientProvider>
          <Footer />
        </div>
      </body>
    </html>
  );
};

export default RootLayout;
