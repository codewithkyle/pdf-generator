const fs = require("fs");
const path = require("path");
const cwd = process.cwd();
const cliProgress = require('cli-progress');
const clear = require('clear');
const { Worker } = require('worker_threads');
const WebCPU = require('webcpu/dist/umd/webcpu').WebCPU;
const farmer = require("./seed");

const shell = fs.readFileSync(path.join(cwd, "shell.pdf"));

const ITEM_COUNT = 100;

(async () => {
    clear();    
    
    const items = await farmer(ITEM_COUNT);

    console.log("📦 Preparing output directory");
    const outDir = path.join(cwd, "output");
    if (fs.existsSync(outDir)){
        await fs.promises.rmdir(outDir, { recursive: true });
    }
    await fs.promises.mkdir(outDir);
    const index = shell.indexOf("trailer");
    const startOfFile = shell.slice(0, index);
    const endOfFile = shell.slice(index);
    const workerPool = [];
    const { reportedCores, estimatedIdleCores, estimatedPhysicalCores } = await WebCPU.detectCPU();
    let TOTAL_WORKER_COUNT = estimatedIdleCores;
    if (TOTAL_WORKER_COUNT > items.length){
        TOTAL_WORKER_COUNT = items.length;
    }
    let startTick;
    await new Promise(async (resolveGenerator) => {
        const workerPromises = [];
        let finishedWorkers = 0;
        const bar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
        console.log("🧵 Spawning worker threads");
        for (let i = 0; i < TOTAL_WORKER_COUNT; i++){
            workerPromises.push(new Promise((resolveWorker) => {
                const worker = new Worker(path.join(cwd, "worker.js"), {
                    workerData: {
                        SOF: startOfFile,
                        EOF: endOfFile,
                    },
                });
                worker.on('message', ({ type, data }) => {
                    switch(type){
                        case "READY":
                            resolveWorker();
                            break;
                        case "ERROR":
                            console.log(data);
                            process.exit(1);
                        case "NEXT":
                            if (items.length){
                                worker.postMessage(items.pop());
                                bar.increment();
                            } else {
                                finishedWorkers++;
                                if (finishedWorkers === workerPool.length){
                                    bar.stop();
                                    resolveGenerator();
                                }
                            }
                            break;
                        default:
                            break;
                    }
                });
                workerPool.push(worker);
            }));
        }
        await Promise.all(workerPromises);
        console.log("🚀 Generating PDFs");
        bar.start(items.length, 0);
        startTick = Date.now();
        for (let i = 0; i < workerPool.length; i++){
            workerPool[i].postMessage(items.pop());
        }
    });
    const endTick = Date.now();
    console.log(`⌚ ${ITEM_COUNT} PDFs generated in ${(endTick - startTick) / 1000} seconds`);
    for (const worker of workerPool){
        worker.terminate();
    }
})();
// HOME PC
// 22.77
// 20.52
// 9.80
// 6.80
// 6.1

// WORK PC
// 24.97
// 25.0
// 25.2
