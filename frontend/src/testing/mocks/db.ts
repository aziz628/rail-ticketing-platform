
// users
type MockUser = {
  id: string;
  email: string;
  name: string;
  password?: string;
  nationalIdType: 'CIN' | 'BIRTH_CERT';
  nationalIdNumber: string;
  role: 'VOYAGER' | 'ADMIN' | 'AGENT' | 'CONTROLLER';
};

// infra
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

// staff

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


// schedule

type MockScheduleStop = {
  stationName: string;
  arrivalTime: string;
  kmFromSource: number;
};

type MockSchedule = {
  id: string;
  lineName: string;
  trainName: string;
  controllerName: string;
  daysBitmask: string;
  activationDate: string;
  deactivationDate: string | null;
  canDelete: boolean | null;
  canDeactivate: boolean | null;
  minDeactivationDate: string | null;
  isDeleted: boolean;
  stops: MockScheduleStop[];
};

// trips
type MockTrip = {
  id: string;
  lineId: string;
  lineName: string;
  trainName: string;
  date: string;
  startStopName: string;
  endStopName: string;
};

export type TripResponse = Omit<MockTrip, 'lineId'>;

type MockTripSettings = {
  autoGenerateEnabled: boolean;
  generationSpanDays: number;
};

// subscription / ticketing

type MockSubscriptionCategory = {
  id: string;
  name: 'SCOLAIRE' | 'UNIVERSITAIRE' | 'PROFESSIONNEL' | 'CIVIL';
  monthlyPrice: number;
  quarterlyPrice: number;
};

type MockSubscriptionRequest = {
  id: string;
  userId: string;
  voyagerName: string;
  lineName: string;
  categoryName: 'SCOLAIRE' | 'UNIVERSITAIRE' | 'PROFESSIONNEL' | 'CIVIL';
  duration: 'MONTHLY' | 'QUARTERLY';
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  rejectReason?: string;
  proofType?: string | null;
};

type MockSubscription = {
  id: string;
  userId: string;
  requestId: string;
  lineName: string;
  categoryName: 'SCOLAIRE' | 'UNIVERSITAIRE' | 'PROFESSIONNEL' | 'CIVIL';
  duration: 'MONTHLY' | 'QUARTERLY';
  expireDate: string | null;
  status: 'AWAITING_PAYMENT' | 'ACTIVE' | 'EXPIRED';
};

type MockTicket = {
  id: string;
  originStationName: string;
  destinationStationName: string;
  departureTime: string;
  arrivalTime: string;
  date: string;
  seatClassName: string;
  price: number;
  status: string;
};

// Mock PSP session state used by the payment flow.
type MockPspSession = {
  targetType: 'TICKET' | 'SUBSCRIPTION';
  pspSessionId: string;
  amount: number;
  remainingTimeinSecondes: number;
  tripId?: string;
  originNodeId?: string;
  destinationNodeId?: string;
  seatClassId?: string;
  subscriptionId?: string;
};

// seeders

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
  {
    id: '550e8400-e29b-41d4-a716-446655440002',
    email: 'agent@example.com',
    name: 'Agent Qualité',
    password: 'agent123',
    nationalIdType: 'CIN',
    nationalIdNumber: '112233445',
    role: 'AGENT',
  },
] ;

const unregisteredNationalIds :{
  nationalIdType: 'CIN' | 'BIRTH_CERT';
  nationalIdNumber: string;
}[] = [
  {nationalIdType:'CIN',nationalIdNumber:'34567891'},
  {nationalIdType:'CIN',nationalIdNumber:'34567892'},
];

// test constants
export const STATIC_ADMIN_SESSION_ID = 'test-admin-session-id';


const seedStations: MockStation[] = [
  { id: '34f4935a-c9c9-4648-96fe-a02ca5e292bd', name: 'Tunis Ville',canDelete: false },
  { id: '8283142e-f01e-48dd-a8e8-b6d09cc57582', name: 'Sousse' ,canDelete: true},
  { id: '99627c07-45a8-4450-9219-71421a69deee', name: 'Sfax' ,canDelete: true},
];

