import fs from "fs"
import path from "path"
import fastify from "fastify"
import fastifyStatic from "fastify-static"
import formBodyPlugin from "fastify-formbody"
import puppeteer from "puppeteer"

const app = fastify({ logger: false })
const root = path.dirname(new URL(
    import.meta.url).pathname)

app.register(fastifyStatic, {
    root: root,
    prefix: "/",
})
app.register(formBodyPlugin)

app.get("/", async (request, reply) => {
    const html = await fs.promises.readFile("index.html", "utf-8")
    reply.type("text/html")
    reply.code(200).send(html)
})

app.post("/test", async (request, reply) => {
    const args = await puppeteer.defaultArgs().filter(flag => flag !== '--enable-automation');
    const browser = await puppeteer.launch({
        headless: true,
        devtools: true,
        ignoreDefaultArgs: true,
        args
    });
    const page = await browser.newPage('');
    const client = await page.target().createCDPSession();
    await client.send('Audits.enable');
    let issues = [];
    client.on('Audits.issueAdded', (issue) =>{
      if (issue.issue.code === 'NavigatorUserAgentIssue') {
          //console.log(issue.issue.details);
          issues.push(issue);
      }
    });

    const url = JSON.parse(request.body)['url'];
    await page.goto(url);
    await page.waitForTimeout(5000);

    await page.close();
    await browser.close();
    reply.code(201).send(JSON.stringify(issues) + "\n")
})

app.listen(process.env.PORT, (err, address) => {
    if (err) {
        app.log.error(err)
        process.exit(1)
    }
    console.log(`Your app is listening on ${address}`)
    app.log.info(`server listening on ${address}`)
})
