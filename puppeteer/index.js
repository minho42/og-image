import puppeteer from "puppeteer";
import Mustache from "mustache";
import slugify from "slugify";

function compileTemplate(template, templateData) {
  return Mustache.render(template, templateData);
}

async function generateImage(template, templateData, title) {
  try {
    // https://www.bannerbear.com/blog/ways-to-speed-up-puppeteer-screenshots/
    const minimal_args = [
      "--autoplay-policy=user-gesture-required",
      "--disable-background-networking",
      "--disable-background-timer-throttling",
      "--disable-backgrounding-occluded-windows",
      "--disable-breakpad",
      "--disable-client-side-phishing-detection",
      "--disable-component-update",
      "--disable-default-apps",
      "--disable-dev-shm-usage",
      "--disable-domain-reliability",
      "--disable-extensions",
      "--disable-features=AudioServiceOutOfProcess",
      "--disable-hang-monitor",
      "--disable-ipc-flooding-protection",
      "--disable-notifications",
      "--disable-offer-store-unmasked-wallet-cards",
      "--disable-popup-blocking",
      "--disable-print-preview",
      "--disable-prompt-on-repost",
      "--disable-renderer-backgrounding",
      "--disable-setuid-sandbox",
      "--disable-speech-api",
      "--disable-sync",
      "--hide-scrollbars",
      "--ignore-gpu-blacklist",
      "--metrics-recording-only",
      "--mute-audio",
      "--no-default-browser-check",
      "--no-first-run",
      "--no-pings",
      "--no-sandbox",
      "--no-zygote",
      "--password-store=basic",
      "--use-gl=swiftshader",
      "--use-mock-keychain",
    ];

    const browser = await puppeteer.launch({
      defaultViewport: {
        width: 600,
        height: 300,
      },
      userDataDir: "./userData",
      args: minimal_args,
    });

    const page = await browser.newPage();

    const html = compileTemplate(template, templateData);
    await page.setContent(html, { waitUntil: "domcontentloaded" });

    // https://github.blog/2021-06-22-framework-building-open-graph-images/#some-performance-gotchas
    // Wait until all images and fonts have loaded
    await page.evaluate(async () => {
      const selectors = Array.from(document.querySelectorAll("img"));
      await Promise.all([
        document.fonts.ready,
        ...selectors.map((img) => {
          // Image has already finished loading, let’s see if it worked
          if (img.complete) {
            // Image loaded and has presence
            if (img.naturalHeight !== 0) return;
            // Image failed, so it has no height
            throw new Error("Image failed to load");
          }
          // Image hasn’t loaded yet, added an event listener to know when it does
          return new Promise((resolve, reject) => {
            img.addEventListener("load", resolve);
            img.addEventListener("error", reject);
          });
        }),
      ]);
    });

    const screenshotBuffer = await page.screenshot({
      fullPage: false,
      type: "jpeg",
      quality: 90,
      path: `./${title}.jpeg`,
    });

    await browser.close();

    return screenshotBuffer;
  } catch (error) {
    console.error(error);
  }
}

const template = `
<html>
  <head>
    <title>Document</title>

    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
    <script src="https://cdn.tailwindcss.com"></script>
  </head>

  <style>
    body {
      font-family: 'Inter', sans-serif;
    }
  </style>

  <body>
    <div class="flex h-[300px] w-[600px] items-center justify-center bg-white text-4xl text-blue-600">
      {{title}}
    </div>
  </body>
</html>
`;

generateImage(template, { title: "og image with puppeteer" }, slugify("og image with puppeteer"));
