let ndef = null;
let isRunning = false;
let callback = null;

export const startNFC = async (onRead) => {
  if (!("NDEFReader" in window)) {
    throw new Error("NFC not supported");
  }

  // stop old session logically
  stopNFC();

  callback = onRead;

  ndef = new window.NDEFReader();
  await ndef.scan();

  isRunning = true;

  ndef.onreading = (event) => {
    const uid = event.serialNumber;
    callback?.(uid);
  };

  ndef.onreadingerror = () => {
    console.error("NFC read error");
  };
};

export const stopNFC = () => {
  isRunning = false;
  ndef = null;
  callback = null;
};
