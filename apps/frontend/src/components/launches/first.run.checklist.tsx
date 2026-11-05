'use client';

import React, { FC, ReactNode, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import clsx from 'clsx';
import { useRouter, useSearchParams } from 'next/navigation';
import { useFetch } from '@gitroom/helpers/utils/custom.fetch';
import { useT } from '@gitroom/react/translation/get.transation.service.client';
import { useUser } from '@gitroom/frontend/components/layout/user.context';
import { useAddProvider } from '@gitroom/frontend/components/launches/add.provider.component';
import { newDayjs } from '@gitroom/frontend/components/layout/set.timezone';
import { useCalendar } from '@gitroom/frontend/components/launches/calendar.context';
import { NewPost } from '@gitroom/frontend/components/launches/new.post';

const useFirstRunProgress = () => {
  const fetch = useFetch();
  const load = useCallback(async (path: string) => {
    const response = await fetch(path);
    if (!response.ok) {
      throw new Error('Could not load the first run progress');
    }
    return response.json();
  }, []);

  return useSWR<{
    hasPost: boolean;
    hasScheduledPost: boolean;
    draftDate: string | null;
  }>(
    '/posts/first-run',
    load,
    { revalidateOnFocus: false }
  );
};

const hiddenKey = (orgId?: string) => `castrapid_first_run_hidden_${orgId}`;

const readHidden = (orgId?: string) => {
  try {
    return !!localStorage.getItem(hiddenKey(orgId));
  } catch (err) {
    return false;
  }
};

const StepMarker: FC<{ position: number; done: boolean; current: boolean }> = ({
  position,
  done,
  current,
}) => (
  <div
    className={clsx(
      'w-[28px] h-[28px] rounded-full shrink-0 flex items-center justify-center text-[13px] font-[700]',
      done && 'bg-accent text-accentInk',
      current && 'bg-paper2 text-ink border-2 border-accent',
      !done && !current && 'bg-paper2 text-muted border border-rule'
    )}
  >
    {done ? (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
        <path
          d="M2.5 7.5L5.5 10.5L11.5 3.5"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ) : (
      position
    )}
  </div>
);

const Step: FC<{
  position: number;
  title: string;
  body: string;
  done: boolean;
  current: boolean;
  doneLabel: string;
  action?: ReactNode;
}> = ({ position, title, body, done, current, doneLabel, action }) => (
  <li
    className="flex gap-[12px] min-w-0"
    aria-current={current ? 'step' : undefined}
  >
    <StepMarker position={position} done={done} current={current} />
    <div className="flex flex-col gap-[4px] min-w-0">
      <div
        className={clsx(
          'text-[15px] font-[600]',
          done || current ? 'text-ink' : 'text-muted'
        )}
      >
        {title}
        {done && (
          <span className="text-[13px] font-[500] text-muted ms-[8px]">
            {doneLabel}
          </span>
        )}
      </div>
      {!done && <div className="text-[14px] text-muted">{body}</div>}
      {current && !!action && <div className="flex mt-[8px]">{action}</div>}
    </div>
  </li>
);

// Sits above the calendar until the first post is scheduled. Everything it
// shows comes from the account, so an account that is already set up never sees it.
export const FirstRunChecklist: FC<{
  channels: number;
  update: () => void;
}> = ({ channels, update }) => {
  const t = useT();
  const user = useUser();
  const router = useRouter();
  const search = useSearchParams();
  const addChannel = useAddProvider(update);
  const { setFilters } = useCalendar();
  const { data } = useFirstRunProgress();
  const [hidden, setHidden] = useState(() => readHidden(user?.orgId));

  // The rail's Create post link has nowhere to post yet, so connect first
  useEffect(() => {
    if (channels === 0 && search.get('create')) {
      router.replace('/launches');
      addChannel();
    }
  }, []);

  const hide = useCallback(() => {
    try {
      localStorage.setItem(hiddenKey(user?.orgId), '1');
    } catch (err) {
      // Nothing to keep it in, so it comes back on the next visit
    }
    setHidden(true);
  }, [user?.orgId]);

  const showDraft = useCallback(
    (date: string) => () => {
      const day = newDayjs(date);
      setFilters({
        startDate: day.startOf('isoWeek').format('YYYY-MM-DD'),
        endDate: day.endOf('isoWeek').format('YYYY-MM-DD'),
        display: 'week',
        customer: null,
      });
    },
    [setFilters]
  );

  if (!data || hidden || data.hasScheduledPost) {
    return null;
  }

  const connected = channels > 0;
  const written = data.hasPost;

  return (
    <section
      aria-labelledby="first-run-title"
      className="bg-paper3 rounded-card p-[16px] flex flex-col gap-[16px]"
    >
      <div className="flex items-center justify-between gap-[12px]">
        <h2
          id="first-run-title"
          className="font-display text-[18px] font-[700] text-ink"
        >
          {t('first_run_title', 'Get your first post out')}
        </h2>
        <button
          type="button"
          onClick={hide}
          className="text-[14px] font-[500] text-muted hover:text-ink active:opacity-90 transition-colors duration-[120ms] min-h-[44px] px-[8px] rounded-pill focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          {t('first_run_hide', 'Hide')}
        </button>
      </div>
      <ol className="grid grid-cols-3 mobile:grid-cols-1 gap-[24px] mobile:gap-[16px]">
        <Step
          position={1}
          title={t('first_run_connect', 'Connect a channel')}
          body={t(
            'first_run_connect_body',
            'Link the account you post to most. You can add more later.'
          )}
          done={connected}
          current={!connected}
          doneLabel={t('first_run_done', 'Done')}
          action={
            <button
              type="button"
              onClick={addChannel}
              className="text-accentInk bg-btnPrimary hover:bg-accentHover active:opacity-90 transition-colors duration-[120ms] min-h-[44px] px-[20px] rounded-pill font-[600] text-[15px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              {t('first_run_connect', 'Connect a channel')}
            </button>
          }
        />
        <Step
          position={2}
          title={t('first_run_write', 'Write a post')}
          body={t(
            'first_run_write_body',
            'Write it once, then adjust it for each channel. Save it as a draft if it needs more thought.'
          )}
          done={written}
          current={connected && !written}
          doneLabel={t('first_run_done', 'Done')}
          action={<NewPost />}
        />
        <Step
          position={3}
          title={t('first_run_schedule', 'Schedule it')}
          body={t(
            'first_run_schedule_body',
            'Open your draft on the calendar, pick a time and add it to the calendar.'
          )}
          done={false}
          current={connected && written}
          doneLabel={t('first_run_done', 'Done')}
          action={
            !!data.draftDate && (
              <button
                type="button"
                onClick={showDraft(data.draftDate)}
                className="text-accentInk bg-btnPrimary hover:bg-accentHover active:opacity-90 transition-colors duration-[120ms] min-h-[44px] px-[20px] rounded-pill font-[600] text-[15px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                {t('first_run_show_draft', 'Show my draft')}
              </button>
            )
          }
        />
      </ol>
      {connected && !!user?.tier?.public_api && (
        <div className="text-[14px] text-muted">
          {t('first_run_ai', 'Rather work from Claude or ChatGPT?')}{' '}
          <Link
            href="/settings?tab=ai_tools"
            className="text-ink font-[500] underline active:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            {t('first_run_ai_link', 'Connect your AI tool')}
          </Link>
        </div>
      )}
    </section>
  );
};
