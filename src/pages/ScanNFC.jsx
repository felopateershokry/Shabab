import { useEffect } from "react";

export default function ScanNFC() {
  useEffect(() => {
    async function scan() {
      if ("NDEFReader" in window) {
        const reader = new NDEFReader();

        await reader.scan();

        reader.onreading = (event) => {
          const uid = event.serialNumber;

          console.log("Card UID:", uid);
        };
      } else {
        alert("NFC not supported");
      }
    }

    scan();
  }, []);

  return <h1>Scan NFC Card</h1>;
}
