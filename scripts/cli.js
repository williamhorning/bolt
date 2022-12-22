import argvParse from "@williamhorning/arg-parse";
import { fork } from "child_process";
import { exit } from 'process'

let args = argvParse();

let cmd = args._.shift();

switch (cmd) {
	case "run": {
    runScript('app/index.js')
    break;
	}
  case "registerSlashCommands": {
    runScript("scripts/registerSlashCommands.js")
    break;
  }
  case "runDBMigration": {
    runScript("dbmigration/donotuse.js")
    break;
  }
  default: {
    console.log("bolt cli:")
    console.log("path/to/cli run - runs bolt")
    console.log("path/to/cli registerSlashCommands - registers Discord slash commands")
  }
}

function runScript(path) {
  fork(path, {
    stdio: "inherit",
  }).on("exit", exit)
}