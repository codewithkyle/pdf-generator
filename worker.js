const { parentPort, workerData } = require('worker_threads');
const fs = require("fs");
const path = require("path");
const cwd = process.cwd();
const outDir = path.join(cwd, "output");

const { SOF, EOF } = workerData;

parentPort.addListener("message", async (item) => {
    try{
const priceData = Buffer.from(`9 0 obj
<< /Length 42 >>
stream
BT
/F2 112 Tf
25 15 Td
-5 Tc
(${item.price}) Tj
ET
endstream
endobj
`);
const barcodeData = Buffer.from(`10 0 obj
<< /ProcSet [/PDF /ImageB]
/XObject << /Im1 11 0 R >>
>>
endobj
11 0 obj
<< /Type /XObject
/Subtype /Image
/Width 242
/Height 142
/ColorSpace /DeviceGray
/BitsPerComponent 1
/Filter /ASCIIHexDecode
/Length ${Buffer.from(item.barcode).byteLength}
>>
stream
${item.barcode}
endstream
endobj
12 0 obj
<< /Length 36 >>
stream
q
100 0 0 59 150 180 cm
/Im1 Do
Q
endstream
endobj
`);
        const bufferArray = [SOF, priceData, barcodeData, EOF];
        await fs.promises.writeFile(path.join(outDir, `${item.UPC}.pdf`), Buffer.concat(bufferArray));
        parentPort.postMessage({
            type: "NEXT",
        });
    } catch (e) {
        parentPort.postMessage({
            type: "ERROR",
            data: e,
        });
    }
});

parentPort.postMessage({
    type: "READY",
});