export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  const { assetId } = req.query;
  if (!assetId) {
    return res.status(400).json({ error: 'No asset ID provided' });
  }

  try {
    const assetRes = await fetch(
      `https://economy.roproxy.com/v2/assets?assetIds=${assetId}`
    );
    const assetData = await assetRes.json();
    const rawName = assetData.data?.[0]?.name;

    if (!rawName) {
      return res.status(404).json({ error: 'Asset not found' });
    }

    const [titlePart, artistPart] = rawName.split(' - ').map(s => s.trim());

    const query = artistPart ? `${titlePart} ${artistPart}` : titlePart;
    const itunesRes = await fetch(
      `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=song&limit=1`
    );
    const itunesData = await itunesRes.json();
    const track = itunesData.results?.[0];

    return res.status(200).json({
      title: track?.trackName ?? titlePart,
      artist: track?.artistName ?? artistPart ?? 'Unknown',
      album: track?.collectionName ?? '',
      artworkUrl: track?.artworkUrl100?.replace('100x100bb', '600x600bb') ?? null
    });
  } catch (err) {
    return res.status(500).json({ error: 'Lookup failed', details: err.message });
  }
}
