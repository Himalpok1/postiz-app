'use client';

import React, { FC, ReactNode, useState } from 'react';
import clsx from 'clsx';
import { useT } from '@gitroom/react/translation/get.transation.service.client';
import { useUser } from '@gitroom/frontend/components/layout/user.context';
import { useVariables } from '@gitroom/react/helpers/variable.context';
import {
  AnyMcpClient,
  CopyButton,
  getMcpConfig,
  McpAuth,
  mcpClients,
  remoteMcpClients,
} from '@gitroom/frontend/components/public-api/public.component';
import { McpClientIcon } from '@gitroom/frontend/components/public-api/mcp.client.icons';
import { ApprovedAppsComponent } from '@gitroom/frontend/components/approved-apps/approved-apps.component';

const featuredClients: AnyMcpClient[] = [
  'Claude',
  'ChatGPT',
  'Cursor',
];

const allClients = [
  ...Object.keys(remoteMcpClients),
  ...mcpClients,
] as AnyMcpClient[];

const Step: FC<{ position: number; title: string; children: ReactNode }> = ({
  position,
  title,
  children,
}) => (
  <li className="flex gap-[12px] min-w-0">
    <div className="w-[28px] h-[28px] rounded-full shrink-0 flex items-center justify-center text-[13px] font-[700] bg-paper3 text-ink">
      {position}
    </div>
    <div className="flex-1 min-w-0 flex flex-col gap-[10px]">
      <h4 className="text-[15px] font-[600] text-ink leading-[28px]">
        {title}
      </h4>
      {children}
    </div>
  </li>
);

export const AiToolsComponent: FC = () => {
  const t = useT();
  const user = useUser();
  const { backendUrl, mcpUrl } = useVariables();
  const [client, setClient] = useState<AnyMcpClient>('Claude');
  const [showAll, setShowAll] = useState(false);
  const [auth, setAuth] = useState<McpAuth>('oauth');

  if (!user?.publicApi) {
    return null;
  }

  const { config, hint } = getMcpConfig(
    client,
    auth,
    mcpUrl || backendUrl,
    user.publicApi
  );

  const clients = showAll ? allClients : featuredClients;

  return (
    <div className="flex flex-col gap-[24px] max-w-[720px]">
      <div className="flex flex-col gap-[8px]">
        <h3 className="font-display text-[20px] font-[700] text-ink">
          {t('ai_tools', 'AI tools')}
        </h3>
        <p className="text-[14px] text-muted">
          {t(
            'ai_tools_intro',
            'Connect your own Claude, ChatGPT or Cursor, then ask it to draft and schedule your posts. It runs on your own AI plan, and Castrapid adds no AI charge.'
          )}
        </p>
      </div>

      <ol className="flex flex-col gap-[24px]">
        <Step position={1} title={t('ai_tools_pick', 'Pick your tool')}>
          <div className="flex flex-wrap gap-[8px]">
            {clients.map((name) => (
              <button
                key={name}
                type="button"
                aria-pressed={client === name}
                onClick={() => setClient(name)}
                className={clsx(
                  'min-h-[40px] px-[14px] rounded-pill text-[14px] font-[500] flex items-center gap-[8px] transition-colors duration-[120ms] active:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
                  client === name
                    ? 'bg-accent text-accentInk'
                    : 'bg-paper3 text-ink hover:bg-boxHover'
                )}
              >
                <McpClientIcon client={name} />
                {name}
              </button>
            ))}
            {!showAll && (
              <button
                type="button"
                onClick={() => setShowAll(true)}
                className="min-h-[40px] px-[14px] rounded-pill text-[14px] font-[500] text-ink underline active:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                {t('ai_tools_more', 'More tools')}
              </button>
            )}
          </div>
        </Step>

        <Step position={2} title={t('ai_tools_add', 'Add Castrapid to it')}>
          <p className="text-[14px] text-muted">{hint}</p>
          <pre className="bg-paper3 rounded-card p-[16px] text-[13px] text-ink whitespace-pre-wrap break-all">
            {auth === 'oauth'
              ? config
              : config.split(user.publicApi).join('*'.repeat(12))}
          </pre>
          <div className="flex flex-wrap items-center gap-[12px]">
            <CopyButton text={config} label={t('copy', 'Copy')} />
            <button
              type="button"
              onClick={() => setAuth(auth === 'oauth' ? 'apikey' : 'oauth')}
              className="min-h-[36px] text-[14px] font-[500] text-muted hover:text-ink underline transition-colors duration-[120ms] active:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              {auth === 'oauth'
                ? t('ai_tools_use_key', 'Use an API key instead')
                : t('ai_tools_use_sign_in', 'Sign in instead')}
            </button>
          </div>
          {auth === 'apikey' && (
            <p className="text-[14px] text-muted">
              {t(
                'ai_tools_key_warning',
                'This contains your API key. Anyone who has it can post to your channels, so keep it private. API key connections are not listed under Connected tools. To cut them off, rotate your key in Developers.'
              )}
            </p>
          )}
        </Step>

        {auth === 'oauth' ? (
          <Step
            position={3}
            title={t('ai_tools_approve', 'Sign in and approve')}
          >
            <p className="text-[14px] text-muted">
              {t(
                'ai_tools_approve_body',
                'Your tool opens a Castrapid page. Approve it there, then try: "Draft three posts for next week and save them as drafts."'
              )}
            </p>
          </Step>
        ) : (
          <Step position={3} title={t('ai_tools_try', 'Try it')}>
            <p className="text-[14px] text-muted">
              {t(
                'ai_tools_try_body',
                'Ask your tool: "Draft three posts for next week and save them as drafts."'
              )}
            </p>
          </Step>
        )}
      </ol>

      <div className="border-t border-rule pt-[24px] flex flex-col gap-[8px]">
        <h4 className="text-[15px] font-[600] text-ink">
          {t('ai_tools_can_do', 'What it can do')}
        </h4>
        <p className="text-[14px] text-muted">
          {t(
            'ai_tools_can_do_body',
            "Once connected, it can see your channels and calendar, and create, schedule, publish and delete posts. It can publish right away, so ask for drafts while you try it out. It can't make images or videos."
          )}
        </p>
      </div>

      <div className="border-t border-rule pt-[24px] flex flex-col gap-[12px]">
        <h4 className="text-[15px] font-[600] text-ink">
          {t('ai_tools_connected', 'Connected tools')}
        </h4>
        <ApprovedAppsComponent />
      </div>
    </div>
  );
};
