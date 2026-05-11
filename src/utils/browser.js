import puppeteer from "puppeteer";

let browser = null;

export const getBrowser = async () => {
  try {
    // recreate if disconnected
    if (!browser || !browser.isConnected()) {
      console.log("Launching new browser...");

      browser = await puppeteer.launch({
        headless: true,
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-gpu",
          "--no-zygote",
          "--single-process",
        ],
      });

      browser.on("disconnected", () => {
        console.log("Browser disconnected");
        browser = null;
      });
    }

    return browser;
  } catch (error) {
    console.error("Browser launch error:", error);

    browser = null;

    throw error;
  }
};
