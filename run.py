import multiprocessing as mp 
from app import create_app 
from flask_cors import CORS
import os 
import time 

PORT = "http://127.0.0.1:5000/"


if __name__ == "__main__": 

    transcripts = mp.Queue() 
    curr_state = ["", "", ""] # One for each task (summary, actionables, agenda)
    openai_key = "" # Can either enter at start or enter in plugin! 
    lst = time.time() 
    app = create_app(transcripts, curr_state, openai_key, lst)
    CORS(app)

    print("PID:", os.getpid())
    print("Werkzeug subprocess:", os.environ.get("WERKZEUG_RUN_MAIN"))
    print("Inherited FD:", os.environ.get("WERKZEUG_SERVER_FD"))
    app.run(host="127.0.0.1", port=5000)