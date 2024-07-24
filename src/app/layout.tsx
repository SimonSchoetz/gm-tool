import Footer from '@/components/Footer';
import './styles.scss';
import Backdrop from '@/components/Backdrop';

export const metadata = {
  title: "The Game Master's Tool",
  description:
    "The Game Master's Tool is your ultimate companion for organizing tabletop RPG games. Plan campaigns, manage characters, and create immersive experiences for your players. Start mastering your game today!",
};

export default function RootLayout({
  children,
}: {
  readonly children: React.ReactNode;
}) {
  return (
    <html lang='en' className='h-full'>
      <body className='bg-gm-primary blueprint-grid-primary flex flex-col h-full'>
        <header>
          <h1 className='text-center text-gm-primary-very-high-contrast p-8'>
            The Game Master&apos;s Tool
          </h1>
        </header>

        <div className='flex-grow flex items-center justify-center'>
          {children}
        </div>

        <Footer />

        <Backdrop />
      </body>
    </html>
  );
}
