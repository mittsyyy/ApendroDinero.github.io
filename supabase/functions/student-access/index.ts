import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
};

const PIN_ITERATIONS = 120_000;
const MAX_FAILED_ATTEMPTS = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000;

type StudentAccessRequest =
  | { action: 'register'; name: string; pin: string }
  | { action: 'login'; name: string; pin: string };

function respond(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), { status, headers: corsHeaders });
}

function normalizeUsername(name: string) {
  return name
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLocaleLowerCase('es-MX');
}

function toBase64(bytes: Uint8Array) {
  let binary = '';
  bytes.forEach(byte => { binary += String.fromCharCode(byte); });
  return btoa(binary);
}

function fromBase64(value: string) {
  return Uint8Array.from(atob(value), character => character.charCodeAt(0));
}

async function hashPin(pin: string, salt: Uint8Array) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(pin),
    'PBKDF2',
    false,
    ['deriveBits'],
  );
  const hash = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt, iterations: PIN_ITERATIONS },
    key,
    256,
  );
  return new Uint8Array(hash);
}

function hashMatches(actual: Uint8Array, expected: Uint8Array) {
  if (actual.length !== expected.length) return false;
  let difference = 0;
  for (let index = 0; index < actual.length; index++) {
    difference |= actual[index] ^ expected[index];
  }
  return difference === 0;
}

function isValidInput(name: unknown, pin: unknown): name is string {
  return typeof name === 'string'
    && name.trim().length > 0
    && name.trim().length <= 80
    && typeof pin === 'string'
    && /^\d{4,8}$/.test(pin);
}

function getRequiredEnvironment(name: string) {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`Falta configurar la variable ${name}.`);
  return value;
}

