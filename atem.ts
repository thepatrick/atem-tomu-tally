import { Atem } from "atem-connection";
import { log } from "./lib/log";

const myAtem = new Atem({
  // debug: true,
  // externalLog: log.bind(undefined, "ATEM"),
});

myAtem.connect("10.2.9.166");

myAtem.on("error", (str) => {
  log("myAtem:error", str);
});

myAtem.on("debug", (debug) => log("Atem:debug", debug));

myAtem.on("receivedCommands", (cmds) => {
  for (const cmd of cmds) {
    // if (cmd instanceof TallyBySourceCommand) {
    //   log(
    //     "myAtem",
    //     "TallyBySourceCommand says input 1 is active:",
    //     cmd.properties //[1]?.program
    //   );
    // } else {
    log("myAtem", "receivedCommand", cmd);
    // }
  }
});
