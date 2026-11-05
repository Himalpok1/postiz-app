'use client';

import React, { FC, useCallback } from 'react';
import useSWR from 'swr';
import dayjs from 'dayjs';
import clsx from 'clsx';
import { useFetch } from '@gitroom/helpers/utils/custom.fetch';
import { useT } from '@gitroom/react/translation/get.transation.service.client';

interface PublishUsage {
  provider: string;
  label: string;
  period: 'month' | 'day';
  resetsAt: string;
  posts: number;
  postsLimit: number;
  linkPosts?: number;
  linkPostsLimit?: number;
}

interface Usage {
  storage: { used: number; limit: number };
  publish: PublishUsage[];
}

const useUsage = () => {
  const fetch = useFetch();
  const load = useCallback(async () => {
    return (await fetch('/settings/usage')).json();
  }, []);

  return useSWR<Usage>('settings-usage', load);
};

const GB = 1024 * 1024 * 1024;

const UsageRow: FC<{ label: string; detail: string; share: number }> = ({
  label,
  detail,
  share,
}) => (
  <div className="flex flex-col gap-[6px]">
    <div className="flex items-baseline justify-between gap-[12px] text-[14px]">
      <div>{label}</div>
      <div className="text-textItemBlur tabular-nums whitespace-nowrap">
        {detail}
      </div>
    </div>
    <div className="h-[6px] rounded-pill bg-rule overflow-hidden">
      <div
        className={clsx(
          'h-full rounded-pill',
          share >= 1 ? 'bg-error' : 'bg-accent'
        )}
        style={{ width: `${Math.min(share, 1) * 100}%` }}
      />
    </div>
  </div>
);

const UsageComponent = () => {
  const t = useT();
  const { data, error, isLoading } = useUsage();

  return (
    <div className="my-[16px] mt-[16px] bg-paper3 rounded-card p-[24px] flex flex-col gap-[16px]">
      <div className="mt-[4px]">{t('usage', 'Usage')}</div>
      {isLoading && (
        <div className="flex flex-col gap-[16px] animate-pulse motion-reduce:animate-none">
          <div className="h-[28px] rounded-[6px] bg-rule" />
          <div className="h-[28px] rounded-[6px] bg-rule" />
        </div>
      )}
      {!isLoading && (error || !data?.storage) && (
        <div className="text-[14px] text-textItemBlur">
          {t('usage_load_failed', 'Could not load your usage, please try again.')}
        </div>
      )}
      {data?.storage && (
        <>
          {data.publish.map((limit) => {
            const resets = dayjs(limit.resetsAt).format('MMM D');
            return (
              <React.Fragment key={limit.provider}>
                <UsageRow
                  label={
                    limit.period === 'day'
                      ? `${limit.label} ${t('posts_today', 'posts today')}`
                      : `${limit.label} ${t(
                          'posts_until',
                          'posts until'
                        )} ${resets}`
                  }
                  detail={`${limit.posts} / ${limit.postsLimit}`}
                  share={limit.posts / (limit.postsLimit || 1)}
                />
                {limit.linkPostsLimit !== undefined && (
                  <UsageRow
                    label={`${limit.label} ${t(
                      'posts_with_links_until',
                      'posts with links until'
                    )} ${resets}`}
                    detail={`${limit.linkPosts} / ${limit.linkPostsLimit}`}
                    share={(limit.linkPosts || 0) / (limit.linkPostsLimit || 1)}
                  />
                )}
              </React.Fragment>
            );
          })}
          <UsageRow
            label={t('media_storage', 'Media storage')}
            detail={`${(data.storage.used / GB).toFixed(2)} / ${
              data.storage.limit / GB
            } GB`}
            share={data.storage.used / (data.storage.limit || 1)}
          />
        </>
      )}
    </div>
  );
};

export default UsageComponent;
