import type EnsResolverKeysJson from "uns/ens-resolver-keys.json";
import type UnsResolverKeysJson from "uns/resolver-keys.json";

export enum ExtensionOptions {
  InfuraAPI = "Infura API",
  IPFSNetwork = "Directly from IPFS network",
  CFIPFS = "CF ipfs",
}

export interface ExtensionOptionMessage {
  [key: string]: string;
}

export interface ExtensionURIMap {
  [key: string]: string;
}

export const ExtensionLabel: ExtensionOptionMessage = {
  [ExtensionOptions.InfuraAPI]: "Non-paranoid + fast response times",
  [ExtensionOptions.IPFSNetwork]: "Paranoid + fast response times",
  [ExtensionOptions.CFIPFS]: "Paranoid + slow response times",
};

export const ExtensionURIMap: ExtensionURIMap = {
  [ExtensionOptions.CFIPFS]: "https://{ipfs}.ipfs.cf-ipfs.com",
  [ExtensionOptions.InfuraAPI]: "https://{ipfs}.ipfs.infura-ipfs.io",
  [ExtensionOptions.IPFSNetwork]: "https://{ipfs}.ipfs.dweb.link",
};

export enum WalletState {
  Load,
  Onboard,
  Account,
}

export type Account = {
  id: string;
  address: string;
};

export type AccountAsset = {
  id: string;
  accountId: string;
  address: string;
  balance: {
    total: string;
    decimals: number;
  };
  blockchainAsset: {
    id: string;
    name: string;
    symbol: string;
    blockchain: {
      id: string;
      name: string;
      symbol: string;
    };
  };
};

export type TokenSymbol = "ETH" | "BTC" | "MATIC" | "SOL";

export enum TokenType {
  Native = "native",
  Erc20 = "erc20",
  Nft = "nft",
}

export type SerializedPriceHistory = {
  timestamp: Date;
  value: number;
};

export type SerializedFloorPrice = {
  marketPlaceName: string;
  marketPctChange24Hr?: number;
  history?: SerializedPriceHistory[];
  value: number;
  valueUsd: string;
  valueUsdAmt: number;
};

export type SerializedWalletNftCollection = {
  category?: string;
  contractAddresses: string[];
  collectionImageUrl?: string;
  description?: string;
  floorPrice?: SerializedFloorPrice[];
  latestAcquiredDate: Date;
  name: string;
  nftIds?: string[];
  ownedCount: number;
  totalOwners: number;
  totalSupply: number;
  totalValueUsd?: string;
  totalValueUsdAmt?: number;
};

export type SerializedWalletToken = {
  type: TokenType.Erc20 | TokenType.Native;
  address: string;
  symbol: string;
  gasCurrency: string;
  name: string;
  logoUrl?: string;
  balance?: string;
  balanceAmt?: number;
  value?: {
    marketUsd?: string;
    marketUsdAmt?: number;
    marketPctChange24Hr?: number;
    history?: SerializedPriceHistory[];
    walletUsd?: string;
    walletUsdAmt?: number;
  };
};

export type SerializedTx = {
  hash: string;
  block: string;
  from: {
    address: string;
    link: string;
    label?: string;
  };
  to: {
    address: string;
    link: string;
    label?: string;
  };
  type: TokenType;
  imageUrl?: string;
  value: number;
  gas: number;
  method: string;
  timestamp: Date;
  link: string;
  success: boolean;
  symbol?: string;
};

export type SerializedTxns = {
  data: SerializedTx[];
  cursor?: string;
};

export type SerializedWalletBalance = SerializedWalletToken & {
  firstTx?: Date;
  lastTx?: Date;
  stats?: {
    nfts?: string;
    collections?: string;
    transactions?: string;
    transfers?: string;
  };
  nfts?: SerializedWalletNftCollection[];
  txns?: SerializedTxns;
  tokens?: SerializedWalletToken[];
  blockchainScanUrl: string;
  totalValueUsd?: string;
  totalValueUsdAmt?: number;
  walletType?: string;
};

