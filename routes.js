"use strict";
const express = require("express");
const router = express.Router();

const {
  ProcessStart,
  DataDownload,
  ConvertDone,
} = require("./controllers/start");

const { CreateThumbs } = require("./controllers/convert");

const { DataThumbnail, UploadThumbnail } = require("./controllers/thumbnail");
//สร้าง
router.get("/start", ProcessStart);

//ข้อมูลดาวน์โหลด
router.get("/data", DataDownload);

//สร้างรูปภาพขนาดย่อ 1 รูป
router.get("/thumb-create/:slug", CreateThumbs);

//สร้างรูปภาพขนาดย่อ
router.get("/thumbnail/data/:slug", DataThumbnail);
router.get("/thumbnail/remote/:slug", UploadThumbnail);

//เสร็จสิ้น
router.get("/done/:slug", ConvertDone);

const { DownloadPercent } = require("./controllers/data");
router.get("/download-percent", DownloadPercent);

const {
  serverCreate,
  serverReload,
  serverReloaded,
} = require("./controllers/server");
router.get("/server/create", serverCreate);
router.get("/server/reload", serverReload);
router.get("/server/reloaded", serverReloaded);

router.all("*", async (req, res) => {
  return res.status(404).json({ error: true, msg: `link_not_found` });
});

module.exports = router;
