'use client';

import React, { ReactNode, useCallback, useEffect } from 'react';
import { Logo } from '@gitroom/frontend/components/new-layout/logo';
import {
  CreatePostLink,
  roomForPath,
} from '@gitroom/frontend/components/new-layout/menu-item';
const ModeComponent = dynamic(
  () => import('@gitroom/frontend/components/layout/mode.component'),
  {
    ssr: false,
  }
);

import clsx from 'clsx';
import dynamic from 'next/dynamic';
import { useFetch } from '@gitroom/helpers/utils/custom.fetch';
import { useVariables } from '@gitroom/react/helpers/variable.context';
import { usePathname, useSearchParams } from 'next/navigation';
import useSWR from 'swr';
import { CheckPayment } from '@gitroom/frontend/components/layout/check.payment';
import { ToolTip } from '@gitroom/frontend/components/layout/top.tip';
import { ShowMediaBoxModal } from '@gitroom/frontend/components/media/media.component';
import { ShowLinkedinCompany } from '@gitroom/frontend/components/launches/helpers/linkedin.component';
import { MediaSettingsLayout } from '@gitroom/frontend/components/launches/helpers/media.settings.component';
import { Toaster } from '@gitroom/react/toaster/toaster';
import { ShowPostSelector } from '@gitroom/frontend/components/post-url-selector/post.url.selector';
import { NewSubscription } from '@gitroom/frontend/components/layout/new.subscription';
import { Support } from '@gitroom/frontend/components/layout/support';
import { ContinueProvider } from '@gitroom/frontend/components/layout/continue.provider';
import { ContextWrapper } from '@gitroom/frontend/components/layout/user.context';
import { MantineWrapper } from '@gitroom/react/helpers/mantine.wrapper';
import { Impersonate } from '@gitroom/frontend/components/layout/impersonate';
import { AnnouncementBanner } from '@gitroom/frontend/components/layout/announcement.banner';
import { Title } from '@gitroom/frontend/components/layout/title';
import { TopMenu } from '@gitroom/frontend/components/layout/top.menu';
import { LanguageComponent } from '@gitroom/frontend/components/layout/language.component';
import { ChromeExtensionComponent } from '@gitroom/frontend/components/layout/chrome.extension.component';
import NotificationComponent from '@gitroom/frontend/components/notifications/notification.component';
import { OrganizationSelector } from '@gitroom/frontend/components/layout/organization.selector';
import { InvoicesComponent } from '@gitroom/frontend/components/layout/invoices.component';
import { StreakComponent } from '@gitroom/frontend/components/layout/streak.component';
import { PreConditionComponent } from '@gitroom/frontend/components/layout/pre-condition.component';
import { AttachToFeedbackIcon } from '@gitroom/frontend/components/new-layout/sentry.feedback.component';
import { FirstBillingComponent } from '@gitroom/frontend/components/billing/first.billing.component';
import { TrialTracker } from '@gitroom/frontend/components/layout/gtm.component';
import { setSentryUser } from '@gitroom/react/sentry/initialize.sentry.client';
import { setUserTimezone } from '@gitroom/frontend/components/layout/set.timezone';

