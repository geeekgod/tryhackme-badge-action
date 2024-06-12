const { spawn } = require("child_process");
const fetch = require("node-fetch");
const core = require("@actions/core");
const github = require("@actions/github");
const fs = require("fs");

const GITHUB_TOKEN = core.getInput("GITHUB_TOKEN");
const FILEPATH = core.getInput("image_path");
const THM_USERNAME = core.getInput("username");

/*
 * Executes a command and returns its result as promise
 * @param cmd {string} command to execute
 * @param args {array} command line args
 * @param options {Object} extra options
 * @return {Promise<Object>}
 */
const exec = (cmd, args = [], options = {}) =>
  new Promise((resolve, reject) => {
    let outputData = "";
    const optionsToCLI = {
      ...options,
      stdio: ["inherit", "pipe", "pipe"],
    };

    const app = spawn(cmd, args, optionsToCLI);

    if (app.stdout) {
      app.stdout.on("data", function (data) {
        outputData += data.toString();
      });
    }

    if (app.stderr) {
      app.stderr.on("data", function (data) {
        outputData += data.toString();
      });
    }

    app.on("close", (code) => {
      if (code !== 0) {
        return reject({ code, outputData });
      }
      return resolve({ code, outputData });
    });

    app.on("error", () => reject({ code: 1, outputData }));
  });

core.setSecret(GITHUB_TOKEN);

const dlImg = async (githubToken, filePath, username) => {
  try {
    const url = `https://tryhackme-badges.s3.amazonaws.com/${username}.png`;
    const path = filePath;
    const committerUsername = core.getInput("committer_username");
    const committerEmail = core.getInput("committer_email");
    const commitMessage = core.getInput("commit_message");

    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to fetch image: ${res.statusText}`);

    const fileStream = fs.createWriteStream(path);
    await new Promise((resolve, reject) => {
      res.body.pipe(fileStream);
      res.body.on("error", reject);
      fileStream.on("finish", resolve);
    });

    await exec("git", ["config", "--global", "user.email", committerEmail]);
    await exec("git", ["config", "--global", "user.name", committerUsername]);
    if (githubToken) {
      await exec("git", [
        "remote",
        "set-url",
        "origin",
        `https://${githubToken}@github.com/${process.env.GITHUB_REPOSITORY}.git`,
      ]);
    }

    await exec("git", ["add", filePath]);
    await exec("git", ["commit", "-m", commitMessage]);
    await exec("git", ["push"]);
  } catch (error) {
    console.error("Error during image download or git operations:", error);
    core.setFailed(`Action failed with error ${error.message}`);
  }
};

dlImg(GITHUB_TOKEN, FILEPATH, THM_USERNAME).catch((error) => {
  console.log("nothing to commit");
});
