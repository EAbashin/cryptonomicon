const BASE_URL = "https://min-api.cryptocompare.com/data";
const API_KEY =
  "e719b50a13acf8dae93a31bd8bd9d8b25df4b1b80d637bb76a19882d144f7399";
const tickerHandlers = new Map();

export const getCoinList = () =>
  fetch(`${BASE_URL}/top/mktcapfull?limit=100&tsym=USD`).then((r) => r.json());

const loadTickers = () => {
  if (tickerHandlers.size === 0) {
    return;
  }

  const tickerNames = Array.from(tickerHandlers.keys()).join(",");
  fetch(
    `${BASE_URL}/pricemulti?fsyms=${tickerNames}&tsyms=USD&api_key=${API_KEY}`
  )
    .then((r) => r.json())
    .then((rowData) => {
      const updatedPrices = Object.fromEntries(
        Object.entries(rowData).map(([key, value]) => [key, value.USD])
      );

      Object.entries(updatedPrices).forEach(([tickerName, newPrice]) => {
        const handlers = tickerHandlers.get(tickerName) ?? [];
        handlers.forEach((fn) => fn(newPrice));
      });
    });
};

export const subscribeToTicker = (ticker, cb) => {
  const subscribers = tickerHandlers.get(ticker) || [];
  tickerHandlers.set(ticker, [...subscribers, cb]);
};

export const unsubscribeFromTicker = (ticker, cb) => {
  const subscribers = tickerHandlers.get(ticker) || [];
  tickerHandlers.set(
    ticker,
    subscribers.filter((fn) => fn !== cb)
  );
};

setInterval(loadTickers, 5000);

window.tickers = tickerHandlers;