export type TokenEntry = {
  type: TokenType;
  symbol: string;
  name: string;
  ticker: string;
  value: number;
  tokenConversionUsd: number;
  balance: number;
  pctChange?: number;
  imageUrl?: string;
  history?: SerializedPriceHistory[];
  walletAddress: string;
  walletBlockChainLink: string;
  walletName: string;
  walletType?: string;
};

export enum AllInitialCurrenciesEnum {
  BTC = "BTC",
  ETH = "ETH",
  MATIC = "MATIC",
  SOL = "SOL",
}

export enum AdditionalCurrenciesEnum {
  ZIL = "ZIL",
  LTC = "LTC",
  XRP = "XRP",
  ETC = "ETC",
  EQL = "EQL",
  LINK = "LINK",
  USDC = "USDC",
  BAT = "BAT",
  REP = "REP",
  ZRX = "ZRX",
  DAI = "DAI",
  BCH = "BCH",
  XMR = "XMR",
  DASH = "DASH",
  NEO = "NEO",
  DOGE = "DOGE",
  ZEC = "ZEC",
  EOS = "EOS",
  XLM = "XLM",
  BNB = "BNB",
  BTG = "BTG",
  NANO = "NANO",
  WAVES = "WAVES",
  KMD = "KMD",
  AE = "AE",
  RSK = "RSK",
  WAN = "WAN",
  STRAT = "STRAT",
  UBQ = "UBQ",
  XTZ = "XTZ",
  MIOTA = "MIOTA",
  VET = "VET",
  QTUM = "QTUM",
  ICX = "ICX",
  DGB = "DGB",
  XZC = "XZC",
  BURST = "BURST",
  DCR = "DCR",
  XEM = "XEM",
  LSK = "LSK",
  ATOM = "ATOM",
  ONG = "ONG",
  ONT = "ONT",
  SMART = "SMART",
  TPAY = "TPAY",
  GRS = "GRS",
  BSV = "BSV",
  GAS = "GAS",
  TRX = "TRX",
  VTHO = "VTHO",
  BCD = "BCD",
  BTT = "BTT",
  KIN = "KIN",
  RVN = "RVN",
  ARK = "ARK",
  XVG = "XVG",
  ALGO = "ALGO",
  NEBL = "NEBL",
  BNTY = "BNTY",
  ONE = "ONE",
  SWTH = "SWTH",
  CRO = "CRO",
  TWT = "TWT",
  SIERRA = "SIERRA",
  VSYS = "VSYS",
  HIVE = "HIVE",
  HT = "HT",
  ENJ = "ENJ",
  YFI = "YFI",
  MTA = "MTA",
  COMP = "COMP",
  BAL = "BAL",
  AMPL = "AMPL",
  LEND = "AAVE",
  USDT = "USDT",
  FTM = "FTM",
  FUSE = "FUSE",
  TLOS = "TLOS",
  XDC = "XDC",
  AR = "AR",
  NIM = "NIM",
  CUSDT = "CUSDT",
  AVAX = "AVAX",
  DOT = "DOT",
  BUSD = "BUSD",
  SHIB = "SHIB",
  LUNA = "LUNA",
  CAKE = "CAKE",
  MANA = "MANA",
  EGLD = "EGLD",
  SAND = "SAND",
  WAXP = "WAXP",
  "1INCH" = "1INCH",
  THETA = "THETA",
  HNT = "HNT",
  SAFEMOON = "SAFEMOON",
  NEAR = "NEAR",
  FIL = "FIL",
  AXS = "AXS",
  AMP = "AMP",
  CELO = "CELO",
  KSM = "KSM",
  CSPR = "CSPR",
  UNI = "UNI",
  CEL = "CEL",
  ERG = "ERG",
  KAVA = "KAVA",
  LRC = "LRC",
  POLY = "POLY",
  TFUEL = "TFUEL",
  NEXO = "NEXO",
  FLOW = "FLOW",
  ICP = "ICP",
  TUSD = "TUSD",
  KLV = "KLV",
  BLOCKS = "BLOCKS",
  YLD = "YLD",
  OKT = "OKT",
  B2M = "B2M",
  DOG = "DOG",
  GALA = "GALA",
  MOBX = "MOBX",
  FAB = "FAB",
  FIRO = "FIRO",
  FET = "FET",
  BEAM = "BEAM",
  "0ZK" = "0ZK",
  SUI = "SUI",
  MOON = "MOON",
  SWEAT = "SWEAT",
  DESO = "DESO",
  FLR = "FLR",
  SGB = "SGB",
  POKT = "POKT",
  XLA = "XLA",
  KAI = "KAI",
  APT = "APT",
  GTH = "GTH",
  HI = "HI",
  MCONTENT = "MCONTENT",
  VERSE = "VERSE",
  ADA = "ADA",
  HBAR = "HBAR",
  BASE = "BASE",
}

