from flask import Flask

app = Flask(__name__)

@app.route('/')
def home():
    return 'Hello, World!'

@app.route('/sophia')
def about():
    return 'I know you are Dery <h3>Welcome back!</h3>'