Deno.serve(async request => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  if (request.method !== 'POST') {
    return respond(405, { error: 'Método no permitido.' });
  }

  let payload: StudentAccessRequest;
  try {
    payload = await request.json();
  } catch {
    return respond(400, { error: 'Solicitud inválida.' });
  }

  if (!payload || !['register', 'login'].includes(payload.action)
    || !isValidInput(payload.name, payload.pin)) {
    return respond(400, { error: 'Escribe un nombre y un PIN de 4 a 8 números.' });
  }

  const displayName = payload.name.trim().replace(/\s+/g, ' ');
  const username = normalizeUsername(displayName);
  if (!username) return respond(400, { error: 'El nombre no es válido.' });

  try {
    const supabaseUrl = getRequiredEnvironment('SUPABASE_URL');
    const anonKey = getRequiredEnvironment('SUPABASE_ANON_KEY');
    const serviceRoleKey = getRequiredEnvironment('SUPABASE_SERVICE_ROLE_KEY');
    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    if (payload.action === 'register') {
      const authorization = request.headers.get('Authorization');
      const accessToken = authorization?.match(/^Bearer\s+(.+)$/i)?.[1];
      if (!accessToken) return respond(401, { error: 'Inicia sesión como profesor para registrar alumnos.' });

      const teacherClient = createClient(supabaseUrl, anonKey, {
        auth: { autoRefreshToken: false, persistSession: false },
        global: { headers: { Authorization: `Bearer ${accessToken}` } },
      });
      const { data: { user: teacher }, error: authError } = await teacherClient.auth.getUser(accessToken);
      if (authError || !teacher) return respond(401, { error: 'La sesión del profesor no es válida.' });

      const { data: professor, error: professorError } = await admin
        .from('profesores')
        .select('id')
        .eq('id', teacher.id)
        .maybeSingle();
      if (professorError) throw professorError;
      if (!professor) return respond(403, { error: 'Solo un profesor puede registrar alumnos.' });

      const email = `alumno-${crypto.randomUUID()}@students.aprendodinero.invalid`;
      const temporaryPassword = toBase64(crypto.getRandomValues(new Uint8Array(36)));
      const { data: created, error: createError } = await admin.auth.admin.createUser({
        email,
        password: temporaryPassword,
        email_confirm: true,
        user_metadata: { nombre: displayName, rol: 'alumno' },
      });
      if (createError) throw createError;
      if (!created.user) throw new Error('Supabase no devolvió el usuario recién creado.');

      const salt = crypto.getRandomValues(new Uint8Array(16));
      const pinHash = await hashPin(payload.pin, salt);
      const { error: playerError } = await admin
        .from('jugadores')
        .insert({ id: created.user.id, nombre: displayName });
      if (playerError) {
        await admin.auth.admin.deleteUser(created.user.id);
        if (playerError.code === '23505') {
          return respond(409, { error: 'Ya existe un alumno con ese nombre. Agrega otro nombre para distinguirlo.' });
        }
        throw playerError;
      }

      const { error: accessError } = await admin
        .from('alumno_access')
        .insert({
          user_id: created.user.id,
          username,
          display_name: displayName,
          auth_email: email,
          pin_salt: toBase64(salt),
          pin_hash: toBase64(pinHash),
          created_by: teacher.id,
        });
      if (accessError) {
        await admin.from('jugadores').delete().eq('id', created.user.id);
        await admin.auth.admin.deleteUser(created.user.id);
        if (accessError.code === '23505') {
          return respond(409, { error: 'Ya existe un alumno con ese nombre. Agrega otro nombre para distinguirlo.' });
        }
        throw accessError;
      }

      return respond(201, { message: 'Alumno registrado.', name: displayName });
    }

    const { data: student, error: studentError } = await admin
      .from('alumno_access')
      .select('user_id, auth_email, pin_salt, pin_hash, failed_attempts, locked_until')
      .eq('username', username)
      .maybeSingle();
    if (studentError) throw studentError;
    if (!student) return respond(401, { error: 'Nombre o PIN incorrectos.' });

    if (student.locked_until && new Date(student.locked_until).getTime() > Date.now()) {
      return respond(429, { error: 'Demasiados intentos. Espera 15 minutos e intenta otra vez.' });
    }

    const salt = fromBase64(student.pin_salt);
    const expectedHash = fromBase64(student.pin_hash);
    const actualHash = await hashPin(payload.pin, salt);
    if (!hashMatches(actualHash, expectedHash)) {
      const attempts = student.locked_until ? 1 : student.failed_attempts + 1;
      const lockedUntil = attempts >= MAX_FAILED_ATTEMPTS
        ? new Date(Date.now() + LOCK_DURATION_MS).toISOString()
        : null;
      const { error: attemptError } = await admin
        .from('alumno_access')
        .update({ failed_attempts: attempts, locked_until: lockedUntil })
        .eq('user_id', student.user_id);
      if (attemptError) throw attemptError;
      return respond(attempts >= MAX_FAILED_ATTEMPTS ? 429 : 401, {
        error: attempts >= MAX_FAILED_ATTEMPTS
          ? 'Demasiados intentos. Espera 15 minutos e intenta otra vez.'
          : 'Nombre o PIN incorrectos.',
      });
    }

    const { data: player, error: playerError } = await admin
      .from('jugadores')
      .select('nombre')
      .eq('id', student.user_id)
      .maybeSingle();
    if (playerError) throw playerError;
    if (!player) throw new Error('El perfil del alumno no está disponible.');

    const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
      type: 'magiclink',
      email: student.auth_email,
    });
    if (linkError) throw linkError;
    const tokenHash = linkData.properties?.hashed_token;
    if (!tokenHash) throw new Error('Supabase no generó el token de acceso.');

    const { error: resetError } = await admin
      .from('alumno_access')
      .update({ failed_attempts: 0, locked_until: null })
      .eq('user_id', student.user_id);
    if (resetError) throw resetError;

    return respond(200, {
      token_hash: tokenHash,
      name: player.nombre,
    });
  } catch (error) {
    console.error('student-access:', error);
    return respond(500, { error: 'No se pudo completar la solicitud. Intenta de nuevo.' });
  }
});
