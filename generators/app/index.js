"use strict";
const Generator = require("yeoman-generator");
const chalk = require("chalk");
const yosay = require("yosay");
const yaml = require("js-yaml");
const fs = require("fs");
const path = require("path");
const changeCase = require("change-case");
const git = require("git-state");

module.exports = class extends Generator {
  async prompting() {
    // Have Yeoman greet the user.
    this.log(
      yosay(
        `Welcome to the fabulous ${chalk.red("generator-graphql")} generator!`
      )
    );
    if (!git.isGitSync(".")) {
      this.log(`Run "git init" first!`);
      process.exit(1);
    }
    const gitState = git.checkSync(".");
    if (gitState.dirty > 0) {
      const answers = await this.prompt([{
        type    : 'confirm',
        name    : 'dirty',
        message : `Git ${gitState.dirty} dirty ${gitState.dirty > 1 ? "files" : "file"}, are you sure to run without git commit first`,
        default: false
      }]);
      if (!answers.dirty) {
        process.exit(1);
      }
    }
    if (gitState.untracked > 0) {
      const answers = await this.prompt([{
        type    : 'confirm',
        name    : 'untracked',
        message : `Git ${gitState.untracked} untracked ${gitState.untracked > 1 ? "files" : "file"}, are you sure to run without git add and commit first`,
        default: false
      }]);
      if (!answers.untracked) {
        process.exit(1);
      }
    }
  }

  writing() {
    const models = [];
    const dirs = [`../${this.appname}-model/model`];
    do {
      const dir = dirs.shift();
      const files = fs.readdirSync(dir, { withFileTypes: true });
      files.forEach(file => {
        if (file.isFile()) {
          const fmod = yaml.safeLoad(
            fs.readFileSync(path.join(dir, file.name))
          );
          fmod.primary = fmod.primary.map(fn => {
            if (!fmod.fields[fn]) {
              throw new Error(`Field '${fn}' not exist`);
            }
            return fmod.fields[fn];
          });
          const keyFields = {};
          if (fmod.keys) {
            Object.entries(fmod.keys).forEach(k => {
              k[1].fields.forEach(fn => {
                if (!fmod.fields[fn]) {
                  throw new Error(`Field '${fn}' not exist`);
                }
                keyFields[fn] = fmod.fields[fn];
              });
            });
          }
          fmod.keyFields = Object.values(keyFields);
          fmod.fields = Object.entries(fmod.fields).map(k => {
            k[1].id = k[0];
            return k[1];
          });
          fmod.ID = changeCase.pascalCase(fmod.id);
          models.push(fmod);
        } else if (file.isDirectory()) {
          dirs.push(path.join(dir, file.name));
        }
      });
    } while (dirs.length > 0);
    this.fs.copyTpl(
      this.templatePath("server.js"),
      this.destinationPath("server.js"),
      {
        appname: this.appname,
        user: this.user,
        models
      }
    );
  }

  // install() {
  //   this.yarnInstall(["apollo-server", "graphql", "graphql-mongodb-projection", "mongodb"]);
  // }
};
