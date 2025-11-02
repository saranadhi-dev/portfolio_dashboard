interface PortfolioRow {
  Particulars: string;
  "Purchase Price"?: number;
  Qty?: number;
  Investment?: number;
  "Portfolio (%)"?: number;
  "NSE/BSE"?: string;
  CMP?: number;
  "Present value"?: number;
  "Gain/Loss"?: number;
  "P/E (TTM)"?: number;
  "Latest Earnings"?: string;
}

interface SectorData {
  sector_name: string;
  investment: number;
  portfolio: number;
  present_value: number;
  gain_loss: number;
  gain_loss_percent: number;
}


type Currency = "INR" | "USD";