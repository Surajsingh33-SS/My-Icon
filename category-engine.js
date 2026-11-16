(function (root) {
  'use strict';

  const VERSION = 12;
  const STOP = new Set([
    'icon','icons','outline','line','simple','symbol','small','large','left','right',
    'up','down','plus','minus','the','and','for','with','of','to','a','an'
  ]);

  // Lucide category slugs are mapped explicitly; $extends entries are relationships,
  // not categories, and are deliberately excluded.
  const OFFICIAL_MAP = {
    accessibility:'Accessibility', animals:'Animals', animal:'Animals',
    arrows:'Arrows', audio:'Audio & music', music:'Audio & music',
    buildings:'Buildings', building:'Buildings', business:'Business',
    communication:'Communication', connectivity:'Connectivity', devices:'Devices',
    files:'Files', food:'Food & drink', 'food-beverage':'Food & drink',
    gaming:'Gaming', health:'Health', home:'Home', maps:'Maps & travel',
    'maps-travel':'Maps & travel', media:'Media', nature:'Nature',
    people:'People', security:'Security', shopping:'Shopping', sports:'Sports', sustainability:'Sustainability',
    time:'Time', tools:'Tools', transportation:'Transportation', weather:'Weather',
    'accessibility':'Accessibility', 'account':'People', 'account-user':'People',
    'animals-pets':'Animals', 'arrows-directions':'Arrows', 'audio-music':'Audio & music',
    'building-architecture':'Buildings', 'business-finance':'Business',
    'communication-messaging':'Communication', 'connectivity-network':'Connectivity',
    'devices-electronics':'Devices', 'files-folders':'Files', 'food-drink':'Food & drink',
    'gaming-entertainment':'Gaming', 'health-wellness':'Health', 'home-household':'Home',
    'maps-navigation':'Maps & travel', 'media-images':'Media', 'nature-environment':'Nature',
    'people-users':'People', 'security-privacy':'Security', 'shopping-commerce':'Shopping',
    'sports-fitness':'Sports', 'time-date':'Time', 'tools-utilities':'Tools',
    'transportation-vehicles':'Transportation',
    'design':'Design & layout', 'layout':'Design & layout', 'cursors':'Design & layout',
    'development':'Development', 'text':'Typography', 'letters-digits':'Typography',
    'photography':'Photography', 'science':'Science', 'math':'Math & symbols',
    'shapes':'Math & symbols', 'emoji':'Emoji & expressions',
    'finance':'Business', 'charts':'Business', 'mail':'Communication',
    'notifications':'Communication', 'social':'Social', 'navigation':'Maps & travel',
    'travel':'Maps & travel', 'multimedia':'Media', 'medical':'Health',
    'seasons':'Nature'
  };

  Object.assign(OFFICIAL_MAP, {
    "accessibility":"Accessibility",
    "accounts-access":"Accounts & access",
    "account-access":"Accounts & access",
    "animals":"Animals",
    "arrows":"Arrows",
    "buildings":"Buildings",
    "charts":"Charts",
    "communication":"Communication",
    "connectivity":"Connectivity",
    "cursors":"Cursors",
    "design":"Design",
    "coding-development":"Coding & development",
    "development":"Coding & development",
    "devices":"Devices",
    "emoji":"Emoji",
    "file-icons":"File icons",
    "files":"File icons",
    "finance":"Finance",
    "food-beverage":"Food & beverage",
    "food":"Food & beverage",
    "gaming":"Gaming",
    "home":"Home",
    "layout":"Layout",
    "letters-digits":"Letters & digits",
    "mail":"Mail",
    "mathematics":"Mathematics",
    "math":"Mathematics",
    "medical":"Medical",
    "health":"Medical",
    "multimedia":"Multimedia",
    "media":"Multimedia",
    "nature":"Nature",
    "navigation-places":"Navigation & places",
    "maps":"Navigation & places",
    "notifications":"Notifications",
    "people":"People",
    "photography":"Photography",
    "science":"Science",
    "seasons":"Seasons",
    "security":"Security",
    "shapes":"Shapes",
    "shopping":"Shopping",
    "social":"Social",
    "sports":"Sports",
    "sustainability":"Sustainability",
    "text-formatting":"Text formatting",
    "text":"Text formatting",
    "time-calendar":"Time & calendar",
    "time":"Time & calendar",
    "tools":"Tools",
    "transportation":"Transportation",
    "travel":"Travel",
    "weather":"Weather"
  });

  // Curated discriminative concepts. These complement (never replace) authored
  // per-icon metadata and reduce accidental matches from broad category descriptions.
  const TERMS = {
    'Design & layout':['design','layout','align','alignment','grid','panel','columns','rows','resize','scale','fullscreen','maximize','minimize','canvas','spacing','position','interface','ui'],
    'Development':['development','code','coding','programming','git','branch','commit','merge','pull request','terminal','command line','braces','bracket','variable','function','workflow','database','api','bug','debug'],
    'Typography':['text','typography','font','typeface','letter','letters','digit','number','punctuation','uppercase','lowercase','heading','paragraph','quote','exclamation','question mark','at sign','hashtag'],
    'Photography':['photography','photo','camera','lens','aperture','shutter','viewfinder','exposure','image capture','focus','picture','visibility','view','eye'],
    'Science':['science','scientific','microscope','laboratory','lab','chemistry','biology','physics','atom','molecule','dna','experiment','specimen','telescope'],
    'Math & symbols':['math','mathematics','calculate','equation','plus','minus','multiply','divide','equals','percent','infinity','pi','sigma','integral','root','symbol','shape','geometry','circle','square','triangle'],
    'Emoji & expressions':['emoji','emoticon','expression','grinning','smile','smiling','laugh','laughing','angry','sad','happy','happiness','mood','feeling','reaction','face'],
    'Social':['social','astrology','zodiac','horoscope','star sign','constellation','personality','compatibility','relationship','friendship','community','networking','duality','adaptability'],
    'Accessibility':['accessibility','wheelchair','assistive','screen reader','hearing impaired','visual impairment','disability','braille','captions','closed captions','sign language'],
    'Animals':['animal','pet','dog','cat','bird','fish','whale','horse','paw','wildlife','insect','bug','butterfly','rabbit','turtle','snake','bear','fox','deer','pig','cow','sheep','dinosaur'],
    'Arrows':['arrow','chevron','caret','direction','north','south','east','west','diagonal','rotate','turn','redirect','undo','redo','move','transfer','swap','shuffle','sort'],
    'Audio & music':['audio','music','sound','volume','speaker','headphone','headphones','microphone','mic','waveform','equalizer','playlist','radio','podcast','mute','song','guitar','piano','drum'],
    'Buildings':['building','office','skyscraper','factory','warehouse','school','hospital building','church','temple','mosque','bank building','stadium','hotel','apartment','house building'],
    'Business':['business','briefcase','work','finance','financial','bank','payment','invoice','receipt','wallet','cash','money','currency','coin','credit card','debit card','tax','investment','chart','sales','contract','calculator','budget'],
    'Communication':['message','chat','comment','conversation','communication','mail','email','inbox','phone call','call','voicemail','notification','bell','send','reply','mention','sms','message bubble','speech bubble','contact'],
    'Connectivity':['wifi','wi-fi','wifi signal','wireless','wireless network','connect to the internet','bluetooth','network','internet','signal','antenna','router','ethernet','connection','satellite','hotspot','cellular','rss'],
    'Devices':['computer','laptop','desktop','monitor','keyboard','mouse','phone','smartphone','tablet','printer','server','cpu','chip','hard drive','usb','webcam','watch','device','battery','plug','charger'],
    'Files':['file','folder','document','paper','page','pdf','spreadsheet','archive','zip','attachment','clipboard','notebook','directory','file type','copy file'],
    'Food & drink':['food','drink','coffee','tea','cup','mug','glass','bottle','beer','wine','cocktail','water','pizza','burger','sandwich','bread','cake','cookie','donut','fruit','apple','banana','vegetable','carrot','meal','restaurant','chef','cooking','utensil','fork','spoon','knife','soup','ice cream'],
    'Gaming':['game','gaming','controller','gamepad','joystick','dice','chess','puzzle','arcade',' joystick','playstation','xbox','toy','poker','playing card','trophy game'],
    'Health':['health','medical','medicine','doctor','nurse','hospital','clinic','pill','capsule','tablet medicine','syringe','stethoscope','thermometer','heart rate','heartbeat','blood','bandage','first aid','tooth','dental','brain','mental health','fitness','wellness','medical cross'],
    'Home':['home','household','furniture','sofa','couch','chair','table','bed','lamp','light bulb','wardrobe','cabinet','shelf','curtain','door','window','kitchen','bathroom','washing machine','vacuum','refrigerator','oven','microwave'],
    'Maps & travel':['map','location','pin','marker','compass','globe','world','navigation','route','destination','landmark','country','city','travel','trip','journey','passport','suitcase','luggage','ticket','hotel booking','mountain map'],
    'Media':['image','photo','picture','camera','video','film','movie','gallery','landscape photo','image file','aperture','shutter','frame','crop','scan','slideshow','projector','clapperboard'],
    'Nature':['nature','plant','tree','flower','leaf','forest','grass','seedling','cactus','mushroom','earth','environment','recycle','mountain','volcano','ocean','sea','river','lake','sun','moon','star','cloud','rainbow','wind','snowflake','fire','water drop'],
    'People':['person','people','user','users','profile','avatar','account','team','group','family','twin','twins','man','woman','child','baby','human','face','smile','contact','employee','customer','guest','person standing'],
    'Security':['security','lock','unlock','password','key','shield','privacy','safe','secure','authentication','fingerprint','biometric','verified','certificate','keyhole','protection','alarm','hide','conceal','mask','hidden','invisible','privacy mode','stealth','restricted','警'],
    'Shopping':['shopping','cart','basket','bag','store','shop','product','package','parcel','delivery','shipping','barcode','tag','price tag','discount','coupon','gift','box','checkout','market','retail'],
    'Sports':['sport','sports','fitness','exercise','workout','athlete','ball','football','soccer','basketball','tennis','volleyball','baseball','golf','cycling','bicycle sport','swimming','medal','podium','running','weightlifting','dumbbell','yoga','skateboard','surfboard'],
    'Sustainability':['sustainability','renewable energy','clean energy','wind energy','wind power','solar energy','solar power','environmental protection','climate action','eco friendly','green energy','energy efficiency','conservation','recycling','carbon neutral','carbon footprint'],
    'Time':['time','clock','watch time','calendar','date','schedule','alarm clock','timer','stopwatch','hourglass','history','duration','deadline','appointment','reminder','month','day','week'],
    'Tools':['tool','tools','wrench','hammer','screwdriver','saw','drill','gear','settings','cog','spanner','pliers','ruler','scissors','paintbrush','brush','pencil','pen','construction','repair','maintenance','tuning','sliders','utility'],
    'Transportation':['car','vehicle','truck','bus','train','railway','tram','airplane','plane','helicopter','ship','boat','sailboat','bicycle','bike','motorcycle','scooter','rocket','taxi','ambulance','fire truck','traffic','fuel','gas station','charging station'],
    'Weather':['weather','temperature','forecast','thermometer','sunny','cloudy','rain','rainy','storm','thunder','lightning','snow','snowfall','windy','humidity','fog','tornado','hurricane','sunrise','sunset']
  };

  Object.assign(TERMS, {
    "Accounts & access": ["account","accounts","sign in","sign-in","log in","login","log out","logout","user account","access control","permission","permissions","authentication","authorization","identity","profile access"],
    "Charts": ["chart","charts","graph","graphs","plot","analytics","statistics","data visualization","bar chart","line chart","pie chart","histogram","trend"],
    "Cursors": ["cursor","mouse pointer","pointer","hand pointer","text cursor","selection cursor","cursor state","pointing"],
    "Design": ["graphic design","visual design","design","color palette","palette","swatch","gradient","creative","illustration","paint","style","artboard"],
    "Coding & development": ["code","coding","programming","developer","development","source code","git","branch","commit","terminal","api","debug","database","software"],
    "Emoji": ["emoji","emoticon","face","grinning","smile","laugh","angry","sad","happy","mood","reaction","expression"],
    "File icons": ["file","folder","document","pdf","spreadsheet","archive","zip","attachment","file type","directory"],
    "Finance": ["finance","financial","money","currency","coin","cash","bank","payment","invoice","receipt","wallet","credit card","debit card","tax","investment","budget","accounting"],
    "Food & beverage": ["food","beverage","drink","coffee","tea","cup","mug","glass","bottle","pizza","burger","bread","cake","fruit","vegetable","meal","restaurant","cooking","chef"],
    "Layout": ["layout","grid","panel","columns","rows","align","alignment","spacing","resize","position","interface","sidebar","dashboard","split view"],
    "Letters & digits": ["letter","letters","alphabet","digit","digits","numeral","number","character","punctuation","uppercase","lowercase","abc","123"],
    "Mail": ["mail","email","e-mail","inbox","envelope","letterbox","post","postal","correspondence","send mail"],
    "Mathematics": ["math","mathematics","calculate","calculation","equation","arithmetic","plus","minus","multiply","divide","equals","percent","infinity","pi","sigma","integral","root","geometry"],
    "Medical": ["medical","medicine","health","healthcare","doctor","nurse","hospital","clinic","pill","syringe","stethoscope","thermometer","heartbeat","first aid","bandage","dental"],
    "Multimedia": ["multimedia","media","image","photo","picture","camera","video","film","movie","audio","music","sound","speaker","headphone","waveform","playback"],
    "Navigation & places": ["map","maps","location","pin","marker","compass","globe","navigation","route","destination","landmark","country","city","place","geography"],
    "Notifications": ["notification","notifications","alert","alerts","reminder","warning","badge","bell","status update","attention"],
    "Seasons": ["season","seasons","spring","summer","autumn","fall","winter","seasonal","solstice","equinox"],
    "Shapes": ["shape","shapes","geometry","geometric","circle","square","triangle","rectangle","polygon","hexagon","pentagon","oval"],
    "Text formatting": ["text formatting","format text","bold","italic","underline","strikethrough","paragraph","heading","list","bullet list","numbered list","indent","align text","rich text"],
    "Time & calendar": ["time","clock","calendar","date","schedule","alarm clock","timer","stopwatch","hourglass","deadline","appointment","month","day","week"],
    "Travel": ["travel","trip","journey","passport","suitcase","luggage","ticket","boarding pass","hotel booking","vacation","holiday"]
  });

  // Curated icon-family rules resolve known ambiguities that generic text
  // embeddings cannot reliably distinguish. These rules only affect the named
  // families; all other icons continue through the evidence-based classifier.
  const ICON_CATEGORY_RULES = [
    { pattern: /^zodiac(?:-|$)/, allow: ['Social', 'Emoji', 'Emoji & expressions', 'Communication', 'People'], reason: 'Zodiac symbols have social/astrology and emoji meanings; individual tags may support communication or people.' },
    { pattern: /^zap(?:-off)?$/, allow: ['Devices'], force: ['Devices'], reason: 'Lightning/power indicator.' },
    { pattern: /^camera$/, allow: ['Photography', 'Media'], force: ['Photography', 'Media'], reason: 'Camera used for photography and image/media capture.' },
    { pattern: /^worm$/, allow: ['Animals'], force: ['Animals'], reason: 'Animal/invertebrate icon.' },
    { pattern: /^wind-arrow-(?:up|down)$/, allow: ['Arrows', 'Weather', 'Sustainability'], force: ['Arrows', 'Weather', 'Sustainability'], reason: 'Directional wind indicator with weather and renewable-energy meaning.' },
    { pattern: /^wind$/, allow: ['Weather', 'Sustainability'], force: ['Weather', 'Sustainability'], reason: 'Wind/weather condition with environmental and renewable-energy meaning.' },
    { pattern: /^workflow$/, suppress: true, reason: 'Generic workflow concept has no reliable match in the current taxonomy.' },
    { pattern: /^wrench(?:-|$)/, allow: ['Tools'], reason: 'Tool family; not a person category.' },
    { pattern: /^eye(?:-|$)/, allow: ['Accessibility', 'Security', 'Photography', 'Design', 'Layout', 'Design & layout'], reason: 'Eye family: visibility, privacy and visual access.' },
    { pattern: /^expand$/, allow: ['Arrows', 'Design & layout'], reason: 'Expand/collapse and interface layout control.' },
    { pattern: /^euro$/, allow: ['Business'], force: ['Business'], reason: 'Currency symbol; finance category.' },
    { pattern: /^exclamation-mark$/, allow: ['Letters & digits', 'Text formatting', 'Notifications', 'Typography', 'Communication'], reason: 'Punctuation symbol used for emphasis and alerts.' }
  ];

  function normalize(value) {
    return String(value == null ? '' : value)
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .toLowerCase()
      .replace(/&/g, ' and ')
      .replace(/[^a-z0-9]+/g, ' ')
      .trim()
      .replace(/\s+/g, ' ');
  }

  function cleanList(value) {
    return (Array.isArray(value) ? value : [])
      .filter(item => typeof item === 'string')
      .map(item => item.trim())
      .filter(item => item && !/^\$(?:group|extends):/i.test(item));
  }

  function aliasNames(value) {
    return (Array.isArray(value) ? value : []).map(item =>
      typeof item === 'string' ? item : (item && (item.name || item.alias)) || ''
    ).filter(Boolean);
  }

  function getScoreMap(items) {
    const map = new Map();
    for (const item of Array.isArray(items) ? items : []) {
      if (!item || !item.name) continue;
      const score = Number(item.score);
      if (Number.isFinite(score)) map.set(item.name, Math.max(0, Math.min(1, score)));
    }
    return map;
  }

  function phraseHits(text, phrases) {
    const normalizedText = ' ' + normalize(text) + ' ';
    const hits = [];
    for (const phrase of phrases) {
      const normalizedPhrase = normalize(phrase);
      if (normalizedPhrase.length < 3) continue;
      if (normalizedText.includes(' ' + normalizedPhrase + ' ')) hits.push(normalizedPhrase);
    }
    return [...new Set(hits)];
  }

  function classify(name, meta = {}, existing = {}, options = {}) {
    const categoryData = Array.isArray(options.categoryData) ? options.categoryData : [];
    const lucide = meta && meta.lucide || {};
    const ai = meta && meta.ai || {};
    const metadataEdits = existing && existing.metadataEdits || {};
    const edited = metadataEdits && typeof metadataEdits === 'object' ? metadataEdits : {};

    const sources = {
      name: [name],
      tags: cleanList(lucide.tags).concat(cleanList(edited.tags)),
      aliases: aliasNames(lucide.aliases).concat(cleanList(edited.aliases)),
      useCases: cleanList(lucide.useCases).concat(cleanList(lucide['use-cases']), cleanList(edited.useCases)),
      searchTerms: cleanList(ai.searchTerms).concat(cleanList(edited.searchTerms)),
      description: [ai.description || '', edited.description || '']
    };
    const officialRaw = cleanList(lucide.categories);
    const officialCategories = [...new Set(officialRaw
      .map(value => OFFICIAL_MAP[normalize(value).replace(/\s+/g, '-')] || OFFICIAL_MAP[normalize(value)])
      .filter(Boolean))];
    const officialSet = new Set(officialCategories);
    const embedding = getScoreMap(options.embeddingScores || existing.embeddingScores);
    const visual = getScoreMap(options.visualScores || existing.visualScores);

    const suggestions = categoryData.map(category => {
      const categoryName = category.name;
      const terms = TERMS[categoryName] || [];
      const evidence = [];
      let lexical = 0;
      let nameScore = 0;
      let tagScore = 0;
      let aliasScore = 0;
      let useCaseScore = 0;
      let searchScore = 0;
      let descriptionScore = 0;
      const matchedTextSources = new Set();

      const add = (sourceName, values, weight, cap) => {
        const hits = phraseHits(values.join(' '), terms);
        if (!hits.length) return 0;
        matchedTextSources.add(sourceName);
        if (evidence.length < 8) evidence.push({
          source: sourceName,
          matches: hits.slice(0, 5),
          label: sourceName === 'official' ? 'Official Lucide category' : sourceName
        });
        return Math.min(cap, hits.length * weight);
      };

      nameScore = add('icon name', sources.name, 0.56, 0.75);
      tagScore = add('Lucide tags', sources.tags, 0.22, 0.55);
      aliasScore = add('aliases', sources.aliases, 0.16, 0.32);
      useCaseScore = add('use cases', sources.useCases, 0.19, 0.48);
      searchScore = add('search terms', sources.searchTerms, 0.10, 0.28);
      descriptionScore = add('description', sources.description, 0.07, 0.18);
      lexical = Math.min(1, nameScore + tagScore + aliasScore + useCaseScore + searchScore + descriptionScore);

      const isOfficial = officialSet.has(categoryName);
      const normalizedName = normalize(name).replace(/\s+/g, '-');
      const iconRule = ICON_CATEGORY_RULES.find(rule => rule.pattern.test(normalizedName));
      const excluded = Boolean(iconRule && (
        iconRule.suppress ||
        (Array.isArray(iconRule.allow) && !iconRule.allow.includes(categoryName))
      ));
      const forcedByRule = Boolean(iconRule && Array.isArray(iconRule.force) &&
        iconRule.force.includes(categoryName));
      if (forcedByRule) {
        evidence.unshift({ source: 'curated icon rule', matches: [iconRule.reason], label: 'Curated icon-family rule' });
      }
      if (isOfficial) evidence.unshift({ source: 'official', matches: [categoryName], label: 'Official Lucide category' });

      const emb = embedding.get(categoryName) || 0;
      const vis = visual.get(categoryName) || 0;
      const hasTextEvidence = lexical >= 0.18;
      const semanticSupport = emb >= 0.48 ? Math.min(0.16, (emb - 0.48) * 0.55) : 0;
      const visualSupport = vis >= 0.30 ? Math.min(0.20, (vis - 0.30) * 0.65) : 0;
      const corroboration = (hasTextEvidence && emb >= 0.48 ? 0.06 : 0) +
        (hasTextEvidence && vis >= 0.30 ? 0.07 : 0) +
        (emb >= 0.58 && vis >= 0.38 ? 0.30 : 0);
      // This is an evidence-strength score, not a calibrated probability. Keep
      // it conservative so one broad metadata match cannot produce a near-100%.
      let confidence = Math.min(0.98,
        lexical * 0.55 +
        semanticSupport * 0.25 +
        visualSupport * 0.25 +
        corroboration * 0.20 +
        (emb >= 0.58 && vis >= 0.38 ? 0.24 : 0) +
        (isOfficial ? 0.58 : 0)
      );
      if (forcedByRule) {
        const forcedOrder = iconRule.force.indexOf(categoryName);
        // Preserve the intentional order of curated rules: the first forced
        // category is primary, later forced categories are secondary.
        const curatedPriority = Math.max(0.72, 0.84 - Math.max(0, forcedOrder) * 0.04);
        confidence = Math.max(confidence, curatedPriority);
      }

      // Model similarity alone cannot create a category. Official category metadata
      // is strong evidence; other suggestions need at least one meaningful text hit
      // or agreement between both independent models.
      const modelAgreement = emb >= 0.58 && vis >= 0.38;
      const eligible = !excluded && (isOfficial || hasTextEvidence || modelAgreement || forcedByRule);
      if (emb >= 0.48) evidence.push({ source: 'embedding', matches: [emb.toFixed(3)], label: 'Text-semantic support' });
      if (vis >= 0.30) evidence.push({ source: 'visual', matches: [vis.toFixed(3)], label: 'Visual-model support' });

      const minimum = Number.isFinite(Number(options.threshold)) ? Number(options.threshold) : 0.30;
      // A single precise metadata hit can be valid even when its conservative
      // evidence score is below the general model-agreement threshold. Keep
      // the threshold proportional to that evidence instead of dropping it.
      const required = isOfficial
        ? Math.min(minimum, 0.30)
        : hasTextEvidence
          ? Math.min(minimum, confidence * 0.90)
          : minimum;
      const independentTextSupport = matchedTextSources.size >= 2;
      const directMetadataSupport = tagScore >= 0.20 || aliasScore >= 0.16 || useCaseScore >= 0.19;
      const secondaryEligible = forcedByRule || isOfficial || directMetadataSupport ||
        (lexical >= 0.30 && independentTextSupport) ||
        modelAgreement;
      return {
        name: categoryName,
        score: confidence,
        confidence,
        eligible,
        isOfficial,
        evidence,
        signals: {
          lexical,
          name: nameScore,
          tags: tagScore,
          aliases: aliasScore,
          useCases: useCaseScore,
          searchTerms: searchScore,
          description: descriptionScore,
          embedding: emb,
          visual: vis,
          official: isOfficial,
          modelAgreement,
          matchedTextSources: [...matchedTextSources],
          independentTextSupport,
          secondaryEligible,
          excluded,
          curatedRule: forcedByRule ? (iconRule.reason || true) : false
        },
        _required: required
      };
    }).sort((a, b) => b.confidence - a.confidence);

    const ranked = suggestions.filter(item => item.eligible && item.confidence >= item._required);
    const primary = ranked[0] || null;
    const accepted = primary
      ? [primary, ...ranked.slice(1).filter(item => item.signals.secondaryEligible)]
      : [];
    const suggestionLimit = Math.max(1, Number(options.maxSuggestions) || categoryData.length || 43);
    const secondary = accepted.slice(1, suggestionLimit);
    const publicSuggestions = accepted.slice(0, suggestionLimit)
      .map(({ _required, ...item }, index) => ({
        ...item,
        role: index === 0 ? 'primary' : 'secondary'
      }));

    return {
      version: VERSION,
      officialCategories,
      officialCategoryValues: officialRaw,
      primaryCategory: primary ? primary.name : null,
      secondaryCategories: secondary.map(item => item.name),
      suggestions: publicSuggestions,
      categories: publicSuggestions.map(item => item.name)
    };
  }

  const api = { version: VERSION, classify, normalize, officialCategoryMap: OFFICIAL_MAP };
  root.IconCategoryEngine = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
