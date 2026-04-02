# Quantitative Trading System

## System Overview
Fully automated systematic trading strategy built from scratch.

## The Strategy Logic - 1:1 RISK-REWARD:
I coded a Pine Script strategy that uses three confirmations to enter trades on a 1-minute timeframe:
- Trend Direction: Price above or below the input-period EMA 
- Key Level: Price touches the Donchian Channel
- Price Action Confirmation: Pin bar (body ≤33% of range, wick ≥2x body) OR engulfing pattern (close beyond previous high/low, open opposite)

  When all three align, the strategy enters a trade. The exit follows a strict 1:1 risk-reward ratio:
- Stop loss = entry ± stop distance
- Take profit = entry ∓ stop distance
- Both are equal distance from entry
This means every trade risks the same amount it aims to gain. The 1:1 ratio simplifies risk management and makes the Martingale mathematics clean.

**Detailed Documentation**

📄 [Download Full Pinescript](./Pinescript/Bot.pine)

## RISK MANAGEMENT - MARTINGALE WITH 1:1 RR AND COMMISSION NORMALIZATION:
First, understand the core idea:

I risk small amounts. If I lose, I increase the next trade. When I finally win, I recover all previous losses AND make a profit.

The Risk Progression:

Step 1: Risk 1 unit | Step 2: Risk 3 units | Step 3: Risk 7 units | Step 4: Risk 15 units | Step 5: Risk 31 units | Step 6: Risk 63 units | Step 7: Risk 127 units

The Rules:
- If I lose → next trade uses higher risk
- If I win → next trade resets to 1 unit
- If I lose 7 times in a row → reset to 1 unit and continue

**The Mathematics:**

With a 50% win rate, here is what happens in 300 trades per instrument per week:

- Most trades win immediately → profit +1 unit
- Some trades lose 1 then win → profit  +2 unit
- Some lose 2 then win → profit +3 unit
- Some lose 3 then win → profit +4 unit
- Some lose 4 then win → profit +5 unit
- Some lose 5 then win → profit +6 unit
- Some lose 6 then win → profit +7 unit
- Very rarely, 7 losses in a row → loss of -247 unit

Because the win rate is above 50%, the profits from recovery sequences outweigh the rare 7-loss events.

**What This Means Per Trade:**

Every trade is designed to earn a minimum of 0.8 unit net after commission. Whether I win or lose, the structure ensures that when I eventually win, I earn more than I lost.

**The Problem - Spread and Commission:**

In normal accounts, spread and commission eat profits. I solved this by:

1. Choosing a raw spread account with near-zero spread and 6$ commission per lot.
2. Using a broker that allows nano lots (0.001 minimum)
3. Creating a table that builds commission into every calculation

**The Solution - My Normalization Table:**

I created a table that calculates exact lot sizes for every step and every possible stop distance. Commission is included. Net profit after commission is always at least $0.40 per winning sequence.


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
