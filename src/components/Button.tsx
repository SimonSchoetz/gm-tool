export type ButtonProps = {
  label: string;
  type?: HTMLButtonElement['type'];
  onClick?: () => void;
};

const Button = ({ label, type, onClick }: ButtonProps) => {
  return (
    <button
      onClick={onClick}
      type={type}
      className='bg-slate-600 text-white rounded-xl px-4 py-2 hover:bg-slate-400 w-full'
    >
      {label}
    </button>
  );
};

export default Button;
