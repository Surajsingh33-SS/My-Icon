#!/usr/bin/env node
/**
 * Enrich Icon Maker metadata with the official per-icon Lucide JSON descriptors.
 *
 * Usage:
 *   node scripts/enrich-icon-metadata.mjs
 *   node scripts/enrich-icon-metadata.mjs --limit 100
 *   node scripts/enrich-icon-metadata.mjs --dry-run
 *
 * Uses Node.js 18+ (built-in fetch); no npm packages required.
 */
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const METADATA_PATH = resolve(ROOT, 'icon-metadata.json');
const SOURCE_BASE = 'https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/';
const CONCURRENCY = 8;
const CHECKPOINT_EVERY = 40;
const args = new Set(process.argv.slice(2));
const limitArg = process.argv.find((arg, index, all) => arg === '--limit' && all[index + 1]);
const limit = limitArg ? Math.max(1, Number(process.argv[process.argv.indexOf('--limit') + 1]) || 1) : Infinity;
const dryRun = args.has('--dry-run');

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

async function fetchDescriptor(iconName) {
  const url = SOURCE_BASE + encodeURIComponent(iconName) + '.json';
  let lastError;
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      const response = await fetch(url, {
        headers: { 'User-Agent': 'Icon-Maker-PRO-metadata-enricher/1.0' }
      });
      if (response.status === 404) return { missing: true };
      if (!response.ok) throw new Error('HTTP ' + response.status);
      const descriptor = await response.json();
      if (!descriptor || !Array.isArray(descriptor.tags) || !Array.isArray(descriptor.categories)) {
        throw new Error('Unexpected Lucide metadata format');
      }
      return { descriptor };
    } catch (error) {
      lastError = error;
      if (attempt < 4) await sleep(350 * attempt);
    }
  }
  return { error: lastError?.message || 'Unknown fetch error' };
}

function cleanStrings(values) {
  return [...new Set((Array.isArray(values) ? values : [])
    .filter(value => typeof value === 'string')
    .map(value => value.trim())
    .filter(Boolean))];
}

function isInternalLucideMarker(value) {
  return /^\$(?:group|extends):/i.test(value.trim());
}

