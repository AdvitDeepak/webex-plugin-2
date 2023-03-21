import multiprocessing as mp 
import time 
import openai 
import os 
from datetime import datetime 
from pytz import timezone
import pytz


start = datetime.now()
dt1 = start.timestamp()

# Currently, processing done via openai --> however, ideal is all done in-house

DURATION = 5 # How often to process! 
clean_info = []


# Receives a QUEUE (transcripts at each time step) --> returns an ARRAY of 3 elms 
def process_transcript(curr_state, transcripts, openai_key, lst): 

    # First, check whether we should process! 

    try: 
        curr = transcripts.get(block=True, timeout=0)
    except: 
        return curr_state, lst   


    # Now that we've read the values, check whether we should process! 

    trust = curr[1] / 1000
    delta = trust - dt1
    dt2 = datetime.fromtimestamp(delta, tz=timezone('US/Pacific'))
    res = dt2.strftime('%M:%S.%f')[:-4]
    res = res.split(".")[0]
    clean_info.append({"start_time": res, "transcription": curr[2]})


    if not (time.time() - lst > DURATION): 
        return curr_state, lst 

    # Summary 
    rsp = gpt_analysis("summary", openai_key)
    summary = rsp['choices'][0]['text']
    print("Boutta put into extractions")

    # Actionables
    rsp = gpt_analysis("actionables", openai_key)
    actionables = rsp['choices'][0]['text']

    # Discussed Agenda
    rsp = gpt_analysis("agenda", openai_key)
    agenda = rsp['choices'][0]['text']

    curr_state = [summary, actionables, agenda]
    lst = time.time() 

    return curr_state, lst
                



def gpt_analysis(category, key): 
    print("Reached GPT analysis")
    #return {'choices' : [{'text': "DUMMY RESPONSE"}]}
    
    if category == "summary": 
        prompt = "Analyze the following meeting transcript and generate a summary."
        message = f"{prompt}\n{clean_info}"
    elif category == "actionables": 
        prompt = "Analyze the following meeting transcript and identify actionable items (such as todo's) and return them in a list, separated by the pipeline '|' character" 
        message = f"{prompt}\n{clean_info}"
        print(message)
    elif category == "agenda": 
        prompt = "Analyze the following meeting transcript and idetnify discussed topics as well as the duration they were discussed and return them in a list, separated by the '-' between time and label, and separated by the pipeline '|' character between each item. For example, 'XX:XX - XX:XX - Introductions' would be a valid entry in the returned list." 
        message = f"{prompt}\n{clean_info}"
    else: 
        return None  

   
    openai.api_key = key

    response = openai.Completion.create(
        model="text-davinci-003",
        prompt=message,
        temperature=0.7,
        max_tokens=892,
        top_p=1,
        frequency_penalty=0,
        presence_penalty=0
    )

    print(response)
    return response 
