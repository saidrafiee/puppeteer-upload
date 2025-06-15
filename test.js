const puppeteer = require("puppeteer");
const path = require("path");

(async () => {
  const videoPath = path.resolve(__dirname,  "foto/foto.y4m"); // pastikan output.y4m sudah ada

  const browser = await puppeteer.launch({
    headless: false,
    args: [
      "--use-fake-ui-for-media-stream",
      "--use-fake-device-for-media-stream",
      `--use-file-for-fake-video-capture=${videoPath}`,
    ],
  });

  const page = await browser.newPage();

  // buka file test-cam.html dari local disk
  const htmlPath = path.resolve(__dirname, "test-cam.html");
  await page.goto(
    `file:///D:/1.%20NGODING/10.%20Puppeteer/upload-asiap/test.html`
  );

  console.log("Jika fake camera bekerja, video akan tampil di halaman.");
})();

// ffmpeg -i test.mp4 -f yuv4mpegpipe -pix_fmt yuv420p test.y4m
