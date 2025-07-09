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

    // Bikin HTML list episode
    let epList = streaming
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

    // Buat HTML final
    let htmlTemplate = `
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
      <div class="itemleft">
        <div class="icon DagLight">
          <svg viewBox="0 0 24 24">
            <path fill="currentColor" d="M20,11H23V13H20V11M1,11H4V13H1V11M13,1V4H11V1H13M4.92,3.5L7.05,5.64L5.63,7.05L3.5,4.93L4.92,3.5M16.95,5.63L19.07,3.5L20.5,4.93L18.37,7.05L16.95,5.63M12,6A6,6 0 0,1 18,12C18,14.22 16.79,16.16 15,17.2V19A1,1 0 0,1 14,20H10A1,1 0 0,1 9,19V17.2C7.21,16.16 6,14.22 6,12A6,6 0 0,1 12,6M14,21V22A1,1 0 0,1 13,23H11A1,1 0 0,1 10,22V21H14M11,18H13V15.87C14.73,15.43 16,13.86 16,12A4,4 0 0,0 12,8A4,4 0 0,0 8,12C8,13.86 9.27,15.43 11,15.87V18Z"></path>
          </svg>
          <span>Turn on Light</span>
        </div>
        <div class="icon DagShre">
          <svg xmlns="http://www.w3.org/2000/svg" aria-hidden="true" role="img" width="1em" height="1em" viewBox="0 0 24 24">
            <g fill="none">
              <path d="M3 3h6v2H5v4H3V3z" fill="currentColor"></path>
              <path d="M3 21h6v-2H5v-4H3v6z" fill="currentColor"></path>
              <path d="M15 21h6v-6h-2v4h-4v2z" fill="currentColor"></path>
              <path d="M21 3h-6v2h4v4h2V3z" fill="currentColor"></path>
            </g>
          </svg>
          <a>Expand</a>
        </div>
        <div class="icon DagCom">
          <svg viewBox="0 0 24 24">
            <path fill="currentColor" d="M12,23A1,1 0 0,1 11,22V19H7A2,2 0 0,1 5,17V7A2,2 0 0,1 7,5H21A2,2 0 0,1 23,7V17A2,2 0 0,1 21,19H16.9L13.2,22.71C13,22.89 12.76,23 12.5,23H12M3,15H1V3A2,2 0 0,1 3,1H19V3H3V15Z"></path>
          </svg>
          <a href="#comments"><span>Comments</span></a>
        </div>
      </div>
      <div class="itemright">
        <div class="icon Report">
          <svg xmlns="http://www.w3.org/2000/svg" aria-hidden="true" role="img" width="0.38em" height="1em" viewBox="0 0 192 512">
            <path d="M176 432c0 44.112-35.888 80-80 80s-80-35.888-80-80s35.888-80 80-80s80 35.888 80 80zM25.26 25.199l13.6 272C39.499 309.972 50.041 320 62.83 320h66.34c12.789 0 23.331-10.028 23.97-22.801l13.6-272C167.425 11.49 156.496 0 142.77 0H49.23C35.504 0 24.575 11.49 25.26 25.199z" fill="currentColor"></path>
          </svg>
          <span>Report</span>
        </div>
      </div>
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
        ${epList}
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

<style>
.custom-dropdown {
  background-color: #333333;
  color: #ffffff !important;
  border: 1px solid #333333;
  padding: 8px 12px;
  font-size: 14px;
  border-radius: 4px;
  width: 150px;
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  background-image: url("data:image/svg+xml;utf8,<svg fill='white' height='20' viewBox='0 0 24 24' width='20' xmlns='http://www.w3.org/2000/svg'><path d='M7 10l5 5 5-5z'/></svg>");
  background-repeat: no-repeat;
  background-position: right 10px center;
  background-size: 16px;
}

.custom-dropdown option {
  background-color: #333333;
  color: #ffffff;
}
</style>
    `;

    res.status(200).json({ html: htmlTemplate });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Gagal scraping data." });
  }
}