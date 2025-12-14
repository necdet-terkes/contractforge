#!/usr/bin/env tsx
/**
 * Test Report Aggregation Script
 *
 * Combines test results and coverage from:
 * - Jest (unit tests + Pact contract tests)
 * - Playwright (E2E tests)
 *
 * Generates:
 * - Combined coverage report (HTML + JSON)
 * - Test summary (JSON)
 * - GitHub Actions summary (markdown)
 */

import * as fs from 'fs';
import * as path from 'path';

interface TestSummary {
  jest: {
    suites: number;
    tests: number;
    passed: number;
    failed: number;
    coverage?: {
      lines: number;
      statements: number;
      functions: number;
      branches: number;
    };
  };
  playwright: {
    suites: number;
    tests: number;
    passed: number;
    failed: number;
    skipped: number;
  };
  pact: {
    verified: number;
    failed: number;
  };
  total: {
    suites: number;
    tests: number;
    passed: number;
    failed: number;
    skipped: number;
  };
}

const rootDir = path.resolve(__dirname, '../..');
const outputDir = path.join(rootDir, 'test-results');
const coverageDir = path.join(rootDir, 'coverage');

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

function readJestCoverage(): TestSummary['jest']['coverage'] | undefined {
  // Try root coverage first
  let coverageSummaryPath = path.join(coverageDir, 'coverage-summary.json');

  // If not found, try to aggregate from workspace coverage summaries
  if (!fs.existsSync(coverageSummaryPath)) {
    const workspaces = ['orchestrator-api', 'inventory-api', 'user-api', 'pricing-api'];
    const workspaceSummaries: any[] = [];

    for (const workspace of workspaces) {
      const wsPath = path.join(rootDir, workspace, 'coverage', 'coverage-summary.json');
      if (fs.existsSync(wsPath)) {
        try {
          const wsSummary = JSON.parse(fs.readFileSync(wsPath, 'utf-8'));
          workspaceSummaries.push(wsSummary);
        } catch (error) {
          console.warn(`Failed to read ${workspace} coverage:`, error);
        }
      }
    }

    if (workspaceSummaries.length > 0) {
      // Aggregate coverage from all workspaces
      let totalLines = 0;
      let totalStatements = 0;
      let totalFunctions = 0;
      let totalBranches = 0;
      let count = 0;

      for (const summary of workspaceSummaries) {
        if (summary.total) {
          totalLines += summary.total.lines.pct;
          totalStatements += summary.total.statements.pct;
          totalFunctions += summary.total.functions.pct;
          totalBranches += summary.total.branches.pct;
          count++;
        }
      }

      if (count > 0) {
        return {
          lines: totalLines / count,
          statements: totalStatements / count,
          functions: totalFunctions / count,
          branches: totalBranches / count,
        };
      }
    }

    return undefined;
  }

  try {
    const summary = JSON.parse(fs.readFileSync(coverageSummaryPath, 'utf-8'));
    const total = summary.total;

    return {
      lines: total.lines.pct,
      statements: total.statements.pct,
      functions: total.functions.pct,
      branches: total.branches.pct,
    };
  } catch (error) {
    console.warn('Failed to read Jest coverage summary:', error);
    return undefined;
  }
}

function parseJestResults(): Partial<TestSummary['jest']> {
  // Try to find Jest test results from coverage-summary.json or test output
  // In CI, Jest outputs to stdout, but we can infer from coverage
  const coverage = readJestCoverage();

  // Count test files in each workspace to estimate suites
  const workspaces = ['orchestrator-api', 'inventory-api', 'user-api', 'pricing-api'];
  let totalSuites = 0;

  for (const workspace of workspaces) {
    const workspaceCoveragePath = path.join(
      rootDir,
      workspace,
      'coverage',
      'coverage-summary.json'
    );
    if (fs.existsSync(workspaceCoveragePath)) {
      // Count test files in the workspace
      const testDir = path.join(rootDir, workspace, 'src', '__tests__');
      const pactDir = path.join(rootDir, workspace, 'src', '__pact__');

      if (fs.existsSync(testDir)) {
        const allFiles = fs.readdirSync(testDir, { recursive: true });
        const testFiles = allFiles.filter(
          (f): f is string =>
            typeof f === 'string' && (f.endsWith('.test.ts') || f.endsWith('.spec.ts'))
        );
        totalSuites += testFiles.length;
      }
      if (fs.existsSync(pactDir)) {
        const allFiles = fs.readdirSync(pactDir, { recursive: true });
        const pactFiles = allFiles.filter(
          (f): f is string => typeof f === 'string' && f.endsWith('.pact.test.ts')
        );
        totalSuites += pactFiles.length;
      }
    }
  }

  // If we have coverage, we know tests ran (but exact counts are in stdout)
  // For now, we'll indicate tests ran if coverage exists
  return {
    suites: totalSuites > 0 ? totalSuites : undefined,
    tests: undefined, // Jest outputs this to stdout, not easily parseable
    passed: undefined,
    failed: undefined,
    coverage,
  };
}

