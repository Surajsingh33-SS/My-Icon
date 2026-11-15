/* Shared Icon Maker PRO categorization engine.
 * Used by the main app, batch review, and the AI test page.
 * It combines curated metadata evidence with optional semantic embedding scores.
 */
(function (root) {
  "use strict";

  const VERSION = 4;
  const STOP_WORDS = new Set([
    "icon","icons","the","and","for","with","from","into","that","this","these","those",
    "are","was","were","has","have","had","its","your","their","can","use","used","using",
    "symbol","symbols","represent","representing","related","type","types","such","like",
    "application","interface","visual","element","elements","object","objects","item","items"
  ]);

  const OFFICIAL_CATEGORY_MAP = {
    accessibility:"Accessibility", account:"Accounts & access", accounts:"Accounts & access",
    animals:"Animals", arrows:"Arrows", buildings:"Buildings", charts:"Charts",
    communication:"Communication", connectivity:"Connectivity", cursors:"Cursors",
    design:"Design", development:"Coding & development", coding:"Coding & development",
    devices:"Devices", emoji:"Emoji", files:"File icons", file:"File icons",
    finance:"Finance", food:"Food & beverage", "food beverage":"Food & beverage",
    "food-beverage":"Food & beverage", gaming:"Gaming", home:"Home", layout:"Layout",
    letters:"Letters & digits", "letters digits":"Letters & digits",
    "letters-digits":"Letters & digits", mail:"Mail", math:"Mathematics",
    mathematics:"Mathematics", medical:"Medical", multimedia:"Multimedia", nature:"Nature",
    navigation:"Navigation & places", notifications:"Notifications", people:"People",
    photography:"Photography", science:"Science", seasons:"Seasons", security:"Security",
    shapes:"Shapes", shopping:"Shopping", social:"Social", sports:"Sports",
    sustainability:"Sustainability", text:"Text formatting", "text formatting":"Text formatting",
    time:"Time & calendar", tools:"Tools", transportation:"Transportation",
    travel:"Travel", weather:"Weather"
  };

  // Extra concepts extend Lucide tags without replacing or narrowing its metadata.
  const EXTRA_TERMS = {
    "Accessibility":["accessibility","wheelchair","hearing aid","blindness","screen reader","assistive technology","captions","braille"],
    "Accounts & access":["user","account","profile","avatar","login","logout","password","credential","identity","authentication","authorization","fingerprint","verification","contact"],
    "Animals":["animal","cat","dog","bird","fish","paw","rabbit","bug","butterfly","turtle","horse","fox","wolf","wildlife","pet","insect","footprint"],
    "Arrows":["arrow","chevron","direction","undo","redo","rotate","refresh","repeat","reply","turn","move","swap","shuffle","redirect"],
    "Buildings":["building","hospital","school","office","factory","church","castle","warehouse","bridge","house","storefront","construction"],
    "Charts":["chart","graph","bar chart","pie chart","trending","analytics","statistics","dashboard","data visualization","histogram","plot"],
    "Communication":["message","chat","comment","conversation","phone","call","speech","microphone","announcement","broadcast","mail","discussion"],
    "Connectivity":["wifi","bluetooth","signal","network","router","antenna","connection","radio","ethernet","wireless","internet","link"],
    "Cursors":["cursor","pointer","mouse pointer","click","hand pointer","select","drag","selection","touch"],
    "Design":["palette","paint","brush","pen tool","ruler","pencil","draft","vector","swatch","artwork","illustration","color picker","layers"],
    "Coding & development":["code","terminal","bug","git","braces","brackets","variable","function","database","server","binary","command","programming","developer","api","debug"],
    "Devices":["computer","monitor","laptop","desktop","tablet","smartphone","mobile","keyboard","mouse","printer","watch","hardware","screen"],
    "Emoji":["smile","smiley","frown","laugh","angry","heart eyes","meh","emoji","face","expression","reaction"],
    "File icons":["file","folder","document","clipboard","archive","attachment","paperclip","directory","download","upload","page","spreadsheet"],
    "Finance":["wallet","money","cash","coin","bank","credit card","dollar","currency","receipt","bitcoin","piggy bank","payment","invoice","budget"],
    "Food & beverage":["food","coffee","cup","pizza","burger","cake","apple","carrot","beer","wine","utensils","restaurant","drink","bottle","meal"],
    "Gaming":["gamepad","game","joystick","dice","chess","controller","puzzle","arcade","console","playing card"],
    "Home":["home","house","sofa","bed","lamp","door","window","refrigerator","couch","furniture","kitchen","bathroom"],
    "Layout":["layout","columns","rows","grid","panel","sidebar","align","gallery","table","split view","dashboard","window"],
    "Letters & digits":["letter","alphabet","number","digit","type","uppercase","lowercase","character","punctuation"],
    "Mail":["mail","email","inbox","envelope","send","forward","reply all","mailbox","newsletter","postal"],
    "Mathematics":["plus","minus","divide","multiply","equals","percent","infinity","calculator","sigma","pi","square root","equation"],
    "Medical":["medical","health","hospital","pill","medicine","stethoscope","syringe","thermometer","bandage","heart pulse","first aid","patient"],
    "Multimedia":["play","pause","stop","audio","video","music","volume","speaker","headphones","film","recording","media player"],
    "Nature":["tree","flower","leaf","plant","forest","mountain","earth","globe","seedling","river","ocean","landscape","outdoors"],
    "Navigation & places":["map","map pin","location","compass","navigation","pin","landmark","signpost","route","destination","globe"],
    "Notifications":["bell","notification","alert","alarm","warning","reminder","badge","announcement","attention","unread"],
    "People":["user","users","people","person","man","woman","child","baby","group","team","smile","family","community"],
    "Photography":["camera","image","photo","picture","aperture","focus","scan","lens","shutter","snapshot","album"],
    "Science":["flask","atom","microscope","telescope","dna","molecule","beaker","test tube","laboratory","experiment","chemistry","physics"],
    "Seasons":["spring","summer","autumn","fall","winter","seasonal","snowflake","blossom"],
    "Security":["shield","lock","unlock","security","safe","fingerprint","scan face","privacy","protection","encryption","key","firewall"],
    "Shapes":["circle","square","triangle","rectangle","hexagon","polygon","shape","pentagon","octagon","diamond","ellipse","geometry"],
    "Shopping":["cart","shopping","bag","basket","store","tag","barcode","package","checkout","purchase","retail","delivery"],
    "Social":["share","social","heart","thumbs up","thumbs down","like","follow","hashtag","friend","community","reaction"],
    "Sports":["football","basketball","soccer","tennis","trophy","medal","volleyball","baseball","racket","ball","athletic"],
    "Sustainability":["recycle","recycling","eco","sustainability","solar","wind","renewable","environment","climate","electric vehicle"],
    "Text formatting":["bold","italic","underline","strikethrough","align left","align center","align right","list","heading","type","font","paragraph"],
    "Time & calendar":["clock","calendar","timer","hourglass","watch","history","stopwatch","date","schedule","deadline","alarm"],
    "Tools":["tool","wrench","hammer","screwdriver","settings","sliders","cog","gear","repair","maintenance","adjustment"],
    "Transportation":["car","bus","train","truck","bicycle","bike","plane","ship","taxi","motorcycle","vehicle","traffic"],
    "Travel":["suitcase","luggage","passport","ticket","hotel","tent","backpack","boarding pass","tourism","journey","camping"],
    "Weather":["sun","moon","cloud","rain","snow","wind","storm","cloudy","sunrise","sunset","lightning","temperature","forecast"]
  };

  const CATEGORY_DESCRIPTIONS = {
    "Accessibility":"Accessible interfaces and inclusive technology: wheelchair symbols, hearing assistance, visual assistance, screen readers, braille, captions and assistive controls.",
    "Accounts & access":"User accounts and identity access: profiles, avatars, account settings, sign in, sign out, registration, credentials and verification.",
    "Animals":"Living animals and creatures: cats, dogs, birds, fish, insects, reptiles, mammals, animal footprints, wildlife and pets.",
    "Arrows":"Directional arrows and movement: arrowheads, chevrons, curved arrows, double arrows, rotation, undo, redo and directional navigation.",
    "Buildings":"Physical buildings and structures: houses, skyscrapers, offices, schools, hospitals, factories, bridges and architecture.",
    "Charts":"Numerical information and data visualization: bar charts, pie charts, line graphs, analytics, statistics, trends, dashboards and reports.",
    "Communication":"People communicating: speech bubbles, chat bubbles, conversations, telephone calls, message exchanges, microphones and announcements.",
    "Connectivity":"Connections between electronic devices and networks: Wi-Fi, Bluetooth, network nodes, antennas, wireless signals, cables and internet connections.",
    "Cursors":"Computer input pointers and pointer actions: mouse cursors, hand pointers, clicking hands, text selection, dragging and selection pointers.",
    "Design":"Creating and editing visual artwork: paint brushes, palettes, pencils, drawing tools, color pickers, illustration, vector drawing and creative editing.",
    "Coding & development":"Software programming and technical development: code brackets, editors, source files, terminals, commands, debugging, databases, repositories and APIs.",
    "Devices":"Physical electronic hardware: desktop computers, laptops, smartphones, tablets, monitors, keyboards, printers, hard drives and peripherals.",
    "Emoji":"Facial expressions and emotional reactions: smiley faces, laughing faces, winking faces, angry faces, surprised expressions and reactions.",
    "File icons":"Digital files and document storage: paper documents, file pages, folders, file extensions, attachments, archives, uploads, downloads and document management.",
    "Finance":"Money and financial transactions: banknotes, coins, currency symbols, banks, credit cards, wallets, payment terminals, budgets and accounting.",
    "Food & beverage":"Food, ingredients and drinks: fruits, vegetables, meals, bread, cakes, cooking utensils, cups, bottles, restaurants and kitchen equipment.",
    "Gaming":"Video games and game-related objects: controllers, joysticks, consoles, dice, chess pieces, playing cards, puzzles and arcade games.",
    "Home":"Household living spaces and domestic objects: houses, sofas, beds, chairs, lamps, tables, cabinets, kitchens and appliances.",
    "Layout":"Arrangement of interface elements and page content: grids, columns, rows, sidebars, panels, split views, alignment guides, windows and dashboards.",
    "Letters & digits":"Written characters: alphabet letters, uppercase and lowercase characters, numerals, digits, punctuation and alphanumeric symbols.",
    "Mail":"Electronic and physical mail delivery: envelopes, email messages, inboxes, mailboxes, postal letters, attachments and sending or receiving.",
    "Mathematics":"Mathematical concepts and calculations: plus, minus, multiplication, division, equations, fractions, square roots, formulas and arithmetic.",
    "Medical":"Healthcare and medical treatment: medical crosses, stethoscopes, pills, capsules, syringes, bandages, medical equipment and patient care.",
    "Multimedia":"Playing, recording and controlling audio or video: play, pause, stop, music notes, speakers, headphones, volume controls and video screens.",
    "Nature":"Plants and natural landscapes: trees, leaves, flowers, grass, forests, mountains, hills, rivers, oceans and natural scenery.",
    "Navigation & places":"Finding and identifying geographic locations: map pins, location markers, compasses, maps, globes, landmarks, routes and destinations.",
    "Notifications":"Application alerts and updates: notification bells, ringing bells, alert badges, unread indicators, warnings, reminders and announcements.",
    "People":"Human beings and groups: human silhouettes, head and shoulders, groups, families, teams, crowds, people standing and people sitting.",
    "Photography":"Capturing and handling photographs: cameras, lenses, viewfinders, shutters, images, photo capture, focus frames, albums and scanning.",
    "Science":"Scientific research and laboratory work: microscopes, flasks, test tubes, beakers, atoms, molecules, DNA, experiments and scientific equipment.",
    "Seasons":"The four seasons and seasonal events: spring flowers, summer sunshine, autumn leaves, falling leaves, winter snowflakes and seasonal changes.",
    "Security":"Protection, privacy and safeguarding information: shields, shield checks, padlocks, keys, fingerprints, secure barriers and verification.",
    "Shapes":"Basic geometric forms and abstract geometry: circles, squares, rectangles, triangles, diamonds, polygons and geometric outlines.",
    "Shopping":"Retail stores and purchasing products: shopping carts, baskets, bags, price tags, packages, checkout counters, merchandise and purchases.",
    "Social":"Social networks and sharing between users: sharing symbols, social profiles, followers, likes, thumbs up, reactions and community interactions.",
    "Sports":"Athletic activities and sporting equipment: balls, rackets, bats, trophies, medals, running, cycling, competitions and sports teams.",
    "Sustainability":"Environmental care and sustainable technology: recycling, renewable energy, solar panels, wind turbines, electric energy and eco-friendly practices.",
    "Text formatting":"Editing written text appearance and arrangement: bold, italic, underline, font size, alignment, paragraph formatting, lists and typography.",
    "Time & calendar":"Measuring and organizing time: clocks, watches, calendars, dates, stopwatches, timers, alarms, schedules and countdowns.",
    "Tools":"Physical tools and equipment for repair or construction: hammers, wrenches, screwdrivers, pliers, saws, drills, toolboxes and maintenance.",
    "Transportation":"Vehicles used to transport people or goods: cars, buses, trains, bicycles, motorcycles, airplanes, helicopters, ships and trucks.",
    "Travel":"Trips, tourism and travel activities: suitcases, luggage, passports, boarding passes, hotels, tents, camping equipment and journeys.",
    "Weather":"Atmospheric weather conditions: clouds, rain, thunderstorms, lightning, snow, sunshine, wind, fog, temperature and forecasts."
  };

  function text(value) {
    return String(value == null ? "" : value)
      .replace(/([a-z])([A-Z])/g, "$1 $2")
      .toLowerCase().replace(/[_-]+/g, " ")
      .replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim();
  }

  function tokens(value) {
    return text(value).split(" ").filter(word => word.length >= 3 && !STOP_WORDS.has(word));
  }

  function unique(values) {
    const seen = new Set();
    return (values || []).map(value => String(value || "").trim())
      .filter(value => {
        const key = value.toLowerCase();
        if (!key || seen.has(key)) return false;
        seen.add(key);
        return true;
      });
  }

  function categoryKey(value) {
    return text(value).replace(/ and /g, " ").replace(/\s+/g, " ").trim();
  }

  function resolveOfficial(raw, map) {
    const key = categoryKey(raw);
    const entries = map || OFFICIAL_CATEGORY_MAP;
    const found = entries[key] || entries[String(raw || "").toLowerCase()] ||
      OFFICIAL_CATEGORY_MAP[key] || OFFICIAL_CATEGORY_MAP[String(raw || "").toLowerCase()];
    return found || null;
  }

  function getAliasValues(values) {
    return (Array.isArray(values) ? values : []).map(value =>
      typeof value === "object" && value ? (value.name || value.alias || value.value || "") : value
    ).filter(Boolean);
  }

  function classify(iconName, baseRecord, review, options) {
    options = options || {};
    baseRecord = baseRecord || {};
    review = review || {};
    const lucide = baseRecord.lucide || {};
    const ai = baseRecord.ai || {};
    const edits = review.metadataEdits || {};
    const categoryData = Array.isArray(options.categoryData) ? options.categoryData : [];
    const categoryNames = unique([
      ...categoryData.map(item => item && item.name),
      ...(options.categories || []),
      ...Object.keys(options.keywordMap || {}),
      ...Object.keys(options.metadataTerms || {}),
      ...Object.keys(EXTRA_TERMS)
    ]);
    const definitions = new Map(Object.entries(CATEGORY_DESCRIPTIONS).map(([name, description]) => [name.toLowerCase(), description]));
    categoryData.filter(Boolean).forEach(item => {
      if (item.name) definitions.set(item.name.toLowerCase(), item.description || definitions.get(item.name.toLowerCase()) || "");
    });
    const official = unique((Array.isArray(lucide.categories) ? lucide.categories : [])
      .map(value => resolveOfficial(value, options.officialCategoryMap))
      .filter(Boolean)
      .map(value => options.resolveCategory ? options.resolveCategory(value) : value)
      .filter(Boolean));

    const aliases = [
      ...getAliasValues(lucide.aliases), ...getAliasValues(edits.aliases)
    ];
    const sources = [
      { label:"icon name", weight:1, values:[iconName] },
      { label:"official tags", weight:0.88, values:[...(lucide.tags || []), ...(edits.tags || [])] },
      { label:"use cases", weight:0.90, values:[...(lucide.useCases || []), ...(edits.useCases || [])] },
      { label:"aliases", weight:0.80, values:aliases },
      { label:"search terms", weight:0.74, values:[...(ai.searchTerms || []), ...(edits.searchTerms || [])] },
      { label:"description", weight:0.48, values:[edits.description || ai.description || ""] }
    ].filter(source => source.values.length);

    const embeddingMap = new Map();
    const embeddingScores = options.embeddingScores;
    if (Array.isArray(embeddingScores)) embeddingScores.forEach(item => {
      if (item && item.name) embeddingMap.set(item.name.toLowerCase(), Number(item.score) || 0);
    });
    else if (embeddingScores && typeof embeddingScores === "object") {
      Object.entries(embeddingScores).forEach(([name, score]) => embeddingMap.set(name.toLowerCase(), Number(score) || 0));
    }

    const visualMap = new Map();
    const visualScores = options.visualScores || review.visualScores;
    if (Array.isArray(visualScores)) visualScores.forEach(item => {
      if (item && item.name) visualMap.set(item.name.toLowerCase(), Number(item.score) || 0);
    });
    else if (visualScores && typeof visualScores === "object") {
      Object.entries(visualScores).forEach(([name, score]) => visualMap.set(name.toLowerCase(), Number(score) || 0));
    }
    const visualRanking = [...visualMap.entries()].sort((a, b) => b[1] - a[1]);
    const visualRankMap = new Map(visualRanking.map(([name], index) => [name, index + 1]));
    const visualTopScore = visualRanking.length ? visualRanking[0][1] : 0;

    const keywordMap = options.keywordMap || {};
    const metadataTerms = options.metadataTerms || {};
    const ranked = [];

    categoryNames.forEach(rawName => {
      const category = options.resolveCategory ? options.resolveCategory(rawName) : rawName;
      if (!category) return;
      const definition = definitions.get(String(rawName).toLowerCase()) ||
        definitions.get(String(category).toLowerCase()) || "";
      const keywords = unique([
        ...(keywordMap[rawName] || []),
        ...(keywordMap[category] || []),
        ...(metadataTerms[rawName] || []),
        ...(metadataTerms[category] || []),
        ...(EXTRA_TERMS[rawName] || []),
        ...(EXTRA_TERMS[category] || []),
        rawName, category
      ]);
      let strongest = 0;
      const evidence = [];
      const matchedTokens = new Set();

      sources.forEach(source => {
        const hits = keywords.filter(keyword => {
          const phrase = text(keyword);
          return phrase.length > 1 && source.values.some(value => (" " + text(value) + " ").includes(" " + phrase + " "));
        });
        if (hits.length) {
          const phraseBoost = hits.some(hit => text(hit).includes(" ")) ? 1 : 0.96;
          strongest = Math.max(strongest, source.weight * phraseBoost);
          hits.slice(0, 4).forEach(hit => evidence.push(source.label + ": " + hit));
        }
        source.values.forEach(value => tokens(value).forEach(token => matchedTokens.add(token)));
      });

      const descriptionTokens = unique(tokens(definition));
      const overlaps = descriptionTokens.filter(token => matchedTokens.has(token));
      if (overlaps.length >= 2) {
        const semanticScore = Math.min(0.76, 0.48 + overlaps.length * 0.045);
        strongest = Math.max(strongest, semanticScore);
        evidence.push("category definition: " + overlaps.slice(0, 5).join(", "));
      }

      const embeddingScore = embeddingMap.get(String(category).toLowerCase());
      if (Number.isFinite(embeddingScore) && embeddingScore >= 0.48) {
        const hasCorroboration = overlaps.length >= 2 || evidence.length > 0;
        if (hasCorroboration) {
          const semanticScore = Math.min(0.78, 0.42 + Math.max(0, embeddingScore) * 0.48);
          strongest = Math.max(strongest, semanticScore);
          evidence.push("semantic model similarity: " + embeddingScore.toFixed(3));
        }
      }

      // This score is derived from the rendered SVG image, not its metadata.
      const visualScore = visualMap.get(String(category).toLowerCase());
      const visualRank = visualRankMap.get(String(category).toLowerCase());
      if (Number.isFinite(visualScore) && visualRank <= 3 &&
          visualScore >= Math.max(0.055, visualTopScore * 0.42)) {
        const visualConfidence = Math.min(0.82, 0.54 + Math.max(0, visualScore - 0.10) * 1.25);
        strongest = Math.max(strongest, visualConfidence);
        evidence.push("visual model rank #" + visualRank + " similarity: " + visualScore.toFixed(3));
      }

      if (official.some(value => value.toLowerCase() === String(category).toLowerCase())) strongest = 1;
      const sourceCount = new Set(evidence.map(item => item.split(":")[0])).size;
      if (sourceCount >= 2 && strongest > 0 && strongest < 1) strongest = Math.min(0.99, strongest + 0.07);

      if (strongest >= (Number(options.threshold) || 0.52)) {
        ranked.push({
          name:category,
          score:Number(strongest.toFixed(3)),
          confidence:Number(strongest.toFixed(3)),
          evidence:unique(evidence).slice(0, 7),
          source:official.some(value => value.toLowerCase() === String(category).toLowerCase())
            ? "Lucide + shared metadata engine" : "shared metadata engine"
        });
      }
    });

    const byName = new Map();
    [...ranked, ...official.map(name => ({
      name, score:1, confidence:1, evidence:["Official Lucide category"], source:"Lucide"
    }))].forEach(item => {
      const key = item.name.toLowerCase();
      const previous = byName.get(key);
      if (!previous || item.score > previous.score) byName.set(key, item);
    });

    const ordered = [...byName.values()].sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
    const maxSuggestions = Math.max(1, Math.min(12, Number(options.maxSuggestions) || 8));
    const suggestions = ordered.filter(item =>
      !official.some(value => value.toLowerCase() === item.name.toLowerCase())
    ).slice(0, maxSuggestions);

    return {
      engineVersion:VERSION,
      officialCategories:official,
      suggestions,
      categories:unique([...official, ...suggestions.map(item => item.name)])
    };
  }

  root.IconCategoryEngine = Object.freeze({
    version:VERSION,
    classify,
    resolveOfficialCategory:resolveOfficial,
    normalizeText:text,
    getOfficialCategoryMap:() => ({...OFFICIAL_CATEGORY_MAP})
  });
})(typeof window !== "undefined" ? window : globalThis);
