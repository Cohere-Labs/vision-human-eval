import json

path = "backend/mAyaVisionBench-Qwen2-VL-7B-Instruct-Qwen2.5-VL-7B-Instruct-Gemini-Flash-1.5-8B-Pixtral-12B-Llama-3.2-11B-Vision-Instruct-Llama-3.2-90B-Vision-Instruct-Pangea-7B-Molmo-7B-D-paligemma2-10b-mix-448/eng_Latn.jsonl"

with open(path, "r") as f:
    for line in f:
        data = json.loads(line)
        print(data.keys())
        # for key, value in data.items():
        #     print(key, value)
        break


# import os

# os.listdir("mAyaVisionBench-Qwen2-VL-7B-Instruct-Qwen2.5-VL-7B-Instruct-Gemini-Flash-1.5-8B-Pixtral-12B-Llama-3.2-11B-Vision-Instruct-Llama-3.2-90B-Vision-Instruct-Pangea-7B-Molmo-7B-D-paligemma2-10b-mix-448")