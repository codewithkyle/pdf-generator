const fs = require("fs");
const path = require("path");
const cwd = process.cwd();
const JsBarcode = require('jsbarcode');
var { createCanvas } = require("canvas");
const { random } = require("./utils");
const cliProgress = require('cli-progress');
const clear = require('clear');
const { Worker } = require('worker_threads');
const WebCPU = require('webcpu/dist/umd/webcpu').WebCPU;
const ascii85 = require('ascii85');

const dictionary = "Ice cream chocolate bar soufflé macaroon tiramisu cupcake chocolate bear claw brownie. Jujubes dessert apple pie carrot cake sesame snaps danish halvah. Bear claw candy tiramisu toffee muffin danish ice cream dragée chupa chups. Cake cake danish marzipan gummi bears sesame snaps sweet sesame snaps candy canes. Oat cake cake cake candy canes chupa chups tart chupa chups. Croissant cake croissant macaroon caramels pudding jelly-o chocolate bar. Cake dessert marshmallow gummi bears pastry sugar plum cake. Icing cupcake cupcake sugar plum croissant dragée marshmallow. Pastry sesame snaps candy pie dessert chocolate bar marzipan macaroon chocolate cake. Pie icing croissant bonbon fruitcake bear claw cotton candy sugar plum. Marshmallow soufflé fruitcake dragée cake pudding candy tiramisu. Brownie croissant soufflé powder jelly beans soufflé. Toffee biscuit liquorice icing cupcake icing. Chocolate bar cake jelly-o fruitcake cupcake powder fruitcake chocolate cake macaroon. Muffin toffee bear claw jelly beans cake biscuit marzipan gummi bears. Chocolate bar gummies dragée cake oat cake chupa chups. Marzipan dragée chupa chups pudding pudding powder cookie cake apple pie. Sesame snaps dessert toffee candy canes marshmallow lollipop. Jelly beans cake cookie jelly beans pudding powder. Fruitcake sesame snaps gingerbread shortbread topping pudding chocolate cake shortbread dragée. Sugar plum cookie croissant marzipan cake macaroon jelly beans lollipop bear claw. Chupa chups candy canes sugar plum sweet roll cake. Cake candy macaroon donut donut chocolate bar chocolate cake apple pie muffin. Marzipan apple pie sweet pie sesame snaps sugar plum biscuit marshmallow. Cake chupa chups macaroon pastry sweet roll tart marzipan cupcake sugar plum. Carrot cake chocolate caramels croissant marshmallow icing. Lemon drops wafer cake oat cake jelly. Liquorice cake icing liquorice shortbread cookie chocolate cake. Pie topping sesame snaps gummi bears pudding cupcake. Apple pie oat cake biscuit oat cake cheesecake tiramisu dessert gummies gingerbread. Chocolate donut wafer pie toffee. Chupa chups sweet cheesecake bear claw tart marshmallow cotton candy biscuit. Sweet roll soufflé donut jelly beans dessert shortbread. Danish halvah cotton candy bonbon jelly beans. Oat cake cheesecake tiramisu chupa chups shortbread icing chupa chups. Pie marzipan apple pie bonbon jelly lemon drops jelly beans sweet roll sweet roll. Cookie topping oat cake dragée gummies oat cake shortbread pudding. Jelly beans pie cupcake pudding dragée gummi bears cupcake jelly lemon drops. Sesame snaps lollipop biscuit bonbon cheesecake topping. Jelly gummies wafer tart chocolate cake. Chocolate pudding oat cake pudding chocolate bar chupa chups sugar plum jelly-o chupa chups. Cotton candy apple pie bear claw caramels tart pie tiramisu marzipan. Tart oat cake tart tootsie roll marzipan candy canes cupcake bonbon biscuit. Chocolate cake dessert liquorice chocolate bar liquorice. Sweet roll chocolate cake jelly tootsie roll biscuit chocolate cake tart. Tiramisu gingerbread jujubes candy caramels candy canes icing ice cream. Jelly-o tootsie roll bonbon sesame snaps tart tootsie roll muffin jelly. Shortbread liquorice chocolate pie danish. Cotton candy lollipop tart pie caramels icing jelly beans gummies. Lollipop lemon drops cake dessert powder candy lemon drops. Topping toffee dragée cake sesame snaps chocolate cake. Gingerbread wafer marshmallow gingerbread brownie. Dessert cotton candy dessert macaroon carrot cake toffee. Bonbon croissant fruitcake pastry sugar plum chupa chups marshmallow liquorice donut. Gingerbread liquorice tart marzipan donut bonbon. Wafer bonbon dragée tootsie roll soufflé macaroon jelly. Marshmallow jelly beans chocolate cake sugar plum cheesecake ice cream cake apple pie. Cupcake marzipan fruitcake jelly-o tootsie roll carrot cake pastry. Jujubes tart pie jelly beans jelly beans dessert candy. Halvah lollipop gummies donut caramels marshmallow cheesecake lemon drops tart. Cupcake fruitcake shortbread cotton candy gummi bears soufflé candy. Pie candy jelly-o icing candy canes lemon drops bear claw pie toffee. Pie bonbon sesame snaps jujubes powder. Lollipop carrot cake bonbon tootsie roll bear claw biscuit lemon drops.".replace(".", "").toLowerCase().split(" ");
const items = [];
const shell = fs.readFileSync(path.join(cwd, "shell.pdf"));

const ITEM_COUNT = 100;
let TOTAL_WORKER_COUNT;

(async () => {
    clear();    
    
    console.log("👨‍🌾 Seeding item data");
    await new Promise(async (resolve) => {
        const bar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
        bar.start(ITEM_COUNT, 0);
        for (var i = 0; i < ITEM_COUNT; i++) {
            const UPC = i.toString().padStart(11, "0");
            let title = [];
            for (let t = 0; t < random(1, 8); t++){
                title.push(dictionary[random(0, dictionary.length - 1)]);
            }
            const price = `${random(0, 9)}.${random(0, 99).toString().padEnd(2, "0")}`;
            const canvas = createCanvas();
            JsBarcode(canvas, UPC, {
                format: "upc"
            });
            const oz = random(1, 128);
            const pricePerOz = `${(parseFloat(price) / oz * 100).toFixed(2)}¢`;
            items.push({
                UPC: UPC,
                title: title.join(" "),
                price: price,
                barcode: ascii85.encode(Buffer.from(canvas.toDataURL("image/jpeg"), "base64")).toString(),
                pricePerOZ: pricePerOz,
                OZ: oz,
            });
            bar.increment();
        }
        bar.stop();
        resolve();
    });

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
    TOTAL_WORKER_COUNT = estimatedIdleCores;
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
        bar.start(ITEM_COUNT, 0);
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
// 22.77
// 20.52
// 9.80
// 6.80
// 6.1