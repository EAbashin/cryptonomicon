const BASE_URL = "https://min-api.cryptocompare.com/data";
const API_KEY =
  "e719b50a13acf8dae93a31bd8bd9d8b25df4b1b80d637bb76a19882d144f7399";
const tickerHandlers = new Map();
const AGGREGATE_INDEX = "5";
const INVALID_SUB_MESSAGE = "INVALID_SUB";
let btcPrice = 0;

const socket = new WebSocket(
  `wss://streamer.cryptocompare.com/v2?api_key=${API_KEY}`
);

const sendToWebSocket = (fromTickerName, toTickerName, action) => {
  const message = JSON.stringify({
    action,
    subs: [`5~CCCAGG~${fromTickerName}~${toTickerName}`],
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
  sendToWebSocket(tickerName, "USD", "SubAdd");
};

const unsubscribeFromTickerOnWs = (tickerName) => {
  const handlers = tickerHandlers.get(tickerName);
  if (handlers?.isCrossCours) {
    sendToWebSocket(tickerName, "BTC", "SubRemove");
  }
  sendToWebSocket(tickerName, "USD", "SubRemove");
};

export const subscribeToTicker = (tickerName, cb) => {
  const subscribers = tickerHandlers.get(tickerName)?.handlers || [];
  tickerHandlers.set(tickerName, { handlers: [...subscribers, cb] });

  subscribeToTickerOnWs(tickerName);
};

export const unsubscribeFromTicker = (tickerName) => {
  tickerHandlers.delete(tickerName);

  unsubscribeFromTickerOnWs(tickerName);
};

const errorMessageHandler = (parameter) => {
  const tickerName = parameter.split("~")[2];

  const tickerValue = tickerHandlers.get(tickerName);
  if (tickerValue?.isCrossCours) {
    return;
  }

  const hasBtcSubscribe = tickerHandlers.has("BTC");
  if (!hasBtcSubscribe) {
    sendToWebSocket("BTC", "USD", "SubAdd");
  }

  sendToWebSocket(tickerName, "BTC", "SubAdd");

  const handlers = tickerHandlers.get(tickerName)?.handlers || [];
  tickerHandlers.set(tickerName, { handlers, isCrossCours: true });
};

const socketMessageHandler = (e) => {
  const {
    TYPE: type,
    FROMSYMBOL: tickerName,
    PRICE: newPrice,
    PARAMETER: parameter,
    MESSAGE: message,
  } = JSON.parse(e.data);

  if (type === AGGREGATE_INDEX) {
    const tickerValue = tickerHandlers.get(tickerName);
    const handlers = tickerValue?.handlers ?? [];
    const isCrossCours = tickerValue?.isCrossCours;
    let finalPrice = newPrice;
    if (isCrossCours) {
      finalPrice *= btcPrice;
    }
    handlers.forEach((fn) => fn(finalPrice));

    if (tickerName === "BTC") {
      btcPrice = newPrice;
    }
  }

  if (message === INVALID_SUB_MESSAGE) {
    errorMessageHandler(parameter);
  }
};

socket.addEventListener("message", socketMessageHandler);

export const closeSocket = () => {
  socket.removeEventListener("message", socketMessageHandler);
  socket.close();
};

export const getCoinList = () =>
  fetch(`${BASE_URL}/top/mktcapfull?limit=100&tsym=USD`).then((r) => r.json());
