export const invitationThemes = {
  jardim: {
    kind: 'jardim',
    label: '🌸 Jardim Encantado',
    bg: 'invitation-bg-garden text-slate-900',
    card: 'invitation-theme-card--garden',
    tag: 'border border-emerald-200 bg-white/85 text-emerald-800',
    eyebrow: 'Um dia para florescer em alegria',
  },
  colorido: {
    kind: 'colorido',
    label: '🎨 Colorido & Vibrante',
    bg: 'bg-festou-night text-white',
    card: 'invitation-theme-card--colorido',
    tag: 'border border-white/40 bg-white/15 text-white',
    eyebrow: 'Prepare-se para uma festa inesquecível',
  },
  'ceu-estrelado': {
    kind: 'ceu-estrelado',
    label: '✨ Céu Estrelado',
    bg: 'invitation-bg-sky text-white',
    card: 'invitation-theme-card--ceu',
    tag: 'border border-cyan-200/40 bg-indigo-950/50 text-cyan-100',
    eyebrow: 'Uma noite especial está para começar',
  },
}

export function getInvitationTheme(theme) {
  return invitationThemes[theme] || invitationThemes.jardim
}
