import axios from "axios";
import * as cheerio from "cheerio";

export default async function handler(req, res) {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ error: "URL is required." });
  }

  try {
    const response = await axios.get(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
      }
    });

    const html = response.data;
    const $ = cheerio.load(html);

    // ----- POSTER -----
    const poster = $('meta[property="og:image"]').attr("content") || "";

    // ----- SINOPSIS -----
    // Ambil bagian Indonesia aja
    let synopsis = "-";
    if ($(".entry-content").length) {
    synopsis = $(".entry-content").html()?.trim() || "-";
    }

    // scrape info detail di anichin
    let info = {
    status: "-",
    studio: "-",
    durasi: "-",
    negara: "-",
    episode: "-",
    network: "-",
    tanggalRilis: "-",
    season: "-",
    genre: "-",
    type: "-"
    };

    $(".spe span").each((i, el) => {
    const label = $(el).find("b").text().toLowerCase().replace(":", "").trim();
    const value = $(el).find("b").remove().end().text().trim();

    if (label === "status") info.status = value;
    if (label === "network") info.network = value;
    if (label === "studio") info.studio = value;
    if (label === "tanggal rilis") info.tanggalRilis = value;
    if (label === "durasi") info.durasi = value;
    if (label === "season") info.season = value;
    if (label === "negara") info.negara = value;
    if (label === "tipe") info.type = value;
    if (label === "episode") info.episode = value;
    });

    // genre
    let genre = [];
    $(".genxed a").each((i, el) => {
    genre.push($(el).text().trim());
    });
    if (genre.length) info.genre = genre.join(", ");

    // ----- EPISODES + DOWNLOADS -----
    let episodeList = [];

    $(".DagPlayOpt").each((i, el) => {
    let serverName = $(el).text().trim().toLowerCase();

    // cuma ambil Dailymotion
    if (serverName.includes("dailymotion")) {
        let embed = $(el).attr("data-embed") || "";
        let episode = $(el).attr("data-episode") || "-";
        let downloadAttr = $(el).attr("data-download") || "[]";

        let downloads = [];
        try {
        let parsed = JSON.parse(downloadAttr);
        parsed.forEach((srv) => {
            srv.qualities.forEach((q) => {
            downloads.push({
                server: srv.server,
                quality: q.quality,
                url: q.url
            });
            });
        });
        } catch (e) {}

        episodeList.push({
        episode,
        embed,
        downloads
        });
    }
    });

    // kalau tidak ketemu Dailymotion, fallback ke semua
    if (episodeList.length === 0) {
    $(".DagPlayOpt").each((i, el) => {
        let embed = $(el).attr("data-embed") || "";
        let episode = $(el).attr("data-episode") || "-";
        let downloadAttr = $(el).attr("data-download") || "[]";

        let downloads = [];
        try {
        let parsed = JSON.parse(downloadAttr);
        parsed.forEach((srv) => {
            srv.qualities.forEach((q) => {
            downloads.push({
                server: srv.server,
                quality: q.quality,
                url: q.url
            });
            });
        });
        } catch (e) {}

        episodeList.push({
        episode,
        embed,
        downloads
        });
    });
    }

    // Kalau nggak ada episode list (halaman episode tunggal), scrape iframe
    if (episodeList.length === 0) {
    const iframeSrc = $("#embed_holder iframe").attr("src") || "";
    const title = $("title").text() || "";
    const episodeMatch = title.match(/Episode\s+(\d+)/i);
    const episode = episodeMatch ? episodeMatch[1] : "-";

    if (iframeSrc) {
        episodeList.push({
        episode,
        embed: iframeSrc,
        downloads: []
        });
    }
    }

    let epListHtml = episodeList
      .map((ep) => {
        return `
        <li>
          <div class="DagPlayOpt on"
            data-embed="${ep.embed}"
            data-id="Server-1"
            data-episode="${ep.episode}"
            data-download='${JSON.stringify(groupDownloads(ep.downloads))}'>
            <span>${ep.episode}</span>
          </div>
        </li>
        `;
      })
      .join("\n");

    const htmlTemplate = `
<!-- Gambar Poster -->
<div class="separator" style="clear: both;"><a href="${poster}" style="display: block; padding: 1em 0; text-align: center;"><img alt="" border="0" height="320" src="${poster}"/></a></div>

<section class="stream">

  <!-- Shadow (light off overlay) -->
  <div id="shadow" style="display: none;"></div>

  <!-- Streaming Player Area -->
  <div class="DagPlaArea DagTo">
    <div id="PlayVideo" class="video-content">
      <div id="embed_holder">
        <div class="player-embed" id="pembed">
          <div class="playerload"></div>
          <div id="player_embed">
            <div class="pframe">
              <iframe
                id="player-iframe"
                frameborder="0"
                marginwidth="0"
                marginheight="0"
                scrolling="NO"
                width="100%"
                height="100%"
                allowfullscreen="true"
                webkitallowfullscreen="true"
                mozallowfullscreen="true">
              </iframe>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Video Navigation -->
    <div class="video-nav">
      <!-- ikon nav -->
    </div>
  </div>

  <!-- Server Option -->
  <div class="server_option">
    <div>Pilih Episode</div>
    <div class="tabs servers">
      <select id="serverSelect" class="custom-dropdown tablinks">
        <option value="" disabled selected>Pilih Server Video</option>
        <option value="Server1">Server 1</option>
      </select>
    </div>
    <div id="server">
      <ul id="Server-1" class="serverEpisode" style="display: block;">
        ${epListHtml}
      </ul>
    </div>
  </div>

  <!-- Download Section -->
  <div class="resIn" id="Server-1" style="display: block; margin-top: 20px;">
    <div style="display: flex; align-items: center; gap: 8px;">
      <h1 class="title" id="title" style="margin: 0; font-size: 20px;"></h1>
      <h1 style="margin: 0; font-size: 20px;"> Episode </h1>
      <span id="dl-ep" style="font-weight: bold; font-size: 20px;">-</span>
    </div>
    <hr style="border: 1px solid #5a2e98;">
    <div class="download-title">
      Pilih Server Download
    </div>
    <div class="download-links">
      <table>
        <thead>
          <tr>
            <th>Server</th>
            <th>Subtitle</th>
            <th>Kualitas</th>
            <th>Link</th>
          </tr>
        </thead>
        <tbody id="download-body"></tbody>
      </table>
    </div>
  </div>

</section>

<script>
document.querySelectorAll('.DagPlayOpt').forEach(function(item) {
  item.addEventListener('click', function() {
    var embed = this.getAttribute('data-embed');
    var episode = this.getAttribute('data-episode') || "-";
    var downloadData = JSON.parse(this.getAttribute('data-download') || "[]");

    document.getElementById('player-iframe').src = embed;
    document.getElementById('dl-ep').textContent = episode;

    var tbody = document.getElementById('download-body');
    tbody.innerHTML = "";

    downloadData.forEach(function(serverObj) {
      serverObj.qualities.forEach(function(qualityObj) {
        var tr = document.createElement('tr');
        tr.innerHTML = \`
          <td>\${serverObj.server}</td>
          <td>Sub</td>
          <td><span>\${qualityObj.quality}</span></td>
          <td><a class="btn sm rnd" href="\${qualityObj.url}" rel="nofollow" target="_blank">Download</a></td>
        \`;
        tbody.appendChild(tr);
      });
    });

    document.querySelectorAll('.DagPlayOpt').forEach(el => el.classList.remove('on'));
    this.classList.add('on');
  });
});
document.querySelector('.DagPlayOpt.on')?.click();

document.addEventListener("DOMContentLoaded", function() {
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

function groupDownloads(list) {
  let grouped = [];
  for (let d of list) {
    let srv = grouped.find((s) => s.server === d.server);
    if (!srv) {
      srv = {
        server: d.server,
        qualities: []
      };
      grouped.push(srv);
    }
    srv.qualities.push({
      quality: d.quality,
      url: d.url
    });
  }
  return grouped;
}
