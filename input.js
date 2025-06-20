require("dotenv").config();
const puppeteer = require("puppeteer");
const fs = require("fs").promises;
const path = require("path");

const bukaBrowser = async () => {
  const videoPath = path.resolve(__dirname, "foto", "sahara.y4m"); // pastikan output.y4m sudah ada
  // Load data dari nop.json
  const data = await fs.readFile("nop.json", "utf8");
  const daftarNop = JSON.parse(data);

  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    args: [
      "--use-fake-ui-for-media-stream",
      "--use-fake-device-for-media-stream",
      `--use-file-for-fake-video-capture=${videoPath}`,
    ],
  });

  const page = await browser.newPage();

  const context = browser.defaultBrowserContext();
  await context.overridePermissions("https://simpbb.bapenda.pekanbaru.go.id", [
    "microphone",
    "camera",
  ]);

  await page.goto("https://simpbb.bapenda.pekanbaru.go.id");

  // Set Cookie
  await page.setCookie(
    {
      name: "_identity",
      value: process.env.IDENTITY_COOKIE,
      domain: "simpbb.bapenda.pekanbaru.go.id",
      path: "/",
    },
    {
      name: "PHPSESSID",
      value: process.env.PHPSESSID_COOKIE,
      domain: "simpbb.bapenda.pekanbaru.go.id",
      path: "/",
    },
    {
      name: "token",
      value: process.env.TOKEN_COOKIE,
      domain: "simpbb.bapenda.pekanbaru.go.id",
      path: "/",
    }
  );

  await page.reload();

  ////////////////////////// SESUAIKAN LINK SDT YANG INGIN DI INPUT //////////////////////////
  const sdt =
    "https://simpbb.bapenda.pekanbaru.go.id/bo/petugassdt/detail?id=3362&page=1";
  await page.goto(sdt);
  await new Promise((resolve) => setTimeout(resolve, 2000));

  // Jalankan fungsi isiFormulirDanSubmit untuk setiap NOP
  for (const entry of daftarNop) {
    console.log(`Memproses NOP: ${entry.nop} (${entry.nama})`);
    try {
      await isiFormulirDanSubmit(
        page,
        entry.nop,
        entry.nama,
        entry.hp,
        entry.ket
      );
    } catch (error) {
      console.error(
        `❌ Error saat memproses NOP ${entry.nop}: ${error.message}`
      );
    }
    await new Promise((resolve) => setTimeout(resolve, 3000)); // jeda antar input
  }

  console.log("Selesai memproses semua NOP.");
  // await browser.close(); // Uncomment kalau mau otomatis tutup
};

// Fungsi isi formulir dengan pengecekan tombol tersedia atau tidak
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

  // Cek apakah tombol detail tersedia
  const tombolDetail = await page.$(
    "#w0-container > table > tbody > tr:nth-child(1) > td:nth-child(2) > button"
  );

  if (!tombolDetail) {
    console.log(`❌ NOP ${nop} tidak ditemukan atau sudah diproses. Lewati...`);
    return;
  }

  await tombolDetail.click();

  await new Promise((resolve) => setTimeout(resolve, 2000));
  await page.select("#STATUS_PENYAMPAIAN", "1");

  await new Promise((resolve) => setTimeout(resolve, 1000));

  await page.evaluate(() => {
    const el = document.querySelector("#KOORDINAT_OP");
    if (el) {
      el.removeAttribute("readonly");
    }
  });
  
  ///////////////////////////////////// SESUAIKAN KOORDINATNYA /////////////////////////////////////
  const randomLatitude = (
    Math.random() * (0.48686 - 0.48586) +
    0.48586
  ).toFixed(8);
  const randomLongitude = (
    Math.random() * (101.4905 - 101.48965) +
    101.48965
  ).toFixed(8);
  const koordinat = `${randomLatitude},${randomLongitude}`;

  await page.click("#KOORDINAT_OP", { clickCount: 3 });
  await page.keyboard.press("Backspace");
  await page.type("#KOORDINAT_OP", koordinat);

  await page.click("#NAMA_PENERIMA", { clickCount: 3 });
  await page.keyboard.press("Backspace");
  await page.type("#NAMA_PENERIMA", nama);

  await page.click("#HP_PENERIMA", { clickCount: 3 });
  await page.keyboard.press("Backspace");
  await page.type("#HP_PENERIMA", hp);

  await page.click("#KETERANGAN_PETUGAS", { clickCount: 3 });
  await page.keyboard.press("Backspace");
  await page.type("#KETERANGAN_PETUGAS", ket);

  await page.click("#w4 > div > div.row > div > div:nth-child(4) > input");

  await new Promise((resolve) => setTimeout(resolve, 2000));

  await page.click("#btn-sdt"); //submit

  // await page.click(
  //   "#w4 > div > div.row > div > div.form-group.text-right > button.btn.btn-sm.btn-danger"); //keluar

  await page.waitForSelector("#modalsdt > div > div > div", { hidden: true });

  await new Promise((resolve) => setTimeout(resolve, 2000));

  console.log(`✅ Berhasil input NOP: ${nop}`);
}

bukaBrowser();
