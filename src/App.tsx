import { useEffect, useState, useMemo, useCallback } from "react";
import "./App.css";
import * as xlsx from "xlsx";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FaMoneyBillWave, FaChartPie, FaArrowUp, FaArrowDown, FaSyncAlt, FaIndustry, FaExchangeAlt, FaTimes, } from "react-icons/fa";
import { endpoint } from "./api";
import { decimalFixed, items_per_page, locale, USD_TO_INR } from "./constants";

function App() {

  const [data, setData] = useState<PortfolioRow[]>([]);
  const [sectors, setSectors] = useState<SectorData[]>([]);
  // const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [lastUpdateTime, setLastUpdateTime] = useState<Date>(new Date());

  const [totalInvestment, setTotalInvestment] = useState(0);
  const [totalPresentValue, setTotalPresentValue] = useState(0);
  const [totalGainLoss, setTotalGainLoss] = useState(0);

  const [sortInvOrder, setSortInvOrder] = useState<"asc" | "desc" | null>(null);
  const [qtySortOrder, setQtySortOrder] = useState<"asc" | "desc" | null>(null);
  const [refreshInterval, setRefreshInterval] = useState<number>(30000);
  const [reloading, setReloading] = useState<boolean>(false)
  const [currency, setCurrency] = useState<Currency>("INR");
  const [showSectorModal, setShowSectorModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const loadExcel = useCallback(async () => {
    fetch("/67E4F600_copy.xlsx")
      .then((res) => res.arrayBuffer())
      .then((ab) => {
        const workbook = xlsx.read(ab, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = xlsx.utils.sheet_to_json(worksheet);

        const totalLength = jsonData.length
        const headers: any = jsonData[0]
        const headerValues = Object.values(headers)
        const headersLength = Object.values(headers).length

        const json: PortfolioRow[] = [];
        const sectors: SectorData[] = [];

        let totalInv = 0;
        let totalPresentValue = 0;

        for (var i = 1; i < totalLength; i++) {
          var item: any = jsonData[i]
          var itemValues = Object.values(item)
          const rowObj: any = {};

          if (item["__EMPTY"]) {
            for (var j = 0; j < headersLength; j++) {
              var headerItem: any = headerValues[j]
              // console.log("key", headerItem, "value", itemValues[j])
              rowObj[headerItem] = itemValues[j]
            }
          }
          if (item["__EMPTY"]) {

            const inv = parseFloat(rowObj["Investment"]) || 0;
            const cmp = parseFloat(rowObj["CMP"]) || 0;
            const qty = parseFloat(rowObj["Qty"]) || 0;
            const presentValue = cmp * qty;

            rowObj["Present value"] = presentValue;
            rowObj["Gain/Loss"] = presentValue - inv;
            totalInv += inv;
            totalPresentValue += presentValue;
          }
          else if (!item["__EMPTY"] && item["__EMPTY_1"]) {
            const sectorData = {
              sector_name: item["__EMPTY_1"],
              investment: item["__EMPTY_4"],
              portfolio: item["__EMPTY_5"],
              present_value: item["__EMPTY_8"],
              gain_loss: item["__EMPTY_9"],
              gain_loss_percent: item["__EMPTY_10"],
            };

            sectors.push(sectorData)
          }
          json.push(rowObj)
        }
        setTotalInvestment(totalInv);
        setTotalPresentValue(totalPresentValue);
        setTotalGainLoss(totalPresentValue - totalInv);
        setData(json);
        setSectors(sectors)

        showSuccessToast("Date Fetched Successfully")
      })
      .catch((e) => {
        showFailedToast("Date Fetched Successfully")
      })
  }, []);


  const fetchUpdates = useCallback(async () => {
    if (!data.length) return;
    console.log("Fetching Update...");
    setReloading(true)
    const updatedData = await Promise.all(
      data.map(async (row) => {
        try {
          if (row["NSE/BSE"]) {
            const symbol =row["NSE/BSE"];
            const res = await fetch(`${endpoint}/${symbol}`);
            const wrapper = await res.json();
            const livePrice = parseFloat(wrapper["livePrice"]);
            const qty = row.Qty || 0;
            const presentValue = livePrice * qty;
            const inv = row.Investment || 0;
            return {
              ...row,
              CMP: livePrice,
              "Present value": presentValue,
              "Gain/Loss": presentValue - inv,
            };
          }
          return row;
        } catch (e) {
          console.error("Live price fetch failed", row["NSE/BSE"], e);
          // showInfoToast("Live price fetch failed")
          return row;
        }
      })
    );

    setData(updatedData);
    setLastUpdateTime(new Date());
    const totalInv = updatedData.reduce((sum, r) => sum + (r.Investment || 0), 0);

    const totalPresent = updatedData.reduce((sum, r) => sum + (r["Present value"] || 0), 0);
    setTotalInvestment(totalInv);
    setTotalPresentValue(totalPresent);
    setTotalGainLoss(totalPresent - totalInv);
    showInfoToast("Fetched Live Data")
    setReloading(false)
  }, [data]);


  useEffect(() => {
    loadExcel();
  }, [loadExcel]);


  useEffect(() => {
    if (!data.length) return;
    const interval = setInterval(fetchUpdates, refreshInterval);
    return () => clearInterval(interval);
  }, [data, fetchUpdates, refreshInterval]);


  const handleSortInvestment = useCallback(() => {
    setQtySortOrder(null)
        setCurrentPage(1)
    setSortInvOrder((prev) => (prev === "asc" ? "desc" : "asc"));
  }, []);

  const handleSortQuantity = useCallback(() => {
    setSortInvOrder(null)
    setCurrentPage(1)
    setQtySortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
  }, []);

  const sortedData = useMemo(() => {
    let sortdata = [...data];

    // if (!sortInvOrder) return data;
    // return [...data].sort((a, b) =>
    //   sortInvOrder === "asc"
    //     ? (a.Investment || 0) - (b.Investment || 0)
    //     : (b.Investment || 0) - (a.Investment || 0)
    // );
    if (sortInvOrder) {
      // console.log("sortInvOrder")

      sortdata.sort((a, b) =>
        sortInvOrder === "asc"
          ? (a.Investment || 0) - (b.Investment || 0)
          : (b.Investment || 0) - (a.Investment || 0)
      );
    }
    else if (qtySortOrder) {
      // console.log("qtySortOrder")
      sortdata.sort((a, b) =>
        qtySortOrder === "asc"
          ? (a.Qty || 0) - (b.Qty || 0)
          : (b.Qty || 0) - (a.Qty || 0)
      );
    }

    return sortdata;
  }, [data, sortInvOrder, qtySortOrder]);

  const filteredData = useMemo(
    () =>
      sortedData.filter(
        (row) =>
          row &&
          ["Particulars", "NSE/BSE"].some((key) =>
            row[key as keyof PortfolioRow]
              ?.toString()
              .toLowerCase()
              .includes(search.toLowerCase())
          )
      ),
    [sortedData, search]
  );

  const convert = useCallback(
    (amount: number) => {
      if (currency === "INR") return amount;
      return amount / USD_TO_INR;
    },
    [currency]
  );

  const toggleCurrency = useCallback(() => {
    setCurrency((prev) => (prev === "INR" ? "USD" : "INR"));
  }, []);

  const currencySymbol = useMemo(() => (currency === "INR" ? "₹" : "$"), [currency]);

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * items_per_page;
    return filteredData.slice(start, start + items_per_page);
  }, [filteredData, currentPage]);

  const totalPages = Math.ceil(filteredData.length / items_per_page);

  const showSuccessToast = (message: string) => {
    toast.success(message, {
      position: "top-center"
    });
  };

  const showFailedToast = (message: string) => {
    toast.error(message, {
      position: "top-center"
    });
  };

  const showWarningToast = (message: string) => {
    toast.warning(message, {
      position: "top-center"
    });
  };

  const showInfoToast = (message: string) => {
    toast.info(message, {
      position: "top-center"
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-slate-100 mb-30">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <ToastContainer />

        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white rounded-2xl p-8 shadow-2xl mb-10">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold">Portfolio Dashboard</h1>

            <div className="flex items-center gap-3">
              <select
                value={refreshInterval}
                onChange={(e) => setRefreshInterval(parseInt(e.target.value))}
                className="bg-white/10 text-white border border-white/20 rounded-lg px-3 py-2 text-sm"
              >
                <option value={15000} className="text-black">15s</option>
                <option value={30000} className="text-black">30s</option>
                <option value={60000} className="text-black">60s</option>
              </select>

              <button
                onClick={() => reloading ? null : fetchUpdates()}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white transition"
              >
                {reloading ? "Loading..." : <><FaSyncAlt /> {"Reload"}</>}
              </button>

              <button
                onClick={toggleCurrency}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-white transition"
              >
                <FaExchangeAlt />
                {currency === "INR" ? "$" : "₹"}
              </button>

              <div className="text-sm text-slate-400">
                Last updated: {lastUpdateTime.toLocaleTimeString("en-US")}
              </div>
            </div>
          </div>


          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

            <div className="bg-white/10 rounded-xl p-5">
              <div className="flex items-center gap-2 text-slate-300 mb-2">
                <FaChartPie className="text-purple-500" />
                <span>Total Value</span>
              </div>
              <div className="text-3xl font-bold">
                {currencySymbol}
                {convert(totalPresentValue).toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                })}
              </div>
            </div>


            <div className="bg-white/10 rounded-xl p-5">
              <div className="flex items-center gap-2 text-slate-300 mb-2">
                <FaMoneyBillWave className="text-blue-500" />
                <span>Total Investment</span>
              </div>
              <div className="text-3xl font-bold">
                {currencySymbol}
                {convert(totalInvestment).toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                })}
              </div>
            </div>


            <div className="bg-white/10 rounded-xl p-5">
              <span className="text-slate-300">Total Gain/Loss</span>
              <div
                className={`text-3xl font-bold ${totalGainLoss >= 0 ? "text-emerald-400" : "text-rose-400"
                  }`}
              >
                {currencySymbol}
                {Math.abs(convert(totalGainLoss)).toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                })}
              </div>
              <div
                className={`flex items-center gap-2 text-xl font-bold ${totalGainLoss >= 0 ? "text-emerald-400" : "text-rose-400"
                  }`}
              >
                {totalGainLoss >= 0 ? <FaArrowUp /> : <FaArrowDown />}
                {(((convert(totalGainLoss) / convert(totalInvestment))) * 100).toFixed(decimalFixed)}%
              </div>
            </div>
          </div>
        </div>

        <div className="min-w-full flex flex-row md:flex-row justify-center items-center gap-2 mb-6">
          <input
            type="text"
            placeholder="Search by Particulars or NSE/BSE..."
            value={search}
            onChange={(e) => {
              setCurrentPage(1)
              setSearch(e.target.value)
            }}
            className="border border-gray-300 rounded-lg p-4 w-[80%] shadow focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />

          <button
            onClick={() => setShowSectorModal(true)}
            className="flex items-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg shadow transition"
          >
            Sector Report
          </button>
        </div>


        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-300 text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="border p-3 text-left">Particulars</th>
                <th className="border p-3 text-left">Purchase Price</th>
                <th
                  className="border p-3 text-left cursor-pointer hover:bg-gray-200"
                  onClick={handleSortInvestment}
                >
                  Investment ({currencySymbol}){sortInvOrder === "asc" ? "▲" : sortInvOrder === "desc" ? "▼" : ""}
                </th>
                <th
                  className="border p-3 text-left cursor-pointer hover:bg-gray-200"
                  onClick={handleSortQuantity}
                >Qty {qtySortOrder === "asc" ? "▲" : qtySortOrder === "desc" ? "▼" : ""}
                </th>
                <th className="border p-3 text-left">CMP ({currencySymbol})</th>
                <th className="border p-3 text-left">Present Value ({currencySymbol})</th>
                <th className="border p-3 text-left">Gain/Loss ({currencySymbol})</th>
                <th className="border p-3 text-left">NSE/BSE</th>
                <th className="border p-3 text-left">P/E (TTM)</th>
                <th className="border p-3 text-left">Latest Earnings</th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.map((row, i) => {
                const gainLoss = row["Gain/Loss"] || 0;
                const invested = row.Investment || 0;
                const gain_loss_percent = gainLoss / invested;
                return (
                  <tr key={i} className="hover:bg-gray-50 transition">
                    <td className="border p-3">{row.Particulars}</td>
                    <td className="border p-3 text-right">{row["Purchase Price"]}</td>
                    <td className="border p-3 text-right">
                      {convert(row.Investment || 0).toFixed(2)}
                    </td>
                    <td className="border p-3 text-center">{row.Qty}</td>
                    <td className="border p-3 text-right">{convert(row.CMP || 0).toFixed(2)}</td>
                    <td className="border p-3 text-right">
                      {convert(row["Present value"] || 0).toFixed(2)}</td>
                    <td
                      className={`border p-3 text-right ${gainLoss >= 0 ? "text-green-600" : "text-red-600"
                        }`}
                    >
                      {convert(gainLoss).toFixed(2)}{" "}({gain_loss_percent.toFixed(decimalFixed)}%)
                    </td>
                    <td className="border p-3">{row["NSE/BSE"]}</td>
                    <td className="border p-3">{row["P/E (TTM)"]}</td>
                    <td className="border p-3">{row["Latest Earnings"]}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>


        <div className="flex justify-center items-center gap-2 mt-4">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
          >
            Prev
          </button>
          <span className="text-sm text-gray-700">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
        {
          showSectorModal &&
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-4xl max-h-[80vh] overflow-y-auto relative">
              <button
                onClick={() => setShowSectorModal(false)}
                className="absolute top-3 right-3 text-gray-500 hover:text-gray-800 text-xl cursor-pointer"
              >
                <FaTimes />
              </button>
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2 text-gray-800">
                Sector Report
              </h2>

              <table className="min-w-full border border-gray-300 text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="border p-3">Sector</th>
                    <th className="border p-3">Investment ({currencySymbol})</th>
                    <th className="border p-3">Portfolio (%)</th>
                    <th className="border p-3">Present Value ({currencySymbol})</th>
                    <th className="border p-3">Gain/Loss ({currencySymbol})</th>
                  </tr>
                </thead>
                <tbody>
                  {sectors.map((sec, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="border p-3">{sec.sector_name}</td>
                      <td className="border p-3 text-right">
                        {convert(sec.investment).toLocaleString("en-US", locale)}
                      </td>
                      <td className="border p-3 text-center">{sec.portfolio.toLocaleString("en-US", locale)}%</td>
                      <td className="border p-3 text-right">
                        {/* {sec.present_value.toLocaleString("en-US", locale)} */}
                        {convert(sec.present_value).toLocaleString("en-US", locale)}
                      </td>
                      <td
                        className={`border p-3 text-right ${sec.gain_loss >= 0 ? "text-green-600" : "text-red-600"
                          }`}
                      >
                        {convert(sec.gain_loss).toLocaleString("en-US")}{" "}({sec.gain_loss_percent.toFixed(decimalFixed)}%)
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        }
      </div>
    </div>
  );
}

export default App;