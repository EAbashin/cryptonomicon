<template>
  <div class="container mx-auto flex flex-col items-center bg-gray-100 p-4">
    <!--Loader-->
    <div>
      <!--    <div -->
      <!--      class="fixed w-100 h-100 opacity-80 bg-purple-800 inset-0 z-50 flex items-center justify-center"-->
      <!--    >-->
      <!--      <svg-->
      <!--        class="animate-spin -ml-1 mr-3 h-12 w-12 text-white"-->
      <!--        xmlns="http://www.w3.org/2000/svg"-->
      <!--        fill="none"-->
      <!--        viewBox="0 0 24 24"-->
      <!--      >-->
      <!--        <circle-->
      <!--          class="opacity-25"-->
      <!--          cx="12"-->
      <!--          cy="12"-->
      <!--          r="10"-->
      <!--          stroke="currentColor"-->
      <!--          stroke-width="4"-->
      <!--        ></circle>-->
      <!--        <path-->
      <!--          class="opacity-75"-->
      <!--          fill="currentColor"-->
      <!--          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"-->
      <!--        ></path>-->
      <!--      </svg>-->
      <!--    </div>-->
    </div>

    <!--Main block-->
    <div class="container">
      <add-ticker :tickers="tickers" :coin-list="coinList" @add-ticker="add" />

      <hr class="w-full border-t border-gray-600 my-4" />

      <!-- Блок с пагинацией и фильтрацией -->
      <div class="flex content-center">
        <div class="align-middle">
          <button
            class="my-4 ml-2 inline-flex items-center py-2 px-4 border border-transparent shadow-sm text-sm leading-4 font-medium rounded-full text-white bg-gray-600 hover:bg-gray-700 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            @click="page -= 1"
            :disabled="page <= 1"
          >
            &lt;
          </button>
          <button
            class="my-4 ml-2 inline-flex items-center py-2 px-4 border border-transparent shadow-sm text-sm leading-4 font-medium rounded-full text-white bg-gray-600 hover:bg-gray-700 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            @click="page += 1"
            :disabled="!hasNextPage"
          >
            >
          </button>
        </div>
        <div class="align-middle ml-4">
          <label class="text-sm font-medium text-gray-700" for="filter">
            Фильтр:
          </label>
          <input
            class="pr-10 border-gray-300 text-gray-900 focus:outline-none focus:ring-gray-500 focus:border-gray-500 sm:text-sm rounded-md w-full"
            id="filter"
            placeholder="Фильтр"
            type="search"
            name="filter"
            v-model="filter"
          />
        </div>
      </div>

      <hr class="w-full border-t border-gray-600 my-4" />

      <!-- Карточки с тикером и ценой -->
      <template v-if="tickers.length">
        <dl class="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-3">
          <div
            v-for="t in currentPageTickers"
            :key="t.name"
            @click="select(t)"
            class="overflow-hidden shadow rounded-lg border-purple-800 border-solid cursor-pointer"
            :class="{
              'border-4': selectedTicker === t,
              'bg-white': t?.price !== 0,
              'bg-red-200': t?.price === 0,
            }"
          >
            <div class="px-4 py-5 sm:p-6 text-center">
              <dt class="text-sm font-medium text-gray-500 truncate">
                {{ t.name }} - USD
              </dt>
              <dd class="mt-1 text-3xl font-semibold text-gray-900">
                {{ formatPrice(t?.price) }}
              </dd>
            </div>
            <div class="w-full border-t border-gray-200" />
            <button
              @click.stop="del(t.name)"
              class="flex items-center justify-center font-medium w-full bg-gray-100 px-4 py-4 sm:px-6 text-md text-gray-500 hover:text-gray-600 hover:bg-gray-200 hover:opacity-20 transition-all focus:outline-none"
            >
              <svg
                class="h-5 w-5"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="#718096"
                aria-hidden="true"
              >
                <path
                  fill-rule="evenodd"
                  d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                  clip-rule="evenodd"
                />
              </svg>
              Удалить
            </button>
          </div>
        </dl>
        <hr class="w-full border-t border-gray-600 my-4" />
      </template>

      <!-- Карточка с графиком -->
      <graph-block
        v-if="selectedTicker"
        class="relative"
        :ticker-name="selectedTicker?.name"
        :graph="graph"
        @close-graph="selectedTicker = null"
        @set-max-graph-elements="setMaxGraphElements"
      />
    </div>
  </div>
