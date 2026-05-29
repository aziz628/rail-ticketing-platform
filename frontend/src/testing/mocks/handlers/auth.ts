import { http, HttpResponse } from 'msw';
import { mockDb, mockOtps } from '../db';

const RESET_OTP = '12345678';

function getCookieValue(cookieHeader: string | null, key: string) {
  const cookie = cookieHeader?.split(';').map((part) => part.trim()).find((part) => part.startsWith(`${key}=`));
  return cookie?.split('=')[1];
}

export const authHandlers = [
  http.get('*/api/users/me', ({ request }) => {
    const sessionId = request.headers.get('x-mock-session') || getCookieValue(request.headers.get('cookie'), 'JSESSIONID');
    const session = sessionId ? mockDb.sessions.get(sessionId) : undefined;
    if (!session) {
      return HttpResponse.json(
        { 
          status: 401,
          error: 'Unauthorized',
          message: 'Non autorisé',
          path: '/api/users/me'
        },
        { status: 401 }
      );
    }

    const user = mockDb.users.find((entry) => entry.id === session.userId) ?? mockDb.users[0];
    return HttpResponse.json(
      {
        id: user.id,
        email: user.email,
        name: user.name,
        nationalIdType: user.nationalIdType,
        nationalIdNumber: user.nationalIdNumber,
        role: user.role,
      },
      { status: 200 }
    );
  }),

  http.post('*/api/auth/login', async ({ request }) => {
    const body = await request.json() as any;
    const { email, password } = body;

    const user = mockDb.users.find((entry) => entry.email.toLowerCase() === email.toLowerCase() && entry.password === password);
    if (user) {
      const sessionId = crypto.randomUUID();
      mockDb.sessions.set(sessionId, { userId: user.id, email: user.email });
      return HttpResponse.json(
        {
          id: user.id,
          email: user.email,
          name: user.name,
          nationalIdType: user.nationalIdType,
          nationalIdNumber: user.nationalIdNumber,
          role: user.role,
        },
        {
          status: 200,
          headers: {
            'Set-Cookie': `JSESSIONID=${sessionId}; Path=/; HttpOnly`,
          },
        }
      );
    }

    return HttpResponse.json(
      { 
        status: 401,
        error: 'Unauthorized',
        message: 'Identifiants invalides',
        path: '/api/auth/login'
      },
      { status: 401 }
    );
  }),

  http.post('*/api/auth/register', async ({ request }) => {
    const body = await request.json() as any;
    const { email, password, nationalIdType, nationalIdNumber } = body;
    
    if (!email || !password || !nationalIdType || !nationalIdNumber) {
      return HttpResponse.json(
        { 
          status: 400,
          error: 'Bad Request',
          message: 'Un ou plusieurs champs sont invalides',
          path: '/api/auth/register'
        },
        { status: 400 }
      );
    }

    const isValidGovId = mockDb.nationalIds.some(entry => entry.nationalIdType === nationalIdType && entry.nationalIdNumber === nationalIdNumber);
    if (!isValidGovId) {
      return HttpResponse.json(
        { 
          status: 404,
          error: 'Not Found',
          message: 'Identité nationale non trouvée',
          path: '/api/auth/register'
        },
        { status: 404 }
      );
    }

    const isEmailTaken = mockDb.users.some(u => u.email.toLowerCase() === email.toLowerCase());
    if (isEmailTaken) {
      return HttpResponse.json(
        { 
          status: 409,
          error: 'Conflict',
          message: 'Cet email est déjà enregistré',
          path: '/api/auth/register'
        },
        { status: 409 }
      );
    }

    const isIdTaken = mockDb.users.some(u => u.nationalIdNumber === nationalIdNumber && u.nationalIdType === nationalIdType);
    if (isIdTaken) {
      return HttpResponse.json(
        { 
          status: 409,
          error: 'Conflict',
          message: 'Cette identité nationale est déjà enregistrée',
          path: '/api/auth/register'
        },
        { status: 409 }
      );
    }

    const name = email.split('@')[0].replace(/[._-]+/g, ' ');
    const newUser = {
      id: crypto.randomUUID(),
      email,
      name,
      password,
      nationalIdType,
      nationalIdNumber,
      role: 'VOYAGER' as const,
    };
    mockDb.users.push(newUser);

    return HttpResponse.json(
      {
        id: newUser.id,
        name: newUser.name,
        nationalIdType: newUser.nationalIdType,
        nationalIdNumber: newUser.nationalIdNumber,
        email: newUser.email,
        role: newUser.role,
      },
      { status: 201 }
    );
  }),

  http.post('*/api/auth/forgot-password', async ({ request }) => {
    const body = await request.json() as any;
    const { email } = body;

    if (!email) return HttpResponse.json({ status: 400, error: 'Bad Request', message: 'Email requis', path: '/api/auth/forgot-password' }, { status: 400 });

    const userExists = mockDb.users.some(u => u.email.toLowerCase() === email.toLowerCase());
    if (!userExists) {
      return HttpResponse.json(
        { 
          status: 404,
          error: 'Not Found',
          message: 'Aucun utilisateur trouvé avec cet email',
          path: '/api/auth/forgot-password'
        },
        { status: 404 }
      );
    }
    // store mock otp for testing reset password
    mockOtps.set(email.toLowerCase(), {
      code: RESET_OTP,
      expiresAt: Date.now() + 15 * 60 * 1000,
    });

    return HttpResponse.json({ message: 'Code de réinitialisation envoyé' }, { status: 200 });
  }),

  http.post('*/api/auth/reset-password', async ({ request }) => {
    const body = await request.json() as any;
    const { otp, newPassword, confirmPassword } = body;

    if (newPassword !== confirmPassword) {
      return HttpResponse.json(
        { 
          status: 400,
          error: 'Bad Request',
          message: 'Les mots de passe ne correspondent pas',
          path: '/api/auth/reset-password'
        },
        { status: 400 }
      );
    }

    const storedOtpEntry = [...mockOtps.entries()].find(([, entry]) => entry.code === otp && entry.expiresAt > Date.now());

    if (!storedOtpEntry) {
      return HttpResponse.json(
        { 
          status: 400,
          error: 'Bad Request',
          message: 'Code OTP invalide ou expiré',
          path: '/api/auth/reset-password'
        },
        { status: 400 }
      );
    }

    const email = storedOtpEntry[0];
    const user = mockDb.users.find(u => u.email.toLowerCase() === email);
    
    if (user) {
      user.password = newPassword;
    }
    
    mockOtps.delete(email);

    return HttpResponse.json({ message: 'Mot de passe réinitialisé avec succès' }, { status: 200 });
  }),

  http.post('*/api/auth/logout', ({ request }) => {
    const sessionId = getCookieValue(request.headers.get('cookie'), 'JSESSIONID');
    if (sessionId) {
      mockDb.sessions.delete(sessionId);
    }

    return HttpResponse.json(
      { message: 'Déconnecté' },
      {
        status: 200,
        headers: {
          'Set-Cookie': 'JSESSIONID=; Path=/; Max-Age=0',
        },
      }
    );
  }),

  http.post('*/api/auth/staff/login', async ({ request }) => {
    const { email, password } = await request.json() as any;
    const user = mockDb.users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);

    if (user && user.role !== 'VOYAGER') {
      const sessionId = crypto.randomUUID();
      mockDb.sessions.set(sessionId, { userId: user.id, email: user.email });
      return HttpResponse.json(
        {
          id: user.id,
          name: user.name,
          nationalIdType: user.nationalIdType,
          nationalIdNumber: user.nationalIdNumber,
          email: user.email,
          role: user.role,
        },
        {
          status: 200,
          headers: {
            'Set-Cookie': `JSESSIONID=${sessionId}; Path=/; HttpOnly`,
          },
        }
      );
    }

    return HttpResponse.json(
      { 
        status: 401,
        error: 'Unauthorized',
        message: 'Identifiants staff invalides',
        path: '/api/auth/staff/login'
      },
      { status: 401 }
    );
  }),

  http.post('*/api/auth/staff/forgot-password', async ({ request }) => {
    const { email } = await request.json() as any;
    const user = mockDb.users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.role !== 'VOYAGER');

    if (!user) {
      return HttpResponse.json(
        { 
          status: 404,
          error: 'Not Found',
          message: 'Membre du personnel non trouvé',
          path: '/api/auth/staff/forgot-password'
        },
        { status: 404 }
      );
    }

    mockOtps.set(email.toLowerCase(), {
      code: RESET_OTP,
      expiresAt: Date.now() + 15 * 60 * 1000,
    });

    return HttpResponse.json({ message: 'Code OTP staff envoyé' }, { status: 200 });
  }),

  http.post('*/api/auth/staff/reset-password', async ({ request }) => {
    const { otp, newPassword, confirmPassword } = await request.json() as any;

    if (newPassword !== confirmPassword) {
      return HttpResponse.json(
        { 
          status: 400,
          error: 'Bad Request',
          message: 'Les mots de passe ne correspondent pas',
          path: '/api/auth/staff/reset-password'
        },
        { status: 400 }
      );
    }

    const entry = [...mockOtps.entries()].find(([, e]) => e.code === otp && e.expiresAt > Date.now());
    if (!entry) {
      return HttpResponse.json(
        { 
          status: 400,
          error: 'Bad Request',
          message: 'Code OTP invalide ou expiré',
          path: '/api/auth/staff/reset-password'
        },
        { status: 400 }
      );
    }

    const email = entry[0];
    const user = mockDb.users.find(u => u.email.toLowerCase() === email && u.role !== 'VOYAGER');
    if (user) user.password = newPassword;
    mockOtps.delete(email);

    return HttpResponse.json({ message: 'Mot de passe staff réinitialisé avec succès' }, { status: 200 });
  }),
];
