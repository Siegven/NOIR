# NOIR Fine-Tuning Guide (QLoRA)

This guide explains how to fine-tune your NOIR model (based on QWEN) using free cloud GPUs (Google Colab) and the synthetic data you generate.

## Phase 1: Build the Dataset
1. Get a free Gemini API key from [Google AI Studio](https://aistudio.google.com/).
2. Open your `c:\CLG\Noir\.env` file and add: `GEMINI_API_KEY=your_key_here`
3. Run the script: `python c:\CLG\Noir\scripts\finetuning\build_dataset_with_gemini.py`
4. Let it generate about 150-300 examples. They will be saved to `c:\CLG\Noir\dataset\qlora_finetune_data.jsonl`.

## Phase 2: Setup Google Colab
1. Go to [Google Colab](https://colab.research.google.com/) and create a "New Notebook".
2. Click **Runtime > Change runtime type** and select **T4 GPU** (This is free).
3. On the left sidebar, click the **Folder icon** (Files) and upload your `qlora_finetune_data.jsonl` file.

## Phase 3: The Training Code
Paste these blocks into Colab cells and run them one by one.

### Cell 1: Install Unsloth (Super fast training library)
```python
!pip install "unsloth[colab-new] @ git+https://github.com/unslothai/unsloth.git"
!pip install --no-deps "xformers<0.0.27" "trl<0.9.0" peft accelerate bitsandbytes
```

### Cell 2: Load the Base Model in 4-bit (Saves VRAM)
```python
from unsloth import FastLanguageModel
import torch

# We use Qwen 2.5 Coder 7B as the base for NOIR
model, tokenizer = FastLanguageModel.from_pretrained(
    model_name = "unsloth/Qwen2.5-Coder-7B-Instruct-bnb-4bit",
    max_seq_length = 2048,
    dtype = None,
    load_in_4bit = True,
)

# Configure LoRA Adapters
model = FastLanguageModel.get_peft_model(
    model,
    r = 16, # Rank
    target_modules = ["q_proj", "k_proj", "v_proj", "o_proj", "gate_proj", "up_proj", "down_proj"],
    lora_alpha = 16,
    lora_dropout = 0,
    bias = "none",
    use_gradient_checkpointing = "unsloth",
)
```

### Cell 3: Load Your Dataset
```python
from datasets import load_dataset

# Load the file you uploaded
dataset = load_dataset("json", data_files="qlora_finetune_data.jsonl", split="train")

# Format the prompt for QWEN
def formatting_prompts_func(examples):
    instructions = examples["instruction"]
    contexts     = examples["context"]
    inputs       = examples["input"]
    outputs      = examples["output"]
    texts = []
    
    for instr, ctx, inp, out in zip(instructions, contexts, inputs, outputs):
        # This matches how Noir_engine.py formats the prompt!
        text = f"<|im_start|>user\n{instr}\n\nCROSS-REPOSITORY INSIGHTS:\n{ctx}\n\nCode:\n```\n{inp}\n```<|im_end|>\n<|im_start|>assistant\n{out}<|im_end|>"
        texts.append(text)
    return { "text" : texts }

dataset = dataset.map(formatting_prompts_func, batched = True)
```

### Cell 4: Train NOIR!
```python
from trl import SFTTrainer
from transformers import TrainingArguments

trainer = SFTTrainer(
    model = model,
    tokenizer = tokenizer,
    train_dataset = dataset,
    dataset_text_field = "text",
    max_seq_length = 2048,
    args = TrainingArguments(
        per_device_train_batch_size = 2,
        gradient_accumulation_steps = 4,
        warmup_steps = 5,
        max_steps = 120, # Perfect for 500 examples (~2 epochs)
        learning_rate = 2e-4,
        fp16 = not torch.cuda.is_bf16_supported(),
        bf16 = torch.cuda.is_bf16_supported(),
        logging_steps = 1,
        optim = "adamw_8bit",
        weight_decay = 0.01,
        lr_scheduler_type = "linear",
        seed = 3407,
        output_dir = "outputs",
    ),
)

trainer_stats = trainer.train()
```

### Cell 5: Save and Export the NOIR Adapter
```python
# Saves the tiny LoRA adapter files to Colab
model.save_pretrained("noir_qlora_model")
tokenizer.save_pretrained("noir_qlora_model")

# Optional: Zip it so you can download it easily
!zip -r noir_model.zip noir_qlora_model/
```

## Phase 4: Download and Run
1. Download `noir_model.zip` from Colab to your PC.
2. Extract it into your `c:\CLG\Noir` folder.
3. You can now load this model in Ollama (by writing a `Modelfile` that imports the base Qwen and your adapter) or use a Python inference script!

