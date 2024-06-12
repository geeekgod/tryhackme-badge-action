# TryHackMe Badge Action

This GitHub Action fetches your TryHackMe Badge and displays it in your repository's README. It also updates the badge if needed.

## Author

Rishabh Singh - [geeekgod](https://github.com/geeekgod)

## Description

This action fetches the badge from TryHackMe, saves it to a specified path, and commits it to your repository.

## Inputs

### `image_path`

**Required**: No

**Description**: Path to save the badge.

**Default**: `./assets/badge.png`

### `username`

**Required**: Yes

**Description**: Your TryHackMe username.

### `user_id`

**Required**: Yes

**Description**: Your TryHackMe user_id.

### `committer_username`

**Required**: No

**Description**: Your GitHub username for committing the badge.

**Default**: `geeekgod-thm-bot`

### `committer_email`

**Required**: No

**Description**: Your GitHub email for committing the badge.

**Default**: `risahbh@geeekgod.in`

### `commit_message`

**Required**: No

**Description**: Commit message for the badge update.

**Default**: `Updated THM profile badge`

### `GITHUB_TOKEN`

**Required**: Yes

**Description**: Your GitHub Token for authentication.

## Usage

To use this action, create a workflow file in your `.github/workflows` directory. Here's an example:

```yaml
name: Update TryHackMe Badge

on:
  schedule:
    - cron: '0 0 * * *' # Runs every day at midnight
  workflow_dispatch: # Allows manual triggering

jobs:
  update-badge:
    runs-on: ubuntu-latest

    steps:
    - name: Checkout repository
      uses: actions/checkout@v2

    - name: Fetch TryHackMe Badge
      uses: geeekgod/tryhackme-badge-action@v1.0.0
      with:
        image_path: './assets/badge.png'
        username: 'your_tryhackme_username'
        user_id: 'your_tryhackme_user_id'
        committer_username: 'your_github_username'
        committer_email: 'your_github_email'
        commit_message: 'Updated THM profile badge'
        GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
