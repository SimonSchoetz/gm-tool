export default function SignUpLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <section style={{ maxWidth: '400px' }} className='p-4 flex flex-col gap-4'>
      {children}
    </section>
  );
}