const seedTrains: MockTrain[] = [
  {
    id: 'train-1',
    name: 'EXP',
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
  {
    id: 'line-gabes',
    name: 'Tunis ↔ Gabès',
    nodes: [
      { id: 'node-1', stationId: '34f4935a-c9c9-4648-96fe-a02ca5e292bd', stationName: 'Tunis Ville', kmFromSource: 0, orderIndex: 0 },
      { id: 'node-2', stationId: 'gabes-id', stationName: 'Gabès', kmFromSource: 400, orderIndex: 1 },
    ],
  },
  {
    id: 'line-test-free',
    name: 'Tunis ↔ TestFree',
    nodes: [
      { id: 'line-test-free-node-1', stationId: '34f4935a-c9c9-4648-96fe-a02ca5e292bd', stationName: 'Tunis Ville', kmFromSource: 0, orderIndex: 0 },
      { id: 'line-test-free-node-2', stationId: '99627c07-45a8-4450-9219-71421a69deee', stationName: 'Sfax', kmFromSource: 270, orderIndex: 1 },
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

const seedSchedules: MockSchedule[] = [
  {
    id: 'b6e82a0b-19c2-48f1-9c65-4f4d22bb1e89',
    lineName: 'Tunis ↔ Sfax',
    trainName: 'EXP',
    controllerName: 'Mohamed Controller',
    daysBitmask: '1111100', // Mon-Fri
    activationDate: '2026-04-01',
    deactivationDate: null,
    canDelete: true,
    canDeactivate: true,
    minDeactivationDate: '2026-04-02',
    isDeleted: false,
    stops: [
      { stationName: 'Tunis Ville', arrivalTime: '08:30', kmFromSource: 0 },
      { stationName: 'Sousse', arrivalTime: '10:15', kmFromSource: 140 },
      { stationName: 'Sfax', arrivalTime: '12:45', kmFromSource: 270 },
    ],
  },
  {
    id: 'schedule-gabes',
    lineName: 'Tunis ↔ Gabès',
    trainName: 'EXP',
    controllerName: 'Mohamed Controller',
    daysBitmask: '0000011', // Sat-Sun
    activationDate: '2026-05-01',
    deactivationDate: null,
    canDelete: true,
    canDeactivate: true,
    minDeactivationDate: '2026-05-02',
    isDeleted: false,
    stops: [
      { stationName: 'Tunis Ville', arrivalTime: '07:00', kmFromSource: 0 },
      { stationName: 'Gabès', arrivalTime: '13:00', kmFromSource: 400 },
    ],
  },
];

// today date used in seeded data
const TODAY_STR = new Date().toISOString().split('T')[0];

// for pagination tests 10 trips with same lineId and date for pagination test
const seedTrips: MockTrip[] = [
  { id: 'trip-1', lineId: '41a3a3b1-b8f9-414a-8e1b-991c959f3f3e', lineName: 'Tunis ↔ Sfax', trainName: 'EXP', date: TODAY_STR, startStopName: 'Tunis Ville', endStopName: 'Sfax' },
  { id: 'trip-2', lineId: '41a3a3b1-b8f9-414a-8e1b-991c959f3f3e', lineName: 'Tunis ↔ Sfax', trainName: 'EXP', date: TODAY_STR, startStopName: 'Tunis Ville', endStopName: 'Sfax' },
  { id: 'trip-3', lineId: '41a3a3b1-b8f9-414a-8e1b-991c959f3f3e', lineName: 'Tunis ↔ Sfax', trainName: 'EXP', date: TODAY_STR, startStopName: 'Tunis Ville', endStopName: 'Sfax' },
  { id: 'trip-4', lineId: '41a3a3b1-b8f9-414a-8e1b-991c959f3f3e', lineName: 'Tunis ↔ Sfax', trainName: 'EXP', date: TODAY_STR, startStopName: 'Tunis Ville', endStopName: 'Sfax' },
  { id: 'trip-5', lineId: '41a3a3b1-b8f9-414a-8e1b-991c959f3f3e', lineName: 'Tunis ↔ Sfax', trainName: 'EXP', date: TODAY_STR, startStopName: 'Tunis Ville', endStopName: 'Sfax' },
  { id: 'trip-6', lineId: '41a3a3b1-b8f9-414a-8e1b-991c959f3f3e', lineName: 'Tunis ↔ Sfax', trainName: 'EXP', date: TODAY_STR, startStopName: 'Tunis Ville', endStopName: 'Sfax' },
  { id: 'trip-7', lineId: '41a3a3b1-b8f9-414a-8e1b-991c959f3f3e', lineName: 'Tunis ↔ Sfax', trainName: 'EXP', date: TODAY_STR, startStopName: 'Tunis Ville', endStopName: 'Sfax' },
  { id: 'trip-8', lineId: '41a3a3b1-b8f9-414a-8e1b-991c959f3f3e', lineName: 'Tunis ↔ Sfax', trainName: 'EXP', date: TODAY_STR, startStopName: 'Tunis Ville', endStopName: 'Sfax' },
  { id: 'trip-9', lineId: '41a3a3b1-b8f9-414a-8e1b-991c959f3f3e', lineName: 'Tunis ↔ Sfax', trainName: 'EXP', date: TODAY_STR, startStopName: 'Tunis Ville', endStopName: 'Sfax' },
  { id: 'trip-10', lineId: '41a3a3b1-b8f9-414a-8e1b-991c959f3f3e', lineName: 'Tunis ↔ Sfax', trainName: 'EXP', date: TODAY_STR, startStopName: 'Tunis Ville', endStopName: 'Sfax' },
  // Page 2 triggers
  { id: 'trip-11', lineId: '41a3a3b1-b8f9-414a-8e1b-991c959f3f3e', lineName: 'Tunis ↔ Sfax', trainName: 'EXP', date: TODAY_STR, startStopName: 'Tunis Ville', endStopName: 'Sfax' },
  
  { id: 'trip-13', lineId: 'line-gabes', lineName: 'Tunis ↔ Gabès', trainName: 'EXP', date: '2026-05-14', startStopName: 'Tunis Ville', endStopName: 'Gabès' },
  { id: 'trip-14', lineId: 'line-gabes', lineName: 'Tunis ↔ Gabès', trainName: 'EXP', date: '2026-05-14', startStopName: 'Tunis Ville', endStopName: 'Gabès' },
  { id: 'trip-15', lineId: '41a3a3b1-b8f9-414a-8e1b-991c959f3f3e', lineName: 'Tunis ↔ Sfax', trainName: 'EXP', date: '2026-05-15', startStopName: 'Tunis Ville', endStopName: 'Sfax' },
  // test-only trip for free-booking path
  { id: 'trip-test-free-1', lineId: 'line-test-free', lineName: 'Tunis ↔ TestFree', trainName: 'EXP', date: TODAY_STR, startStopName: 'Tunis Ville', endStopName: 'Sfax' },
];


const seedTripSettings: MockTripSettings = {
  autoGenerateEnabled: true,
  generationSpanDays: 7,
};


const seedTickets: MockTicket[] = [
  {
    id: 'ticket-upcoming-1',
    originStationName: 'Tunis Ville',
    destinationStationName: 'Sfax',
    departureTime: '08:30',
    arrivalTime: '12:45',
    date: '2027-01-01',
    seatClassName: 'PREMIÈRE CLASSE',
    price: 35.50,
    status: 'PAID'
  },
  {
    id: 'ticket-past-1',
    originStationName: 'Sousse',
    destinationStationName: 'Tunis Ville',
    departureTime: '15:00',
    arrivalTime: '17:00',
    date: '2020-01-01',
    seatClassName: 'DEUXIÈME CLASSE',
    price: 15.00,
    status: 'PAID'
  }
];

const seedSubscriptionCategories: MockSubscriptionCategory[] = [
  { id: 'subcat-scolaire', name: 'SCOLAIRE', monthlyPrice: 8.00, quarterlyPrice: 22.00 },
  { id: 'subcat-universitaire', name: 'UNIVERSITAIRE', monthlyPrice: 12.50, quarterlyPrice: 34.00 },
  { id: 'subcat-professionnel', name: 'PROFESSIONNEL', monthlyPrice: 18.00, quarterlyPrice: 49.00 },
  { id: 'subcat-civil', name: 'CIVIL', monthlyPrice: 25.00, quarterlyPrice: 68.00 },
];

const seedSubscriptionRequests: MockSubscriptionRequest[] = [
];

const seedSubscriptions: MockSubscription[] = [
  // test-only active subscription for free-booking path (Voyager)
  {
    id: 'sub-seed-test-free-1',
    userId: '550e8400-e29b-41d4-a716-446655440000',
    requestId: 'subreq-seed-test-free-1',
    lineName: 'Tunis ↔ TestFree',
    categoryName: 'CIVIL',
    duration: 'MONTHLY',
    expireDate: null,
    status: 'ACTIVE',
  },
];

export const mockDb = {
  users: [...seedUsers],
  sessions: new Map<string, { userId: string; email: string }>([]),
  nationalIds: [...unregisteredNationalIds],
  stations: [...seedStations],
  trains: [...seedTrains],
  lines: [...seedLines],
  agents: [...seedAgents],
  controllers: [...seedControllers],
  schedules: [...seedSchedules],
  trips: [...seedTrips],
  tripSettings: { ...seedTripSettings },
  subscriptionCategories: [...seedSubscriptionCategories],
  subscriptionRequests: [...seedSubscriptionRequests],
  subscriptions: [...seedSubscriptions],
  tickets: [...seedTickets],
  activePspSession: null as MockPspSession | null,
};

// otp storage used for testing otp verification flows
export const mockOtps = new Map<string, { code: string; expiresAt: number }>();

// initialize db
export const initializeDb = async () => {
  mockDb.users = [...seedUsers];
  // reset data 
  mockDb.sessions.clear();
  mockOtps.clear();

  mockDb.stations = [...seedStations];
  mockDb.trains = [...seedTrains];
  mockDb.lines = [...seedLines];
  mockDb.agents = [...seedAgents];
  mockDb.controllers = [...seedControllers];
  mockDb.schedules = [...seedSchedules];
  mockDb.trips = [...seedTrips];
  mockDb.tripSettings = { ...seedTripSettings };
  mockDb.subscriptionCategories = [...seedSubscriptionCategories];
  mockDb.subscriptionRequests = [...seedSubscriptionRequests];
  mockDb.subscriptions = [...seedSubscriptions];
  mockDb.tickets = [...seedTickets];
  mockDb.activePspSession = null;
  console.log('Mock DB initialized with static session');
};

// persist data in session storage
export const persistMockDb = () => {
  sessionStorage.setItem('mockDb_subReqs', JSON.stringify(mockDb.subscriptionRequests));
  sessionStorage.setItem('mockDb_subs', JSON.stringify(mockDb.subscriptions));
};


// restores data in mock db from session storage after page reload
export const restoreMockDb = () => {
  // subscription requests
  const reqs = sessionStorage.getItem('mockDb_subReqs');
  if (reqs) mockDb.subscriptionRequests = JSON.parse(reqs);
  // subscriptions
  const subs = sessionStorage.getItem('mockDb_subs');
  if (subs) mockDb.subscriptions = JSON.parse(subs);
  // psp session
  const psp = sessionStorage.getItem('mockDb_pspSession');
  if (psp) mockDb.activePspSession = JSON.parse(psp);
};
