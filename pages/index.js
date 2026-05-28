import { useEffect, useMemo, useState } from "react";
import {
  Headphones, Home, Lock, Upload, Plus, Search, LogOut, Sparkles, Radio,
  Trash2, Pencil, Eye, EyeOff, Star, RefreshCw, BarChart3, Settings,
  MoveRight, Save, RotateCcw
} from "lucide-react";
import { upload } from "@vercel/blob/client";

const ADMIN_PIN = "580611";
const STORAGE_KEY = "podup-store-v1";
const colors = ["cyan", "violet", "green", "orange", "rose"];

function hasUserContent(data) {
  if (!data || !Array.isArray(data.categories)) return false;
  const fileCount = data.categories.reduce((sum, cat) => sum + (cat.files?.length || 0), 0);
  const changedSite =
    data.site?.name !== "POD|Up" ||
    data.site?.tagline !== "Temporary podcast drops, seasons, and cinematicSeason 1 episodes for: \"The Future of Space Exploration\" MP3s." ||
    data.site?.announcement !== "Welcome to POD|Up! Enjoy :)";
  const changedCategories =
    data.categories.length !== 1 ||
    data.categories[0]?.id !== "season-space" ||
    data.categories[0]?.name !== "Season 1: Space Exploration" ||
    data.categories[0]?.description !== "Episodes and soundtracks for The Future of Space Exploration.";
  return fileCount > 0 || changedSite || changedCategories;
}

function readSavedStore() {
  if (typeof window === "undefined") return null;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
}

function saveStore(data) {
  if (typeof window === "undefined" || !data) return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function clearSavedStore() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}