export type CurrenciesType =
  | AllInitialCurrenciesEnum
  | AdditionalCurrenciesEnum;

export interface GetEstimateTransactionResponse {
  "@type": "unstoppabledomains.com/wallets.v1.TransactionEstimate";
  priority: string;
  status: "VALID" | "INSUFFICIENT_FUNDS";
  networkFee: {
    amount: string;
    asset: {
      "@type": string;
      id: string;
      address: string;
      balance: {
        total: string;
        decimals: number;
      };
      blockchainAsset: {
        "@type": string;
        id: string;
        name: string;
        symbol: string;
        blockchain: {
          id: string;
          name: string;
        };
      };
    };
  };
}

export type Immutable<T> = T extends ImmutablePrimitive
  ? T
  : T extends Array<infer U>
    ? ImmutableArray<U>
    : T extends Map<infer K, infer V>
      ? ImmutableMap<K, V>
      : T extends Set<infer M>
        ? ImmutableSet<M>
        : ImmutableObject<T>;
export type ImmutableArray<T> = ReadonlyArray<Immutable<T>>;
export type ImmutableMap<K, V> = ReadonlyMap<Immutable<K>, Immutable<V>>;
export type ImmutableObject<T> = {readonly [K in keyof T]: Immutable<T[K]>};
export type ImmutablePrimitive = undefined | null | boolean | string | number;

export type ImmutableSet<T> = ReadonlySet<Immutable<T>>;

export type DomainProfileVisibilityValues = {
  displayNamePublic: boolean;
  descriptionPublic: boolean;
  locationPublic: boolean;
  web2UrlPublic: boolean;
  phoneNumberPublic: boolean;
  imagePathPublic: boolean;
  coverPathPublic: boolean;
};

export enum DomainFieldTypes {
  CryptoVerifications = "cryptoVerifications",
  HumanityCheck = "humanityCheck",
  Messaging = "messaging",
  Profile = "profile",
  SocialAccounts = "socialAccounts",
  Records = "records",
  ReferralCode = "referralCode",
  ReferralTier = "referralTier",
  WebacyScore = "webacyScore",
  Market = "market",
  Portfolio = "portfolio",
  WalletBalances = "walletBalances",
}

export type SerializedDomainProfileAttributes = {
  // profile fields
  displayName?: string;
  description?: string;
  location?: string;
  imagePath?: string;
  imageType?: "default" | "onChain" | "offChain";
  coverPath?: string;
  web2Url?: string;
  publicDomainSellerEmail?: string;
  phoneNumber?: string;
  domainPurchased?: boolean;
  collectibleImage?: string;
  privateEmail?: string;

  // public toggles
  displayNamePublic?: boolean;
  descriptionPublic?: boolean;
  locationPublic?: boolean;
  imagePathPublic?: boolean;
  coverPathPublic?: boolean;
  web2UrlPublic?: boolean;

  // visibility toggles
  emailOnPublicDomainProfile?: boolean;
  tokenGalleryEnabled?: boolean;
  showDomainSuggestion?: boolean;
  showFeaturedCommunity?: boolean;
  showFeaturedPartner?: boolean;

  // UD blue status
  udBlue?: boolean;
};

export type SerializedSocialAttributes = {
  followingCount?: number;
  followerCount?: number;
};

export enum DomainProfileSocialMedia {
  Twitter = "twitter",
  Discord = "discord",
  YouTube = "youtube",
  Reddit = "reddit",
  Telegram = "telegram",
  Github = "github",
  Linkedin = "linkedin",
}

