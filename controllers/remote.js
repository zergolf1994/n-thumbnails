"use strict";

const { File, Server } = require("../models");
const { getOs, Scp, Ffmpeg, useCurl } = require("../utils");
const fs = require("fs-extra");
const shell = require("shelljs");
const path = require("path");

exports.ConvertToMp4 = async (req, res) => {
  try {
    const { fileId } = req.query;

    //ข้อมูลไฟล์
    const rows = await File.Process.aggregate([
      { $match: { fileId } },
      {
        $lookup: {
          from: "files",
          localField: "fileId",
          foreignField: "_id",
          as: "files",
          pipeline: [
            {
              $project: {
                _id: 1,
                type: 1,
                title: 1,
                source: 1,
                slug: 1,
              },
            },
          ],
        },
      },
      {
        $addFields: {
          file: { $arrayElemAt: ["$files", 0] },
        },
      },
      {
        $set: {
          slug: "$file.slug",
          title: "$file.title",
          type: "$file.type",
          source: "$file.source",
        },
      },
      {
        $project: {
          quality: 1,
          fileId: 1,
          userId: 1,
          serverId: 1,
          slug: 1,
        },
      },
    ]);

    if (!rows?.length) return res.json({ error: true, msg: `ไม่พบข้อมูล` });
    const row = rows[0];
    const data = await Ffmpeg.ConvertDefault({ row });

    return res.json(data);
  } catch (err) {
    console.log(err);
    return res.json({ error: true, msg: "ConvertToMp4" });
  }
};
exports.UploadToStorage = async (req, res) => {
  try {
    const { slug, quality } = req.params;

    const row = await File.List.findOne({ slug }).select(`_id userId slug`);
    if (!row) {
      return { error: true, msg: "No File." };
    }

    const videoOutput = path.join(
      global.dirPublic,
      slug,
      `file_${quality}.mp4`
    );

    if (!fs.existsSync(videoOutput)) {
      return { error: true, msg: "No video." };
    }

    let { streams, format } = await Ffmpeg.GetData(videoOutput);

    const videoStream = streams.find((stream) => stream.codec_type === "video");
    if (!videoStream) {
      return res.json({ error: true, msg: "ไม่พบสตรีมวิดีโอในไฟล์" });
    }

    //ข้อมูล storage
    const storage = await Server.List.findOne(
      {
        type: "storage",
        active: true,
        svUser: { $ne: undefined },
        svPass: { $ne: undefined },
      },
      null,
      {
        sort: { diskPercent: 1 },
      }
    ).select(`_id svIp svUser svPass svPost`);

    if (!storage?._id)
      return res.json({ error: true, msg: `ไม่พบเซิฟเวอร์เก็บไฟล์` });

    const resp = await Scp.Storage({
      row,
      quality,
      storage,
    });
    if (resp?.error) {
      //สร้างคิวเพื่อเช็ค
      return res.json(resp);
    }
    //สร้าง file_data
    const exist = await File.Data.findOne({
      fileId: row?._id,
      name: quality,
      type: "video",
    }).select(`_id`);

    if (exist?._id)
      return res.json({
        error: true,
        msg: `มีไฟล์ ${quality} ในระบบแล้ว`,
      });

    let fileDataCreate = {
      active: 1,
      type: "video",
      name: quality,
      serverId: storage?._id,
      userId: row?.userId,
      fileId: row?._id,
      size: format?.size,
      dimention: `${videoStream?.width}X${videoStream?.height}`,
    };
    let dbCreate = await File.Data.create(fileDataCreate);
    if (dbCreate?._id) {
      // อัพเดตไฟล์
      /*const videoInput = path.join(
        global.dirPublic,
        row?.slug,
        `file_${row?.quality}.mp4`
      );
      const { streams, format } = await Ffmpeg.GetData(videoInput);
      const videoStream = streams?.find(
        (stream) => stream.codec_type === "video"
      );
      let dataUpdate = {};
      dataUpdate.size = format?.size;
      dataUpdate.dimention = `${videoStream?.width}X${videoStream?.height}`;
      await File.List.findByIdAndUpdate(
        { _id: row?.fileId },
        { ...dataUpdate }
      );*/
      /*await Server.List.findByIdAndUpdate(
        { _id: row?.serverId },
        { isWork: false }
      );*/
      //await File.Process.deleteOne({ _id: row?._id });

      // คำสั่ง เพื่อดำเนินการ ส่งต่อไปยัง bash
      /*shell.exec(
        `sudo rm -rf ${global.dirPublic}${row?.slug}`,
        { async: false, silent: false },
        function (data) {}
      );*/
      //อัพเดตพื้นที่
      //await useCurl.get(`http://${storage?.svIp}/disk`);

      return res.json({ msg: "uploaded" });
    } else {
      return res.json({ error: true, msg: `ลองอีกครั้ง` });
    }
  } catch (err) {
    console.log(err);
    return res.json({ error: true, msg: "UploadToStorage" });
  }
};
