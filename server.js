const express = require("express");
const fetch = require("node-fetch");
const statusMap = require("./statusMap");

const app = express();

app.use(express.static("public"));

function extractStatusCN(statusRemark) {
  if (!statusRemark) return "";
  return String(statusRemark).split("->")[0].trim();
}

function toThai(statusCN) {
  return statusMap[statusCN] || `กำลังดำเนินการ (${statusCN})`;
}

/* API เดิม */
app.get("/api/track", async (req, res) => {

  try {

    const no = (req.query.no || "").trim();

    if (!no) {
      return res.status(400).json({
        error: "กรุณากรอกเลขพัสดุ"
      });
    }

    const url =
      `https://api.weimingex.com/api/Centralized/GetlogisticstrackingList?Number=${encodeURIComponent(no)}`;

    const r = await fetch(url, {
      headers: {
        Referer: "https://vip.weimingex.com/",
        "User-Agent": "Mozilla/5.0",
        Accept: "application/json, text/plain, */*"
      }
    });

    const raw = await r.json();

    if (raw.code !== 200 || !raw.data || raw.data.length === 0) {
      return res.status(404).json({
        error: "ไม่พบข้อมูลพัสดุ",
        upstream: raw
      });
    }

    const root = raw.data[0];

    const list = Array.isArray(root.list)
      ? root.list
      : [];

    const events = list.map((item) => {

      const status_cn = extractStatusCN(item.statusRemark);

      return {
        time: item.statusTime,
        status_cn,
        status_th: toThai(status_cn)
      };

    });

    events.sort((a, b) =>
      (a.time < b.time ? 1 : -1)
    );

    const latest = events[0] || null;

    res.json({
      tracking_no: no,
      last_update: latest?.time || null,
      latest_status_th: latest?.status_th || null,
      events
    });

  } catch (e) {

    res.status(500).json({
      error: "ระบบขัดข้อง",
      detail: String(e)
    });

  }

});

/* API Teleport */
app.get("/api/teleport-track", async (req, res) => {

  try {

    const no = req.query.no;

    if (!no) {
      return res.status(400).json({
        error: "missing tracking number"
      });
    }

    const response = await fetch(
      `https://teleport.delivery/track?layout=none&tracking_number=${encodeURIComponent(no)}`
    );

    const data = await response.text();

    res.send(data);

  } catch (err) {

    console.error(err);

    res.status(500).json({
      error: "teleport api failed"
    });

  }

});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`พร้อมใช้งาน: http://localhost:${PORT}`);
});
