// components/Button.tsx
type ButtonProps = {
  text: string;
  variant?: 'red' | 'blue';
  type?: 'button' | 'submit';
};

export default function Button({ text, variant = 'red', type = 'button' }: ButtonProps) {
  // ベースとなる共通スタイル
  const baseStyle = "w-full mt-4 py-3 text-white font-bold rounded-xl shadow-md transition-all cursor-pointer text-center active:scale-[0.98]";
  
  // 色ごとのスタイル（Tailwind CSS v4 のカスタムカラーを使用）
  const variantStyles = variant === 'red' 
    ? "bg-brand-red hover:bg-red-600 shadow-brand-red/20" 
    : "bg-brand-blue hover:bg-sky-500 shadow-brand-blue/20";

  return (
    <button type={type} className={`${baseStyle} ${variantStyles}`}>
      {text}
    </button>
  );
}