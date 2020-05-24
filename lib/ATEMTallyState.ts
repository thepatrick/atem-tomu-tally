import { Atem } from "atem-connection";
import { log } from "./log";
import { EventEmitter } from "eventemitter3";
import { TallyState } from "./usb";

export type ATEMTallyStateEvents = {
  changed: [TallyState];
  error: [Error];
};

export class ATEMTallyState extends EventEmitter<ATEMTallyStateEvents> {
  private isTallyLit = false;
  private atem: Atem;

  constructor(private readonly ip: string) {
    super();

    this.atem = new Atem();

    this.atem.connect(ip);

    this.atem.on("connected", this.updateIsTallyLit);
    this.atem.on("stateChanged", this.updateIsTallyLit);
    this.atem.on("disconnected", this.updateIsTallyLit);

    this.atem.on("error", (err) => {
      this.emit("error", new Error("ATEM error: " + err));
    });
  }

  updateIsTallyLit = (): void => {
    const newIsTallyLit = this.atem.listVisibleInputs("program").includes(1);
    if (newIsTallyLit !== this.isTallyLit) {
      log("Tally", "Change value to", newIsTallyLit, "from", this.isTallyLit);
      this.isTallyLit = newIsTallyLit;
      if (this.isTallyLit) {
        this.emit("changed", TallyState.Red);
      } else {
        this.emit("changed", TallyState.Off);
      }
    }
  };
}
