from flask import Flask, request, jsonify
from flask_cors import CORS
import json
from datetime import datetime

app = Flask(__name__)
CORS(app)

# Store signals in a queue
signal_queue = []
processed_signals = []

@app.route('/signal', methods=['POST'])
def receive_signal():
    """Extension sends signal here"""
    data = request.json
    signal = data.get('signal')
    
    if signal:
        # Create signal object
        signal_obj = {
            "signal": signal,
            "status": "NEW",
            "timestamp": datetime.now().isoformat()
        }
        
        # Add to queue
        signal_queue.append(signal_obj)
        
        print(f"\n🔔 NEW SIGNAL RECEIVED: {signal}")
        print(f"   Queue size: {len(signal_queue)}")
        
        return jsonify({"status": "ok"})
    
    return jsonify({"status": "error"}), 400

@app.route('/signal', methods=['GET'])
def get_signal():
    """EA requests signal here"""
    global signal_queue
    
    # Find first NEW signal
    for i, signal in enumerate(signal_queue):
        if signal["status"] == "NEW":
            print(f"📤 Sending signal to EA: {signal['signal']}")
            return jsonify({
                "signal": signal["signal"],
                "status": "NEW"
            })
    
    # No new signals
    return jsonify({"signal": "NONE", "status": "NONE"})

@app.route('/signal/processed', methods=['POST'])
def mark_processed():
    """EA marks signal as processed"""
    global signal_queue
    
    # Mark the first NEW signal as processed
    for i, signal in enumerate(signal_queue):
        if signal["status"] == "NEW":
            signal["status"] = "PROCESSED"
            print(f"✅ Signal marked as PROCESSED: {signal['signal']}")
            
            # Remove from queue (optional)
            signal_queue.pop(i)
            break
    
    return jsonify({"status": "ok"})

@app.route('/status', methods=['GET'])
def status():
    return jsonify({
        "queue_size": len(signal_queue),
        "signals": signal_queue
    })

if __name__ == '__main__':
    print("="*50)
    print("🚀 SIGNAL SERVER FOR EA BRIDGE")
    print("="*50)
    print("POST /signal - Receive signals from extension")
    print("GET  /signal - Send signals to EA")
    print("POST /signal/processed - Mark as processed")
    print("="*50)
    app.run(host='localhost', port=8080, debug=False)
