import Footer from './components/Footer';
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
      <body className='flex flex-col h-full'>
        <header>
          <h1 className='text-center'>The Game Master&apos;s Tool</h1>
        </header>

        <div className='flex-grow'>{children}</div>

        <Footer />
      </body>
    </html>
  );
}
