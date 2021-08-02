const { parentPort, workerData } = require('worker_threads');
const fs = require("fs");
const path = require("path");
const cwd = process.cwd();
const outDir = path.join(cwd, "output");
const JPEGEncoder = require("./lib/jpeg-encoder");

const { SOF, EOF } = workerData;
const encoder = new JPEGEncoder(100);

parentPort.addListener("message", async (item) => {
    try{
        const imageData = Buffer.from(encoder.encode(item.barcode, 100));
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
/ColorSpace /DeviceRGB
/BitsPerComponent 8
/Filter [/ASCIIHexDecode /DCTDecode]
/Length ${imageData.byteLength}
>>
stream
${imageData.toString("hex")}
endstream
endobj
12 0 obj
<< /Length 36 >>
stream
q
125 0 0 73 140 172 cm
/Im1 Do
Q
endstream
endobj
`);
const labelData = Buffer.from(`13 0 obj
<< /Length 42 >>
stream
BT
/F1 24 Tf
${(400 * 0.5) - (item.titleWidth * 0.5)} 145 Td
0 Tc
(${item.title}) Tj
ET
endstream
endobj
`);
        const bufferArray = [SOF, priceData, barcodeData, labelData, EOF];
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
