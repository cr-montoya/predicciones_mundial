import type { Player, PlayerPosition } from '@/lib/types'

function p(
  id: number, teamId: number, name: string,
  pos: PlayerPosition, goals: number, minutes: number
): Player {
  return { id, teamId, name, position: pos, goalsScored: goals, minutesPlayed: minutes, goalsPerMinute: goals / minutes }
}

// Stats aproximados de WC 2022 + clasificatorias/selecciones 2023-2025.
// Fuente: datos históricos públicos. Se actualiza al integrar lineups reales (fase 18).
export const squadsByTeamId: Record<number, Player[]> = {
  // --- Group A ---
  // Mexico (16)
  16: [
    p(1001, 16, 'Hirving Lozano',    'FW',  7,  900),
    p(1002, 16, 'Henry Martin',      'FW',  8,  810),
    p(1003, 16, 'Raúl Jiménez',      'FW',  8,  900),
    p(1004, 16, 'Roberto Alvarado',  'MF',  5,  720),
    p(1005, 16, 'Alexis Vega',       'FW',  5,  720),
    p(1006, 16, 'Uriel Antuna',      'MF',  4,  810),
  ],
  // South Korea (28)
  28: [
    p(1010, 28, 'Heung-min Son',     'FW', 10, 1080),
    p(1011, 28, 'Hwang Hee-chan',    'FW',  7,  900),
    p(1012, 28, 'Cho Gue-sung',      'FW',  6,  720),
    p(1013, 28, 'Hwang Ui-jo',       'FW',  7,  900),
    p(1014, 28, 'Lee Jae-sung',      'MF',  4,  810),
  ],
  // South Africa (56)
  56: [
    p(1020, 56, 'Percy Tau',         'FW',  5,  810),
    p(1021, 56, 'Lyle Foster',       'FW',  5,  720),
    p(1022, 56, 'Evidence Makgopa',  'FW',  4,  720),
    p(1023, 56, 'Themba Zwane',      'MF',  5,  810),
    p(1024, 56, 'Bongokuhle Hlongwane', 'FW', 4, 720),
  ],
  // Czechia (63)
  63: [
    p(1030, 63, 'Patrik Schick',     'FW',  9,  900),
    p(1031, 63, 'Ondřej Lingr',      'FW',  4,  720),
    p(1032, 63, 'Tomáš Souček',      'MF',  4,  810),
    p(1033, 63, 'Matěj Jurásek',     'MF',  3,  720),
    p(1034, 63, 'Vladimír Coufal',   'MF',  3,  900),
  ],
  // --- Group B ---
  // Switzerland (15)
  15: [
    p(1040, 15, 'Breel Embolo',      'FW',  8,  900),
    p(1041, 15, 'Dan Ndoye',         'FW',  5,  720),
    p(1042, 15, 'Xherdan Shaqiri',   'MF',  6,  900),
    p(1043, 15, 'Michel Aebischer',  'MF',  4,  810),
    p(1044, 15, 'Remo Freuler',      'MF',  3,  810),
  ],
  // Canada (101)
  101: [
    p(1050, 101, 'Jonathan David',   'FW', 12, 1080),
    p(1051, 101, 'Alphonso Davies',  'MF',  8, 1080),
    p(1052, 101, 'Cyle Larin',       'FW',  8,  900),
    p(1053, 101, 'Tajon Buchanan',   'FW',  4,  720),
    p(1054, 101, 'Lucas Cavallini',  'FW',  5,  720),
    p(1055, 101, 'Junior Hoilett',   'MF',  4,  810),
  ],
  // Bosnia-Herzegovina (92)
  92: [
    p(1060, 92, 'Edin Džeko',        'FW', 10, 1080),
    p(1061, 92, 'Ermedin Demirović', 'FW',  6,  720),
    p(1062, 92, 'Amer Gojak',        'MF',  3,  720),
    p(1063, 92, 'Amar Dedić',        'MF',  3,  720),
    p(1064, 92, 'Sead Kolašinac',    'MF',  2,  810),
  ],
  // Qatar (197)
  197: [
    p(1070, 197, 'Almoez Ali',       'FW',  8,  900),
    p(1071, 197, 'Akram Afif',       'FW',  7,  810),
    p(1072, 197, 'Hassan Al-Haydos', 'MF',  5,  810),
    p(1073, 197, 'Abdulaziz Hatem',  'MF',  4,  720),
    p(1074, 197, 'Mohammed Muntari', 'FW',  3,  720),
  ],
  // --- Group C ---
  // Brazil (6)
  6: [
    p(1080, 6, 'Vinicius Jr.',       'FW',  8,  990),
    p(1081, 6, 'Rodrygo',            'FW',  7,  900),
    p(1082, 6, 'Raphinha',           'FW',  7,  900),
    p(1083, 6, 'Gabriel Martinelli', 'FW',  5,  720),
    p(1084, 6, 'Lucas Paquetá',      'MF',  5, 1080),
    p(1085, 6, 'Richarlison',        'FW',  7,  810),
  ],
  // Morocco (32)
  32: [
    p(1090, 32, 'Youssef En-Nesyri', 'FW',  8,  900),
    p(1091, 32, 'Sofiane Boufal',    'MF',  5,  720),
    p(1092, 32, 'Hakim Ziyech',      'MF',  5,  900),
    p(1093, 32, 'Azzedine Ounahi',   'MF',  3,  810),
    p(1094, 32, 'Abde Ezzalzouli',   'FW',  4,  720),
  ],
  // Haiti (168)
  168: [
    p(1100, 168, 'Duckens Nazon',        'FW', 4, 810),
    p(1101, 168, 'Wilde-Donald Guerrier','FW', 4, 720),
    p(1102, 168, 'Frantzdy Pierrot',     'FW', 3, 720),
    p(1103, 168, 'Kervens Belfort',      'MF', 3, 720),
    p(1104, 168, 'Guerschon Yapi',       'MF', 2, 810),
  ],
  // Scotland (1179)
  1179: [
    p(1110, 1179, 'Lyndon Dykes',      'FW', 7,  900),
    p(1111, 1179, 'John McGinn',       'MF', 5,  810),
    p(1112, 1179, 'Che Adams',         'FW', 5,  810),
    p(1113, 1179, 'Stuart Armstrong',  'MF', 4,  720),
    p(1114, 1179, 'Ryan Christie',     'MF', 4,  810),
  ],
  // --- Group D ---
  // United States (1)
  1: [
    p(1120, 1, 'Christian Pulisic',  'MF',  8,  990),
    p(1121, 1, 'Ricardo Pepi',       'FW',  7,  810),
    p(1122, 1, 'Josh Sargent',       'FW',  6,  720),
    p(1123, 1, 'Tim Weah',           'FW',  5,  810),
    p(1124, 1, 'Gio Reyna',          'MF',  4,  720),
    p(1125, 1, 'Brenden Aaronson',   'MF',  4,  720),
  ],
  // Australia (35)
  35: [
    p(1130, 35, 'Mathew Leckie',     'FW',  5,  900),
    p(1131, 35, 'Mitch Duke',        'FW',  4,  720),
    p(1132, 35, 'Martin Boyle',      'FW',  5,  810),
    p(1133, 35, 'Riley McGree',      'MF',  3,  810),
    p(1134, 35, 'Ajdin Hrustic',     'MF',  3,  720),
  ],
  // Turkey (141)
  141: [
    p(1140, 141, 'Hakan Çalhanoğlu', 'MF',  7,  990),
    p(1141, 141, 'Kerem Aktürkoğlu', 'FW',  6,  810),
    p(1142, 141, 'Arda Güler',       'FW',  5,  720),
    p(1143, 141, 'Cenk Tosun',       'FW',  5,  720),
    p(1144, 141, 'Yusuf Yazıcı',     'MF',  5,  810),
  ],
  // Paraguay (14)
  14: [
    p(1150, 14, 'Antonio Sanabria',  'FW',  7,  900),
    p(1151, 14, 'Miguel Almirón',    'MF',  5,  810),
    p(1152, 14, 'Julio Enciso',      'FW',  5,  720),
    p(1153, 14, 'Óscar Romero',      'MF',  4,  810),
    p(1154, 14, 'Alejandro Romero',  'FW',  4,  720),
  ],
  // --- Group E ---
  // Ecuador (128)
  128: [
    p(1160, 128, 'Enner Valencia',    'FW', 10,  990),
    p(1161, 128, 'Jordy Caicedo',     'FW',  6,  810),
    p(1162, 128, 'Michael Estrada',   'FW',  5,  720),
    p(1163, 128, 'Jeremy Sarmiento',  'MF',  4,  720),
    p(1164, 128, 'Ángel Mena',        'FW',  5,  810),
  ],
  // Germany (25)
  25: [
    p(1170, 25, 'Kai Havertz',       'FW',  8,  990),
    p(1171, 25, 'Jamal Musiala',     'MF',  8,  900),
    p(1172, 25, 'Florian Wirtz',     'MF',  8,  810),
    p(1173, 25, 'Leroy Sané',        'FW',  6,  900),
    p(1174, 25, 'Serge Gnabry',      'FW',  8,  810),
    p(1175, 25, 'Thomas Müller',     'MF',  5,  900),
  ],
  // Ivory Coast (39)
  39: [
    p(1180, 39, 'Sébastien Haller',  'FW',  7,  810),
    p(1181, 39, 'Simon Adingra',     'FW',  5,  720),
    p(1182, 39, 'Jonathan Kodjia',   'FW',  4,  810),
    p(1183, 39, 'Ibrahim Sangaré',   'MF',  3,  810),
    p(1184, 39, 'Jean-Philippe Krasso', 'FW', 4, 720),
  ],
  // Curaçao (617)
  617: [
    p(1190, 617, 'Leandro Bacuna',   'MF',  5,  810),
    p(1191, 617, 'Rangelo Janga',    'FW',  4,  720),
    p(1192, 617, 'Juriën Gaari',     'FW',  4,  720),
    p(1193, 617, 'Jarchinio Antonia','FW',  3,  720),
    p(1194, 617, 'Quentin Boksteen', 'MF',  2,  720),
  ],
  // --- Group F ---
  // Japan (21)
  21: [
    p(1200, 21, 'Kaoru Mitoma',      'FW',  7,  900),
    p(1201, 21, 'Takumi Minamino',   'FW',  8,  900),
    p(1202, 21, 'Junya Ito',         'MF',  6,  810),
    p(1203, 21, 'Daichi Kamada',     'MF',  5,  810),
    p(1204, 21, 'Ritsu Doan',        'FW',  5,  720),
    p(1205, 21, 'Ao Tanaka',         'MF',  3,  810),
  ],
  // Sweden (17)
  17: [
    p(1210, 17, 'Viktor Gyökeres',   'FW', 10,  900),
    p(1211, 17, 'Alexander Isak',    'FW',  9,  900),
    p(1212, 17, 'Dejan Kulusevski',  'MF',  6,  900),
    p(1213, 17, 'Emil Forsberg',     'MF',  6,  810),
    p(1214, 17, 'Anthony Elanga',    'FW',  4,  720),
  ],
  // Tunisia (33)
  33: [
    p(1220, 33, 'Wahbi Khazri',      'FW',  7,  900),
    p(1221, 33, 'Issam Jebali',      'FW',  5,  720),
    p(1222, 33, 'Seifeddine Jaziri', 'FW',  5,  720),
    p(1223, 33, 'Youssef Msakni',    'MF',  5,  810),
    p(1224, 33, 'Hannibal Mejbri',   'MF',  4,  720),
  ],
  // Netherlands (5)
  5: [
    p(1230, 5, 'Cody Gakpo',         'FW',  8,  810),
    p(1231, 5, 'Memphis Depay',      'FW',  8,  900),
    p(1232, 5, 'Xavi Simons',        'MF',  5,  720),
    p(1233, 5, 'Wout Weghorst',      'FW',  7,  810),
    p(1234, 5, 'Donyell Malen',      'FW',  6,  810),
    p(1235, 5, 'Teun Koopmeiners',   'MF',  5,  810),
  ],
  // --- Group G ---
  // Belgium (4)
  4: [
    p(1240, 4, 'Romelu Lukaku',      'FW', 12, 1080),
    p(1241, 4, 'Kevin De Bruyne',    'MF',  6,  990),
    p(1242, 4, 'Leandro Trossard',   'FW',  5,  720),
    p(1243, 4, 'Charles De Ketelaere','MF', 5,  720),
    p(1244, 4, 'Lois Openda',        'FW',  6,  720),
    p(1245, 4, 'Dodi Lukebakio',     'FW',  5,  810),
  ],
  // New Zealand (30)
  30: [
    p(1250, 30, 'Chris Wood',        'FW',  8,  900),
    p(1251, 30, 'Liberato Cacace',   'MF',  3,  720),
    p(1252, 30, 'Ben Waine',         'FW',  3,  720),
    p(1253, 30, 'Matt Garbett',      'MF',  2,  720),
    p(1254, 30, 'Oli Sail',          'MF',  2,  720),
  ],
  // Egypt (37)
  37: [
    p(1260, 37, 'Mohamed Salah',     'FW', 12, 1080),
    p(1261, 37, 'Omar Marmoush',     'FW',  7,  810),
    p(1262, 37, 'Marwan Hamdy',      'FW',  5,  720),
    p(1263, 37, 'Mostafa Mohamed',   'FW',  5,  720),
    p(1264, 37, 'Zizo',              'MF',  4,  720),
  ],
  // Iran (31)
  31: [
    p(1270, 31, 'Mehdi Taremi',      'FW', 10,  990),
    p(1271, 31, 'Sardar Azmoun',     'FW',  9,  900),
    p(1272, 31, 'Alireza Jahanbakhsh','FW',  5,  810),
    p(1273, 31, 'Ali Gholizadeh',    'FW',  4,  720),
    p(1274, 31, 'Ramin Rezaeian',    'MF',  3,  720),
  ],
  // --- Group H ---
  // Uruguay (7)
  7: [
    p(1280, 7, 'Darwin Núñez',       'FW', 10,  990),
    p(1281, 7, 'Luis Suárez',        'FW', 11, 1080),
    p(1282, 7, 'Facundo Torres',     'FW',  5,  720),
    p(1283, 7, 'Maxi Gómez',         'FW',  5,  810),
    p(1284, 7, 'Federico Valverde',  'MF',  4,  990),
  ],
  // Spain (9)
  9: [
    p(1290, 9, 'Álvaro Morata',      'FW', 10, 1080),
    p(1291, 9, 'Ferran Torres',      'FW',  7,  810),
    p(1292, 9, 'Dani Olmo',          'MF',  6,  810),
    p(1293, 9, 'Mikel Oyarzabal',    'FW',  6,  810),
    p(1294, 9, 'Nico Williams',      'FW',  5,  720),
    p(1295, 9, 'Pedri',              'MF',  4,  900),
  ],
  // Saudi Arabia (34)
  34: [
    p(1300, 34, 'Salem Al-Dawsari',    'FW', 7,  900),
    p(1301, 34, 'Firas Al-Buraikan',   'FW', 7,  810),
    p(1302, 34, 'Mohammed Al-Shehri',  'FW', 5,  720),
    p(1303, 34, 'Saleh Al-Shehri',     'FW', 5,  810),
    p(1304, 34, 'Sami Al-Najei',       'MF', 4,  720),
  ],
  // Cape Verde Islands (206)
  206: [
    p(1310, 206, 'Ryan Mendes',       'FW', 5, 810),
    p(1311, 206, 'Gilson Tavares',    'FW', 4, 720),
    p(1312, 206, 'Garry Rodrigues',   'MF', 4, 810),
    p(1313, 206, 'Jamiro Monteiro',   'MF', 3, 720),
    p(1314, 206, 'Diogo Tavares',     'MF', 3, 720),
  ],
  // --- Group I ---
  // France (2)
  2: [
    p(1320, 2, 'Kylian Mbappé',      'FW', 12, 1080),
    p(1321, 2, 'Antoine Griezmann',  'FW',  8, 1350),
    p(1322, 2, 'Marcus Thuram',      'FW',  7,  900),
    p(1323, 2, 'Ousmane Dembélé',    'FW',  5,  900),
    p(1324, 2, 'Randal Kolo Muani',  'FW',  5,  720),
    p(1325, 2, 'Bradley Barcola',    'FW',  4,  720),
  ],
  // Senegal (51)
  51: [
    p(1330, 51, 'Sadio Mané',        'FW', 10, 1080),
    p(1331, 51, 'Ismaïla Sarr',      'FW',  6,  810),
    p(1332, 51, 'Nicolas Jackson',   'FW',  5,  720),
    p(1333, 51, 'Habib Diallo',      'FW',  6,  810),
    p(1334, 51, 'Lamine Camara',     'MF',  3,  720),
  ],
  // Iraq (173)
  173: [
    p(1340, 173, 'Aymen Hussein',    'FW', 5, 810),
    p(1341, 173, 'Ahmed Yasin',      'MF', 4, 720),
    p(1342, 173, 'Mohanad Ali',      'FW', 4, 720),
    p(1343, 173, 'Mohanad Lateef',   'FW', 3, 720),
    p(1344, 173, 'Amjad Attwan',     'MF', 3, 720),
  ],
  // Norway (119)
  119: [
    p(1350, 119, 'Erling Haaland',    'FW', 15, 1080),
    p(1351, 119, 'Alexander Sørloth', 'FW',  9,  900),
    p(1352, 119, 'Martin Ødegaard',   'MF',  7,  990),
    p(1353, 119, 'Mohamed Elyounoussi','FW', 5,  810),
    p(1354, 119, 'Ola Solbakken',     'FW',  4,  720),
  ],
  // --- Group J ---
  // Argentina (26)
  26: [
    p(1360, 26, 'Lionel Messi',      'FW', 15, 1170),
    p(1361, 26, 'Lautaro Martínez',  'FW', 10,  990),
    p(1362, 26, 'Julián Álvarez',    'FW',  8,  900),
    p(1363, 26, 'Ángel Di María',    'MF',  7,  900),
    p(1364, 26, 'Rodrigo De Paul',   'MF',  5, 1170),
    p(1365, 26, 'Paulo Dybala',      'FW',  6,  810),
  ],
  // Algeria (46)
  46: [
    p(1370, 46, 'Islam Slimani',     'FW',  8,  900),
    p(1371, 46, 'Riyad Mahrez',      'FW',  7,  900),
    p(1372, 46, 'Youcef Belaïli',    'FW',  5,  810),
    p(1373, 46, 'Adam Ounas',        'FW',  5,  720),
    p(1374, 46, 'Baghdad Bounedjah', 'FW',  6,  810),
  ],
  // Austria (41)
  41: [
    p(1380, 41, 'Marko Arnautović',  'FW',  8,  900),
    p(1381, 41, 'Marcel Sabitzer',   'MF',  6,  810),
    p(1382, 41, 'Michael Gregoritsch','FW', 6,  810),
    p(1383, 41, 'Christoph Baumgartner','MF',5, 720),
    p(1384, 41, 'Florian Grillitsch','MF',  3,  810),
  ],
  // Jordan (172)
  172: [
    p(1390, 172, 'Musa Al-Taamari',  'FW', 5, 810),
    p(1391, 172, 'Hamza Al-Dardour', 'FW', 5, 810),
    p(1392, 172, 'Oday Dabbagh',     'FW', 5, 720),
    p(1393, 172, 'Yazan Al-Arab',    'MF', 4, 720),
    p(1394, 172, 'Baha Faisal',      'MF', 3, 720),
  ],
  // --- Group K ---
  // Colombia (20)
  20: [
    p(1400, 20, 'Luis Díaz',         'FW',  7,  900),
    p(1401, 20, 'James Rodríguez',   'MF',  8,  900),
    p(1402, 20, 'Rafael Santos Borré','FW', 7,  810),
    p(1403, 20, 'Jhon Durán',        'FW',  5,  720),
    p(1404, 20, 'Cucho Hernández',   'FW',  6,  810),
    p(1405, 20, 'Falcao García',     'FW',  5,  720),
  ],
  // Portugal (10)
  10: [
    p(1410, 10, 'Cristiano Ronaldo', 'FW', 15, 1170),
    p(1411, 10, 'Bruno Fernandes',   'MF',  8,  990),
    p(1412, 10, 'Diogo Jota',        'FW',  8,  900),
    p(1413, 10, 'Bernardo Silva',    'MF',  6,  900),
    p(1414, 10, 'João Félix',        'FW',  7,  810),
    p(1415, 10, 'Rafael Leão',       'FW',  6,  810),
  ],
  // Congo DR (69)
  69: [
    p(1420, 69, 'Cédric Bakambu',    'FW', 5, 810),
    p(1421, 69, 'Paul-José Mpoku',   'MF', 5, 810),
    p(1422, 69, 'Yannick Bolasie',   'FW', 4, 720),
    p(1423, 69, 'Arthur Masuaku',    'MF', 3, 810),
    p(1424, 69, 'Jonathan Bolingi',  'FW', 4, 720),
  ],
  // Uzbekistan (90)
  90: [
    p(1430, 90, 'Eldor Shomurodov',     'FW', 8, 900),
    p(1431, 90, 'Abbosbek Fayzullayev','FW', 5, 720),
    p(1432, 90, 'Otabek Shukurov',      'MF', 4, 720),
    p(1433, 90, 'Jasur Yakhshiboev',    'FW', 4, 720),
    p(1434, 90, 'Jamshid Iskanderov',   'MF', 3, 720),
  ],
  // --- Group L ---
  // England (24)
  24: [
    p(1440, 24, 'Harry Kane',        'FW', 15, 1170),
    p(1441, 24, 'Jude Bellingham',   'MF',  8,  990),
    p(1442, 24, 'Marcus Rashford',   'FW',  8,  900),
    p(1443, 24, 'Bukayo Saka',       'FW',  7,  990),
    p(1444, 24, 'Phil Foden',        'MF',  7,  990),
    p(1445, 24, 'Ollie Watkins',     'FW',  6,  810),
  ],
  // Croatia (3)
  3: [
    p(1450, 3, 'Andrej Kramarić',   'FW',  9,  900),
    p(1451, 3, 'Ivan Perišić',      'MF',  7,  900),
    p(1452, 3, 'Bruno Petković',    'FW',  6,  720),
    p(1453, 3, 'Marko Livaja',      'FW',  5,  720),
    p(1454, 3, 'Luka Modrić',       'MF',  4,  990),
  ],
  // Ghana (135)
  135: [
    p(1460, 135, 'Mohammed Kudus',   'FW',  7,  810),
    p(1461, 135, 'Inaki Williams',   'FW',  5,  720),
    p(1462, 135, 'Jordan Ayew',      'FW',  5,  810),
    p(1463, 135, 'Antoine Semenyo',  'FW',  4,  720),
    p(1464, 135, 'André Ayew',       'FW',  5,  810),
  ],
  // Panama (22)
  22: [
    p(1470, 22, 'Gabriel Torres',   'FW', 5, 810),
    p(1471, 22, 'Ismael Díaz',      'FW', 4, 720),
    p(1472, 22, 'Rolando Blackburn','FW', 4, 720),
    p(1473, 22, 'Alberto Quintero', 'MF', 3, 810),
    p(1474, 22, 'Cecilio Waterman', 'FW', 4, 720),
  ],
}
