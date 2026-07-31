import { ConnectorError } from '../errors'
import { parseXmlAttributes, extractXmlValue, type NamecheapDomainRaw } from './schemas'

const BASE_URL     = 'https://api.namecheap.com/xml.response'
const SANDBOX_URL  = 'https://api.sandbox.namecheap.com/xml.response'
const TIMEOUT_MS   = 30_000
const PAGE_SIZE    = 100

export class NamecheapClient {
  private readonly apiUrl: string

  constructor(
    private readonly apiUser: string,
    private readonly apiKey: string,
    private readonly clientIp: string,
    sandbox = false,
  ) {
    this.apiUrl = sandbox ? SANDBOX_URL : BASE_URL
  }

  async ping(): Promise<void> {
    // Usamos getList con page 1 como test de conexión
    await this.getDomainList(1)
  }

  async listAllDomains(): Promise<NamecheapDomainRaw[]> {
    const domains: NamecheapDomainRaw[] = []
    let page = 1

    while (true) {
      const { items, totalItems } = await this.getDomainList(page)
      domains.push(...items)
      if (domains.length >= totalItems) break
      page++
    }

    return domains
  }

  private async getDomainList(page: number): Promise<{ items: NamecheapDomainRaw[]; totalItems: number }> {
    const params = new URLSearchParams({
      ApiUser:   this.apiUser,
      ApiKey:    this.apiKey,
      UserName:  this.apiUser,
      ClientIp:  this.clientIp,
      Command:   'namecheap.domains.getList',
      Page:      String(page),
      PageSize:  String(PAGE_SIZE),
    })

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)

    try {
      const res = await fetch(`${this.apiUrl}?${params.toString()}`, { signal: controller.signal })

      if (!res.ok) throw new ConnectorError('PROVIDER_UNAVAILABLE', { technicalDetail: `HTTP ${res.status}` })

      const xml = await res.text()

      // Verificar si hay errores en la respuesta XML
      const status = xml.match(/Status="(\w+)"/)?.[1]
      if (status !== 'OK') {
        const errMsg = extractXmlValue(xml, 'Error') ?? 'Unknown Namecheap error'
        if (errMsg.toLowerCase().includes('invalid') || errMsg.toLowerCase().includes('credentials')) {
          throw new ConnectorError('INVALID_CREDENTIALS', { technicalDetail: errMsg })
        }
        throw new ConnectorError('UNKNOWN_PROVIDER_ERROR', { technicalDetail: errMsg })
      }

      // Extraer total de items para la paginación
      const totalItemsStr = extractXmlValue(xml, 'TotalItems') ?? '0'
      const totalItems = parseInt(totalItemsStr, 10)

      // Extraer elementos <Domain ... />
      const domainRegex = /<Domain\s([^/]*)\/?>/g
      const items: NamecheapDomainRaw[] = []
      let match: RegExpExecArray | null

      while ((match = domainRegex.exec(xml)) !== null) {
        const attrs = parseXmlAttributes(match[1])
        if (attrs.Name) {
          items.push(attrs as NamecheapDomainRaw)
        }
      }

      return { items, totalItems }
    } catch (err) {
      if (err instanceof ConnectorError) throw err
      if (err instanceof Error && err.name === 'AbortError') throw new ConnectorError('TIMEOUT')
      throw new ConnectorError('PROVIDER_UNAVAILABLE', { technicalDetail: String(err) })
    } finally {
      clearTimeout(timer)
    }
  }
}
