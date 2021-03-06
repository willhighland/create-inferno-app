/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

/* @flow */

type InfernoFrame = {
  fileName: string | null,
  lineNumber: number | null,
  name: string | null,
};
const infernoFrameStack: Array<InfernoFrame[]> = [];

export type { InfernoFrame };

// This is a stripped down barebones version of this proposal:
// https://gist.github.com/sebmarkbage/bdefa100f19345229d526d0fdd22830f
// We're implementing just enough to get the invalid element type warnings
// to display the component stack in Inferno 15.6+:
// https://github.com/facebook/inferno/pull/9679
/// TODO: a more comprehensive implementation.

const registerInfernoStack = () => {
  if (typeof console !== 'undefined') {
    // $FlowFixMe
    console.infernoStack = frames => infernoFrameStack.push(frames);
    // $FlowFixMe
    console.infernoStackEnd = frames => infernoFrameStack.pop();
  }
};

const unregisterInfernoStack = () => {
  if (typeof console !== 'undefined') {
    // $FlowFixMe
    console.infernoStack = undefined;
    // $FlowFixMe
    console.infernoStackEnd = undefined;
  }
};

type ConsoleProxyCallback = (message: string, frames: InfernoFrame[]) => void;
const permanentRegister = function proxyConsole(
  type: string,
  callback: ConsoleProxyCallback
) {
  if (typeof console !== 'undefined') {
    const orig = console[type];
    if (typeof orig === 'function') {
      console[type] = function __stack_frame_overlay_proxy_console__() {
        try {
          const message = arguments[0];
          if (typeof message === 'string' && infernoFrameStack.length > 0) {
            callback(message, infernoFrameStack[infernoFrameStack.length - 1]);
          }
        } catch (err) {
          // Warnings must never crash. Rethrow with a clean stack.
          setTimeout(function() {
            throw err;
          });
        }
        return orig.apply(this, arguments);
      };
    }
  }
};

export { permanentRegister, registerInfernoStack, unregisterInfernoStack };
