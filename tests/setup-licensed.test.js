const core = require('@actions/core');
const sinon = require('sinon');
const axios = require('axios');

const run = require('../lib/setup-licensed');
const installers = require('../lib/installers');

describe('setup-licensed', () => {
  const version = '2.3.2';

  const processEnv = process.env;

  beforeEach(() => {
    sinon.stub(core, 'setFailed');
    sinon.stub(core, 'addPath');
    sinon.stub(core, 'info');
    sinon.stub(core, 'error');

    sinon.stub(installers, 'gem').resolves(version);
    sinon.stub(installers, 'exe').resolves(version);

    sinon.stub(axios, 'post').rejects(new Error('timeout'));
    sinon.stub(axios, 'isAxiosError').returns(false);

    process.env = {
      ...process.env,
      INPUT_VERSION: version,
    };
  });

  afterEach(() => {
    process.env = processEnv;
    sinon.restore();
  });

  // The subscription check adds info calls before the main logic.
  // Filter to just the info calls from the main setup logic.
  function getSetupInfoCalls() {
    const allCalls = core.info.args;
    // Find the index of the first setup-related info call
    const setupStartIndex = allCalls.findIndex(
      args => args[0] && args[0].startsWith('attempting to install')
    );
    if (setupStartIndex === -1) return [];
    return allCalls.slice(setupStartIndex);
  }

  it('sets a failure when a version is not given', async () => {
    delete process.env['INPUT_VERSION'];

    await run();
    expect(core.setFailed.callCount).toEqual(1);
    expect(core.setFailed.getCall(0).args).toEqual(['Input required and not supplied: version']);
  });

  it('installs licensed from a gem', async () => {
    await run();
    expect(core.setFailed.callCount).toEqual(0);

    const setupCalls = getSetupInfoCalls();
    expect(setupCalls.length).toEqual(2);
    expect(setupCalls[0]).toEqual([`attempting to install licensed gem matching "${version}"`]);
    expect(setupCalls[1]).toEqual([`licensed (${version}) gem installed`]);

    expect(installers.gem.callCount).toEqual(1);
    expect(installers.gem.getCall(0).args).toEqual([version]);

    expect(installers.exe.callCount).toEqual(0);
  });

  it('installs licensed as a standalone executable if gem install failed', async () => {
    installers.gem.resolves(null);

    await run();
    expect(core.setFailed.callCount).toEqual(0);

    const setupCalls = getSetupInfoCalls();
    expect(setupCalls.length).toEqual(4);
    expect(setupCalls[0]).toEqual([`attempting to install licensed gem matching "${version}"`]);
    expect(setupCalls[1]).toEqual(['gem installation was not successful']);
    expect(setupCalls[2]).toEqual([`attempting to install licensed executable matching "${version}"`]);
    expect(setupCalls[3]).toEqual([`licensed (${version}) executable installed`]);

    expect(installers.gem.callCount).toEqual(1);

    expect(installers.exe.callCount).toEqual(1);
    expect(installers.exe.getCall(0).args).toEqual([version]);
  });

  it('sets a failure when installation raises an error', async () => {
    installers.gem.rejects(new Error('test failure'));

    await run();
    expect(core.setFailed.callCount).toEqual(1);
    expect(core.setFailed.getCall(0).args).toEqual(['test failure']);
  });

  it('sets a failure when installation fails', async () => {
    installers.gem.resolves(null);
    installers.exe.resolves(null);

    await run();
    expect(core.setFailed.callCount).toEqual(1);
    expect(core.setFailed.getCall(0).args).toEqual([`unable to install licensed matching "${version}"`]);
    const setupCalls = getSetupInfoCalls();
    expect(setupCalls.length).toEqual(4);
    expect(setupCalls[0]).toEqual([`attempting to install licensed gem matching "${version}"`]);
    expect(setupCalls[1]).toEqual(['gem installation was not successful']);
    expect(setupCalls[2]).toEqual([`attempting to install licensed executable matching "${version}"`]);
    expect(setupCalls[3]).toEqual(['exe installation was not successful']);
  });
});
