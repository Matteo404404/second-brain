# Widget Nothing Phone (KWGT + Tasker)

## 1. Deploy edge function su Supabase

Installa Supabase CLI, poi:

```bash
cd second-brain
supabase login
supabase link --project-ref wfklywarbeeddktjhclb
supabase secrets set WIDGET_SECRET=un-secret-lungo-random
supabase functions deploy widget --no-verify-jwt
```

## 2. URL del widget

```
https://wfklywarbeeddktjhclb.supabase.co/functions/v1/widget?key=IL_TUO_WIDGET_SECRET
```

Risposta JSON:

```json
{
  "checks_done": 8,
  "checks_total": 14,
  "percent": 57,
  "top3": ["Task A", "Task B", "Task C"]
}
```

## 3. Tasker (Nothing Phone)

1. Nuovo profilo: **Time** ogni 15–30 min (o all'apertura schermata home)
2. Task: **HTTP Request**
   - Method: GET
   - URL: quello sopra
3. Salva variabili da JSON: `%http_data` → parse con AutoTools o JavaScriptlet
4. Passa a **KWGT** con Kustom action: variabili `checks_done`, `checks_total`, `percent`, `top3`

## 4. KWGT (stile Nothing)

- Font dot-matrix / monospace
- Bianco, nero, rosso `#d1181e`
- Mostra `percent` grande + barra check + 3 righe task da `top3`

## Note

- Il secret va solo in Tasker, non nel sito web
- La function usa service role lato server, legge check_logs e tasks del giorno
- Se cambi progetto Supabase, aggiorna URL e rifai deploy