export enum DomainProfileSocialMediaAutoPopulated {
  Lens = "lens",
  Farcaster = "farcaster",
}

export type SerializedDomainSocialAccount = {
  location?: string;
  verified?: boolean;
  public?: boolean;
};

export type SerializedDomainCryptoVerification = {
  id: number;
  symbol: string;
  address: string;
  plaintextMessage: string;
  signedMessage: string;
  type: string;
};

export enum AffiliateTier {
  EarlyAdopter = "early-adopter",
  FirstOrder25 = "first-order-25",
  FlatForty = "flat-forty",
  FlatFortyFive = "flat-forty-five",
  FlatFifty = "flat-fifty",
  LastClick10 = "last-click-10",
  LastClick20 = "last-click-20",
  LastClick25 = "last-click-25",
  LastClick30 = "last-click-30",
  LastClick35 = "last-click-35",
  LastClick40 = "last-click-40",
  LastClick50 = "last-click-50",
  MetaAffiliate = "meta-affiliate",
  ReferAFriend = "refer-a-friend",
  StandardJuly2019 = "standard-july-2019",
  ThirtyJuly2019 = "thirty-july-2019",
  TwentyFiveJuly2019 = "twenty-five-july-2019",
  ThirtyFiveApril2022 = "thirty-five-april-2022",
  ThirtyFebruary2022 = "thirty-february-2022",
}

export interface WebacyRiskScore {
  count: number;
  medium: number;
  high: number;
  overallRisk: number;
  issues: WebacyIssue[];
}

export interface WebacyIssue {
  score: number;
  tags: WebacyTag[];
  categories: WebacyCategories;
}

export interface WebacyTag {
  name: string;
  description: string;
  type: string;
  severity: number;
  key: string;
}

export interface WebacyCategories {
  wallet_characteristics: WebacyWalletCharacteristics;
}

export interface WebacyWalletCharacteristics {
  key: string;
  name: string;
  description: string;
  tags: WebacyTags;
}

export interface WebacyTags {
  insufficient_wallet_age: boolean;
  insufficient_wallet_balance: boolean;
  insufficient_wallet_transactions: boolean;
}

export type MessagingAttributes = {
  disabled: boolean;
  resetRules?: boolean;
  thirdPartyMessagingEnabled: boolean;
  thirdPartyMessagingConfigType: string;
};

export type SerializedDomainMarket = {
  primary?: {
    type: "mint" | "purchase" | "distribution";
    cost?: number;
    date?: Date;
    payment?: {
      method?: string;
      promoCredits?: number;
      collected?: number;
    };
  };
  secondary?: SerializedSecondarySale[];
};

export type SerializedSecondarySale = {
  date: Date;
  txHash?: string;
  marketPlace?: string;
  payment?: {
    symbol: string;
    valueUsd: number;
    valueNative: number;
  };
};

export type SerializedPortfolioSummary = {
  wallet: {
    address: string;
    primaryDomain?: string;
    domainCount: number;
    value?: string;
    valueAmt?: number;
  };
  account: {
    domainCount: number;
    spend?: {
      collected: number;
      storeCredit: number;
      promoCredit: number;
    };
    value?: string;
    valueAmt?: number;
  };
};

export type SerializedPublicDomainProfileData = {
  profile?: SerializedDomainProfileAttributes;
  social?: SerializedSocialAttributes;
  socialAccounts?: Record<
    DomainProfileSocialMedia | DomainProfileSocialMediaAutoPopulated,
    SerializedDomainSocialAccount
  >;
  cryptoVerifications?: SerializedDomainCryptoVerification[];
  records?: Record<string, string>;
  metadata?: Record<string, string | boolean>;
  referralCode?: string;
  referralTier?: AffiliateTier;
  walletBalances?: SerializedWalletBalance[];
  webacy?: WebacyRiskScore;
  messaging?: MessagingAttributes;
  market?: SerializedDomainMarket;
  portfolio?: SerializedPortfolioSummary;
};

export type UnsResolverKey = keyof typeof UnsResolverKeysJson.keys;
export type EnsResolverKey = keyof typeof EnsResolverKeysJson.keys;

export type ResolverKeyName = UnsResolverKey | EnsResolverKey;