export default function HomePage() {
  const [page, setPage] = useState("home");
  const [pin, setPin] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [store, setStore] = useState({ site: {}, categories: [] });
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");

  const [newCategory, setNewCategory] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newColor, setNewColor] = useState("cyan");
  const [categoryId, setCategoryId] = useState("");
  const [fileTitle, setFileTitle] = useState("");
  const [fileHost, setFileHost] = useState("");
  const [fileDescription, setFileDescription] = useState("");

  const [editingCategory, setEditingCategory] = useState(null);
  const [editingFile, setEditingFile] = useState(null);

  const [siteName, setSiteName] = useState("");
  const [siteTagline, setSiteTagline] = useState("");
  const [siteAnnouncement, setSiteAnnouncement] = useState("");

  function applyStore(data) {
    setStore(data);
    setSiteName(data.site?.name || "POD|Up");
    setSiteTagline(data.site?.tagline || "");
    setSiteAnnouncement(data.site?.announcement || "");
  }

  async function loadStore() {
    const saved = readSavedStore();
    if (saved) applyStore(saved);

    try {
      const res = await fetch("/api/store");
      const data = await res.json();

      // On Vercel/server refreshes, the temporary API memory can restart and return
      // the default empty site. Do not overwrite the browser's saved copy with that.
      if (!saved || hasUserContent(data)) {
        applyStore(data);
        saveStore(data);
      }
    } catch {
      if (!saved) setStatus("Could not refresh the store.");
    }
  }

  useEffect(() => {
    loadStore();
  }, []);

  async function adminAction(payload, success = "Done.") {
    setStatus("Working...");
    const res = await fetch("/api/store", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...payload, pin }),
    });
    const data = await res.json();
    if (!res.ok) {
      setStatus(data.error || "Something went wrong.");
      return null;
    }
    if (payload.action === "resetEverything") {
      clearSavedStore();
    } else {
      saveStore(data);
    }
    setStore(data);
    setStatus(success);
    return data;
  }

  const visibleCategories = useMemo(() => {
    const q = search.toLowerCase();
    return store.categories
      .filter((cat) => isAdmin || !cat.hidden)
      .filter((cat) =>
        cat.name.toLowerCase().includes(q) ||
        cat.description.toLowerCase().includes(q) ||
        cat.files.some((f) => f.title.toLowerCase().includes(q))
      );
  }, [store, search, isAdmin]);

  const stats = useMemo(() => {
    const totalCategories = store.categories.length;
    const totalFiles = store.categories.reduce((sum, c) => sum + c.files.length, 0);
    const visibleFiles = store.categories.reduce((sum, c) => sum + c.files.filter(f => !f.hidden).length, 0);
    const totalPlays = store.categories.reduce((sum, c) => sum + c.files.reduce((s, f) => s + (f.plays || 0), 0), 0);
    return { totalCategories, totalFiles, visibleFiles, totalPlays };
  }, [store]);

  const featured = store.categories.flatMap((cat) =>
    cat.files
      .filter((f) => f.featured && !f.hidden && !cat.hidden)
      .map((file) => ({ ...file, categoryName: cat.name, categoryId: cat.id }))
  );

  function login() {
    if (pin === ADMIN_PIN) {
      setIsAdmin(true);
      setPage("admin");
      setStatus("Admin unlocked.");
    } else {
      setStatus("Wrong PIN.");
    }
  }

  function logout() {
    setIsAdmin(false);
    setPin("");
    setPage("home");
    setStatus("");
  }

  async function addCategory() {
    if (!newCategory.trim()) return setStatus("Category name is required.");
    await adminAction({
      action: "addCategory",
      name: newCategory,
      description: newDescription,
      color: newColor,
    }, "Category added.");
    setNewCategory("");
    setNewDescription("");
    setNewColor("cyan");
  }

  async function uploadFile(event) {
  const file = event.target.files?.[0];

  if (!file || !categoryId) {
    return setStatus("Choose a category and an MP3 file.");
  }

  if (!file.name.toLowerCase().endsWith(".mp3")) {
    return setStatus("Only MP3 files are allowed.");
  }

  try {
    setStatus("Uploading MP3... 0%");

    const blob = await upload(file.name, file, {
      access: "public",
      handleUploadUrl: "/api/upload",
      multipart: true,
      contentType: file.type || "audio/mpeg",
      onUploadProgress: ({ percentage }) => {
        setStatus(`Uploading MP3... ${Math.round(percentage)}%`);
      },
    });

    await adminAction({
      action: "uploadFile",
      categoryId,
      title: fileTitle,
      host: fileHost,
      description: fileDescription,
      fileName: file.name,
      audioUrl: blob.url,
    }, "MP3 uploaded fast.");

    setFileTitle("");
    setFileHost("");
    setFileDescription("");
    event.target.value = "";
  } catch (err) {
    setStatus("Upload failed: " + err.message);
  }
}

function EditCategoryForm({ cat, onCancel, onSave }) {
  const [name, setName] = useState(cat.name);
  const [description, setDescription] = useState(cat.description);
  const [color, setColor] = useState(cat.color || "cyan");
  return (
    <div className="editForm">
      <input value={name} onChange={(e) => setName(e.target.value)} />
      <textarea value={description} onChange={(e) => setDescription(e.target.value)} />
      <select value={color} onChange={(e) => setColor(e.target.value)}>
        {colors.map(c => <option key={c} value={c}>{c}</option>)}
      </select>
      <div className="actions">
        <button onClick={() => onSave({ name, description, color })}><Save size={16}/> Save</button>
        <button onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}

function EditFileForm({ file, categories, currentCategoryId, onCancel, onSave, onMove }) {
  const [title, setTitle] = useState(file.title);
  const [host, setHost] = useState(file.host);
  const [description, setDescription] = useState(file.description);
  const [target, setTarget] = useState(currentCategoryId);
  return (
    <div className="editForm">
      <input value={title} onChange={(e) => setTitle(e.target.value)} />
      <input value={host} onChange={(e) => setHost(e.target.value)} />
      <textarea value={description} onChange={(e) => setDescription(e.target.value)} />
      <select value={target} onChange={(e) => setTarget(e.target.value)}>
        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
      </select>
      <div className="actions">
        <button onClick={() => onSave({ title, host, description })}><Save size={16}/> Save</button>
        <button onClick={() => target !== currentCategoryId && onMove(target)}><MoveRight size={16}/> Move</button>
        <button onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}}
