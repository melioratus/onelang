const process = require("process");
const http = require("http");
const vm = require("vm");

function readRequestBody(request) {
    return new Promise((resolve, reject) => {
        let body = [];
        request.on('data', (chunk) => {
            body.push(chunk);
        }).on('end', () => {
            const bodyBuffer = Buffer.concat(body);
            resolve(bodyBuffer);
        });
    });
}

const server = http.createServer(async (request, response) => {
    response.setHeader("Access-Control-Allow-Origin", "http://localhost:8000");
    try {
        const requestText = (await readRequestBody(request)).toString();
        const requestJson = JSON.parse(requestText);
        console.log(request.url, requestJson);
        
        const startTime = process.hrtime();
        
        const script = new vm.Script(requestJson.code);
        const context = new vm.createContext();
        const result = script.runInContext(context);

        const elapsedTime = process.hrtime(startTime);
        const elapsedMs = elapsedTime[0] * 1000 + Math.round(elapsedTime[1] / 1e6);

        response.end(JSON.stringify({ result, elapsedMs }));
    } catch(e) {
        response.end(JSON.stringify({ exceptionText: e.toString() }));
    }
});

const port = process.argv.length > 2 ? parseInt(process.argv[2]) : 8002;
server.listen(port, (err) => {
    if (err)
        console.log('something bad happened', err);
    else
        console.log(`server is listening on ${port}`);
})