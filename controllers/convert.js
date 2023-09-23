const fs = require("fs-extra");
const path = require("path");
const { Ffmpeg, getSet, useCurl } = require("../utils");
const { Screenshot } = require("../utils/ffmpeg");
const { File } = require("../models");

exports.CreateThumbs = async (req, res) => {
  try {
    const { slug } = req.params;
    const sets = await getSet({ attr: ["string_thumbnails_size"] });

    const convert = await Screenshot({
      slug,
      thumb_size: sets?.string_thumbnails_size || 150,
    });
    if (convert?.error) {
      const row = await File.List.findOne({ slug });
      await File.Lock.create({
        msg: "CreateThumbs",
        userId: row?.userId,
        fileId: row?.fileId,
      });
      console.log("call reload");
      await useCurl.get(`http://127.0.0.1/server/reload`);
    }
    return res.json(convert);
  } catch (err) {
    console.log(err);
    return res.json({ error: true });
  }
};
