export const orderStatusStyles = {
  solicitado: 'bg-festou-yellow/20 text-festou-accent border border-festou-yellow/40',
  em_negociacao: 'bg-festou-secondary/12 text-festou-secondary border border-festou-secondary/30',
  confirmado: 'bg-emerald-100 text-emerald-900 border border-emerald-200',
  concluido: 'bg-festou-cyan/15 text-festou-turquoise border border-festou-cyan/30',
  recusado: 'bg-rose-100 text-rose-900 border border-rose-200',
  cancelado: 'bg-slate-100 text-slate-700 border border-slate-200',
}

const orderStatusLabels = {
  customer: {
    solicitado: 'Aguardando fornecedor',
    em_negociacao: 'Em negociação',
    confirmado: 'Confirmado',
    recusado: 'Recusado',
    cancelado: 'Cancelado',
    concluido: 'Concluído',
  },
  supplier: {
    solicitado: 'Novo orçamento',
    em_negociacao: 'Em negociação',
    confirmado: 'Confirmado',
    recusado: 'Recusado',
    cancelado: 'Cancelado pelo cliente',
    concluido: 'Concluído',
  },
}

export function orderStatusLabel(status, perspective = 'customer') {
  const labels = orderStatusLabels[perspective] ?? orderStatusLabels.customer

  return labels[status] ?? status
}

export function orderStatusStyle(status) {
  return orderStatusStyles[status] ?? 'bg-slate-100 text-slate-700 border border-slate-200'
}
