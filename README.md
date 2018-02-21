# Easy Speak

An example [Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API) website.

### Getting started

```bash
docker-compose up
```

Check out http://localhost:6633

### Run with heroku

Create an `.env` file with values for these keys
```ini
DATABASE_URL=postgresql://real:secure@my-db.net:5432/easyspeak
PORT=6633
```

Run locally with heroku
```bash
heroku local
```

Check out http://localhost:6633