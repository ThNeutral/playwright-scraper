export default function basicScrapper() {
  const playwrightModule = import("playwright");
  const randomUserAgentModule = import("random-useragent");
  const fsModule = import("fs");

  const baseURL = "https://github.com/topics/playwright";

  (async () => {
    const playwright = await playwrightModule;
    const randomUserAgent = await randomUserAgentModule;
    const fs = await fsModule;

    const agent = randomUserAgent.getRandom();

    const browser = await playwright.chromium.launch({ headless: true });
    const context = await browser.newContext({ userAgent: agent });
    const page = await context.newPage();
    console.log("Created page");

    await page.setDefaultTimeout(30 * 1000);
    await page.setViewportSize({ width: 800, height: 600 });
    await page.goto(baseURL);
    console.log(`Went to ${baseURL}`);

    const repos = await page.$$eval("article.border", (repoCards) => {
      return repoCards.map((repoCard) => {
        const [user, repo] = repoCard.querySelectorAll(
          "h3 a"
        ) as unknown as HTMLAnchorElement[];

        const formatText = (element: HTMLAnchorElement) =>
          element && element.innerText.trim();

        return {
          user: formatText(user),
          repo: formatText(repo),
          url: repo.href,
        };
      });
    });

    const dataWithTimeStamp = {
      timestamp: new Date().toISOString(),
      data: repos,
    };

    const logger = fs.createWriteStream("./basic-scraper/data.json", {
      flags: "w",
    });
    console.log("Writing data to file");
    logger.write(JSON.stringify(dataWithTimeStamp, null, " "));

    console.log("Finished task");
    await browser.close();
  })().catch((error) => {
    console.log(error);
    process.exit(1);
  });
}
