FROM python:3.12.4-alpine3.19
WORKDIR /worker
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 3001
CMD sh -c "sleep 20 && python run.py"