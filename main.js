const fs = require("fs");
const path = require("path");
const cwd = process.cwd();
const JsBarcode = require('jsbarcode');
var { createCanvas } = require("canvas");
const { random } = require("./utils");
const cliProgress = require('cli-progress');
const clear = require('clear');
const dictionary = "Ice cream chocolate bar soufflé macaroon tiramisu cupcake chocolate bear claw brownie. Jujubes dessert apple pie carrot cake sesame snaps danish halvah. Bear claw candy tiramisu toffee muffin danish ice cream dragée chupa chups. Cake cake danish marzipan gummi bears sesame snaps sweet sesame snaps candy canes. Oat cake cake cake candy canes chupa chups tart chupa chups. Croissant cake croissant macaroon caramels pudding jelly-o chocolate bar. Cake dessert marshmallow gummi bears pastry sugar plum cake. Icing cupcake cupcake sugar plum croissant dragée marshmallow. Pastry sesame snaps candy pie dessert chocolate bar marzipan macaroon chocolate cake. Pie icing croissant bonbon fruitcake bear claw cotton candy sugar plum. Marshmallow soufflé fruitcake dragée cake pudding candy tiramisu. Brownie croissant soufflé powder jelly beans soufflé. Toffee biscuit liquorice icing cupcake icing. Chocolate bar cake jelly-o fruitcake cupcake powder fruitcake chocolate cake macaroon. Muffin toffee bear claw jelly beans cake biscuit marzipan gummi bears. Chocolate bar gummies dragée cake oat cake chupa chups. Marzipan dragée chupa chups pudding pudding powder cookie cake apple pie. Sesame snaps dessert toffee candy canes marshmallow lollipop. Jelly beans cake cookie jelly beans pudding powder. Fruitcake sesame snaps gingerbread shortbread topping pudding chocolate cake shortbread dragée. Sugar plum cookie croissant marzipan cake macaroon jelly beans lollipop bear claw. Chupa chups candy canes sugar plum sweet roll cake. Cake candy macaroon donut donut chocolate bar chocolate cake apple pie muffin. Marzipan apple pie sweet pie sesame snaps sugar plum biscuit marshmallow. Cake chupa chups macaroon pastry sweet roll tart marzipan cupcake sugar plum. Carrot cake chocolate caramels croissant marshmallow icing. Lemon drops wafer cake oat cake jelly. Liquorice cake icing liquorice shortbread cookie chocolate cake. Pie topping sesame snaps gummi bears pudding cupcake. Apple pie oat cake biscuit oat cake cheesecake tiramisu dessert gummies gingerbread. Chocolate donut wafer pie toffee. Chupa chups sweet cheesecake bear claw tart marshmallow cotton candy biscuit. Sweet roll soufflé donut jelly beans dessert shortbread. Danish halvah cotton candy bonbon jelly beans. Oat cake cheesecake tiramisu chupa chups shortbread icing chupa chups. Pie marzipan apple pie bonbon jelly lemon drops jelly beans sweet roll sweet roll. Cookie topping oat cake dragée gummies oat cake shortbread pudding. Jelly beans pie cupcake pudding dragée gummi bears cupcake jelly lemon drops. Sesame snaps lollipop biscuit bonbon cheesecake topping. Jelly gummies wafer tart chocolate cake. Chocolate pudding oat cake pudding chocolate bar chupa chups sugar plum jelly-o chupa chups. Cotton candy apple pie bear claw caramels tart pie tiramisu marzipan. Tart oat cake tart tootsie roll marzipan candy canes cupcake bonbon biscuit. Chocolate cake dessert liquorice chocolate bar liquorice. Sweet roll chocolate cake jelly tootsie roll biscuit chocolate cake tart. Tiramisu gingerbread jujubes candy caramels candy canes icing ice cream. Jelly-o tootsie roll bonbon sesame snaps tart tootsie roll muffin jelly. Shortbread liquorice chocolate pie danish. Cotton candy lollipop tart pie caramels icing jelly beans gummies. Lollipop lemon drops cake dessert powder candy lemon drops. Topping toffee dragée cake sesame snaps chocolate cake. Gingerbread wafer marshmallow gingerbread brownie. Dessert cotton candy dessert macaroon carrot cake toffee. Bonbon croissant fruitcake pastry sugar plum chupa chups marshmallow liquorice donut. Gingerbread liquorice tart marzipan donut bonbon. Wafer bonbon dragée tootsie roll soufflé macaroon jelly. Marshmallow jelly beans chocolate cake sugar plum cheesecake ice cream cake apple pie. Cupcake marzipan fruitcake jelly-o tootsie roll carrot cake pastry. Jujubes tart pie jelly beans jelly beans dessert candy. Halvah lollipop gummies donut caramels marshmallow cheesecake lemon drops tart. Cupcake fruitcake shortbread cotton candy gummi bears soufflé candy. Pie candy jelly-o icing candy canes lemon drops bear claw pie toffee. Pie bonbon sesame snaps jujubes powder. Lollipop carrot cake bonbon tootsie roll bear claw biscuit lemon drops.".replace(".", "").toLowerCase().split(" ");
const ITEM_COUNT = 100_000;
const items = [];

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
                barcode: canvas.toDataURL(),
                pricePerOZ: pricePerOz,
                OZ: oz,
            });
            bar.increment();
        }
        bar.stop();
        resolve();
    });

    console.log("🚀 Generating PDFs");
    const outDir = path.join(cwd, "output");
    if (fs.existsSync(outDir)){
        await fs.promises.rmdir(outDir, { recursive: true });
    }
    await fs.promises.mkdir(outDir);
    const pfds = [];
    const bar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
    bar.start(items.length, 0);
    const startTick = performance.now();
    for (let i = 0; i < items.length; i++){
        pfds.push(new Promise(async (resolve) => {
            bar.increment();
            resolve();
        }));
    }
    await Promise.all(pfds);
    const endTick = performance.now();
    bar.stop();
    console.log(`⏲ ${ITEM_COUNT} PDFs generated in ${(endTick - startTick) / 1000} seconds`);
})();