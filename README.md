[![StepSecurity Maintained Action](https://raw.githubusercontent.com/step-security/maintained-actions-assets/main/assets/maintained-action-banner.png)](https://docs.stepsecurity.io/actions/stepsecurity-maintained-actions)

# setup-licensed

A GitHub Action to set up [licensee/licensed](https://github.com/licensee/licensed) for use in action workflows, at the specified `version` input and target platform.  The action will fail if licensed isn't available for the specified version and target platform.

## Installing licensed as a Ruby gem

Installing licensed as a Ruby gem requires an Actions environment that supports `gem install`.  The default system Ruby installation that is available in GitHub Actions runners does not support user-installed gems.  Please use [ruby/setup-ruby](https://github.com/ruby/setup-ruby) or a similar action in your workflow before using this action in order to install licensed as a Ruby gem.

## Installing licensed as an executable

**Licensed is not available as an executable for any version >= 4.0.  Please install licensed as a Ruby gem for these versions**

Licensed executables are provided for macOS and linux platforms.  When installing a licensed executable, this action will overwrite any version of the executable already installed at the `install-dir` input.

Installing licensed as an executable requires making API calls to GitHub which can be rate limited and significantly slow down a GitHub Action workflow run.  Rate limiting is more likely to happen when using `${{ secrets.GITHUB_TOKEN }}` for the `github_token` input or when leaving the `github_token` input empty.  If you are hitting frequent rate limiting and long action runtimes, please set `github_token` to a user PAT or install licensed as a Ruby gem.

## Usage

See [action.yml](action.yml)

list dependencies:

```yaml
steps:
- uses: actions/checkout@v6

# setup application environment
- uses: actions/setup-node@v6
- run: npm install # install dependencies in local environment

# setup ruby environment before running step-security/setup-licensed
- uses: ruby/setup-ruby@v1
  with:
    ruby-version: ruby

- uses: step-security/setup-licensed@v1
  with:
    version: '4.x' # required: supports matching based on string equivalence or node-semver range
    install-dir: /path/to/install/at # optional: defaults to /usr/local/bin
    github_token: # optional: allows users to make authenticated requests to GitHub's APIs

- run: licensed list
```

## License

The scripts and documentation in this project are released under the [MIT License](LICENSE)
