# GitHub Workflows

This directory contains GitHub Actions workflows for the Authsignal Node SDK.

## Release Process

The release process uses two workflows:

1. **Release Drafter**: Automatically creates and updates a draft release with categorized changes based on PR labels.
2. **Release Package**: Publishes the package to npm when a release is published on GitHub.

### How to make a release

1. All PRs should be labeled appropriately with one of:
   - `feature`, `enhancement`: For new features/enhancements
   - `fix`, `bugfix`, `bug`: For bug fixes
   - `chore`, `maintenance`: For maintenance tasks
   - `documentation`: For documentation updates
   - `dependencies`: For dependency updates
   - `major`, `breaking`: For breaking changes
   - `minor`: For minor feature additions
   - `patch`: For patch-level fixes

2. The Release Drafter will automatically create a draft release with all changes categorized by these labels.

3. To publish a new release:
   - Go to the "Releases" page in your GitHub repository
   - Edit the draft release created by Release Drafter
   - Update the release notes if needed
   - Click "Publish release"
   - The release workflow will automatically publish the package to npm

## Autolabeler

The Release Drafter includes an autolabeler that will automatically apply labels to PRs based on:
- Files changed (e.g., `.md` files get the `documentation` label)
- Branch names (e.g., branches with `/fix/` get the `bug` label)
- PR titles (e.g., titles containing "fix" get the `bug` label)

This helps ensure your PRs are properly categorized in release notes. 

## The complete flow is as follows:
- Release Drafter creates/updates a draft release as PRs are merged
- You review the draft release and publish it when ready
- The publish action triggers the package release workflow to npm