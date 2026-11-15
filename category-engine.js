/* Shared Icon Maker PRO categorization engine.
 * Used by the main app, batch review, and the AI test page.
 * It combines curated metadata evidence with optional semantic embedding scores.
 */
(function (root) {
  "use strict";

  const VERSION = 3;
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
    const definitions = new Map(categoryData.filter(Boolean).map(item => [item.name.toLowerCase(), item.description || ""]));
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
