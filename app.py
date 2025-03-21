# O:\Flask\banglanews\app.py
from flask import Flask, render_template, request, jsonify
import time

app = Flask(__name__)

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/predict', methods=['POST'])
def predict():
    start_time = time.time()
    data = request.get_json()
    text = data['text']
    output_type = data['type']
    
    # Mock processing
    processed_text = text[:100]  # Simple truncation
    
    # Mock prediction
    mock_result = {
        'title': "প্রোটোটাইপ শিরোনাম",
        'summary': "প্রোটোটাইপ সারাংশ: " + processed_text + "..."
    }
    
    return jsonify({
        'result': mock_result.get(output_type, "Invalid type"),
        'type': output_type.capitalize(),
        'time': f"{(time.time() - start_time):.2f}s"
    })

if __name__ == '__main__':
    app.run(debug=True)