import * as E from "fp-ts/lib/Either";
import * as TE from "fp-ts/lib/TaskEither";
import * as T from "fp-ts/lib/Task";
import * as O from "fp-ts/lib/Option";
import * as P from "fp-ts/lib/pipeable";

import { log } from "./log";
import { Atem } from "atem-connection";
import { PEither } from "./PEither";

export const getAtem = (ip: string): TE.TaskEither<Error, Atem> => (): PEither<
  Error,
  Atem
> =>
  new Promise((resolve) => {
    const atem = new Atem();

    atem.connect(ip);

    atem.once("connected", () => {
      resolve(E.right(atem));
    });

    atem.once("error", (error) =>
      resolve(
        E.left(
          new Error(
            "Unable to connect to ATEM at " + ip + ", because: " + error
          )
        )
      )
    );
  });
