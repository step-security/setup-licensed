const core = require('@actions/core');
const axios = require('axios');
const fs = require('fs');
const installers = require('./installers');

async function validateSubscription() {
  let repoPrivate;
  const eventPath = process.env.GITHUB_EVENT_PATH;
  if (eventPath && fs.existsSync(eventPath)) {
    const payload = JSON.parse(fs.readFileSync(eventPath, 'utf8'));
    repoPrivate = payload?.repository?.private;
  }

  const upstream = 'licensee/setup-licensed';
  const action = process.env.GITHUB_ACTION_REPOSITORY;
  const docsUrl = 'https://docs.stepsecurity.io/actions/stepsecurity-maintained-actions';

  core.info('');
  core.info('\u001b[1;36mStepSecurity Maintained Action\u001b[0m');
  core.info(`Secure drop-in replacement for ${upstream}`);
  if (repoPrivate === false) {
    core.info('\u001b[32m\u2713 Free for public repositories\u001b[0m');
  }

  core.info(`\u001b[36mLearn more:\u001b[0m ${docsUrl}`);
  core.info('');

  if (repoPrivate === false) {
    return;
  }

  const serverUrl = process.env.GITHUB_SERVER_URL || 'https://github.com';
  const body = { action: action || '' };

  if (serverUrl !== 'https://github.com') {
    body.ghes_server = serverUrl;
  }

  try {
    await axios.post(
      `https://agent.api.stepsecurity.io/v1/github/${process.env.GITHUB_REPOSITORY}/actions/maintained-actions-subscription`,
      body,
      { timeout: 3000 },
    );
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 403) {
      core.error(
        `\u001b[1;31mThis action requires a StepSecurity subscription for private repositories.\u001b[0m`,
      );
      core.error(`\u001b[31mLearn how to enable a subscription: ${docsUrl}\u001b[0m`);
      process.exit(1);
    }

    core.info('Timeout or API not reachable. Continuing to next step.');
  }
}

async function run() {
  try {
    await validateSubscription();
    const version = core.getInput('version', { required: true });

    // prefer installing licensed as a gem, otherwise install an exe
    core.info(`attempting to install licensed gem matching "${version}"`);
    let installedVersion = await installers.gem(version);
    if (installedVersion) {
      core.info(`licensed (${installedVersion}) gem installed`);
      return;
    }
    core.info('gem installation was not successful');

    core.info(`attempting to install licensed executable matching "${version}"`);
    installedVersion = await installers.exe(version);
    if (installedVersion) {
      core.info(`licensed (${installedVersion}) executable installed`);
      return;
    }
    core.info('exe installation was not successful');

    throw new Error(`unable to install licensed matching "${version}"`);
  } catch (error) {
    core.setFailed(error.message);
  }
}

module.exports = run;
