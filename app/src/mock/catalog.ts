/**
 * Client-side mock catalog powering demo mode. Rich enough that generated
 * trips feel varied and real without any backend. Display text is Hebrew;
 * `photo`/`imageQ` are English queries for themed photos. When the live API is
 * wired, this is simply not used (DEMO=false).
 */
export interface MockHotel {
  name: string;
  area: string;
  stars: number;
  rating: number;
  pricePerNight: number; // USD baseline
  familyFriendly: boolean;
}
export interface MockPlace {
  name: string; // Hebrew display
  area: string;
  cost: number; // per person, USD baseline
  rating: number;
  tags: string[];
  imageQ: string; // english photo query
  social?: string; // social proof line
  kidFriendly?: boolean;
}
export interface MockDestination {
  key: string; // english key (photos)
  he: string; // hebrew display name incl. flag
  photo: string; // hero photo query
  airlines: string[];
  baseFlight: number; // per person round trip, USD
  weather: string; // hebrew weather capsule
  hotels: MockHotel[];
  restaurants: MockPlace[];
  attractions: MockPlace[];
  nightlife: MockPlace[];
  insights: string[]; // hebrew tips
  tags: string[]; // vibe tags for matching
}

export const CATALOG: MockDestination[] = [
  {
    key: 'Barcelona',
    he: 'ברצלונה, ספרד 🇪🇸',
    photo: 'Barcelona skyline',
    airlines: ['Vueling', 'Iberia', 'Wizz Air'],
    baseFlight: 190,
    weather: '26°C שמשי ונעים',
    tags: ['city', 'beach', 'food', 'culture', 'nightlife', 'warm'],
    hotels: [
      { name: 'Hotel Sixtytwo', area: 'Eixample', stars: 4, rating: 8.7, pricePerNight: 165, familyFriendly: true },
      { name: 'W Barcelona', area: 'Barceloneta', stars: 5, rating: 8.9, pricePerNight: 380, familyFriendly: true },
      { name: 'Pensió 2000', area: 'Gothic Quarter', stars: 2, rating: 8.1, pricePerNight: 85, familyFriendly: false },
      { name: 'Barceló Raval', area: 'El Raval', stars: 4, rating: 8.5, pricePerNight: 140, familyFriendly: true },
    ],
    restaurants: [
      { name: 'Cervecería Catalana', area: 'Eixample', cost: 28, rating: 4.5, tags: ['טאפאס', 'מקומי'], imageQ: 'tapas', social: 'מוביל בהמלצות Google', kidFriendly: true },
      { name: 'Bar del Pla', area: 'Born', cost: 32, rating: 4.6, tags: ['טאפאס', 'יין'], imageQ: 'spanish food', social: 'מוביל בהמלצות Reddit Barcelona' },
      { name: 'Can Solé', area: 'Barceloneta', cost: 55, rating: 4.4, tags: ['פאייה', 'דגים'], imageQ: 'paella', kidFriendly: true },
      { name: 'Bo de B', area: 'Gothic Quarter', cost: 12, rating: 4.7, tags: ['כריכים', 'זול וטעים'], imageQ: 'sandwich', social: 'תור ארוך — שווה!' , kidFriendly: true },
      { name: 'El Xampanyet', area: 'Born', cost: 30, rating: 4.5, tags: ['טאפאס', 'קלאסי'], imageQ: 'tapas bar' },
    ],
    attractions: [
      { name: 'סגרדה פמיליה', area: 'Eixample', cost: 33, rating: 4.8, tags: ['ציון דרך', 'גאודי'], imageQ: 'Sagrada Familia', social: 'הזמינו כרטיסים מראש!', kidFriendly: true },
      { name: 'פארק גואל', area: 'Gràcia', cost: 14, rating: 4.6, tags: ['פארק', 'תצפית'], imageQ: 'Park Guell', kidFriendly: true },
      { name: 'קאזה בטיו', area: 'Eixample', cost: 35, rating: 4.7, tags: ['אדריכלות', 'גאודי'], imageQ: 'Casa Batllo', kidFriendly: true },
      { name: 'חוף ברסלונטה', area: 'Barceloneta', cost: 0, rating: 4.3, tags: ['חוף', 'רגיעה'], imageQ: 'Barceloneta beach', kidFriendly: true },
      { name: 'שוק לה בוקריה', area: 'La Rambla', cost: 10, rating: 4.5, tags: ['שוק', 'אוכל'], imageQ: 'La Boqueria market', kidFriendly: true },
      { name: 'רכבל מונטג׳ואיק', area: 'Montjuïc', cost: 15, rating: 4.4, tags: ['תצפית', 'רכבל'], imageQ: 'Montjuic cable car', kidFriendly: true },
    ],
    nightlife: [
      { name: 'Paradiso', area: 'Born', cost: 45, rating: 4.6, tags: ['קוקטיילים', 'ספיקאיזי'], imageQ: 'cocktail bar' },
      { name: 'Opium Beach Club', area: 'Barceloneta', cost: 60, rating: 4.0, tags: ['מועדון', 'חוף'], imageQ: 'beach club night' },
    ],
    insights: [
      'הזמינו כרטיסים לסגרדה פמיליה לפחות שבוע מראש — בקיץ נגמרים.',
      'שכונת Eixample מרכזית והכי נוחה להליכה לאתרי גאודי.',
      'היזהרו מכייסים ברמבלה ובקו מטרו 3 — תיקים סגורים ומקדימה.',
    ],
  },
  {
    key: 'Lisbon',
    he: 'ליסבון, פורטוגל 🇵🇹',
    photo: 'Lisbon tram view',
    airlines: ['TAP Air Portugal', 'easyJet', 'Ryanair'],
    baseFlight: 210,
    weather: '24°C שמשי ומושלם להליכה',
    tags: ['city', 'culture', 'food', 'nature', 'warm'],
    hotels: [
      { name: 'Memmo Alfama', area: 'Alfama', stars: 4, rating: 9.0, pricePerNight: 190, familyFriendly: false },
      { name: 'Hotel Mundial', area: 'Baixa', stars: 4, rating: 8.4, pricePerNight: 130, familyFriendly: true },
      { name: 'Lisbon Story Guesthouse', area: 'Baixa', stars: 2, rating: 8.8, pricePerNight: 70, familyFriendly: false },
      { name: 'Hotel da Baixa', area: 'Baixa', stars: 4, rating: 9.2, pricePerNight: 175, familyFriendly: true },
    ],
    restaurants: [
      { name: 'Time Out Market', area: 'Cais do Sodré', cost: 25, rating: 4.4, tags: ['שוק אוכל', 'מגוון'], imageQ: 'food hall', social: 'מוביל בהמלצות Google', kidFriendly: true },
      { name: 'Cervejaria Ramiro', area: 'Intendente', cost: 45, rating: 4.6, tags: ['פירות ים', 'מקומי'], imageQ: 'seafood portugal', social: 'מוביל בהמלצות Reddit Lisbon', kidFriendly: true },
      { name: 'Taberna Sal Grosso', area: 'Alfama', cost: 40, rating: 4.8, tags: ['פורטוגזי', 'שורשי'], imageQ: 'portuguese tavern', social: 'מוביל בהמלצות Reddit Lisbon & Google' },
      { name: 'Pastéis de Belém', area: 'Belém', cost: 8, rating: 4.5, tags: ['מאפה', 'אייקוני'], imageQ: 'pastel de nata', kidFriendly: true },
    ],
    attractions: [
      { name: 'מגדל בלם', area: 'Belém', cost: 8, rating: 4.6, tags: ['ציון דרך', 'היסטוריה'], imageQ: 'Belem Tower', kidFriendly: true },
      { name: 'טראם 28', area: 'Alfama', cost: 3, rating: 4.3, tags: ['טראם', 'תצפית'], imageQ: 'Lisbon tram 28', kidFriendly: true },
      { name: 'מבצר סאו ז׳ורז׳ה', area: 'Alfama', cost: 15, rating: 4.5, tags: ['מבצר', 'תצפית'], imageQ: 'Sao Jorge Castle', social: 'כרטיס דיגיטלי עוקף תורים', kidFriendly: true },
      { name: 'אוקיינריום ליסבון', area: 'Parque das Nações', cost: 25, rating: 4.7, tags: ['אקווריום', 'משפחות'], imageQ: 'Lisbon oceanarium', kidFriendly: true },
      { name: 'מיראדורו סנטה לוזיה', area: 'Alfama', cost: 0, rating: 4.7, tags: ['תצפית', 'צילום'], imageQ: 'Miradouro Santa Luzia', kidFriendly: true },
      { name: 'סינטרה — ארמון פנה', area: 'Sintra', cost: 20, rating: 4.8, tags: ['ארמון', 'טיול יום'], imageQ: 'Pena Palace Sintra', kidFriendly: true },
    ],
    nightlife: [
      { name: 'Pensão Amor', area: 'Cais do Sodré', cost: 30, rating: 4.4, tags: ['בר', 'ייחודי'], imageQ: 'quirky bar' },
      { name: 'מופע פאדו — Clube de Fado', area: 'Alfama', cost: 45, rating: 4.6, tags: ['פאדו', 'מסורתי'], imageQ: 'fado music' },
    ],
    insights: [
      'ליסבון הררית — נעליים נוחות, והשתמשו בטראם/פוניקולר במיוחד עם ילדים.',
      'טיול יום לסינטרה חובה — 40 דקות ברכבת מרוסיו, צאו מוקדם.',
      'קנו Lisboa Card לתחבורה ומוזיאונים — חוסך כסף וזמן.',
    ],
  },
  {
    key: 'Rome',
    he: 'רומא, איטליה 🇮🇹',
    photo: 'Rome Colosseum',
    airlines: ['ITA Airways', 'Wizz Air', 'El Al'],
    baseFlight: 230,
    weather: '27°C שמשי',
    tags: ['city', 'culture', 'food', 'history'],
    hotels: [
      { name: 'Hotel Artemide', area: 'Via Nazionale', stars: 4, rating: 9.1, pricePerNight: 210, familyFriendly: true },
      { name: 'The Hive Hotel', area: 'Termini', stars: 3, rating: 8.6, pricePerNight: 120, familyFriendly: true },
      { name: 'Generator Rome', area: 'Trastevere', stars: 2, rating: 8.3, pricePerNight: 75, familyFriendly: false },
      { name: 'Hotel Eden', area: 'Via Veneto', stars: 5, rating: 9.4, pricePerNight: 520, familyFriendly: true },
    ],
    restaurants: [
      { name: 'Da Enzo al 29', area: 'Trastevere', cost: 35, rating: 4.7, tags: ['רומאי', 'מסורתי'], imageQ: 'roman pasta', social: 'מוביל בהמלצות Reddit Rome', kidFriendly: true },
      { name: 'Pizzarium', area: 'Prati', cost: 15, rating: 4.6, tags: ['פיצה', 'מהיר'], imageQ: 'roman pizza', kidFriendly: true },
      { name: 'Roscioli', area: 'Centro', cost: 50, rating: 4.7, tags: ['גורמה', 'יין'], imageQ: 'italian deli' },
      { name: 'Giolitti', area: 'Centro', cost: 8, rating: 4.5, tags: ['ג׳לטו', 'אייקוני'], imageQ: 'gelato', kidFriendly: true },
    ],
    attractions: [
      { name: 'הקולוסיאום', area: 'Centro', cost: 18, rating: 4.8, tags: ['ציון דרך', 'היסטוריה'], imageQ: 'Colosseum', social: 'כרטיס משולב עם הפורום', kidFriendly: true },
      { name: 'ותיקן ומוזיאונים', area: 'Vatican', cost: 25, rating: 4.7, tags: ['אמנות', 'מוזיאון'], imageQ: 'Vatican museum', kidFriendly: true },
      { name: 'מזרקת טרווי', area: 'Centro', cost: 0, rating: 4.7, tags: ['ציון דרך', 'צילום'], imageQ: 'Trevi Fountain', kidFriendly: true },
      { name: 'הפנתאון', area: 'Centro', cost: 5, rating: 4.8, tags: ['היסטוריה'], imageQ: 'Pantheon Rome', kidFriendly: true },
      { name: 'וילה בורגזה', area: 'Borghese', cost: 15, rating: 4.6, tags: ['פארק', 'אמנות'], imageQ: 'Villa Borghese', kidFriendly: true },
      { name: 'טרסטוורה — סיור רגלי', area: 'Trastevere', cost: 0, rating: 4.6, tags: ['שכונה', 'הליכה'], imageQ: 'Trastevere street', kidFriendly: true },
    ],
    nightlife: [
      { name: 'Freni e Frizioni', area: 'Trastevere', cost: 25, rating: 4.4, tags: ['אפריטיבו', 'בר'], imageQ: 'aperitivo' },
      { name: 'Terrazza Borromini', area: 'Navona', cost: 40, rating: 4.5, tags: ['גג', 'תצפית'], imageQ: 'rooftop bar rome' },
    ],
    insights: [
      'קנו כרטיס משולב לקולוסיאום+פורום מראש ובחרו שעת כניסה מוקדמת.',
      'לבשו בגדים צנועים לביקור בוותיקן — כתפיים וברכיים מכוסות.',
      'שתו מהמזרקות הציבוריות (nasoni) — מים קרים וחינם בכל העיר.',
    ],
  },
  {
    key: 'Bangkok',
    he: 'בנגקוק, תאילנד 🇹🇭',
    photo: 'Bangkok temple skyline',
    airlines: ['Thai Airways', 'El Al', 'Emirates'],
    baseFlight: 650,
    weather: '33°C חם ולח',
    tags: ['exotic', 'food', 'nightlife', 'culture', 'warm', 'city'],
    hotels: [
      { name: 'Riva Surya', area: 'Riverside', stars: 4, rating: 8.8, pricePerNight: 95, familyFriendly: true },
      { name: 'Ibis Sukhumvit 4', area: 'Sukhumvit', stars: 3, rating: 8.3, pricePerNight: 45, familyFriendly: true },
      { name: 'Mandarin Oriental', area: 'Riverside', stars: 5, rating: 9.3, pricePerNight: 420, familyFriendly: true },
      { name: 'Josh Hotel', area: 'Ari', stars: 3, rating: 8.7, pricePerNight: 60, familyFriendly: false },
    ],
    restaurants: [
      { name: 'Thipsamai Pad Thai', area: 'Old City', cost: 6, rating: 4.4, tags: ['פאד תאי', 'אייקוני'], imageQ: 'pad thai', social: 'מוביל בהמלצות Google', kidFriendly: true },
      { name: 'Jay Fai', area: 'Old City', cost: 40, rating: 4.5, tags: ['אוכל רחוב', 'מישלן'], imageQ: 'street food wok', social: 'כוכב מישלן לאוכל רחוב' },
      { name: 'Err Urban Rustic', area: 'Old City', cost: 20, rating: 4.6, tags: ['תאילנדי', 'מקומי'], imageQ: 'thai food', kidFriendly: true },
      { name: 'After You Dessert', area: 'Siam', cost: 10, rating: 4.5, tags: ['קינוחים'], imageQ: 'thai dessert', kidFriendly: true },
    ],
    attractions: [
      { name: 'הארמון הגדול', area: 'Old City', cost: 15, rating: 4.6, tags: ['מקדש', 'חובה'], imageQ: 'Grand Palace Bangkok', social: 'קוד לבוש מחמיר', kidFriendly: true },
      { name: 'וואט ארון', area: 'Riverside', cost: 3, rating: 4.7, tags: ['מקדש', 'תצפית'], imageQ: 'Wat Arun', kidFriendly: true },
      { name: 'שוק צ׳אטוצ׳אק', area: 'Chatuchak', cost: 10, rating: 4.4, tags: ['שוק', 'קניות'], imageQ: 'Chatuchak market', kidFriendly: true },
      { name: 'שייט בנהר הצ׳או פראיה', area: 'Riverside', cost: 5, rating: 4.3, tags: ['שייט', 'תצפית'], imageQ: 'Chao Phraya boat', kidFriendly: true },
      { name: 'שוק צף דמנואן סדואק', area: 'Ratchaburi', cost: 20, rating: 4.2, tags: ['שוק צף', 'טיול יום'], imageQ: 'floating market', kidFriendly: true },
    ],
    nightlife: [
      { name: 'Sky Bar (Lebua)', area: 'Silom', cost: 50, rating: 4.3, tags: ['גג', 'תצפית'], imageQ: 'rooftop bar bangkok' },
      { name: 'Khao San Road', area: 'Old City', cost: 20, rating: 4.0, tags: ['רחוב', 'תרמילאים'], imageQ: 'Khao San Road night' },
    ],
    insights: [
      'השתמשו ב-BTS/MRT כדי לעקוף פקקים — התחבורה מעל הקרקע מהירה.',
      'הארמון הגדול והמקדשים דורשים כתפיים וברכיים מכוסות.',
      'שתו רק מים מבקבוק, וקחו כסף מזומן לשווקים.',
    ],
  },
  {
    key: 'Amsterdam',
    he: 'אמסטרדם, הולנד 🇳🇱',
    photo: 'Amsterdam canal',
    airlines: ['KLM', 'El Al', 'Transavia'],
    baseFlight: 240,
    weather: '19°C נעים ומעונן חלקית',
    tags: ['city', 'culture', 'nature', 'nightlife'],
    hotels: [
      { name: 'The Hoxton', area: 'Herengracht', stars: 4, rating: 9.0, pricePerNight: 230, familyFriendly: true },
      { name: 'CitizenM', area: 'Centrum', stars: 4, rating: 8.8, pricePerNight: 160, familyFriendly: true },
      { name: 'ClinkNOORD', area: 'Noord', stars: 2, rating: 8.4, pricePerNight: 80, familyFriendly: false },
      { name: 'Waldorf Astoria', area: 'Herengracht', stars: 5, rating: 9.3, pricePerNight: 560, familyFriendly: true },
    ],
    restaurants: [
      { name: 'Foodhallen', area: 'Oud-West', cost: 25, rating: 4.4, tags: ['שוק אוכל', 'מגוון'], imageQ: 'food hall', kidFriendly: true },
      { name: 'The Pancake Bakery', area: 'Jordaan', cost: 18, rating: 4.5, tags: ['פנקייק', 'הולנדי'], imageQ: 'dutch pancake', kidFriendly: true },
      { name: 'Moeders', area: 'Jordaan', cost: 30, rating: 4.6, tags: ['ביתי', 'מקומי'], imageQ: 'dutch food', social: 'מוביל בהמלצות Reddit' },
    ],
    attractions: [
      { name: 'מוזיאון ואן גוך', area: 'Museumplein', cost: 22, rating: 4.7, tags: ['אמנות', 'מוזיאון'], imageQ: 'Van Gogh museum', social: 'הזמנה מראש חובה', kidFriendly: true },
      { name: 'בית אנה פרנק', area: 'Centrum', cost: 16, rating: 4.8, tags: ['היסטוריה'], imageQ: 'Anne Frank house', social: 'כרטיסים נגמרים שבועות מראש' },
      { name: 'שייט בתעלות', area: 'Centrum', cost: 18, rating: 4.5, tags: ['שייט', 'תצפית'], imageQ: 'Amsterdam canal cruise', kidFriendly: true },
      { name: 'פארק ונדל', area: 'Vondelpark', cost: 0, rating: 4.6, tags: ['פארק', 'רגיעה'], imageQ: 'Vondelpark', kidFriendly: true },
      { name: 'שוק אלברט קאופ', area: 'De Pijp', cost: 10, rating: 4.4, tags: ['שוק', 'אוכל'], imageQ: 'Albert Cuyp market', kidFriendly: true },
    ],
    nightlife: [
      { name: 'Melkweg', area: 'Leidseplein', cost: 30, rating: 4.4, tags: ['מועדון', 'הופעות'], imageQ: 'live music club' },
      { name: "Cafe 't Smalle", area: 'Jordaan', cost: 20, rating: 4.6, tags: ['בר תעלה', 'קלאסי'], imageQ: 'canal pub' },
    ],
    insights: [
      'שכרו אופניים — הדרך הכי אמיתית והמהירה לנוע בעיר.',
      'הזמינו כרטיסים לבית אנה פרנק ולוואן גוך שבועות מראש.',
      'היזהרו מנתיבי אופניים — הם מהירים ובעדיפות על הולכי רגל.',
    ],
  },
  {
    key: 'Athens',
    he: 'אתונה, יוון 🇬🇷',
    photo: 'Athens Acropolis',
    airlines: ['Aegean', 'El Al', 'Ryanair'],
    baseFlight: 160,
    weather: '29°C שמשי ויבש',
    tags: ['culture', 'history', 'food', 'beach', 'warm', 'city'],
    hotels: [
      { name: 'Coco-Mat Athens BC', area: 'Kolonaki', stars: 4, rating: 9.0, pricePerNight: 170, familyFriendly: true },
      { name: 'A for Athens', area: 'Monastiraki', stars: 3, rating: 8.7, pricePerNight: 110, familyFriendly: true },
      { name: 'City Circus Hostel', area: 'Psiri', stars: 2, rating: 8.5, pricePerNight: 55, familyFriendly: false },
      { name: 'Grande Bretagne', area: 'Syntagma', stars: 5, rating: 9.4, pricePerNight: 400, familyFriendly: true },
    ],
    restaurants: [
      { name: 'Ta Karamanlidika', area: 'Psiri', cost: 25, rating: 4.7, tags: ['מזה', 'מקומי'], imageQ: 'greek meze', social: 'מוביל בהמלצות Google', kidFriendly: true },
      { name: 'Kostas Souvlaki', area: 'Syntagma', cost: 6, rating: 4.6, tags: ['סובלאקי', 'רחוב'], imageQ: 'souvlaki', kidFriendly: true },
      { name: 'Nolan', area: 'Syntagma', cost: 35, rating: 4.6, tags: ['פיוז׳ן', 'מודרני'], imageQ: 'modern greek food' },
    ],
    attractions: [
      { name: 'האקרופוליס', area: 'Plaka', cost: 20, rating: 4.8, tags: ['ציון דרך', 'היסטוריה'], imageQ: 'Acropolis', social: 'הגיעו עם הפתיחה להימנע מחום ותורים', kidFriendly: true },
      { name: 'מוזיאון האקרופוליס', area: 'Plaka', cost: 15, rating: 4.7, tags: ['מוזיאון'], imageQ: 'Acropolis museum', kidFriendly: true },
      { name: 'שכונת פלאקה', area: 'Plaka', cost: 0, rating: 4.6, tags: ['שכונה', 'הליכה'], imageQ: 'Plaka Athens', kidFriendly: true },
      { name: 'גבעת ליקוואיטוס', area: 'Kolonaki', cost: 8, rating: 4.5, tags: ['תצפית', 'שקיעה'], imageQ: 'Lycabettus hill', kidFriendly: true },
      { name: 'טיול יום לקייפ סוניון', area: 'Sounion', cost: 25, rating: 4.6, tags: ['מקדש', 'ים'], imageQ: 'Temple of Poseidon Sounion', kidFriendly: true },
    ],
    nightlife: [
      { name: 'A for Athens Rooftop', area: 'Monastiraki', cost: 30, rating: 4.6, tags: ['גג', 'תצפית'], imageQ: 'rooftop acropolis view' },
      { name: 'Six Dogs', area: 'Monastiraki', cost: 25, rating: 4.4, tags: ['בר', 'חצר'], imageQ: 'garden bar' },
    ],
    insights: [
      'בקרו באקרופוליס עם הפתיחה (08:00) — פחות חום ופחות תורים.',
      'כרטיס משולב לאתרים הארכיאולוגיים משתלם אם מבקרים ב-3+ אתרים.',
      'טיול יום לקייפ סוניון לשקיעה מול מקדש פוסידון — מומלץ מאוד.',
    ],
  },
];

export function findDestination(nameOrKey: string): MockDestination | undefined {
  const q = nameOrKey.trim().toLowerCase();
  return (
    CATALOG.find((d) => d.key.toLowerCase() === q || d.he.includes(nameOrKey.trim())) ||
    CATALOG.find((d) => d.key.toLowerCase().includes(q) || q.includes(d.key.toLowerCase()))
  );
}
