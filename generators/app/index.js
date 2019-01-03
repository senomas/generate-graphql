"use strict";
const Generator = require("yeoman-generator");
const chalk = require("chalk");
const yosay = require("yosay");
const yaml = require("js-yaml");
const fs = require("fs");
const path = require("path");
const changeCase = require("change-case");
const git = require("git-state");
const prettier = require("prettier");
const detectConflict = require("detect-conflict");
const typedError = require("error/typed");

const AbortedError = typedError({
  type: "AbortedError",
  message: "Process aborted by user"
});

const scalarType = ["String", "Int", "ID", "Boolean", "Float"];

function isScalarType(type) {
  return scalarType.indexOf(type) >= 0;
}

module.exports = class extends Generator {
  async prompting() {
    this.log(
      yosay(
        `Welcome to the fabulous ${chalk.red("generator-graphql")} generator!`
      )
    );
    if (!git.isGitSync(".")) {
      this.log(`Run "git init" first!`);
      process.exit(1);
    }
    this.branch = git.branchSync(".");
    let gco = this.spawnCommandSync("git", ["branch"], {
      stdio: "pipe"
    });
    if (gco.status !== 0) {
      this.log(
        `"git checkout scaffolding" failed\n${gco.stdout.toString()}${gco.stderr.toString()}`
      );
      process.exit(1);
    }
    const branches = gco.stdout
      .toString()
      .split("\n")
      .map(v => v.trim())
      .filter(v => v !== "");
    if (branches.indexOf("scaffolding") < 0) {
      gco = this.spawnCommandSync("git", ["branch", "scaffolding"], {
        stdio: "pipe"
      });
      if (gco.status !== 0) {
        this.log(
          `"git branch -m scaffolding" failed\n${gco.stdout.toString()}${gco.stderr.toString()}`
        );
        process.exit(1);
      }
    }
    gco = this.spawnCommandSync("git", ["checkout", "scaffolding"], {
      stdio: "pipe"
    });
    if (gco.status !== 0) {
      this.log(
        `"git checkout scaffolding" failed\n${gco.stdout.toString()}${gco.stderr.toString()}`
      );
      process.exit(1);
    }
    this.conflicter.force = true;
  }

  writing() {
    const models = [];
    const types = {};
    const modName = path.basename(path.resolve(".")).replace(/-graphql/g, "");
    const dirs = [`../${modName}-model/model`];
    if (!fs.existsSync(`../${modName}-model/model`)) {
      this.log(
        `Model [${
          this.appname
        }] [${modName}] '../${modName}-model/model' not found!`
      );
      process.exit(1);
    }
    do {
      const dir = dirs.shift();
      const files = fs.readdirSync(dir, { withFileTypes: true });
      files.forEach(file => {
        if (file.isFile()) {
          const fmod = yaml.safeLoad(
            fs.readFileSync(path.join(dir, file.name))
          );
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
          if (fmod.primary) {
            fmod.primary = fmod.primary.map(fn => {
              if (!fmod.fields[fn]) {
                throw new Error(`Field '${fn}' not exist`);
              }
              keyFields[fn] = fmod.fields[fn];
              return fmod.fields[fn];
            });
          } else {
            fmod.primary = [];
          }
          fmod.allKeyFields = Object.values(keyFields);
          fmod.fields = Object.entries(fmod.fields).map(k => {
            const f = k[1];
            f.id = k[0];
            if (!f.validations) {
              f.validations = {};
            }
            return f;
          });
          fmod.ID = changeCase.pascalCase(fmod.id);
          types[fmod.ID] = fmod;
          models.push(fmod);
        } else if (file.isDirectory()) {
          dirs.push(path.join(dir, file.name));
        }
      });
    } while (dirs.length > 0);
    models.forEach(model => {
      model.fields.forEach(field => {
        if (isScalarType(field.type)) {
          field.hasScalarType = true;
        } else {
          if (!types[field.type]) {
            this.log(
              `Unknown type ${model.id}.${field.type} ${JSON.stringify(
                modelMap,
                undefined,
                2
              )}`
            );
            process.exit(1);
          }
        }
      });
    });
    this.fs.copyTpl(
      this.templatePath("server.js"),
      this.destinationPath("server.js"),
      {
        appname: this.appname,
        user: this.user,
        models
      }
    );
    this.fs.write(
      this.destinationPath("server.js"),
      prettier.format(this.fs.read(this.destinationPath("server.js")), {
        parser: "babylon"
      })
    );
    this.fs.copyTpl(
      this.templatePath("lib.js"),
      this.destinationPath("lib.js"),
      {
        appname: this.appname,
        user: this.user,
        models
      }
    );
    this.fs.write(
      this.destinationPath("lib.js"),
      prettier.format(this.fs.read(this.destinationPath("lib.js")), {
        parser: "babylon"
      })
    );
    models.forEach(model => {
      this.fs.copyTpl(
        this.templatePath("type.js"),
        this.destinationPath(`${model.id}.js`),
        {
          appname: this.appname,
          user: this.user,
          model
        }
      );
      this.fs.write(
        this.destinationPath(`${model.id}.js`),
        prettier.format(this.fs.read(this.destinationPath(`${model.id}.js`)), {
          parser: "babylon"
        })
      );
    });
    models
      .filter(model => model.primary.length > 0)
      .forEach(model => {
        this.fs.copyTpl(
          this.templatePath("resolver.js"),
          this.destinationPath(`${model.id}-resolver.js`),
          {
            appname: this.appname,
            user: this.user,
            model
          }
        );
        this.fs.write(
          this.destinationPath(`${model.id}-resolver.js`),
          prettier.format(
            this.fs.read(this.destinationPath(`${model.id}-resolver.js`)),
            {
              parser: "babylon"
            }
          )
        );
      });
  }

  install() {
    // this.yarnInstall(["apollo-server", "graphql", "mongodb"]);
    let gco;
    const gc = git.checkSync();
    if (gc.dirty > 0 || gc.untracked > 0) {
      gco = this.spawnCommandSync("git", ["add", "."], {
        stdio: "pipe"
      });
      if (gco.status !== 0) {
        this.log(
          `"git add ." failed\n${gco.stdout.toString()}${gco.stderr.toString()}`
        );
        process.exit(1);
      }
      gco = this.spawnCommandSync("git", ["commit", "-m", "scaffolding"], {
        stdio: "pipe"
      });
      if (gco.status !== 0) {
        this.log(
          `"git co -m scaffolding" failed\n${gco.stdout.toString()}${gco.stderr.toString()}`
        );
        process.exit(1);
      }
    }
    gco = this.spawnCommandSync("git", ["checkout", this.branch], {
      stdio: "pipe"
    });
    if (gco.status !== 0) {
      this.log(
        `"git checkout ${this.branch}" failed\n${gco.stdout.toString()}${gco.stderr.toString()}`
      );
      process.exit(1);
    }
    gco = this.spawnCommandSync("git", ["merge", "scaffolding"], {
      stdio: "pipe"
    });
    if (gco.status !== 0) {
      this.log(
        `"git merge scaffolding" failed\n${gco.stdout.toString()}${gco.stderr.toString()}`
      );
      process.exit(1);
    }
  }
};