</template>

<script>
import {
  getCoinList,
  subscribeToTicker,
  unsubscribeFromTicker,
  closeSocket,
} from "./api";
import AddTicker from "./components/AddTicker.vue";
import GraphBlock from "./components/GraphBlock.vue";

export default {
  name: "App",

  components: {
    AddTicker,
    GraphBlock,
  },

  data() {
    return {
      filter: "",
      tickers: [],
      selectedTicker: null,
      page: 1,
      graph: [],
      coinList: null,
      maxGraphElements: 10,
    };
  },

  computed: {
    filteredTickers() {
      return this.tickers.filter((ticker) =>
        ticker.name.toLowerCase().includes(this.filter.toLowerCase())
      );
    },

    currentPageTickers() {
      const start = (this.page - 1) * 6;
      const end = this.page * 6;
      return this.filteredTickers.slice(start, end);
    },

    hasNextPage() {
      return this.filteredTickers.length > this.page * 6;
    },

    pageStateOptions() {
      return {
        filter: this.filter,
        page: this.page,
      };
    },
  },

  methods: {
    add(tickerName) {
      const currentTicker = {
        name: tickerName,
        price: 0,
        graph: [],
      };

      this.tickers = [...this.tickers, currentTicker];

      subscribeToTicker(currentTicker.name, (price) =>
        this.updateTicker(currentTicker.name, price)
      );

      this.filter = "";
    },

    del(tickerName) {
      this.tickers = this.tickers.filter(
        (ticker) => ticker.name !== tickerName
      );

      unsubscribeFromTicker(tickerName);

      if (this.selectedTicker?.name === tickerName) {
        this.selectedTicker = null;
      }
    },

    select(ticker) {
      if (this.selectedTicker !== ticker) {
        this.selectedTicker = ticker;
      }
    },

    async getCoinList() {
      const data = await getCoinList();
      this.coinList = Object.values(data.Data);
    },

    updateTicker(tickerName, price) {
      const currentTicker = this.tickers.find(
        (ticker) => ticker.name === tickerName
      );

      if (currentTicker) {
        currentTicker.price = price;
      }

      if (this.selectedTicker?.name === currentTicker?.name) {
        this.graph = [...this.graph, price];

        if (this.graph.length > this.maxGraphElements) {
          this.graph = this.graph.slice(this.maxGraphElements * -1);
        }
      }
    },

    setMaxGraphElements(value) {
      this.maxGraphElements = value;
    },

    formatPrice(price) {
      if (!price) {
        return "-";
      }
      return (Math.round(price * 100) / 100).toFixed(2);
    },
  },

  async mounted() {
    await this.getCoinList();

    const windowData = Object.fromEntries(
      new URL(window.location).searchParams.entries()
    );

    if (windowData.filter) {
      this.filter = windowData.filter;
    }

    if (windowData.page) {
      this.page = +windowData.page;
    }

    const tickersData = localStorage.getItem("cryptonomicon-list");
    if (tickersData) {
      this.tickers = JSON.parse(tickersData);
      this.tickers.forEach((ticker) => {
        subscribeToTicker(ticker.name, (price) =>
          this.updateTicker(ticker.name, price)
        );
      });
    }
  },

  beforeUnmount() {
    closeSocket();
  },

  watch: {
    tickers() {
      localStorage.setItem("cryptonomicon-list", JSON.stringify(this.tickers));
    },

    selectedTicker() {
      this.graph = [];
    },

    pageStateOptions(value) {
      window.history.pushState(
        null,
        document.title,
        `${window.location.pathname}?filter=${value.filter}&page=${value.page}`
      );
    },

    currentPageTickers() {
      if (this.currentPageTickers.length === 0 && this.page > 1) {
        this.page -= 1;
      }
    },
  },
};
</script>
