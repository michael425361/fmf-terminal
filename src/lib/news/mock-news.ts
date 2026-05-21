import type { NewsArticle, NewsCategory } from "./types";

export const MOCK_NEWS: NewsArticle[] = [
  {
    id: "us-1",
    category: "us",
    title: {
      en: "Fed minutes signal patience on rate cuts as inflation cools gradually",
      zh: "美联储纪要暗示通胀缓慢降温，对降息保持耐心",
    },
    source: { en: "Bloomberg", zh: "彭博" },
    time: "12m ago",
    summary: {
      en: "Officials debated the timing of policy easing while noting labor market resilience and sticky services inflation.",
      zh: "官员讨论政策宽松时机，同时指出劳动力市场韧性与服务业通胀粘性。",
    },
    tag: { en: "Macro", zh: "宏观" },
  },
  {
    id: "us-2",
    category: "us",
    title: {
      en: "NVIDIA extends AI rally as hyperscaler capex guides stay elevated",
      zh: "英伟达延续AI涨势，云巨头资本开支指引维持高位",
    },
    source: { en: "Reuters", zh: "路透" },
    time: "28m ago",
    summary: {
      en: "Semiconductor peers tracked gains after management highlighted strong data-center demand through year-end.",
      zh: "管理层强调年底前列强的数据中心需求，半导体同业跟涨。",
    },
    tag: { en: "Tech", zh: "科技" },
  },
  {
    id: "us-3",
    category: "us",
    title: {
      en: "S&P 500 futures steady ahead of CPI; Treasury yields dip",
      zh: "标普500期货持稳等待CPI；美债收益率回落",
    },
    source: { en: "CNBC", zh: "CNBC" },
    time: "45m ago",
    summary: {
      en: "Index futures held a narrow range as traders positioned for core inflation near 3.0% year over year.",
      zh: "指数期货窄幅波动，交易员押注核心通胀同比接近3.0%。",
    },
    tag: { en: "Markets", zh: "市场" },
  },
  {
    id: "us-4",
    category: "us",
    title: {
      en: "Oil slips on demand concerns despite Middle East supply risks",
      zh: "中东供应风险仍存，油价因需求担忧走低",
    },
    source: { en: "WSJ", zh: "华尔街日报" },
    time: "1h ago",
    summary: {
      en: "WTI fell below $79 as OECD demand revisions overshadowed geopolitical premium in crude markets.",
      zh: "经合组织需求预测下调盖过地缘溢价，WTI跌破79美元。",
    },
    tag: { en: "Energy", zh: "能源" },
  },
  {
    id: "us-5",
    category: "us",
    title: {
      en: "Apple supplier checks point to stable iPhone build plans for Q4",
      zh: "苹果供应链调查显示四季度iPhone排产稳定",
    },
    source: { en: "Nikkei", zh: "日经" },
    time: "2h ago",
    summary: {
      en: "Channel checks indicated modest component orders with focus on Pro mix and services attach rates.",
      zh: "渠道调研显示零部件订单温和，侧重Pro机型占比与服务绑定。",
    },
    tag: { en: "Equities", zh: "股票" },
  },
  {
    id: "cn-1",
    category: "cn",
    title: {
      en: "ChiNext leads A-shares higher on liquidity support hopes",
      zh: "创业板指领涨A股，市场对流动性支持预期升温",
    },
    source: { en: "Caixin", zh: "财新" },
    time: "18m ago",
    summary: {
      en: "Growth names outperformed as northbound flows turned positive and margin financing ticked up.",
      zh: "北向资金转正、融资余额回升，成长板块表现领先。",
    },
    tag: { en: "A-Share", zh: "A股" },
  },
  {
    id: "cn-2",
    category: "cn",
    title: {
      en: "PBOC conducts medium-term lending operation to steady funding costs",
      zh: "央行开展中期借贷操作，稳定资金利率",
    },
    source: { en: "Xinhua", zh: "新华社" },
    time: "35m ago",
    summary: {
      en: "The operation underscored a balanced stance between growth support and FX stability near key levels.",
      zh: "操作体现稳增长与汇率在关键关口企稳之间的平衡。",
    },
    tag: { en: "Policy", zh: "政策" },
  },
  {
    id: "cn-3",
    category: "cn",
    title: {
      en: "CATL suppliers rally on solid EV battery shipment data",
      zh: "宁德时代供应链走强，动力电池出货数据稳健",
    },
    source: { en: "Yicai", zh: "第一财经" },
    time: "52m ago",
    summary: {
      en: "Upstream lithium processors gained after monthly shipment figures beat street expectations.",
      zh: "月度出货数据超市场预期，上游锂加工商走强。",
    },
    tag: { en: "New Energy", zh: "新能源" },
  },
  {
    id: "cn-4",
    category: "cn",
    title: {
      en: "Shanghai composite holds 3,000 as financials provide support",
      zh: "上证综指守3000点，金融板块护盘",
    },
    source: { en: "Securities Times", zh: "证券时报" },
    time: "1h ago",
    summary: {
      en: "Large banks steadied the index while property developers remained volatile on policy headlines.",
      zh: "大型银行稳住指数，地产股在政策消息下波动加剧。",
    },
    tag: { en: "Markets", zh: "市场" },
  },
  {
    id: "cn-5",
    category: "cn",
    title: {
      en: "Kweichow Moutai trades firm as premium liquor demand stabilizes",
      zh: "贵州茅台走势坚挺，高端白酒需求企稳",
    },
    source: { en: "21st Century", zh: "21世纪经济报道" },
    time: "2h ago",
    summary: {
      en: "Consumer staples held up in defensive rotation with channel inventory normalizing post holiday.",
      zh: "消费防御轮动中表现稳健，渠道库存节后回归正常。",
    },
    tag: { en: "Consumer", zh: "消费" },
  },
  {
    id: "gl-1",
    category: "global",
    title: {
      en: "ECB holds rates; Lagarde cites divergent inflation across euro area",
      zh: "欧央行维持利率不变，拉加德称欧元区通胀分化",
    },
    source: { en: "FT", zh: "金融时报" },
    time: "22m ago",
    summary: {
      en: "Policy makers emphasized data dependence with services CPI still above target in core economies.",
      zh: "政策制定者强调数据依赖，核心经济体服务业CPI仍高于目标。",
    },
    tag: { en: "FX", zh: "外汇" },
  },
  {
    id: "gl-2",
    category: "global",
    title: {
      en: "Bitcoin holds above $66K as ETF inflows offset miner selling",
      zh: "比特币守在6.6万美元上方，ETF流入抵消矿工抛售",
    },
    source: { en: "CoinDesk", zh: "CoinDesk" },
    time: "40m ago",
    summary: {
      en: "Crypto breadth improved with ETH tracking BTC as institutional flows remained constructive.",
      zh: "加密货币普涨，以太坊跟随比特币，机构资金流仍偏积极。",
    },
    tag: { en: "Crypto", zh: "加密" },
  },
  {
    id: "gl-3",
    category: "global",
    title: {
      en: "Hang Seng rebounds on China stimulus chatter; USD/JPY eases",
      zh: "恒生指数反弹，传中国刺激措施；美元兑日元回落",
    },
    source: { en: "SCMP", zh: "南华早报" },
    time: "1h ago",
    summary: {
      en: "Regional equities caught a bid while the yen strengthened on verbal intervention from Tokyo.",
      zh: "区域股市受提振，东京方面口头干预下日元走强。",
    },
    tag: { en: "Asia", zh: "亚洲" },
  },
  {
    id: "gl-4",
    category: "global",
    title: {
      en: "Gold steady near $2,350 as real yields and dollar soften",
      zh: "黄金在2350美元附近持稳，实际利率与美元走弱",
    },
    source: { en: "Kitco", zh: "Kitco" },
    time: "1h ago",
    summary: {
      en: "Bullion tracked lower U.S. yields with safe-haven demand balanced against profit taking.",
      zh: "贵金属跟随美债收益率下行，避险需求与获利回吐相互制衡。",
    },
    tag: { en: "Commodities", zh: "大宗" },
  },
  {
    id: "gl-5",
    category: "global",
    title: {
      en: "OPEC+ compliance in focus ahead of ministerial monitoring meeting",
      zh: "部长级监督会议前夕，市场聚焦OPEC+执行率",
    },
    source: { en: "Energy Intel", zh: "Energy Intel" },
    time: "3h ago",
    summary: {
      en: "Delegates discussed rollover of voluntary cuts with secondary sources showing mixed adherence.",
      zh: "代表讨论自愿减产延期，二手数据显示执行率参差不齐。",
    },
    tag: { en: "Energy", zh: "能源" },
  },
];

export function getNewsByCategory(category: NewsCategory): NewsArticle[] {
  return MOCK_NEWS.filter((a) => a.category === category);
}
