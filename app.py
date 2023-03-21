from flask import Flask, request, jsonify
from nlp import process_transcript 
import time 

"""

Main REST API

"""

def create_app(transcripts, curr_state, openai_key, lst): 

    app = Flask(__name__)


    # To debug/ensure that the app works! 
    @app.route('/', methods=['GET'])
    def default():
        return {'response' : "Working API server"}, 200


    # To read the live transcript result from LISTENER and store into variable "transcripts" 
    @app.route('/proc', methods=['GET', 'POST'])
    def proc():
        nonlocal transcripts 
        nonlocal curr_state 
        nonlocal openai_key 
        nonlocal lst 

        t = request.get_json()['value']
        pkg = [t['type'], t['timestamp'], t['transcription']]

        if t['type'] != "transcript_interim_results": 
            pkg.append(t['personID'])
            transcripts.put(pkg)

        print(f"Received transcript: {pkg}")
        res, lst = process_transcript(curr_state, transcripts, openai_key, lst)

        print(f"received mdl results: {res}")
        curr_state = html_ize(res)

        return jsonify(status='success'), 200
    

    # To send processed results to the SENDER interface (to be displayed on plugin)
    @app.route('/read', methods=['GET'])
    def read(): 
        nonlocal curr_state 
        print(f"Curr_st {curr_state}")
        time.sleep(0.5)
        return {'summary' : curr_state[0], 'actionables': curr_state[1], 'time' : curr_state[2]}, 200


    # To <>TBD> 
    @app.route('/send', methods=['POST'])
    def send(): 
        nonlocal curr_state 
        nonlocal openai_key 
        res = request.get_json()
        print(f"We got the access keys! {res}")
        openai_key = res['openaiKey']
        return jsonify(status='success'), 200


    return app
   


"""

Helper Functions

"""

def html_ize(curr): 
    actionables = curr[1] 
    actionables = actionables.split("|")
    if len(actionables) > 1: 
        html_actionables = "<ul>"
        for item in actionables: 
            html_actionables += "<li>" + item + "</li>"
        html_actionables += "</ul>"
        curr[1] = html_actionables

    agenda = curr[2] 
    agenda = agenda.split("|")
    if len(agenda) > 1: 
        html_agenda = "<ul>"
        for item in agenda: 
            html_agenda += "<li>" + item + "</li>"
        html_agenda += "</ul>"
        curr[2] = html_agenda

    return curr 