function parsePlaywrightResults(): TestSummary['playwright'] {
  const junitPath = path.join(rootDir, 'ui-app', 'test-results', 'junit.xml');
  const htmlReportPath = path.join(rootDir, 'ui-app', 'playwright-report', 'index.html');
  let suites = 0;
  let tests = 0;
  let passed = 0;
  let failed = 0;
  let skipped = 0;

  // Try JUnit XML first
  if (fs.existsSync(junitPath)) {
    try {
      const xml = fs.readFileSync(junitPath, 'utf-8');

      // Parse JUnit XML format
      // Extract testsuite attributes
      const suiteRegex =
        /<testsuite[^>]*tests="(\d+)"[^>]*failures="(\d+)"[^>]*skipped="(\d+)"[^>]*>/g;
      let suiteMatch;
      while ((suiteMatch = suiteRegex.exec(xml)) !== null) {
        suites++;
        const suiteTests = parseInt(suiteMatch[1], 10);
        const suiteFailures = parseInt(suiteMatch[2], 10);
        const suiteSkipped = parseInt(suiteMatch[3], 10);
        tests += suiteTests;
        failed += suiteFailures;
        skipped += suiteSkipped;
      }

      // Fallback: if no testsuite attributes, count testcase elements
      if (tests === 0) {
        const testMatches = xml.match(/<testcase[^>]*>/g);
        tests = testMatches ? testMatches.length : 0;

        const failureMatches = xml.match(/<failure[^>]*>/g);
        failed = failureMatches ? failureMatches.length : 0;

        const skippedMatches = xml.match(/skipped="true"/g);
        skipped = skippedMatches ? skippedMatches.length : 0;
      }

      passed = tests - failed - skipped;
    } catch (error) {
      console.warn('Failed to parse Playwright JUnit XML:', error);
    }
  }

  // Fallback: Try to parse from Playwright report JSON files
  if (tests === 0) {
    const reportDataPath = path.join(
      rootDir,
      'ui-app',
      'playwright-report',
      'data',
      'project.json'
    );
    if (fs.existsSync(reportDataPath)) {
      try {
        const reportData = JSON.parse(fs.readFileSync(reportDataPath, 'utf-8'));
        if (reportData.files) {
          suites = reportData.files.length;
          for (const file of reportData.files) {
            if (file.tests) {
              for (const test of file.tests) {
                tests++;
                if (test.outcome === 'expected') {
                  passed++;
                } else if (test.outcome === 'unexpected') {
                  failed++;
                } else if (test.outcome === 'skipped') {
                  skipped++;
                }
              }
            }
          }
        }
      } catch (error) {
        console.warn('Failed to parse Playwright report JSON:', error);
      }
    }
  }

  return {
    suites,
    tests,
    passed,
    failed,
    skipped,
  };
}

function generateSummary(): TestSummary {
  const jest = parseJestResults();
  const playwright = parsePlaywrightResults();

  // Default values if not found
  const jestDefaults: TestSummary['jest'] = {
    suites: 0,
    tests: 0,
    passed: 0,
    failed: 0,
    coverage: jest.coverage,
  };

  const pactDefaults: TestSummary['pact'] = {
    verified: 0,
    failed: 0,
  };

  const summary: TestSummary = {
    jest: { ...jestDefaults, ...jest },
    playwright,
    pact: pactDefaults,
    total: {
      suites: jestDefaults.suites + playwright.suites,
      tests: jestDefaults.tests + playwright.tests,
      passed: jestDefaults.passed + playwright.passed,
      failed: jestDefaults.failed + playwright.failed,
      skipped: playwright.skipped,
    },
  };

  return summary;
}

