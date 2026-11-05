import { continueAsNew, proxyActivities, sleep } from '@temporalio/workflow';
import { PostActivity } from '@gitroom/orchestrator/activities/post.activity';

const { readDuePostMetrics } = proxyActivities<PostActivity>({
  startToCloseTimeout: '10 minute',
  retry: {
    maximumAttempts: 3,
    backoffCoefficient: 1,
    initialInterval: '2 minutes',
  },
});

export async function postMetricsWorkflow() {
  for (let loops = 0; loops < 24; loops++) {
    await readDuePostMetrics();
    await sleep('1 hour');
  }

  // Keep the history small, the new run reads immediately so the hourly cadence is kept
  return await continueAsNew<typeof postMetricsWorkflow>();
}
