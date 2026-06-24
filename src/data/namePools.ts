// Linguistic name pools. Each pool has a list of first names and surnames.
// Players are assigned a country first, then their country's weighted pool mix determines language pool.
// Surnames mix actual tennis-famous names with common surnames in that language.

export interface NamePool {
  firsts: string[];
  surnames: string[];
}

export const POOLS: Record<string, NamePool> = {
  spanish: {
    firsts: [
      'Rafael', 'Carlos', 'Pedro', 'Javier', 'Alejandro', 'Pablo', 'Sergio',
      'David', 'Manuel', 'Fernando', 'Roberto', 'Andres', 'Diego', 'Juan',
      'Tomas', 'Francisco', 'Gabriel', 'Mateo', 'Joaquin', 'Eduardo',
      'Hugo', 'Adrian', 'Felipe', 'Cristian', 'Lucas',
    ],
    surnames: [
      'Nadal', 'Corretja', 'Ferrero', 'Moya', 'Bautista', 'Alcaraz', 'Verdasco',
      'Coria', 'Schwartzman', 'Garin', 'Jarry', 'Tabilo', 'Cerundolo',
      'Perez', 'Marquez', 'Lopez', 'Garcia', 'Sanchez', 'Ruiz', 'Vega',
      'Hernandez', 'Martinez', 'Diaz', 'Torres', 'Gomez', 'Ramirez',
      'Castillo', 'Romero', 'Navarro', 'Vargas',
    ],
  },
  russian: {
    firsts: [
      'Daniil', 'Andrey', 'Karen', 'Aslan', 'Roman', 'Pavel', 'Marat',
      'Mikhail', 'Yevgeny', 'Dmitry', 'Alexei', 'Igor', 'Nikolai', 'Sergei',
      'Vladimir', 'Anton', 'Kirill', 'Maxim', 'Boris', 'Yuri',
      'Vasily', 'Oleg', 'Artem', 'Konstantin', 'Stanislav',
    ],
    surnames: [
      'Medvedev', 'Rublev', 'Khachanov', 'Karatsev', 'Safiullin', 'Kotov',
      'Safin', 'Kafelnikov', 'Volkov', 'Sokolov', 'Ivanov', 'Smirnov',
      'Petrov', 'Kuznetsov', 'Popov', 'Vasiliev', 'Pavlov', 'Mikhailov',
      'Fedorov', 'Morozov', 'Solovyov', 'Bogdanov', 'Andreyev', 'Belov',
      'Filippov', 'Lebedev', 'Kozlov', 'Egorov', 'Zaitsev', 'Gusev',
    ],
  },
  slavic: {
    firsts: [
      'Novak', 'Dusan', 'Milos', 'Filip', 'Nikola', 'Stefan', 'Lazar',
      'Aleksandar', 'Marin', 'Goran', 'Borna', 'Ivan', 'Mate', 'Petar',
      'Tomas', 'Jiri', 'Vit', 'Lukas', 'Dalibor', 'Hubert',
      'Kamil', 'Marton', 'Attila', 'Grigor', 'Dimitar',
    ],
    surnames: [
      'Djokovic', 'Lajovic', 'Krajinovic', 'Kecmanovic', 'Cilic', 'Ivanisevic',
      'Coric', 'Berdych', 'Lehecka', 'Kopriva', 'Rosol', 'Vesely',
      'Hurkacz', 'Majchrzak', 'Fucsovics', 'Balazs', 'Dimitrov',
      'Petrovic', 'Jovanovic', 'Nikolic', 'Milic', 'Novak', 'Dvorak',
      'Kowalski', 'Nowak', 'Kovacs', 'Andreev', 'Kuzmanov', 'Babic',
      'Horvat',
    ],
  },
  english: {
    firsts: [
      'Andy', 'Jamie', 'Daniel', 'James', 'Cameron', 'Liam', 'Henry',
      'Oliver', 'Jack', 'John', 'Andre', 'Pete', 'Taylor', 'Tommy',
      'Frances', 'Reilly', 'Sebastian', 'Michael', 'Brandon', 'Ben',
      'Christopher', 'Jordan', 'Alex', 'Nick', 'Pat',
    ],
    surnames: [
      'Murray', 'Edmund', 'Evans', 'Norrie', 'Draper', 'Fritz', 'Paul',
      'Tiafoe', 'Opelka', 'Korda', 'Johnson', 'Roddick', 'Agassi', 'Sampras',
      'McEnroe', 'Hewitt', 'Rafter', 'Kyrgios', 'Thompson', 'OConnell',
      'Smith', 'Taylor', 'Walker', 'Hughes', 'Bennett', 'Carlson',
      'Anderson', 'Mitchell', 'Wilson', 'Bryan',
    ],
  },
  french: {
    firsts: [
      'Jo', 'Gael', 'Lucas', 'Adrian', 'Pierre', 'Hugo', 'Arthur',
      'Antoine', 'Benjamin', 'Maxime', 'Henri', 'Marc', 'Yann', 'Benoit',
      'Felix', 'Gabriel', 'Vincent', 'Olivier', 'Julien', 'Mathieu',
      'Romain', 'Quentin', 'Thomas', 'Etienne', 'Nicolas',
    ],
    surnames: [
      'Tsonga', 'Monfils', 'Pouille', 'Mannarino', 'Gasquet', 'Simon',
      'Humbert', 'Bonzi', 'Moutet', 'Rinderknech', 'Royer', 'Halys',
      'Dupont', 'Bernard', 'Lacoste', 'Lefevre', 'Rousseau', 'Moreau',
      'Laurent', 'Simon', 'Michel', 'Leroy', 'David', 'Bertrand',
      'Robert', 'Richard', 'Dubois', 'Petit', 'Durand', 'Roux',
    ],
  },

  // Minor pools (5-10 firsts, 10 surnames)
  african: {
    firsts: ['Kwame', 'Tendai', 'Sipho', 'Themba', 'Bongani', 'Kofi', 'Olu', 'Sadio'],
    surnames: ['Mensah', 'Okafor', 'Adeyemi', 'Nkomo', 'Diallo', 'Sanogo', 'Mokoena', 'Tshabalala', 'Eze', 'Adesanya'],
  },
  nordic: {
    firsts: ['Casper', 'Viktor', 'Magnus', 'Erik', 'Emil', 'Otto', 'Patrik', 'Eero', 'Harri'],
    surnames: ['Ruud', 'Durasovic', 'Ruusuvuori', 'Virtanen', 'Niemi', 'Heliovaara', 'Kontinen', 'Hansen', 'Johansen', 'Larsen'],
  },
  arabic: {
    firsts: ['Karim', 'Mohamed', 'Omar', 'Yusuf', 'Hassan', 'Tariq', 'Amir', 'Khalid'],
    surnames: ['Jaziri', 'Malek', 'Saleh', 'Haddad', 'Nasser', 'Khoury', 'Hassan', 'Karim', 'Salem', 'Said'],
  },
  chinese: {
    firsts: ['Wu', 'Zhang', 'Li', 'Wang', 'Chen', 'Liu', 'Yang', 'Hao'],
    surnames: ['Yibing', 'Zhizhen', 'Shang', 'Hanyu', 'Bu', 'Te', 'Wei', 'Cui', 'Jun', 'Heng'],
  },
  japanese: {
    firsts: ['Kei', 'Yoshihito', 'Taro', 'Yosuke', 'Shintaro', 'Hiroki', 'Sho', 'Daisuke'],
    surnames: ['Nishikori', 'Nishioka', 'Daniel', 'Watanuki', 'Mochizuki', 'Yamada', 'Tanaka', 'Sato', 'Suzuki', 'Takahashi'],
  },
  dutch: {
    firsts: ['Tallon', 'Botic', 'Jesper', 'Tim', 'Robin', 'Sem', 'Bram', 'Luuk'],
    surnames: ['Griekspoor', 'van de Zandschulp', 'de Jong', 'van Rijthoven', 'Haase', 'de Vries', 'Bakker', 'Jansen', 'Visser', 'Smit'],
  },
  german: {
    firsts: ['Boris', 'Alexander', 'Jan-Lennard', 'Daniel', 'Maximilian', 'Yannick', 'Oscar', 'Kevin', 'Dominik', 'Tobias'],
    surnames: ['Becker', 'Zverev', 'Struff', 'Altmaier', 'Marterer', 'Hanfmann', 'Otte', 'Thiem', 'Schmidt', 'Muller', 'Weber', 'Fischer', 'Wagner', 'Bauer', 'Hoffmann'],
  },
  italian: {
    firsts: ['Jannik', 'Matteo', 'Lorenzo', 'Fabio', 'Andrea', 'Stefano', 'Marco', 'Luca', 'Giulio', 'Flavio'],
    surnames: ['Sinner', 'Berrettini', 'Musetti', 'Fognini', 'Sonego', 'Cobolli', 'Arnaldi', 'Zeppieri', 'Rossi', 'Ferrari', 'Conti', 'Ricci', 'Romano', 'Bianchi', 'Esposito'],
  },
  portuguese: {
    firsts: ['Joao', 'Nuno', 'Frederico', 'Henrique', 'Pedro', 'Tiago', 'Bernardo', 'Rui'],
    surnames: ['Sousa', 'Borges', 'Ferreira', 'Rocha', 'Silva', 'Costa', 'Pereira', 'Santos', 'Oliveira', 'Almeida'],
  },
};

