import pickle
import json

def convert_pkl_to_json(pkl_file_path, json_file_path):
    try:
        with open(pkl_file_path, 'rb') as pkl_file:
            data = pickle.load(pkl_file)

        with open(json_file_path, 'w', encoding='utf-8') as json_file:
            json.dump(data, json_file, ensure_ascii=False, indent=4)

        print(f"Converted {pkl_file_path} to {json_file_path} successfully!")
    except Exception as e:
        print(f"Error occurred: {e}")

convert_pkl_to_json('../final_result.pkl', '../final_result.json')
