import axios from "axios";
import * as cheerio from "cheerio";

export default async function handler(req, res) {
  let { url } = req.query;

  if (!url) {
    return res.status(400).json({ error: "URL is required." });
  }

  try {
    let htmlRes = await axios.get(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
      }
    });

    let $ = cheerio.load(htmlRes.data);

    let poster = $('meta[property="og:image"]').attr("content") || "";
    let synopsis = $("#syn-target").html() || "-";

    let info = {
      status: $(".js-status").text() || "-",
      studio: $(".js-studio").text() || "-",
      durasi: $(".js-duration").text() || "-",
      negara: $(".js-negara").text() || "-",
      episode: $(".js-episode").text() || "-",
      network: $(".js-network").text() || "-",
      tanggalRilis: $(".js-tanggalrilis").text() || "-",
      season: $(".js-season").text() || "-",
      genre: $(".js-genre").text() || "-"
    };

    let streaming = [];
    let downloads = [];

    $(".DagPlayOpt").each((i, el) => {
      let embed = $(el).attr("data-embed") || "";
      let episode = $(el).attr("data-episode") || "-";
      let downloadAttr = $(el).attr("data-download") || "[]";

      let parsedDownload;
      try {
        parsedDownload = JSON.parse(downloadAttr);
      } catch (e) {
        parsedDownload = [];
      }

      streaming.push({
        episode,
        embed
      });

      parsedDownload.forEach((srv) => {
        srv.qualities.forEach((q) => {
          downloads.push({
            episode,
            server: srv.server,
            quality: q.quality,
            url: q.url
          });
        });
      });
    });

    // Bikin kode HTML sesuai template lu
    let episodeList = streaming
      .map((ep) => {
        let epDownloads = downloads.filter((d) => d.episode === ep.episode);

        let downloadGrouped = [];
        for (let d of epDownloads) {
          let srv = downloadGrouped.find((s) => s.server === d.server);
          if (!srv) {
            srv = {
              server: d.server,
              qualities: []
            };
            downloadGrouped.push(srv);
          }
          srv.qualities.push({
            quality: d.quality,
            url: d.url
          });
        }

        return `
        <li>
          <div class="DagPlayOpt on"
            data-embed="${ep.embed}"
            data-id="Server-1"
            data-episode="${ep.episode}"
            data-download='${JSON.stringify(downloadGrouped)}'>
            <span>${ep.episode}</span>
          </div>
        </li>
        `;
      })
      .join("\n");

    let htmlTemplate = `
<!-- Gambar Poster -->
<div class="separator" style="clear: both;"><a href="${poster}" style="display: block; padding: 1em 0; text-align: center;"><img alt="" border="0" height="320" src="${poster}"/></a></div>

<section class="stream">
  ...HTML panjang yang lu kirim di awal...
  <ul id="Server-1" class="serverEpisode" style="display: block;">
    ${episodeList}
  </ul>
</section>

<script>
document.addEventListener("DOMContentLoaded", function(){
  document.getElementById('syn-target').innerHTML = \`${synopsis}\`;
  document.querySelector(".js-status").textContent = "${info.status}";
  document.querySelector(".js-studio").textContent = "${info.studio}";
  document.querySelector(".js-duration").textContent = "${info.durasi}";
  document.querySelector(".js-negara").textContent = "${info.negara}";
  document.querySelector(".js-episode").textContent = "${info.episode}";
  document.querySelector(".js-network").textContent = "${info.network}";
  document.querySelector(".js-tanggalrilis").textContent = "${info.tanggalRilis}";
  document.querySelector(".js-season").textContent = "${info.season}";
  document.querySelector(".js-type").textContent = "Donghua";
  document.querySelector(".js-genre").textContent = "${info.genre}";
});
</script>
    `;

    res.status(200).json({ html: htmlTemplate });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Gagal scraping data." });
  }
}
