export default function basicScrapper() {
  const playwrightModule = import("playwright");
  const randomUserAgentModule = import("random-useragent");
  const fsModule = import("fs");

  const baseURL = "https://youtube.com/";

  (async () => {
    const playwright = await playwrightModule;
    const randomUserAgent = await randomUserAgentModule;
    const fs = await fsModule;

    let agent = randomUserAgent.getRandom();

    const browser = await playwright.chromium.launch({ headless: true });
    const context = await browser.newContext({
      // userAgent: agent,
      locale: "en-GB",
      geolocation: {
        latitude: 51.57406087158946,
        longitude: -0.4012016835557369,
      },
      isMobile: false,
    });
    const page = await context.newPage();
    console.log("Created page");

    await page.setDefaultTimeout(30 * 1000);
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto(baseURL);

    console.log(`Went to ${baseURL}`);

    const returnToYoutubeButton = await page.locator("#return-to-youtube");
    if (await returnToYoutubeButton.isVisible()) {
      await returnToYoutubeButton.click();
      console.log("Return to youtube button clicked.");
    } else {
      console.log("Return to youtube button omitted.");
    }

    const consentButton = await page.locator(
      "button[aria-label='Reject the use of cookies and other data for the purposes described']"
    );

    await consentButton.waitFor({ state: "visible", timeout: 10000 });

    if (await consentButton.isVisible()) {
      await consentButton.click();
      console.log("Reject all cookies button clicked.");
    } else {
      console.log("Reject all cookies button omitted.");
    }

    console.log("Ready for scrapping");

    const videos = (
      await page.$$eval("div#content", (videoCards) => {
        return videoCards.map((videoCard) => {
          let link = videoCard.querySelector("a#thumbnail") as
            | HTMLAnchorElement
            | { href: string };
          if (!link) {
            link = { href: "Link error" };
            // return null;
          }

          let details = videoCard.querySelectorAll(
            "#details"
          )[0] as HTMLDivElement;
          if (!details) {
            // return "Details error";
            return null;
          }

          let title = details.querySelector("h3 > a") as
            | HTMLAnchorElement
            | { title: string };
          if (!title) {
            title = { title: "Title error" };
            // return null;
          }

          let metadata = details.querySelector("#metadata") as HTMLDivElement;
          if (!metadata) {
            // return "Metadata error";
            return null;
          }

          let authorName = metadata.querySelectorAll(
            "#container > #text-container"
          )[0] as HTMLAnchorElement | { innerText: string };
          if (!authorName) {
            authorName = { innerText: "AuthroName error" };
            // return null;
          }

          let [numberOfViews, timeOfPublishing] = metadata.querySelectorAll(
            "#metadata-line > span"
          ) as unknown as
            | HTMLSpanElement[]
            | { innerText: string; innerHTML?: string }[];
          if (!numberOfViews) {
            numberOfViews = { innerText: "NumOfViews error" };
            // return null;
          }

          return {
            link: link.href,
            title: title.title,
            authorName: authorName.innerText,
            numberOfViews: numberOfViews.innerText,
            timeOfPublishing: timeOfPublishing
              ? timeOfPublishing.innerHTML
              : "STREAM",
          };
        });
      })
    ).filter((video) => video !== null);

    console.log("Successfully scraped data");

    const dataWithTimeStamp = {
      timestamp: new Date().toISOString(),
      data: videos,
    };

    const logger = fs.createWriteStream("./youtube-scraper/data.json", {
      flags: "w",
    });

    logger.write(JSON.stringify(dataWithTimeStamp, null, " "));

    console.log("Successfully logged data");

    await page.pause();

    await browser.close();
  })().catch((error) => {
    console.log(error);
    process.exit(1);
  });
}
