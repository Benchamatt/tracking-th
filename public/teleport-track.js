export default async function handler(req, res) {

  const no = req.query.no;

  if (!no) {
    return res.status(400).json({
      error: "missing tracking number"
    });
  }

  try {

    const response = await fetch(
      `https://teleport.delivery/track?layout=none&tracking_number=${encodeURIComponent(no)}`
    );

    const text = await response.text();

    return res.status(200).send(text);

  } catch (e) {

    return res.status(500).json({
      error: String(e)
    });

  }

}
