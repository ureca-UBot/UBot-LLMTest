"""KLUE-NLI batch scorer.

Reads a JSON array of {id, premise, hypothesis} objects from `in_path`,
loads the model ONCE, scores every pair, and writes the results (predicted
label + class probabilities) as a JSON array to `out_path`.

Batch-file-in/batch-file-out by design: the calling Node process writes one
input file per scoring stage run (not per case), so the ~1-2s model load
cost is paid once per pipeline run, not once per test case — this matters
at 1000-case scale.

Usage:
    python run_nli_batch.py <in_path.json> <out_path.json>

Model: Huffon/klue-roberta-base-nli (KLUE-NLI fine-tuned klue/roberta-base).
Label order confirmed from the model's config.json: 0=ENTAILMENT,
1=NEUTRAL, 2=CONTRADICTION.
"""
import json
import sys

import torch
from transformers import AutoModelForSequenceClassification, AutoTokenizer

MODEL_ID = "Huffon/klue-roberta-base-nli"
MAX_LENGTH = 512


def load_model():
    tokenizer = AutoTokenizer.from_pretrained(MODEL_ID)
    model = AutoModelForSequenceClassification.from_pretrained(MODEL_ID)
    model.eval()
    return tokenizer, model


def score_pair(tokenizer, model, premise, hypothesis):
    inputs = tokenizer(
        premise, hypothesis,
        return_tensors="pt", truncation=True, max_length=MAX_LENGTH,
    )
    # KLUE-RoBERTa has type_vocab_size=1 (no real segment embedding table),
    # but the BertTokenizer still emits 0/1 token_type_ids for a pair input.
    # Zero them out to avoid an out-of-range embedding lookup (see
    # scratchpad calibration notes — this was the cause of an early crash).
    if "token_type_ids" in inputs:
        inputs["token_type_ids"] = torch.zeros_like(inputs["token_type_ids"])
    with torch.no_grad():
        logits = model(**inputs).logits[0]
    probs = torch.softmax(logits, dim=-1).tolist()
    id2label = model.config.id2label
    pred_idx = int(torch.argmax(logits))
    return {
        "predicted": id2label[pred_idx],
        "probs": {id2label[i]: round(probs[i], 4) for i in range(len(probs))},
    }


def main():
    if len(sys.argv) != 3:
        print("usage: python run_nli_batch.py <in_path.json> <out_path.json>", file=sys.stderr)
        sys.exit(2)
    in_path, out_path = sys.argv[1], sys.argv[2]

    with open(in_path, "r", encoding="utf-8") as f:
        items = json.load(f)

    print(f"loading {MODEL_ID} ...", file=sys.stderr)
    tokenizer, model = load_model()
    print(f"scoring {len(items)} pairs ...", file=sys.stderr)

    results = []
    for i, item in enumerate(items):
        scored = score_pair(tokenizer, model, item.get("premise", ""), item.get("hypothesis", ""))
        results.append({"id": item.get("id"), **scored})
        if (i + 1) % 200 == 0:
            print(f"  {i + 1}/{len(items)}", file=sys.stderr)

    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False)
    print(f"wrote {len(results)} results -> {out_path}", file=sys.stderr)


if __name__ == "__main__":
    main()
