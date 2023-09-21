const fs = require("fs-extra");
const path = require("path");
const { Ffmpeg, getSet } = require("../utils");
const { Screenshot } = require("../utils/ffmpeg");

exports.CreateThumbs = async (req, res) => {
  try {
    const { slug } = req.params;
    const sets = await getSet({ attr: ["string_thumbnails_size"] });

    const data = await Screenshot({
      slug,
      thumb_size: sets?.string_thumbnails_size || 150,
    });

    return res.json(data);
  } catch (err) {
    console.log(err);
    return res.json({ error: true });
  }
};
