import usb from "usb";
import * as E from "fp-ts/lib/Either";
import * as TE from "fp-ts/lib/TaskEither";
import * as T from "fp-ts/lib/Task";
import * as O from "fp-ts/lib/Option";
import * as P from "fp-ts/lib/pipeable";
import { ATEMTallyState } from "./lib/ATEMTallyState";
import { log } from "./lib/log";
import {
  getSerialNumber,
  setConfiguration,
  setState,
  TallyState,
} from "./lib/usb";
import { flow } from "fp-ts/lib/function";

// usb.setDebugLevel(4);

const light = usb.findByIds(0x1209, 0x70b1);

if (!light) {
  log("USB", "No tally light found, bye");
  process.exit(1);
}

light.open(false);

(async (): Promise<void> => {
  P.pipe(
    getSerialNumber(light),
    TE.mapLeft((e) => {
      log("Error", "Failed to get serial", e);
      return e;
    })
  );

  const maybeGetSerial = await getSerialNumber(light)();
  if (E.isLeft(maybeGetSerial)) {
    log("Error", "Failed to get serial", maybeGetSerial.left);
    return;
  }

  const maybeSerial = maybeGetSerial.right;

  if (O.isNone(maybeSerial)) {
    log("USB", "Serial number empty, this seems... fishy.");
  } else {
    log("USB", "Serial number is", maybeSerial.value.toString());
  }

  const maybeSetConfiguration = await setConfiguration(light, 1)();
  if (E.isLeft(maybeSetConfiguration)) {
    log("Error", "Failed to set configuration", maybeSetConfiguration.left);
    return;
  }

  const first = await setState(light, TallyState.Off)();
  if (E.isLeft(first)) {
    log("Error", "Failed to set state", first.left);
    return;
  }
  log("Light", "Should now be off");

  const atem = new ATEMTallyState("10.2.9.166");

  atem.on("changed", (state) => {
    P.pipe(
      setState(light, state),
      TE.fold(
        (e) => {
          log("USB", "Error changing state: " + e);
          return TE.left(e);
        },
        () => {
          log("USB", "Changed state", state);
          return TE.right(undefined);
        }
      )
    )();
  });
})().catch((e) => log("Error", e));