// Curated synonyms are deliberately concept-specific: never pad an icon with
// unrelated words just to reach a keyword count.
const SEARCH_SYNONYMS = {
  search: ["find", "lookup", "magnifier", "magnifying glass", "query", "discover", "explore", "seek", "locate", "search field", "search bar", "look up", "filter results", "find items", "quick find", "content search", "search tool", "search input", "site search"],
  settings: ["preferences", "configuration", "options", "controls", "adjustments", "customize", "customization", "setup", "system settings", "app settings", "manage settings", "tune", "configure", "gear", "cog", "tools", "administration", "control panel", "user preferences", "general settings"],
  cog: ["gear", "settings", "preferences", "configuration", "options", "controls", "adjustments", "customize", "setup", "system settings", "app settings", "tune", "configure", "control panel", "maintenance", "mechanism"],
  home: ["house", "homepage", "main page", "start page", "dashboard", "home screen", "landing page", "residence", "building", "main menu", "go home", "home navigation", "start", "front page", "household", "property", "dwelling", "main screen", "home view"],
  user: ["person", "profile", "account", "avatar", "member", "human", "individual", "contact", "user profile", "account settings", "customer", "visitor", "identity", "personal", "people", "user account", "profile picture", "sign in", "logged in"],
  users: ["people", "group", "team", "members", "community", "multiple users", "user group", "team members", "contacts", "audience", "participants", "collaborators", "profiles", "accounts", "organization"],
  heart: ["love", "like", "favorite", "favourite", "appreciate", "care", "affection", "health", "wellness", "romance", "valentine", "saved favorite", "wishlist", "liked item", "reaction", "support", "kindness", "passion", "heart rate"],
  star: ["favorite", "favourite", "rating", "bookmark", "featured", "highlight", "top rated", "review", "award", "achievement", "important", "premium", "special", "recommendation", "saved", "best", "quality", "rank", "featured item"],
  camera: ["photo", "photography", "picture", "image", "snapshot", "take photo", "capture", "camera device", "lens", "shutter", "photograph", "selfie", "photo capture", "video camera", "media", "visual", "shoot", "recording", "camera app"],
  image: ["picture", "photo", "photograph", "graphic", "visual", "illustration", "thumbnail", "picture file", "media", "gallery", "photo preview", "image file", "artwork", "visual content", "bitmap"],
  file: ["document", "paper", "attachment", "file item", "document file", "upload", "download", "file manager", "paperwork", "record", "report", "text document", "file storage", "data file", "document management"],
  folder: ["directory", "files", "collection", "file group", "folder directory", "storage", "organize files", "file manager", "documents", "archive", "workspace", "project folder", "browse files", "open folder", "folder view"],
  mail: ["email", "e-mail", "message", "inbox", "envelope", "letter", "send mail", "mailbox", "communication", "contact", "newsletter", "correspondence", "compose email", "email message", "mail app"],
  message: ["chat", "conversation", "comment", "text", "communication", "inbox", "reply", "messaging", "discussion", "direct message", "chat bubble", "send message", "talk", "speech", "correspondence"],
  phone: ["telephone", "call", "mobile", "smartphone", "contact", "dial", "voice call", "handset", "phone number", "communication", "cellphone", "call someone", "mobile device", "telephone call", "phone app"],
  calendar: ["date", "schedule", "event", "planner", "appointment", "day", "month", "year", "agenda", "calendar event", "time management", "booking", "reminder", "meeting", "calendar view", "date picker", "organizer"],
  clock: ["time", "watch", "timer", "schedule", "hour", "minute", "duration", "alarm", "stopwatch", "timepiece", "time management", "current time", "time tracking", "reminder", "clock face"],
  alarm: ["alert", "wake up", "wake-up", "reminder", "notification", "clock", "timer", "morning", "schedule", "ring", "alarm clock", "time alert", "wake", "appointment reminder", "alert clock"],
  map: ["location", "navigation", "directions", "place", "geography", "route", "map view", "street map", "destination", "mapping", "atlas", "travel", "explore map", "position", "area"],
  mapPin: ["location", "marker", "place", "destination", "map marker", "pinpoint", "address", "geotag", "position", "point of interest", "where", "location pin", "navigation marker", "map location", "coordinates"],
  pin: ["location", "marker", "pushpin", "pinned", "tack", "attach", "save place", "pin item", "bookmark", "map marker", "fixed", "important", "keep visible", "pin to top", "location marker"],
  bell: ["notification", "alert", "reminder", "announcement", "ring", "alarm", "updates", "inbox alert", "activity alert", "new message", "notice", "subscribe", "notify", "unread notification", "sound alert"],
  lock: ["secure", "security", "private", "protected", "password", "locked", "authentication", "privacy", "access control", "padlock", "safety", "restricted", "closed lock", "account security", "data protection"],
  unlock: ["open lock", "unlocked", "release", "access", "permission", "remove lock", "security", "authentication", "allow access", "unlock account", "privacy", "open", "unsecure", "lock status", "access granted"],
  shield: ["security", "protection", "safe", "defense", "privacy", "secure", "guard", "safety", "trust", "verified", "protection status", "cybersecurity", "secure access", "safeguard", "shielding"],
  check: ["done", "complete", "completed", "success", "confirm", "approved", "verified", "correct", "accept", "tick", "task complete", "mark done", "valid", "finished", "confirmation"],
  x: ["close", "cancel", "remove", "delete", "dismiss", "clear", "exit", "reject", "cross", "no", "stop", "clear input", "close dialog", "remove item", "discard"],
  plus: ["add", "create", "new", "increase", "insert", "expand", "positive", "addition", "add item", "new item", "plus sign", "append", "make", "create item", "increment"],
  minus: ["remove", "subtract", "decrease", "reduce", "collapse", "negative", "minus sign", "less", "zoom out", "remove item", "lower", "decrement", "take away", "minimize", "subtract value"],
  trash: ["delete", "remove", "bin", "recycle bin", "discard", "erase", "waste", "delete item", "remove file", "clear", "throw away", "trash can", "recycle", "delete permanently", "discard item"],
  edit: ["modify", "change", "update", "revise", "write", "pencil", "rename", "adjust", "edit item", "make changes", "alter", "correct", "customize", "editing", "change content"],
  pencil: ["edit", "write", "draw", "modify", "annotate", "compose", "revise", "change", "update", "sketch", "writing", "edit text", "make changes", "markup", "author"],
  download: ["save", "export", "get file", "retrieve", "download file", "receive", "transfer", "save locally", "import to device", "offline copy", "file download", "fetch", "pull file", "download content", "save to computer"],
  upload: ["import", "send file", "attach", "submit", "transfer", "add file", "upload file", "cloud upload", "share file", "select file", "file transfer", "send", "publish", "bring in", "add attachment"],
  share: ["send", "distribute", "forward", "collaborate", "publish", "social", "share link", "invite", "give access", "send to others", "sharing", "spread", "pass along", "share content", "collaboration"],
  link: ["url", "hyperlink", " 연결", "web address", "website", "connect", "reference", "chain", "permalink", "external link", "copy link", "linked", "connection", "web link", "anchor"],
  globe: ["world", "earth", "internet", "website", "global", "international", "planet", "web", "worldwide", "language", "network", "global access", "online", "world map", "internationalization"],
  wifi: ["wireless", "internet", "network", "connection", "wi-fi", "signal", "online", "hotspot", "connectivity", "wireless network", "internet access", "router", "wireless signal", "network status", "connect"],
  bluetooth: ["wireless", "device pairing", "pairing", "connection", "connectivity", "short range", "peripheral", "wireless device", "bluetooth connection", "device link", "headphones", "accessory", "sync device", "pair device", "radio"],
  battery: ["power", "charge", "charging", "energy", "battery level", "electricity", "device power", "low battery", "full battery", "battery status", "portable power", "recharge", "power level", "cell", "accumulator"],
  sun: ["day", "sunlight", "bright", "light", "weather", "sunny", "daytime", "solar", "brightness", "outdoor", "sunshine", "light mode", "clear sky", "sunrise", "daylight"],
  moon: ["night", "dark", "darkness", "nighttime", "sleep", "evening", "crescent", "lunar", "dark mode", "moonlight", "rest", "night mode", "space", "celestial", "bedtime"],
  cloud: ["weather", "cloudy", "forecast", "sky", "cloud storage", "online storage", "sync", "backup", "internet", "server", "upload", "download", "cloud computing", "remote storage", "data storage"],
  play: ["start", "begin", "run", "media", "video", "audio", "playback", "watch", "listen", "resume", "start playback", "play media", "launch", "stream", "continue"],
  pause: ["stop temporarily", "hold", "suspend", "media", "video", "audio", "playback", "break", "wait", "pause playback", "freeze", "interrupt", "temporarily stop", "hold on", "resume later"],
  stop: ["end", "halt", "finish", "terminate", "cancel", "media", "playback", "stop playback", "cease", "end process", "quit", "abort", "turn off", "halt action", "end task"],
  volume: ["sound", "audio", "speaker", "loudness", "music", "media", "sound level", "mute", "volume control", "audio level", "listen", "amplitude", "speaker volume", "quiet", "noise"],
  music: ["audio", "song", "sound", "track", "playlist", "listen", "melody", "music player", "media", "album", "musical", "soundtrack", "recording", "tune", "audio file"],
  video: ["movie", "film", "clip", "recording", "media", "playback", "watch", "video player", "camera", "stream", "footage", "motion picture", "visual media", "video file", "movie clip"],
  mic: ["microphone", "audio input", "voice", "record", "sound", "speech", "dictation", "voice recording", "talk", "audio capture", "mute microphone", "podcast", "voice chat", "input device", "sound recording"],
  microphone: ["mic", "audio input", "voice", "record", "sound", "speech", "dictation", "voice recording", "talk", "audio capture", "mute microphone", "podcast", "voice chat", "input device", "sound recording"],
  cart: ["shopping cart", "basket", "checkout", "purchase", "buy", "store", "ecommerce", "add to cart", "shopping", "order", "retail", "goods", "products", "cart items", "payment"],
  shopping: ["store", "shop", "retail", "ecommerce", "buy", "purchase", "checkout", "basket", "cart", "products", "goods", "marketplace", "online store", "order", "shopping bag"],
  wallet: ["money", "payment", "finance", "cash", "funds", "account", "digital wallet", "card holder", "currency", "spending", "balance", "pay", "personal finance", "wallet app", "transactions"],
  credit: ["payment", "bank card", "credit card", "finance", "money", "purchase", "billing", "checkout", "debit", "account", "card payment", "transaction", "payment method", "card details", "charge"],
  chart: ["graph", "analytics", "statistics", "data", "report", "visualization", "metrics", "dashboard", "performance", "trend", "diagram", "business intelligence", "data analysis", "progress", "figures"],
  graph: ["chart", "analytics", "statistics", "data", "report", "visualization", "metrics", "dashboard", "performance", "trend", "diagram", "data analysis", "business intelligence", "progress", "figures"],
  code: ["programming", "developer", "development", "source code", "software", "script", "coding", "terminal", "syntax", "repository", "engineering", "web development", "computer science", "debug", "markup"],
  terminal: ["command line", "console", "shell", "cli", "command prompt", "developer", "coding", "commands", "programming", "script", "run command", "computer", "system", "development tool", "text console"],
  database: ["data", "storage", "server", "records", "sql", "table", "backend", "data store", "database server", "information", "query", "structured data", "repository", "data management", "cloud database"],
  key: ["password", "access", "security", "authentication", "unlock", "credential", "secret", "license", "encryption", "keychain", "permission", "login", "private key", "access key", "digital key"],
  eye: ["view", "visible", "visibility", "preview", "watch", "see", "show", "display", "look", "eye view", "show content", "visibility toggle", "inspect", "visual", "view details"],
  filter: ["sort", "refine", "narrow", "筛选", "search filter", "criteria", "options", "facets", "filter results", "organize", "selection", "refine results", "limit results", "view options", "data filtering"],
  sliders: ["controls", "adjustments", "preferences", "tune", "settings", "configuration", "options", "customize", "levels", "parameters", "fine tune", "control panel", "adjust values", "filter controls", "mixing"],
  menu: ["navigation", "hamburger", "options", "more", "list", "sidebar", "navigation menu", "main menu", "open menu", "app menu", "menu button", "site navigation", "commands", "actions", "menu options"],
  list: ["items", "bullets", "rows", "checklist", "tasks", "collection", "ordered list", "unordered list", "menu", "entries", "records", "list view", "content list", "item list", "organize"],
  grid: ["tiles", "layout", "matrix", "gallery", "squares", "columns", "grid view", "tile view", "arrangement", "dashboard", "cards", "items layout", "table layout", "visual layout", "collection"],
  tag: ["label", "category", "keyword", "hashtag", "classification", "metadata", "mark", "identifier", "topic", "organize", "tagging", "content label", "filter tag", "bookmark", "annotation"],
  bookmark: ["save", "favorite", "favourite", "mark", "reading list", "saved item", "collection", "remember", "keep", "reference", "web page", "saved page", "later", "important", "bookmark page"],
  flag: ["mark", "report", "country", "banner", "signal", "indicator", "priority", "label", "alert", "bookmark", "status", "flag item", "identify", "milestone", "notice"],
  printer: ["print", "printing", "paper", "document", "hard copy", "print page", "printer device", "office", "output", "print document", "print job", "paper output", "printer settings", "physical copy", "print preview"],
  building: ["office", "company", "business", "workplace", "property", "architecture", "construction", "institution", "organization", "corporate", "commercial building", "facility", "location", "real estate", "structure"],
  car: ["vehicle", "automobile", "transport", "driving", "road", "travel", "transportation", "motorcar", "traffic", "ride", "car travel", "vehicle icon", "auto", "commute", "parking"],
  bike: ["bicycle", "cycling", "cycle", "transport", "ride", "pedal", "commute", "vehicle", "bike riding", "sports", "outdoor", "two wheels", "cycling route", "biker", "transportation"],
  plane: ["airplane", "aircraft", "flight", "aviation", "travel", "airport", "air travel", "jet", "departure", "arrival", "airline", "transport", "flying", "trip", "transportation"],
  train: ["railway", "rail", "locomotive", "transit", "transport", "commute", "station", "public transport", "metro", "subway", "rail travel", "journey", "passenger train", "travel", "transportation"],
  food: ["meal", "cooking", "cuisine", "restaurant", "dish", "eat", "dining", "recipe", "kitchen", "food item", "snack", "ingredient", "grocery", "menu", "nutrition"],
  coffee: ["tea", "cafe", "caffeine", "drink", "beverage", "espresso", "cup", "hot drink", "coffee shop", "morning", "breakfast", "latte", "brew", "coffee break", "refreshment"],
  book: ["reading", "library", "pages", "literature", "publication", "education", "study", "textbook", "ebook", "knowledge", "read", "booklet", "document", "learning", "reference"],
  graduation: ["education", "school", "university", "college", "degree", "learning", "student", "academic", "study", "graduation cap", "diploma", "course", "class", "campus", "achievement"],
  briefcase: ["work", "business", "office", "career", "job", "professional", "employment", "portfolio", "luggage", "business case", "work bag", "corporate", "workplace", "documents", "occupation"],
  wrench: ["tool", "repair", "maintenance", "fix", "mechanic", "hardware", "adjust", "settings", "engineering", "equipment", "hand tool", "service", "construction", "technical", "workshop"],
  hammer: ["tool", "construction", "building", "repair", "carpentry", "nail", "hardware", "workshop", "hand tool", "DIY", "craft", "maintenance", "woodworking", "equipment", "builder"],
  paint: ["color", "palette", "art", "design", "drawing", "brush", "painting", "creative", "illustration", "visual design", "artwork", "coloring", "graphics", "sketch", "canvas"],
  palette: ["colors", "color picker", "art", "design", "paint", "painting", "creative", "graphics", "theme", "color scheme", "swatches", "visual design", "illustration", "drawing", "art supplies"],
  text: ["typography", "font", "writing", "lettering", "copy", "words", "content", "text editing", "paragraph", "character", "type", "text format", "document", "editor", "written content"],
  type: ["typography", "font", "text", "lettering", "writing", "words", "character", "text style", "typeface", "font family", "text editing", "formatting", "document", "design", "letter"],
  a: ["letter a", "alphabet", "character", "typography", "text", "font", "letter", "writing", "capital letter", "uppercase", "lowercase", "text formatting", "typeface", "glyph", "alphabetic"],
  accessibility: ["inclusive design", "assistive technology", "a11y", "access", "disability", "screen reader", "usability", "accessible", "universal design", "accommodation", "inclusive", "accessibility settings", "human interface", "mobility", "support"],
  activity: ["health", "fitness", "exercise", "movement", "pulse", "heart rate", "tracking", "performance", "analytics", "workout", "vitals", "monitoring", "progress", "steps", "wellness"],
  arrow: ["direction", "navigate", "movement", "pointer", "directional", "go", "next", "previous", "navigation", "move", "indicate direction", "direction sign", "arrow key", "flow", "transition"],
  circle: ["round", "circular", "shape", "ring", "round shape", "geometry", "ellipse", "outline", "dot", "cycle", "loop", "badge", "status indicator", "round button", "geometric"],
  square: ["rectangle", "quadrilateral", "shape", "box", "tile", "frame", "geometric", "four sides", "square shape", "outline", "container", "block", "card", "panel", "grid cell"],
  triangle: ["shape", "polygon", "three sides", "geometry", "warning", "direction", "play", "arrowhead", "geometric", "triangle shape", "point", "angle", "symbol", "sign", "three corner"],
  cloudRain: ["rain", "rainy", "weather", "shower", "precipitation", "forecast", "storm", "cloudburst", "wet weather", "rainfall", "drizzle", "umbrella weather", "cloudy rain", "weather report", "climate"],
  thermometer: ["temperature", "heat", "cold", "weather", "degree", "climate", "thermostat", "fever", "measurement", "hot", "cool", "temperature gauge", "body temperature", "forecast", "thermometer reading"],
  thermometerSun: ["hot", "heat", "temperature", "sunny", "weather", "climate", "warm", "high temperature", "heatwave", "summer", "thermometer", "temperature gauge", "forecast", "sunshine", "hot weather"],
  leaf: ["nature", "plant", "green", "eco", "environment", "organic", "sustainability", "botanical", "herbal", "foliage", "garden", "growth", "ecology", "natural", "leaflet"],
  tree: ["nature", "forest", "woodland", "plant", "outdoors", "environment", "tree", "garden", "wood", "ecology", "landscape", "park", "growth", "evergreen", "nature reserve"],
  flower: ["blossom", "plant", "nature", "floral", "garden", "bloom", "botanical", "petal", "spring", "decoration", "flowering", "ornament", "rose", "nature", "bouquet"],
  dog: ["pet", "puppy", "animal", "canine", "pet care", "domestic animal", "paw", "veterinary", "mammal", "dog breed", "companion", "wildlife", "animal care", "pet profile", "dog lover"],
  cat: ["kitten", "pet", "animal", "feline", "pet care", "domestic animal", "paw", "veterinary", "mammal", "cat breed", "companion", "animal care", "pet profile", "cat lover", "whiskers"],
  heartPulse: ["heartbeat", "pulse", "health", "medical", "cardiology", "vitals", "heart rate", "monitoring", "ECG", "wellness", "medical check", "healthcare", "fitness tracker", "cardiac", "patient monitoring"],
  line: ["stroke", "rule", "divider", "separator", "line segment", "straight line", "border", "outline", "path", "connector", "guide", "axis", "draw line", "horizontal rule", "vertical rule"],
  dot: ["point", "bullet", "circle", "marker", "indicator", "status", "status light", "small circle", "list bullet", "separator", "ellipsis", "location point", "anchor point", "round mark", "punctuation"],
  point: ["dot", "marker", "location", "position", "coordinate", "anchor", "endpoint", "control point", "reference point", "spot", "node", "vertex", "indicator", "map point", "data point"],
  letter: ["alphabet", "character", "typography", "font", "text", "glyph", "writing", "uppercase", "lowercase", "initial", "letterform", "typeface", "text character", "alphabetic", "monogram"],
  vertical: ["upright", "portrait", "top to bottom", "height", "column", "standing", "vertical alignment", "vertical layout", "y axis", "tall", "up and down", "stacked", "vertical position", "orientation", "perpendicular"],
  horizontal: ["landscape", "left to right", "width", "row", "horizontal alignment", "horizontal layout", "x axis", "wide", "side by side", "across", "level", "orientation", "horizontal position", "parallel", "flat"],
  badge: ["label", "tag", "pill", "status", "counter", "notification count", "marker", "award", "achievement", "rank", "sticker", "identifier", "category label", "status indicator", "count"],
  book: ["reading", "library", "pages", "literature", "publication", "education", "study", "textbook", "ebook", "knowledge", "read", "booklet", "document", "learning", "reference"],
  panel: ["pane", "sidebar", "section", "window", "drawer", "workspace", "interface", "layout", "container", "view", "control panel", "content area", "split view", "screen section", "dialog"],
  pen: ["write", "writing", "edit", "draw", "ink", "signature", "annotation", "sketch", "author", "markup", "handwriting", "compose", "modify", "pencil", "stylus"],
  git: ["version control", "repository", "branch", "commit", "merge", "source control", "developer", "code management", "software development", "pull request", "git workflow", "revision", "history", "collaboration", "code repository"],
  exclamation: ["warning", "alert", "caution", "attention", "important", "notice", "error", "urgent", "risk", "information", "emphasis", "notification", "problem", "issue", "warning sign"],
  question: ["help", "support", "faq", "information", "unknown", "query", "ask", "guidance", "question mark", "assistance", "documentation", "troubleshooting", "inquiry", "learn more", "help center"],
  clipboard: ["copy", "paste", "board", "notes", "checklist", "tasks", "form", "document", "clipboard manager", "temporary storage", "to do", "records", "office", "paperwork", "capture"],
  database: ["data", "storage", "server", "records", "sql", "table", "backend", "data store", "database server", "information", "query", "structured data", "repository", "data management", "cloud database"],
  scan: ["scanner", "scanning", "detect", "read", "capture", "document scan", "qr code", "barcode", "recognition", "inspection", "analyze", "image capture", "digitize", "identify", "scan document"],
  package: ["box", "parcel", "shipping", "delivery", "container", "product", "shipment", "package tracking", "wrapped item", "goods", "warehouse", "logistics", "mail", "carton", "bundle"],
  mouse: ["cursor", "pointer", "computer mouse", "click", "input device", "computer", "desktop", "navigation", "select", "pointing device", "track", "scroll", "mouse control", "hardware", "peripheral"],
  receipt: ["invoice", "bill", "payment", "purchase", "transaction", "proof of purchase", "order", "checkout", "expense", "billing", "sales", "accounting", "payment record", "cash register", "store"],
  archive: ["storage", "backup", "zip", "compressed", "folder", "files", "preserve", "history", "records", "repository", "collection", "old files", "file storage", "archive box", "compressed file"],
  copy: ["duplicate", "clone", "clipboard", "paste", "replicate", "reproduce", "copy item", "copy text", "document", "content", "make a copy", "duplicate file", "transfer", "reuse", "clipboard action"],
  sync: ["synchronize", "refresh", "update", "repeat", "backup", "cloud", "transfer", "keep updated", "two way", "data sync", "replicate", "connected", "reload", "match", "synchronization"],
  power: ["on off", "switch", "shutdown", "start", "stop", "energy", "electricity", "device power", "power button", "turn on", "turn off", "restart", "sleep", "standby", "control"],
  link: ["url", "hyperlink", "web address", "website", "connect", "reference", "chain", "permalink", "external link", "copy link", "linked", "connection", "web link", "anchor", "association"],
  sparkles: ["magic", "shine", "glitter", "effect", "special", "new", "featured", "AI", "enhance", "beautify", "decoration", "twinkle", "stars", "highlight", "sparkle effect"],
  layers: ["stack", "overlap", "order", "arrangement", "design", "graphics", "image layers", "layer panel", "depth", "composition", "objects", "elements", "z order", "group", "structure"],
  table: ["grid", "rows", "columns", "spreadsheet", "data", "cells", "records", "database", "matrix", "tabular", "schedule", "comparison", "table view", "organize data", "worksheet"],
  card: ["panel", "tile", "container", "content block", "interface", "layout", "dashboard", "widget", "product card", "profile card", "payment card", "information", "component", "box", "section"],
  door: ["entrance", "exit", "entry", "gateway", "room", "open", "close", "access", "doorway", "interior", "building", "house", "entryway", "passage", "threshold"],
  lamp: ["light", "lighting", "bulb", "illumination", "desk lamp", "interior", "home", "brightness", "electric", "decor", "room light", "fixture", "idea", "night light", "lamp shade"],
  server: ["hosting", "backend", "computer", "data center", "network", "cloud", "infrastructure", "database", "hardware", "system", "web server", "storage", "computing", "machine", "rack"],
  smartphone: ["mobile", "phone", "cellphone", "device", "handset", "touchscreen", "mobile device", "app", "communication", "portable", "android", "ios", "screen", "telephone", "wireless device"],
  layers: ["stack", "overlap", "order", "arrangement", "design", "graphics", "image layers", "layer panel", "depth", "composition", "objects", "elements", "z order", "group", "structure"]

const CATEGORY_SEARCH_TERMS = {
  accessibility: ["inclusive", "assistive", "accessible", "usability", "a11y"],
  account: ["account", "profile", "identity", "member", "personal settings"],
  animals: ["animal", "wildlife", "pet", "creature"],
  arrows: ["direction", "navigation", "movement", "orientation"],
  buildings: ["building", "architecture", "property", "facility"],
  charts: ["chart", "graph", "analytics", "statistics", "data visualization"],
  communication: ["communication", "message", "contact", "conversation"],
  connectivity: ["connection", "network", "wireless", "online"],
  cursors: ["pointer", "selection", "mouse", "click"],
  design: ["design", "creative", "graphics", "visual"],
  development: ["developer", "programming", "coding", "software"],
  devices: ["device", "hardware", "technology", "electronics"],
  files: ["file", "document", "attachment", "storage"],
  finance: ["finance", "money", "payment", "currency"],
  food: ["food", "meal", "cooking", "dining"],
  "food-beverage": ["food", "drink", "beverage", "cooking"],
  home: ["home", "household", "domestic", "interior"],
  layout: ["layout", "arrangement", "alignment", "structure"],
  mail: ["email", "mail", "inbox", "message"],
  medical: ["medical", "health", "healthcare", "wellness"],
  multimedia: ["media", "audio", "video", "visual"],
  nature: ["nature", "outdoors", "environment", "plant"],
  navigation: ["navigation", "direction", "route", "location"],
  notifications: ["notification", "alert", "reminder", "notice"],
  people: ["person", "people", "profile", "user"],
  photography: ["photo", "camera", "image", "picture"],
  science: ["science", "research", "experiment", "laboratory"],
  security: ["security", "privacy", "protection", "secure"],
  shapes: ["shape", "geometry", "outline", "form"],
  shopping: ["shopping", "store", "retail", "purchase"],
  social: ["social", "community", "sharing", "network"],
  sports: ["sport", "fitness", "exercise", "game"],
  text: ["text", "typography", "font", "writing"],
  time: ["time", "clock", "schedule", "duration"],
  tools: ["tool", "utility", "equipment", "settings"],
  transportation: ["transport", "vehicle", "travel", "transit"],
  travel: ["travel", "trip", "journey", "destination"],
  weather: ["weather", "forecast", "climate", "temperature"]
};

const HIGH_POPULARITY_TOKENS = new Set([
  "home", "user", "users", "search", "settings", "cog", "heart", "star", "camera",
  "image", "file", "folder", "mail", "message", "phone", "calendar", "clock",
  "map", "map-pin", "bell", "lock", "check", "plus", "minus", "trash", "edit",
  "download", "upload", "share", "menu", "arrow", "eye", "filter", "grid", "list"
]);

function normalizeSearchTerm(value) {
  return String(value || "").toLowerCase().trim()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .replace(/[^\p{L}\p{N} ]/gu, "");
}

function buildSearchTerms(name, descriptor, oldAi = {}) {
  const aliases = (descriptor.aliases || [])
    .map(alias => typeof alias === "string" ? alias : alias?.name || alias?.alias || "")
    .filter(Boolean);
  const useCases = cleanStrings(descriptor["use-cases"]);
  const tags = cleanStrings(descriptor.tags);
  const categories = cleanStrings(descriptor.categories);
  const nameTokens = name.toLowerCase().split(/[-_]+/).filter(Boolean);
  const candidates = [
    ...cleanStrings(oldAi.searchTerms),
    ...tags,
    ...aliases,
    ...useCases,
    name.replace(/[-_]/g, " "),
    ...nameTokens
  ];

  // Add only synonyms attached to the icon's own name, official tags, or aliases.
  const lookupTokens = new Set([
    ...nameTokens,
    ...tags.map(normalizeSearchTerm),
    ...aliases.map(normalizeSearchTerm)
  ]);
  for (const token of lookupTokens) {
    const compact = token.replace(/\s+/g, "");
    const synonyms = SEARCH_SYNONYMS[token] || SEARCH_SYNONYMS[compact] || [];
    candidates.push(...synonyms);
  }

  // Direction words become useful search phrases only for directional/transform icons.
  const directionalIcon = /(?:arrow|chevron|move|align|indent|outdent|sort|trend|corner|rotate|turn|navigation)/i.test(name);
  if (directionalIcon) {
    const directionTerms = {
      up: ["upward", "upwards", "top", "north", "increase", "raise", "move up", "go up"],
      down: ["downward", "downwards", "bottom", "south", "decrease", "lower", "move down", "go down"],
      left: ["leftward", "leftwards", "west", "move left", "go left", "previous direction"],
      right: ["rightward", "rightwards", "east", "move right", "go right", "next direction"]
    };
    for (const direction of nameTokens) candidates.push(...(directionTerms[direction] || []));
  }

  // Categories contribute a few broad but relevant discovery terms.
  for (const category of categories) {
    candidates.push(...(CATEGORY_SEARCH_TERMS[category] || []));
  }

  const result = [];
  const seen = new Set();
  for (const value of candidates) {
    const term = normalizeSearchTerm(value);
    if (!term || term.length < 2 || term === normalizeSearchTerm(name) ||
        /^\$(group|extends):/i.test(String(value))) continue;
    if (!seen.has(term)) {
      seen.add(term);
      result.push(term);
    }
  }

  const isPopular = nameTokens.some(token => HIGH_POPULARITY_TOKENS.has(token)) ||
    HIGH_POPULARITY_TOKENS.has(name.toLowerCase());
  const target = isPopular ? 30 : (categories.length > 1 || tags.length >= 8 ? 22 : 15);

  // Prefer high-signal source terms and curated synonyms. Do not fabricate filler
  // such as "icon", "graphic", or "button" to hit the target.
  return result.slice(0, Math.min(30, Math.max(target, Math.min(result.length, 15))));
}
function buildDescription(name, descriptor, oldAi = {}) {
  const useCases = cleanStrings(descriptor['use-cases'])
    .filter(value => !isInternalLucideMarker(value));

  const tags = cleanStrings(descriptor.tags)
    .filter(tag => !isInternalLucideMarker(tag));

  // Prefer contributor-authored use cases.
  if (useCases.length) return useCases.slice(0, 3).join('; ');

  // Otherwise use meaningful official tags.
  if (tags.length) {
    return name.replace(/[-_]/g, ' ') +
      ': ' + tags.slice(0, 12).join(', ');
  }

  const oldDescription = typeof oldAi.description === 'string'
    ? oldAi.description.trim()
    : '';

  if (oldDescription && !isInternalLucideMarker(oldDescription)) {
    return oldDescription;
  }

  return name.replace(/[-_]/g, ' ');
}
let saveQueue = Promise.resolve();
function queueSave(data) {
  saveQueue = saveQueue.then(() => writeFile(METADATA_PATH, JSON.stringify(data, null, 2) + '\n', 'utf8'));
  return saveQueue;
}

async function main() {
  const metadata = JSON.parse(await readFile(METADATA_PATH, 'utf8'));
  const names = Object.keys(metadata).sort();
  const targets = names.slice(0, limit);
  let success = 0;
  let missing = 0;
  let failed = 0;
  let processed = 0;
  let cursor = 0;

  console.log('Lucide metadata enrichment');
  console.log('Icons in file: ' + names.length + ' | selected: ' + targets.length);
  console.log('Source: official Lucide per-icon JSON descriptors');
  if (dryRun) console.log('Dry run: files will not be changed.');

  async function worker() {
    while (true) {
      const index = cursor++;
      if (index >= targets.length) return;
      const name = targets[index];
      const result = await fetchDescriptor(name);
      const old = metadata[name] || {};
      const oldLucide = old.lucide || {};
      const oldAi = old.ai || {};

      if (result.descriptor) {
        const descriptor = result.descriptor;
        const aliases = Array.isArray(descriptor.aliases) ? descriptor.aliases : [];
        const useCases = cleanStrings(descriptor['use-cases']);
        metadata[name] = {
          ...old,
          lucide: {
            ...oldLucide,
            tags: cleanStrings(descriptor.tags),
            aliases,
            categories: cleanStrings(descriptor.categories),
            useCases,
            contributors: cleanStrings(descriptor.contributors),
            deprecated: Boolean(descriptor.deprecated)
          },
          ai: {
            ...oldAi,
            description: buildDescription(name, descriptor, oldAi),
            searchTerms: buildSearchTerms(name, descriptor, oldAi)
          },
          metadataSource: 'lucide-icons/lucide',
          metadataFetchedAt: new Date().toISOString()
        };
        success++;
      } else if (result.missing) {
        missing++;
        // Keep the existing record untouched when Lucide has no descriptor.
      } else {
        failed++;
        console.warn('Failed: ' + name + ' (' + result.error + ')');
      }

      processed++;
      if (processed % 25 === 0 || processed === targets.length) {
        console.log('Progress: ' + processed + '/' + targets.length +
          ' | enriched ' + success + ' | no descriptor ' + missing + ' | failed ' + failed);
      }
      if (!dryRun && processed % CHECKPOINT_EVERY === 0) await queueSave(metadata);
    }
  }

  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, targets.length) }, worker));
  if (!dryRun) await queueSave(metadata);

  const enrichedCount = Object.values(metadata).filter(item =>
    item?.metadataSource === 'lucide-icons/lucide' &&
    item?.lucide?.tags?.length
  ).length;

  console.log('\nFinished.');
  console.log('Enriched this run: ' + success);
  console.log('Missing official descriptors: ' + missing);
  console.log('Fetch failures (safe to rerun): ' + failed);
  console.log('Total records with official metadata: ' + enrichedCount + '/' + names.length);
  if (failed) console.log('Run the same command again to retry failed icons.');
  if (dryRun) console.log('Dry run complete; no files were written.');
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
