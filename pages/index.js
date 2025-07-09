import { useState } from "react";

export default function Home() {
  const [url, setUrl] = useState("");
  const [html, setHtml] = useState("");

  const handleScrape = async () => {
    const res = await fetch(`/api/scrape?url=${encodeURIComponent(url)}`);
    const data = await res.json();
    setHtml(data.html || data.error);
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>Scraper Anichin → Blogger HTML</h1>
      <input
        type="text"
        placeholder="Masukkan URL Anichin"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        style={{ width: "80%", padding: 8 }}
      />
      <button onClick={handleScrape} style={{ marginLeft: 10, padding: 8 }}>
        Scrape
      </button>

      <h3>Hasil HTML:</h3>
      <textarea
        style={{ width: "100%", height: "500px", marginTop: 20 }}
        value={html}
        readOnly
      ></textarea>
    </div>
  );
}
