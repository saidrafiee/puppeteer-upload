require("dotenv").config();
const puppeteer = require("puppeteer");
const fs = require("fs").promises;
const path = require("path");

const bukaBrowser = async () => {
  const videoPath = path.resolve(__dirname, "foto", process.env.FOTO); // pastikan output.y4m sudah ada
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
  const sdt = process.env.NAMA_SDT;
  await page.goto(sdt);
  await new Promise((resolve) => setTimeout(resolve, 2000));

  // Jalankan fungsi isiFormulirDanSubmit untuk setiap NOP
  for (const entry of daftarNop) {
    console.log(`Memproses NOP: ${entry.nop} (${entry.nama}) [${entry.id}]`);
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

  const A = { lat: 0.4921, lon: 101.4906 }; // Titik A (pojok kiri bawah)
  const B = { lat: 0.4913, lon: 101.4919 }; // Titik B (pojok kanan bawah)
  const C = { lat: 0.4847, lon: 101.4906 }; // Titik C (pojok kanan atas)
  const D = { lat: 0.4897, lon: 101.4888 }; // Titik D (pojok kiri atas)

  // Langkah 1: Dapatkan vektor AB dan AD
  const AB = {
    lat: B.lat - A.lat,
    lon: B.lon - A.lon,
  };
  const AD = {
    lat: D.lat - A.lat,
    lon: D.lon - A.lon,
  };

  // Langkah 2: Buat dua random value
  const u = Math.random(); // arah AB
  const v = Math.random(); // arah AD

  // Langkah 3: Hitung titik di dalam jajar genjang
  const randomLat = A.lat + u * AB.lat + v * AD.lat;
  const randomLon = A.lon + u * AB.lon + v * AD.lon;
  const koordinat = `${randomLat.toFixed(8)},${randomLon.toFixed(8)}`;
  console.log(koordinat);

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

  // await page.click("#w4 > div > div.row > div > div:nth-child(4) > input");

  await new Promise((resolve) => setTimeout(resolve, 500));

  // await page.click("#btn-sdt"); //submit

  await page.click(
    "#w4 > div > div.row > div > div.form-group.text-right > button.btn.btn-sm.btn-danger"
  ); //keluar

  await page.waitForSelector("#modalsdt > div > div > div", { hidden: true });

  await new Promise((resolve) => setTimeout(resolve, 1000));

  console.log(`✅ Berhasil input NOP: ${nop}`);
}

bukaBrowser();
