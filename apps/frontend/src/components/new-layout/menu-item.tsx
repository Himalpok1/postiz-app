'use client';
import { FC, ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';
import Link from 'next/link';
import { useT } from '@gitroom/react/translation/get.transation.service.client';

// Every section has a room color: it tints the frame around the sheet while
// you are there, and its nav tile always wears it
export const roomForPath = (path: string) => {
  if (path.indexOf('/analytics') === 0) return 'analytics';
  if (path.indexOf('/media') === 0) return 'media';
  if (path.indexOf('/billing') === 0) return 'billing';
  if (
    path.indexOf('/settings') === 0 ||
    path.indexOf('/plugs') === 0 ||
    path.indexOf('/third-party') === 0
  ) {
    return 'settings';
  }
  return 'calendar';
};

const tileColor: Record<string, string> = {
  calendar: 'bg-roomCalendar',
  analytics: 'bg-roomAnalytics',
  media: 'bg-roomMedia',
  billing: 'bg-roomBilling',
  settings: 'bg-roomSettings',
};

export const CreatePostLink: FC<{ className: string }> = ({ className }) => {
  const t = useT();
  return (
    <Link
      href="/launches?create=1"
      className={clsx(
        'items-center justify-center gap-[8px] rounded-pill bg-btnPrimary text-accentInk font-[600] whitespace-nowrap hover:bg-accentHover active:opacity-90 transition-colors duration-[120ms] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
        className
      )}
    >
      {t('create_new_post', 'Create Post')}
    </Link>
  );
};

export const MenuItem: FC<{ label: string; icon: ReactNode; path: string; onClick?: () => void }> = ({
  label,
  icon,
  path,
  onClick,
}) => {
  const currentPath = usePathname();
  const isActive = currentPath.indexOf(path) === 0;

  const className = clsx(
    'w-full h-[48px] mobile:h-[40px] mobile:w-auto mobile:shrink-0 px-[16px] flex items-center gap-[12px] mobile:gap-[8px] rounded-card font-[600] text-[16px] mobile:text-[14px] text-ink whitespace-nowrap transition-colors duration-[120ms] active:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent [&_svg]:w-[18px] [&_svg]:h-[18px] [&_svg]:shrink-0',
    isActive
      ? 'bg-paper2 outline outline-1 outline-rule'
      : `${tileColor[roomForPath(path)]} hover:bg-paper2`
  );

  const inner = (
    <>
      {icon}
      <span className="truncate">{label}</span>
    </>
  );

  if (onClick) {
    return (
      <button onClick={onClick} title={label} className={className}>
        {inner}
      </button>
    );
  }

  return (
    <Link
      prefetch={true}
      href={path}
      title={label}
      aria-current={isActive ? 'page' : undefined}
      {...path.indexOf('http') === 0 && { target: '_blank' }}
      className={className}
    >
      {inner}
    </Link>
  );
};
