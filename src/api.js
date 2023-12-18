const BASE_URL = "https://min-api.cryptocompare.com/data";
const API_KEY =
  "e719b50a13acf8dae93a31bd8bd9d8b25df4b1b80d637bb76a19882d144f7399";

export const getCoinList = () =>
  fetch(`${BASE_URL}/top/mktcapfull?limit=100&tsym=USD`).then((r) => r.json());

export const loadTickers = (tickers) =>
  fetch(
    `${BASE_URL}/price?fsym=USD&tsyms=${tickers.join(",")}&api_key=${API_KEY}`
  )
    .then((r) => r.json())
    .then((rowData) =>
      Object.fromEntries(
        Object.entries(rowData).map(([key, value]) => [key, 1 / value])
      )
    );