export const LayoutComponent = ({ children }: { children: ReactNode }) => {
  const fetch = useFetch();

  const { billingEnabled, isGeneral } = useVariables();

  // Feedback icon component attaches Sentry feedback to a top-bar icon when DSN is present
  const searchParams = useSearchParams();
  const pathname = usePathname();
  // on <html> so modals and popups, which render outside the shell, match too
  useEffect(() => {
    document.documentElement.dataset.room = roomForPath(pathname);
    return () => {
      delete document.documentElement.dataset.room;
    };
  }, [pathname]);
  const load = useCallback(async (path: string) => {
    return await (await fetch(path)).json();
  }, []);
  const { data: user, mutate } = useSWR('/user/self', load, {
    // set before anything renders a date in the user's timezone
    onSuccess: (data) => setUserTimezone(data?.timezoneName),
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    revalidateIfStale: false,
    refreshWhenOffline: false,
    refreshWhenHidden: false,
  });

  useEffect(() => {
    setSentryUser(
      user ? { id: user.id, email: user.email, orgId: user.orgId } : null
    );
  }, [user]);

  if (!user) return null;

  return (
    <ContextWrapper user={user}>
      <MantineWrapper>
        <ToolTip />
        <Toaster />
        <TrialTracker />
        <CheckPayment check={searchParams.get('check') || ''} mutate={mutate}>
          <ShowMediaBoxModal />
          <ShowLinkedinCompany />
          <MediaSettingsLayout />
          <ShowPostSelector />
          <PreConditionComponent />
          <NewSubscription />
          <ContinueProvider />
          <div className="flex flex-col min-h-screen min-w-screen bg-room text-newTextColor p-[16px] mobile:p-[8px] mobile:pb-[80px] transition-colors duration-[220ms]">
            <div>{user?.admin ? <Impersonate /> : <div />}</div>
            {user.tier === 'FREE' && isGeneral && billingEnabled ? (
              <FirstBillingComponent />
            ) : (
              <>
                <AnnouncementBanner />
                <div className="flex-1 flex gap-[16px] mobile:flex-col mobile:gap-[8px]">
                  <Support />
                  <nav
                    id="left-menu"
                    aria-label="Main"
                    className={clsx(
                      'flex flex-col gap-[16px] w-[192px] shrink-0 sticky top-[16px] self-start max-h-[calc(100vh-32px)] overflow-y-auto overflow-x-hidden mobile:static mobile:w-full mobile:max-h-none mobile:flex-row mobile:items-center mobile:gap-[8px] mobile:overflow-x-auto mobile:overflow-y-hidden'
                    )}
                  >
                    <div className="px-[8px] pt-[8px] mobile:p-0 mobile:shrink-0 mobile:sticky mobile:start-0 mobile:z-[10] mobile:bg-room mobile:flex mobile:items-center mobile:gap-[8px]">
                      <Logo />
                      {pathname.indexOf('/launches') !== 0 && (
                        <CreatePostLink className="hidden mobile:flex px-[14px] h-[40px]" />
                      )}
                    </div>
                    <TopMenu />
                    {pathname.indexOf('/launches') !== 0 && (
                      <CreatePostLink className="flex h-[44px] mobile:hidden" />
                    )}
                    {/* The calendar renders its Create post and channels here */}
                    <div id="rail-slot" className="contents mobile:hidden" />
                  </nav>
                  <div className="flex-1 min-w-0 bg-newBgColorInner rounded-sheet overflow-hidden flex flex-col blurMe mobile:rounded-[20px]">
                    {/* relative: the notifications popup spans this bar on phones */}
                    <div className="relative flex h-[72px] mobile:h-[56px] px-[24px] mobile:px-[12px] gap-[12px] items-center border-b border-rule">
                      <div className="text-[24px] mobile:text-[20px] font-[700] flex flex-1 min-w-0">
                        <Title />
                      </div>
                      <div className="flex gap-[20px] mobile:gap-[14px] items-center text-textItemBlur">
                        <StreakComponent />
                        <div className="w-[1px] h-[20px] bg-blockSeparator mobile:hidden" />
                        <OrganizationSelector />
                        <InvoicesComponent />
                        <div className="hover:text-newTextColor">
                          <ModeComponent />
                        </div>
                        <div className="w-[1px] h-[20px] bg-blockSeparator mobile:hidden" />
                        <LanguageComponent />
                        <div className="contents mobile:hidden">
                          <ChromeExtensionComponent />
                        </div>
                        <div className="w-[1px] h-[20px] bg-blockSeparator mobile:hidden" />
                        <div className="contents mobile:hidden">
                          <AttachToFeedbackIcon />
                        </div>
                        <NotificationComponent />
                      </div>
                    </div>
                    <div className="flex flex-1 min-w-0 mobile:flex-col">
                      {children}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </CheckPayment>
      </MantineWrapper>
    </ContextWrapper>
  );
};
