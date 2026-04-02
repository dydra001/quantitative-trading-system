//+------------------------------------------------------------------+
//|                                          TradingViewBridge.mq5   |
//|                                          With Position Check     |
//+------------------------------------------------------------------+

#property copyright "TradingView Bridge"
#property version   "1.0"

#include <Trade/Trade.mqh>

// Input parameters
input int MagicNumber = 12345;
input string ServerURL = "http://127.0.0.1:8080/signal";
input string ProcessedURL = "http://127.0.0.1:8080/signal/processed";

CTrade trade;
uint lastCheckTime = 0;

//+------------------------------------------------------------------+
int OnInit() {
    trade.SetExpertMagicNumber(MagicNumber);
    Print("==========================================");
    Print("🚀 TRADINGVIEW BRIDGE v5.1 STARTED");
    Print("==========================================");
    Print("📡 Monitoring: ", ServerURL);
    Print("==========================================");
    return(INIT_SUCCEEDED);
}

//+------------------------------------------------------------------+
bool HasOpenPosition() {
    for(int i = PositionsTotal() - 1; i >= 0; i--) {
        ulong ticket = PositionGetTicket(i);
        if(PositionSelectByTicket(ticket)) {
            string symbol = PositionGetString(POSITION_SYMBOL);
            if(symbol == _Symbol) {
                return true;
            }
        }
    }
    return false;
}

//+------------------------------------------------------------------+
void OnTick() {
    uint CheckIntervalMs = 750;
    uint currentTime = GetTickCount();
    
    if(currentTime - lastCheckTime < CheckIntervalMs)
        return;
    
    lastCheckTime = currentTime;
    
    string signal = "";
    string status = "";
    
    if(GetSignalFromServer(signal, status)) {
        if(status == "NEW" && signal != "" && signal != "NONE") {
            
            // Check if already have position
            if(HasOpenPosition()) {
                Print("⛔ Position already open for ", _Symbol, " - Skipping signal: ", signal);
                MarkSignalProcessed();
                return;
            }
            
            Print("📊 NEW Signal: ", signal);
            ProcessSignal(signal);
            MarkSignalProcessed();
            Print("✅ Signal processed");
        }
    }
}

//+------------------------------------------------------------------+
bool GetSignalFromServer(string &signal, string &status) {
    char data[];
    char result[];
    string headers;
    
    int res = WebRequest("GET", ServerURL, "", NULL, 5000, 
                         data, 0, result, headers);
    
    if(res == 200) {
        string json = CharArrayToString(result);
        signal = ParseJSONValue(json, "signal");
        status = ParseJSONValue(json, "status");
        return true;
    }
    else if(res == -1) {
        Print("⚠️ WebRequest error! Add http://127.0.0.1:8080 to allowed URLs!");
    }
    else {
        Print("❌ Server error: ", res);
    }
    
    return false;
}

//+------------------------------------------------------------------+
void MarkSignalProcessed() {
    char data[];
    char result[];
    string headers = "Content-Type: application/json\r\n";
    WebRequest("POST", ProcessedURL, headers, NULL, 5000, 
               data, 0, result, headers);
}

//+------------------------------------------------------------------+
string ParseJSONValue(string json, string key) {
    string searchKey = "\"" + key + "\":\"";
    int startPos = StringFind(json, searchKey);
    
    if(startPos == -1)
        return "";
    
    startPos += StringLen(searchKey);
    int endPos = StringFind(json, "\"", startPos);
    
    if(endPos == -1)
        return "";
    
    return StringSubstr(json, startPos, endPos - startPos);
}

//+------------------------------------------------------------------+
void ProcessSignal(string alert) {
    // Parse signal: "BUY SL=71 TP=71 LOT=0.07"
    int sl_pips = 50;
    int tp_pips = 50;
    double lot_size = 0.01;
    
    // Extract SL
    int sl_start = StringFind(alert, "SL=");
    if(sl_start >= 0) {
        string sl_part = StringSubstr(alert, sl_start + 3);
        int sl_end = StringFind(sl_part, " ");
        if(sl_end < 0) sl_end = StringLen(sl_part);
        sl_pips = (int)StringToInteger(StringSubstr(sl_part, 0, sl_end));
    }
    
    // Extract TP
    int tp_start = StringFind(alert, "TP=");
    if(tp_start >= 0) {
        string tp_part = StringSubstr(alert, tp_start + 3);
        int tp_end = StringFind(tp_part, " ");
        if(tp_end < 0) tp_end = StringLen(tp_part);
        tp_pips = (int)StringToInteger(StringSubstr(tp_part, 0, tp_end));
    }
    
    // Extract LOT
    int lot_start = StringFind(alert, "LOT=");
    if(lot_start >= 0) {
        string lot_part = StringSubstr(alert, lot_start + 4);
        int lot_end = StringFind(lot_part, " ");
        if(lot_end < 0) lot_end = StringLen(lot_part);
        lot_size = StringToDouble(StringSubstr(lot_part, 0, lot_end));
    }
    
    // Enforce lot limits
    double min_lot = SymbolInfoDouble(Symbol(), SYMBOL_VOLUME_MIN);
    double max_lot = SymbolInfoDouble(Symbol(), SYMBOL_VOLUME_MAX);
    lot_size = MathMax(min_lot, MathMin(max_lot, lot_size));
    
    Print("   SL: ", sl_pips, " pips");
    Print("   TP: ", tp_pips, " pips");
    Print("   LOT: ", lot_size);
    
    // Place order
    if(StringFind(alert, "BUY") >= 0) {
        OpenBuyOrder(lot_size, sl_pips, tp_pips);
    }
    else if(StringFind(alert, "SELL") >= 0) {
        OpenSellOrder(lot_size, sl_pips, tp_pips);
    }
}

//+------------------------------------------------------------------+
void OpenBuyOrder(double lot, int sl_pips, int tp_pips) {
    double ask = SymbolInfoDouble(Symbol(), SYMBOL_ASK);
    double point = SymbolInfoDouble(Symbol(), SYMBOL_POINT);
    double tp = ask + tp_pips * point;
    double sl = ask - sl_pips * point;
    
    if(trade.Buy(lot, Symbol(), ask, sl, tp, "TradingView Signal")) {
        Print("✅ BUY Order placed! Lot: ", lot, " SL: ", sl_pips, " TP: ", tp_pips);
    } else {
        Print("❌ BUY Failed! Error: ", trade.ResultRetcode());
    }
}

//+------------------------------------------------------------------+
void OpenSellOrder(double lot, int sl_pips, int tp_pips) {
    double bid = SymbolInfoDouble(Symbol(), SYMBOL_BID);
    double point = SymbolInfoDouble(Symbol(), SYMBOL_POINT);
    double tp = bid - tp_pips * point;
    double sl = bid + sl_pips * point;
    
    if(trade.Sell(lot, Symbol(), bid, sl, tp, "TradingView Signal")) {
        Print("✅ SELL Order placed! Lot: ", lot, " SL: ", sl_pips, " TP: ", tp_pips);
    } else {
        Print("❌ SELL Failed! Error: ", trade.ResultRetcode());
    }
}

//+------------------------------------------------------------------+
void OnDeinit(const int reason) {
    Print("TradingView Bridge Stopped");
}
