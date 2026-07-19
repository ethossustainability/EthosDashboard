type EthosLogoProps = {
  variant?: 'dark' | 'light';
  size?: 'sm' | 'md';
};

export function EthosLogo({ variant = 'dark', size = 'md' }: EthosLogoProps) {
  const variantClasses =
    variant === 'dark'
      ? 'bg-espresso text-cream'
      : 'bg-cream text-espresso';

  const markClasses = size === 'sm' ? 'h-5 w-5 rounded-md' : 'h-7 w-7 rounded-lg';
  const wordmarkClasses = size === 'sm' ? 'text-sm' : 'text-base';
  const descriptorClasses = size === 'sm' ? 'text-[7px]' : 'text-[9px]';

  return (
    <div className={`inline-flex items-center gap-2 ${variantClasses}`}>
      <div className={`${markClasses} bg-current`} aria-hidden="true" />
      <div className="flex flex-col leading-none">
        <span className={`${wordmarkClasses} font-bold lowercase`}>ethos</span>
        <span className={`${descriptorClasses} font-semibold uppercase tracking-widest`}>
          Sustainability
        </span>
      </div>
    </div>
  );
}
