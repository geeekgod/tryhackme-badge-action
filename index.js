const { spawn } = require("child_process");
const axios = require("axios");
const core = require("@actions/core");
const fs = require("fs");

const GITHUB_TOKEN = core.getInput("GITHUB_TOKEN");
const FILEPATH = core.getInput("image_path") || "./assets/badge.png";
const THM_USERNAME = core.getInput("username") || "geeekgod";
const THM_USER_ID = core.getInput("user_id") || "1000000";

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

const updateBadge = async (userId) => {
  try {
    const res = await axios.get(`https://tryhackme.com/badge/regen/${userId}`);
    if (res.status >= 400) {
      throw new Error("Badge update failed");
    }
  } catch (error) {
    console.error("Error during badge update:", error);
    core.setFailed(`Action failed with error ${error.message}`);
  }
};

const dlImg = async (githubToken, filePath, username) => {
  await updateBadge(THM_USER_ID);
  try {
    const url = `https://tryhackme-badges.s3.amazonaws.com/${username}.png`;
    const path = filePath;
    const committerUsername = core.getInput("committer_username");
    const committerEmail = core.getInput("committer_email");
    const commitMessage = core.getInput("commit_message");

    const res = await axios({
      url,
      method: "GET",
      responseType: "stream",
    });

    const fileStream = fs.createWriteStream(path);
    await new Promise((resolve, reject) => {
      res.data.pipe(fileStream);
      res.data.on("error", reject);
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

dlImg(GITHUB_TOKEN, FILEPATH, THM_USERNAME);
