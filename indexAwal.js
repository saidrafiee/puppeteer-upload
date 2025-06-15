const puppeteer = require("puppeteer");

const bukaBrowser = async () => {
  const browser = await puppeteer.launch({
    headless: false,
    args: [
      "--use-fake-ui-for-media-stream", // otomatis izinkan kamera/mic
      // '--use-fake-device-for-media-stream', // gunakan device dummy (optional)
      // '--enable-geolocation',               // aktifkan geolocation
    ],
  });
  const page = await browser.newPage();

  // Override permissions untuk kamera, mic, dan lokasi
  const context = browser.defaultBrowserContext();
  await context.overridePermissions("https://simpbb.bapenda.pekanbaru.go.id", [
    "geolocation",
    "microphone",
    "camera",
  ]);

  // Set lokasi (optional, sesuaikan koordinat jika perlu)
  // await page.setGeolocation({ latitude: 0.5071, longitude: 101.4478 });

  await page.goto("https://simpbb.bapenda.pekanbaru.go.id");

  console.log("Cookie sebelum perubahan:");
  let cookiesBefore = await page.cookies(
    "https://simpbb.bapenda.pekanbaru.go.id"
  );
  console.log(cookiesBefore);

  // Ganti/tambah 3 cookie sekaligus
  await page.setCookie(
    {
      name: "_identity",
      value:
        "750eae3d39abdbb5c78a5974c77ce812578ea1c618dd139a9bf870baec401d11a%3A2%3A%7Bi%3A0%3Bs%3A9%3A%22_identity%22%3Bi%3A1%3Bs%3A49%3A%22%5B%2242%22%2C%22Yzr-ZDjE1KHR0NCu43EuVPRAdRyBhLhG%22%2C2592000%5D%22%3B%7D",
      domain: "simpbb.bapenda.pekanbaru.go.id",
      path: "/",
      httpOnly: false,
      secure: false,
    },
    {
      name: "PHPSESSID",
      value: "mpg5k6t43plmm6stndteqigct6",
      domain: "simpbb.bapenda.pekanbaru.go.id",
      path: "/",
      httpOnly: false,
      secure: false,
    },
    {
      name: "token",
      value:
        "7ecbc968cdce05d8e9a6058fe5e29bc09de49d805625a6be44edd2c72363cc67a%3A2%3A%7Bi%3A0%3Bs%3A5%3A%22token%22%3Bi%3A1%3Bs%3A32%3A%22KC3EDBdUsT66Wolok-IlDh4tTm6qkWTK%22%3B%7D%3A2%3A%7Bi%3A0%3Bs%3A5%3A%22token%22%3Bi%3A1%3Bs%3A32%3A%22rQAzV-oZa1r-HrdGy2vENFGOY3qSTu-1%22%3B%7D",
      domain: "simpbb.bapenda.pekanbaru.go.id",
      path: "/",
      httpOnly: false,
      secure: false,
    }
  );

  // Refresh supaya cookie baru diterapkan
  await page.reload();

  console.log("Cookie setelah perubahan dan refresh:");
  let cookiesAfter = await page.cookies(
    "https://simpbb.bapenda.pekanbaru.go.id"
  );
  console.log(cookiesAfter);

  // Tunggu dan klik element petugas SDT
  await page.waitForSelector("#sidebar-left > ul > li:nth-child(2) > a", {
    visible: true,
  });

  await new Promise((resolve) => setTimeout(resolve, 2000));
  await page.click("#sidebar-left > ul > li:nth-child(2) > a");

  // tunggu dan klik link detail SDT yang dipilih
  await page.waitForSelector(
    "#w0-container > table > tbody > tr:nth-child(1) > td:nth-child(9) > a",
    {
      visible: true,
    }
  );
  await new Promise((resolve) => setTimeout(resolve, 1000));
  await page.click(
    "#w0-container > table > tbody > tr:nth-child(1) > td:nth-child(9) > a"
  );

  //Fungsi untuk mulai input///////////////////////////////////////////////////////////////////////

  // Fungsi reusable untuk search, input, dan submit
  async function isiFormulirDanSubmit(page) {
    // 1. Kembali ke halaman utama (jika perlu)
    // await page.goto(
    //   "https://simpbb.bapenda.pekanbaru.go.id/bo/petugassdt/detail?id=3375"
    // );

    // 2. Tunggu search bar dan ketik nama SDT
    await page.waitForSelector("#w0-filters > td:nth-child(3) > input", {
      visible: true,
    });
    await page.type(
      "#w0-filters > td:nth-child(3) > input",
      "147114000200700380"
    );
    await page.keyboard.press("Enter");

    // 3. Tunggu hasil muncul dan klik detail
    await page.waitForSelector(
      "#w0-container > table > tbody > tr:nth-child(1) > td:nth-child(2) > button",
      { visible: true }
    );
    await page.click(
      "#w0-container > table > tbody > tr:nth-child(1) > td:nth-child(2) > button"
    );

    await new Promise((resolve) => setTimeout(resolve, 2000));

    await page.select("#STATUS_PENYAMPAIAN", "1");

    await new Promise((resolve) => setTimeout(resolve, 1000));

    await page.evaluate(() => {
      const el = document.querySelector("#KOORDINAT_OP");
      if (el) {
        el.removeAttribute("readonly");
      }
    });
    
    // Generate koordinat acak dalam range              ===========JANGAN LUPA GANTI KOORDINAT===========
    const randomLatitude = (Math.random() * (0.6 - 0.5) + 0.5).toFixed(6);
    const randomLongitude = (Math.random() * (101.5 - 101.4) + 101.4).toFixed(
      6
    );

    const koordinat = `${randomLatitude},${randomLongitude}`;

    await page.type("#KOORDINAT_OP", koordinat);
  }

  isiFormulirDanSubmit(page);
};

bukaBrowser();
