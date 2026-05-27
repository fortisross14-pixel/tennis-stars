// 30 countries with flags, plus first names and surnames mixed (some "tennis-famous" feel, some ordinary)

export interface Country {
  code: string;   // ATP 3-letter code for display (ESP, SRB, etc.)
  iso2: string;   // ISO 3166-1 alpha-2 lowercase for flag CDN
  name: string;
  flag: string;   // emoji fallback
  firstNames: string[];
  surnames: string[];
}

export const COUNTRIES: Country[] = [
  {
    code: 'ESP', iso2: 'es', name: 'Spain', flag: '🇪🇸',
    firstNames: ['Rafael', 'Carlos', 'Pedro', 'Javier', 'Alejandro', 'Pablo', 'Sergio', 'David', 'Manuel', 'Fernando', 'Roberto', 'Andres'],
    surnames: ['Nadal', 'Corretja', 'Ferrero', 'Moya', 'Bautista', 'Perez', 'Marquez', 'Lopez', 'Garcia', 'Sanchez', 'Ruiz', 'Vega', 'Alcaraz', 'Verdasco'],
  },
  {
    code: 'SUI', iso2: 'ch', name: 'Switzerland', flag: '🇨🇭',
    firstNames: ['Roger', 'Stanislas', 'Marc', 'Lukas', 'Henri', 'Daniel', 'Yann', 'Benoit', 'Lucas'],
    surnames: ['Federer', 'Wawrinka', 'Chapuisat', 'Hingis', 'Muller', 'Keller', 'Schmid', 'Meier', 'Bachmann', 'Lacoste'],
  },
  {
    code: 'SRB', iso2: 'rs', name: 'Serbia', flag: '🇷🇸',
    firstNames: ['Novak', 'Dusan', 'Milos', 'Filip', 'Nikola', 'Stefan', 'Lazar', 'Aleksandar'],
    surnames: ['Djokovic', 'Lajovic', 'Krajinovic', 'Kecmanovic', 'Petrovic', 'Jovanovic', 'Nikolic', 'Milic'],
  },
  {
    code: 'GBR', iso2: 'gb', name: 'United Kingdom', flag: '🇬🇧',
    firstNames: ['Andy', 'Jamie', 'Daniel', 'James', 'Cameron', 'Liam', 'Henry', 'Oliver', 'Jack'],
    surnames: ['Murray', 'Edmund', 'Evans', 'Norrie', 'Draper', 'Smith', 'Taylor', 'Walker', 'Hughes', 'Bennett'],
  },
  {
    code: 'USA', iso2: 'us', name: 'United States', flag: '🇺🇸',
    firstNames: ['John', 'Andre', 'Pete', 'Taylor', 'Tommy', 'Frances', 'Reilly', 'Sebastian', 'Michael', 'Brandon'],
    surnames: ['McEnroe', 'Agassi', 'Sampras', 'Fritz', 'Paul', 'Tiafoe', 'Opelka', 'Korda', 'Johnson', 'Bryan', 'Roddick', 'Carlson'],
  },
  {
    code: 'FRA', iso2: 'fr', name: 'France', flag: '🇫🇷',
    firstNames: ['Jo', 'Gael', 'Lucas', 'Adrian', 'Pierre', 'Hugo', 'Arthur', 'Antoine', 'Benjamin', 'Maxime'],
    surnames: ['Tsonga', 'Monfils', 'Pouille', 'Mannarino', 'Gasquet', 'Simon', 'Humbert', 'Bonzi', 'Moutet', 'Dupont', 'Bernard'],
  },
  {
    code: 'ARG', iso2: 'ar', name: 'Argentina', flag: '🇦🇷',
    firstNames: ['Juan', 'Diego', 'Sebastian', 'Federico', 'Tomas', 'Francisco', 'Mariano', 'Guillermo'],
    surnames: ['del Potro', 'Schwartzman', 'Coria', 'Nalbandian', 'Gaudio', 'Cerundolo', 'Etcheverry', 'Coria', 'Fernandez', 'Ramirez'],
  },
  {
    code: 'GER', iso2: 'de', name: 'Germany', flag: '🇩🇪',
    firstNames: ['Boris', 'Alexander', 'Jan-Lennard', 'Daniel', 'Maximilian', 'Yannick', 'Oscar', 'Kevin'],
    surnames: ['Becker', 'Zverev', 'Struff', 'Altmaier', 'Marterer', 'Hanfmann', 'Otte', 'Schmidt', 'Wagner', 'Bauer'],
  },
  {
    code: 'ITA', iso2: 'it', name: 'Italy', flag: '🇮🇹',
    firstNames: ['Jannik', 'Matteo', 'Lorenzo', 'Fabio', 'Andrea', 'Stefano', 'Marco', 'Luca'],
    surnames: ['Sinner', 'Berrettini', 'Musetti', 'Fognini', 'Sonego', 'Cobolli', 'Arnaldi', 'Rossi', 'Ferrari', 'Conti'],
  },
  {
    code: 'AUS', iso2: 'au', name: 'Australia', flag: '🇦🇺',
    firstNames: ['Nick', 'Lleyton', 'Pat', 'Alex', 'Jordan', 'Thanasi', 'Christopher', 'Jason'],
    surnames: ['Kyrgios', 'Hewitt', 'Rafter', 'de Minaur', 'Thompson', 'Kokkinakis', 'OConnell', 'Wilson', 'Anderson', 'Mitchell'],
  },
  {
    code: 'RUS', iso2: 'ru', name: 'Russia', flag: '🇷🇺',
    firstNames: ['Daniil', 'Andrey', 'Karen', 'Aslan', 'Roman', 'Pavel', 'Marat', 'Mikhail', 'Yevgeny'],
    surnames: ['Medvedev', 'Rublev', 'Khachanov', 'Karatsev', 'Safiullin', 'Kotov', 'Safin', 'Volkov', 'Sokolov', 'Ivanov'],
  },
  {
    code: 'CRO', iso2: 'hr', name: 'Croatia', flag: '🇭🇷',
    firstNames: ['Marin', 'Goran', 'Borna', 'Ivan', 'Mate', 'Nino', 'Petar'],
    surnames: ['Cilic', 'Ivanisevic', 'Coric', 'Dodig', 'Pavic', 'Mektic', 'Horvat', 'Babic', 'Tomic'],
  },
  {
    code: 'CAN', iso2: 'ca', name: 'Canada', flag: '🇨🇦',
    firstNames: ['Milos', 'Felix', 'Denis', 'Vasek', 'Gabriel', 'Liam', 'Alexis'],
    surnames: ['Raonic', 'Auger-Aliassime', 'Shapovalov', 'Pospisil', 'Diallo', 'Tremblay', 'Bergeron', 'Lavoie'],
  },
  {
    code: 'AUT', iso2: 'at', name: 'Austria', flag: '🇦🇹',
    firstNames: ['Dominic', 'Thomas', 'Sebastian', 'Jurij', 'Filip', 'Lukas'],
    surnames: ['Thiem', 'Muster', 'Ofner', 'Rodionov', 'Misolic', 'Neumayer', 'Huber', 'Gruber'],
  },
  {
    code: 'BUL', iso2: 'bg', name: 'Bulgaria', flag: '🇧🇬',
    firstNames: ['Grigor', 'Dimitar', 'Adrian', 'Alexander', 'Petar'],
    surnames: ['Dimitrov', 'Andreev', 'Kuzmanov', 'Donski', 'Lazarov', 'Ivanov', 'Petrov'],
  },
  {
    code: 'GRE', iso2: 'gr', name: 'Greece', flag: '🇬🇷',
    firstNames: ['Stefanos', 'Petros', 'Aristotelis', 'Michail', 'Konstantinos'],
    surnames: ['Tsitsipas', 'Kalovelonis', 'Pervolarakis', 'Sakellaridis', 'Papadopoulos', 'Georgiou'],
  },
  {
    code: 'NOR', iso2: 'no', name: 'Norway', flag: '🇳🇴',
    firstNames: ['Casper', 'Viktor', 'Lukas', 'Erik', 'Magnus'],
    surnames: ['Ruud', 'Durasovic', 'Hellum-Lilleengen', 'Hansen', 'Johansen', 'Larsen'],
  },
  {
    code: 'CZE', iso2: 'cz', name: 'Czechia', flag: '🇨🇿',
    firstNames: ['Tomas', 'Jiri', 'Vit', 'Lukas', 'Dalibor'],
    surnames: ['Berdych', 'Lehecka', 'Kopriva', 'Rosol', 'Vesely', 'Novak', 'Dvorak'],
  },
  {
    code: 'POL', iso2: 'pl', name: 'Poland', flag: '🇵🇱',
    firstNames: ['Hubert', 'Kamil', 'Daniel', 'Maks', 'Szymon'],
    surnames: ['Hurkacz', 'Majchrzak', 'Michalski', 'Kasinski', 'Walkow', 'Kowalski', 'Nowak'],
  },
  {
    code: 'NED', iso2: 'nl', name: 'Netherlands', flag: '🇳🇱',
    firstNames: ['Tallon', 'Botic', 'Jesper', 'Tim', 'Robin'],
    surnames: ['Griekspoor', 'van de Zandschulp', 'de Jong', 'van Rijthoven', 'Haase', 'de Vries', 'Bakker'],
  },
  {
    code: 'POR', iso2: 'pt', name: 'Portugal', flag: '🇵🇹',
    firstNames: ['Joao', 'Nuno', 'Frederico', 'Henrique', 'Pedro'],
    surnames: ['Sousa', 'Borges', 'Ferreira', 'Rocha', 'Silva', 'Costa', 'Pereira'],
  },
  {
    code: 'CHI', iso2: 'cl', name: 'Chile', flag: '🇨🇱',
    firstNames: ['Marcelo', 'Nicolas', 'Cristian', 'Alejandro', 'Tomas'],
    surnames: ['Rios', 'Jarry', 'Garin', 'Tabilo', 'Barrios', 'Munoz', 'Soto'],
  },
  {
    code: 'BRA', iso2: 'br', name: 'Brazil', flag: '🇧🇷',
    firstNames: ['Gustavo', 'Thiago', 'Joao', 'Felipe', 'Marcelo'],
    surnames: ['Kuerten', 'Monteiro', 'Wild', 'Meligeni', 'Seyboth', 'Santos', 'Oliveira'],
  },
  {
    code: 'JPN', iso2: 'jp', name: 'Japan', flag: '🇯🇵',
    firstNames: ['Kei', 'Yoshihito', 'Taro', 'Yosuke', 'Shintaro', 'Hiroki'],
    surnames: ['Nishikori', 'Nishioka', 'Daniel', 'Watanuki', 'Mochizuki', 'Yamada', 'Tanaka', 'Sato'],
  },
  {
    code: 'KAZ', iso2: 'kz', name: 'Kazakhstan', flag: '🇰🇿',
    firstNames: ['Alexander', 'Mikhail', 'Dmitry', 'Timofey', 'Beibit'],
    surnames: ['Bublik', 'Kukushkin', 'Popko', 'Skatov', 'Zhukayev', 'Aliyev'],
  },
  {
    code: 'BEL', iso2: 'be', name: 'Belgium', flag: '🇧🇪',
    firstNames: ['David', 'Zizou', 'Kimmer', 'Joris', 'Raphael'],
    surnames: ['Goffin', 'Bergs', 'Coppejans', 'Vliegen', 'De Greef', 'Janssens'],
  },
  {
    code: 'KOR', iso2: 'kr', name: 'South Korea', flag: '🇰🇷',
    firstNames: ['Hyeon', 'Soonwoo', 'Chung', 'Jisung', 'Donghyun'],
    surnames: ['Chung', 'Kwon', 'Lee', 'Kim', 'Park', 'Choi', 'Jeong'],
  },
  {
    code: 'HUN', iso2: 'hu', name: 'Hungary', flag: '🇭🇺',
    firstNames: ['Marton', 'Attila', 'Mate', 'Zsombor', 'Fabian'],
    surnames: ['Fucsovics', 'Balazs', 'Valkusz', 'Piros', 'Marozsan', 'Nagy', 'Kovacs'],
  },
  {
    code: 'COL', iso2: 'co', name: 'Colombia', flag: '🇨🇴',
    firstNames: ['Daniel', 'Santiago', 'Alejandro', 'Nicolas', 'Juan'],
    surnames: ['Galan', 'Giraldo', 'Gomez', 'Mejia', 'Barranco', 'Cabal'],
  },
  {
    code: 'FIN', iso2: 'fi', name: 'Finland', flag: '🇫🇮',
    firstNames: ['Emil', 'Otto', 'Patrik', 'Eero', 'Harri'],
    surnames: ['Ruusuvuori', 'Virtanen', 'Niemi', 'Heliovaara', 'Kontinen', 'Korhonen', 'Lehtinen'],
  },
];
