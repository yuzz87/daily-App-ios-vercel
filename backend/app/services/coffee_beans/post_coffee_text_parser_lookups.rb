module CoffeeBeans
  module PostCoffeeTextParserLookups
    COUNTRIES = %w[
      BRAZIL
      COLOMBIA
      COSTA\ RICA
      EL\ SALVADOR
      ETHIOPIA
      GUATEMALA
      HONDURAS
      INDONESIA
      KENYA
      NICARAGUA
      PANAMA
      PERU
      RWANDA
    ].freeze

    COUNTRY_ALIASES = {
      "INDONESIA" => /\b(?:INDONESIA|INDONESI|INDONES|NDONES|IND0NESIA|1NDONESIA)\b/,
      "ETHIOPIA" => /\b(?:ETHIOPIA|ETHIOPI|ETHOPIA|ET?H10PIA)\b/,
      "COLOMBIA" => /\b(?:COLOMBIA|COLOMBI|C0LOMBIA)\b/,
      "KENYA" => /\b(?:KENYA|KEMYA)\b/,
      "BRAZIL" => /\b(?:BRAZIL|BRASIL|8RAZIL)\b/,
      "GUATEMALA" => /\b(?:GUATEMALA|GUATEMAL|GUATEM4LA)\b/,
      "HONDURAS" => /\b(?:HONDURAS|HONDURA5)\b/,
      "RWANDA" => /\b(?:RWANDA|RWAND4)\b/,
      "PANAMA" => /\b(?:PANAMA|PAN4MA)\b/,
      "PERU" => /\b(?:PERU|PERV)\b/,
      "NICARAGUA" => /\b(?:NICARAGUA|NICARAGU4)\b/,
      "COSTA RICA" => /\b(?:COSTA\s*RICA|C0STA\s*RICA)\b/,
      "EL SALVADOR" => /\b(?:EL\s*SALVADOR|EL\s*SALVAD0R)\b/
    }.freeze

    ROAST_LEVEL_ALIASES = {
      "LIGHTROAST" => /\b(?:LIGHT|L1GHT|LIG?HT)\s*(?:ROAST|R0AST|RO4ST)\b/,
      "MEDIUMROAST" => /\b(?:MEDIUM|MED1UM)\s*(?:ROAST|R0AST|RO4ST)\b/,
      "DARKROAST" => /\b(?:DARK|D4RK)\s*(?:ROAST|R0AST|RO4ST)\b/
    }.freeze

    FLAVOR_NOTE_ALIASES = {
      "Blueberry" => /\b(?:BLUEBERRY|BLUEBERR[YV]|8LUEBERRY)\b/,
      "Kiwi" => /\bKIWI\b/,
      "Raspberry" => /\b(?:RASPBERRY|RASPBERR[YV])\b/,
      "Hibiscus" => /\b(?:HIBISCUS|HIB1SCUS)\b/,
      "Strawberry" => /\b(?:STRAWBERRY|STRAWBERR[YV])\b/,
      "Cherry" => /\bCHERRY\b/,
      "Apple" => /\bAPPLE\b/,
      "Orange" => /\bORANGE\b/,
      "Lemon" => /\bLEMON\b/,
      "Grape" => /\bGRAPE\b/,
      "Peach" => /\bPEACH\b/,
      "Floral" => /\bFLORAL\b/,
      "Chocolate" => /\b(?:CHOCOLATE|CH0COLATE)\b/,
      "Caramel" => /\bCARAMEL\b/,
      "Honey" => /\bHONEY\b/,
      "Tea" => /\bTEA\b/,
      "Citrus" => /\bCITRUS\b/,
      "Winey" => /\bWINEY\b/
    }.freeze

    SPEC_LABEL_ALIASES = {
      "Region" => /\b(?:REGION|REG10N|REGI0N|REGlON)\b/i,
      "Process" => /\b(?:PROCESS|PR0CESS|PR0CE55)\b/i,
      "Variety" => /\b(?:VARIETY|VAR1ETY|VARIETV)\b/i,
      "Elevation" => /\b(?:ELEVATION|ELEVATI0N|ELEVATlON)\b/i,
      "Farmer" => /\b(?:FARMER|FARNER)\b/i,
      "Farm" => /\bFARM\b/i
    }.freeze

    COUNTRY_BY_CODE_PREFIX = {
      "BRA" => "BRAZIL",
      "COL" => "COLOMBIA",
      "CRI" => "COSTA RICA",
      "SLV" => "EL SALVADOR",
      "ETH" => "ETHIOPIA",
      "GUA" => "GUATEMALA",
      "HON" => "HONDURAS",
      "IND" => "INDONESIA",
      "KEN" => "KENYA",
      "NIC" => "NICARAGUA",
      "PAN" => "PANAMA",
      "PER" => "PERU",
      "RWA" => "RWANDA"
    }.freeze

    SPEC_LABELS_PATTERN = "Region|Process|Variety|Elevation|Farmer|Farm|ROAST\\s*DATE".freeze
    NOISE_WORDS_PATTERN = /\b(?:MAKE|TIME|ENJOY|FRESHLY|BREWED|COFFEE|BROUGHT|ENDULGE|DELICIOUS|READING|FAVORITE|BOOKS|LISTENING|MUSIC|WATCHING|MOVIES|CONNECT|INTIMATELY|SPENDING|MEMORIES|BELOVED|CUP|ROAST|DATE)\b/i
  end
end
