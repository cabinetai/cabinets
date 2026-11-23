// The wider list: about 100 large, heavily traded US stocks across every sector, so the
// setups are looked for, and their record is kept, beyond the dozen stocks a person lists.
// Chosen by hand in November 2026 from the largest companies of each sector. It is a fixed
// list, not a ranking: a company that is bought, renamed or shrinks stays until someone
// edits this file. A symbol the source no longer knows is skipped and named in status.json.

export const UNIVERSE = [
  // Technology
  "AAPL", "MSFT", "NVDA", "AVGO", "ORCL", "CRM", "ADBE", "CSCO", "IBM", "INTC", "AMD", "QCOM", "TXN",
  "AMAT", "MU", "NOW", "INTU", "PANW", "ANET", "LRCX", "PLTR", "CRWD",
  // Communication
  "GOOGL", "META", "NFLX", "DIS", "CMCSA", "TMUS", "VZ", "T",
  // Shops, cars, travel and restaurants
  "AMZN", "TSLA", "HD", "LOW", "MCD", "NKE", "SBUX", "BKNG", "TJX", "GM", "F", "UBER", "ABNB", "CMG",
  // Everyday goods
  "WMT", "COST", "PG", "KO", "PEP", "PM", "MDLZ", "TGT",
  // Health
  "LLY", "UNH", "JNJ", "ABBV", "MRK", "PFE", "TMO", "ABT", "AMGN", "GILD", "ISRG", "BMY", "CVS", "VRTX",
  // Banks, cards and brokers
  "JPM", "BAC", "WFC", "GS", "MS", "C", "AXP", "V", "MA", "BLK", "SCHW", "PYPL",
  // Industry and transport
  "GE", "CAT", "BA", "HON", "UPS", "RTX", "LMT", "DE", "UNP", "ETN",
  // Energy
  "XOM", "CVX", "COP", "SLB", "OXY",
  // Materials, power and property
  "LIN", "FCX", "NEM", "NEE", "SO", "AMT", "PLD",
];
