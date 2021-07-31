const { parentPort, workerData } = require('worker_threads');
const fs = require("fs");
const path = require("path");
const cwd = process.cwd();
const outDir = path.join(cwd, "output");

const { SOF, EOF } = workerData;

parentPort.addListener("message", async (item) => {
    try{
        const data = Buffer.from(`9 0 obj
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
        const bufferArray = [SOF, data, EOF];
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