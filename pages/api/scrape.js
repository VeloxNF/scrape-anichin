import axios from "axios";
import * as cheerio from "cheerio";

export default async function handler(req, res) {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ error: "URL Anichin wajib diisi!" });
  }

  try {
    // Download HTML
    const response = await axios.get(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
      }
    });

    const $ = cheerio.load(response.data);

    // ① SCRAPE POSTER
    const poster = $('meta[property="og:image"]').attr("content") || "";

    // ② SCRAPE SINOPSIS
    const synopsisHTML = $("#syn-target").html() || "-";

    // ③ SCRAPE INFO DETAIL
    const info = {
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

    // ④ SCRAPE EPISODE LIST
    let episodeList = [];

    $(".DagPlayOpt").each((i, el) => {
      const embed = $(el).attr("data-embed") || "";
      const episode = $(el).attr("data-episode") || "-";
      const downloadAttr = $(el).attr("data-download") || "[]";

      let downloads = [];

      try {
        downloads = JSON.parse(downloadAttr);
      } catch (e) {
        downloads = [];
      }

      episodeList.push({
        embed,
        episode,
        downloads
      });
    });

    // ⑤ FORMAT epList ke HTML <li> (buat masuk ke ${epList})
    const epListHTML = episodeList.map(ep => {
      return `
      <li>
        <div class="DagPlayOpt on"
          data-embed="${ep.embed}"
          data-id="Server-1"
          data-episode="${ep.episode}"
          data-download='${JSON.stringify(ep.downloads)}'>
          <span>${ep.episode}</span>
        </div>
      </li>
      `;
    }).join("\n");

    // ⑥ KIRIM SEMUA DATA
    const data = {
      poster,
      synopsis: synopsisHTML,
      info,
      epList: epListHTML
    };

    res.status(200).json(data);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Gagal scraping Anichin." });
  }
}
