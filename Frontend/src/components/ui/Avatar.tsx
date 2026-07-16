import { cn } from '../../lib/utils';

interface AvatarProps {
  src?: string;
  alt: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const PALETTES = [
  {
    bg: 'bg-blue-50 dark:bg-accent-blue dark:bg-opacity-20',
    text: 'text-blue-700 dark:text-accent-blue',
  },
  {
    bg: 'bg-purple-50 dark:bg-accent-purple dark:bg-opacity-20',
    text: 'text-purple-700 dark:text-accent-purple',
  },
  {
    bg: 'bg-emerald-50 dark:bg-accent-green dark:bg-opacity-20',
    text: 'text-emerald-700 dark:text-accent-green',
  },
  {
    bg: 'bg-sky-50 dark:bg-accent-sky dark:bg-opacity-20',
    text: 'text-sky-700 dark:text-accent-sky',
  },
  {
    bg: 'bg-teal-50 dark:bg-accent-teal dark:bg-opacity-20',
    text: 'text-teal-700 dark:text-accent-teal',
  },
  {
    bg: 'bg-indigo-50 dark:bg-accent-indigo dark:bg-opacity-20',
    text: 'text-indigo-700 dark:text-accent-indigo',
  },
  {
    bg: 'bg-indigo-50 dark:bg-accent-brand dark:bg-opacity-20',
    text: 'text-indigo-700 dark:text-accent-brand',
  },
];

const getInitials = (name: string) => {
  if (!name) return '';
  return name.trim().charAt(0).toUpperCase();
};

const getPalette = (name: string) => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % PALETTES.length;
  return PALETTES[index] || PALETTES[0];
};

export const Avatar = ({ src, alt, size = 'md', className }: AvatarProps) => {
  const sizes = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
  };

  const textSizes = {
    sm: 'text-[10px] font-semibold',
    md: 'text-xs font-semibold',
    lg: 'text-sm font-bold',
  };

  const isLogo = src && src.toLowerCase().includes('logo');

  if (isLogo) {
    return (
      <img
        src={src}
        alt={alt}
        className={cn('rounded-full object-cover shrink-0', sizes[size], className)}
      />
    );
  }

  const initials = getInitials(alt);
  const palette = getPalette(alt);

  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center font-display uppercase tracking-wider select-none shrink-0 border border-primary/5',
        sizes[size],
        textSizes[size],
        palette.bg,
        palette.text,
        className,
      )}
    >
      {initials}
    </div>
  );
};
