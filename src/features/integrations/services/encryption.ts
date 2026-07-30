/**
 * Servicio de cifrado AES-256-GCM para secretos de integraciones.
 *
 * Formato de ciphertext (bytea en Postgres):
 *   byte[0]       = format_version  (actualmente: 0x01)
 *   byte[1]       = key_version     (número de versión de la clave, 0–255)
 *   bytes[2..13]  = IV              (12 bytes, aleatorio único por cifrado)
 *   bytes[14..29] = auth_tag        (16 bytes, GCM authentication tag)
 *   bytes[30..]   = ciphertext      (longitud variable)
 *
 * La clave se lee de INTEGRATION_ENCRYPTION_KEY (base64, 32 bytes).
 * Nunca se loguea. Nunca aparece en HTML ni metadata.
 * Si la clave no está presente, el proceso falla al arrancar.
 */

import { randomBytes, createCipheriv, createDecipheriv } from 'crypto'

const FORMAT_VERSION = 0x01
const KEY_VERSION = 0x01
const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 12     // recomendado para GCM
const TAG_LENGTH = 16    // siempre 16 bytes en GCM

// ── Carga y validación de la clave ───────────────────────────────────────────

// La clave se carga de forma perezosa en el primer uso, no al importar el módulo.
// Esto evita que el build de Next.js falle cuando la variable de entorno no está
// disponible en tiempo de compilación (las variables server-only no se inyectan durante build).
let _cachedKey: Buffer | null = null

function getEncryptionKey(): Buffer {
  if (_cachedKey) return _cachedKey

  const raw = process.env.INTEGRATION_ENCRYPTION_KEY
  if (!raw) {
    throw new Error(
      '[encryption] INTEGRATION_ENCRYPTION_KEY no está definida. ' +
      'Añade la variable de entorno antes de iniciar.',
    )
  }
  const key = Buffer.from(raw, 'base64')
  if (key.byteLength !== 32) {
    throw new Error(
      `[encryption] INTEGRATION_ENCRYPTION_KEY debe ser 32 bytes en base64 ` +
      `(se recibieron ${key.byteLength}).`,
    )
  }
  _cachedKey = key
  return key
}

// ── API pública ───────────────────────────────────────────────────────────────

/**
 * Cifra un valor de texto plano.
 *
 * @param plaintext  Valor a cifrar (string UTF-8).
 * @returns Objeto con `hex` (para almacenar como `\x{hex}` en Postgres bytea)
 *          y `buffer` (el Buffer completo, útil para comparaciones en tests).
 */
export function encryptSecret(plaintext: string): { hex: string; buffer: Buffer } {
  const key = getEncryptionKey()
  const iv = randomBytes(IV_LENGTH)
  const cipher = createCipheriv(ALGORITHM, key, iv, { authTagLength: TAG_LENGTH })

  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ])

  const authTag = cipher.getAuthTag()

  // Ensamblar: format_version + key_version + iv + authTag + ciphertext
  const result = Buffer.concat([
    Buffer.from([FORMAT_VERSION, KEY_VERSION]),
    iv,
    authTag,
    encrypted,
  ])

  return { hex: result.toString('hex'), buffer: result }
}

/**
 * Descifra un valor almacenado en la base de datos.
 *
 * @param raw  Buffer o hex string (sin el prefijo `\x` de Postgres).
 *             El driver de Supabase puede devolver bytea como Buffer o como string hex.
 * @returns Texto plano descifrado.
 * @throws Error si el formato es inválido, el tag no coincide o la versión es desconocida.
 */
export function decryptSecret(raw: Buffer | string): string {
  const buf = typeof raw === 'string' ? hexToBuffer(raw) : raw

  // Validar tamaño mínimo: 2 (header) + 12 (IV) + 16 (tag) + 1 (mínimo ciphertext)
  if (buf.byteLength < 31) {
    throw new Error('[encryption] Ciphertext demasiado corto para ser válido.')
  }

  const formatVersion = buf[0]
  if (formatVersion !== FORMAT_VERSION) {
    throw new Error(
      `[encryption] Versión de formato desconocida: 0x${formatVersion?.toString(16)}. ` +
      'Actualiza el servicio de descifrado.',
    )
  }

  // key_version (byte[1]) — reservado para futura rotación de claves.
  // Actualmente solo existe la clave VERSION=1.
  // const keyVersion = buf[1]

  const iv = buf.slice(2, 2 + IV_LENGTH)
  const authTag = buf.slice(2 + IV_LENGTH, 2 + IV_LENGTH + TAG_LENGTH)
  const ciphertext = buf.slice(2 + IV_LENGTH + TAG_LENGTH)

  const decipher = createDecipheriv(ALGORITHM, getEncryptionKey(), iv, { authTagLength: TAG_LENGTH })
  decipher.setAuthTag(authTag)

  try {
    const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()])
    return decrypted.toString('utf8')
  } catch {
    // No exponer detalles técnicos del fallo de autenticación GCM.
    throw new Error('[encryption] Fallo al descifrar: el mensaje puede haber sido alterado.')
  }
}

/**
 * Formatea el buffer cifrado para inserción directa en Postgres como bytea literal.
 * Uso: `INSERT INTO integration_secrets (secret_ciphertext) VALUES (${formatForPostgres(hex)})` →
 * el driver debe recibir el Buffer directamente, no el hex string.
 *
 * Esta función devuelve la notación hex que Postgres acepta como `\x{hex}`.
 */
export function formatHexForPostgres(hex: string): string {
  return `\\x${hex}`
}

// ── Helpers privados ──────────────────────────────────────────────────────────

function hexToBuffer(hex: string): Buffer {
  // Supabase/pg devuelven bytea como '\x{hex}' — quitar el prefijo si está presente.
  const clean = hex.startsWith('\\x') ? hex.slice(2) : hex
  return Buffer.from(clean, 'hex')
}
