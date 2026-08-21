// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';

let tokenRef: string | null = null;

async function main() {
  const { createApiClient } = await import('../lib/api-client');
  createApiClient(() => tokenRef, () => {});

  const { authService } = await import('../services/auth-service');
  const login = await authService.login({ email: process.env.TEST_USER_EMAIL ?? '', password: process.env.TEST_USER_PASSWORD ?? '' });
  tokenRef = login.accessToken;

  const { orgService } = await import('../services/org-service');
  const { electionService } = await import('../services/election-service');

  const results: Record<string, string> = {};

  const run = async (name: string, fn: () => Promise<unknown>) => {
    try {
      const value = await fn();
      const shape =
        value && typeof value === 'object'
          ? Array.isArray(value)
            ? `array[${(value as unknown[]).length}]`
            : `object(${Object.keys(value as object).join(',')})`
          : typeof value;
      results[name] = `OK ${shape}`;
    } catch (e) {
      results[name] = `THROW ${e instanceof Error ? e.message : String(e)}`;
    }
  };

  await run('getTeam', () => orgService.getTeam({ perPage: 100 }));
  await run('getInvitations', () => orgService.getInvitations());
  await run('getRoleOptions', () => orgService.getRoleOptions());
  await run('getRoles', () => orgService.getRoles());
  await run('getPermissions', () => orgService.getPermissions());
  await run('getAuditLogs', () => orgService.getAuditLogs({ perPage: 100 }));
  await run('getReports', () => orgService.getReports());
  await run('getTemplates', () => orgService.getTemplates({ perPage: 100 }));
  await run('getArchive', () => orgService.getArchive({ perPage: 100 }));
  await run('getHelpArticles', () => orgService.getHelpArticles({ perPage: 100 }));
  await run('getHelpCategories', () => orgService.getHelpCategories());
  await run('getNotifications', () => orgService.getNotifications({ perPage: 100 }));
  await run('getUnreadCount', () => orgService.getUnreadCount());
  await run('getBilling', () => orgService.getBilling());
  await run('getBillingPlans', () => orgService.getBillingPlans());
  await run('getSubscriptionInfo', () => orgService.getSubscriptionInfo());
  await run('getInvoices', () => orgService.getInvoices());
  await run('getElectionSummary', () => orgService.getElectionSummary());
  await run('getElections', () => orgService.getElections({ perPage: 100 }));
  await run('getActivityFeed', () => orgService.getActivityFeed());
  await run('getDashboard', () => orgService.getDashboard());
  await run('electionService.getElections', () => electionService.getElections());

  console.log('\n=== LIVE ORG SERVICE RESULTS ===');
  for (const [k, v] of Object.entries(results)) console.log(`  ${v.padEnd(70)} ${k}`);
  console.log('=================================\n');
  return results;
}

const runLive = !!process.env.ORG_LIVE;

describe.skipIf(!runLive)('live org-service integration', () => {
  it('exercises all org service methods', async () => {
    const results = await main();
    const failures = Object.entries(results).filter(([, v]) => v.startsWith('THROW'));
    expect(failures).toEqual([]);
  }, 120000);
});
