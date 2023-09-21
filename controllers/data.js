const { Ffmpeg } = require("../utils");
const path = require("path");
const fs = require("fs-extra");
const request = require("request");
const { File } = require("../models");

exports.DataVideo = async (req, res) => {
  try {
    const { fileId, fileName } = req.params;

    const outPutPath = `${global.dirPublic}${fileId}/${fileName}`;
    const data = await Ffmpeg.GetData(outPutPath);

    return res.json(data);
  } catch (err) {
    console.log(err);
    return res.json({ error: true });
  }
};

exports.DownloadPercent = async (req, res) => {
  try {
    const { fileId } = req.query;
    if (!fileId) {
      return res.json({ error: true, msg: "กรุณาใส่ fileId" });
    }
    if (!fs.existsSync(`${global.dirPublic}${fileId}`)) {
      return res.json({ error: true, msg: "ไม่พบข้อมูล" });
    }
    const downloadPath = `${global.dirPublic}${fileId}/file_video.txt`;

    let data = {};
    if (!fs.existsSync(downloadPath)) {
      data.download = 0;
    } else {
      const logData = await fs.readFileSync(downloadPath, "utf-8");

      let code = logData
        .toString()
        .replace(/ /g, "")
        .replace(/#/g, "")
        .split(/\r?\n/);

      const dataRaw = code.filter((e) => {
        return e != "";
      });

      const Array = dataRaw
        .at(0)
        .split(/\r/)
        .filter((e) => {
          return Number(e.replace(/%/g, ""));
        })
        .map((e) => {
          return Number(e.replace(/%/g, ""));
        });
      data.download = Math.max(...Array) || 0;
    }

    let totalPercent = Number(data.download) || 0;

    //find file id
    const files = await File.List.findOne({ slug: fileId }).select(`_id`);
    if (files?._id) {
      await File.Process.findOneAndUpdate(
        { fileId: files?._id, type: "thumbnails" },
        { percent: totalPercent }
      );
    }
    return res.json(data);
  } catch (err) {
    console.log(err);
    return res.json({ error: true });
  }
};

function getReq(url) {
  try {
    return new Promise(async function (resolve, reject) {
      if (!url) resolve({ error: true });
      request({ url }, function (error, response, body) {
        if (!body) reject();
        resolve(JSON.parse(body));
      });
    });
  } catch (error) {
    return { error: true };
  }
}
