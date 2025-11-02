

export default function PortfolioHeader({ lastUpdate,data }) {
    console.log(data,"data")
    return (
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white rounded-2xl p-8 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-3xl font-bold tracking-tight">Portfolio Dashboard</h1>
                <div className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-lg backdrop-blur-sm">
                    {/* <Wallet className="w-5 h-5" /> */}
                    <div className="text-center text-sm text-slate-500">
                        Last updated: {lastUpdate.toLocaleTimeString('en-US')}
                    </div>
                    <span className="font-semibold">Live</span>
                </div>
            </div>

            <div className="min-w-250">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-white/10 rounded-xl p-5 backdrop-blur-sm border border-white/20">
                        <div className="flex items-center gap-2 text-slate-300 mb-2">
                            {/* <DollarSign className="w-4 h-4" /> */}
                            <span className="text-sm font-medium">Total Value</span>
                        </div>
                        <div className="text-3xl font-bold">${"5400".toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                        <div className="text-sm text-slate-400 mt-1">
                            Cash: ${"1000".toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                    </div>

                    <div className="bg-white/10 rounded-xl p-5 backdrop-blur-sm border border-white/20">
                        <div className="flex items-center gap-2 text-slate-300 mb-2">
                            {/* {"1000" >= 0 ? (
                            <TrendingUp className="w-4 h-4 text-emerald-400" />
                        ) : (
                            <TrendingDown className="w-4 h-4 text-rose-400" />
                        )} */}
                            <span className="text-sm font-medium">Total Gain/Loss</span>
                        </div>
                        <div className={`text-3xl font-bold ${"1000" >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            ${Math.abs("1000").toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        <div className={`text-sm mt-1 ${"1000" >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {"1000" >= 0 ? '+' : '-'}{Math.abs("1000").toFixed(2)}%
                        </div>
                    </div>



                    <div className="bg-white/10 rounded-xl p-5 backdrop-blur-sm border border-white/20">
                        <div className="flex items-center gap-2 text-slate-300 mb-2">
                            {/* <DollarSign className="w-4 h-4" /> */}
                            <span className="text-sm font-medium">Total Cost Basis</span>
                        </div>
                        <div className="text-3xl font-bold">${"10000".toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                        <div className="text-sm text-slate-400 mt-1">
                            Original investment
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
