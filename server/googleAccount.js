// Regras de vinculo entre uma conta Festou e uma conta Google.
//
// O claim "sub" do Google e o identificador imutavel da conta Google. Guardamos
// esse valor em perfis.google_sub e so criamos sessao quando ele confere.
//
// Conta existente com google_sub NULL significa que a conta foi criada com
// senha (ou antes desta coluna existir). Nesse caso NAO vinculamos automatico:
// um atacante poderia cadastrar o e-mail da vitima com uma senha e depois
// esperar que ela entrasse com Google, herdando qualquer dado que ela criasse.
// A pessoa precisa entrar com senha (ou redefinir) antes de usar o Google.
export function resolveGoogleLogin(existingProfile, googleSub) {
  if (!googleSub) return 'invalid'

  if (!existingProfile) return 'create'
  if (!existingProfile.google_sub) return 'link_required'
  if (existingProfile.google_sub === googleSub) return 'login'

  return 'conflict'
}
