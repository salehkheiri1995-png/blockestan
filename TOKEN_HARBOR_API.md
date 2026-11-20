# Token Harbor API — مرجع استفاده در هر پروژه

> این فایل یک مرجع ثابت است برای اتصال به دروازهٔ مدل‌های هوش مصنوعی
> **Token Harbor** از داخل هر پروژه/زبان برنامه‌نویسی.
> آدرس پایه: `https://tokenharbor.ai/v1`

---

## ۱. گرفتن کلید API

1. وارد [tokenharbor.ai](https://tokenharbor.ai) شو.
2. از منوی **Try free** یا **Sign in** وارد داشبورد شو.
3. در داشبورد روی **Get an API key** بزن.
4. کلید شبیه `thk_live_...` است. آن را کپی کن و امن نگه دار.
   - هرگز کلید را توی کد فرانت‌اند/ریپوی عمومی نگذار.
   - اگر لو رفت، از داشبورد می‌توانی بچرخانی‌اش (rotate).

---

## ۲. مشخصات کلی

| مورد | مقدار |
|---|---|
| **Base URL** | `https://tokenharbor.ai/v1` |
| **احراز هویت** | هدر `Authorization: Bearer thk_live_<کلید>` |
| **فرمت** | JSON / OpenAI-compatible + Anthropic-compatible |

دو شکل سازگار (هر دو با همین کلید و همین Base URL):

- **OpenAI**: `POST /v1/chat/completions`
- **Anthropic**: `POST /v1/messages`

> هر مدلی که در `/models` هست روی هر دو اندپوینت کار می‌کند.
> نام مدل (model id) همان چیزی است که در صفحه `/models` می‌بینی.

---

## ۳. تنظیم برای پروژه‌های مختلف

### الف) با متغیر محیطی (توصیه‌شده برای ابزارها/SDKها)

بیشتر SDKها و ابزارها از متغیرهای محیطی زیر می‌خوانند:

```env
OPENAI_BASE_URL=https://tokenharbor.ai/v1
OPENAI_API_KEY=thk_live_<کلید>
```

با این کار، هر ابزار/SDK که از OpenAI استفاده می‌کند بدون تغییر کد به Token Harbor وصل می‌شود.

### ب) Python — با SDK رسمی OpenAI

```python
from openai import OpenAI

client = OpenAI(
    base_url="https://tokenharbor.ai/v1",
    api_key="thk_live_<کلید>",
)

resp = client.chat.completions.create(
    model="qwen3.7-max",
    messages=[{"role": "user", "content": "سلام"}],
)
print(resp.choices[0].message.content)
```

### ج) Python — با requests (بدون SDK)

```python
import requests

response = requests.post(
    url="https://tokenharbor.ai/v1/chat/completions",
    headers={
        "Authorization": "Bearer thk_live_<کلید>",
        "Content-Type": "application/json",
    },
    json={
        "model": "qwen3.7-max",
        "messages": [{"role": "user", "content": "Hi"}],
    },
)
print(response.json()["choices"][0]["message"]["content"])
```

### د) JavaScript / TypeScript — در Node یا مرورگر

```ts
const res = await fetch("https://tokenharbor.ai/v1/chat/completions", {
  method: "POST",
  headers: {
    Authorization: "Bearer thk_live_<کلید>",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    model: "qwen3.7-max",
    messages: [{ role: "user", content: "سلام" }],
  }),
});
const data = await res.json();
console.log(data.choices[0].message.content);
```

### ه) Node — با npm package رسمی OpenAI

```ts
import OpenAI from "openai";

const client = new OpenAI({
  baseURL: "https://tokenharbor.ai/v1",
  apiKey: "thk_live_<کلید>",
});

const resp = await client.chat.completions.create({
  model: "qwen3.7-max",
  messages: [{ role: "user", content: "سلام" }],
});
console.log(resp.choices[0].message.content);
```

### و) shell / curl

```bash
curl https://tokenharbor.ai/v1/chat/completions \
  -H "Authorization: Bearer thk_live_<کلید>" \
  -H "Content-Type: application/json" \
  -d '{"model":"qwen3.7-max","messages":[{"role":"user","content":"سلام"}]}'
```

### ز) Anthropic-compatible (Python)

```python
from anthropic import Anthropic

client = Anthropic(
    api_key="thk_live_<کلید>",
    base_url="https://tokenharbor.ai",
)

message = client.messages.create(
    model="qwen3.7-max",
    max_tokens=1024,
    messages=[{"role": "user", "content": "سلام"}],
)
print(message.content[0].text)
```

> در شکل Anthropic، `max_tokens` الزامی است و می‌توانی کلید را در
> `x-api-key` یا `Authorization: Bearer` بگذاری.

---

## ۴. Streaming

کافی است `"stream": true` را در بادی اضافه کنی؛ خروجی به صورت
**Server-Sent Events** برمی‌گردد.

```python
with requests.post(
    url="https://tokenharbor.ai/v1/chat/completions",
    headers={
        "Authorization": "Bearer thk_live_<کلید>",
        "Content-Type": "application/json",
    },
    json={
        "model": "qwen3.7-max",
        "messages": [{"role": "user", "content": "یک هایکو از دریا بنویس."}],
        "stream": True,
    },
    stream=True,
) as r:
    for line in r.iter_lines():
        if line:
            print(line.decode("utf-8"))
```

---

## ۵. لیست مدل‌ها

- صفحهٔ تعاملی: `https://tokenharbor.ai/models`
- هر ردیف مدل، قیمت ورودی/خروجی به ازای هر میلیون توکن را نشان می‌دهد.

---

## ۶. خطاهای رایج

| خطا | علت |
|---|---|
| `invalid_api_key` | کلید ناقص/اضافه با فاصله یا گسسته (break line) |
| `bad range specification` | در PowerShell با curl بی‌نام (alias) کوتیشن درست رعایت نشده |
| `401/403` | هدر Authorization درست نیست یا کلید منقضی/لو رفته |

> در PowerShell ویندوز از `Invoke-RestMethod` استفاده کن، نه curl.

---

## ۷. نکات امنیتی

- از `Bearer` در هدر `Authorization` استفاده کن.
- کلید را در متغیر محیطی یا فایل خارج از Git نگه دار (`.gitignore`).
- برای پروژه‌های فرانت‌اند، هرگز کلید را در باندل مرورگر نگذار؛ اگر لازم بود، با یک بک‌اند/سرویس میانی تماس بگیر.
