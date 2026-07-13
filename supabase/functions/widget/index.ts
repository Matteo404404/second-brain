// deploy: supabase functions deploy widget --no-verify-jwt
// secrets: WIDGET_SECRET, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.0'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: cors })
  }

  const url = new URL(req.url)
  const secret = url.searchParams.get('key')
  if (!secret || secret !== Deno.env.get('WIDGET_SECRET')) {
    return new Response(JSON.stringify({ error: 'unauthorized' }), {
      status: 401,
      headers: { ...cors, 'Content-Type': 'application/json' },
    })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  )

  const today = new Date().toISOString().slice(0, 10)

  const { data: logs } = await supabase
    .from('check_logs')
    .select('done')
    .eq('log_date', today)

  const checksTotal = logs?.length ?? 0
  const checksDone = logs?.filter((l) => l.done).length ?? 0
  const percent = checksTotal ? Math.round((checksDone / checksTotal) * 100) : 0

  const { data: tasks } = await supabase
    .from('tasks')
    .select('title')
    .eq('done', false)
    .in('priority', ['top', 'next'])
    .order('priority')
    .order('due_date', { nullsFirst: false })
    .limit(3)

  const body = {
    checks_done: checksDone,
    checks_total: checksTotal,
    percent,
    top3: (tasks ?? []).map((t) => t.title),
  }

  return new Response(JSON.stringify(body), {
    headers: { ...cors, 'Content-Type': 'application/json' },
  })
})
