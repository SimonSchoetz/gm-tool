import Footer from '@/components/Footer';
import './styles.scss';
import { Backdrop } from '@/components/animations';

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
        <div className='light-source flex-grow flex items-center justify-center'>
          {children}
        </div>

        <Footer />

        <Backdrop />
      </body>
    </html>
  );
}
