import { createHarnessReport } from '../src/shared/lib/harness';

const main = async (): Promise<void> => {
  const report = await createHarnessReport();
  const isStrict = process.argv.includes('--strict');
  const isSummary = process.argv.includes('--summary');

  if (isSummary) {
    process.stdout.write(`Harness status: ${report.status}\n`);

    if (report.verification.warnings.length > 0) {
      report.verification.warnings.forEach((warning) => {
        process.stdout.write(`- ${warning}\n`);
      });
    } else {
      process.stdout.write('- warnings 없음\n');
    }

    process.stdout.write(
      `- workflow: ${report.workflow.requiredTaskSteps.length}단계, commit policy=${report.workflow.commitPolicy.mode}\n`
    );
    process.stdout.write(
      `- automation: pre-commit=${report.workflow.automation.hooks.preCommit.path}, commit-msg=${report.workflow.automation.hooks.commitMessage.path}, ci=${report.workflow.automation.ci.path}\n`
    );
  } else {
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  }

  if (isStrict && report.status !== 'ready') {
    process.exitCode = 1;
  }
};

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.stack ?? error.message : String(error);
  process.stderr.write(`${message}\n`);
  process.exitCode = 1;
});
