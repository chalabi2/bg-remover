# bg-remover

***Inspired by a [tweet](https://x.com/t3dotgg/status/1828024167431836024) from [@t3dotgg](https://x.com/t3dotgg)***


## Getting Started

### Clone the repository
```bash
git clone https://github.com/chalabi2/bg-remover.git
```

---

### Frontend
Nextjs app with shadcn/ui, queries the backend for image processing.

#### Dependencies
- Node.js
- npm

#### Development
```bash
cd frontend 
npm install
cp .env.example .env
npm run dev
```
---
### Backend
Flask app with a pipeline from Huggingface.

#### Dependencies
- Python
- pip

#### Development
```bash
cd backend
python -m venv venv
venv\Scripts\activate ## or on mac source venv/bin/activate
pip install -qr https://huggingface.co/briaai/RMBG-1.4/resolve/main/requirements.txt
pip install -r requirements.txt
flask run
```
---