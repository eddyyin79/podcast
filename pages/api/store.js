export const config = {
  api: {
    bodyParser: {
      sizeLimit: "50mb",
    },
  },
};

const ADMIN_PIN = "580611";

function makeId() {
  return Date.now().toString() + "-" + Math.random().toString(16).slice(2);
}

function getStore() {
  if (!global.podupStore) {
    global.podupStore = {
      site: {
        name: "POD|Up",
        tagline: "Temporary podcast drops, seasons, and cinematic MP3s.",
        announcement: "Welcome to POD|Up. New episodes can disappear because this site is temporary-memory only.",
      },
      categories: [
        {
          id: "season-space",
          name: "Season 1: Space Exploration",
          description: "Episodes and soundtracks for The Future of Space Exploration.",
          color: "cyan",
          hidden: false,
          createdAt: new Date().toISOString(),
          files: [],
        },
      ],
    };
  }
  return global.podupStore;
}

function requireAdmin(req, res) {
  const pin = req.body?.pin;
  if (pin !== ADMIN_PIN) {
    res.status(401).json({ error: "Wrong admin PIN." });
    return false;
  }
  return true;
}

export default function handler(req, res) {
  const store = getStore();

  if (req.method === "GET") {
    return res.status(200).json(store);
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed." });
  }

  if (!requireAdmin(req, res)) return;

  const b = req.body || {};
  const action = b.action;

  if (action === "updateSite") {
    store.site = {
      ...store.site,
      name: b.name ?? store.site.name,
      tagline: b.tagline ?? store.site.tagline,
      announcement: b.announcement ?? store.site.announcement,
    };
    return res.status(200).json(store);
  }

  if (action === "addCategory") {
    if (!b.name?.trim()) return res.status(400).json({ error: "Missing category name." });
    store.categories.push({
      id: makeId(),
      name: b.name.trim(),
      description: b.description?.trim() || "New podcast season.",
      color: b.color || "cyan",
      hidden: false,
      createdAt: new Date().toISOString(),
      files: [],
    });
    return res.status(200).json(store);
  }

  if (action === "editCategory") {
    const cat = store.categories.find((c) => c.id === b.categoryId);
    if (!cat) return res.status(404).json({ error: "Category not found." });
    cat.name = b.name?.trim() || cat.name;
    cat.description = b.description?.trim() ?? cat.description;
    cat.color = b.color || cat.color;
    return res.status(200).json(store);
  }

  if (action === "toggleCategoryHidden") {
    const cat = store.categories.find((c) => c.id === b.categoryId);
    if (!cat) return res.status(404).json({ error: "Category not found." });
    cat.hidden = !cat.hidden;
    return res.status(200).json(store);
  }

  if (action === "deleteCategory") {
    store.categories = store.categories.filter((c) => c.id !== b.categoryId);
    return res.status(200).json(store);
  }

  if (action === "uploadFile") {
    const cat = store.categories.find((c) => c.id === b.categoryId);
    if (!cat) return res.status(404).json({ error: "Category not found." });
    if (!b.audioUrl) return res.status(400).json({ error: "Missing MP3 URL." });

    cat.files.push({
      id: makeId(),
      title: b.title?.trim() || b.fileName || "Podcast audio",
      host: b.host?.trim() || "Unknown host",
      description: b.description?.trim() || "Uploaded podcast audio.",
      fileName: b.fileName || "audio.mp3",
      audioUrl: b.audioUrl,
      featured: false,
      hidden: false,
      plays: 0,
      createdAt: new Date().toISOString(),
    });

    return res.status(200).json(store);
  }

  if (action === "editFile") {
    const cat = store.categories.find((c) => c.id === b.categoryId);
    if (!cat) return res.status(404).json({ error: "Category not found." });
    const file = cat.files.find((f) => f.id === b.fileId);
    if (!file) return res.status(404).json({ error: "File not found." });
    file.title = b.title?.trim() || file.title;
    file.host = b.host?.trim() || file.host;
    file.description = b.description?.trim() ?? file.description;
    return res.status(200).json(store);
  }

  if (action === "moveFile") {
    const fromCat = store.categories.find((c) => c.id === b.categoryId);
    const toCat = store.categories.find((c) => c.id === b.targetCategoryId);
    if (!fromCat || !toCat) return res.status(404).json({ error: "Category not found." });
    const index = fromCat.files.findIndex((f) => f.id === b.fileId);
    if (index === -1) return res.status(404).json({ error: "File not found." });
    const [file] = fromCat.files.splice(index, 1);
    toCat.files.push(file);
    return res.status(200).json(store);
  }

  if (action === "toggleFileHidden") {
    const cat = store.categories.find((c) => c.id === b.categoryId);
    if (!cat) return res.status(404).json({ error: "Category not found." });
    const file = cat.files.find((f) => f.id === b.fileId);
    if (!file) return res.status(404).json({ error: "File not found." });
    file.hidden = !file.hidden;
    return res.status(200).json(store);
  }

  if (action === "toggleFeatured") {
    const cat = store.categories.find((c) => c.id === b.categoryId);
    if (!cat) return res.status(404).json({ error: "Category not found." });
    const file = cat.files.find((f) => f.id === b.fileId);
    if (!file) return res.status(404).json({ error: "File not found." });
    file.featured = !file.featured;
    return res.status(200).json(store);
  }

  if (action === "deleteFile") {
    const cat = store.categories.find((c) => c.id === b.categoryId);
    if (!cat) return res.status(404).json({ error: "Category not found." });
    cat.files = cat.files.filter((f) => f.id !== b.fileId);
    return res.status(200).json(store);
  }

  if (action === "countPlay") {
    const cat = store.categories.find((c) => c.id === b.categoryId);
    if (!cat) return res.status(404).json({ error: "Category not found." });
    const file = cat.files.find((f) => f.id === b.fileId);
    if (!file) return res.status(404).json({ error: "File not found." });
    file.plays = (file.plays || 0) + 1;
    return res.status(200).json(store);
  }

  if (action === "resetEverything") {
    global.podupStore = undefined;
    return res.status(200).json(getStore());
  }

  return res.status(400).json({ error: "Unknown action." });
}
