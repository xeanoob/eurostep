const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://awdzwzetgqwevvqnmhvl.supabase.co', 'sb_publishable_Ve2VmYkr6ESfCyfDYoo2SA__Fs2Gyfr');

supabase.auth.signInWithPassword({email: 'boutrinambroise@gmail.com', password: 'password123'}).then(r => {
  const cookie = `sb-awdzwzetgqwevvqnmhvl-auth-token=${JSON.stringify([r.data.session.access_token, r.data.session.refresh_token, null, null, null])}`;
  fetch('http://localhost:3000/api/matches/sync', {method: 'POST', headers: { Cookie: cookie }})
    .then(res => res.text())
    .then(t => console.log('Response:', t));
});