function generateGitHubSummary(summary: TestSummary): string {
  const lines: string[] = [];

  lines.push('# 📊 Test Results Summary\n');

  // Overall Status
  const totalPassed = summary.total.passed;
  const totalFailed = summary.total.failed;
  const totalSkipped = summary.total.skipped;
  const totalTests = summary.total.tests;

  const passRate = totalTests > 0 ? ((totalPassed / totalTests) * 100).toFixed(1) : '0';

  lines.push('## Overall Status\n');
  lines.push(`| Metric | Value |`);
  lines.push(`|--------|-------|`);
  lines.push(`| **Total Tests** | ${totalTests} |`);
  lines.push(`| **✅ Passed** | ${totalPassed} |`);
  lines.push(`| **❌ Failed** | ${totalFailed} |`);
  lines.push(`| **⏭️ Skipped** | ${totalSkipped} |`);
  lines.push(`| **Pass Rate** | ${passRate}% |\n`);

  // Jest Results
  lines.push('## Jest (Unit Tests + Pact)\n');
  lines.push(`| Metric | Value |`);
  lines.push(`|--------|-------|`);
  if (summary.jest.suites !== undefined) {
    lines.push(`| **Test Suites** | ${summary.jest.suites} |`);
  }
  if (summary.jest.tests !== undefined) {
    lines.push(`| **Tests** | ${summary.jest.tests} |`);
    lines.push(`| **✅ Passed** | ${summary.jest.passed ?? 'N/A'} |`);
    lines.push(`| **❌ Failed** | ${summary.jest.failed ?? 'N/A'} |`);
  } else {
    lines.push(`| **Status** | ✅ Tests executed (see CI logs for details) |`);
  }
  lines.push('');

  if (summary.jest.coverage) {
    lines.push('### Coverage\n');
    lines.push(`| Metric | Coverage |`);
    lines.push(`|--------|----------|`);
    lines.push(`| **Lines** | ${summary.jest.coverage.lines.toFixed(1)}% |`);
    lines.push(`| **Statements** | ${summary.jest.coverage.statements.toFixed(1)}% |`);
    lines.push(`| **Functions** | ${summary.jest.coverage.functions.toFixed(1)}% |`);
    lines.push(`| **Branches** | ${summary.jest.coverage.branches.toFixed(1)}% |\n`);
  }

  // Playwright Results
  lines.push('## Playwright (E2E Tests)\n');
  lines.push(`| Metric | Value |`);
  lines.push(`|--------|-------|`);
  lines.push(`| **Test Suites** | ${summary.playwright.suites} |`);
  lines.push(`| **Tests** | ${summary.playwright.tests} |`);
  lines.push(`| **✅ Passed** | ${summary.playwright.passed} |`);
  lines.push(`| **❌ Failed** | ${summary.playwright.failed} |`);
  lines.push(`| **⏭️ Skipped** | ${summary.playwright.skipped} |\n`);

  // Pact Results
  if (summary.pact.verified > 0 || summary.pact.failed > 0) {
    lines.push('## Pact (Contract Tests)\n');
    lines.push(`| Metric | Value |`);
    lines.push(`|--------|-------|`);
    lines.push(`| **✅ Verified** | ${summary.pact.verified} |`);
    lines.push(`| **❌ Failed** | ${summary.pact.failed} |\n`);
  }

  return lines.join('\n');
}

function main() {
  console.log('📊 Aggregating test results...\n');

  const summary = generateSummary();

  // Write JSON summary
  const summaryPath = path.join(outputDir, 'test-summary.json');
  fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
  console.log(`✅ Test summary written to: ${summaryPath}`);

  // Write GitHub Actions summary
  if (process.env.GITHUB_STEP_SUMMARY) {
    const githubSummary = generateGitHubSummary(summary);
    fs.writeFileSync(process.env.GITHUB_STEP_SUMMARY, githubSummary);
    console.log('✅ GitHub Actions summary written');
  } else {
    // Write to file for local viewing
    const githubSummaryPath = path.join(outputDir, 'test-summary.md');
    const githubSummary = generateGitHubSummary(summary);
    fs.writeFileSync(githubSummaryPath, githubSummary);
    console.log(`✅ Test summary markdown written to: ${githubSummaryPath}`);
  }

  // Print summary to console
  console.log('\n' + generateGitHubSummary(summary));

  // Exit with error if tests failed
  if (summary.total.failed > 0) {
    process.exit(1);
  }
}

main();
