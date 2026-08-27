export const PH_ZONES: Record<number, {
  fee: any; name: string; keywords: string[] 
}> = {
  1: {
    name: 'PH 1 (Woji, Elelenwo, Rumuibekwe, Rumuomasi, Trans Amadi, Peter Odili, Old Aba Road)',
    keywords: [
      // Core Areas & Towns
      'woji', 'elelenwo', 'rumuibekwe', 'rumuomasi', 'trans amadi', 'peter odili', 'odili road',
      'old aba road', 'rumuobiokani', 'slaughter', 'mothercat', 'yitis', 'alcon', 'fata',
      'abacha road trans amadi', 'ordinance', 'ordinance road', 'black diamond', 'mini woji',
      'woji estate', 'woji town', 'alcon road', 'alcon junction', 'federal housing woji',
      'okuru', 'okuru ama', 'abuloma jetty axis', 'amadi flat', 'trans amadi industrial layout',
      
      // Streets & Express Routes
      'old aba express', 'old aba road slaughter', 'slaughter flyover', 'slaughter market',
      'woji flyover', 'woji junction', 'rumuibekwe housing estate', 'shell residential area',
      'shell ra', 'shell gate 1', 'shell gate 2', 'nlng residential area', 'nlng quarters',
      'intels camp', 'dr. peter odili road', 'somitel', 'somitel road', 'trans amadi road',
      'dstv office woji', 'veterinary junction', 'marine base trans amadi axis', 'muri okunola',
      'total gospel road', 'green village estate', 'rainbow town', 'golf estate', 'golf estate woji',
      'daddy marine', 'brookstone school', 'woodbridge', 'the vineyard', 'covenant university liaison',
      
      // Landmarks, Malls & Markets
      'next cash and carry', 'next cash & carry', 'market square woji', 'market square trans amadi',
      'spar woji road', 'jevinik trans amadi', 'genesis trans amadi', 'hypercity woji',
      'woji modern market', 'slaughter abattoir', 'air force gate woji', 'helena haven',
      'rivtaf golf estate', 'pearl court', 'grandvenice', 'golden tulip trans amadi',
      'hotel presidential trans amadi axis', 'somitel hotel', 'charis hotel woji',
      'carmel hospital woji', 'st. martin hospital', 'bupa hospital trans amadi',
      
      // Churches & Hostels
      'salvation ministries woji', 'salvation ministries trans amadi', 'omega fire woji',
      'redeemed woji', 'rccg royal parish woji', 'christ embassy woji', 'st. michael anglican woji',
      'st. jude catholic woji', 'living faith woji', 'winners chapel woji', 'house on the rock woji',
      'corpus christi trans amadi', 'assembly of god woji', 'deeper life elelenwo',
      
      // Elelenwo Specific Hubs
      'elelenwo junction', 'old refinery road elelenwo', 'railway elelenwo', 'oil mill link elelenwo',
      'cooperative estate elelenwo', 'citadel estate', 'prime estate elelenwo', 'royal estate elelenwo',
      'st. mark anglican elelenwo', 'glorious light elelenwo', 'pipeline road elelenwo'
    ],
  },

  2: {
    name: 'PH 2 (Abuloma, Garrison, D-Line, Waterlines, Elekahia, Nkpogu, Stadium Road, Bori Camp)',
    keywords: [
      // Core Areas & Districts
      'abuloma', 'abuluoma', 'garrison', 'dline', 'd-line', 'waterlines', 'water lines',
      'elekahia', 'nkpogu', 'stadium road', 'stadium rd', 'bori camp', 'air force base',
      'airforce base', 'air force secondary', 'amadi ama', 'amadi-ama', 'stadium link road',
      
      // Major Streets & Junctions
      'aba road garrison', 'garrison roundabout', 'garrison flyover', 'rebisi', 'rebisi flyover',
      'waterlines flyover', 'waterlines junction', 'first bank dline', 'olu obasanjo road',
      'obasanjo road', 'kaduna street', 'kano street', 'calabar street', 'ikwerre road garrison',
      'ogbunabali', 'ogbunabali road', 'elekahia housing estate', 'liberation stadium',
      'yakubu gowon stadium', 'air force gate', 'aba road waterlines', 'presidential flyover',
      'hotel presidential junction', 'railway line dline', 'tetlow street', 'omorolu street',
      'chigbu street', 'nwosu street', 'agudama street', 'abuja lane', 'wetheral street dline',
      'nkpogu bridge', 'nkpogu roundabout', 'somitel junction', 'total waterlines',
      
      // Landmarks, Plazas, Hotels & Malls
      'hotel presidential', 'port harcourt club 1928', 'feedwell supermarket dline',
      'market square dline', 'market square stadium road', 'everyday supermarket dline',
      'dominos pizza stadium road', 'cold stone stadium road', 'sweet tooth stadium road',
      'genesis deluxe cinema stadium road', 'the autotent', 'charles dale port harcourt office',
      'casablanca stadium road', 'dr. rasheed hospital dline', 'mercy land hospital',
      'military hospital port harcourt', 'bmh', 'braithwaite memorial hospital', 'rivers state university teaching hospital',
      'rsuth', 'st. nicolas hospital dline', 'silverbird cinema garrison',
      
      // Churches & Institutions
      'salvation ministries dline', 'salvation ministries stadium road', 'living faith waterlines',
      'winners chapel waterlines', 'rccg redemption camp stadium road', 'christ embassy garrison',
      'st. paul anglican garrison', 'st. john anglican dline', 'holy trinity church rumuomasi axis',
      'sacred heart catholic church dline', 'our lady of the holy rosary church', 'mountain of fire dline'
    ],
  },

  3: {
    name: 'PH 3 (Eneka, Rumuodara, Eliozu, Rumukrushi, Rumuigbo, Artillery, Oil Mill, Tank)',
    keywords: [
      // Core Areas & Hubs
      'eneka', 'eneka road', 'rumuodara', 'eliozu', 'rumukrushi', 'rumuokwurusi', 'rumuigbo',
      'artillery', '1st artillery', 'first artillery', '2nd artillery', 'second artillery',
      'tank', 'tank junction', 'oil mill', 'oil mill market', 'oilmill', 'oil mill flyover',
      'okporo', 'okporo road', 'eliowhani', 'elimgbu', 'atali', 'rumunduru', 'rumupakwolusi',
      'mgbodo', 'rumuonueke', 'odani', 'odani green city', 'igwuruta road rumuokwurusi axis',
      
      // Roads, Junctions & Expressways
      'aba expressway artillery', 'aba road artillery', 'artillery flyover', 'rumukrushi flyover',
      'eliozu flyover', 'eliozu roundabout', 'eneka round about', 'eneka junction', 'igbo-etche road',
      'tank flyover', 'rumuodara junction', 'rumuodara flyover', 'okporo junction', 'rumukrushi pipeline',
      'trans amadi link road rumuobiokani/rumuigbo', 'psychiatric road', 'psychiatric hospital road',
      'ikwerre road rumuigbo', 'deeper life junction rumuigbo', 'mummy b road', 'mummy b church road',
      'whimpey junction', 'rumuigbo junction', 'st. john campus rumuigbo', 'shell location road',
      
      // Landmarks, Malls & Markets
      'oil mill bridge', 'market square rumuodara', 'everyday supermarket artillery',
      'drumstix artillery', 'kilimanjaro artillery', 'hypercity eliozu', 'market square eliozu',
      'crunches artillery', 'genesis restaurant artillery', 'pinnacle food eliozu',
      'psychiatric hospital rumuigbo', 'st. martin hospital eliozu', 'neuropsychiatric hospital',
      'save a life hospital okporo', 'save a life hospital rumuodara', 'rehoboth hospital eneka',
      'brookstone secondary school igbo-etche link', 'anchor hotel eliozu', 'de valley hotel',
      
      // Churches & Hostels
      'salvation ministries artillery', 'salvation ministries eliozu', 'salvation ministries rumuodara',
      'salvation ministries eneka', 'living faith church tank', 'winners chapel oil mill',
      'christ embassy artillery', 'rccg desire of nations okporo', 'anglican cathedral rumuigbo',
      'st. matthew catholic church rumuigbo', 'holy family catholic church eliozu',
      'st. mary catholic church eneka', 'apostolic church rumuodara', 'deeper life regional camp eneka'
    ],
  },

  4: {
    name: 'PH 4 (GRA Phase 1-4, Oroazi, Old Ikwerre Road, Ada George, Agip, Iwofe, Mile 1-4, RSU)',
    keywords: [
      // Core Areas & Quarters
      'gra', 'gra phase 1', 'gra phase 2', 'gra phase 3', 'gra phase 4', 'oroazi',
      'old ikwerre road', 'ada george', 'ada-george', 'agip', 'agip estate', 'iwofe',
      'iwofe road', 'mile 1', 'mile 2', 'mile 3', 'mile 4', 'mile one', 'mile two',
      'mile three', 'mile four', 'rumueme', 'rumuopareli', 'chindah', 'chinda',
      'eagle island', 'nkpolu', 'nkpolu oroworukwo', 'ust', 'rsu', 'rivers state university',
      'ignatius ajuru university', 'iaue', 'iaue iwofe', 'st. john campus',
      
      // Streets, Avenues & Junctions
      'tombia street', 'tombia extension', 'abacha road', 'general sani abacha road',
      'woji road gra', 'birabi street', 'king ponds road', 'manilla pepple street',
      'dan anyiam street', 'ezimgbu linkage road', 'mummy b church road gra', 'ikwerre road mile 1',
      'ikwerre road mile 3', 'ikwerre road mile 4', 'agip roundabout', 'agip flyover',
      'ada george junction', 'loco junction', ' Wimpy junction', 'chinda junction',
      'pepperoni junction ada george', 'location junction ada george', 'igwuruta link ada george',
      'nstu road', 'iwofe roundabout', 'minikpiti', 'rumuolumeni', 'st. john iwofe',
      'eagle island estate', 'marine base mile 1', 'education bus stop', 'diobu', 'diobu mile 1',
      'diobu mile 2', 'diobu mile 3', 'lumumba street', 'timber street mile 2', 'abakaliki street',
      'afam street diobu', 'ikot ekpene street', 'ujamu street', 'echue street',
      
      // Malls, Plazas & Leisure
      'port harcourt mall', 'ph mall', 'spar port harcourt mall', 'genesis deluxe cinemas gra',
      'genesis restaurant gra', 'kilimanjaro gra', 'sweet tooth gra', 'coldstone gra',
      'market square ada george', 'market square agip', 'everyday supermarket gra',
      'hypercity gra', 'the hub event center', 'the atrium stadium road/gra', 'bougainvillea hotel',
      'le meridian gra', 'apex hospital gra', 'bassi hospital', 'beecroft hospital',
      'kelsey harrison hospital', 'mile 3 market', 'mile 1 market', 'fruit garden market',
      
      // University Hostels & Campus
      'rsu hostel', 'ust hostel', 'hostel a rsu', 'hostel b rsu', 'hostel c rsu', 'hostel d rsu',
      'hostel e rsu', 'hostel f rsu', 'post graduate hostel rsu', 'iaue campus', 'iaue hostel',
      'rumuolumeni campus iaue', 'nddc hostel ust',
      
      // Major Churches
      'salvation ministries gra', 'salvation ministries home of success', 'salvation ministries headquarters',
      'salvation ministries ada george', 'salvation ministries iwofe', 'living faith church iwofe',
      'house on the rock gra', 'david christian centre gra', 'the elevation church gra',
      'christ embassy mile 1', 'christ embassy mile 3', 'st. andrew anglican diobu',
      'st. thomas catholic church diobu', 'corpus christi cathedral diobu', 'redeemed gra camp'
    ],
  },

  5: {
    name: 'PH 5 (Rumuodumaya, Rumuokoro, Rumuagholu, Rukpokwu, Mgbougba, Ozuoba, NTA Road)',
    keywords: [
      // Core Areas & Towns
      'rumuodumaya', 'rumuokoro', 'rumuagholu', 'rukpokwu', 'mbgougba', 'mgbougba',
      'ozuoba', 'nta road', 'nta', 'sars road', 'airport road rumuokoro axis', 'elieke',
      'obio akpor council secretariat', 'obio/akpor lga', 'green city rukpokwu',
      
      // Junctions & Major Roads
      'rumuokoro flyover', 'rumuokoro roundabout', 'rumuokoro market', 'rumuagholu pipeline',
      'rumuagholu junction', 'rukpokwu round about', 'rukpokwu junction', 'sars road junction',
      'sars headquarters', 'apc road rukpokwu', 'chief road rukpokwu', 'mgbougba junction',
      'nitel junction mgbougba', 'nta junction', 'nta-choba road', 'ozuoba junction',
      'ozuoba-rumuosi link', 'special anti-robbery squad road', 'ikwerre road rumuokoro',
      'east west road rumuokoro', 'east-west road rumuodumaya', 'bori camp back gate',
      'federal government college port harcourt', 'fgc ph',
      
      // Landmarks & Supermarkets
      'market square rumuokoro', 'market square mgbougba', 'everyday supermarket mgbougba',
      'jevinik mgbougba', 'kilimanjaro rumuokoro', 'pinnacle food rumuokoro', 'crunches rumuokoro',
      'heliconia park', 'shanghai hotel', 'emerald hotel rumuokoro', 'dline link mgbougba',
      'rachel hospital rumuokoro', 'kupa medical center', 'spring rose hospital',
      
      // Churches & Hostels
      'salvation ministries rumuokoro', 'salvation ministries rukpokwu', 'salvation ministries mgbougba',
      'salvation ministries ozuoba', 'living faith rumuodumaya', 'winners chapel rumuokoro',
      'omega fire ministries rumuokoro', 'rccg throne of grace rumuagholu', 'christ embassy rumuokoro',
      'st. peters catholic church rumuokoro', 'holy trinity anglican rumuodumaya',
      'dunamis church rumuokoro', 'deeper life bible church rumuodumaya'
    ],
  },

  6: {
    name: 'PH 6 (Old GRA, Azikiwe Road, Lagos Bus Stop, Town, Borokiri, Secretariat, Marine Base)',
    keywords: [
      // Core Towns & Quarters
      'old gra', 'azikiwe', 'azikiwe road', 'lagos busstop', 'lagos bus stop', 'town',
      'port harcourt township', 'borokiri', 'marine base', 'creek road', 'aggrey road',
      'harley street', 'forces avenue', 'secretariat', 'rivers state secretariat',
      'brick house', 'government house port harcourt', 'judiciary complex', 'state assembly',
      'nembe waterside', 'okrika waterside', 'bonny waterside', 'bille waterside',
      'dockyard', 'dockyard road', 'customs barracks', 'prison barracks', 'wharf',
      'port terminal', 'nigerian ports authority', 'npa port harcourt',
      
      // Streets & Junctions
      'bank road', 'station road', 'moscow road', 'alhabra street', 'field road',
      'churchill road', 'victor malcolm street', 'kingsway road', 'broad street',
      'bernard carr street', 'bishop johnson street', 'sandfield borokiri', 'rex lawson street',
      'cemetery road', 'gladstone street', 'victoria street town', 'benue street',
      'enugu street town', 'aba road leventis', 'leventis bus stop', 'utc junction',
      'standrews square', 'suppo street', 'macarthy street',
      
      // Landmarks, Markets & Hotels
      'creek road market', 'town market', 'borokiri sandfield market', 'marine base market',
      'spar old gra', 'presidential quarters old gra', 'hypercity town', 'old township stadium',
      'port harcourt cemetery', 'alden hotel', 'praise hotel old gra', 'monty suites old gra',
      'braithewaite memorial specialist specialist hospital', 'bmsh', 'police clinic town',
      'dental hospital old gra', 'military hospital barracks',
      
      // Schools, Hostels & Churches
      'rivers state college of health science', 'college of health technology',
      'hostels college of health', 'baptist high school town', 'archdeacon crowther memorial',
      'salvation ministries town', 'salvation ministries borokiri', 'st. peters church borokiri',
      'st. cyprian anglican church hospital road', 'sacred heart cathedral churchill',
      'living faith town', 'christ church interdenominational forces avenue',
      'wesley methodist church harbour road', 'rccg kings parish town'
    ],
  },

  7: {
    name: 'PH 7 (Choba, Rumuosi, Alakahia, UNIPORT Campuses, UPTH, Aluu Axis)',
    keywords: [
      // Core Towns & Campus Districts
      'choba', 'choba junction', 'rumuosi', 'alakahia', 'alakahia junction',
      'uniport', 'university of port harcourt', 'upth', 'uniport teaching hospital',
      'university of port harcourt teaching hospital', 'aluu', 'mbodo aluu', 'omokiri aluu',
      'omueke aluu', 'aluu junction', 'ikwerre road rumuosi', 'east west road choba',
      'choba bridge', 'choba water side', 'new layout choba', 'river ethiope choba',
      
      // Campuses & Faculties
      'uniport delta campus', 'delta campus', 'uniport choba campus', 'choba campus',
      'uniport abuja campus', 'abuja campus uniport', 'uniport basic studies',
      'uniport bs', 'uniport convocation arena', 'uniport senate building', 'uniport park',
      'upth emergency', 'upth permanent site', 'upth gate', 'clinical hostel upth',
      
      // All UNIPORT Hostels & Halls of Residence
      'hostel choba', 'hostel delta', 'hostel abuja', 'nelson mandela hall', 'mandela hostel',
      'kwame nkrumah hall', 'nkrumah hostel', 'dan etete hostel', 'claude ake hall',
      'aminu kano hall', 'king jajahall', 'jaja hostel', 'queen elizabeth hall',
      'elizabeth hostel', 'medical hostel uniport', 'post graduate hostel uniport',
      'nddc hostel uniport', 'alumni hostel uniport', 'tiv hostel', 'abuja hostel block a',
      'abuja hostel block b', 'abuja hostel block c', 'abuja hostel block d',
      'goodluck jonathan hostel', 'mariam abacha hostel', 'femi gbajabiamila hostel',
      
      // Landmarks, Hotels & Food
      'market square choba', 'everyday supermarket choba', 'kilimanjaro choba',
      'pinnacle restaurant choba', 'genesis restaurant choba', 'crunchies choba',
      'choba modern market', 'alakahia market', 'upth doctors quarters', 'hotel de prestige choba',
      'choba hotel', 'bevan hotel alakahia', 'uniport guest house',
      
      // Churches
      'salvation ministries choba', 'salvation ministries alakahia', 'salvation ministries rumuosi',
      'living faith church choba', 'winners chapel choba', 'our lady seat of wisdom catholic uniport',
      'st. thomas anglican church choba', 'christ ambassadors uniport', 'rccg fountain of living water choba',
      'rccg campus parish uniport', 'deeper life camp ground rumuosi'
    ],
  },

  8: {
    name: 'PH 8 (Akpajo, Oyigbo, Iriebe, Etche Road, Igwuruta, Eleme, Airport Omagwa)',
    keywords: [
      // Core Towns & Communities
      'akpajo', 'akpajo junction', 'oyigbo', 'oyigbo express', 'iriebe', 'etche', 'etche road',
      'igwuruta', 'igwuruta-ali', 'igwuruta round about', 'eleme', 'eleme junction',
      'eleme refinery', 'refinery junction', 'aleto', 'agbonchia', 'ogale', 'alesa eleme',
      'omagwa', 'port harcourt airport', 'port harcourt international airport', 'ph international airport',
      'airport road igwuruta', 'afam road oyigbo', 'kom-kom oyigbo', 'timber market iriebe',
      'indorama eleme', 'indorama gate', 'notore chemical', 'notore gate',
      
      // Landmarks, Junctions & Institutions
      'oil mill to akpajo axis', 'ph-aba expressway iriebe', 'p-h aba expressway oyigbo',
      'trailer park akpajo', 'indorama junction', 'refinery gate eleme', 'eleme petro-chemicals',
      'federal housing estate igwuruta', 'charles dale memorial international school igwuruta',
      'brookstone school igwuruta axis', 'admiralty university liaison igwuruta',
      'salvation ministries cathedral igwuruta', 'hand of god cathedral igwuruta',
      'home of success igwuruta', 'salvation ministries igwuruta city',
      
      // Markets, Plazas & Hospitals
      'timber market oyigbo', 'timber market iriebe', 'oyigbo modern market', 'akpajo market',
      'eleme main market', 'igwuruta daily market', 'general hospital eleme',
      'ebenezer hospital oyigbo', 'airport transit hotel omagwa', 'international airport terminal',
      
      // Churches
      'salvation ministries hand of god', 'salvation ministries igwuruta', 'salvation ministries oyigbo',
      'salvation ministries akpajo', 'living faith church eleme', 'winners chapel oyigbo',
      'christ embassy oyigbo', 'rccg province 5 headquarters oyigbo', 'st. pauls catholic igwuruta',
      'st. patricks catholic oyigbo', 'anglican cathedral of the transfiguration igwuruta'
    ],
  },

  9: {
    name: 'PH 9 (Onne Port, Okrika, Trailer Park, Bori, Afam, Bonny Terminal Axis)',
    keywords: [
      // Core Outlying Ports & Towns
      'onne', 'onne port', 'onne free trade zone', 'onne oil and gas free zone', 'flt onne',
      'fot onne', 'federal lighter terminal', 'federal ocean terminal', 'okrika', 'okrika town',
      'ogoloma', 'bolo', 'isaka', 'trailer park onne', 'afam', 'afam power plant',
      'bori', 'bori ogoni', 'khana', 'gokana', 'tai', 'eleme onne junction', 'ogoni',
      'sakpenwa', 'kono waterside', 'nonwa', 'saakpenwa',
      
      // Industrial Complexes & Ports
      'west africa container terminal', 'wact onne', 'bap onne', 'intels onne camp',
      'starzs marine onne', 'adamac onne', 'prodeco camp onne', 'technip onne',
      'nlng terminal bonny transit hub', 'okrika refinery jetty', 'nnpc depot okrika',
      'port harcourt refining company complex', 'deep sea port onne',
      
      // Landmarks & Institutions
      'ken saro-wiwa polytechnic', 'ken poly bori', 'ken saro wiwa polytechnic hostels',
      'rivers state polytechnic bori', 'general hospital bori', 'general hospital okrika',
      'general hospital onne', 'federal high court bori division', 'sacred heart hospital onne',
      
      // Churches
      'salvation ministries onne', 'salvation ministries okrika', 'salvation ministries bori',
      'living faith church onne', 'winners chapel bori', 'st. peters cathedral okrika',
      'rccg onne industrial area', 'christ embassy bori'
    ],
  },
}

