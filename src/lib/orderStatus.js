export const orderStatusStyles = {
  solicitado: 'bg-slate-100 text-slate-700 border border-slate-200',
  em_negociacao: 'bg-festou-yellow/25 text-festou-accent border border-festou-yellow/50',
  negocio_fechado: 'bg-emerald-100 text-emerald-900 border border-emerald-200',
  servico_concluido: 'bg-festou-cyan/15 text-festou-turquoise border border-festou-cyan/30',
  recusado: 'bg-rose-100 text-rose-900 border border-rose-200',
  cancelado: 'bg-slate-100 text-slate-700 border border-slate-200',
}

const orderStatusLabels = {
  customer: {
    solicitado: 'Pendente',
    em_negociacao: 'Em negociação',
    negocio_fechado: 'Negócio fechado',
    recusado: 'Recusado',
    cancelado: 'Cancelado',
    servico_concluido: 'Serviço concluído',
  },
  supplier: {
    solicitado: 'Pendente',
    em_negociacao: 'Em negociação',
    negocio_fechado: 'Negócio fechado',
    recusado: 'Recusado',
    cancelado: 'Cancelado pelo cliente',
    servico_concluido: 'Serviço concluído',
  },
}

export function orderStatusLabel(status, perspective = 'customer') {
  const labels = orderStatusLabels[perspective] ?? orderStatusLabels.customer

  return labels[status] ?? status
}

export function orderStatusStyle(status) {
  return orderStatusStyles[status] ?? 'bg-slate-100 text-slate-700 border border-slate-200'
}
