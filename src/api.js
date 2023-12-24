const BASE_URL = "https://min-api.cryptocompare.com/data";
const API_KEY =
  "e719b50a13acf8dae93a31bd8bd9d8b25df4b1b80d637bb76a19882d144f7399";
const tickerHandlers = new Map();
const AGGREGATE_INDEX = "5";

const socket = new WebSocket(
  `wss://streamer.cryptocompare.com/v2?api_key=${API_KEY}`
);

socket.addEventListener("message", (e) => {
  const {
    TYPE: type,
    FROMSYMBOL: tickerName,
    PRICE: newPrice,
  } = JSON.parse(e.data);

  if (type !== AGGREGATE_INDEX) {
    return;
  }

  const handlers = tickerHandlers.get(tickerName) ?? [];
  handlers.forEach((fn) => fn(newPrice));
});

export const getCoinList = () =>
  fetch(`${BASE_URL}/top/mktcapfull?limit=100&tsym=USD`).then((r) => r.json());

const sendToWebSocket = (tickerName, action) => {
  const message = JSON.stringify({
    action,
    subs: [`5~CCCAGG~${tickerName}~USD`],
  });

  if (socket.readyState === WebSocket.OPEN) {
    socket.send(message);
  } else {
    socket.addEventListener("open", () => socket.send(message), {
      once: true,
    });
  }
};

const subscribeToTickerOnWs = (tickerName) => {
  sendToWebSocket(tickerName, "SubAdd");
};

const unsubscribeFromTickerOnWs = (tickerName) => {
  sendToWebSocket(tickerName, "SubRemove");
};

export const subscribeToTicker = (tickerName, cb) => {
  const subscribers = tickerHandlers.get(tickerName) || [];
  tickerHandlers.set(tickerName, [...subscribers, cb]);

  subscribeToTickerOnWs(tickerName);
};

export const unsubscribeFromTicker = (tickerName) => {
  tickerHandlers.delete(tickerName);

  unsubscribeFromTickerOnWs(tickerName);
};