export type ResolverKeySymbol = string | null;
export type ResolverKeyValidationRegex = string | null;

export type ResolverKey = {
  deprecated: boolean;
  symbol: ResolverKeySymbol;
  validationRegex: ResolverKeyValidationRegex;
};

export type ResolverKeys = {
  ResolverKeys: ResolverKeyName[];
  ResolverKey: Record<ResolverKeyName, ResolverKey>;
};

const TICKER_REGEX = "[0-9A-Za-z*$-+]+";

export const ADDRESS_REGEX = new RegExp(`crypto\\.${TICKER_REGEX}\\.address`);
export const MULTI_CHAIN_ADDRESS_REGEX = new RegExp(
  `crypto\\.${TICKER_REGEX}\\.version\\.${TICKER_REGEX}\\.address`,
);

export const MANAGEABLE_DOMAIN_LABEL = /^[a-z\d-]{1,253}$/;
export const WEB2_DOMAIN_SUFFIXES = ["com"];
export const EXTERNAL_DOMAIN_SUFFIXES = ["eth"];

export enum DomainSuffixes {
  Crypto = "crypto",
  Wallet = "wallet",
  Blockchain = "blockchain",
  Hi = "hi",
  Klever = "klever",
  Bitcoin = "bitcoin",
  X = "x",
  Number888 = "888",
  Nft = "nft",
  Dao = "dao",
  Polygon = "polygon",
  Kresus = "kresus",
  Anime = "anime",
  Manga = "manga",
  Binanceus = "binanceus",
  Go = "go",
  Zil = "zil",
  Ens = "eth",
  EnsReverse = "reverse",
}

export type DomainDescription = {
  name: string;
  label: string;
  extension: DomainSuffixes;
  sld: string | null;
};

export interface AddressResolution {
  address: string;
  name?: string;
  avatarUrl?: string;
  imageType?: "onChain" | "offChain" | "default";
}

export type SerializedDomainListData = {
  data: Array<{
    domain: string;
  }>;
  meta: {
    total_count: number;
    pagination: {
      cursor: string;
      take: number;
    };
  };
  address: string;
};

export type BaseBlockchainConfig = {
  CHAIN_ID: number;
  NETWORK_NAME: string;
  JSON_RPC_API_URL: string;
  BLOCK_EXPLORER_NAME: string;
  BLOCK_EXPLORER_BASE_URL: string;
  BLOCK_EXPLORER_TX_URL: string;
  DISABLE_CONTRACTS_CACHE: boolean;
};

export type ZilliqaBlockchainConfig = BaseBlockchainConfig & {
  CHAIN_ID: 333 | 1;
  NETWORK_NAME: "testnet" | "mainnet";
  ZILLIQA_VERSION: number;
  ZNS_REGISTRY_ADDRESS: string;
  BLOCK_EXPLORER_TX_URL: "";
};

export interface Operation {
  "@type": string;
  id: string;
  accountId: string;
  assetId: string;
  lastUpdatedTimestamp: number;
  status: string;
  type: string;
}

export interface GetOperationListResponse {
  "@type": string;
  items: Operation[];
}

export enum OperationStatus {
  QUEUED = "QUEUED",
  SIGNATURE_REQUIRED = "SIGNATURE_REQUIRED",
}

export enum OperationStatusType {
  QUEUED = "QUEUED",
  PROCESSING = "PROCESSING",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
  CANCELLED = "CANCELLED",
  SIGNATURE_REQUIRED = "SIGNATURE_REQUIRED",
  AWAITING_UPDATES = "AWAITING_UPDATES",
}

export interface Parameters {
  message: string;
}

export interface Result {
  signature: string;
}

export interface GetOperationStatusResponse {
  "@type": string;
  id: string;
  lastUpdatedTimestamp: number;
  status: OperationStatusType;
  type: string;
  parameters: Parameters;
  result?: Result;
  transaction?: {
    id?: string;
    externalVendorTransactionId?: string;
  };
}

export interface GetOperationResponse {
  "@type": string;
  operation: Operation;
}

export type DeepPartial<T> = {
  [P in keyof T]?: DeepPartial<T[P]>;
};