// Country -> weighted pool mix. Weights are relative; renormalized at use.
// Pools listed in order of probability for that country.
export const COUNTRY_POOLS: Record<string, [string, number][]> = {
  // Spanish-speaking
  ESP: [['spanish', 1]],
  ARG: [['spanish', 1]],
  CHI: [['spanish', 1]],
  COL: [['spanish', 1]],
  BRA: [['portuguese', 1]],
  POR: [['portuguese', 1]],

  // Russian
  RUS: [['russian', 1]],
  KAZ: [['russian', 0.7], ['arabic', 0.3]],

  // Slavic
  SRB: [['slavic', 1]],
  CRO: [['slavic', 1]],
  CZE: [['slavic', 1]],
  POL: [['slavic', 1]],
  BUL: [['slavic', 1]],
  HUN: [['slavic', 1]],

  // English
  GBR: [['english', 1]],
  AUS: [['english', 1]],

  // USA — multicultural
  USA: [['english', 0.55], ['german', 0.15], ['slavic', 0.12], ['spanish', 0.10], ['african', 0.08]],

  // Canada — English + French
  CAN: [['english', 0.55], ['french', 0.40], ['italian', 0.05]],

  // Swiss — French/German/Italian
  SUI: [['french', 0.35], ['german', 0.40], ['italian', 0.25]],

  // French
  FRA: [['french', 0.85], ['arabic', 0.10], ['african', 0.05]],

  // Germanic
  GER: [['german', 1]],
  AUT: [['german', 1]],

  // Italian
  ITA: [['italian', 1]],

  // Dutch
  NED: [['dutch', 1]],

  // Belgium — Dutch / French
  BEL: [['dutch', 0.55], ['french', 0.45]],

  // Nordic
  NOR: [['nordic', 1]],
  FIN: [['nordic', 1]],

  // Greek (slavic-ish surnames blend)
  GRE: [['slavic', 0.5], ['italian', 0.3], ['arabic', 0.2]],

  // East Asian
  JPN: [['japanese', 1]],
  KOR: [['japanese', 0.5], ['chinese', 0.5]],
};

// Sample a name + surname for a country by picking a pool from its mix
export function generateNameFor(countryCode: string): { firstName: string; surname: string } {
  const mix = COUNTRY_POOLS[countryCode] || [['english', 1]];
  // Weighted pick
  const total = mix.reduce((s, [, w]) => s + w, 0);
  let r = Math.random() * total;
  let poolName = mix[0][0];
  for (const [name, w] of mix) {
    r -= w;
    if (r <= 0) { poolName = name; break; }
  }
  const pool = POOLS[poolName] || POOLS.english;
  const firstName = pool.firsts[Math.floor(Math.random() * pool.firsts.length)];
  const surname = pool.surnames[Math.floor(Math.random() * pool.surnames.length)];
  return { firstName, surname };
}
