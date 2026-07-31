/** Namecheap devuelve XML — usamos parsing manual de atributos. */

export type NamecheapDomainRaw = {
  ID: string
  Name: string
  User: string
  Created: string
  Expires: string
  IsExpired: string   // 'true' | 'false'
  IsLocked: string
  AutoRenew: string
  WhoisGuard: string
  IsPremium: string
  IsOurDNS: string
}

/** Extrae los atributos XML de un elemento auto-cerrado como <Domain Key="Value" /> */
export function parseXmlAttributes(element: string): Record<string, string> {
  const attrs: Record<string, string> = {}
  const regex = /(\w+)="([^"]*)"/g
  let match: RegExpExecArray | null
  while ((match = regex.exec(element)) !== null) {
    attrs[match[1]] = match[2]
  }
  return attrs
}

/** Extrae el valor de una etiqueta XML simple <Tag>value</Tag> */
export function extractXmlValue(xml: string, tag: string): string | null {
  const regex = new RegExp(`<${tag}[^>]*>([^<]*)</${tag}>`, 'i')
  const match = regex.exec(xml)
  return match ? match[1].trim() : null
}

/** Convierte la fecha de Namecheap 'MM/DD/YYYY' a ISO 'YYYY-MM-DD' */
export function parseNamecheapDate(dateStr: string): string | null {
  const parts = dateStr.split('/')
  if (parts.length !== 3) return null
  return `${parts[2]}-${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}`
}
