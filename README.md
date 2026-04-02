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

<img width="512" height="205" alt="step1" src="https://github.com/user-attachments/assets/854199ca-4833-41ce-8b05-c211be948fb9" />
<img width="512" height="192" alt="step2" src="https://github.com/user-attachments/assets/26732ecc-48b4-41fe-8c7d-276aee8d7cca" />
<img width="512" height="191" alt="step3" src="https://github.com/user-attachments/assets/daf2cffc-3346-424b-8696-3b8d0228866f" />
<img width="512" height="191" alt="step4" src="https://github.com/user-attachments/assets/063bf1fa-ea25-406c-8e57-6890da1ca17f" />
<img width="512" height="193" alt="step5" src="https://github.com/user-attachments/assets/0cccbe47-8a6b-4a52-bff5-609349b0b9c5" />
<img width="512" height="191" alt="step6" src="https://github.com/user-attachments/assets/f68ea738-49b2-4b02-a877-bfbd1e124922" />
<img width="512" height="191" alt="step7" src="https://github.com/user-attachments/assets/0ebd1c6d-52b7-4c27-873d-44a26df54950" />

**Example from Step 1:**

- If stop is 50 ticks → trade 0.010 lots → risk $0.50 → commission $0.06 → net win $0.44, net loss $0.56
- If stop is 35 ticks → trade 0.014 lots → risk $0.49 → commission $0.084 → net win $0.406, net loss $0.574

The result is the same: I risk approximately $0.50 per trade at Step 1, and I earn approximately $0.44 when I win. The table ensures this consistency across all stop distances.

I run this system on 6 instruments simultaneously:
- EURUSD, GBPUSD, AUDUSD, USDCHF, NZDUSD, EURGBP

Each instrument generates 200-300 trades per week. With 6 instruments, I have 1,200-1,800 trades per week. The probability of a 7-loss streak on any single instrument is about 0.67% per sequence. With this many trades, I expect one every week or two.

But because instruments are diversified across different asset classes and currencies, losing streaks rarely happen at the same time across all instruments.

**The Bottom Line:**

The system is built to profit from above 50% win rate using Martingale recovery. Commission is built into every trade through a normalization table. Nano lots allow precise position sizing. Eight instruments provide diversification.

## Optimization Framework - The Metric System

Because market conditions change, I optimize each instrument once per week.
I built a complete optimization framework to find the best parameters for each instrument. The process:

**1. INPUT PARAMETERS:**

   - EMA Length: 20-100 (step 5)
   - Donchian Length: 10-40 (step 5)
   - ATR Length: 7-21 (step 2)
   - ATR Multiplier: 2-3 (step 0.2)
   - Pin Bar: true/false
   - Engulfing: true/false

<img width="512" height="282" alt="unnamed" src="https://github.com/user-attachments/assets/193c26c0-daae-4a81-b558-9d6a58703f66" />

**2. OPTIMIZATION EXECUTION:**

I use the OptiPie Chrome extension which automates testing all 11,424 combinations per instrument. It loops through each combination, runs the backtest on TradingView, and records results.

<img width="512" height="282" alt="unnamed (1)" src="https://github.com/user-attachments/assets/e2f12e05-e0ea-4f38-a451-76da98273452" />

**3. SCORING ALGORITHM (Python Server):**

   I built a Python Flask server that receives optimization results and calculates a score for each combination:

   SCORE = (Profit Factor × 30) + (Win Rate × 25) + (Drawdown Score) + (Loss Streak Penalty) + (Trades / Max Trades × 20)

   Where:
   - Drawdown Score = 25 × (1 - MaxDD_USD / 250)
   - Loss Streak Penalty: 1-2 losses = +5 | 3 losses = 0 | 4 losses = -5 | 5 losses = -10 |                   6 losses = -15 | 7+ losses = -25

   This scoring system weights:
   - Profitability (30%) - most important
   - Win rate (25%) - Martingale needs >50%
   - Drawdown (25%) - risk control
   - Trade count (20%) - statistical significance
   - Loss streak penalty - risk of blow-up