export const DELIVERY_MATRIX: Record<string, number> = {
  '1-1': 3000, '2-2': 3000, '3-3': 3000, '4-4': 3000, '5-5': 3000,
  '6-6': 3500, '7-7': 3000, '8-8': 5000, '9-9': 5000,
  '1-2': 3000, '1-3': 3500, '1-4': 3500, '1-5': 3500,
  '1-6': 4000, '1-7': 5000, '1-8': 8000, '1-9': 8500,
  '2-3': 3000, '2-4': 3500, '2-5': 3500, '2-6': 3500,
  '2-7': 3500, '2-8': 6500, '2-9': 7500,
  '3-4': 3500, '3-5': 3000, '3-6': 4500, '3-7': 4500,
  '3-8': 7000, '3-9': 9000,
  '4-5': 3500, '4-6': 3500, '4-7': 3500, '4-8': 5500, '4-9': 7500,
  '5-6': 3500, '5-7': 4500, '5-8': 6500, '5-9': 7000,
  '6-7': 4500, '6-8': 7000, '6-9': 8500,
  '7-8': 6500, '7-9': 9000,
  '8-9': 7500,
  '9-1': 10500, '9-2': 10500, '9-3': 10500, '9-4': 10500,
  '9-5': 10500, '9-6': 10500, '9-7': 10500,
}

export const OUT_OF_ZONE_FEE = 10500

export function getDeliveryFee(originZone: number, destZone: number | null): number {
  if (!destZone) return OUT_OF_ZONE_FEE
  const key = `${originZone}-${destZone}`
  const reverseKey = `${destZone}-${originZone}`
  if (DELIVERY_MATRIX[key]) return DELIVERY_MATRIX[key]
  if (DELIVERY_MATRIX[reverseKey]) return DELIVERY_MATRIX[reverseKey]
  return OUT_OF_ZONE_FEE
}