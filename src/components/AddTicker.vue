<template>
  <section>
    <div class="flex">
      <div class="max-w-xs">
        <label class="block text-sm font-medium text-gray-700" for="wallet">
          Тикер
        </label>
        <div class="mt-1 relative rounded-md shadow-md">
          <input
            class="block w-full pr-10 border-gray-300 text-gray-900 focus:outline-none focus:ring-gray-500 focus:border-gray-500 sm:text-sm rounded-md"
            id="wallet"
            placeholder="Например DOGE"
            type="text"
            name="wallet"
            v-model="ticker"
            @keydown.enter="add()"
          />
        </div>
        <div class="flex bg-white p-1 rounded-md shadow-md flex-wrap">
          <span
            v-for="coin in foundCoinList"
            :key="coin?.CoinInfo?.Name"
            class="inline-flex items-center px-2 m-1 rounded-md text-xs font-medium bg-gray-300 text-gray-800 cursor-pointer"
            @click="add(coin?.CoinInfo?.Name)"
          >
            {{ coin?.CoinInfo?.Name }}
          </span>
        </div>
        <div v-if="hasAdded" class="text-sm text-red-600">
          Такой тикер уже добавлен
        </div>
        <div v-if="wrongTicker" class="text-sm text-red-600">
          Тикер не найден
        </div>
      </div>
    </div>
  </section>
</template>

<script>
export default {
  name: "AddTicker",

  props: {
    coinList: {
      type: Array,
      default: () => [],
      require: true,
    },

    tickers: {
      type: Array,
      default: () => [],
      require: true,
    },
  },

  emits: {
    "add-ticker": (value) => typeof value === "string" && value.length > 0,
  },

  data() {
    return {
      ticker: "",
    };
  },

  computed: {
    hasAdded() {
      if (!this.tickers.length) {
        return false;
      }
      return this.tickers.some(
        (coin) => coin?.name?.toLowerCase() === this.ticker.toLowerCase()
      );
    },

    wrongTicker() {
      return this.ticker.length && !this.foundCoinList.length && !this.hasAdded;
    },

    foundCoinList() {
      const ticker = this.ticker.toLowerCase();
      let indexSymbol = 0;
      let indexFullName = 0;
      const result = [];

      while (indexFullName <= this.coinList?.length && result.length < 4) {
        if (indexSymbol <= this.coinList?.length) {
          const coin = this.coinList[indexSymbol];
          const isMatched =
            coin?.CoinInfo?.Name?.toLowerCase().includes(ticker);
          const isAdded = this.tickers.some(
            (c) => c?.name.toLowerCase() === coin?.CoinInfo?.Name.toLowerCase()
          );
          if (isMatched && !isAdded) {
            result.push(coin);
          }
          indexSymbol++;
        } else {
          const coin = this.coinList[indexFullName];
          coin?.CoinInfo?.FullName?.toLowerCase().includes(ticker) &&
            result.push(coin);
          indexFullName++;
        }
      }
      return result;
    },
  },

  methods: {
    add(tickerName = this.ticker) {
      if (this.hasAdded || this.wrongTicker) {
        return;
      }

      this.$emit("add-ticker", tickerName.toUpperCase());

      this.ticker = "";
    },
  },
};
</script>