**4. PARAMETER SELECTION:**
  
   The server sorts all combinations by score, selects the highest, and saves it to a file. I then manually update the Pine Script inputs with the winning parameters for the coming week.

## PORTFOLIO - 6 INSTRUMENTS WITH CORRELATION ANALYSIS

I run the strategy on six forex instruments to diversify risk:

1. **EURUSD** - base, highest liquidity
2. **GBPUSD** - volatile, good for scalping
3. **AUDUSD** - commodity currency, Asia session
4. **USDCHF** - inverse to EURUSD, natural hedge
5. **NZDUSD** - additional commodity currency
6. **EURGBP** - cross pair, low correlation to USD

Each instrument has its own optimized parameters to account for different volatility profiles. I track correlation to ensure true diversification. The 1:1 RR applies identically across all instruments.

## AUTOMATION INFRASTRUCTURE - FULL STACK

I built a complete end-to-end automation stack:

**1. Pine Script Strategy:**

- Outputs signals in format: "OpenB|D50|L0.001|S1"
where 
  - “B” is the direction buy or sell ( “B” for buy and “S” for sell )
  - “D50” is the stop loss and take profit distance in ticks
  - “L0.001” is the position size
  - “S1” the number of step of the martingale
- Includes step number for Martingale tracking
- Fixed 1:1 risk-reward built in

<img width="500" height="512" alt="unnamed (2)" src="https://github.com/user-attachments/assets/74d1423a-6d1f-4308-bdea-a7a217e757aa" />

**2. Chrome Extension (JavaScript):**

   - Reads TradingView Strategy Tester table
   - Detects new signals (OpenB|D...|L...|S...)
   - Parses direction, stop ticks, lot size, step
   - Sends to local server via HTTP POST
   - Scans every 100ms for real-time detection

<img width="512" height="296" alt="unnamed (3)" src="https://github.com/user-attachments/assets/ec27e359-d95d-49be-94ec-e00fc64b81ee" />

**3. Python Flask Server:**

   - Receives signals at /signal endpoint
   - Maintains signal queue with status tracking
   - Writes to file for MT5 reading
   - Handles optimization results at /optimization endpoint
   - Calculates scores and saves best parameters
   - Includes status endpoint for monitoring

<img width="512" height="296" alt="unnamed (3)" src="https://github.com/user-attachments/assets/101b119b-0595-4747-8e50-6493e70b203f" />

**4. MT5 Expert Advisor (MQL5):**

   - Uses WebRequest to get signals from server
   - Only processes "NEW" signals to avoid duplicates
   - Parses direction, stop ticks, lot size, step
   - Calculates stop loss and take profit (1:1 RR)
   - Places market orders with proper position sizing
   - Marks signals as "PROCESSED" after execution
   - Includes position check to prevent multiple trades on same instrument

<img width="500" height="512" alt="unnamed (5)" src="https://github.com/user-attachments/assets/6e3682a3-4c44-4d76-996b-1a6241396913" />

## SKILLS & TECHNOLOGIES USED

To build this system, I used:

**Strategy Development**
Pine Script (TradingView) | 1-minute scalping strategy with 3-confirmation entry logic, Martingale progression, 1:1 risk-reward
**Automation** 
Chrome Extension (JavaScript) | Real-time signal detector reading Strategy Tester table, parsing signals, HTTP communication |
**Backend Server**  
Python (Flask) | Signal queue management, optimization scoring algorithm, file I/O, REST API endpoints |
**Trade Execution** 
MQL5 (MetaTrader) | Expert Advisor with WebRequest, position management, 1:1 stop/target calculation, duplicate prevention |
**Optimization**
OptiPie Extension + Custom Python | Automated testing of 4,320 parameter combinations per instrument, scoring system with loss streak penalties |
**Risk Modeling**
Excel / Custom Tables | Martingale progression tables with commission built-in, stop loss buckets, net P&L calculations |

What This Demonstrates:

- Full-stack development (frontend, backend, trading platforms)
- Quantitative reasoning (scoring systems, probability, risk models)
- Mathematical rigor (Martingale mathematics, loss streak probability, expected value)
- Resourcefulness (built everything alone with no external funding)

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
