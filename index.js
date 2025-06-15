const puppeteer = require("puppeteer");
const fs = require("fs").promises;

const bukaBrowser = async () => {
  // Load data dari nop.json
  const data = await fs.readFile("nop.json", "utf8");
  const daftarNop = JSON.parse(data);

  const browser = await puppeteer.launch({
    headless: false,
    args: ["--use-fake-ui-for-media-stream"],
  });

  const page = await browser.newPage();

  const context = browser.defaultBrowserContext();
  await context.overridePermissions("https://simpbb.bapenda.pekanbaru.go.id", [
    "geolocation",
    "microphone",
    "camera",
  ]);

  await page.goto("https://simpbb.bapenda.pekanbaru.go.id");

  // Set Cookie
  await page.setCookie(
    {
      name: "_identity",
      value:
        "750eae3d39abdbb5c78a5974c77ce812578ea1c618dd139a9bf870baec401d11a%3A2%3A%7Bi%3A0%3Bs%3A9%3A%22_identity%22%3Bi%3A1%3Bs%3A49%3A%22%5B%2242%22%2C%22Yzr-ZDjE1KHR0NCu43EuVPRAdRyBhLhG%22%2C2592000%5D%22%3B%7D",
      domain: "simpbb.bapenda.pekanbaru.go.id",
      path: "/",
    },
    {
      name: "PHPSESSID",
      value: "n0iqf55embl4n56omjtu5okc2o",
      domain: "simpbb.bapenda.pekanbaru.go.id",
      path: "/",
    },
    {
      name: "token",
      value:
        "636888d565914cb186d5549b1c225d5df0549f48e457d7fa7d26e65a81ac1b3ca%3A2%3A%7Bi%3A0%3Bs%3A5%3A%22token%22%3Bi%3A1%3Bs%3A32%3A%22ptTvGOU9phi6mjSqputTcynfagaeq2-K%22%3B%7D",
      domain: "simpbb.bapenda.pekanbaru.go.id",
      path: "/",
    }
  );

  await page.reload();

  //   // Navigasi ke halaman detail SDT
  //   await page.waitForSelector("#sidebar-left > ul > li:nth-child(2) > a", {
  //     visible: true,
  //   });
  //   await new Promise((resolve) => setTimeout(resolve, 2000));
  //   await page.click("#sidebar-left > ul > li:nth-child(2) > a");

  //   await page.waitForSelector(
  //     "#w0-container > table > tbody > tr:nth-child(1) > td:nth-child(9) > a",
  //     { visible: true }
  //   );
  //   await new Promise((resolve) => setTimeout(resolve, 1000));
  //   //SESUAIKAN TOMBOL DETAIL SDT YANG DITUJU
  //   await page.click(
  //     "#w0-container > table > tbody > tr:nth-child(1) > td:nth-child(9) > a"
  //   );

  ////////////////////////// SESUAIKAN LINK SDT YANG INGIN DI INPUT //////////////////////////
  await page.goto(
    "https://simpbb.bapenda.pekanbaru.go.id/bo/petugassdt/detail?id=3375"
  );
  await new Promise((resolve) => setTimeout(resolve, 2000));

  // Jalankan fungsi isiFormulirDanSubmit untuk setiap NOP
  for (const entry of daftarNop) {
    console.log(`Memproses NOP: ${entry.nop} (${entry.nama})`);
    await isiFormulirDanSubmit(page, entry.nop, entry.nama, entry.hp, entry.ket);
    await new Promise((resolve) => setTimeout(resolve, 3000)); // jeda antar input
  }

  console.log("Selesai memproses semua NOP.");
  // await browser.close(); // Uncomment kalau mau otomatis tutup
};

// Ubah fungsi jadi menerima parameter NOP
async function isiFormulirDanSubmit(page, nop, nama, hp, ket) {
  await page.waitForSelector("#w0-filters > td:nth-child(3) > input", {
    visible: true,
  });

  // Kosongkan field dulu (penting kalau ada sisa input sebelumnya)
  await page.click("#w0-filters > td:nth-child(3) > input", { clickCount: 3 });
  await page.keyboard.press("Backspace");

  await page.type("#w0-filters > td:nth-child(3) > input", nop);
  await page.keyboard.press("Enter");

  await new Promise((resolve) => setTimeout(resolve, 2000));

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
  ///////////////////////////// SESUAIKAN KOORDINAT /////////////////////////////
  const randomLatitude = (Math.random() * (0.6 - 0.5) + 0.5).toFixed(6);
  const randomLongitude = (Math.random() * (101.5 - 101.4) + 101.4).toFixed(6);
  const koordinat = `${randomLatitude},${randomLongitude}`;

//   const randomLatitude = (Math.random() * (0.4867 - 0.4860) + 0.4860).toFixed(14);
//   const randomLongitude = (Math.random() * (101.4896 - 101.4903) + 101.4903).toFixed(14);
//   const koordinat = `${randomLatitude},${randomLongitude}`;
  
//   console.log(koordinat)

  await page.click("#KOORDINAT_OP", { clickCount: 3 });
  await page.keyboard.press("Backspace");
  await page.type("#KOORDINAT_OP", koordinat);

  await page.click("#NAMA_PENERIMA", { clickCount: 3 });
  await page.keyboard.press("Backspace");
  await page.type("#NAMA_PENERIMA", nama);

  await page.click("#HP_PENERIMA", {clickCount: 3});
  await page.keyboard.press("Backspace")
  await page.type("#HP_PENERIMA", hp)
  
  await page.click("#KETERANGAN_PETUGAS", {clickCount: 3});
  await page.keyboard.press("Backspace")
  await page.type("#KETERANGAN_PETUGAS", ket)

  //TESTING, KLIK KELUAR
  await new Promise((resolve) => setTimeout(resolve, 2000));
  await page.click(
    "#w4 > div > div.row > div > div.form-group.text-right > button.btn.btn-sm.btn-danger"
  );
}

bukaBrowser();
