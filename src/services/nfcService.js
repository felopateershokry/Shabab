let ndef = null;
let active = false;
let callback = null;

let lastUid = "";
let lastTime = 0;

export const startNFC = async (onRead) => {
  if (!("NDEFReader" in window)) {
    throw new Error("NFC not supported");
  }

  // اقفل أي session قديم قبل ما تبدأ جديد
  stopNFC();

  callback = onRead;
  active = true;

  ndef = new window.NDEFReader();
  await ndef.scan();

  ndef.onreading = (event) => {
    if (!active) return;

    const uid = event.serialNumber;
    const now = Date.now();

    // منع التكرار (debounce عالمي)
    if (uid === lastUid && now - lastTime < 1200) {
      return;
    }

    lastUid = uid;
    lastTime = now;

    callback?.(uid);
  };

  ndef.onreadingerror = () => {
    console.error("NFC read error");
  };
};

export const stopNFC = () => {
  active = false;
  callback = null;

  lastUid = "";
  lastTime = 0;

  if (ndef) {
    try {
      ndef.onreading = null;
      ndef.onreadingerror = null;
    } catch (e) {}
  }

  ndef = null;
};
