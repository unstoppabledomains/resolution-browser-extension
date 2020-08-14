// hostname is the name of search engine website
// param is the parameter containing search query 

// example 
// url =  https://www.google.com/search?q=brad.crypto&rlz=1C5CHFA_enUS901US901&oq=brad.crypto&aqs=chrome.0.69i59j0l4j69i60l3.1988j0j7&sourceid=chrome&ie=UTF-8
// q=brad.crypto  --> q is the name of param in this case when brad.crypto is a search query.

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
  },
  {
    hostname: "yahoo.com",
    param: "p"
  },
  {
    hostname: "wiki.com",
    param: "q"
  }
]