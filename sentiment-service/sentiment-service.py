from textblob import TextBlob
from flask import Flask, request, jsonify

app = Flask(__name__)

@app.route('/analyze-sentiment', methods=['POST'])
def analyze_sentiment():
    data = request.json
    text = data.get('message', '')
    blob = TextBlob(text)
    sentiment = blob.sentiment.polarity  
    return jsonify({ 'sentiment': sentiment })

if __name__ == '__main__':
    app.run(port=5001) 