import Footer from '@/components/Footer';
import './styles.scss';

export const metadata = {
  title: "The Game Master's Tool",
  description:
    "The Game Master's Tool is your ultimate companion for organizing tabletop RPG games. Plan campaigns, manage characters, and create immersive experiences for your players. Start mastering your game today!",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang='en' className='h-full'>
      <body className='flex flex-col h-full bg-slate-100'>
        <header>
          <h1 className='text-center p-8'>The Game Master&apos;s Tool</h1>
        </header>

        <div className='flex-grow flex flex-col justify-center items-center'>
          {children}
        </div>

        <Footer />
      </body>
    </html>
  );
}
