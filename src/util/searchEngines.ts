export interface SearchEngine { hostname: string, param: string  }
export const searchEngines: SearchEngine[] = [
  {
    hostname: "google.com",
    param: "q"
  },
  {
    hostname: "duckduckgo.com",
    param: "q"
  },
  {
    hostname: "bing.com",
    param: "q"
  },
  {
    hostname: "mojeek.com",
    param: "q"
  },
  {
    hostname: "qwant.com",
    param: "q"
  },
  {
    hostname: "search.aol.co.uk",
    param: "q"
  },
  {
    hostname: "yandex.ru",
    param: "text"
  },
  {
    hostname: "baidu.com",
    param: "wd"
  }
]