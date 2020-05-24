import usb from "usb";
import * as E from "fp-ts/lib/Either";
import * as TE from "fp-ts/lib/TaskEither";
import * as T from "fp-ts/lib/Task";
import * as O from "fp-ts/lib/Option";
import * as P from "fp-ts/lib/pipeable";

import { log } from "./log";

type PEither<Error, Result> = Promise<E.Either<Error, Result>>;

export const setConfiguration = (
  device: usb.Device,
  configuration: number
): TE.TaskEither<Error, void> => (): PEither<Error, void> =>
  new Promise((resolve) => {
    device.setConfiguration(configuration, (error) => {
      if (error) {
        resolve(E.left(new Error(error)));
      } else {
        resolve(E.right(undefined));
      }
    });
  });

export const controlTransfer = (
  device: usb.Device,
  bmRequestType: number,
  bRequest: number,
  wValue: number,
  wIndex: number,
  dataOrLength: Buffer | number
): TE.TaskEither<usb.LibUSBException, O.Option<Buffer>> => (): PEither<
  usb.LibUSBException,
  O.Option<Buffer>
> =>
  new Promise((resolve) => {
    // log("USB", "controlTransfer", bmRequestType, wValue);
    device.controlTransfer(
      bmRequestType,
      bRequest,
      wValue,
      wIndex,
      dataOrLength,
      (error, data) => {
        if (error) {
          log("USB", "controlTransfer: Error", error);
          resolve(E.left(error));
        } else {
          log("USB", "controlTransfer: Ok", data);
          resolve(E.right(O.fromNullable(data)));
        }
      }
    );
  });

const getStringDescriptor = (
  device: usb.Device,
  index: number
): TE.TaskEither<Error, O.Option<Buffer>> => (): PEither<
  Error,
  O.Option<Buffer>
> =>
  new Promise((resolve) => {
    device.getStringDescriptor(index, (error, buffer) => {
      if (error) {
        log("USB", "getStringDescriptor: Error", error);
        resolve(
          E.left(
            new Error(`Unable to get string descriptor ${index}: ${error}`)
          )
        );
      } else {
        resolve(E.right(O.fromNullable(buffer)));
      }
    });
  });

export enum TallyState {
  Off = "Off",
  Green = "Green",
  Red = "Red",
  GreenRed = "GreenRed",
}

export const setState = (
  device: usb.Device,
  state: TallyState
): TE.TaskEither<usb.LibUSBException, O.Option<Buffer>> => {
  let stateValue = 0;
  switch (state) {
    case TallyState.Green:
      stateValue = 1;
      break;
    case TallyState.Red:
      stateValue = 2;
      break;
    case TallyState.GreenRed:
      stateValue = 3;
      break;
  }
  return controlTransfer(device, 0x40, 0, stateValue, 0, Buffer.alloc(0));
};

export const getSerialNumber = (
  device: usb.Device
): TE.TaskEither<Error, O.Option<Buffer>> =>
  getStringDescriptor(device, device.deviceDescriptor.iSerialNumber);
