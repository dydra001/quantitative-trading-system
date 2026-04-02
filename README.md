# Quantitative Trading System

## System Overview
Fully automated systematic trading strategy built from scratch.

## THE STRATEGY LOGIC - 1:1 RISK-REWARD:
I coded a Pine Script strategy that uses three confirmations to enter trades on a 1-minute timeframe:
- Trend Direction: Price above or below the input-period EMA 
- Key Level: Price touches the Donchian Channel
- Price Action Confirmation: Pin bar (body ≤33% of range, wick ≥2x body) OR engulfing pattern (close beyond previous high/low, open opposite)
When all three align, the strategy enters a trade. The exit follows a strict 1:1 risk-reward ratio:
- Stop loss = entry ± stop distance
- Take profit = entry ∓ stop distance
- Both are equal distance from entry
This means every trade risks the same amount it aims to gain. The 1:1 ratio simplifies risk management and makes the Martingale mathematics clean.

## Detailed Documentation
📄 [Download Full Pinescript](./Pinescript/Bot.pine)

**Key Features:**
- 3-factor entry model (trend + mean reversion + pattern)
- Martingale risk management with commission built-in
- 1:1 risk-reward ratio
- Sub-200ms latency from signal to execution

## Detailed Documentation
📄 [Download Full Project PDF](./docs/Detailed.pdf)

## Technologies
- Pine Script (TradingView)
- Python (Flask, REST APIs)
- JavaScript (Chrome Extensions)
- MQL5 (MetaTrader)

## Author
[Iheb Mhedhbi] | Self-taught quantitative system builder
