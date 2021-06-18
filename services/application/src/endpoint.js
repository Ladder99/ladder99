import fs from 'fs' // node lib

export class Endpoint {
  constructor() {
    this.baseUrl = null
  }

  static getEndpoints(endpointsStr) {
      // get array of agent urls
      // AGENT_URLS can be a single url, a comma-delim list of urls, or a txt filename with urls
      let endpoints = []
      if (endpointsStr.includes(',')) {
        endpoints = endpointsStr.split(',')
      } else if (endpointsStr.endsWith('.txt')) {
        const s = String(fs.readFileSync(endpointsStr)).trim()
        endpoints = s.split('\n')
      } else {
        endpoints = [endpointsStr]
      }
      // this.endpoints = endpoints
      return endpoints
    }
  
  
}
  
  // get url
  // type is 'probe', 'current', or 'sample'.
  // from and count are optional.
  getUrl(type, from, count) {
    const url =
      from === undefined
        ? `${this.baseUrl}/${type}`
        : `${this.baseUrl}/${type}?${
            from !== null ? 'from=' + from + '&' : ''
          }count=${count}`
    return url
  }
}
