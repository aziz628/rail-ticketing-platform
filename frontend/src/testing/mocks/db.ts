type MockUser = {
  id: string;
  email: string;
  name: string;
  password?: string;
  nationalIdType: 'CIN' | 'BIRTH_CERT';
  nationalIdNumber: string;
  role: 'VOYAGER' | 'ADMIN';
};

type MockStation = {
  id: string;
  name: string;
  canDelete: boolean;
};

type MockSeatClass = {
  id: string;
  type: 'FIRST' | 'SECOND' | 'COMFORT';
  capacity: number;
  priceIncreasePercentage: number;
};

type MockTrain = {
  id: string;
  name: string;
  basePriceIncreasePercentage: number;
  seatClasses: MockSeatClass[];
};

type MockLineNode = {
  id: string;
  stationId: string;
  stationName: string;
  kmFromSource: number;
  orderIndex: number;
};

type MockLine = {
  id: string;
  name: string;
  nodes: MockLineNode[];
};

type MockAgent = {
  id: string;
  name: string;
  email: string;
  canDelete: boolean;
};

type MockController = {
  id: string;
  name: string;
  email: string;
  assignedLineName: string;
  canDelete: boolean;
};

const seedUsers: MockUser[] = [
  {
    id: '550e8400-e29b-41d4-a716-446655440000',
    email: 'test@example.com',
    name: 'Utilisateur Test',
    password: 'password123',
    nationalIdType: 'CIN',
    nationalIdNumber: '223456789',
    role: 'VOYAGER',
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440001',
    email: 'admin@example.com',
    name: 'Administrateur',
    password: 'admin123',
    nationalIdType: 'CIN',
    nationalIdNumber: '987654321',
    role: 'ADMIN',
  },
] ;

const seedStations: MockStation[] = [
  { id: '34f4935a-c9c9-4648-96fe-a02ca5e292bd', name: 'Tunis Ville',canDelete: false },
  { id: '8283142e-f01e-48dd-a8e8-b6d09cc57582', name: 'Sousse' ,canDelete: true},
  { id: '99627c07-45a8-4450-9219-71421a69deee', name: 'Sfax' ,canDelete: true},
];

const seedTrains: MockTrain[] = [
  {
    id: 'train-1',
    name: 'Alstom Coradia',
    basePriceIncreasePercentage: 10,
    seatClasses: [
      { id: 'sc-1', type: 'FIRST', capacity: 40, priceIncreasePercentage: 50 },
      { id: 'sc-2', type: 'SECOND', capacity: 120, priceIncreasePercentage: 0 },
    ],
  },
];

const seedLines: MockLine[] = [
  {
    id: '41a3a3b1-b8f9-414a-8e1b-991c959f3f3e',
    name: 'Tunis ↔ Sfax',
    nodes: [
      { id: '41a3a3b1-b8f9-414a-8e1b-991c959f3f3e', stationId: '34f4935a-c9c9-4648-96fe-a02ca5e292bd', stationName: 'Tunis Ville', kmFromSource: 0, orderIndex: 0 },
      { id: '6b19e6cb-c1b2-4d79-b5b9-6563127c0db2', stationId: '8283142e-f01e-48dd-a8e8-b6d09cc57582', stationName: 'Sousse', kmFromSource: 140, orderIndex: 1 },
      { id: '337367a9-4a45-4412-985e-84352757155f', stationId: '99627c07-45a8-4450-9219-71421a69deee', stationName: 'Sfax', kmFromSource: 270, orderIndex: 2 },
    ],
  },
];

const seedAgents: MockAgent[] = [
  { id: '4af62e90-69a1-49dd-8963-b34d76f6c81f', name: 'Ahmed Agent', email: 'ahmed@sncft.tn', canDelete: true },
  { id: '55985497-12e0-44f3-9604-54139353a77a', name: 'Sara Agent', email: 'sara@sncft.tn', canDelete: false },
];

const seedControllers: MockController[] = [
  { id: 'a8f9694d-16bf-4db2-9788-c2d32f03c46d', name: 'Mohamed Controller', email: 'mohamed@sncft.tn', assignedLineName: 'Tunis ↔ Sfax', canDelete: true },
];

const unregisteredNationalIds :{
  nationalIdType: 'CIN' | 'BIRTH_CERT';
  nationalIdNumber: string;
}[] = [
  {nationalIdType:'CIN',nationalIdNumber:'34567891'},
  {nationalIdType:'CIN',nationalIdNumber:'34567892'},
];

export const STATIC_ADMIN_SESSION_ID = 'test-admin-session-id';

export const mockDb = {
  users: [...seedUsers],
  sessions: new Map<string, { userId: string; email: string }>([]),
  nationalIds: [...unregisteredNationalIds],
  stations: [...seedStations],
  trains: [...seedTrains],
  lines: [...seedLines],
  agents: [...seedAgents],
  controllers: [...seedControllers],
};

export const mockOtps = new Map<string, { code: string; expiresAt: number }>();

export const initializeDb = async () => {
  mockDb.users = [...seedUsers];
  mockDb.sessions.clear();
  
  mockOtps.clear();
  mockDb.stations = [...seedStations];
  mockDb.trains = [...seedTrains];
  mockDb.lines = [...seedLines];
  mockDb.agents = [...seedAgents];
  mockDb.controllers = [...seedControllers];
  console.log('Mock DB initialized with static session');
};
